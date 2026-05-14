-- 004_credit_ledger.sql
-- Append-only log of every credit change for transparency, audit, and analytics.
-- Source of truth for "where did my credits go?"
--
-- Invariant: users.credit_balance equals the sum of all delta values in
-- credit_ledger for that user. Keep updates in a single transaction.

CREATE TABLE IF NOT EXISTS credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delta int NOT NULL,                       -- +10 refill, -1 scan, +50 admin grant
  balance_after int NOT NULL,               -- snapshot for audit clarity
  reason text NOT NULL CHECK (reason IN (
    'initial_grant',
    'daily_refill',
    'photo_scan',
    'admin_grant',
    'referral_bonus',
    'onboarding_bonus'
  )),
  admin_user_id uuid REFERENCES users(id),  -- nullable; set for admin_grant only
  notes text,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS credit_ledger_user_idx
  ON credit_ledger (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS credit_ledger_reason_idx
  ON credit_ledger (reason, created_at DESC);
