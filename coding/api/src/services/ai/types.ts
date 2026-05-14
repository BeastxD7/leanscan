/**
 * Common types for any AI vision provider.
 * Every provider in this folder implements `AIVisionProvider`.
 */

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface MealEstimate {
  meal_name: string;
  estimated_portion?: string;
  protein_g: number;
  calories: number;
  carbs_g: number;
  fat_g: number;
  confidence: ConfidenceLevel;
  notes?: string;
  /** Set to "not_a_meal" if the provider determined the image is not food. */
  error?: string;
}

export interface AnalyzeResult {
  estimate: MealEstimate;
  raw: unknown;
  provider: string;
  model: string;
  latency_ms: number;
}

export interface AIVisionProvider {
  /** Stable name like "gemini" / "openai" / "azure-openai" / "bedrock". */
  readonly name: string;
  /** Underlying model identifier reported back to caller (for ledger/debug). */
  readonly model: string;
  analyzeMealPhoto(imageBuffer: Buffer, mimeType: string): Promise<AnalyzeResult>;
}

/**
 * Shared system prompt used across providers.
 * Keep this in one place so behavior stays consistent when swapping models.
 */
export const SYSTEM_PROMPT = `You are LeanScan, a protein-first nutrition analyzer.

Given a photo of a meal, identify what it is and estimate nutrition. Always lead with PROTEIN — it is the headline number.

Return ONLY a valid JSON object with this exact shape, no markdown, no commentary:
{
  "meal_name": "short descriptive name, max 6 words",
  "estimated_portion": "concise portion description, e.g. '1 cup, ~150g'",
  "protein_g": number (integer grams),
  "calories": number (integer kcal),
  "carbs_g": number (integer grams),
  "fat_g": number (integer grams),
  "confidence": "low" | "medium" | "high",
  "notes": "one short sentence about protein quality or a tip, max 20 words"
}

If the image is not a meal, return:
{"error": "not_a_meal", "meal_name": "Not a meal", "estimated_portion": "", "protein_g": 0, "calories": 0, "carbs_g": 0, "fat_g": 0, "confidence": "low", "notes": "Try a photo of food on a plate or in a bowl."}`;

/** Normalize and clamp provider output so downstream code never sees wild values. */
export function normalizeEstimate(raw: unknown): MealEstimate {
  const obj = (raw ?? {}) as Partial<MealEstimate>;
  const clamp = (n: unknown, max: number) =>
    typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.min(max, Math.round(n))) : 0;
  return {
    meal_name:
      typeof obj.meal_name === 'string' && obj.meal_name.trim()
        ? obj.meal_name.trim().slice(0, 120)
        : 'Unknown meal',
    estimated_portion:
      typeof obj.estimated_portion === 'string' ? obj.estimated_portion.slice(0, 120) : undefined,
    protein_g: clamp(obj.protein_g, 500),
    calories: clamp(obj.calories, 5000),
    carbs_g: clamp(obj.carbs_g, 500),
    fat_g: clamp(obj.fat_g, 500),
    confidence:
      obj.confidence === 'low' || obj.confidence === 'medium' || obj.confidence === 'high'
        ? obj.confidence
        : 'low',
    notes: typeof obj.notes === 'string' ? obj.notes.slice(0, 200) : undefined,
    error: typeof obj.error === 'string' ? obj.error : undefined,
  };
}

/** Extract the first JSON object from a model response that might have markdown fences. */
export function extractJson(content: string): string {
  let s = content.trim();
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  if (s[0] !== '{') {
    const m = s.match(/\{[\s\S]*\}/);
    if (m) s = m[0];
  }
  return s;
}
