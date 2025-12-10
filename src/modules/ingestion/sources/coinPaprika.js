const axios = require('axios');
const { z } = require('zod');
const { diff } = require('json-diff'); // <--- NEW IMPORT

// The GOLDEN SCHEMA (P2.1 Standard)
const GOLDEN_SCHEMA = {
    id: "btc-bitcoin",
    name: "Bitcoin",
    symbol: "BTC",
    quotes: {
        USD: {
            price: 50000,
            market_cap: 1000000000,
            volume_24h: 500000
        }
    }
};

// Validation Schema for normalization (used in the P0 layer)
const CoinPaprikaSchema = z.object({
    id: z.string(),
    name: z.string(),
    symbol: z.string(),
    quotes: z.object({
        USD: z.object({
            price: z.number(),
            market_cap: z.number(),
            volume_24h: z.number()
        })
    })
});

class CoinPaprikaAdapter {
    constructor() {
        this.sourceName = 'COINPAPRIKA';
        this.apiUrl = 'https://api.coinpaprika.com/v1/tickers';
    }

    async fetchRaw() {
        try {
            console.log(`[${this.sourceName}] Fetching data...`);
            const response = await axios.get(this.apiUrl); 
            const rawData = response.data.slice(0, 20);

            // P2.1 Schema Drift Detection
            this.detectSchemaDrift(rawData);

            return rawData;
        } catch (error) {
            console.error(`[${this.sourceName}] Error fetching:`, error.message);
            throw error;
        }
    }

    detectSchemaDrift(rawData) {
        if (!rawData || rawData.length === 0) return;

        // Use the first record as the basis for comparison
        const sampleRecord = rawData[0]; 
        
        // Remove volatile keys (like dynamic quotes) to only check structure
        const sanitizedSample = JSON.parse(JSON.stringify(sampleRecord, (key, value) => {
            if (key === 'volume_24h' || key === 'price' || key === 'market_cap') {
                return typeof value; // Only compare type, not value
            }
            return value;
        }));
        
        // Perform a deep difference check
        const differences = diff(this.sanitizeForDriftCheck(GOLDEN_SCHEMA), this.sanitizeForDriftCheck(sanitizedSample));

        if (differences) {
            console.warn(`[P2.1 SCHEMA DRIFT WARNING] ${this.sourceName} structure has changed!`);
            console.warn(`Differences:`, differences);
            // NOTE: In a real system, this would trigger an alert for an engineer.
        }
    }

    sanitizeForDriftCheck(data) {
        // Recursively replace numeric values with the string 'number' for comparison
        return JSON.parse(JSON.stringify(data, (key, value) => {
            if (typeof value === 'number') return 'number';
            return value;
        }));
    }

    normalize(rawData) {
        // ... (Normalization logic remains the same) ...
        return rawData.map((item) => {
            const parseResult = CoinPaprikaSchema.safeParse(item);
            if (!parseResult.success) return null;

            return {
                symbol: item.symbol,
                name: item.name,
                priceUsd: item.quotes.USD.price,
                marketCapUsd: item.quotes.USD.market_cap,
                volume24h: item.quotes.USD.volume_24h,
                source: this.sourceName,
                ingestedAt: new Date()
            };
        }).filter(Boolean);
    }
}

module.exports = new CoinPaprikaAdapter();