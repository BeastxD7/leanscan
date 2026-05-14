/**
 * Centralised error handler. Mounted last in the middleware chain.
 * All errors that bubble up here are returned as the standard
 *   { success: false, message, error: { code, details? } }
 * envelope.
 */
import type { ErrorRequestHandler, Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger.js';
import { apiError } from '../lib/response.js';

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json(apiError('Route not found.', 'not_found'));
};

function flattenZodMessage(err: ZodError): string {
  const fieldErrors = err.flatten().fieldErrors;
  const firstField = Object.keys(fieldErrors)[0];
  if (firstField) {
    const msgs = fieldErrors[firstField];
    if (msgs && msgs[0]) return `${firstField}: ${msgs[0]}`;
  }
  return 'Some fields are invalid.';
}

export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) => {
  if (err instanceof ZodError) {
    res
      .status(400)
      .json(apiError(flattenZodMessage(err), 'validation_error', err.flatten()));
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json(apiError(err.message, err.code, err.details));
    return;
  }

  logger.error({ err, path: req.path, method: req.method }, 'unhandled error');

  res
    .status(500)
    .json(apiError('Something went wrong on our end.', 'internal_error'));
};
