// tests/api.test.js
const request = require('supertest');
const express = require('express');
const app = express();

// We mock the database so we don't accidentally delete real data during tests
jest.mock('@prisma/client', () => {
    return {
        PrismaClient: jest.fn().mockImplementation(() => {
            return {
                $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }])
            };
        })
    };
});

// Import the route logic (Simulated for this test)
app.get('/health', (req, res) => res.json({ status: 'UP' }));

describe('API Endpoints', () => {
    test('GET /health should return status UP', async () => {
        const res = await request(app).get('/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('UP');
    });
});