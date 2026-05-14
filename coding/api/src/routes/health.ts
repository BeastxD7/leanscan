import { Router, type Request, type Response } from 'express';
import { prisma } from '../db.js';
import { logger } from '../lib/logger.js';
import { apiSuccess, apiError } from '../lib/response.js';

export const healthRouter = Router();

/**
 * Liveness probe. Returns 200 even if downstream services are degraded.
 * For readiness (DB reachable), use /health/ready.
 */
healthRouter.get('/health', (_req: Request, res: Response) => {
  res.json(
    apiSuccess('API is alive.', {
      status: 'ok',
      uptime_s: Math.floor(process.uptime()),
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    }),
  );
});

healthRouter.get('/health/ready', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json(apiSuccess('API is ready.', { status: 'ready', database: 'ok' }));
  } catch (err) {
    logger.error({ err }, 'readiness probe failed');
    res.status(503).json(apiError('Database unreachable.', 'db_unavailable'));
  }
});
