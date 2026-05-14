# LeanScan — Project Context

**Status:** Pre-validation
**Owner:** Shashank
**Updated:** 2026-05-13 (major repositioning — see § 13)

---

## 1. The One-Sentence Pitch

**LeanScan is an AI-powered all-in-one health tracker — protein-first nutrition, weight, workouts, and how you feel — in a single tap.**

Working taglines (primary first):
- "Snap your meal. Track your day."
- "Your health, in one snap."
- "Protein-first tracking, for everyone."

---

## 2. The Founder

- Recent graduate (2025), ~10 months experience as a software engineer
- Full-stack developer with applied AI exposure (frontend, backend, some ML)
- Currently employed full-time; building this as a side project for extra income
- Based in India, targeting a global (primarily US/UK/EU/AU/Canada) market
- Goal: $5K–$30K MRR within 12–18 months. Realistic, not "billion-dollar."
- Available time: ~10–20 hours/week, evenings and weekends
- Personal motivation: relates more to the generic health-conscious user than to specialty audiences (e.g., GLP-1). Wants to build the tool he'd use.

---

## 3. The Audience and the Hypothesis

### Who LeanScan is for
Health-conscious adults (25–45) who already care about their food intake, training, and weight — but find existing trackers either too clinical, too calorie-obsessed, or too slow to log. They're not pre-contemplation; they're already tracking *something*, often poorly, often across multiple apps.

### The hypothesis
Existing trackers fail in three predictable ways:
1. **Calorie-first hierarchy.** Most users actually care more about hitting protein than staying under a calorie ceiling — especially anyone trying to recomp, build muscle, or maintain lean mass during weight loss. Tracker home screens lead with calories anyway.
2. **Logging friction.** Search-driven food databases (MyFitnessPal, Lose It) are slow. Photo-AI (Cal AI) exists but is calorie-first and lacks holistic tracking.
3. **Tool sprawl.** Users juggle MyFitnessPal + Apple Health + Strava + a notes app + a paper journal. Nothing aggregates the picture.

LeanScan's bet: a single app that's **protein-first by default**, **photo-AI fast**, and **all-in-one** (meals, weight, training, optional symptom tracking) wins users tired of stacking 5 separate apps.

### Market context
- US weight-loss app market: ~$2B annually, growing
- Calorie-tracker category is mature but consolidating (MyFitnessPal acquired Cal AI in March 2026)
- AI-photo-tracking is now table stakes — Cal AI proved consumers will pay for it ($30M ARR in <2 years)
- Apple Health is the passive aggregator; no active-tracking app has become its complement
- Pricing benchmarks: MyFitnessPal Premium $79.99/yr, Cronometer Gold $39.99/yr, MacroFactor $72/yr, Carb Manager $39.99/yr

### Why existing apps fail this user
1. **Calories are the wrong North Star for the gym-going / recomp audience.** Protein matters more.
2. **Logging is exhausting.** Photo-AI exists but is calorie-led and doesn't holistically log.
3. **No single dashboard.** Weight here, workouts there, food in a third app, mood/symptoms in a fourth.
4. **Diet-culture vibes.** Most trackers' tone shames users for going "over." That's emotionally costly.

### Competitor scan (post-repositioning)
- **MyFitnessPal**: 800-lb gorilla. Calorie-first, slow search, premium $79.99/yr. Acquired Cal AI March 2026.
- **Cal AI**: Photo-AI calorie tracker. ~$30/yr through Apple growth hacks. Calorie-first.
- **Cronometer**: Micronutrient deep-dive. Power-user tool. $39.99/yr.
- **MacroFactor**: Macro coaching, evidence-based. $72/yr. Strong product, expensive.
- **Carb Manager**: Keto-focused. $39.99/yr.
- **Lose It**: Lightweight, friendly. $39.99/yr. Calorie-first.
- **Yazio**: European, freemium, generic. Strong in EU markets.
- **Apple Health**: Free, integrated, but passive.

**Our gap (weaker than before, but real):** Protein-first hierarchy as the default home screen + AI photo speed + holistic tracking in one focused app. No single competitor combines all three with a non-diet-culture brand voice.

### Risks acknowledged at repositioning
- **No sharp wedge.** "Protein-first all-in-one" is harder to communicate than "for GLP-1 users."
- **Crowded competitive landscape.** Head-on with MFP and Cal AI.
- **Lower willingness to pay.** Generic users don't have a $300/month medication budget that makes $49/year trivial.
- **Reach is harder.** Generic fitness audiences are scattered across many subreddits and hashtags rather than concentrated in a few high-intent communities.
- **Defensibility is lower.** A bigger player can replicate the protein-first hierarchy in a sprint.

---

## 4. Target Customers

### Primary persona — Alex
- 30, North America or Europe
- Software engineer or office worker, sedentary day-job + 2-4 gym sessions/week
- Goal: lose 15 lbs and build muscle (recomp). Hits ~140g protein/day on good days, falls short on bad days.
- Currently uses MyFitnessPal but hates the bloated UI and finds the calorie focus demotivating.
- Income: $90K+
- Tech-fluent, on TikTok and Reddit, has tried 3 other apps in the last year.
- Would pay $40–60/year for a clean, protein-first all-in-one app. Would NOT pay $80+.

### Secondary persona — Jamie
- 35, fitness-serious. Lifts 3x/week, runs 2x/week.
- Tracks macros religiously. Currently pays MacroFactor $72/yr.
- Wants the same depth but cleaner UX and lower price.
- Income: $100K+, would happily pay for the right tool.

### Secondary persona — Riley
- 28, casual gym-goer, wants to "just be healthier."
- Has tried MyFitnessPal twice; quit because it felt diet-y and shame-inducing.
- Doesn't currently track. Would try a friendly, low-friction app.
- Lower willingness to pay (~$30/year) but huge volume in this segment.

### Tertiary — GLP-1 users
The original v1 audience. Now a niche-within-the-audience served via an optional medication question in onboarding. Not in marketing. They'll find the app through generic protein/health channels and the medication option will surface symptom tracking and a medication-aware protein target for them.

---

## 5. Brand & Positioning

### Name
**LeanScan** — works for "lean muscle protein-first scanning" and is short, App-Store-friendly, easy to spell.

### Tagline options (primary first)
- "Snap your meal. Track your day."
- "Your health, in one snap."
- "Protein-first tracking, for everyone."

### Brand voice
- Warm, editorial, evidence-aware (but not citation-heavy now that audience is broader)
- Empathetic, never shaming
- Anti-diet-culture
- Honest about limitations
- Tone reference: closer to Strava + Notion than to a hospital app

### Visual direction
- Refined editorial aesthetic (think: Notion meets Strava)
- Forest green primary (#1a3a2e), warm cream background (#f5f1ea), amber accent (#c8975b)
- Serif headlines (Fraunces), clean sans body (Manrope)
- Generous whitespace, real data as design elements

---

## 6. Product Spec — v1 (13–18 weeks of build)

### Must-have for launch
1. AI photo meal logging (Google Gemini Vision API for v1, then fine-tune)
2. **Protein-first daily dashboard** (protein ring is primary, calories secondary). Configurable: users who care about calories more can switch the priority, but protein is default.
3. Daily protein target calculated from user's bodyweight (1.2g/kg default; adjustable)
4. Daily weight log + trend chart
5. Simple resistance training log (sets × reps × weight)
6. Weekly summary PDF + email
7. Onboarding flow: height, weight, goal weight, activity level, **optional** medication question
8. "How you feel today" quick-log (broader than the old GLP-1 side-effect tracker; covers fatigue, mood, energy, GI, headache, etc.)
9. Manual meal entry + recent-meals list
10. 7-day free trial → annual subscription (RevenueCat)
11. Notifications (weight reminder, mid-day protein nudge, weekly report ready)
12. Settings + data export + delete account

### Defer to v2+
- Apple Health / Google Fit integration
- Wearable sync (Whoop, Oura, Garmin)
- Macro breakdown beyond protein/calories
- Recipe builder
- Social/community features
- Meal planning
- Coaching/chat features
- Maintenance-phase mode (GLP-1-specific)
- Family / team accounts
- Web app
- Barcode scanning
- Voice logging
- Apple Watch / Wear OS

### Tech stack
See `coding/planning/02-architecture.md` (in progress). Locked architecture: dedicated API server (Node/Hono) + Supabase as DB/Auth/Storage + Gemini for vision + RevenueCat for subscriptions. React Native via Expo for iOS + Android.

---

## 7. Pricing

- **Founder cohort (first 500 users):** $39/year — locked in for life
- **Public launch pricing:** $59/year (or $6.99/month after the 1,000-paying-user threshold)
- **Free trial:** 7 days, no credit card required for trial start
- **No monthly-only option until 1,000 paying users** (annual prepay = cash flow)

**Rationale.** Generic health-conscious users won't pay the $49/yr we originally planned for GLP-1 users (who already spend $300/mo on the drug). Market benchmarks: Cronometer $39.99, Carb Manager $39.99, Lose It $39.99. $39 founder / $59 public sits between Cronometer and MacroFactor. To revisit after first 100 paid signups.

---

## 8. Validation Plan (14 days, BEFORE building the full app)

> **Note (May 13, 2026):** Founder has chosen to build first, validate after. Validation tactics below are now adjusted for the new positioning, and should be running in parallel with the build even if sequencing is officially "build first."

### Days 1–2: Deploy landing page
- Domain options: leanscan.app, getleanscan.com, tryleanscan.com (check availability)
- Host: Vercel free tier
- Email capture: ConvertKit free tier
- Analytics: Plausible

### Days 3–4: Review mining (new sources)
- Read 100+ negative reviews of MyFitnessPal, Cal AI, Lose It, MacroFactor, Cronometer
- Focus on complaint patterns relevant to the new positioning: protein burial, UI bloat, calorie focus, slow logging, diet-culture tone, premium feature gates
- Spreadsheet: complaint pattern, exact wording, app, date
- Becomes the content vault for marketing

### Days 5–7: Community immersion (lurk only)
- r/loseit (~14M)
- r/Fitness
- r/leangains
- r/gainit
- r/AdvancedFitness
- r/MacroFactor
- r/intermittentfasting
- r/Volumeeating
- r/EatCheapAndHealthy
- Subreddits about specific diets (r/keto, r/PlantBasedDiet)
- Read for 5+ hours total. Note language, complaints, recurring questions.

### Days 8–10: First outbound moves
- Reddit: 3 genuinely helpful posts in target subreddits (no pitch, no link)
- TikTok: 3 posts using the new content ideas in section 10
- Influencer outreach: 20 personalized DMs to micro-influencers (fitness/macro tracking, 5K–50K followers)

### Days 11–14: Measure
- Landing page visits → email signups conversion rate
- Reddit post engagement (upvotes, comments)
- TikTok view counts
- Influencer DM response rate

### Validation thresholds
- **Strong signal:** 500+ signups, 5%+ conversion (down from 10% — generic positioning has lower urgency), 3+ influencer yeses → strong proceed
- **Medium signal:** 100–500 signups, 3–5% conversion → refine positioning, try again
- **Weak signal:** <100 signups → niche or messaging is wrong; pivot or reconsider

---

## 9. Marketing Channels (in priority order)

### 1. Short-form video (TikTok, Instagram Reels, YouTube Shorts)
- Still dominant for health/fitness content
- Plan: 1–2 posts/day for 90 days
- Founder face content > faceless content
- Hashtag focus: #protein, #highprotein, #macrotracking, #recomp, #fitness, #weightloss

### 2. Reddit (long-term presence)
- Become a known helpful person over 4 weeks before pitching
- New subreddit set (see § 8 above)

### 3. Build in public on X / Threads
- Document the journey, share signup screenshots, MRR milestones
- Indie hacker + fitness-Twitter communities are both reachable

### 4. App Store Optimization (ASO)
- Long-tail keywords: "protein tracker," "high protein," "macro tracker," "photo food log," "AI calorie counter," "weight loss tracker"
- Slightly more competitive than GLP-1 terms but still gettable

### 5. Micro-influencer partnerships
- Target: 5K–50K follower accounts of fitness creators, macro-tracking RDs, recomp coaches
- Pitch: free lifetime access in exchange for honest feedback
- Goal: 10 yeses out of 100 DMs

### 6. Reddit AMA / Product Hunt launch
- Time once landing has 1,000+ signups for credibility
- Product Hunt launch in week of public App Store launch

### Skip (for now)
- Paid App Store ads (CPI is brutal in this category)
- Facebook/Instagram paid ads
- Google ads
- Wait until product-market fit is clear and unit economics work

---

## 10. TikTok Content Vault (rewritten for new positioning)

1. "Why I built the protein tracker MyFitnessPal users wish existed"
2. "POV: you open MyFitnessPal and it asks if you ate 47 baby carrots"
3. "Stop tracking calories. Start tracking the only number that matters."
4. "I asked 5 gym-goers what they hate about their tracker"
5. "Day in the life: hitting 140g of protein without thinking about it"
6. "The math: why protein matters more than calories during recomp"
7. "Three apps every health-conscious person needs (and why none exist yet)"
8. "Building in public — Day 1 of LeanScan"
9. "What 200 negative reviews of MyFitnessPal taught me"
10. "I'm building this. Want to be user #1?"
11. "How I track everything (food, weight, lifts) in one app"
12. "MyFitnessPal vs LeanScan: the protein test"

### Posting cadence
- 1–2 per day, batch-shoot in weekend sessions
- Most will get nothing. One viral hit funds the first 500 signups.

---

## 11. Risks & Things to Watch

### Strategic risks (NEW after repositioning)
- **Weaker wedge against incumbents.** "Protein-first all-in-one" is a feature, not a category. Defensibility relies on execution speed and brand voice.
- **Direct competition with MyFitnessPal and Cal AI.** Both have orders of magnitude more resources.
- **Marketing complexity.** Generic fitness audiences are harder to reach than concentrated niche communities.
- **Lower price ceiling.** Pricing benchmark is $39–60/yr, not the $89/yr the GLP-1 niche could have supported.

### Technical risks
- AI photo accuracy on protein estimation (worst case: 20% off, acceptable)
- App Store review for fitness/nutrition apps — usually fine if no medical claims
- Don't claim medical benefits — strictly "nutrition tracking"

### Market risks
- MyFitnessPal launches a "protein-first mode" → mitigate by being early and building community moat
- Cal AI 2.0 launches with multi-metric tracking → respond with better protein hierarchy

### Founder risks
- Side-project burnout: 13–18 weeks of building plus marketing
- Marketing discomfort: founder MUST do on-camera content
- Time zone challenge for US user support from India — use async support email

### Legal/compliance
- Privacy: store health data server-side; clear privacy policy
- No medical claims: app is "nutrition tracking," NOT "medical device"
- No diagnostic features, no medication dosing advice
- Consult a lawyer before launch if revenue exceeds $5K MRR

---

## 12. Current Status

- ✅ Brand identity, color palette, fonts locked
- ✅ Landing page draft built (single HTML file) — **NEEDS REWRITE for new positioning**
- ✅ Demo prototype built (Gemini photo→protein)
- ✅ Review mining workbook scaffolded — **partially obsolete, patterns need re-seeding for new audience**
- ✅ Folder structure organized
- ✅ Major repositioning decided (May 13, 2026)
- ✅ Context doc updated to reflect repositioning (this file)
- ⏳ Scope doc revision (`coding/planning/01-scope.md`)
- ⏳ Architecture planning (after scope approval)
- ⏳ Domain registration
- ⏳ Landing page deployment
- ⏳ Email capture backend setup
- ⏳ First Reddit posts
- ⏳ First TikTok content
- ⏳ Validation phase
- ⏳ MVP build (13–18 weeks)

---

## 13. Decision Log

### May 2026 — Niche selected
- Pivot from "AI Calorie Tracker for Indian Cuisine" to "GLP-1 Protein-First Tracker"
- Rationale: global market, higher willingness to pay, clearer wedge against incumbents
- Brand name: LeanScan
- Founder pricing $49/yr, public $89/yr (annual-only at launch)

### May 13, 2026 — Repositioned to all-in-one health tracker
- **Decision:** abandoned the GLP-1-specific niche in favor of a generic, all-in-one protein-first health tracker
- **Why:** founder relates more to the generic health-conscious user, doesn't want to exclude non-GLP-1 users who'd benefit. Believes ~70% of the v1 feature set is universal.
- **Trade-offs accepted by founder (after three pushbacks from co-pilot):**
  - Weaker wedge against MyFitnessPal/Cal AI
  - Direct competition with more-resourced players
  - Lower willingness to pay (~$40 vs $49–89 originally)
  - Marketing channels become broader and more diluted
  - TikTok scripts harder to write with a punchy hook
- **What changed:**
  - § 1, 3, 4, 5: rewritten for generic positioning
  - § 6: medication question made optional; side-effect tracker broadened to "how you feel"
  - § 7: pricing revised to $39 founder / $59 public
  - § 8, 9, 10: new subreddits, new marketing channels, new TikTok content vault
- **What stayed:**
  - Brand name (LeanScan)
  - Visual identity (forest green, amber, cream, Fraunces + Manrope)
  - Tagline pattern (Snap your meal. _____.)
  - Most v1 features
  - Solo indie founder, no VC, $5–30K MRR goal in 12–18 months
- **Architecture decisions locked the same day:** dedicated API server (Node/Hono recommended), Supabase Postgres + Auth + Storage, Gemini for vision, RevenueCat for subs, Resend for email. Web client supported via same API in v2.

---

## 14. How to Use This Document

This doc is the single source of truth. Update it any time strategy materially changes. Add a decision log entry, then update affected sections.

When you start a new Claude/Cowork chat, the project instructions reference this doc:

> *"You are my product strategist and marketing co-pilot for LeanScan. Reference the LeanScan context doc for all factual details about the product, market, and strategy. When I ask for tactical help — landing page copy, TikTok scripts, Reddit responses, App Store descriptions, email drafts — write in the brand voice defined in section 5. Be honest about risks. Don't sugarcoat validation results. Push back when my ideas are weak."*

That instruction set + this context file = every new chat starts with full alignment.
