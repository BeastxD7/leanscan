/**
 * Auth endpoints — signup, login, refresh, logout, forgot-password, reset-password.
 * All routes are public; rate-limited at the router level.
 *
 * Response shape: { data: ..., error: null } on success, { data: null, error: ... } on failure.
 * Errors thrown as HttpError bubble to middleware/errorHandler.ts.
 */
import { Router, type Request } from 'express';
import { z } from 'zod';
import { randomBytes } from 'node:crypto';

import { prisma } from '../db.js';
import { hashPassword, verifyPassword } from '../auth/passwords.js';
import {
  signAccessToken,
  generateRefreshToken,
  hashToken,
  refreshTokenLifetimeMs,
  type UserRole,
} from '../auth/tokens.js';
import { sendEmail, passwordResetEmailTemplate, welcomeEmailTemplate } from '../services/email.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { apiSuccess } from '../lib/response.js';
import { serializeUser } from '../lib/serializeUser.js';
import { config } from '../config.js';
import { logger } from '../lib/logger.js';

export const authRouter = Router();
authRouter.use(authLimiter);

// =============================================================
// Schemas
// =============================================================
const emailSchema = z.string().trim().toLowerCase().email().max(254);
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters').max(128);

const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters.')
    .max(30, 'Username must be 30 characters or fewer.')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscore, and dash.')
    .transform((s) => s.toLowerCase())
    .optional(),
  first_name: z.string().min(1).max(60).optional(),
  last_name: z.string().min(1).max(60).optional(),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date_of_birth must be YYYY-MM-DD')
    .refine((s) => {
      const d = new Date(s);
      const now = new Date();
      const minAge = new Date(now.getFullYear() - 13, now.getMonth(), now.getDate());
      const maxAge = new Date(now.getFullYear() - 120, now.getMonth(), now.getDate());
      return !isNaN(d.getTime()) && d <= minAge && d >= maxAge;
    }, 'Enter a real birth date (must be 13+ years old).')
    .optional(),
  sex: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

const refreshSchema = z.object({
  refresh_token: z.string().min(40).max(200),
});

const forgotSchema = z.object({
  email: emailSchema,
});

const resetSchema = z.object({
  token: z.string().min(40).max(200),
  new_password: passwordSchema,
});

// =============================================================
// Helper — issue tokens after successful auth
// =============================================================
interface IssueTokensResult {
  access_token: string;
  refresh_token: string;
  expires_in_seconds: number;
}

async function issueTokensFor(opts: {
  userId: string;
  role: UserRole;
  req: Request;
}): Promise<IssueTokensResult> {
  const accessToken = signAccessToken({ sub: opts.userId, role: opts.role });
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + refreshTokenLifetimeMs);

  await prisma.authSession.create({
    data: {
      userId: opts.userId,
      refreshTokenHash,
      expiresAt,
      userAgent: opts.req.get('user-agent') ?? null,
      ipAddress: opts.req.ip ?? null,
    },
  });

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    // Approximate — client side just uses this as a hint for proactive refresh.
    expires_in_seconds: 15 * 60,
  };
}

// =============================================================
// POST /auth/signup
// =============================================================
authRouter.post(
  '/signup',
  asyncHandler(async (req, res) => {
    const input = signupSchema.parse(req.body);
    const { email, password } = input;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new HttpError(409, 'email_in_use', 'An account with this email already exists');
    }

    // Check username uniqueness up front to give a clean error
    if (input.username) {
      const taken = await prisma.user.findUnique({ where: { username: input.username } });
      if (taken) {
        throw new HttpError(409, 'username_taken', 'That username is already taken.');
      }
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email,
          passwordHash,
          creditBalance: config.CREDITS_INITIAL_GRANT,
          ...(input.username ? { username: input.username } : {}),
          ...(input.first_name ? { firstName: input.first_name } : {}),
          ...(input.last_name ? { lastName: input.last_name } : {}),
          ...(input.date_of_birth ? { dateOfBirth: new Date(input.date_of_birth) } : {}),
          ...(input.sex ? { sex: input.sex } : {}),
        },
      });
      await tx.creditLedger.create({
        data: {
          userId: u.id,
          delta: config.CREDITS_INITIAL_GRANT,
          balanceAfter: u.creditBalance,
          reason: 'initial_grant',
        },
      });
      return u;
    });

    const tokens = await issueTokensFor({ userId: user.id, role: user.role, req });

    // Welcome email — fire and forget (don't fail signup if email is down)
    sendEmail({ to: email, ...welcomeEmailTemplate({ email }) }).catch((err) => {
      logger.warn({ err, userId: user.id }, 'welcome email failed (non-fatal)');
    });

    res.status(201).json(
      apiSuccess('Account created. Welcome to LeanScan.', {
        user: serializeUser(user),
        ...tokens,
      }),
    );
  }),
);

// =============================================================
// POST /auth/login
// =============================================================
authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    // Constant-time-ish: always bcrypt-compare even if user not found,
    // to reduce timing leakage of valid emails.
    const passwordHash = user?.passwordHash ?? '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidi';
    const passwordOk = await verifyPassword(password, passwordHash);

    if (!user || !passwordOk) {
      throw new HttpError(401, 'invalid_credentials', 'Email or password is incorrect');
    }
    if (user.status !== 'active') {
      throw new HttpError(403, 'account_suspended', 'This account is suspended');
    }

    const tokens = await issueTokensFor({ userId: user.id, role: user.role, req });

    res.json(
      apiSuccess('Signed in.', {
        user: serializeUser(user),
        ...tokens,
      }),
    );
  }),
);

// =============================================================
// POST /auth/refresh
// =============================================================
authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const { refresh_token } = refreshSchema.parse(req.body);
    const refreshTokenHash = hashToken(refresh_token);

    const session = await prisma.authSession.findUnique({
      where: { refreshTokenHash },
      include: { user: true },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new HttpError(401, 'invalid_refresh_token', 'Refresh token invalid or expired');
    }
    if (session.user.status !== 'active') {
      throw new HttpError(403, 'account_suspended', 'Account suspended');
    }

    await prisma.authSession.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() },
    });

    const accessToken = signAccessToken({
      sub: session.userId,
      role: session.user.role,
    });

    res.json(
      apiSuccess('Token refreshed.', {
        access_token: accessToken,
        expires_in_seconds: 15 * 60,
      }),
    );
  }),
);

// =============================================================
// POST /auth/logout
// =============================================================
authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const { refresh_token } = refreshSchema.parse(req.body);
    const refreshTokenHash = hashToken(refresh_token);

    await prisma.authSession.updateMany({
      where: { refreshTokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    res.json(apiSuccess('Signed out.'));
  }),
);

// =============================================================
// POST /auth/forgot-password
// Always returns 200 regardless of whether email exists, so we don't leak
// which emails are registered.
// =============================================================
authRouter.post(
  '/forgot-password',
  asyncHandler(async (req, res) => {
    const { email } = forgotSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });

    if (user && user.status === 'active') {
      const rawToken = randomBytes(32).toString('hex');
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordResetToken.create({
        data: { tokenHash, userId: user.id, expiresAt },
      });

      // Deep link into the app (mobile) — Phase 7 will swap to a web reset page
      const resetUrl = `leanscan://reset-password?token=${rawToken}`;

      try {
        await sendEmail({
          to: email,
          ...passwordResetEmailTemplate({ resetUrl, expiresInMinutes: 60 }),
        });
      } catch (err) {
        logger.error({ err, userId: user.id }, 'failed to send password reset email');
        // Still return 200 — don't reveal email delivery state
      }
    }

    res.json(
      apiSuccess('If that email is registered, a reset link is on the way.'),
    );
  }),
);

// =============================================================
// POST /auth/reset-password
// =============================================================
authRouter.post(
  '/reset-password',
  asyncHandler(async (req, res) => {
    const { token, new_password } = resetSchema.parse(req.body);
    const tokenHash = hashToken(token);

    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new HttpError(400, 'invalid_reset_token', 'Reset token is invalid or expired');
    }

    const passwordHash = await hashPassword(new_password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { tokenHash },
        data: { usedAt: new Date() },
      }),
      // Revoke every existing refresh session — force re-login everywhere.
      prisma.authSession.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    res.json(apiSuccess('Password updated. Sign in with your new password.'));
  }),
);

// =============================================================
// GET /auth/me — authenticated identity check
// Useful for the mobile app to verify a stored access token is still valid.
// =============================================================
authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      omit: { passwordHash: true },
    });
    if (!user) {
      throw new HttpError(404, 'user_not_found', 'User not found.');
    }
    res.json(apiSuccess('OK', serializeUser(user)));
  }),
);
