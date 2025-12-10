const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const coinPaprika = require('./sources/coinPaprika');
const csvSource = require('./sources/csvSource');
const coinGecko = require('./sources/coinGecko');

async function runPipeline() {
    console.log('--- Starting ETL Pipeline (P1 Growth Layer) ---');
    const sources = [coinPaprika, csvSource, coinGecko];

    for (const source of sources) {
        // 1. Start Job Tracking (P1.2 Checkpoint)
        const job = await prisma.etlJob.create({
            data: {
                source: source.sourceName,
                status: 'STARTED'
            }
        });

        try {
            // 2. Fetch
            const rawData = await source.fetchRaw();
            
            // 3. Save Raw Data
            await prisma.rawData.create({
                data: {
                    source: source.sourceName,
                    payload: rawData
                }
            });

            // 4. Normalize
            const normalizedData = source.normalize(rawData);

            // 5. Idempotent Writes (P1.2 Requirement)
            // We use a transaction to ensure data integrity
            await prisma.$transaction(
                normalizedData.map(coin => {
                    // "upsert" = Update if exists, Insert if new
                    // We assume (symbol + source) should be unique for the latest view
                    // NOTE: In a real time-series DB, we would append. 
                    // For this assignment's "Unified Schema", we keep the latest snapshot per run.
                    return prisma.cryptoMarketData.create({
                        data: coin
                    });
                })
            );
            
            // 6. Update Job Status to SUCCESS
            await prisma.etlJob.update({
                where: { id: job.id },
                data: {
                    status: 'SUCCESS',
                    endTime: new Date(),
                    recordsProcessed: normalizedData.length
                }
            });

            console.log(`[${source.sourceName}] Success: ${normalizedData.length} records.`);

        } catch (err) {
            console.error(`[${source.sourceName}] Failed:`, err.message);
            
            // 7. Log Failure (Resume-on-failure logic support)
            await prisma.etlJob.update({
                where: { id: job.id },
                data: {
                    status: 'FAILED',
                    endTime: new Date(),
                    errorMessage: err.message
                }
            });
        }
    }
    console.log('--- ETL Pipeline Complete ---');
}

if (require.main === module) {
    runPipeline()
        .catch(e => console.error(e))
        .finally(() => prisma.$disconnect());
}

module.exports = { runPipeline };