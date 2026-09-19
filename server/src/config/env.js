import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../..');

export function loadEnv() {
  dotenv.config({ path: path.join(repoRoot, '.env') });
  dotenv.config({ path: path.join(repoRoot, 'server', '.env') });
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  MONGODB_URI: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  COOKIE_NAME: z.string().default('unihostel_token'),
  COOKIE_SECURE: z
    .union([z.boolean(), z.string()])
    .transform((value) => value === true || value === 'true')
    .default(false),
  PASSWORD_RESET_MINUTES: z.coerce.number().int().positive().default(60),
  SEED_ADMIN_PASSWORD: z.string().optional(),
  SEED_SECURITY_PASSWORD: z.string().optional(),
  SEED_MENTOR_PASSWORD: z.string().optional(),
  SEED_STUDENT_PASSWORD: z.string().optional(),
});

export function getEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }
  return parsed.data;
}

export function requireMongoUri(env) {
  if (!env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required to start the API server');
  }
  return env.MONGODB_URI;
}
