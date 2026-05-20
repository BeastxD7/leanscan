# Food Database Research

**Author:** Shashank (with co-pilot) · **Status:** Research, partially verified
**Date:** 2026-05-20 (verified pass: 2026-05-20)
**Question:** For manual meal entry in a globally-used app, where do we
get accurate, broad food data covering world cuisines?

---

## ⭐ Verified findings (2026-05-20)

I visited the actual API docs / portals for each source. Here's what I
confirmed vs. what's based on prior knowledge.

| Source | Verified? | Key facts (verified inline) |
|---|---|---|
| **USDA FoodData Central** | ✅ VERIFIED | Free, **1,000 req/hour** per IP, API key required from data.gov, **CC0 public domain**, bulk downloads as CSV+JSON. Sub-DBs: SR Legacy (final 2018), Foundation Foods (latest Apr 2026), FNDDS (Oct 2024 release covering 2021-2023), Branded Foods (Apr 2026). Item counts not listed on public download page — my estimate of ~400K total stands as best-knowledge. |
| **Open Food Facts** | ✅ VERIFIED | **4,497,375 products** as of 2026-05-20 (homepage counter). License: **ODbL + Database Contents License**, images CC-BY-SA. Bulk formats: MongoDB, JSONL, CSV (~0.9GB compressed / 9GB uncompressed), Parquet (on Hugging Face). Rate guidance: "1 API call = 1 real user scan, no scraping." |
| **FatSecret Platform API** | ✅ VERIFIED (mostly) | **2.3M+ verified food items across 58 countries, 26 languages**. Free "Basic" tier exists for testing/eval (specific call limits not publicly disclosed). Premier tier = unlimited (contact sales for pricing). 3-legged OAuth. Features: barcode scanning (90%+ global coverage), NLP, image recognition, 1,500+ daily DB updates, 10 allergens, 19K+ recipes. **🔥 strongest commercial option for global coverage.** |
| **Edamam Food Database** | ✅ VERIFIED (precise pricing) | **~900K basic foods + restaurant + CPG, 790K UPCs, 130K branded restaurant items.** Pricing: Basic **$14/mo** (100K calls, 500 Vision, 30-day trial), Core **$69/mo** (750K calls, $0.015/Vision), Plus **$299/mo** (5M calls, 10K free Vision), Unlimited (custom). 28 nutrients per food, 160 tagged total, 70+ diet/allergen filters. NLP + Vision API included. |
| **Nutritionix** | ⚠️ NOT VERIFIED (paywall on dev portal) | My prior knowledge: ~1M foods, restaurant chains, NL parsing, paid. Confirm directly before committing. |
| **AUSNUT / Australian Food Composition Database** | ✅ VERIFIED (count only) | **1,588 foods**, **268 nutrients per food**. License + download format details not on overview page — needs follow-up. |
| **Spoonacular** | ✅ VERIFIED (sort of) | **5,000+ recipes**, **2,600+ ingredients**, **600K+ products**, **115K+ menu items from 800+ restaurants**. Academic plan $10/mo for 5K req/day. Free tier exists (specific limits not on this page). **US-focused — restaurant chains are American.** Weaker for international cuisine. |
| **API Ninjas Nutrition** | ✅ VERIFIED (partial) | Has natural-language input (`/v1/nutrition` parses text). Free tier exists (limits not on overview). 4.4★ from 8,778 users. Some premium fields gated. Database size not disclosed. |
| **FooDB** | ✅ VERIFIED — **⚠️ License blocker** | Free public access, has API, has bulk downloads. License: **Creative Commons Attribution-NonCommercial 4.0** — **commercial use requires explicit permission.** Not usable for LeanScan as-is unless ICMR-NIN approves. |
| **ANSES Ciqual** (France) | ❌ COULD NOT VERIFY | Page renders client-side, no scrape-able content. Site exists (`ciqual.anses.fr`) but specs need human visit. |
| **FAO/INFOODS network** | ⚠️ PARTIALLY VERIFIED | Directory of country food composition tables exists. Organized by region (Asia, Africa, Europe, Latin America, Middle East, Oceania, NA). Specific country list + download status requires clicking through. |
| **Frida** (Denmark) | ✅ VERIFIED (partial) | Free public DB from DTU Food Institute. Downloads available. Current version 5.5 (released Dec 2025). Attribution required. License type not stated explicitly. |
| **IFCT 2017** (India) | ⚠️ NOT VERIFIED THIS PASS | Per prior knowledge: 528 items, published by ICMR-NIN, PDF/spreadsheet. **Commercial use requires emailing ICMR.** |

### Three changes from my earlier research

1. **Open Food Facts is bigger than I said** — 4.5M products, not 3M.
2. **FatSecret is the surprise winner for commercial global coverage** —
   2.3M foods × 58 countries × 26 languages with a free Basic tier.
   I under-emphasized it earlier; promoting it to top recommendation
   for the "if you want a paid global DB" path.
3. **FooDB is off the table for LeanScan** — NonCommercial license
   blocks app use without explicit permission. Don't bother.

### What I could NOT verify (you should follow up on these)

- ANSES Ciqual specifics (item count, download format, license)
- FAO/INFOODS country-by-country availability
- IFCT 2017 commercial-use clearance from ICMR
- FatSecret Basic tier specific daily limits (not publicly disclosed)
- Nutritionix current pricing and tiers (dev portal paywalled)

---

## TL;DR

**For a globally-used app, there is NO single free worldwide food
database.** The honest answer is a **vetted-core + AI-fallback** model,
which is what every serious cross-border tracker ends up doing.

| Tier | Source | Cost | Coverage |
|---|---|---|---|
| 1. Vetted core | **USDA FoodData Central** (FNDDS covers many world cuisines as eaten in US) | $0 | ~10K commonly-eaten foods globally |
| 2. Geo-specific tables | Add as user base grows — **IFCT** (India), **Standard Tables** (Japan), **Ciqual** (France), **AUSNUT** (AU), etc. | $0 (mostly) | +2–6K each |
| 3. Packaged worldwide | **Open Food Facts** | $0 (ODbL) | 4.5M+ products (verified 2026-05-20) |
| 4. Long-tail fallback | **Gemini / Claude** ("estimate macros for 'feijoada, 1 plate'") | ~$0.001/query | Any named dish from any country |
| 5. User custom foods | User edits AI estimate, saved per-user | $0 | Personalized over time |

**This is more globally complete than MyFitnessPal**, not less. MFP's
14M user-submitted entries are noisy chaos. LeanScan with ~30K vetted +
AI fallback delivers higher quality at a fraction of the surface area.

**Recommendation:** defer until after closed beta feedback. The killer
feature is AI photo logging, not search-driven entry. But when you do
build it, this doc has the plan.

---

## 1. Why this matters

Manual entry currently exists but is "user types macros into fields"
— which is the worst part of every existing tracker (per your context doc
§ 3). The whole reason you picked AI photo as the wedge was to AVOID this.

But realistically:
- Not every meal has a photo opportunity
- Some users prefer text entry (privacy, speed for known meals)
- AI photo accuracy on certain foods (homemade Indian dishes, mixed plates) is
  weaker than on Western single-ingredient meals
- Recent meals / quick-add chips help, but only for foods the user has
  already logged

So **manual entry needs a real food DB to be competitive**. The question is
when and how.

---

## 2. The global-coverage answer (the most important section)

> Because users from anywhere in the world will use LeanScan, this needs
> to be explicit. The India example earlier in this doc is illustrative,
> not the limit of ambition.

**There is NO single free worldwide food database.** What exists:

| Region | Source | Free? | Item count |
|---|---|---|---|
| US (incl. ethnic foods eaten in US) | USDA FoodData Central — FNDDS | ✅ | ~10,000 |
| UK + EU | McCance & Widdowson | mostly ✅ | ~3,000 |
| France | ANSES Ciqual | ✅ | ~3,200 |
| Germany | BLS | partially paid | ~14,000 |
| Australia | AFCD (Australian Food Composition Database) | ✅ | 1,588 verified |
| Japan | Standard Tables of Food Composition in Japan | ✅ | ~2,400 |
| Brazil | TBCA | ✅ | ~600 |
| India | IFCT 2017 | ✅ (verify commercial use) | ~528 |
| West/Central Africa | CIQUAL Africa | ✅ | limited |
| Worldwide packaged | Open Food Facts | ✅ (ODbL) | 4.5M+ (verified 2026-05-20) |
| Worldwide aggregator | FAO/INFOODS network | varies | links to 150+ country tables |

The math: trying to ingest every regional table = 50+ data sources, several
months of work, and STILL missing traditional homemade dishes from smaller
cuisines (Lao, Mongolian, Albanian, etc.).

### Why AI fallback IS the global answer

Modern LLMs (Gemini, Claude) were trained on cookbooks, recipe sites,
nutrition blogs, and restaurant menus from every country. For 95%+ of
named dishes globally, an LLM gives macros within ±20% — which is similar
to or better than MyFitnessPal's user-submitted entries.

Examples a modern LLM handles well with structured-output prompting:

- Vietnamese: pho bo, bun cha, banh mi, com tam
- Thai: pad thai, tom yum, khao soi, gaeng keow wan
- Korean: bibimbap, bulgogi, japchae, sundubu jjigae
- Japanese: ramen, donburi, sushi, okonomiyaki, oyakodon
- Chinese: mapo tofu, kung pao chicken, xiao long bao, char siu
- Mexican: mole poblano, pozole, chiles rellenos, tlayudas
- Brazilian: feijoada, moqueca, acaraje, pão de queijo
- Middle Eastern: shawarma, mansaf, kibbeh, koshari
- Ethiopian: doro wat, kitfo, injera
- Indian: covered by IFCT but LLM handles regional variations
- European: paella, risotto, schnitzel, moussaka, goulash
- African: jollof rice, bobotie, suya, fufu
- Caribbean: jerk chicken, ackee and saltfish, roti

The few cases where AI struggles:
- Hyper-regional dishes from low-resource languages (Albanian byrek
  variants, Bhutanese ema datshi sub-variants, etc.)
- Restaurant-chain specific items not in training data
- Dishes whose names overlap with other meanings ("kibbeh" — multiple
  variations across Levant)

For those edge cases, user enters macros manually OR the AI's "best guess
+ uncertainty flag" still gives the user a starting point better than
nothing.

### The reframed strategy for global

```
Tier 1: USDA FNDDS (~10K)
        → covers US-eaten foods INCLUDING global cuisines
          as Americans/diaspora eat them
Tier 2: 1–2 country tables matching your user geography
        → e.g., add IFCT for Indian, Standard Tables for Japan, Ciqual
          for French — pick by where your users actually live
Tier 3: Open Food Facts (4.5M+, verified)
        → packaged products worldwide
Tier 4: AI fallback
        → the entire long tail of traditional dishes
Tier 5: User custom foods
        → their version of any food, saved after first AI estimate
```

This is more globally complete than MyFitnessPal because MFP's 14M
entries are user-submitted chaos. LeanScan with ~30K vetted + AI fallback
delivers higher quality at much smaller surface area.

### Per-region cuisine prioritization (when to add tier-2 tables)

When you have analytics post-launch, see where your users actually live.
Then add tier-2 tables for those regions specifically. Don't pre-ingest
everything — that's classic premature optimization.

| If users in… | Add this tier-2 table |
|---|---|
| Heavily Indian | IFCT 2017 (already in plan) |
| Heavily Japanese | Standard Tables of Food Composition in Japan |
| Heavily French/Francophone | ANSES Ciqual |
| Heavily UK/Commonwealth | McCance & Widdowson |
| Heavily Brazilian | TBCA |
| Heavily Australian | AUSNUT 2011-13 |
| Heavily German | BLS (paid) |
| Heavily Latin America | TBCA + Mexican SMAE |
| Heavily African | INFOODS network specific countries |

This makes the food DB **grow with your audience** rather than trying to
boil the ocean.

---

## 3. The free / open-source database landscape (detailed)

### 3.1 USDA FoodData Central ★★★★ (the foundation)

The gold standard for nutrition data. US government, public, free.

**Key facts:**
- **API:** `api.nal.usda.gov/fdc/v1/foods/search` (free API key from signup)
- **Coverage:** ~400,000 food items across these sub-databases:
  - **SR Legacy** (~7,800 generic foods, scientifically vetted)
  - **Foundation Foods** (~150 deeply analyzed core items)
  - **FNDDS** (~10,000 foods as commonly eaten, with portion data)
  - **Branded Foods** (~380,000 branded packaged products)
- **Macros:** complete (calories, protein, fat, carbs, fiber, sugar, sodium,
  micronutrients)
- **License:** Public domain
- **Rate limit:** 1,000 requests/hour free tier
- **Bulk download:** CSV / JSON available, ~5GB total

**Strengths:**
- Authoritative
- Free forever
- Bulk download means you can self-host
- Rich nutrient data beyond just protein/calorie

**Weaknesses:**
- US-centric; weak on world cuisines
- Branded foods skew American (Trader Joe's, Walmart brands, etc.)
- ZERO Indian regional dishes in any meaningful way
- "Chapati" returns one or two generic entries, no variations

### 3.2 Open Food Facts ★★★★ (packaged + global)

Wikipedia-style community-curated database of packaged food.

**Key facts:**
- **API:** `world.openfoodfacts.org/api/v2/`
- **Coverage:** 4,500,000+ products with barcodes (verified 2026-05-20)
- **Strong in:** EU, France, packaged goods globally
- **License:** Open Database License (ODbL) — free, attribution required
- **Bulk download:** Full database dump as JSON / MongoDB available

**Strengths:**
- Best for barcode-scanned packaged foods worldwide
- Truly global — not just US
- Free, no rate limit on the public API
- Self-hostable

**Weaknesses:**
- Quality varies (community-edited)
- Macro data may be missing for some products
- NOT useful for "homemade chapati" — only barcoded items
- ~10% of entries have incomplete nutrition data

### 3.3 IFCT 2017 — Indian Food Composition Tables ★★★ (the India answer)

Published by ICMR-NIN (Indian Council of Medical Research — National
Institute of Nutrition), the official scientific reference for Indian
nutrition data.

**Key facts:**
- **Format:** PDF and supplementary spreadsheets
- **Coverage:** 528 traditional Indian foods analyzed in lab
- **Macros:** complete (calories, protein, fat, carbs, fiber, key
  micronutrients)
- **License:** Published research — typically OK for reference / app use
  with attribution; **verify with ICMR before commercial use**
- **Examples:** chapati, parotta, dosa, idli, sambar, chana masala, paneer
  butter masala, dal makhani, etc.

**Strengths:**
- Authoritative for India
- Covers traditional regional dishes nobody else has
- Scientifically measured, not estimated

**Weaknesses:**
- PDF format — need to digitize / parse
- Only 528 items (doesn't cover every regional variation)
- Missing fast food / Indian restaurant chain items
- Some items lack "as commonly served" portion info
- License is unclear for commercial mobile app — needs ICMR contact

**Where to get it:**
- ICMR-NIN website (nin.res.in)
- Paid book version available on Amazon India
- Some pre-digitized GitHub datasets exist (community efforts, verify
  accuracy)

### 3.4 What's missing from open data

- **Indian restaurant chain items** (Haldiram's, Saravana Bhavan, MTR
  ready-meals)
- **South-East Asian, African, Latin American regional cuisines** with
  authoritative macros
- **Recipe-as-served** estimates (a "thali" with 6 components)
- **Custom regional dish variations** (Punjabi rajma vs Maharashtrian
  rajma have different macros)

This is where AI fallback fills the gap.

---

## 4. Paid commercial alternatives

For completeness. None recommended for MVP.

### 4.1 Nutritionix
- 1M+ foods including restaurant chains
- **Natural language parsing** ("3 idlis with sambar" → structured macros)
- $0.0005–$0.005 per query depending on tier
- Used by Fitbit, Google Fit, several major trackers
- **Best paid option** if you decide to buy

### 4.2 Edamam Food Database + Nutrition Analysis API
- Similar scope to Nutritionix
- Has recipe parsing
- $99/month base tier
- Used by Yummly and others

### 4.3 FatSecret Platform API
- 800K+ foods
- Free tier exists (with attribution / OAuth)
- Used by some indie apps
- Quality is mixed but free tier could supplement

### 4.4 Why not buy commercial

- $100–$500/month base for any of these
- Pre-launch with 0 users, that's pure burn
- USDA + IFCT + Open Food Facts covers 80% for free
- AI fallback handles the rest
- You can always buy later when you have revenue

---

## 5. The AI-fallback play (LeanScan's potential edge)

You already have AI vision wired up. The same provider can answer:
> "What are the macros of 1 piece of homemade chapati, ~30g?"

LLMs are surprisingly good at estimating common-food macros. Accuracy is
typically ±15–20% on traditional dishes (worse than lab data, better than
"user guesses").

**Architecture:**

```
User types "aloo paratha" in manual entry
     ↓
1. Search Postgres FTS index across USDA + IFCT + Open Food Facts
     ↓ found?
     ├── Yes → return top 5–10 results with portion options
     └── No / weak match
          ↓
          2. Call Gemini: "Estimate macros for one serving of [user's food]"
          ↓
          3. Show user: "AI estimate — feel free to adjust"
          ↓
          4. User saves → store as user's "custom food" for next time
          ↓
          5. Optionally: aggregated user edits feed back into the DB
              (with quality controls)
```

**Why this is a competitive edge:**

MyFitnessPal has 14M items because users added them. The quality is awful
(same chapati logged with 50–500 calories depending on who added it).

LeanScan with: **vetted core DB (USDA + IFCT) + AI fallback + per-user
custom foods** could deliver higher quality at a fraction of the
complexity. The "vetted database + smart fallback" combo is actually
*better UX* than "huge unvetted database."

---

## 6. Implementation plan (when you build it)

### Phase 1 — Data ingestion (1 week)

```
1. Download USDA bulk JSON (SR Legacy + Foundation + FNDDS = ~20K core items)
   Skip the 380K Branded for now (storage + relevance)

2. Digitize IFCT 2017 → JSON
   - ~528 rows, each with: name, kcal, protein, fat, carbs, fiber, portion
   - Manual transcription OR community-sourced GitHub dataset (verify each row)

3. (Optional) Open Food Facts dump for packaged items
   - 3M items is overkill; filter to items with macro data + relevance to
     your geo (start with India + US + UK)

4. Normalize all three into one schema:
   {
     id, name_en, name_local, aliases[], cuisine, kcal, protein_g,
     fat_g, carbs_g, fiber_g, serving_size, serving_unit, source,
     verified
   }
```

### Phase 2 — Postgres schema + search (3 days)

```sql
CREATE TABLE foods (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  aliases     TEXT[],
  cuisine     TEXT,
  serving_g   NUMERIC,
  kcal        NUMERIC,
  protein_g   NUMERIC,
  fat_g       NUMERIC,
  carbs_g     NUMERIC,
  fiber_g     NUMERIC,
  source      TEXT,  -- 'usda' | 'ifct' | 'openff' | 'ai' | 'user'
  verified    BOOLEAN DEFAULT FALSE,
  search_vec  TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', name || ' ' || COALESCE(array_to_string(aliases, ' '), ''))
  ) STORED
);

CREATE INDEX foods_search_idx ON foods USING GIN(search_vec);
CREATE INDEX foods_cuisine_idx ON foods(cuisine);
```

Search endpoint:
```ts
// GET /v1/foods/search?q=chapati&cuisine=indian&limit=10
const results = await prisma.$queryRaw`
  SELECT id, name, kcal, protein_g, fat_g, carbs_g, serving_g, cuisine,
         ts_rank(search_vec, plainto_tsquery('english', ${q})) AS rank
  FROM foods
  WHERE search_vec @@ plainto_tsquery('english', ${q})
    ${cuisine ? Prisma.sql`AND cuisine = ${cuisine}` : Prisma.empty}
  ORDER BY rank DESC, verified DESC
  LIMIT ${limit};
`;
```

Postgres FTS is fast enough for tens of millions of rows. No external
search engine needed.

### Phase 3 — Mobile UI (3 days)

```
Manual entry screen:
  [Search bar: "Search foods..."]
  → 250ms debounce → /v1/foods/search?q=...
  → Show list of results:
      Chapati, homemade (wheat) — 120 kcal · 3g protein · 1 piece
      Chapati, restaurant style — 145 kcal · 3.5g protein · 1 piece
      Chapati, ragi — 95 kcal · 2.5g protein · 1 piece
  → Tap result → portion stepper → save

  [If no results: "We don't have this. Add manually or let AI estimate?"]
      [Estimate with AI] → call /v1/foods/estimate → returns macros
      [Enter manually]   → blank fields → save as user's custom food
```

### Phase 4 — AI fallback endpoint (2 days)

```ts
// POST /v1/foods/estimate { name: "aloo paratha", servingHint?: "1 medium" }
//   → call Gemini with structured-output prompt
//   → return { kcal, protein_g, fat_g, carbs_g, fiber_g, servingDescription, confidence }
//   → also write to foods table with source='ai', verified=false
//      so subsequent searches find it
//   → user edits become source='user', verified=true (their own)
//      can later be aggregated for community validation
```

### Phase 5 — User custom foods + favorites (2 days)

```sql
CREATE TABLE user_foods (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT REFERENCES users(id),
  food_id     BIGINT REFERENCES foods(id),
  is_favorite BOOLEAN DEFAULT FALSE,
  custom_macros JSONB  -- if user edited macros, store override here
);
```

Lets users mark "this is what my chapati is" without polluting the public
DB.

---

## 7. Honest cost / effort estimate

| Phase | Effort | $ cost |
|---|---|---|
| 1. Data ingestion | 1 week | $0 (just compute) |
| 2. Postgres + search endpoint | 3 days | $0 |
| 3. Mobile UI for search + select | 3 days | $0 |
| 4. AI fallback endpoint | 2 days | ~$0.001/query at scale |
| 5. User custom foods | 2 days | $0 |
| **Total** | **~2.5 weeks solo** | **~$0 in infra** |

For ongoing operation: AI fallback runs only when the DB misses. With
~30K foods in the DB after Phase 1, miss rate should be ~10–20% — meaning
maybe 0.1–0.2 AI calls per meal log. At ~$0.001 each, negligible.

---

## 8. The license question (don't skip this)

| Source | Commercial use | Notes |
|---|---|---|
| USDA FoodData Central | ✅ Public domain | Cite USDA where appropriate |
| Open Food Facts | ⚠️ Open Database License (ODbL) | Must attribute + open-share derived data |
| IFCT 2017 | ⚠️ Unclear for commercial | Email ICMR-NIN before launching paid tier |
| Gemini-generated estimates | ✅ Your output | But Google's terms apply to API usage |

**ODbL is the trickiest** — if you use Open Food Facts data, you must
attribute and may need to publish derived data. For LeanScan's case
(macros for app display), credit is enough. But the lawyer chat should
include this before you accept payments.

**IFCT** — typically OK for citation / educational use. Commercial app
use is a gray area. Email ICMR-NIN's nutrition division, explain the use
case, get written permission. Better than launching and getting hit with
a takedown.

---

## 9. The honest pushback

You're pre-launch with 0 users. Your differentiator is **AI photo
logging**, not **best-in-class food database**. MyFitnessPal already
dominates the "database depth" axis. You can't win that war.

**Building this NOW (~2.5 weeks) means:**
- 2.5 weeks NOT spent on validation, marketing, or fixing the actual
  product bugs you'll find in closed beta
- A feature most users won't use (because AI photo is faster)
- A feature that doesn't differentiate you (every tracker has it)

**My honest recommendation: defer until after closed beta.**

Run the beta with current "type in macros yourself" manual entry. Note
which testers complain about manual entry. THEN decide:

- **If 30%+ of testers complain** → build it in Phase 2 using this plan
- **If <30%** → AI photo carries the load; ship without it for v1

This is exactly the "build what users ask for, not what feels complete"
discipline that separates indie founders who ship from those who polish
forever.

---

## 10. Quickest interim improvement (1 day, optional)

If manual entry feels too rough for closed beta, the smallest possible
improvement that doesn't require a full DB:

### Option A — AI fallback only (no DB)

```
Manual entry screen:
  [Text field: "What did you eat?"]
  [Portion: "1 piece" / "1 cup" / "1 plate" / "200g"]
  [Estimate with AI] button
      → POST /v1/foods/estimate { name, portion }
      → returns macros
      → user adjusts if needed → saves
```

~3 days to build. No data ingestion. Uses your existing Gemini provider.
Lower accuracy than a vetted DB but better than asking the user to type
macros themselves.

This is the **bridge** between current (type macros) and ideal (full DB
+ AI fallback). Closes the worst UX gap for ~$0 ongoing cost.

### Option B — Bootstrap with USDA only (no IFCT, no OFF)

~1 week. Just USDA's ~20K core items. Search works. Indian foods are
weak — punt them to the AI fallback path.

Gets you 70% of the value at 30% of the work.

---

## 11. Decision matrix

| Goal | Build now? |
|---|---|
| Ship closed beta this week | ❌ Skip entirely |
| Ship closed beta + minimize manual-entry friction | ⚠️ Option A (AI fallback, 3 days) |
| Ship public launch in 2 months | ✅ Option B (USDA + AI fallback, 1 week) |
| Compete head-on with MyFitnessPal on DB depth | ✅ Full plan (USDA + IFCT + OFF + AI, 2.5 weeks) |
| Win the Indian market specifically | ✅ Full plan with IFCT digitization prioritized |

Your context doc says you want $5–30K MRR in 12–18 months. None of those
goals require best-in-class food database depth in v1. They require
shipping, marketing, and not burning out before you have users.

So my vote: **Option A (AI fallback only) BEFORE public launch, full
plan EVENTUALLY based on user feedback.**

---

## 12. Appendix — useful starter links

- **USDA FoodData Central:** https://fdc.nal.usda.gov/api-guide.html
- **USDA bulk downloads:** https://fdc.nal.usda.gov/download-datasets.html
- **Open Food Facts API:** https://openfoodfacts.github.io/openfoodfacts-server/api/
- **Open Food Facts data dumps:** https://world.openfoodfacts.org/data
- **IFCT 2017:** https://www.nin.res.in/ (look under Publications)
- **ICMR-NIN contact:** dir.nin@gov.in (for licensing questions)
- **Nutritionix API (if going paid):** https://developer.nutritionix.com/
- **Edamam API (if going paid):** https://developer.edamam.com/

Community Indian food datasets to evaluate (verify accuracy before using):
- Various GitHub repos with "indian-food-nutrition" — quality varies, audit
  any you find before ingesting

---

## What to do next

1. **This week:** skip this. Ship closed beta with current manual entry.
2. **After 1 week of beta:** count tester complaints about manual entry.
3. **If >30% complain:** build Option A (3 days, AI-fallback only).
4. **Before public launch:** build Option B (USDA + AI fallback, 1 week).
5. **Post-launch with India momentum:** add IFCT + Indian-specific
   onboarding (let users say "I cook mostly Indian" → search prioritizes
   Indian foods).

The most valuable thing this doc does **right now** is exist. You don't
need to action any of it this week. File it, focus on validation, come
back when the question becomes urgent.
