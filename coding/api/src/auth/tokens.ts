/**
 * JWT (access tokens) + opaque refresh tokens.
 *
 * Access tokens: short-lived (15m default), stateless, sent on every request.
 * Refresh tokens: long-lived (30d default), opaque random string, stored in
 *   auth_sessions with a sha256 hash so the raw token is never in the DB.
 */
import jwt, { type SignOptions, type Secret } from 'jsonwebtoken';
import { randomBytes, createHash } from 'node:crypto';
import { config } from '../config.js';

export type UserRole = 'user' | 'admin' | 'super_admin';

export interface AccessTokenClaims {
  sub: string;       // user_id
  role: UserRole;
  iat?: number;
  exp?: number;
}

export function signAccessToken(claims: { sub: string; role: UserRole }): string {
  const opts: SignOptions = { expiresIn: config.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(claims, config.JWT_SECRET as Secret, opts);
}

export function verifyAccessToken(token: string): AccessTokenClaims {
  return jwt.verify(token, config.JWT_SECRET as Secret) as AccessTokenClaims;
}

/** Generate a 256-bit random refresh token (hex-encoded). */
export function generateRefreshToken(): string {
  return randomBytes(32).toString('hex');
}

/** Hash a refresh token for safe DB storage. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Parse a duration string like "30d" into milliseconds. */
export function parseDurationMs(s: string): number {
  const m = s.match(/^(\d+)([smhdw])$/);
  if (!m) throw new Error(`Invalid duration: ${s}`);
  const n = Number(m[1]);
  const unit = m[2];
  const factor =
    unit === 's' ? 1000 :
    unit === 'm' ? 60_000 :
    unit === 'h' ? 3_600_000 :
    unit === 'd' ? 86_400_000 :
    /* w */         604_800_000;
  return n * factor;
}

export const refreshTokenLifetimeMs = parseDurationMs(config.JWT_REFRESH_EXPIRES_IN);
