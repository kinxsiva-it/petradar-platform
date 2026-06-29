import { z } from 'zod';

const envSchema = z.object({
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  API_PREFIX: z.string().min(1).default('api/v1'),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  LOCATION_OBFUSCATION_SECRET: z.string().min(32),
  LOCATION_PRIVACY_RADIUS_METERS: z.coerce.number().int().min(100).max(2000).default(300),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_STORAGE_BUCKET: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  WEB_ORIGIN: z.string().url().default('http://localhost:4200'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
  }

  return parsed.data;
}
