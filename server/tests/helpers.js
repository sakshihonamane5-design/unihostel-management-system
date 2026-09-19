import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { seedSpit } from '../src/seed/index.js';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-value-with-32-plus-chars!!';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.COOKIE_NAME = 'unihostel_token';
process.env.COOKIE_SECURE = 'false';
process.env.SEED_ADMIN_PASSWORD = 'ChangeMe_Admin_123!';
process.env.SEED_SECURITY_PASSWORD = 'ChangeMe_Gate_123!';
process.env.SEED_MENTOR_PASSWORD = 'ChangeMe_Mentor_123!';
process.env.SEED_STUDENT_PASSWORD = 'ChangeMe_Student_123!';

export const TEST_ENV = {
  NODE_ENV: 'test',
  PORT: 5000,
  CLIENT_ORIGIN: 'http://localhost:5173',
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: '8h',
  COOKIE_NAME: 'unihostel_token',
  COOKIE_SECURE: false,
  PASSWORD_RESET_MINUTES: 60,
  SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD,
  SEED_SECURITY_PASSWORD: process.env.SEED_SECURITY_PASSWORD,
  SEED_MENTOR_PASSWORD: process.env.SEED_MENTOR_PASSWORD,
  SEED_STUDENT_PASSWORD: process.env.SEED_STUDENT_PASSWORD,
};

let mongo;

export async function startTestApp() {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await seedSpit(TEST_ENV);
  const app = createApp(TEST_ENV);
  return { app, request: request(app) };
}

export async function stopTestApp() {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
}

export function cookieFrom(res) {
  const raw = res.headers['set-cookie'];
  if (!raw) return '';
  return raw.map((c) => c.split(';')[0]).join('; ');
}

export async function loginAs(api, email, password = TEST_ENV.SEED_STUDENT_PASSWORD) {
  const res = await api.post('/api/auth/login').send({
    email,
    password,
    institutionCode: 'SPIT',
  });
  return { res, cookie: cookieFrom(res) };
}
