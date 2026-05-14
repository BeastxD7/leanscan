/**
 * Centralised env loading and validation.
 * Fails fast at startup if anything required is missing.
 */
import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  DATABASE_URL: z.string().url().or(z.string().startsWith('postgres://').or(z.string().startsWith('postgresql://'))),
  DIRECT_URL: z.string().optional(),

  UPLOADS_DIR: z.string().default('/app/uploads'),
  UPLOADS_MAX_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  BCRYPT_COST: z.coerce.number().int().min(10).max(15).default(12),

  // -------- AI provider selection --------
  AI_PROVIDER: z.enum(['gemini', 'openai', 'azure-openai', 'bedrock']).default('gemini'),

  // -------- Gemini --------
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),

  // -------- OpenAI (vanilla) --------
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().default('https://api.openai.com/v1'),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),

  // -------- Azure OpenAI --------
  AZURE_OPENAI_ENDPOINT: z.string().optional(),
  AZURE_OPENAI_API_KEY: z.string().optional(),
  AZURE_OPENAI_DEPLOYMENT: z.string().optional(),
  AZURE_OPENAI_API_VERSION: z.string().default('2024-08-01-preview'),

  // -------- AWS Bedrock --------
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_SESSION_TOKEN: z.string().optional(),
  BEDROCK_MODEL_ID: z.string().default('anthropic.claude-3-5-sonnet-20241022-v2:0'),

  // -------- Email --------
  GMAIL_USER: z.string().email(),
  GMAIL_APP_PASSWORD: z.string().min(16),
  EMAIL_FROM_NAME: z.string().default('LeanScan'),

  // -------- Admin bootstrap --------
  ADMIN_BOOTSTRAP_EMAIL: z.string().email(),
  ADMIN_BOOTSTRAP_PASSWORD: z.string().min(8),

  // -------- CORS --------
  CORS_ORIGINS: z.string().default('http://localhost:8081,http://localhost:19006'),

  // -------- Credit system --------
  CREDITS_INITIAL_GRANT: z.coerce.number().int().nonnegative().default(100),
  CREDITS_ONBOARDING_BONUS: z.coerce.number().int().nonnegative().default(20),
  CREDITS_DAILY_REFILL: z.coerce.number().int().nonnegative().default(10),
  CREDITS_REFILL_CAP: z.coerce.number().int().positive().default(50),
});

function loadConfig() {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.format());
    process.exit(1);
  }
  // Provider-specific sanity at boot: warn if the chosen provider's keys aren't set.
  const cfg = parsed.data;
  const warnIf = (cond: boolean, msg: string) => {
    if (cond) console.warn(`⚠️  ${msg}`);
  };
  if (cfg.AI_PROVIDER === 'gemini') warnIf(!cfg.GEMINI_API_KEY, 'AI_PROVIDER=gemini but GEMINI_API_KEY is empty');
  if (cfg.AI_PROVIDER === 'openai') warnIf(!cfg.OPENAI_API_KEY, 'AI_PROVIDER=openai but OPENAI_API_KEY is empty');
  if (cfg.AI_PROVIDER === 'azure-openai') {
    warnIf(!cfg.AZURE_OPENAI_API_KEY, 'AI_PROVIDER=azure-openai but AZURE_OPENAI_API_KEY is empty');
    warnIf(!cfg.AZURE_OPENAI_ENDPOINT, 'AI_PROVIDER=azure-openai but AZURE_OPENAI_ENDPOINT is empty');
    warnIf(!cfg.AZURE_OPENAI_DEPLOYMENT, 'AI_PROVIDER=azure-openai but AZURE_OPENAI_DEPLOYMENT is empty');
  }
  if (cfg.AI_PROVIDER === 'bedrock') {
    warnIf(!cfg.AWS_ACCESS_KEY_ID, 'AI_PROVIDER=bedrock but AWS_ACCESS_KEY_ID is empty (will fall back to default chain)');
  }
  return cfg;
}

export const config = loadConfig();
export type Config = z.infer<typeof schema>;

export const isProd = config.NODE_ENV === 'production';
export const isDev = config.NODE_ENV === 'development';
export const isTest = config.NODE_ENV === 'test';

export const corsOrigins = config.CORS_ORIGINS.split(',').map((s) => s.trim());
