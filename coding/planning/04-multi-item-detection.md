# Multi-item Meal Detection — Research

**Status:** Research, not committed
**Date:** 2026-05-22

---

## TL;DR

**The current AI flow deliberately collapses multi-item photos into one entry.** When a user snaps a photo of pizza + fries + Coke, the AI returns:

```
{ meal_name: "Pizza meal with sides", protein_g: 28, calories: 1145, ... }
```

The user is asking for the **opposite**: detect each item separately, log them as three line items under one meal, with editable per-item macros.

**Recommendation:** build this — but as **Phase 2**, after closed beta confirms users actually take multi-item photos. Effort: ~2 weeks for a polished version, ~1 week for a rough one.

**Why this matters more than other feature requests:** Cal AI (your nearest competitor in AI-photo tracking) does multi-item detection. Side-by-side demos will make LeanScan look weaker if this isn't built before public launch.

---

## 1. The current architecture

From `coding/api/src/services/ai/types.ts`:

```ts
export interface MealEstimate {
  meal_name: string;
  estimated_portion?: string;
  protein_g: number;
  calories: number;
  carbs_g: number;
  fat_g: number;
  confidence: ConfidenceLevel;
  notes?: string;
  error?: string;
}
```

The system prompt explicitly says (line 54):
> "Multiple distinct items in the same photo — **combine them into one entry, summing macros**."

So today: 1 photo → 1 `MealEstimate` → 1 `Meal` DB row.

---

## 2. What the user wants

```
Photo: pizza slice + french fries + Coke can on a tray
  ↓
Detected as 3 items:
  - Pepperoni pizza, 2 slices: 580 kcal, 24g protein, 68g carbs, 22g fat
  - French fries, medium: 365 kcal, 4g protein, 48g carbs, 17g fat
  - Coca-Cola, 1 can (330ml): 139 kcal, 0g protein, 35g carbs, 0g fat
  ↓
User reviews:
  - Removes the Coke (drank water actually)
  - Adjusts pizza portion from 2 slices to 3
  - Saves
  ↓
Stored as ONE meal "Pizza & fries" with 2 sub-items
  ↓
Home screen: 1 meal card titled "Pizza & fries", showing total macros
History day detail: tap the meal, see the 2 individual items
```

---

## 3. Two architecture options

### Option A — Save each item as a separate `Meal` row

**Pros:**
- No schema change required
- Existing `Meal` model handles it
- Each item independently editable / deletable via existing endpoints
- Aggregation works as-is (SELECT SUM on `Meal`)

**Cons:**
- Loses "these were eaten together" grouping
- Home screen shows 3 cards for one photo → cluttered
- History day detail shows 3 entries with the same timestamp
- User mental model is "I had pizza, fries, and Coke" — one meal, not three

### Option B — One `Meal` row with `MealItem` children (recommended) ★

**Pros:**
- Matches user's mental model ("one meal, multiple items")
- One meal card per photo on home/history
- Item-level editing without spam
- Sub-items reusable for "log similar meal tomorrow"
- Cleaner data model long-term

**Cons:**
- New `MealItem` table + migration
- Refactor of meal queries (totals must aggregate from items)
- API response shape changes (backward incompatible)
- Edit UI more complex
- More work overall

**Recommendation: Option B.** Matches mental model, defensible long-term schema, only ~1 extra day of work over Option A.

---

## 4. Schema design (Option B)

```prisma
model Meal {
  id              String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId          String     @map("user_id") @db.Uuid
  loggedAt        DateTime   @map("logged_at") @db.Timestamptz()
  logDate         DateTime   @map("log_date") @db.Date
  mealName        String     @map("meal_name")             // "Pizza & fries"
  estimatedPortion String?   @map("estimated_portion")     // overall portion if helpful
  photoPath       String?    @map("photo_path")
  source          MealSource
  notes           String?
  editedByUser    Boolean    @default(false) @map("edited_by_user")
  createdAt       DateTime   @default(now()) @map("created_at") @db.Timestamptz()
  deletedAt       DateTime?  @map("deleted_at") @db.Timestamptz()

  // Aggregated totals — denormalized for fast home-screen queries.
  // Updated by a trigger or in the service layer whenever items change.
  totalProteinG   Decimal    @map("total_protein_g") @db.Decimal(8, 2)
  totalCalories   Int        @map("total_calories")
  totalCarbsG     Decimal?   @map("total_carbs_g") @db.Decimal(8, 2)
  totalFatG       Decimal?   @map("total_fat_g") @db.Decimal(8, 2)

  items           MealItem[]
  user            User       @relation(fields: [userId], references: [id])

  @@map("meals")
}

model MealItem {
  id          String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  mealId      String  @map("meal_id") @db.Uuid
  position    Int     @default(0)             // order in the list
  itemName    String  @map("item_name")
  estimatedPortion String? @map("estimated_portion")
  proteinG    Decimal @map("protein_g") @db.Decimal(7, 2)
  calories    Int
  carbsG      Decimal? @map("carbs_g") @db.Decimal(7, 2)
  fatG        Decimal? @map("fat_g") @db.Decimal(7, 2)
  confidence  Confidence?
  editedByUser Boolean @default(false) @map("edited_by_user")

  meal        Meal @relation(fields: [mealId], references: [id], onDelete: Cascade)

  @@map("meal_items")
  @@index([mealId])
}
```

**Why denormalized totals on `Meal`:**
- Home screen totals query: simple `SELECT SUM(total_protein_g) FROM meals WHERE log_date = X`
- Avoids JOIN on `MealItem` for every dashboard query
- Update on item change: trivial trigger or service-layer recompute

**Migration path for existing data:**
- All existing meals get a single `MealItem` mirroring their current macros
- Backfill script: ~50 lines, runs once

---

## 5. AI prompt redesign

The current prompt is one-shot JSON. The new prompt needs to:
1. Return an `items` array (1 or more)
2. Still return a meal-level `meal_name` (auto-generated from items)
3. Support the "this is a single item" common case efficiently
4. Stay JSON-only, no commentary

### New JSON shape

```json
{
  "meal_name": "Pizza & fries",
  "items": [
    {
      "item_name": "Pepperoni pizza",
      "estimated_portion": "2 slices",
      "protein_g": 24,
      "calories": 580,
      "carbs_g": 68,
      "fat_g": 22,
      "confidence": "high"
    },
    {
      "item_name": "French fries",
      "estimated_portion": "medium",
      "protein_g": 4,
      "calories": 365,
      "carbs_g": 48,
      "fat_g": 17,
      "confidence": "high"
    }
  ],
  "notes": "Coke can visible but assumed not consumed. Edit if you drank it."
}
```

### New system prompt (replaces existing)

```
You are LeanScan, a nutrition analyzer.

Given a photo, identify EACH distinct edible/drinkable item visible and estimate
nutrition for what the user likely consumed.

Multi-item photos: list each item SEPARATELY in the `items` array. Examples:
  - Burger meal photo → ["Burger", "French fries", "Soft drink"]
  - Indian thali → ["Dal", "Rice", "Roti", "Curry", "Salad"]
  - Snack pile → ["Banana", "Almonds", "Protein bar"]

Single-item photos: still use the items array, just with one entry.

For ambiguous items (e.g., a can visible at the edge of frame), include them
but flag confidence: "low" so the user can choose whether to keep or remove.

[... rest of existing prompt about packaged products, protein-first, edible
items only ...]

Return ONLY valid JSON:
{
  "meal_name": "short combined name, max 6 words",
  "items": [
    {
      "item_name": "name of this item, max 6 words",
      "estimated_portion": "concise portion, e.g. '2 slices', '1 can (330ml)'",
      "protein_g": integer grams,
      "calories": integer kcal,
      "carbs_g": integer grams,
      "fat_g": integer grams,
      "confidence": "low" | "medium" | "high"
    }
  ],
  "notes": "one short sentence about what was assumed, max 20 words"
}

Always at least 1 item. For "not_a_meal" rejections, use the same single-item
fallback as before.
```

### Structured output enforcement

- **Gemini 2.0 Flash:** supports `responseSchema` parameter — pass a JSON schema, get guaranteed-valid JSON
- **Claude (Bedrock or direct):** use tools/JSON mode for guaranteed shape
- **OpenAI:** `response_format: { type: "json_schema", schema: {...} }`

All three providers in your current abstraction support strict JSON. Use it for multi-item — the parsing risk goes up with arrays.

---

## 6. Backend changes (Option B path)

### `services/ai/types.ts`
- New interface `MealItemEstimate`
- `MealEstimate` becomes `{ meal_name, items: MealItemEstimate[], notes }`
- `normalizeEstimate` extended to validate items array
- Update all 4 providers (gemini, openai, azure-openai, bedrock) to use the new prompt + schema

### `routes/meals.ts`
- `POST /v1/meals/photo` → returns `{ items: [...], meal_name }` instead of single estimate
- `POST /v1/meals` → accepts `{ meal_name, items: [...] }` and creates one Meal + N MealItems atomically (transaction)
- `GET /v1/meals?date=X` → returns meals with `items: [...]` populated
- `PATCH /v1/meals/:id` → supports item-level edits (add, remove, edit individual items)
- `GET /v1/meals/days` → already returns aggregates, no change needed (uses denormalized totals)

### Backward compatibility
- Keep the single-item code path working for any old clients
- Old `Meal` rows backfilled to have one `MealItem` each
- API can accept BOTH the old `{ protein_g, calories, ... }` shape AND the new `{ items: [...] }` shape on POST for one release cycle

---

## 7. Mobile UI changes

### Scan review screen (biggest change)
Today: one editable form with name/portion/macros
Tomorrow: scrollable list of items, each with its own form

```
┌─────────────────────────────────────┐
│  Pizza & fries          [Edit name] │
├─────────────────────────────────────┤
│  ▌Pepperoni pizza          [✓] [×] │
│  Portion: [2 slices            ]   │
│  Protein: [24] g    Calories: [580]│
│  Carbs:   [68] g    Fat:      [22]g│
├─────────────────────────────────────┤
│  ▌French fries             [✓] [×] │
│  Portion: [medium              ]   │
│  Protein: [4] g     Calories: [365]│
│  ...                                │
├─────────────────────────────────────┤
│  [+ Add another item]               │
├─────────────────────────────────────┤
│  Total: 28g protein · 945 kcal     │
│  [   Save meal   ]                  │
└─────────────────────────────────────┘
```

Each item:
- Checkmark to keep (default checked) / X to remove from this meal
- Inline editable name, portion, macros
- Confidence indicator dot (low/medium/high) from AI

### Meal detail screen
Add a "Items" section listing each `MealItem` with its macros. User can tap any item to edit it, or tap "+" to add an item manually.

### Home screen meal cards
No change — still one card per meal. Card title is the meal-level `meal_name` ("Pizza & fries"), macros are the meal-level totals. Tap → meal detail shows items.

### History day detail
Same — one card per meal. Tap → expands to items.

### Quick-add chips
"Quick add" today re-logs the whole meal. Now it should re-log the whole meal *with all its items*. Trivial — just include items array in the saveMeal payload.

---

## 8. Effort estimate

| Phase | Work | Time |
|---|---|---|
| Schema migration + backfill | Add MealItem table, denormalize totals on Meal, write migration script | 1 day |
| AI service refactor | New prompt + schema, update 4 providers, structured-output for all | 2 days |
| Backend endpoints | Update photo, save, list, patch, day-detail endpoints + tests | 2 days |
| Scan review UI | New multi-item editable list (the biggest change) | 3 days |
| Meal detail UI | Items section + add/edit/remove items inline | 1 day |
| Backward compat shim | Accept old + new shapes for one release cycle | 0.5 day |
| Testing across providers | Confirm Gemini/Claude/OpenAI all return valid multi-item JSON | 1 day |
| Polish + edge cases | Empty items array, all-removed-items, drag-to-reorder, etc. | 1.5 days |
| **Total** | | **~12 days (2.5 weeks solo)** |

For a rough first cut without backward compat or drag-reorder: **~1 week**.

---

## 9. Cost implications

AI cost per scan:
- **Gemini 2.0 Flash:** still ~$0.0001 (token output goes up slightly with items array — negligible)
- **Claude Sonnet via Bedrock:** ~$0.012 → ~$0.015 (longer output, ~25% more tokens)
- **OpenAI GPT-4o:** ~$0.005 → ~$0.007

So multi-item adds ~10-25% to AI cost per scan. Still well under any reasonable subscription price.

---

## 10. Risks specific to this feature

### Accuracy risk
Multi-item photos are HARDER than single-item. Cal AI's failure modes (per App Store reviews):
- Splits one item into multiple ("rice" + "rice grains")
- Misses items at the edge of frame
- Confuses sauces with main items
- Gives wildly wrong portions for visually similar items

Mitigation:
- High confidence for clear distinct items
- Low confidence + flag for ambiguous ones — user reviews before saving
- Editable everything — last line of defense is user correction

### Cognitive load risk
Today the scan flow is 5 seconds: snap → review one number → save.
Multi-item could push to 30+ seconds if users feel obligated to verify every item.

Mitigation:
- Default: "Save all" button accepts AI's full list
- Item-level editing is opt-in, not required
- Single-item meals look identical to today (1 item in the list)

### UX risk
Bad multi-item detection is WORSE than good single-item, because users have to fix multiple things. If AI is wrong 2x on a 3-item meal, user gives up.

Mitigation:
- Only ship after internal testing on 50+ real photos
- Keep confidence indicators visible
- Allow falling back to "merge into one item" if user prefers

---

## 11. When to build

| Stage | Build this? |
|---|---|
| Pre-launch / closed beta | **No.** Single-item works for testing the core flow. |
| 10-50 beta testers complaining about combined items | **Yes — sprint on it.** Most testers eat multi-item meals at restaurants. |
| Public launch | **Required.** Cal AI does this; you'll lose head-to-head demos without it. |
| Post launch with revenue | **Sprint on accuracy improvements.** |

**Specifically: don't build BEFORE getting closed beta feedback.** Testers will validate or invalidate the priority quickly.

---

## 12. The honest single-meal pushback

Most logged meals are single-item:
- Breakfast: yogurt, oatmeal, coffee — 1 item each
- Lunch: salad bowl, chicken wrap, sandwich — usually 1 item
- Snacks: protein bar, fruit, almonds — 1 item

Multi-item matters most for:
- Restaurant meals (burger + fries + drink)
- Indian thali / Asian rice plates with multiple components
- Holiday/social meals

Per the Alex persona (gym-going recomp), most of their tracked food is at home, single-item, plain. They probably don't NEED multi-item daily.

**But** for the demo / marketing / "wow factor," multi-item is a flagship capability. Cal AI's TikTok ads literally show a tray with 5 items being detected. LeanScan needs that visual demo.

---

## 13. Decision matrix

| Outcome you want | What to do |
|---|---|
| Ship MVP fast, validate first | **Defer.** Current single-meal works. Build in Phase 2. |
| Cal-AI-parity for launch marketing | **Build before public launch.** Demo videos need this. |
| Maximize gym-rat retention | **Defer.** Most home meals are single-item; not a bottleneck. |
| Win restaurant / casual eater segment | **Build sooner.** This segment lives on multi-item meals. |
| Have time to polish accuracy | **Build after 100 paying users.** They'll tell you which combinations break. |

---

## 14. Recommended implementation phasing

1. **Phase 1 (now):** Ship existing single-item flow. Confirm it works in closed beta.
2. **Phase 2 (after 50 beta signups):** Build multi-item detection if ≥30% of testers either complain about combined items OR cite this as a reason they prefer Cal AI.
3. **Phase 3 (before public launch):** Polish accuracy. Internal test on 100+ real multi-item photos. Tune the prompt per provider.
4. **Phase 4 (post-launch):** Allow users to flag bad detection — feed back into prompt tuning.

---

## What this doc is NOT proposing

- A custom-trained vision model (overkill, the LLMs handle it)
- A "manual mode" toggle for users to opt into multi-item (just default to it)
- Drag-and-drop reordering of items (nice but not needed for MVP)
- AI-suggested item swaps ("we detected fries, want grilled vegetables instead?") — Phase 4+
- Meal templates / recipes that pre-load multiple items — Phase 3+

---

## Appendix — backend code sketch

If/when this is built, here's what `POST /v1/meals` would look like (abbreviated):

```ts
mealsRouter.post('/', asyncHandler(async (req, res) => {
  const userId = req.userId!;
  const body = saveMultiItemSchema.parse(req.body);

  const result = await prisma.$transaction(async (tx) => {
    const meal = await tx.meal.create({
      data: {
        userId,
        loggedAt: new Date(),
        logDate: today(),
        mealName: body.meal_name,
        photoPath: body.photo_path,
        source: body.source,
        editedByUser: body.edited_by_user ?? false,
        totalProteinG: body.items.reduce((s, i) => s + i.protein_g, 0),
        totalCalories: body.items.reduce((s, i) => s + i.calories, 0),
        totalCarbsG: body.items.reduce((s, i) => s + (i.carbs_g ?? 0), 0),
        totalFatG: body.items.reduce((s, i) => s + (i.fat_g ?? 0), 0),
        items: {
          create: body.items.map((item, i) => ({
            position: i,
            itemName: item.item_name,
            estimatedPortion: item.estimated_portion,
            proteinG: item.protein_g,
            calories: item.calories,
            carbsG: item.carbs_g,
            fatG: item.fat_g,
            confidence: item.confidence,
          })),
        },
      },
      include: { items: true },
    });
    return meal;
  });

  await debitCredits(userId, 1, 'multi-item save');
  res.json(apiSuccess('Meal saved', { meal: serializeMeal(result) }));
}));
```
