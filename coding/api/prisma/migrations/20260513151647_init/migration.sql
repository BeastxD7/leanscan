-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'admin', 'super_admin');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'suspended', 'deleted');

-- CreateEnum
CREATE TYPE "Goal" AS ENUM ('lose', 'build', 'recomp', 'maintain');

-- CreateEnum
CREATE TYPE "ActivityLevel" AS ENUM ('sedentary', 'light', 'moderate', 'active');

-- CreateEnum
CREATE TYPE "DashboardPriority" AS ENUM ('protein', 'calories');

-- CreateEnum
CREATE TYPE "Medication" AS ENUM ('none', 'ozempic', 'wegovy', 'mounjaro', 'zepbound', 'saxenda', 'compounded_semaglutide', 'compounded_tirzepatide', 'other');

-- CreateEnum
CREATE TYPE "CreditReason" AS ENUM ('initial_grant', 'daily_refill', 'photo_scan', 'admin_grant', 'referral_bonus', 'onboarding_bonus');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "email_verified_at" TIMESTAMPTZ,
    "role" "Role" NOT NULL DEFAULT 'user',
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "display_name" TEXT,
    "goal" "Goal",
    "height_cm" DECIMAL(5,2),
    "weight_kg" DECIMAL(5,2),
    "goal_weight_kg" DECIMAL(5,2),
    "activity_level" "ActivityLevel",
    "protein_target_g" INTEGER,
    "units_metric" BOOLEAN NOT NULL DEFAULT true,
    "dashboard_priority" "DashboardPriority" NOT NULL DEFAULT 'protein',
    "onboarding_completed_at" TIMESTAMPTZ,
    "medication" "Medication" NOT NULL DEFAULT 'none',
    "medication_dose" TEXT,
    "medication_start_date" DATE,
    "credit_balance" INTEGER NOT NULL DEFAULT 100,
    "credit_last_refilled_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_founder_cohort" BOOLEAN NOT NULL DEFAULT false,
    "reminder_weight_time" TIME(6) NOT NULL DEFAULT '08:00'::time,
    "reminder_meal_nudges" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "user_agent" TEXT,
    "ip_address" INET,
    "revoked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "token_hash" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "used_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("token_hash")
);

-- CreateTable
CREATE TABLE "credit_ledger" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "delta" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "reason" "CreditReason" NOT NULL,
    "admin_user_id" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_refresh_token_hash_key" ON "auth_sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "auth_sessions_user_id_idx" ON "auth_sessions"("user_id");

-- CreateIndex
CREATE INDEX "auth_sessions_expires_at_idx" ON "auth_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE INDEX "credit_ledger_user_id_created_at_idx" ON "credit_ledger"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "credit_ledger_reason_created_at_idx" ON "credit_ledger"("reason", "created_at");

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_ledger" ADD CONSTRAINT "credit_ledger_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_ledger" ADD CONSTRAINT "credit_ledger_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
