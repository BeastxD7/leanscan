/**
 * Convert the Prisma user (camelCase, with Date / Decimal) into a stable
 * snake_case JSON shape that all clients consume.
 *
 * Every route that returns a user object should go through this so the mobile
 * app never has to deal with field-name drift between endpoints.
 *
 * Derived fields (bmr_kcal / tdee_kcal / calorie_target_kcal) are computed on
 * the fly from the persisted profile inputs — no DB column needed.
 */
import { calculateEnergyTargets } from './energyTargets.js';

export interface SerializedUser {
  id: string;
  email: string;
  role: string;
  status: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  sex: string | null;
  display_name: string | null;
  goal: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  goal_weight_kg: number | null;
  activity_level: string | null;
  protein_target_g: number | null;
  // Derived energy targets — null when we don't have enough data to compute
  bmr_kcal: number | null;
  tdee_kcal: number | null;
  calorie_target_kcal: number | null;
  units_metric: boolean;
  dashboard_priority: string;
  medication: string;
  medication_dose: string | null;
  medication_start_date: string | null;
  credit_balance: number;
  is_founder_cohort: boolean;
  reminder_weight_time: string | null;
  reminder_meal_nudges: boolean;
  onboarding_completed: boolean;
  created_at: string;
}

// Input is "looks like Prisma User" — typed loose so this helper accepts
// the various .select() shapes we use across routes.
type AnyUser = Record<string, unknown>;

function maybeNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  // Prisma Decimal: has a toString that returns the numeric value
  if (typeof v === 'object' && v && 'toString' in v) {
    const n = Number(String(v));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function maybeIso(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'string') return v;
  return null;
}

function maybeDate(v: unknown): string | null {
  const iso = maybeIso(v);
  return iso ? iso.slice(0, 10) : null;
}

/**
 * Postgres TIME columns come back as Date objects from Prisma (with the date
 * portion meaningless). Return "HH:MM" so the mobile schema validation works
 * round-trip and the time input shows the right thing.
 */
function maybeTime(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Date) {
    const h = String(v.getUTCHours()).padStart(2, '0');
    const m = String(v.getUTCMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }
  if (typeof v === 'string') {
    if (/^\d{2}:\d{2}$/.test(v)) return v;
    const match = v.match(/T(\d{2}:\d{2})/);
    return match ? match[1] : null;
  }
  return null;
}

export function serializeUser(u: AnyUser): SerializedUser {
  const weightKg = maybeNumber(u.weightKg);
  const heightCm = maybeNumber(u.heightCm);
  const sex = (u.sex as string | null | undefined) ?? null;
  const dob = u.dateOfBirth instanceof Date ? u.dateOfBirth : null;
  const activityLevel = (u.activityLevel as string | null | undefined) ?? null;
  const goal = (u.goal as string | null | undefined) ?? null;

  const energy = calculateEnergyTargets({
    weightKg,
    heightCm,
    sex,
    dateOfBirth: dob,
    activityLevel,
    goal,
  });

  return {
    id: String(u.id),
    email: String(u.email ?? ''),
    role: String(u.role ?? 'user'),
    status: String(u.status ?? 'active'),
    username: (u.username as string | null | undefined) ?? null,
    first_name: (u.firstName as string | null | undefined) ?? null,
    last_name: (u.lastName as string | null | undefined) ?? null,
    date_of_birth: maybeDate(u.dateOfBirth),
    sex,
    display_name: (u.displayName as string | null | undefined) ?? null,
    goal,
    height_cm: heightCm,
    weight_kg: weightKg,
    goal_weight_kg: maybeNumber(u.goalWeightKg),
    activity_level: activityLevel,
    protein_target_g: typeof u.proteinTargetG === 'number' ? u.proteinTargetG : null,
    bmr_kcal: energy.bmr_kcal,
    tdee_kcal: energy.tdee_kcal,
    calorie_target_kcal: energy.calorie_target_kcal,
    units_metric: (u.unitsMetric as boolean | undefined) ?? true,
    dashboard_priority: (u.dashboardPriority as string | undefined) ?? 'protein',
    medication: (u.medication as string | undefined) ?? 'none',
    medication_dose: (u.medicationDose as string | null | undefined) ?? null,
    medication_start_date: maybeDate(u.medicationStartDate),
    credit_balance: typeof u.creditBalance === 'number' ? u.creditBalance : 0,
    is_founder_cohort: (u.isFounderCohort as boolean | undefined) ?? false,
    reminder_weight_time: maybeTime(u.reminderWeightTime),
    reminder_meal_nudges: (u.reminderMealNudges as boolean | undefined) ?? true,
    onboarding_completed: Boolean(u.onboardingCompletedAt),
    created_at: maybeIso(u.createdAt) ?? new Date().toISOString(),
  };
}
