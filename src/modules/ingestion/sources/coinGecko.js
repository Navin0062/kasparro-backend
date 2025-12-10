const axios = require('axios');
const { z } = require('zod');

const CoinGeckoSchema = z.object({
    id: z.string(),
    symbol: z.string(),
    name: z.string(),
    current_price: z.number(),
    market_cap: z.number(),
    total_volume: z.number()
});

class CoinGeckoAdapter {
    constructor() {
        this.sourceName = 'COINGECKO';
        this.apiUrl = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false';
        this.maxRetries = 3;
    }

    /**
     * Sleep utility for backoff
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * P2.3: Fetch with Exponential Backoff
     */
    async fetchRaw() {
        let attempts = 0;
        
        while (attempts < this.maxRetries) {
            try {
                console.log(`[${this.sourceName}] Fetching data (Attempt ${attempts + 1})...`);
                const response = await axios.get(this.apiUrl);
                return response.data;
            } catch (error) {
                attempts++;
                
                // If it's the last attempt, throw the error
                if (attempts >= this.maxRetries) {
                    console.error(`[${this.sourceName}] Max retries reached.`);
                    // Return empty to avoid crashing the whole pipeline
                    return []; 
                }

                // Calculate wait time: 2^attempts * 1000ms (2s, 4s, 8s)
                const waitTime = Math.pow(2, attempts) * 1000;
                console.warn(`[${this.sourceName}] Failed (${error.message}). Retrying in ${waitTime/1000}s...`);
                await this.sleep(waitTime);
            }
        }
    }

    normalize(rawData) {
        if (!Array.isArray(rawData)) return []; // Safety check
        
        return rawData.map((item) => {
            const parseResult = CoinGeckoSchema.safeParse(item);
            if (!parseResult.success) {
                return null;
            }
            return {
                symbol: item.symbol.toUpperCase(),
                name: item.name,
                priceUsd: item.current_price,
                marketCapUsd: item.market_cap,
                volume24h: item.total_volume,
                source: this.sourceName,
                ingestedAt: new Date()
            };
        }).filter(Boolean);
    }
}

module.exports = new CoinGeckoAdapter();