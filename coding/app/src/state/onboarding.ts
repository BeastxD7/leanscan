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

export function calculateProteinTarget(input: {
  weightKg: number | null;
  activityLevel: ActivityLevel | null;
  goal: Goal | null;
}): number | null {
  if (!input.weightKg) return null;
  let multiplier = 1.2;
  if (input.activityLevel === 'moderate') multiplier = 1.4;
  if (input.activityLevel === 'active') multiplier = 1.6;
  if (input.goal === 'build') multiplier += 0.2;
  if (input.goal === 'recomp') multiplier += 0.1;
  return Math.round(input.weightKg * multiplier);
}
