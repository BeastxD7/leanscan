/**
 * Onboarding state — accumulates answers across the 6 steps, then submits
 * to the API on the final screen. Cleared after completion or sign-out.
 */
import { create } from 'zustand';

export type Goal = 'lose' | 'build' | 'recomp' | 'maintain';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';
export type Medication =
  | 'none'
  | 'ozempic'
  | 'wegovy'
  | 'mounjaro'
  | 'zepbound'
  | 'saxenda'
  | 'compounded_semaglutide'
  | 'compounded_tirzepatide'
  | 'other';

export type Sex = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface OnboardingState {
  // Identity (step 1)
  username: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
  sex: Sex | null;

  goal: Goal | null;
  heightCm: number | null;
  weightKg: number | null;
  goalWeightKg: number | null;
  activityLevel: ActivityLevel | null;
  medication: Medication;
  unitsMetric: boolean;
  reminderWeightTime: string;
  reminderMealNudges: boolean;

  set: (patch: Partial<OnboardingState>) => void;
  reset: () => void;
}

const initial: Omit<OnboardingState, 'set' | 'reset'> = {
  username: '',
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  sex: null,
  goal: null,
  heightCm: null,
  weightKg: null,
  goalWeightKg: null,
  activityLevel: null,
  medication: 'none',
  unitsMetric: true,
  reminderWeightTime: '08:00',
  reminderMealNudges: true,
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initial,
  set: (patch) => set(patch),
  reset: () => set(initial),
}));

/**
 * GLP-1 medications. Keep this in sync with the backend list in
 * coding/api/src/routes/profile.ts. Users on these drugs in a deficit get a
 * minimum protein target of 1.6 g/kg to protect lean mass.
 */
export const GLP1_MEDICATIONS: ReadonlySet<Medication> = new Set([
  'ozempic',
  'wegovy',
  'mounjaro',
  'zepbound',
  'saxenda',
  'compounded_semaglutide',
  'compounded_tirzepatide',
]);

export interface ProteinTargetCalc {
  value: number | null;
  multiplier: number | null;
  /** Short user-facing sentence about why the number is what it is. */
  reasoning: string | null;
}

/**
 * Mirror of the backend protein target calculation. Used on the Done screen to
 * preview the target before submitting onboarding. Once the API persists
 * profile updates, the home screen reads the server-side value from the user
 * record (which uses the same math), so this helper is only for previews.
 */
export function calculateProteinTarget(input: {
  weightKg: number | null;
  activityLevel: ActivityLevel | null;
  goal: Goal | null;
  medication?: Medication | null;
}): ProteinTargetCalc {
  if (!input.weightKg) return { value: null, multiplier: null, reasoning: null };

  let multiplier = 1.2;
  if (input.activityLevel === 'moderate') multiplier = 1.4;
  if (input.activityLevel === 'active') multiplier = 1.6;
  if (input.goal === 'build') multiplier += 0.2;
  if (input.goal === 'recomp') multiplier += 0.1;

  let reasoning: string | null = null;
  if (
    input.medication &&
    GLP1_MEDICATIONS.has(input.medication) &&
    (input.goal === 'lose' || input.goal === 'recomp')
  ) {
    if (multiplier < 1.6) {
      multiplier = 1.6;
      reasoning = 'Bumped to 1.6 g/kg — GLP-1 users in a deficit need more protein to protect muscle.';
    } else {
      reasoning = `Already meets the GLP-1 muscle-protection guideline of 1.6 g/kg.`;
    }
  }

  return {
    value: Math.round(input.weightKg * multiplier),
    multiplier,
    reasoning,
  };
}

/**
 * Mobile mirror of the backend energy-target math (BMR / TDEE / daily kcal).
 * Used only for the Done screen preview; the home screen reads the server-side
 * authoritative values via /auth/me. Keep this in sync with
 * coding/api/src/lib/energyTargets.ts.
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

function ageFromDob(dob: string | null | undefined): number | null {
  if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) return null;
  const d = new Date(dob + 'T00:00:00Z');
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - d.getUTCFullYear();
  const m = now.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < d.getUTCDate())) age -= 1;
  return age >= 0 && age < 120 ? age : null;
}

export function calculateEnergyTargets(input: {
  weightKg: number | null;
  heightCm: number | null;
  sex: Sex | string | null | undefined;
  dateOfBirth: string | null | undefined;
  activityLevel: ActivityLevel | null | undefined;
  goal: Goal | null | undefined;
}): {
  bmr_kcal: number | null;
  tdee_kcal: number | null;
  calorie_target_kcal: number | null;
} {
  if (!input.weightKg || !input.heightCm) {
    return { bmr_kcal: null, tdee_kcal: null, calorie_target_kcal: null };
  }
  const age = ageFromDob(input.dateOfBirth) ?? 30;

  let bmr: number;
  if (input.sex === 'male') {
    bmr = 10 * input.weightKg + 6.25 * input.heightCm - 5 * age + 5;
  } else if (input.sex === 'female') {
    bmr = 10 * input.weightKg + 6.25 * input.heightCm - 5 * age - 161;
  } else {
    const male = 10 * input.weightKg + 6.25 * input.heightCm - 5 * age + 5;
    const female = 10 * input.weightKg + 6.25 * input.heightCm - 5 * age - 161;
    bmr = (male + female) / 2;
  }

  const activityMult =
    ACTIVITY_TDEE_MULTIPLIERS[input.activityLevel ?? 'sedentary'] ?? 1.2;
  const tdee = bmr * activityMult;
  const goalAdj = GOAL_KCAL_ADJUSTMENT[input.goal ?? 'maintain'] ?? 0;
  const target = tdee + goalAdj;

  return {
    bmr_kcal: Math.round(bmr),
    tdee_kcal: Math.round(tdee),
    calorie_target_kcal: Math.round(target),
  };
}
