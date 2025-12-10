const express = require('express');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron'); 
const { runPipeline } = require('./modules/ingestion/pipeline'); 

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;


// --- MANDATORY: Scheduled ETL Job (Every 5 minutes) ---
// Cron syntax: "*/5 * * * *" means "Every 5th minute"
cron.schedule('*/5 * * * *', async () => {
    console.log('[CRON] Starting scheduled ETL pipeline...');
    try {
        await runPipeline();
        console.log('[CRON] Pipeline finished successfully.');
    } catch (error) {
        console.error('[CRON] Pipeline failed:', error);
    }
});

// --- P2.3: Rate Limiting Middleware ---
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per windowMs
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { error: "Too many requests, please try again later." }
});

// Apply to all requests
app.use(limiter);

app.use(express.json());

// P0.2: Health Check
app.get('/health', async (req, res) => {
    let dbStatus = 'DISCONNECTED';
    try {
        await prisma.$queryRaw`SELECT 1`;
        dbStatus = 'CONNECTED';
    } catch (error) {
        dbStatus = 'ERROR: ' + error.message;
    }
    res.json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        db_connectivity: dbStatus
    });
});

// P0.2: Data Access
app.get('/data', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const symbol = req.query.symbol;
        const skip = (page - 1) * limit;
        const where = symbol ? { symbol: symbol.toUpperCase() } : {};

        const data = await prisma.cryptoMarketData.findMany({
            where: where,
            skip: skip,
            take: limit,
            orderBy: { ingestedAt: 'desc' }
        });

        res.json({
            request_id: crypto.randomUUID(),
            data: data,
            pagination: { page, limit }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- NEW REQUIREMENT P1.3: ETL Statistics ---
app.get('/stats', async (req, res) => {
    try {
        // 1. Get total counts
        const totalRuns = await prisma.etlJob.count();
        const successfulRuns = await prisma.etlJob.count({ where: { status: 'SUCCESS' } });
        const failedRuns = await prisma.etlJob.count({ where: { status: 'FAILED' } });

        // 2. Get last success timestamp
        const lastSuccess = await prisma.etlJob.findFirst({
            where: { status: 'SUCCESS' },
            orderBy: { startTime: 'desc' }
        });

        // 3. Get recent run history (Run metadata) [cite: 65]
        const recentRuns = await prisma.etlJob.findMany({
            take: 5,
            orderBy: { startTime: 'desc' }
        });

        res.json({
            summary: {
                total_runs: totalRuns,
                success_rate: totalRuns > 0 ? `${((successfulRuns / totalRuns) * 100).toFixed(1)}%` : '0%',
                last_successful_run: lastSuccess ? lastSuccess.startTime : null
            },
            recent_runs: recentRuns.map(run => ({
                source: run.source,
                status: run.status,
                records_processed: run.recordsProcessed, // [cite: 62]
                duration_ms: run.endTime ? (new Date(run.endTime) - new Date(run.startTime)) : null, // [cite: 63]
                started_at: run.startTime
            }))
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});