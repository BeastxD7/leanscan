-- 003_password_reset_tokens.sql
-- One-time tokens for the "forgot password" flow.
-- Token itself is never stored; only its hash is.

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  token_hash text PRIMARY KEY,             -- sha256 of the opaque token
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS password_reset_user_idx
  ON password_reset_tokens (user_id);
CREATE INDEX IF NOT EXISTS password_reset_expires_idx
  ON password_reset_tokens (expires_at)
  WHERE used_at IS NULL;
