/**
 * JWT auth middleware.
 *
 * Usage:
 *   router.get('/protected', requireAuth, handler);
 *   router.get('/admin-only', requireAuth, requireAdmin, handler);
 *
 * After requireAuth runs, req.userId and req.userRole are populated.
 */
import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, type UserRole } from '../auth/tokens.js';
import { HttpError } from './errorHandler.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: UserRole;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new HttpError(401, 'unauthorized', 'Missing or invalid Authorization header'));
  }
  const token = header.slice('Bearer '.length).trim();
  try {
    const claims = verifyAccessToken(token);
    req.userId = claims.sub;
    req.userRole = claims.role;
    next();
  } catch {
    next(new HttpError(401, 'invalid_token', 'Access token invalid or expired'));
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (req.userRole !== 'admin' && req.userRole !== 'super_admin') {
    return next(new HttpError(403, 'forbidden', 'Admin role required'));
  }
  next();
}

export function requireSuperAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (req.userRole !== 'super_admin') {
    return next(new HttpError(403, 'forbidden', 'Super-admin role required'));
  }
  next();
}
