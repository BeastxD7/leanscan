/**
 * Atomic credit changes — balance update + ledger entry in one transaction.
 * Source of truth for who has how many credits and why.
 */
import { prisma } from '../db.js';
import { config } from '../config.js';
import type { Prisma } from '@prisma/client';
import { HttpError } from '../middleware/errorHandler.js';

export type CreditReason =
  | 'initial_grant'
  | 'daily_refill'
  | 'photo_scan'
  | 'admin_grant'
  | 'referral_bonus'
  | 'onboarding_bonus';

export interface GrantCreditsInput {
  userId: string;
  delta: number;
  reason: CreditReason;
  adminUserId?: string;
  notes?: string;
  tx?: Prisma.TransactionClient;
}

export async function grantCredits(input: GrantCreditsInput): Promise<number> {
  const op = async (client: Prisma.TransactionClient): Promise<number> => {
    const user = await client.user.update({
      where: { id: input.userId },
      data: { creditBalance: { increment: input.delta } },
      select: { creditBalance: true },
    });
    await client.creditLedger.create({
      data: {
        userId: input.userId,
        delta: input.delta,
        balanceAfter: user.creditBalance,
        reason: input.reason,
        adminUserId: input.adminUserId,
        notes: input.notes,
      },
    });
    return user.creditBalance;
  };

  if (input.tx) return op(input.tx);
  return prisma.$transaction(op);
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Lazy daily refill — if 24h+ since last refill, top up (capped at the dev limit).
 * Returns the user's current balance after potential refill.
 * Safe to call on every credit-gated request.
 */
export async function refillIfDue(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, creditBalance: true, creditLastRefilledAt: true },
  });
  if (!user) throw new HttpError(404, 'user_not_found', 'User not found.');

  const now = Date.now();
  const lastRefill = user.creditLastRefilledAt.getTime();
  const elapsed = now - lastRefill;

  if (elapsed < ONE_DAY_MS) return user.creditBalance;
  if (user.creditBalance >= config.CREDITS_REFILL_CAP) {
    // Push lastRefilledAt forward so we don't recompute on every request once at the cap.
    await prisma.user.update({
      where: { id: userId },
      data: { creditLastRefilledAt: new Date(now) },
    });
    return user.creditBalance;
  }

  const daysElapsed = Math.floor(elapsed / ONE_DAY_MS);
  const wantedAdd = daysElapsed * config.CREDITS_DAILY_REFILL;
  const newBalance = Math.min(user.creditBalance + wantedAdd, config.CREDITS_REFILL_CAP);
  const actualAdd = newBalance - user.creditBalance;
  if (actualAdd <= 0) return user.creditBalance;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: userId },
      data: {
        creditBalance: newBalance,
        creditLastRefilledAt: new Date(lastRefill + daysElapsed * ONE_DAY_MS),
      },
      select: { creditBalance: true },
    });
    await tx.creditLedger.create({
      data: {
        userId,
        delta: actualAdd,
        balanceAfter: updated.creditBalance,
        reason: 'daily_refill',
        notes: `lazy refill, ${daysElapsed} day(s) elapsed`,
      },
    });
    return updated.creditBalance;
  });
}

/**
 * Atomically debit credits.
 * Throws HttpError 402 if balance is already 0.
 * The conditional UPDATE prevents a race when two requests debit concurrently.
 */
export async function debitCredits(input: {
  userId: string;
  amount: number;
  reason: CreditReason;
  notes?: string;
  tx?: Prisma.TransactionClient;
}): Promise<number> {
  const op = async (client: Prisma.TransactionClient): Promise<number> => {
    // updateMany with where: { creditBalance: { gte: amount } } returns count of 0 if insufficient
    const result = await client.user.updateMany({
      where: { id: input.userId, creditBalance: { gte: input.amount } },
      data: { creditBalance: { decrement: input.amount } },
    });
    if (result.count === 0) {
      throw new HttpError(
        402,
        'out_of_credits',
        "You're out of credits. Refills at midnight — or log this meal manually for free.",
      );
    }
    const user = await client.user.findUniqueOrThrow({
      where: { id: input.userId },
      select: { creditBalance: true },
    });
    await client.creditLedger.create({
      data: {
        userId: input.userId,
        delta: -input.amount,
        balanceAfter: user.creditBalance,
        reason: input.reason,
        notes: input.notes,
      },
    });
    return user.creditBalance;
  };

  if (input.tx) return op(input.tx);
  return prisma.$transaction(op);
}
