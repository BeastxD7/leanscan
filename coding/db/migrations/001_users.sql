-- 001_users.sql
-- Creates the core users table — auth + profile + credit state in one row.
-- See coding/planning/02-architecture.md § 5 for schema rationale.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Auth
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  email_verified_at timestamptz,

  -- Access control
  role text NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'admin', 'super_admin')),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'deleted')),

  -- Profile (filled during onboarding)
  display_name text,
  goal text CHECK (goal IN ('lose', 'build', 'recomp', 'maintain')),
  height_cm numeric(5, 2),
  weight_kg numeric(5, 2),
  goal_weight_kg numeric(5, 2),
  activity_level text
    CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active')),
  protein_target_g int,
  units_metric boolean NOT NULL DEFAULT true,
  dashboard_priority text NOT NULL DEFAULT 'protein'
    CHECK (dashboard_priority IN ('protein', 'calories')),
  onboarding_completed_at timestamptz,

  -- Optional medication info
  medication text NOT NULL DEFAULT 'none'
    CHECK (medication IN (
      'none', 'ozempic', 'wegovy', 'mounjaro', 'zepbound', 'saxenda',
      'compounded_semaglutide', 'compounded_tirzepatide', 'other'
    )),
  medication_dose text,
  medication_start_date date,

  -- Credit system (V1 has no payment — credits are the only gate on AI scans)
  credit_balance int NOT NULL DEFAULT 100,
  credit_last_refilled_at timestamptz NOT NULL DEFAULT NOW(),
  is_founder_cohort boolean NOT NULL DEFAULT false,

  -- Reminder preferences
  reminder_weight_time time NOT NULL DEFAULT '08:00',
  reminder_meal_nudges boolean NOT NULL DEFAULT true,

  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);
CREATE INDEX IF NOT EXISTS users_role_idx ON users (role);
CREATE INDEX IF NOT EXISTS users_status_idx ON users (status);

-- Maintain updated_at on every UPDATE.
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
