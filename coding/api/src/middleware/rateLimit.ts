/**
 * Rate limiters.
 * All responses use the standard { success: false, message, error } envelope
 * so the mobile client can surface them as toasts.
 *
 * authLimiter:    in dev 200/15min (forgiving during iteration), in prod 10/15min
 *                 (brute-force + email enumeration protection).
 * scanLimiter:    10 photo scans per minute per IP — protects Gemini quota.
 * generalLimiter: 60 requests per minute per IP — sanity ceiling.
 */
import rateLimit, { type Options } from 'express-rate-limit';
import type { Request, Response } from 'express';
import { isProd } from '../config.js';
import { apiError } from '../lib/response.js';

function retryAfterMessage(humanLabel: string, res: Response): string {
  const reset = res.getHeader('RateLimit-Reset');
  if (typeof reset === 'string' || typeof reset === 'number') {
    const seconds = Number(reset);
    if (Number.isFinite(seconds) && seconds > 0) {
      if (seconds < 60) {
        return `${humanLabel} Try again in ${Math.ceil(seconds)} seconds.`;
      }
      const mins = Math.ceil(seconds / 60);
      return `${humanLabel} Try again in ${mins} minute${mins === 1 ? '' : 's'}.`;
    }
  }
  return `${humanLabel} Try again in a moment.`;
}

const standardOpts: Partial<Options> = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
};

export const authLimiter = rateLimit({
  ...standardOpts,
  windowMs: 15 * 60 * 1000,
  limit: isProd ? 10 : 200,
  handler: (_req: Request, res: Response) => {
    res
      .status(429)
      .json(
        apiError(
          retryAfterMessage('Too many sign-in / sign-up attempts.', res),
          'rate_limited',
        ),
      );
  },
});

export const scanLimiter = rateLimit({
  ...standardOpts,
  windowMs: 60 * 1000,
  limit: 10,
  handler: (_req: Request, res: Response) => {
    res
      .status(429)
      .json(
        apiError(
          retryAfterMessage("That's a lot of scans.", res),
          'rate_limited',
        ),
      );
  },
});

export const generalLimiter = rateLimit({
  ...standardOpts,
  windowMs: 60 * 1000,
  limit: isProd ? 60 : 300,
  handler: (_req: Request, res: Response) => {
    res
      .status(429)
      .json(
        apiError(
          retryAfterMessage("You're sending requests too fast.", res),
          'rate_limited',
        ),
      );
  },
});
