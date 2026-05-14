-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');

-- AlterTable
ALTER TABLE "meals" ALTER COLUMN "log_date" SET DEFAULT (CURRENT_DATE);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "sex" "Sex",
ALTER COLUMN "reminder_weight_time" SET DEFAULT '08:00'::time;
