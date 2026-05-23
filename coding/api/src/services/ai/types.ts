/**
 * Common types for any AI vision provider.
 * Every provider in this folder implements `AIVisionProvider`.
 *
 * The system prompt below is "Variant B" — the chain-of-thought
 * enumeration prompt that won the multi-item eval (89.2% vs 86% / 88.4%
 * for variants A and C). See `multi-item/PROMPTS.md` for the design
 * reasoning and `multi-item/evaluate.ts` for the harness used to pick
 * the winner.
 */

export type ConfidenceLevel = 'low' | 'medium' | 'high';

/**
 * One detected item within a meal. Multi-item photos produce multiple
 * MealItemEstimates; single-item photos produce one.
 */
export interface MealItemEstimate {
  item_name: string;
  estimated_portion?: string;
  protein_g: number;
  calories: number;
  carbs_g: number;
  fat_g: number;
  confidence: ConfidenceLevel;
}

/**
 * Full meal-level result. `items` is the source of truth; the top-level
 * protein_g / calories / etc. are denormalized totals (sum across items)
 * kept for backward compatibility with callers that don't iterate items.
 */
export interface MealEstimate {
  meal_name: string;
  items: MealItemEstimate[];
  // Denormalized totals — equal to sum of items[].* — for legacy callers.
  protein_g: number;
  calories: number;
  carbs_g: number;
  fat_g: number;
  // Meal-level confidence = lowest of any item's confidence.
  confidence: ConfidenceLevel;
  estimated_portion?: string;
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
 * This is Variant B from the prompt eval. The Step 1/2/3 framing primes
 * the model to enumerate items before structuring them, which reduced
 * "merge into one entry" errors significantly in testing.
 *
 * Scope: anything edible or drinkable counts — not just plated meals.
 * Snacks, candy, drinks, fruit, supplements, packaged-food wrappers all log.
 * Only reject when the photo contains literally no food/drink/packaging.
 */
export const SYSTEM_PROMPT = `You are LeanScan, a nutrition analyzer.

Step 1 (silent thinking): Look at the photo. List every DISTINCT edible/drinkable item you can identify. Do NOT include utensils, plates, napkins, or empty wrappers (unless empty wrapper is the clear indicator of what was consumed). Mentally tag each item as "high", "medium", or "low" confidence based on visual clarity.

Step 2: For each item, estimate its portion using visual context (plate size, hand reference, standard packaging dimensions).

Step 3: Output strict JSON. NO commentary, NO chain of thought in the output. Just JSON:

{
  "meal_name": "short combined name describing the meal, max 6 words",
  "items": [
    {
      "item_name": "name of this item, max 6 words",
      "estimated_portion": "concise portion, e.g. '2 slices', '1 can (330ml)'",
      "protein_g": <integer grams, 0 valid>,
      "calories": <integer kcal>,
      "carbs_g": <integer grams>,
      "fat_g": <integer grams>,
      "confidence": "low" | "medium" | "high"
    }
  ],
  "notes": "one short sentence about your strongest assumption, max 20 words"
}

Constraints:
- Always at least 1 item. Single-item photos return an array of one.
- 1-8 items max. If you see more, group similar ones.
- Plates, bowls, utensils, napkins, decoration are NOT items.
- A whole packaged product = 1 item. Do not split "chocolate bar" into "chocolate + wrapper".
- Beverages always count as items. Coffee with milk = 1 item ("coffee with milk").
- Sauces/dressings: only as separate item if visually independent (gravy on the side, ketchup blob). Integrated sauces stay with their dish.
- For packaged products with visible branding, use known label values and mark confidence "high".
- Items at the edge of frame or partially visible: confidence "low".
- A single banana = 1 item. Don't split into "banana" + "peel".
- Always lead with PROTEIN — it is the headline number. Zero protein is valid (most candy, most soda).

If the photo contains NO edible item at all, return:
{
  "meal_name": "Nothing edible",
  "items": [{"item_name": "Nothing edible", "estimated_portion": "", "protein_g": 0, "calories": 0, "carbs_g": 0, "fat_g": 0, "confidence": "low"}],
  "notes": "No food, drink, or packaging visible.",
  "error": "not_a_meal"
}`;

// ---------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------

function clampInt(n: unknown, max: number): number {
  return typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.min(max, Math.round(n))) : 0;
}

function pickConfidence(raw: unknown): ConfidenceLevel {
  return raw === 'low' || raw === 'medium' || raw === 'high' ? raw : 'low';
}

function normalizeItem(raw: unknown): MealItemEstimate {
  const obj = (raw ?? {}) as Partial<MealItemEstimate> & {
    name?: string; // common alias
  };
  return {
    item_name:
      typeof obj.item_name === 'string' && obj.item_name.trim()
        ? obj.item_name.trim().slice(0, 120)
        : typeof obj.name === 'string'
          ? obj.name.trim().slice(0, 120)
          : 'Unknown item',
    estimated_portion:
      typeof obj.estimated_portion === 'string' ? obj.estimated_portion.slice(0, 120) : undefined,
    protein_g: clampInt(obj.protein_g, 500),
    calories: clampInt(obj.calories, 5000),
    carbs_g: clampInt(obj.carbs_g, 500),
    fat_g: clampInt(obj.fat_g, 500),
    confidence: pickConfidence(obj.confidence),
  };
}

const CONFIDENCE_RANK: Record<ConfidenceLevel, number> = { low: 0, medium: 1, high: 2 };
function lowestConfidence(items: MealItemEstimate[]): ConfidenceLevel {
  if (items.length === 0) return 'low';
  let lowest: ConfidenceLevel = 'high';
  for (const it of items) {
    if (CONFIDENCE_RANK[it.confidence] < CONFIDENCE_RANK[lowest]) {
      lowest = it.confidence;
    }
  }
  return lowest;
}

/**
 * Normalize provider output into a MealEstimate. Handles:
 *
 *   - New multi-item shape: { meal_name, items: [...], notes, error? }
 *   - Legacy single-item shape: { meal_name, protein_g, calories, ..., error? }
 *     — wrapped into a 1-item array so downstream code sees uniform data
 *   - Rejection shape: { error: "not_a_meal", ... }
 */
export function normalizeEstimate(raw: unknown): MealEstimate {
  const obj = (raw ?? {}) as Record<string, unknown>;

  const mealName =
    typeof obj.meal_name === 'string' && obj.meal_name.trim()
      ? obj.meal_name.trim().slice(0, 120)
      : 'Unknown meal';

  const notes = typeof obj.notes === 'string' ? obj.notes.slice(0, 200) : undefined;
  const error = typeof obj.error === 'string' ? obj.error : undefined;
  const estimatedPortion =
    typeof obj.estimated_portion === 'string' ? obj.estimated_portion.slice(0, 120) : undefined;

  // Multi-item shape (new)
  let items: MealItemEstimate[];
  if (Array.isArray(obj.items) && obj.items.length > 0) {
    items = obj.items.slice(0, 12).map(normalizeItem);
  } else {
    // Legacy single-item shape — wrap top-level macros as one item
    items = [
      normalizeItem({
        item_name: mealName,
        estimated_portion: estimatedPortion,
        protein_g: obj.protein_g,
        calories: obj.calories,
        carbs_g: obj.carbs_g,
        fat_g: obj.fat_g,
        confidence: obj.confidence,
      }),
    ];
  }

  // Denormalized totals (sum across items)
  const totals = items.reduce(
    (acc, it) => {
      acc.protein_g += it.protein_g;
      acc.calories += it.calories;
      acc.carbs_g += it.carbs_g;
      acc.fat_g += it.fat_g;
      return acc;
    },
    { protein_g: 0, calories: 0, carbs_g: 0, fat_g: 0 },
  );

  return {
    meal_name: mealName,
    items,
    protein_g: Math.round(totals.protein_g),
    calories: Math.round(totals.calories),
    carbs_g: Math.round(totals.carbs_g),
    fat_g: Math.round(totals.fat_g),
    confidence: lowestConfidence(items),
    estimated_portion: estimatedPortion,
    notes,
    error,
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
