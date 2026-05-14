/**
 * Energy expenditure math — BMR, TDEE, and daily calorie target.
 *
 * Mifflin-St Jeor BMR + Harris-Benedict activity multipliers + goal adjustment.
 * Lives in lib/ because both the profile route (when recalculating after a
 * change) and serializeUser (when responding to /me) need the same numbers.
 *
 * Returns nulls if we don't have enough data — the home screen degrades
 * gracefully when target is null.
 */

const ACTIVITY_TDEE_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

const GOAL_KCAL_ADJUSTMENT: Record<string, number> = {
  lose: -500,
  recomp: -200,
  maintain: 0,
  build: 300,
};

function calculateAgeYears(dob: Date | null): number | null {
  if (!dob) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const m = now.getUTCMonth() - dob.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < dob.getUTCDate())) age -= 1;
  return age >= 0 && age < 120 ? age : null;
}

export interface EnergyTargets {
  bmr_kcal: number | null;
  tdee_kcal: number | null;
  calorie_target_kcal: number | null;
}

export function calculateEnergyTargets(opts: {
  weightKg: number | null;
  heightCm: number | null;
  sex: string | null;
  dateOfBirth: Date | null;
  activityLevel: string | null;
  goal: string | null;
}): EnergyTargets {
  const { weightKg, heightCm } = opts;
  if (!weightKg || !heightCm) {
    return { bmr_kcal: null, tdee_kcal: null, calorie_target_kcal: null };
  }
  const age = calculateAgeYears(opts.dateOfBirth) ?? 30;

  // BMR per sex. Mifflin-St Jeor is the modern standard.
  let bmr: number;
  if (opts.sex === 'male') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else if (opts.sex === 'female') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  } else {
    // Unknown / other / prefer_not_to_say → average the two formulas
    const male = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    const female = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    bmr = (male + female) / 2;
  }

  const activityMult = ACTIVITY_TDEE_MULTIPLIERS[opts.activityLevel ?? 'sedentary'] ?? 1.2;
  const tdee = bmr * activityMult;
  const goalAdj = GOAL_KCAL_ADJUSTMENT[opts.goal ?? 'maintain'] ?? 0;
  const target = tdee + goalAdj;

  return {
    bmr_kcal: Math.round(bmr),
    tdee_kcal: Math.round(tdee),
    calorie_target_kcal: Math.round(target),
  };
}
