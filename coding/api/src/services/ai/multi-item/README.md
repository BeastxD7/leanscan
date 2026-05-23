# Multi-item Prompt Evaluation

Pre-implementation: validate which prompt strategy is most reliable
before wiring it into production.

---

## What's in here

| File | What |
|---|---|
| `PROMPTS.md` | Design reasoning for the 3 candidate prompts |
| `prompts.ts` | The candidates as TypeScript constants |
| `evaluate.ts` | Runnable harness — runs all 3 against your test photos |
| `README.md` | This file |
| `test-photos/` | Your test images (gitignored) |
| `eval-results/` | Generated outputs (gitignored) |

---

## How to run the eval (~10 minutes once photos are ready)

### Step 1 — Gather 10 test photos

Save them as `.jpg` or `.png` in `coding/api/src/services/ai/multi-item/test-photos/`.

**Recommended mix** (one photo per case):

| # | Test case | What to photograph |
|---|---|---|
| 1 | Single item — control | A plate of plain chicken breast, just one thing |
| 2 | Single packaged product | A bag of chips with visible branding |
| 3 | 2 items — simple combo | Sandwich + can of soda |
| 4 | 3 items — fast food classic | Burger + fries + drink (any chain) |
| 5 | 4–5 items — restaurant tray | Mixed plate, e.g. burrito bowl with rice, beans, meat, salsa, chips |
| 6 | 6+ items — stress test | Indian thali, Korean banchan, dim sum board |
| 7 | Cluttered scene | Meal with utensils, napkins, water glass, sauce bottles visible |
| 8 | Mixed dish (splitting risk) | Indian curry with rice and naan — should it be 1 or 3 items? |
| 9 | Edge-of-frame item | Meal with a drink half-visible at the corner |
| 10 | Not-a-meal — control | A chair or wall — should be rejected cleanly |

For each photo, **write down what the items actually are and roughly
what their macros should be** — you need this to grade accuracy.

Note: Real-world photos work better than studio shots. Use your phone,
not Pinterest.

### Step 2 — Run the harness

From the `coding/api/` directory:

```bash
npx tsx src/services/ai/multi-item/evaluate.ts
```

It will:
- Find your photos in `test-photos/`
- Run all 3 variants against each one (~3 seconds per variant per photo)
- Write per-photo JSON + a summary
- Print progress to console

10 photos × 3 variants = 30 Gemini calls. At Gemini Flash free tier
limits (1500/day), this is trivial. Cost: $0 to a few cents.

### Step 3 — Grade the results

Open `eval-results/summary.md` — it has a row per (photo, variant) with
a blank scoring table. For each row, fill in 1-5 on:

| Score | What you're judging |
|---|---|
| 1-5 | **Item count correct** — right number of items detected? |
| 1-5 | **Item names correct** — did it name what's actually there? |
| 1-5 | **Macros within ±20%** of what you expected? |
| 1-5 | **Confidence calibrated** — low-conf items are the ambiguous ones? |
| 1-5 | **No phantom items** — did NOT invent things that weren't there? |

Each (photo, variant) maxes at 25 points. Sum all photos per variant.

**Highest total wins.** Ties broken by latency (lower wins) and cost
(Variant C uses ~2x tokens of A/B).

### Step 4 — Report back

Send me the variant totals. I'll wire the winning prompt into the
production code path and start the implementation per
`coding/planning/04-multi-item-detection.md`.

---

## Optional flags

```bash
# Run only one variant
npx tsx src/services/ai/multi-item/evaluate.ts --variants A

# Run two variants
npx tsx src/services/ai/multi-item/evaluate.ts --variants B,C

# Custom photo / output dirs
npx tsx src/services/ai/multi-item/evaluate.ts --photos ~/Desktop/test-meals --output ~/Desktop/eval-out
```

---

## What I'd predict before you run it

- **Variant A**: 60–70% (decent baseline, will struggle on cluttered scenes)
- **Variant B**: 75–85% (CoT enumeration helps with ambiguous cases) — **my bet**
- **Variant C**: 80–90% (best, but 2x cost)

If B beats A by 10+ points but C only beats B by 5, ship B. The cost
difference matters at scale.

---

## After you pick a winner

Reply with the totals (e.g., "A=147, B=192, C=205 — going with B"),
and I'll execute the full implementation plan from
`coding/planning/04-multi-item-detection.md`:

- Schema migration (Meal + MealItem)
- AI service refactor with the winning prompt
- Endpoint updates
- Scan-review UI redesign
- Backward-compat shim for one release cycle

Estimated: ~1 week rough, ~2 weeks polished.
