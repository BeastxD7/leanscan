/**
 * Profile + onboarding endpoints.
 * Both routers require auth and are mounted by server.ts:
 *   - profileRouter      at /v1/profile
 *   - onboardingRouter   at /v1/onboarding
 */
import { Router } from 'express';
import { z } from 'zod';

import { Prisma } from '@prisma/client';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { apiSuccess } from '../lib/response.js';
import { serializeUser } from '../lib/serializeUser.js';
import { grantCredits } from '../credits/grant.js';
import { config } from '../config.js';

export const profileRouter = Router();
export const onboardingRouter = Router();

profileRouter.use(requireAuth);
onboardingRouter.use(requireAuth);

// =============================================================
// Schemas
// =============================================================
const medicationEnum = z.enum([
  'none',
  'ozempic',
  'wegovy',
  'mounjaro',
  'zepbound',
  'saxenda',
  'compounded_semaglutide',
  'compounded_tirzepatide',
  'other',
]);

const profileUpdateSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters.')
    .max(30, 'Username must be 30 characters or fewer.')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscore, and dash.')
    .transform((s) => s.toLowerCase())
    .optional(),
  first_name: z.string().min(1).max(60).optional(),
  last_name: z.string().min(1).max(60).optional(),
  sex: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date_of_birth must be YYYY-MM-DD')
    .refine((s) => {
      const d = new Date(s);
      const now = new Date();
      const minAge = new Date(now.getFullYear() - 13, now.getMonth(), now.getDate());
      const maxAge = new Date(now.getFullYear() - 120, now.getMonth(), now.getDate());
      return !isNaN(d.getTime()) && d <= minAge && d >= maxAge;
    }, 'Enter a real birth date (must be 13+ years old).')
    .optional(),
  display_name: z.string().min(1).max(100).optional(),
  goal: z.enum(['lose', 'build', 'recomp', 'maintain']).optional(),
  height_cm: z.number().min(50).max(280).optional(),
  weight_kg: z.number().min(20).max(400).optional(),
  goal_weight_kg: z.number().min(20).max(400).optional(),
  activity_level: z.enum(['sedentary', 'light', 'moderate', 'active']).optional(),
  protein_target_g: z.number().int().min(0).max(500).optional(),
  units_metric: z.boolean().optional(),
  dashboard_priority: z.enum(['protein', 'calories']).optional(),
  medication: medicationEnum.optional(),
  medication_dose: z.string().max(50).optional(),
  medication_start_date: z.string().date().optional(),
  reminder_weight_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  reminder_meal_nudges: z.boolean().optional(),
});

// =============================================================
// Helpers
// =============================================================
/**
 * GLP-1 medications. Users on these drugs in a calorie deficit are at elevated
 * risk of lean-mass loss because (a) the appetite suppression makes hitting
 * adequate protein harder, and (b) the rapid weight loss can include muscle.
 * Common clinical guidance is to push toward 1.6–2.0 g/kg in this state.
 *
 * Source: see protein-recommendation notes in research/.
 */
const GLP1_MEDICATIONS = new Set([
  'ozempic',
  'wegovy',
  'mounjaro',
  'zepbound',
  'saxenda',
  'compounded_semaglutide',
  'compounded_tirzepatide',
]);

/**
 * Compute the daily protein target. The returned `reasoning` is a short
 * sentence the UI can show to explain why the number is what it is — useful
 * on the onboarding "Done" screen and in Settings.
 *
 * Math:
 *   base                      = 1.2 g/kg
 *   activity moderate         → 1.4
 *   activity active           → 1.6
 *   goal build                → +0.2
 *   goal recomp               → +0.1
 *   GLP-1 + (lose | recomp)   → floor at 1.6 g/kg (muscle protection)
 */
function calculateProteinTarget(opts: {
  weightKg: number | null;
  activityLevel: string | null;
  goal: string | null;
  medication?: string | null;
}): { value: number | null; multiplier: number | null; reasoning: string | null } {
  if (!opts.weightKg) return { value: null, multiplier: null, reasoning: null };

  let multiplier = 1.2;
  if (opts.activityLevel === 'moderate') multiplier = 1.4;
  if (opts.activityLevel === 'active') multiplier = 1.6;
  if (opts.goal === 'build') multiplier += 0.2;
  if (opts.goal === 'recomp') multiplier += 0.1;

  // GLP-1 bump: floor at 1.6 g/kg when on a GLP-1 drug AND in a deficit-leaning
  // goal. Doesn't reduce people who are already above 1.6 (e.g. active builders).
  let reasoning: string | null = null;
  if (
    opts.medication &&
    GLP1_MEDICATIONS.has(opts.medication) &&
    (opts.goal === 'lose' || opts.goal === 'recomp')
  ) {
    if (multiplier < 1.6) {
      multiplier = 1.6;
      reasoning = `Bumped to 1.6 g/kg — GLP-1 users in a deficit need more protein to protect muscle.`;
    } else {
      reasoning = `Held at ${multiplier.toFixed(1)} g/kg — already meets the GLP-1 muscle-protection guideline.`;
    }
  }

  return {
    value: Math.round(opts.weightKg * multiplier),
    multiplier,
    reasoning,
  };
}

// Energy targets (BMR/TDEE/calorie_target) live in lib/energyTargets.ts so
// serializeUser can use them too.

// kept as a thin alias for backwards compat; serializeUser is the new source of truth
const serializeProfile = serializeUser;

const PROFILE_SELECT = {
  id: true,
  email: true,
  role: true,
  status: true,
  username: true,
  firstName: true,
  lastName: true,
  dateOfBirth: true,
  sex: true,
  displayName: true,
  goal: true,
  heightCm: true,
  weightKg: true,
  goalWeightKg: true,
  activityLevel: true,
  proteinTargetG: true,
  unitsMetric: true,
  dashboardPriority: true,
  medication: true,
  medicationDose: true,
  medicationStartDate: true,
  creditBalance: true,
  isFounderCohort: true,
  onboardingCompletedAt: true,
  reminderWeightTime: true,
  reminderMealNudges: true,
  createdAt: true,
} as const;

// =============================================================
// GET /v1/profile
// =============================================================
profileRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: PROFILE_SELECT,
    });
    if (!user) throw new HttpError(404, 'user_not_found', 'User not found.');
    res.json(apiSuccess('Profile loaded.', serializeProfile(user)));
  }),
);

// =============================================================
// PATCH /v1/profile
// Updates any combination of profile fields.
// Re-calculates protein target automatically if weight/activity/goal changed
// AND the client didn't supply an explicit protein_target_g.
// =============================================================
profileRouter.patch(
  '/',
  asyncHandler(async (req, res) => {
    const input = profileUpdateSchema.parse(req.body);

    const updates: Record<string, unknown> = {};
    if (input.username !== undefined) updates.username = input.username;
    if (input.first_name !== undefined) updates.firstName = input.first_name;
    if (input.last_name !== undefined) updates.lastName = input.last_name;
    if (input.sex !== undefined) updates.sex = input.sex;
    if (input.date_of_birth !== undefined) updates.dateOfBirth = new Date(input.date_of_birth);
    if (input.display_name !== undefined) updates.displayName = input.display_name;
    if (input.goal !== undefined) updates.goal = input.goal;
    if (input.height_cm !== undefined) updates.heightCm = input.height_cm;
    if (input.weight_kg !== undefined) updates.weightKg = input.weight_kg;
    if (input.goal_weight_kg !== undefined) updates.goalWeightKg = input.goal_weight_kg;
    if (input.activity_level !== undefined) updates.activityLevel = input.activity_level;
    if (input.protein_target_g !== undefined) updates.proteinTargetG = input.protein_target_g;
    if (input.units_metric !== undefined) updates.unitsMetric = input.units_metric;
    if (input.dashboard_priority !== undefined) updates.dashboardPriority = input.dashboard_priority;
    if (input.medication !== undefined) updates.medication = input.medication;
    if (input.medication_dose !== undefined) updates.medicationDose = input.medication_dose;
    if (input.medication_start_date !== undefined) {
      updates.medicationStartDate = new Date(input.medication_start_date);
    }
    if (input.reminder_weight_time !== undefined) {
      updates.reminderWeightTime = new Date(`1970-01-01T${input.reminder_weight_time}:00Z`);
    }
    if (input.reminder_meal_nudges !== undefined) updates.reminderMealNudges = input.reminder_meal_nudges;

    let updated;
    try {
      updated = await prisma.user.update({
        where: { id: req.userId! },
        data: updates,
        select: PROFILE_SELECT,
      });
    } catch (err) {
      // Username is the only unique field on the user profile; surface a clean
      // 409 if a collision happens so the form can highlight the field.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002' &&
        Array.isArray(err.meta?.target) &&
        (err.meta.target as string[]).includes('username')
      ) {
        throw new HttpError(409, 'username_taken', 'That username is already taken.');
      }
      throw err;
    }

    // Recalc the protein target whenever any input to the formula changed,
    // unless the client explicitly set an override via protein_target_g.
    // Medication matters now because GLP-1 + (lose | recomp) floors at 1.6 g/kg.
    const shouldRecalc =
      input.protein_target_g === undefined &&
      (input.weight_kg !== undefined ||
        input.activity_level !== undefined ||
        input.goal !== undefined ||
        input.medication !== undefined);

    if (shouldRecalc) {
      const calc = calculateProteinTarget({
        weightKg: updated.weightKg ? Number(updated.weightKg) : null,
        activityLevel: updated.activityLevel ?? null,
        goal: updated.goal ?? null,
        medication: updated.medication ?? null,
      });
      if (calc.value !== null && calc.value !== updated.proteinTargetG) {
        updated = await prisma.user.update({
          where: { id: req.userId! },
          data: { proteinTargetG: calc.value },
          select: PROFILE_SELECT,
        });
      }
    }

    res.json(apiSuccess('Profile updated.', serializeProfile(updated)));
  }),
);

// =============================================================
// POST /v1/onboarding/complete
// Marks onboarding done + grants +20 credit bonus (idempotent).
// =============================================================
onboardingRouter.post(
  '/complete',
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: {
        id: true,
        onboardingCompletedAt: true,
        proteinTargetG: true,
        weightKg: true,
        activityLevel: true,
        goal: true,
        medication: true,
      },
    });
    if (!user) throw new HttpError(404, 'user_not_found', 'User not found.');

    // Idempotent — if already completed, don't grant bonus again
    if (user.onboardingCompletedAt) {
      res.json(
        apiSuccess("You're already set up.", {
          already_completed: true,
          credits_granted: 0,
        }),
      );
      return;
    }

    // Ensure protein target is set — if not, calculate from current profile
    let proteinTarget = user.proteinTargetG;
    if (!proteinTarget) {
      const calc = calculateProteinTarget({
        weightKg: user.weightKg ? Number(user.weightKg) : null,
        activityLevel: user.activityLevel,
        goal: user.goal,
        medication: user.medication,
      });
      proteinTarget = calc.value;
    }

    await prisma.user.update({
      where: { id: req.userId! },
      data: {
        onboardingCompletedAt: new Date(),
        proteinTargetG: proteinTarget ?? undefined,
      },
    });

    const newBalance = await grantCredits({
      userId: req.userId!,
      delta: config.CREDITS_ONBOARDING_BONUS,
      reason: 'onboarding_bonus',
    });

    res.json(
      apiSuccess(
        `Onboarding complete! +${config.CREDITS_ONBOARDING_BONUS} credits.`,
        {
          credits_granted: config.CREDITS_ONBOARDING_BONUS,
          credit_balance: newBalance,
          protein_target_g: proteinTarget,
        },
      ),
    );
  }),
);
