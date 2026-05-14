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
