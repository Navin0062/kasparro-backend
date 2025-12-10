const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

class CsvAdapter {
    constructor() {
        this.sourceName = 'CSV_IMPORT';
        this.filePath = path.join(__dirname, '../../../../data/historical_data.csv');
    }

    async fetchRaw() {
        console.log(`[${this.sourceName}] Reading CSV file...`);
        const results = [];
        
        return new Promise((resolve, reject) => {
            fs.createReadStream(this.filePath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', () => resolve(results))
                .on('error', (err) => reject(err));
        });
    }

    normalize(rawData) {
        return rawData.map((item) => {
            // Simple validation: Ensure price exists
            if (!item.price || !item.symbol) return null;

            return {
                symbol: item.symbol,
                name: item.name,
                priceUsd: parseFloat(item.price),
                marketCapUsd: parseFloat(item.market_cap),
                volume24h: parseFloat(item.vol_24),
                source: this.sourceName,
                ingestedAt: new Date() // In real life, parse item.date
            };
        }).filter(Boolean);
    }
}

module.exports = new CsvAdapter();