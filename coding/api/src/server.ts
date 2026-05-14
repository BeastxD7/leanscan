/**
 * LeanScan API server entry point.
 * Phase 0 endpoints wired:
 *   - GET  /health, /health/ready
 *   - POST /v1/auth/{signup,login,refresh,logout,forgot-password,reset-password}
 *   - GET  /v1/auth/me
 *   - GET  /v1/profile
 *   - PATCH /v1/profile
 *   - POST /v1/onboarding/complete
 */
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { pinoHttp } from 'pino-http';

import { config, corsOrigins } from './config.js';
import { logger } from './lib/logger.js';
import { apiSuccess } from './lib/response.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimit.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { profileRouter, onboardingRouter } from './routes/profile.js';
import { mealsRouter } from './routes/meals.js';
import { shutdown as shutdownDb } from './db.js';

const app = express();

// trust proxy so req.ip resolves to the real client behind Caddy/load balancer
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// Request logging
app.use(pinoHttp({ logger }));

// CORS
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (corsOrigins.includes('*') || corsOrigins.includes(origin)) return cb(null, true);
      if (
        config.NODE_ENV === 'development' &&
        /^(exp:\/\/|http:\/\/(localhost|192\.168\.|10\.|172\.))/.test(origin)
      ) {
        return cb(null, true);
      }
      cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  }),
);

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Global low-bar rate limit (high ceiling, just sanity)
app.use(generalLimiter);

// =============================================================
// Routes
// =============================================================
app.use('/', healthRouter);

app.use('/v1/auth', authRouter);
app.use('/v1/profile', profileRouter);
app.use('/v1/onboarding', onboardingRouter);
app.use('/v1/meals', mealsRouter);

// v1 namespace placeholder for endpoints coming online phase by phase
app.get('/v1', (_req, res) => {
  res.json(
    apiSuccess('LeanScan API v1', {
      endpoints: {
        auth: [
          'POST /v1/auth/signup',
          'POST /v1/auth/login',
          'POST /v1/auth/refresh',
          'POST /v1/auth/logout',
          'POST /v1/auth/forgot-password',
          'POST /v1/auth/reset-password',
          'GET /v1/auth/me',
        ],
        profile: ['GET /v1/profile', 'PATCH /v1/profile'],
        onboarding: ['POST /v1/onboarding/complete'],
      },
    }),
  );
});

// 404 + error handler must be last
app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(config.PORT, () => {
  logger.info(
    { port: config.PORT, env: config.NODE_ENV },
    `🌿 LeanScan API listening on :${config.PORT}`,
  );
});

// Graceful shutdown
const shutdown = async (signal: string): Promise<void> => {
  logger.info({ signal }, 'shutting down');
  server.close(async () => {
    await shutdownDb();
    logger.info('clean shutdown complete');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('forced shutdown after timeout');
    process.exit(1);
  }, 10_000).unref();
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

export { app };
