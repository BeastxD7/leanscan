-- 002_auth_sessions.sql
-- Refresh-token sessions. The access token is JWT and stateless;
-- the refresh token is opaque and stored here (hashed) so we can revoke.

CREATE TABLE IF NOT EXISTS auth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash text NOT NULL,        -- sha256 of the opaque token, never the token itself
  expires_at timestamptz NOT NULL,
  user_agent text,
  ip_address inet,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  last_used_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS auth_sessions_user_idx ON auth_sessions (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS auth_sessions_token_hash_idx
  ON auth_sessions (refresh_token_hash);
CREATE INDEX IF NOT EXISTS auth_sessions_expires_idx
  ON auth_sessions (expires_at)
  WHERE revoked_at IS NULL;
