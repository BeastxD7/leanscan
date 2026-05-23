-- Multi-item meal detection: add MealItem table + backfill existing rows.
--
-- Before this migration: each `meals` row stored a single meal estimate
-- (one meal_name + one set of macros).
--
-- After this migration: each `meals` row keeps its macros as denormalized
-- totals AND has 1..N child `meal_items` rows. Single-item meals still
-- work — they just have one child row. Multi-item photos return multiple
-- child rows.
--
-- The existing macros on `meals` are NOT dropped — they become the
-- denormalized sum across this meal's items, kept in sync by the service
-- layer. Old API clients that still POST single-item shape are translated
-- by the route handler into a single-MealItem create.

-- 1. Create the meal_items table
CREATE TABLE "meal_items" (
  "id"                UUID         NOT NULL DEFAULT gen_random_uuid(),
  "meal_id"           UUID         NOT NULL,
  "position"          INT          NOT NULL DEFAULT 0,
  "item_name"         TEXT         NOT NULL,
  "estimated_portion" TEXT,
  "protein_g"         DECIMAL(6,2) NOT NULL DEFAULT 0,
  "calories"          INT,
  "carbs_g"           DECIMAL(6,2),
  "fat_g"             DECIMAL(6,2),
  "confidence"        "MealConfidence",
  "edited_by_user"    BOOLEAN      NOT NULL DEFAULT false,
  "created_at"        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT "meal_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "meal_items_meal_id_position_idx"
  ON "meal_items" ("meal_id", "position");

ALTER TABLE "meal_items"
  ADD CONSTRAINT "meal_items_meal_id_fkey"
  FOREIGN KEY ("meal_id") REFERENCES "meals" ("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. Backfill: for every existing meals row (not soft-deleted), create
--    one matching meal_items row using the meal's current macros. This
--    ensures every meal has at least one item after the migration, so
--    new code paths can rely on items[].length >= 1.
INSERT INTO "meal_items" (
  "meal_id", "position", "item_name", "estimated_portion",
  "protein_g", "calories", "carbs_g", "fat_g",
  "confidence", "edited_by_user", "created_at"
)
SELECT
  "id",
  0,
  "meal_name",
  "estimated_portion",
  "protein_g",
  "calories",
  "carbs_g",
  "fat_g",
  "confidence",
  "edited_by_user",
  "created_at"
FROM "meals"
WHERE "deleted_at" IS NULL;
