import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  SENDBLUE_API_KEY: z.string().min(1),
  SENDBLUE_API_SECRET: z.string().min(1),
  SENDBLUE_FROM_NUMBER: z.string().regex(/^\+1\d{10}$/, 'Must be E.164 format'),
  SENDBLUE_WEBHOOK_SECRET: z.string().optional(),

  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-'),

  APP_URL: z.string().url(),
  DEFAULT_TIMEZONE: z.string().default('America/New_York'),
});

function loadConfig() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Invalid environment variables:');
    console.error(result.error.format());
    process.exit(1);
  }

  return result.data;
}

export const config = loadConfig();

export type Config = z.infer<typeof envSchema>;
