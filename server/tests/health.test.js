import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { TEST_ENV } from './helpers.js';

describe('health and environment', () => {
  it('returns service health without a database', async () => {
    const app = createApp(TEST_ENV);
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('unihostel-api');
  });

  it('serves OpenAPI documentation', async () => {
    const app = createApp(TEST_ENV);
    const res = await request(app).get('/api/docs.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
    expect(res.body.info.title).toBe('UniHostel API');
  });
});
