/**
 * Meals endpoints.
 *
 *   POST   /v1/meals/photo        Upload photo → Gemini estimate (does NOT save). Debits 1 credit.
 *   POST   /v1/meals               Save a meal (after photo flow OR manual entry).
 *   GET    /v1/meals?date=YYYY-MM-DD  List meals for a date (default: today UTC).
 *   GET    /v1/meals/days          Daily aggregates over ?since=&until= for History view.
 *   GET    /v1/meals/recent        Last 10 unique meals by name (for quick re-log).
 *   GET    /v1/meals/:id           Single meal detail.
 *   PATCH  /v1/meals/:id           Edit name / portion / macros.
 *   DELETE /v1/meals/:id           Soft-delete.
 *   GET    /v1/meals/:id/photo     Stream the saved photo (auth-checked).
 *   GET    /v1/meals/summary/today Macros totals for today (used by home screen).
 */
import { Router, type Request } from 'express';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';

import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { apiSuccess } from '../lib/response.js';
import { scanLimiter } from '../middleware/rateLimit.js';
import { uploadSingle } from '../middleware/upload.js';
import { processMealPhoto } from '../services/image.js';
import { getAIProvider } from '../services/ai/index.js';
import { storage } from '../services/storage.js';
import { refillIfDue, debitCredits } from '../credits/grant.js';
import { logger } from '../lib/logger.js';

export const mealsRouter = Router();

/**
 * `<Image>` in React Native doesn't reliably forward request headers on Android,
 * so the photo endpoint also accepts the access token via `?token=` query string.
 * This middleware promotes that query param to a Bearer header before requireAuth
 * runs, so the rest of the auth flow stays unchanged. Scoped to /photo only —
 * other endpoints still require the Authorization header.
 */
mealsRouter.use((req, _res, next) => {
  if (
    req.path.endsWith('/photo') &&
    !req.headers.authorization &&
    typeof req.query.token === 'string' &&
    req.query.token.length > 0
  ) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  next();
});

mealsRouter.use(requireAuth);

// =============================================================
// Schemas
// =============================================================
const saveMealSchema = z.object({
  meal_name: z.string().min(1).max(120),
  protein_g: z.number().min(0).max(500),
  calories: z.number().int().min(0).max(5000).optional(),
  carbs_g: z.number().min(0).max(500).optional(),
  fat_g: z.number().min(0).max(500).optional(),
  estimated_portion: z.string().max(120).optional(),
  source: z.enum(['photo', 'manual', 'quick_add']).default('manual'),
  photo_path: z.string().max(300).optional(),
  confidence: z.enum(['low', 'medium', 'high']).optional(),
  ai_notes: z.string().max(500).optional(),
  raw_ai_response: z.unknown().optional(),
  edited_by_user: z.boolean().optional(),
  logged_at: z.string().datetime().optional(),
});

const patchMealSchema = z.object({
  meal_name: z.string().min(1).max(120).optional(),
  protein_g: z.number().min(0).max(500).optional(),
  calories: z.number().int().min(0).max(5000).optional(),
  carbs_g: z.number().min(0).max(500).optional(),
  fat_g: z.number().min(0).max(500).optional(),
  estimated_portion: z.string().max(120).optional(),
});

const dateQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD')
    .optional(),
});

const idParamSchema = z.object({
  id: z.string().uuid(),
});

// =============================================================
// Helpers
// =============================================================
function serializeMeal(m: {
  id: string;
  loggedAt: Date;
  logDate: Date;
  mealName: string;
  estimatedPortion: string | null;
  photoPath: string | null;
  proteinG: { toString(): string };
  calories: number | null;
  carbsG: { toString(): string } | null;
  fatG: { toString(): string } | null;
  source: string;
  confidence: string | null;
  aiNotes: string | null;
  editedByUser: boolean;
  createdAt: Date;
}) {
  return {
    id: m.id,
    logged_at: m.loggedAt.toISOString(),
    log_date: m.logDate.toISOString().slice(0, 10),
    meal_name: m.mealName,
    estimated_portion: m.estimatedPortion,
    photo_path: m.photoPath,
    protein_g: Number(m.proteinG),
    calories: m.calories,
    carbs_g: m.carbsG ? Number(m.carbsG) : null,
    fat_g: m.fatG ? Number(m.fatG) : null,
    source: m.source,
    confidence: m.confidence,
    ai_notes: m.aiNotes,
    edited_by_user: m.editedByUser,
    created_at: m.createdAt.toISOString(),
  };
}

const MEAL_SELECT = {
  id: true,
  loggedAt: true,
  logDate: true,
  mealName: true,
  estimatedPortion: true,
  photoPath: true,
  proteinG: true,
  calories: true,
  carbsG: true,
  fatG: true,
  source: true,
  confidence: true,
  aiNotes: true,
  editedByUser: true,
  createdAt: true,
} as const;

// =============================================================
// POST /v1/meals/photo — analyze (does NOT save)
// =============================================================
mealsRouter.post(
  '/photo',
  scanLimiter,
  uploadSingle('photo'),
  asyncHandler(async (req: Request, res) => {
    const userId = req.userId!;
    const file = req.file;

    if (!file) {
      throw new HttpError(400, 'no_photo', 'No photo uploaded. Attach a meal photo.');
    }

    const balance = await refillIfDue(userId);
    if (balance <= 0) {
      throw new HttpError(
        402,
        'out_of_credits',
        "You're out of credits. Refills tomorrow — or log this meal manually for free.",
      );
    }

    const processed = await processMealPhoto(file.buffer);
    const provider = getAIProvider();
    const { estimate, raw, latency_ms } = await provider.analyzeMealPhoto(
      processed.buffer,
      processed.mimeType,
    );

    const newBalance = await debitCredits({
      userId,
      amount: 1,
      reason: 'photo_scan',
      notes: `${provider.name}:${estimate.meal_name}`,
    });

    logger.debug({ provider: provider.name, model: provider.model, ms: latency_ms }, 'AI scan done');

    const scanId = randomUUID();
    const photoPath = storage.mealPhotoPath(userId, scanId, 'jpg');
    await storage.put(photoPath, processed.buffer);

    logger.info(
      { userId, scanId, mealName: estimate.meal_name, proteinG: estimate.protein_g, creditsLeft: newBalance },
      'meal photo analyzed',
    );

    res.json(
      apiSuccess(`Looks like ${estimate.protein_g}g of protein. Review and save.`, {
        scan_id: scanId,
        photo_path: photoPath,
        estimate,
        credit_balance: newBalance,
        raw_ai_response: raw,
      }),
    );
  }),
);

// =============================================================
// POST /v1/meals — save (after user accepts photo result or manual entry)
// =============================================================
mealsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const userId = req.userId!;
    const input = saveMealSchema.parse(req.body);

    // If the client passed a photo_path, verify it lives under this user's namespace.
    if (input.photo_path && !input.photo_path.startsWith(`meals/${userId}/`)) {
      throw new HttpError(403, 'forbidden', 'Photo does not belong to this user.');
    }

    const loggedAt = input.logged_at ? new Date(input.logged_at) : new Date();
    const logDate = new Date(
      Date.UTC(loggedAt.getUTCFullYear(), loggedAt.getUTCMonth(), loggedAt.getUTCDate()),
    );

    const meal = await prisma.meal.create({
      data: {
        userId,
        loggedAt,
        logDate,
        mealName: input.meal_name,
        estimatedPortion: input.estimated_portion,
        photoPath: input.photo_path,
        proteinG: input.protein_g,
        calories: input.calories,
        carbsG: input.carbs_g,
        fatG: input.fat_g,
        source: input.source,
        confidence: input.confidence,
        aiNotes: input.ai_notes,
        rawAiResponse: input.raw_ai_response as never,
        editedByUser: input.edited_by_user ?? false,
      },
      select: MEAL_SELECT,
    });

    res.status(201).json(apiSuccess('Meal saved.', { meal: serializeMeal(meal) }));
  }),
);

// =============================================================
// GET /v1/meals?date=YYYY-MM-DD — list for a UTC date (default today)
// =============================================================
mealsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = req.userId!;
    const { date } = dateQuerySchema.parse(req.query);
    const target = date ?? new Date().toISOString().slice(0, 10);
    const start = new Date(`${target}T00:00:00.000Z`);

    const meals = await prisma.meal.findMany({
      where: {
        userId,
        deletedAt: null,
        logDate: start,
      },
      orderBy: { loggedAt: 'desc' },
      select: MEAL_SELECT,
    });

    // Roll up totals for the home screen — cheaper than a second query for the same data.
    const totals = meals.reduce(
      (acc, m) => {
        acc.protein_g += Number(m.proteinG);
        acc.calories += m.calories ?? 0;
        acc.carbs_g += m.carbsG ? Number(m.carbsG) : 0;
        acc.fat_g += m.fatG ? Number(m.fatG) : 0;
        return acc;
      },
      { protein_g: 0, calories: 0, carbs_g: 0, fat_g: 0 },
    );

    res.json(
      apiSuccess('OK', {
        date: target,
        totals: {
          protein_g: Math.round(totals.protein_g * 10) / 10,
          calories: totals.calories,
          carbs_g: Math.round(totals.carbs_g * 10) / 10,
          fat_g: Math.round(totals.fat_g * 10) / 10,
        },
        meals: meals.map(serializeMeal),
      }),
    );
  }),
);

// =============================================================
// GET /v1/meals/summary/today — fast totals only (used by ring)
// =============================================================
mealsRouter.get(
  '/summary/today',
  asyncHandler(async (req, res) => {
    const userId = req.userId!;
    const target = new Date().toISOString().slice(0, 10);
    const start = new Date(`${target}T00:00:00.000Z`);

    const agg = await prisma.meal.aggregate({
      where: { userId, deletedAt: null, logDate: start },
      _sum: { proteinG: true, calories: true, carbsG: true, fatG: true },
      _count: true,
    });

    res.json(
      apiSuccess('OK', {
        date: target,
        protein_g: agg._sum.proteinG ? Number(agg._sum.proteinG) : 0,
        calories: agg._sum.calories ?? 0,
        carbs_g: agg._sum.carbsG ? Number(agg._sum.carbsG) : 0,
        fat_g: agg._sum.fatG ? Number(agg._sum.fatG) : 0,
        meal_count: agg._count,
      }),
    );
  }),
);

// =============================================================
// GET /v1/meals/days — daily aggregates across a date range
//
// Used by the History view to render one card per day + compute streaks
// without making 90 individual /v1/meals?date=X calls.
//
// Query: ?since=YYYY-MM-DD&until=YYYY-MM-DD  (until defaults to today)
// Returns: { days: [{ date, protein_g, calories, carbs_g, fat_g, meal_count }, ...] }
// Only days that have at least one meal are returned — caller fills in empty
// days client-side. Sorted ascending by date.
// =============================================================
const daysQuerySchema = z.object({
  since: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

mealsRouter.get(
  '/days',
  asyncHandler(async (req, res) => {
    const userId = req.userId!;
    const { since, until } = daysQuerySchema.parse(req.query);
    const untilDate = until ?? new Date().toISOString().slice(0, 10);

    // Hard cap at ~2 years of history per request to keep the response sane.
    const sinceMs = Date.parse(`${since}T00:00:00.000Z`);
    const untilMs = Date.parse(`${untilDate}T00:00:00.000Z`);
    if (Number.isNaN(sinceMs) || Number.isNaN(untilMs) || untilMs < sinceMs) {
      throw new HttpError(400, 'invalid_range', 'Invalid date range');
    }
    const spanDays = Math.round((untilMs - sinceMs) / 86_400_000);
    if (spanDays > 730) {
      throw new HttpError(400, 'range_too_large', 'Range cannot exceed 730 days');
    }

    const grouped = await prisma.meal.groupBy({
      by: ['logDate'],
      where: {
        userId,
        deletedAt: null,
        logDate: { gte: new Date(`${since}T00:00:00.000Z`), lte: new Date(`${untilDate}T00:00:00.000Z`) },
      },
      _sum: { proteinG: true, calories: true, carbsG: true, fatG: true },
      _count: true,
      orderBy: { logDate: 'asc' },
    });

    res.json(
      apiSuccess('OK', {
        since,
        until: untilDate,
        days: grouped.map((g) => ({
          date: g.logDate.toISOString().slice(0, 10),
          protein_g: g._sum.proteinG ? Math.round(Number(g._sum.proteinG) * 10) / 10 : 0,
          calories: g._sum.calories ?? 0,
          carbs_g: g._sum.carbsG ? Math.round(Number(g._sum.carbsG) * 10) / 10 : 0,
          fat_g: g._sum.fatG ? Math.round(Number(g._sum.fatG) * 10) / 10 : 0,
          meal_count: g._count,
        })),
      }),
    );
  }),
);

// =============================================================
// GET /v1/meals/recent — last 10 unique meals by name (for quick re-log)
// =============================================================
mealsRouter.get(
  '/recent',
  asyncHandler(async (req, res) => {
    const userId = req.userId!;

    // Distinct on meal_name, latest occurrence wins. Postgres-specific via raw query.
    const rows = await prisma.$queryRaw<
      Array<{
        id: string;
        meal_name: string;
        protein_g: string;
        calories: number | null;
        carbs_g: string | null;
        fat_g: string | null;
        estimated_portion: string | null;
        logged_at: Date;
      }>
    >`
      SELECT DISTINCT ON (LOWER(meal_name))
        id, meal_name, protein_g, calories, carbs_g, fat_g, estimated_portion, logged_at
      FROM meals
      WHERE user_id = ${userId}::uuid AND deleted_at IS NULL
      ORDER BY LOWER(meal_name), logged_at DESC
      LIMIT 10
    `;

    res.json(
      apiSuccess('OK', {
        items: rows.map((r) => ({
          id: r.id,
          meal_name: r.meal_name,
          protein_g: Number(r.protein_g),
          calories: r.calories,
          carbs_g: r.carbs_g ? Number(r.carbs_g) : null,
          fat_g: r.fat_g ? Number(r.fat_g) : null,
          estimated_portion: r.estimated_portion,
          last_logged_at: r.logged_at.toISOString(),
        })),
      }),
    );
  }),
);

// =============================================================
// GET /v1/meals/:id — single
// =============================================================
mealsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const userId = req.userId!;
    const { id } = idParamSchema.parse(req.params);

    const meal = await prisma.meal.findFirst({
      where: { id, userId, deletedAt: null },
      select: MEAL_SELECT,
    });
    if (!meal) throw new HttpError(404, 'meal_not_found', 'Meal not found.');

    res.json(apiSuccess('OK', { meal: serializeMeal(meal) }));
  }),
);

// =============================================================
// PATCH /v1/meals/:id — edit
// =============================================================
mealsRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const userId = req.userId!;
    const { id } = idParamSchema.parse(req.params);
    const input = patchMealSchema.parse(req.body);

    const existing = await prisma.meal.findFirst({
      where: { id, userId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) throw new HttpError(404, 'meal_not_found', 'Meal not found.');

    const updates: Record<string, unknown> = { editedByUser: true };
    if (input.meal_name !== undefined) updates.mealName = input.meal_name;
    if (input.protein_g !== undefined) updates.proteinG = input.protein_g;
    if (input.calories !== undefined) updates.calories = input.calories;
    if (input.carbs_g !== undefined) updates.carbsG = input.carbs_g;
    if (input.fat_g !== undefined) updates.fatG = input.fat_g;
    if (input.estimated_portion !== undefined) updates.estimatedPortion = input.estimated_portion;

    const meal = await prisma.meal.update({
      where: { id },
      data: updates,
      select: MEAL_SELECT,
    });

    res.json(apiSuccess('Meal updated.', { meal: serializeMeal(meal) }));
  }),
);

// =============================================================
// DELETE /v1/meals/:id — soft delete
// =============================================================
mealsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const userId = req.userId!;
    const { id } = idParamSchema.parse(req.params);

    const existing = await prisma.meal.findFirst({
      where: { id, userId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) throw new HttpError(404, 'meal_not_found', 'Meal not found.');

    await prisma.meal.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.json(apiSuccess('Meal deleted.'));
  }),
);

// =============================================================
// GET /v1/meals/:id/photo — stream the stored photo, auth-checked
// =============================================================
mealsRouter.get(
  '/:id/photo',
  asyncHandler(async (req, res) => {
    const userId = req.userId!;
    const { id } = idParamSchema.parse(req.params);

    const meal = await prisma.meal.findFirst({
      where: { id, userId, deletedAt: null },
      select: { photoPath: true },
    });
    if (!meal) throw new HttpError(404, 'meal_not_found', 'Meal not found.');
    if (!meal.photoPath) {
      throw new HttpError(404, 'no_photo', 'This meal has no photo attached.');
    }
    if (!(await storage.exists(meal.photoPath))) {
      throw new HttpError(410, 'photo_gone', 'Photo no longer on disk.');
    }

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'private, max-age=86400');
    storage.stream(meal.photoPath).pipe(res);
  }),
);
