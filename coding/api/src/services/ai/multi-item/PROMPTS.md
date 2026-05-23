# Multi-item Vision Prompts — 3 Candidates

**Status:** Pre-evaluation. Pick a winner via `evaluate.ts` before
wiring into the production AI service.

---

## Design problem

The current single-item prompt explicitly collapses multi-item photos
("combine them into one entry"). We need the opposite: detect each item
separately with per-item macros.

Known failure modes from competitor research (Cal AI, calorie-mama):

1. **Splitting one item into many** — "rice" becomes "rice + grains + bowl"
2. **Merging distinct items** — pizza + fries return as one "American meal"
3. **Phantom items** — utensils, plates, napkins get nutrition values
4. **Missed items** — drinks at the edge of frame ignored
5. **Hallucinated portions** — generic "1 serving" when portion is clearly small/large
6. **Overconfidence** — high confidence on items with visible label ambiguity

The three prompt variants below take different strategies to mitigate
these failure modes. Run the eval, pick the winner.

---

## Variant A — Direct enumeration (baseline)

**Strategy:** simplest possible. One-shot JSON with items array.
**Token cost:** ~250 input + ~400 output = ~650 tokens
**Theoretical accuracy:** baseline
**Best for:** simple single/dual-item meals; minimal cost

```
You are LeanScan, a nutrition analyzer.

Identify EACH distinct edible or drinkable item in the photo. Estimate
macros per item separately. Return ONLY valid JSON with this shape:

{
  "meal_name": "short combined name, max 6 words",
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
  "notes": "one short sentence about what you assumed, max 20 words"
}

Rules:
- Always at least 1 item. Single-item photos return an array of one.
- Plates, bowls, utensils, napkins are NOT items.
- A whole packaged product = 1 item. Do not split "chocolate bar" into
  components.
- Drinks count as items. Coffee with milk = 1 item ("coffee with milk").
- Sauces / dressings: if clearly poured (gravy, ketchup), include as
  separate item with low confidence. If integrated into the dish
  (carbonara sauce on pasta), do NOT separate.
- For packaged products with visible branding, use known label values
  and mark confidence: "high". Otherwise generic estimate, confidence
  "low" or "medium".
- Cap at 8 items max. If you see more, group similar ones.
- Always lead with PROTEIN. Zero protein is valid (most candy, most soda).

If the photo contains NO edible item at all, return:
{
  "meal_name": "Nothing edible",
  "items": [{"item_name": "Nothing edible", "estimated_portion": "",
             "protein_g": 0, "calories": 0, "carbs_g": 0, "fat_g": 0,
             "confidence": "low"}],
  "notes": "No food, drink, or packaging visible."
}
```

---

## Variant B — Chain of thought enumeration

**Strategy:** force the model to plan before structuring. Enumerate
items in plain text first, then convert to JSON. Reduces hallucination
and splitting errors.
**Token cost:** ~250 input + ~600 output = ~850 tokens (~30% more)
**Theoretical accuracy:** better on ambiguous / cluttered scenes
**Best for:** restaurant trays, mixed plates, Indian thali

```
You are LeanScan, a nutrition analyzer.

Step 1 (silent thinking): Look at the photo. List every DISTINCT
edible/drinkable item you can identify. Do NOT include utensils, plates,
napkins, or empty wrappers (unless empty wrapper is the clear indicator
of what was consumed). Mentally tag each item as "high", "medium", or
"low" confidence based on visual clarity.

Step 2: For each item, estimate its portion using visual context (plate
size, hand reference, standard packaging dimensions).

Step 3: Output strict JSON. NO commentary, NO chain of thought in the
output. Just JSON:

{
  "meal_name": "short combined name describing the meal, max 6 words",
  "items": [
    {
      "item_name": "name of this item, max 6 words",
      "estimated_portion": "concise portion, e.g. '2 slices', '1 can (330ml)'",
      "protein_g": <integer grams>,
      "calories": <integer kcal>,
      "carbs_g": <integer grams>,
      "fat_g": <integer grams>,
      "confidence": "low" | "medium" | "high",
      "location_hint": "where in the frame, e.g. 'center', 'top-left', 'edge'"
    }
  ],
  "notes": "one short sentence about your strongest assumption"
}

Constraints:
- 1-8 items. Anything more = group similar.
- Sauces/dressings: only as separate item if visually independent (gravy
  on the side, ketchup blob). Integrated sauces stay with their dish.
- Beverages always count as items.
- Branded packaged products: use known label values, confidence "high".
- Items at the edge of frame or partially visible: confidence "low".
- A single banana = 1 item. Don't split into "banana" + "peel".

If photo has nothing edible:
{
  "meal_name": "Nothing edible",
  "items": [{"item_name": "Nothing edible", "estimated_portion": "",
             "protein_g": 0, "calories": 0, "carbs_g": 0, "fat_g": 0,
             "confidence": "low", "location_hint": ""}],
  "notes": "No food or drink visible."
}
```

Why this works:
- The Step 1/2/3 framing primes the model to enumerate before
  structuring, reducing the "American meal" merger failure
- `location_hint` doesn't go to the user but improves model attention
  (similar to how grounding boxes work in vision models)
- Explicit examples of what NOT to split ("banana + peel") preempt
  common over-splitting errors

---

## Variant C — Two-pass (most accurate, 2x cost)

**Strategy:** call the model TWICE. First call enumerates items; second
call estimates macros for each. Most expensive but highest accuracy on
complex scenes.
**Token cost:** ~300 input + ~150 output (pass 1) + ~400 input + ~400 output (pass 2)
= ~1,250 tokens total (~2x baseline)
**Theoretical accuracy:** best on cluttered / restaurant scenes
**Best for:** if accuracy beats cost (premium tier?)

### Pass 1 — enumerate only

```
You are a visual food identifier. Look at the photo and list every
distinct edible or drinkable item you can identify, in plain text,
one per line.

Format each line as:
[item_name] | [estimated_portion] | [confidence: low/medium/high]

Rules:
- 1-8 lines maximum.
- Do NOT include utensils, empty plates, napkins, decoration.
- Drinks count.
- Wrappers count IF they clearly indicate what was consumed.
- For branded packaged products, name the brand.
- One line per distinct item, no nutrition data yet.

Example output for a burger meal photo:
Bacon cheeseburger | 1 burger (large) | high
French fries | medium portion (~140g) | high
Coca-Cola | 1 medium cup (~16oz) | medium

If nothing edible visible:
Nothing edible | | low
```

### Pass 2 — estimate macros

```
You are a nutrition estimator. For each food/drink item listed below,
return per-serving macros as JSON.

Items to estimate (from previous detection):
{ITEMS_FROM_PASS_1}

Return ONLY this JSON shape:
{
  "meal_name": "short combined name",
  "items": [
    {
      "item_name": "...",
      "estimated_portion": "...",
      "protein_g": <int>,
      "calories": <int>,
      "carbs_g": <int>,
      "fat_g": <int>,
      "confidence": "low" | "medium" | "high"
    }
  ],
  "notes": "one short sentence"
}

Use known label values for branded products. For homemade items, use
standard cookbook estimates. Always lead with PROTEIN — it is the most
important macro for our user.
```

Why two-pass:
- Separating detection from estimation reduces cognitive load on the
  model — each step has one job
- Pass 1 output is auditable in isolation (easier to debug accuracy)
- Pass 2 doesn't need vision, so a cheaper text model could be used
  (e.g., Gemini 2.0 Flash for pass 1, GPT-4o-mini for pass 2)
- BUT 2x the latency and code complexity

---

## How to choose

Run the eval harness (`evaluate.ts`) with ~10 representative test photos
covering:

| Test case | Why test it |
|---|---|
| Single item (chicken breast on plate) | Make sure we don't regress single-item |
| 2 items (sandwich + chips) | Common lunch case |
| 3 items (burger + fries + drink) | Classic fast-food photo |
| 5+ items (Indian thali / Korean banchan) | Stress test |
| Cluttered scene (utensils, napkins, plate) | Phantom-item resistance |
| Ambiguous mixed dish (curry with rice and naan) | Splitting resistance |
| Drink + meal | Beverage detection |
| Branded packaged product | Label lookup |
| Empty wrapper (KitKat wrapper visible) | Wrapper-as-indicator handling |
| Not-a-meal control (chair, wall) | Rejection accuracy |

Score each variant per test case on:
1. **Item count correct** (right number of items)
2. **Item names correct** (named what's actually there)
3. **Macros within ±20%** of expected (use FNDDS / known label values)
4. **Confidence calibrated** (low-conf items are the ambiguous ones)
5. **No phantom items** (didn't invent things)

Total score / 50. Highest wins.

---

## My prediction before running the eval

- **Variant A**: 60-70% accuracy. Good baseline, will struggle on cluttered scenes.
- **Variant B**: 75-85% accuracy. The CoT enumeration step helps with ambiguous cases. **My bet for winner.**
- **Variant C**: 80-90% accuracy. Best but 2x cost. Worth it only if premium tier exists.

If A and B are close, ship A for cost. If B is significantly better, ship B. C only if you need top accuracy for marketing demos.

---

## After picking a winner

Once you tell me which variant scored highest, I'll:
1. Wire that exact prompt into `services/ai/types.ts`
2. Update `MealEstimate` interface to include `items[]`
3. Update Gemini, OpenAI, Bedrock providers (Azure-OpenAI already inherits)
4. Add structured-output enforcement via JSON schema (Gemini's `responseSchema`, OpenAI's `response_format`)
5. Build the Postgres `MealItem` table + migration
6. Refactor the endpoints
7. Refactor the scan review UI

Estimated: ~2 weeks for full implementation. ~1 week if we skip UI polish.
