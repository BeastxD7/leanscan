/**
 * Password hashing using bcryptjs (pure JS, no native compile step).
 * Cost factor is configurable via BCRYPT_COST env var; default 12.
 *
 * bcryptjs is API-compatible with `bcrypt` and produces identical $2a$/$2b$
 * hashes — we can swap back to native `bcrypt` later for a small speedup
 * if hashing becomes a bottleneck (it won't at V1 scale).
 */
import bcrypt from 'bcryptjs';
import { config } from '../config.js';

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, config.BCRYPT_COST);
}

export function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}
