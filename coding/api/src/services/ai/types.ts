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
 *
 * Scope: anything edible or drinkable counts — not just plated meals.
 * Snacks, candy, drinks, fruit, supplements, packaged-food wrappers all log.
 * Only reject when the photo contains literally no food/drink/packaging.
 */
export const SYSTEM_PROMPT = `You are LeanScan, a nutrition analyzer that helps people log anything they eat or drink.

Given a photo, identify any edible or drinkable item(s) shown and estimate nutrition for what the user likely consumed. This includes (but is not limited to):
  - Full meals on plates, bowls, or trays
  - Snacks: candy, chocolate, chips, nuts, granola bars, cookies, popcorn
  - Drinks: coffee, tea, juice, soda, milk, beer, wine, protein shakes, smoothies, water-with-mixers
  - Whole fruits and vegetables (a single banana, an apple, a handful of grapes)
  - Packaged foods — identify the specific product if branding is visible (e.g. "Fruittella", "KitKat", "Red Bull"), and use the standard per-serving nutrition from its label
  - Wrappers, bottles, or empty packaging that clearly indicate what was consumed
  - Multiple distinct items in the same photo — combine them into one entry, summing macros

Always lead with PROTEIN — it is the headline number. Zero protein is a valid answer (most candy and most soda are ~0g protein).

For packaged products, use known label values rather than guessing. If the brand/product isn't certain, fall back to a generic estimate and lower the confidence to "low" or "medium".

Return ONLY a valid JSON object with this exact shape, no markdown, no commentary:
{
  "meal_name": "short descriptive name of the food/drink/item, max 6 words",
  "estimated_portion": "concise portion description, e.g. '1 piece', '1 can (330ml)', '~150g'",
  "protein_g": number (integer grams, 0 is valid),
  "calories": number (integer kcal),
  "carbs_g": number (integer grams),
  "fat_g": number (integer grams),
  "confidence": "low" | "medium" | "high",
  "notes": "one short sentence — protein tip, label context, or what you assumed about portion size, max 20 words"
}

Only return error: not_a_meal when the photo contains NO edible item, drink, or recognizable food packaging at all (e.g. a chair, a wall, a person's face, an empty plate, scenery). Do NOT return not_a_meal just because the item is a snack, drink, candy, or single fruit — those are all valid logs.

When rejecting:
{"error": "not_a_meal", "meal_name": "Nothing edible", "estimated_portion": "", "protein_g": 0, "calories": 0, "carbs_g": 0, "fat_g": 0, "confidence": "low", "notes": "We couldn't find any food, drink, or food packaging in this photo."}`;

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
