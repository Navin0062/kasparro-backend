// tests/etl.test.js
const coinPaprika = require('../src/modules/ingestion/sources/coinPaprika');

describe('ETL Logic: CoinPaprika', () => {
    
    test('should normalize raw API data correctly', () => {
        // 1. Mock Raw Data (What the API usually sends)
        const mockRawData = [
            {
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
            }
        ];

        // 2. Run the normalize function
        const result = coinPaprika.normalize(mockRawData);

        // 3. Verify the Output (Unified Schema)
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
            symbol: "BTC",
            name: "Bitcoin",
            priceUsd: 50000,
            source: "COINPAPRIKA"
        });
    });

    test('should skip invalid data', () => {
        const badData = [{ id: "bad-coin", symbol: "BAD" }]; // Missing quotes
        const result = coinPaprika.normalize(badData);
        expect(result).toHaveLength(0);
    });
});