# DocuPrism Integration — Brainstorm & Honest Assessment

**Author:** Shashank (with co-pilot) · **Status:** Brainstorm, not committed
**Date:** 2026-05-20

---

## TL;DR

**Question:** Should LeanScan integrate DocuPrism (PebbleRoad's document AI
engine) to let users upload medical/health documents, and what value does
that unlock?

**Recommendation in one line:** Don't build it pre-launch. The one specific
use case worth pursuing — **body composition reports → lean-mass-based
protein target** — is a genuine differentiator nobody else has, and should
be a **Phase 3 feature** (post-1,000 paying users) when you have real
demand signal from the recomp/lifter audience.

Until then, log the idea in a backlog and move on. Pre-launch product is
"AI photo meal logging + protein-first dashboard." Document upload is
scope creep that delays validation. The hard truth is: **users who don't
exist yet aren't asking for this.**

---

## 1. What is DocuPrism?

Sourced from pebbleroad.com — I verified, didn't invent.

> "DocuPrism is PebbleRoad's proprietary product designed to transform
> unstructured document data into reliable, computable business
> information."

**Confirmed capabilities (public-facing):**
- Document AI / unstructured-to-structured-data engine
- Handles "complex paperwork like contracts and claims"
- Listed industries: **finance, government, healthcare, education, energy**
- Open-source companion libs: `table-stitcher`, `table2rules`
- Positioned as "automation backbone" for document-heavy enterprise
  workflows

**What I don't know without internal Pebble Road access:**
- Pricing model (per-page? per-document? per-API-call? volume tiers?)
- Supported document types and OCR accuracy specifics
- API surface — REST? batch? webhook callbacks?
- Latency expectations (sync? async?)
- Hosting model (Pebble Road managed? customer-hosted?)
- Available schema templates for healthcare / personal medical docs
- Mobile-friendly file upload SDK or direct-from-camera support
- Whether it handles handwritten medical notes (DEXA scans often have
  printed numbers; clinician notes often don't)

**Action item for Shashank as a Pebble Road employee:** answer these
internally before committing to anything. Half of the integration cost
estimate below depends on these answers.

---

## 2. The problem space — what documents do LeanScan users actually have?

Brainstorm of every document type a health-conscious adult might want to
upload to a tracker:

| # | Document type | How common | LeanScan-relevant data | DocuPrism fit |
|---|---|---|---|---|
| 1 | **DEXA scan report** | ~5% of audience, growing | Lean body mass, fat %, regional analysis | ★★★ Strong |
| 2 | **InBody / Tanita / Bod Pod report** | ~25% (most modern gyms have one) | Lean body mass, body fat %, water mass | ★★★ Strong |
| 3 | **Lab blood panel** (lipid, A1C, hormones) | ~40% have one annually | Trend data, glucose, hormones | ★★ Caution (medical claims) |
| 4 | **GLP-1 prescription printout** | ~9% (niche persona) | Medication, dose, schedule | ★ Marginal (already in onboarding) |
| 5 | **Nutritionist meal plan** (PDF from RD) | ~5% | Daily macros, food list | ★★ Interesting |
| 6 | **Recipe PDFs / cookbooks** | ~30% | Ingredients + amounts → macros | ★★★ Strong for cooks |
| 7 | **Personal trainer program** | ~10% | Sets/reps/exercises | ★ Off-thesis (nutrition app) |
| 8 | **Restaurant menu PDFs** | ~20% (chain restaurants) | Menu items → macros | ★ Multimodal LLM handles this already |
| 9 | **Old MyFitnessPal export** | ~50% of churned users | Historical food log | ★★ Strong for migration story |

The "★★★ Strong" candidates are the ones where DocuPrism does the heavy
lifting AND the user gets a real, unique benefit. Three rise above the
rest:

- **#1 + #2:** Body composition reports → personalized lean-mass-based
  protein target
- **#6:** Recipe PDFs → automatic per-serving macro calculation
- **#9:** MyFitnessPal data export → frictionless migration

---

## 3. Use case deep dive

### 3.1 Body composition reports → lean-mass-based protein target ★★★

**The pitch:** every other tracker calculates your protein target from
**bodyweight** (e.g., 1.6 g/kg of weight). The scientifically correct
number is based on **lean body mass**. A 100 kg person with 20 kg of fat
needs protein for the 80 kg of muscle/organs/skeleton, not the full 100 kg.
Most apps over- or under-shoot by 15–25%.

**Differentiator strength:** NOBODY in the calorie-tracker space does
this. MyFitnessPal, Cal AI, MacroFactor, Cronometer — all use bodyweight.
This is a genuine, defensible insight that aligns with LeanScan's
"protein-first" positioning.

**UX flow:**
```
Settings → Body composition
  → Upload InBody / DEXA report (PDF or photo)
    → DocuPrism extracts:
        - Total body mass
        - Lean body mass (LBM)
        - Body fat percentage
        - Scan date
    → LeanScan recalculates protein target:
        2.0 g/kg LBM (lifter default) instead of 1.6 g/kg bodyweight
    → Shows the user: "Your target was 144g/day from bodyweight.
        Now it's 158g/day based on your actual lean mass — 14g more
        because you're carrying more muscle than the default model assumed."
```

**Value to user:**
- More accurate protein target (real strength advantage)
- Validation: "the app knows my body, not just my weight"
- Tracks LBM trend over time as they re-scan
- "Protein vs LBM" weekly chart in summary email
- Strong reason to retain (you don't get this elsewhere)

**Value to LeanScan:**
- Defensible differentiator
- Vertical-segment moat (serious lifters, recomp)
- Marketing hook: "the only protein tracker that uses your actual lean mass"
- Premium feature lever (charge for it)
- Co-marketing angle with gym chains that do InBody scans (Equinox,
  Lifetime, Anytime Fitness, etc.)

**Honest caveats:**
- ~25% of gym-going users have access to an InBody scan; only ~5% have a
  DEXA. So this benefits a subset, not everyone.
- Body comp report formats vary wildly (InBody 270 vs 770 vs Tanita BC-545
  vs DEXA from different machines). DocuPrism needs to handle the
  formats — Shashank, this is the first question to ask the Pebble Road
  team: "what's the lift to add a new template?"
- Body fat from InBody (bioelectric impedance) has ±3–5% error. DEXA is
  ±1–2%. The protein target swing from this error is ~5–10g/day — within
  the noise of dietary protein anyway. So the value is more about
  personalization narrative than absolute precision.
- Need to handle re-uploads (every 3–6 months) so the LBM number stays
  current. Adds UX surface area.

---

### 3.2 Recipe PDFs → automatic per-serving macro calculation ★★★

**The pitch:** users with cookbooks, saved recipes, or RD-prescribed meal
plans currently have to enter ingredients one at a time. Upload the PDF
once, get per-serving macros forever.

**UX flow:**
```
Meals → Add → Import recipe
  → Upload PDF (or paste text)
    → DocuPrism extracts:
        - Recipe title
        - Ingredient list with quantities
        - Servings
        - (Method/steps optional)
    → LeanScan looks up each ingredient in the macros database
        (same one the AI photo logger uses)
    → Computes per-serving protein/calorie/macros
    → Saves as a "Recipe" → user can log a serving in 1 tap forever
```

**Value to user:**
- Massive logging speedup for home cooks
- Saves recipes for one-tap re-logging
- More accurate than AI photo for known recipes

**Value to LeanScan:**
- Solves the "I cook at home" use case that AI photo logging is shaky on
- Sticky feature (the user invested time, won't churn)
- Becomes a content / community lever later (share-a-recipe)

**Honest caveats:**
- Subset of users have recipe PDFs handy
- Open-text recipe ingestion via OCR has been a pain point for years; the
  edge cases (fractional measurements, alt-units, ingredient names that
  match multiple macros entries) are real
- Multimodal LLMs (Gemini, Claude) already handle this reasonably well
  without DocuPrism — so the build/buy question is real here

---

### 3.3 MyFitnessPal data export → frictionless migration ★★

**The pitch:** MFP users who want to switch can export their data (CSV).
LeanScan imports it via DocuPrism, populating historical meals + weight
trends from day one.

**UX flow:**
```
Onboarding → "Coming from MyFitnessPal?"
  → Upload your MFP export ZIP
    → DocuPrism parses the CSVs
    → LeanScan imports:
        - Past meals (with date)
        - Weight history
        - Custom foods you created
    → User sees: "We brought 6 months of your history. Your weight trend
        starts on day 1."
```

**Value to user:**
- Zero-friction switch from MFP
- Continuity of data (the biggest reason people don't switch trackers)

**Value to LeanScan:**
- Removes the #1 switching cost
- Conversion lever for the "tired of MFP" persona

**Honest caveat:**
- MFP exports are well-structured CSV — **doesn't need DocuPrism**. Could
  be a 100-line parser in your API. DocuPrism is overkill here.
- That said, if the integration is already there for body-comp + recipes,
  the marginal cost to add MFP import is low and the marketing value is
  high.

---

### 3.4 What I'd explicitly NOT build, and why

| Idea | Why skip |
|---|---|
| **Lab blood panel upload** (lipid, A1C, hormones) | Triggers medical-claim risk. LeanScan's brand voice is "anti-medical-claims" per § 11 of context doc. Surfacing glucose trends and saying anything about them treads into "medical app" territory → App Store review risk, liability risk. Pass. |
| **GLP-1 prescription upload** | Already handled with an optional onboarding question. Doc upload would be a UX nicety, not a feature. Pass. |
| **Personal trainer programs** | Off-thesis. LeanScan is a nutrition tracker. Training log is "nice to have," not core. Pass. |
| **Restaurant menu PDFs** | Multimodal LLMs already handle this. DocuPrism is overkill. Pass. |
| **Insurance documents / EOBs** | Zero LeanScan-relevant data. Pass. |

---

## 4. Integration architecture (if we eventually build it)

Sketch only — pending the open questions in section 1.

```
LeanScan Mobile App
   │
   │ POST /v1/documents/upload
   │ multipart: { file, type: "body_composition" | "recipe" | "mfp_export" }
   ▼
LeanScan API (Express)
   │
   │ 1. Validates file (size, mime type)
   │ 2. Stores in S3 / R2 / Supabase Storage
   │ 3. Creates a Document row (status: pending)
   │ 4. Calls DocuPrism API:
   │       POST <docuprism>/extract
   │       body: { file_url, template: "inbody_v3" | ... }
   ▼
DocuPrism
   │
   │ 5. Extracts structured data
   │ 6. Returns JSON OR sends webhook to LeanScan
   ▼
LeanScan API
   │
   │ 7. Maps DocuPrism output to LeanScan schema:
   │       BodyCompositionReport { userId, scanDate, leanMass, fatMass, ... }
   │ 8. Updates user.proteinTarget if applicable
   │ 9. Notifies app via push or polling
   ▼
LeanScan Mobile App
   │
   │ 10. Shows updated target / report card
```

**Open questions for Pebble Road:**
- Is the DocuPrism API sync or webhook-driven? (sync is simpler for mobile)
- Latency expectation? (<5s ok, >30s needs async UX)
- Mobile-friendly SDK or direct REST?
- Custom template authoring — self-service or Pebble Road internal team?
- Pricing model — per-document, per-page, monthly tiers?
- Compliance posture — HIPAA-aware? GDPR? Data residency options?

---

## 5. Effort vs. value matrix

| Use case | Build effort | User value | Strategic value | Verdict |
|---|---|---|---|---|
| Body comp report → LBM-based protein target | **High** (template work, UX, edge cases) | **High** (real differentiator) | **High** (defensible) | **Yes, but Phase 3** |
| Recipe PDF → per-serving macros | Medium | Medium-High | Medium | **Maybe, Phase 3** |
| MFP export → migration | Low (CSV parser, no DocuPrism needed) | Medium-High | High (switching cost killer) | **Yes, Phase 2 — without DocuPrism** |
| Lab panel upload | High + compliance risk | Low (medical-claim risk) | Negative | **No** |
| GLP-1 Rx upload | Medium | Low (already handled) | Low | **No** |
| Trainer programs | Medium | Low (off-thesis) | Low | **No** |
| Restaurant menus | Low (handled by LLM) | Low | Low | **No** |

---

## 6. Risks specific to this integration

### 6.1 Scope creep at pre-launch

**The biggest risk.** Per the strategy doc § 12, LeanScan has 0 external
users, no validation completed, no landing page deployed yet. Adding a
document-upload feature now means:
- 3–6 weeks of build time
- New UX surface area to test
- New backend integration to maintain
- Distracts from the actual gap: **getting users**

A founder optimizing for revenue would spend those 3–6 weeks on TikTok
content, Reddit posts, and getting the first 100 signups. Not building.

### 6.2 Compliance — medical data territory

Body composition reports contain health-adjacent data. Lab panels
definitely contain PHI. Once you accept any medical document, you've
opened compliance questions:

- **US:** HIPAA covers PHI when handled by "covered entities" or their
  business associates. A consumer tracker is generally outside HIPAA,
  but storage of medical docs invites questions and increases risk.
- **EU/UK:** GDPR's special category for "health data" requires explicit
  consent, secure storage, breach notification.
- **App Store:** Apple is increasingly strict on apps that process medical
  data without clear medical-device status.

The brand voice from § 5: "anti-diet-culture, honest about limitations,
**no medical claims**." Document upload of medical files conflicts with
this brand promise unless carefully gated.

**Mitigation if you build it:**
- Frame as "fitness data," not "medical data" (body comp reports are
  borderline but defensible)
- Don't accept lab panels at all (clean line)
- Store with encryption-at-rest, never share with third parties
- Privacy policy explicitly enumerates what you accept and don't accept

### 6.3 DocuPrism is enterprise-positioned

Per pebbleroad.com, DocuPrism is positioned for "enterprise workflows"
and listed industries like finance, government. A consumer-app integration
may not be on their roadmap, and their pricing model likely reflects
enterprise volumes (annual contracts, per-document fees that don't scale
down to 100 hobbyist users).

This is the #1 question to clarify internally before any planning.

### 6.4 Pebble Road relationship dynamics

This is delicate territory worth being honest about.

**Pros of integrating Pebble Road's product:**
- Discounted / free access likely (employee perk?)
- Co-marketing potential — Pebble Road gets a consumer case study,
  LeanScan gets credibility
- Strengthens your relationship with current employer
- Demonstrates your strategic thinking beyond just engineering

**Cons / risks:**
- LeanScan is your side project; using employer tech blurs the line. Have
  the IP / equity / "is this Pebble Road's or mine?" conversation BEFORE
  integrating, in writing.
- If LeanScan succeeds and you want to leave Pebble Road, are you tied to
  their stack? Lock-in risk for your own business.
- If Pebble Road wants to acqui-hire or "spin in" LeanScan, integration
  makes that transition easier — could be a feature or a bug depending on
  your goals.

**Recommendation:** if you pursue this, **document the relationship terms
in writing first.** A one-page memo: "DocuPrism is licensed to LeanScan
under [terms]. LeanScan remains a separately-owned entity. Pebble Road
gets [X] in exchange." Even if it's nothing formal, write down the verbal
agreement.

---

## 7. The honest recommendation

### Right now (pre-launch)
**Skip the entire integration.** Build nothing. Ship the existing scope.
Get to 100 real users. Validate that the AI-photo + protein-first hypothesis
holds. Document upload is a "what if we add features" distraction at this
stage.

### Phase 2 (post-launch, 100–500 paying users)
**Build the MFP migration importer.** It's a CSV parser, doesn't need
DocuPrism, and removes the single biggest switching cost from your nearest
competitor. Highest ROI feature on the list. ~1 week of work.

### Phase 3 (post-1,000 paying users, ~12 months out)
**Pilot the body composition report integration with DocuPrism.** By then:
- You'll know if recomp/lifter users are asking for it
- DocuPrism pricing/API surface will be clearer
- Your relationship terms with Pebble Road will be settled
- Revenue can fund a real integration sprint (3–6 weeks)
- App Store posture and compliance template will be matured

This becomes the "premium feature" lever — gate it behind paid tier,
upsell from free, get the "the only app that uses your real lean mass"
positioning.

### Phase 4+ (scale)
**Co-market with Pebble Road.** Case study: "Indie consumer app uses
DocuPrism for personalized fitness analytics." Wins for both companies.
Possibly a referral / licensing deal.

---

## 8. Open questions for Pebble Road (internal)

Bring these to your Pebble Road colleagues before any further planning:

1. **Is DocuPrism available for consumer-facing apps at non-enterprise
   pricing?** (Per-API-call or per-document, ideally.)
2. **Does the product have templates for InBody / DEXA / Tanita output?**
   If not, who builds them and what's the lift?
3. **What's the API latency for a single document?** Sync acceptable?
4. **Is there a mobile-friendly direct-upload SDK, or do we proxy through
   the LeanScan API?**
5. **What's the compliance posture — HIPAA-aware? GDPR data residency?
   Encryption at rest?**
6. **What's Pebble Road's interest in consumer use cases?** Is this a
   strategic fit for them or a one-off favor?
7. **If LeanScan integrates and grows, what's the commercial model? Free
   employee tier? Revenue share? Licensing?**
8. **IP question — who owns the LeanScan-DocuPrism integration code? Me
   personally? Pebble Road? Joint?** Get this in writing.

---

## 9. Brutally honest closing

Your strategy doc says you have a **$5K–$30K MRR goal in 12–18 months**.
You're going to hit or miss that goal based on:
- Whether your TikTok content gets reach
- Whether your Reddit posts convert to signups
- Whether AI photo logging is fast enough to retain users on day 7
- Whether you charge the right price
- Whether you ship App Store / Play Store builds

You will **NOT** hit or miss that goal based on whether you integrate
DocuPrism in V1. It is a "post-product-market-fit" feature. Don't build it
until you've earned the right to.

The brainstorm itself has value — body comp scans → lean-mass protein
target is a real differentiator you can lead with in marketing copy
**before you've built it**. Mention it in your TikTok content as a
"coming soon" feature to gauge demand. If 100 users say "I'd pay for that"
in the first month, build it. Otherwise, file it and ship the core
product.

---

## Appendix A — Marketing copy you can use NOW (before building)

Even without building the integration, you can validate demand by
mentioning it in marketing:

> "Coming to LeanScan Pro: upload your InBody or DEXA scan, get a
> protein target calculated from your actual lean body mass — not just
> your weight. The only tracker that knows your real composition."

Drop that in:
- TikTok script #2 ("I asked 5 gym-goers what they hate about their
  tracker")
- A standalone landing page section ("For serious lifters")
- A Reddit r/leangains or r/Fitness post asking "would you pay for this?"

Demand signal → build decision. Not the other way around.

---

## Appendix B — Other potential third-party integrations to consider later

Out of scope for this doc but worth keeping in the backlog:

- **RevenueCat** — subscriptions (Phase 2, mandatory for paid tier)
- **Sentry** — error tracking (Phase 1, low effort)
- **Plausible / PostHog** — analytics (Phase 1, low effort)
- **Resend / Loops** — transactional + drip emails (Phase 2)
- **Apple HealthKit / Google Fit** — passive data integration (Phase 3)
- **Whoop / Oura / Garmin** — wearable sync (Phase 4)
- **Stripe** — direct payments (Phase 4, if going web tier)
- **Cloudflare R2** — meal photo storage at scale (Phase 3, cost lever)
