/**
 * Wraps an async Express route handler so thrown errors / rejected promises
 * bubble to the central error handler in middleware/errorHandler.ts.
 *
 * Express 4 doesn't catch async exceptions natively — without this, an
 * unhandled rejection in a route would just hang the request.
 */
import type { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export const asyncHandler = (fn: AsyncHandler): RequestHandler => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
