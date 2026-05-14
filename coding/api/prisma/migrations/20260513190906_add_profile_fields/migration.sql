/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "meals" ALTER COLUMN "log_date" SET DEFAULT (CURRENT_DATE);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "date_of_birth" DATE,
ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "last_name" TEXT,
ADD COLUMN     "username" TEXT,
ALTER COLUMN "reminder_weight_time" SET DEFAULT '08:00'::time;

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
