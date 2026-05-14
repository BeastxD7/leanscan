-- CreateEnum
CREATE TYPE "MealSource" AS ENUM ('photo', 'manual', 'quick_add');

-- CreateEnum
CREATE TYPE "MealConfidence" AS ENUM ('low', 'medium', 'high');

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "reminder_weight_time" SET DEFAULT '08:00'::time;

-- CreateTable
CREATE TABLE "meals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "logged_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "log_date" DATE NOT NULL DEFAULT (CURRENT_DATE),
    "meal_name" TEXT NOT NULL,
    "estimated_portion" TEXT,
    "photo_path" TEXT,
    "protein_g" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "calories" INTEGER,
    "carbs_g" DECIMAL(6,2),
    "fat_g" DECIMAL(6,2),
    "source" "MealSource" NOT NULL DEFAULT 'photo',
    "confidence" "MealConfidence",
    "ai_notes" TEXT,
    "raw_ai_response" JSONB,
    "edited_by_user" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meals_user_id_logged_at_idx" ON "meals"("user_id", "logged_at" DESC);

-- CreateIndex
CREATE INDEX "meals_user_id_log_date_idx" ON "meals"("user_id", "log_date");

-- AddForeignKey
ALTER TABLE "meals" ADD CONSTRAINT "meals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
