const request = require('supertest');
const express = require('express');
const requestTiming = require('../src/middleware/timing');

describe('Request Timing Middleware', () => {
    let app;
    
    beforeEach(() => {
        app = express();
        app.use(requestTiming);
        app.get('/test', (req, res) => {
            res.json({ message: 'test' });
        });
    });
    
    it('should add X-Response-Time header', async () => {
        const response = await request(app).get('/test');
        
        expect(response.headers['x-response-time']).toBeDefined();
        expect(response.headers['x-response-time']).toMatch(/\d+ms/);
    });
    
    it('should provide timing information', async () => {
        const response = await request(app).get('/test');
        const timing = response.headers['x-response-time'];
        const ms = parseInt(timing.replace('ms', ''));
        
        expect(ms).toBeGreaterThan(0);
        expect(ms).toBeLessThan(1000); // Should be fast
    });
});
