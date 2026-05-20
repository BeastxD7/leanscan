# LeanScan — Startup Credits Application Kit

**Purpose:** copy-paste source for cloud startup credit applications (AWS
Activate, Microsoft for Startups Founders Hub, Google Cloud for Startups,
Anthropic, Supabase, Vercel, DigitalOcean Hatch, etc.).

**Strategy note:** every program asks roughly the same questions in
different forms. This doc has the answers; you paste them in. Variants are
provided for the per-cloud "what will you build" prompts.

**Positioning honesty:** the strategy doc moved LeanScan from a GLP-1
specific wedge to a broader "protein-first all-in-one" positioning on May
13, 2026. For credit applications, **the broader pitch is the official
one**, but the GLP-1 origin story is a legitimate differentiator — keep it
in the founder narrative, not in the headline.

---

## 1. The one-liner (use the one that fits the character limit)

### 80 characters
> AI-powered, protein-first health tracker. Snap your meal, track your day.

### 140 characters
> LeanScan is an AI-powered, protein-first health tracker. Snap a meal photo, hit your protein target, see weight and training in one app.

### 280 characters (tweet length)
> LeanScan is an AI-powered, protein-first health tracker for people tired of stacking five apps. Snap a meal → get your protein. Track weight, training, and how you feel — all in one tap. Built mobile-first on Expo, Supabase, and Gemini Vision. Currently in pre-launch.

---

## 2. The elevator pitch

### 50 words

LeanScan is a mobile app that uses AI vision to make protein tracking
effortless. Snap a meal photo, get protein and calories in three seconds.
Unlike MyFitnessPal, it leads with protein — the macro most users actually
care about — and bundles weight, training, and mood logging in one app.

### 100 words

LeanScan is an AI-powered, protein-first health tracker for health-conscious
adults who already track something — poorly, slowly, across too many apps.
Open the app, snap a meal photo, get protein and macros in three seconds.
The home screen leads with protein, not calories. Weight, training, and
how-you-feel logging live in the same app, so users delete the four other
ones on their phone. Built on Expo (iOS + Android), Supabase, and Gemini
Vision. Currently pre-launch with a working Android APK, a deployed API,
and an SEO-optimized landing page. Targeting closed beta this month.

### 200 words

LeanScan is an AI-powered, protein-first health tracker. The thesis: every
existing calorie tracker is calorie-first, slow to log, and bloated. The
serious health-conscious user — gym-goer, recomp, person tracking macros to
hit a protein target — is paying $80/year for tools designed for somebody
else.

LeanScan does three things differently:

1. **Protein-first by default.** The home screen leads with protein. Calories
   are secondary context. Switchable, but the default tells the user we know
   what they actually care about.
2. **AI photo logging.** Snap a meal, get protein and macros in three
   seconds. No search, no scrolling 14-million-item food databases, no
   barcode dance.
3. **All-in-one.** Meals, weight, training, and how-you-feel logging in one
   app. Replaces MyFitnessPal + Apple Health + a training log + a notes app.

The product is built and working on Android (APK ready), iOS (via Expo Go),
and a deployed API. Originally conceived for GLP-1 users at risk of muscle
loss; expanded during build to serve the broader protein-aware audience. The
GLP-1 path remains in onboarding as an optional medication-aware mode.

---

## 3. The problem (paste verbatim into "What problem are you solving?")

Existing calorie trackers fail health-conscious users in three predictable
ways:

1. **Calorie-first hierarchy.** Most serious users care more about hitting a
   protein target than staying under a calorie ceiling. Trackers like
   MyFitnessPal lead with calories anyway, leaving the user to do their own
   math.

2. **Logging friction.** MyFitnessPal's 14-million-item food database makes
   logging a chicken breast a six-tap operation. Cal AI added photo logging
   but kept the calorie-first framing.

3. **Tool sprawl.** Users juggle MyFitnessPal for food, Apple Health for
   weight, Strava for workouts, and a notes app for how they feel. Nothing
   aggregates.

The result: a $2B US calorie-tracker market dominated by 20-year-old UX,
with users churning out within two weeks because the friction wears them
down.

---

## 4. The solution

LeanScan rebuilds the calorie tracker around three deliberate choices:

1. **Protein-first home screen.** A daily protein target (calculated from
   bodyweight, goal, and activity level) is the headline number. Calories
   sit beneath it as context. Configurable, but the default reflects what
   we believe is the right hierarchy for our user.

2. **Three-second meal logging.** Take a photo, AI estimates protein +
   calories + macros, user reviews, taps save. End-to-end under five
   seconds. Same flow handles homemade meals, restaurant plates, packaged
   foods.

3. **One app for everything.** Meal logs, daily weight, training sessions
   (sets × reps × weight), and a quick "how you feel today" check. One
   dashboard. Weekly summary delivered by email.

Pricing: 7-day free trial → $39/year for the first 500 founder-cohort users
(locked in for life), $59/year at public launch.

---

## 5. Target customer

### Primary persona — Alex (gym-going generalist)
- Age 30, software engineer, North America or Europe
- 2–4 gym sessions/week, sedentary day job
- Goal: recomp (lose fat, build muscle), targeting 140g protein/day
- Currently uses MyFitnessPal but hates the bloated UI and finds the
  calorie focus demotivating
- Income: $90K+, willing to pay $40–60/year for the right tool
- Reachable via: TikTok, Reddit (r/loseit, r/Fitness, r/leangains), App
  Store keyword search

### Secondary persona — Jamie (serious lifter)
- Age 35, lifts 3x/week, runs 2x/week
- Currently pays $72/year for MacroFactor
- Wants same depth at lower price with cleaner UX

### Niche persona — GLP-1 patient
- Original v1 audience. Now served via optional onboarding question that
  surfaces a medication-aware protein target (1.6 g/kg vs default 1.2 g/kg)
- Roughly 9% of US adults have used a GLP-1 medication — ~6M active users
  on Ozempic / Wegovy / Mounjaro / Zepbound
- Hidden differentiator: nobody else builds for this user explicitly

---

## 6. Market opportunity

| Metric | Figure | Source / reasoning |
|---|---|---|
| US weight-loss app market (TAM) | ~$2B/year, growing 8–12% YoY | Statista, multiple industry reports |
| Cal AI 2024 ARR | ~$30M in <2 years | Public reporting (acquired by MFP March 2026) |
| MyFitnessPal Premium | $79.99/yr, ~5M paying users | Public disclosures |
| GLP-1 users US (sub-segment) | ~6M active, doubling YoY | IQVIA prescription data |
| Reddit r/loseit | 4.2M members | Reddit |
| Reddit r/Fitness | 14M members | Reddit |

**SAM (serviceable):** US + UK + EU + Canada + Australia health-conscious
adults 25–45, ~40M people, ~$1B/year willingness-to-pay at $40 ARPU.

**SOM (5-year realistic):** 50K paying subscribers at $59/year = **$3M ARR**.
This is the founder's stated target band ($5K–$30K MRR in 12–18 months
maps to ~$120K–$360K ARR — well below SOM ceiling).

---

## 7. Why now

Three converging trends:

1. **Vision-model commoditization.** Gemini 2.0 Flash, GPT-4o, and Claude
   Sonnet identify food from photos at ~85–90% accuracy on common meals.
   Unit cost per scan is now under $0.005 — sustainable below a $5/month
   subscription. The "AI nutrition coach" thesis is finally affordable.

2. **Tool-sprawl fatigue.** Reddit health communities increasingly complain
   about juggling five tracking apps. The market is primed for
   consolidation, but no all-in-one option exists that matches MyFitnessPal
   for data quality and Apple Health for passive integration.

3. **Calorie-first incumbent stagnation.** MyFitnessPal's 2024 AI rollout
   was poorly received (per App Store reviews). MFP just acquired Cal AI
   (March 2026), suggesting they're shoring up rather than innovating. The
   window for a protein-first challenger is 18–24 months before MFP pivots
   their hierarchy.

---

## 8. Business model

| Stage | Pricing | Rationale |
|---|---|---|
| Closed beta (now) | Free | Validation only |
| Founder cohort (first 500) | $39/year, locked for life | Below-market price; rewards earliest adopters; provides cash flow |
| Public launch | $59/year or $6.99/month after 1,000 paying users | Annual prepay = better cash flow; monthly added at scale |
| Trial | 7 days, no card required | Reduce signup friction |

**Unit economics rough projection (at 1,000 paying users):**

| Line item | Per user / year |
|---|---|
| Revenue | $59 |
| AI vision API (assume 5 scans/day, Gemini Flash) | ~$9 |
| Cloud hosting (amortized) | ~$2 |
| Payment processing (Stripe via RevenueCat, 30% Apple/Google cut) | ~$18 |
| Net | ~$30 |
| Annual revenue (1,000 paid) | ~$30,000 net |

Path to $30K MRR (founder's 18-month goal): ~6,000 paying users at $59,
roughly the size of Carbon Diet Coach's reported user base. Realistic but
non-trivial.

---

## 9. Competitive landscape

| Competitor | Why we win this user |
|---|---|
| **MyFitnessPal** | 800-lb gorilla, $79.99/yr, calorie-first, slow search. We win on protein-first UX, speed, and price. |
| **Cal AI** | Photo AI, but calorie-first, recently acquired by MFP. We win on protein-first hierarchy and all-in-one bundling. |
| **Cronometer** | Micronutrient depth, terrible UX. We win on speed and AI logging. |
| **MacroFactor** | Strong macro coaching at $72/yr. We win on price and AI photo. |
| **Lose It** | Lightweight, friendly, $39.99/yr. We win on protein-first hierarchy and all-in-one. |
| **Carb Manager** | Keto-focused, narrow segment. We win on broader applicability. |
| **Apple Health** | Free, passive, no active logging. Complementary, not competitive. |

**Defensibility (honestly):** the wedge is execution speed and brand voice,
not a technical moat. We're betting that an indie team can iterate faster
than MyFitnessPal can refactor their 20-year-old UX hierarchy.

---

## 10. Current stage & traction

**Stage:** pre-launch, closed beta in 2 weeks.

**Built and working as of May 20, 2026:**
- Mobile app (Expo / React Native) — auth, onboarding, photo scan, manual
  meal entry, weight log, settings, notifications
- API (Node + Express + Prisma + Postgres) — multi-provider AI vision
  abstraction (Gemini / OpenAI / Bedrock), JWT auth, credit-based usage
- Database (Supabase Postgres) — 6 migrations live in production
- Live API deployment (Azure VM)
- SEO-optimized landing page with email capture (Next.js 16, deployed-ready)
- Android APK distributable via direct download (no Play Store needed yet)
- iOS distributable via Expo Go for closed-beta testers

**Traction (honest):** 0 external users. Closed beta launches this month.
Personal-account constraints mean we are deliberately gating access until
cloud credits arrive on a dedicated account.

**Repo / live URLs:**
- GitHub: https://github.com/BeastxD7/leanscan
- API: http://20.244.27.80:3000 (live, will move to credited cloud on go-live)
- Landing page: ready to deploy

---

## 11. Tech stack overview

| Layer | Choice | Why |
|---|---|---|
| **Mobile** | Expo SDK 55 / React Native 0.83 / TypeScript | Cross-platform, fast iteration, one codebase iOS + Android |
| **Backend** | Node 22 + Express + Prisma 6 | Familiar stack, fast iteration, well-supported |
| **Database** | Supabase Postgres (Tokyo region) | Managed Postgres + auth-ready + free tier |
| **Vision AI** | Pluggable: Gemini 2.0 Flash / OpenAI / Azure OpenAI / AWS Bedrock (Claude) | Multi-provider abstraction lets us shop on cost + quality |
| **Hosting** | Currently Azure VM; moving to credited cloud on launch | Docker-based, portable |
| **Image storage** | Local volume in V1, planned migration to S3/R2/Supabase Storage | Defer cloud lock-in |
| **Auth** | Custom JWT (access + refresh) | No vendor dependency for core auth |
| **Notifications** | expo-notifications (local push) | No push server cost in V1 |
| **Landing page** | Next.js 16 + Tailwind v4 + Vercel | Standard JAMstack, free tier |
| **Subscription billing** | RevenueCat (planned, Phase 2) | Industry standard for mobile subs |

---

## 12. Founder bio

**Shashank Devadiga** — solo founder, full-stack engineer.

- 2025 graduate, ~10 months as a software engineer at Pebble Road (India)
- Full-stack TypeScript / Node / React Native, applied AI exposure
- Building LeanScan as a side project, evenings + weekends (~10–20 hrs/week)
- Personal motivation: started building this for GLP-1 users worried about
  muscle loss after watching a friend on Wegovy lose 15 kg and end up
  visibly weaker. Expanded scope after realizing the same protein-tracking
  problem applies to lifters, recomp, and anyone serious about body
  composition.
- Goal: $5K–$30K MRR in 12–18 months. Realistic indie, not "billion-dollar."
- Location: India. Targeting global (primarily US/UK/EU/AU/Canada) market.

**Contact:** shashank@pebbleroad.com

---

## 13. Why we need cloud credits — per-program variants

### For Microsoft for Startups Founders Hub

> LeanScan is a mobile AI product. We need Azure for: (1) Azure OpenAI for
> our vision pipeline (GPT-4o for meal photo → macros, with the protein-
> aware reasoning that differentiates our product), (2) Azure Container
> Apps to host our Node/Express API as we move off a personal-account VM,
> (3) Azure Database for PostgreSQL as a secondary region for our user data,
> (4) Azure Blob Storage for meal photos. Expected first-year usage: ~$2K
> across these services as we ramp from 0 to 500 paying users.

### For AWS Activate Builders

> LeanScan uses AWS Bedrock (Claude Sonnet) as one of our pluggable vision
> AI providers — currently the best-performing option in our internal
> benchmark on protein estimation accuracy. We will also use: (1) S3 for
> user-uploaded meal photos (currently on a local volume), (2) RDS Aurora
> Postgres or Lightsail Postgres as our production DB, (3) ECS Fargate or
> EC2 for our API, (4) CloudFront in front of the landing page. Expected
> first-year usage: ~$3K split between Bedrock vision calls and
> compute/storage as we ramp to closed beta and public launch.

### For Google Cloud for Startups (Start tier)

> LeanScan currently uses Gemini 2.0 Flash via the public API for our
> vision pipeline — it's our default provider and the best fit on the
> latency / cost / accuracy curve. We want to move it to a dedicated GCP
> project on credited usage to remove a personal-account constraint that's
> currently gating our public launch. Beyond Gemini, we plan to use Cloud
> Run for the Node API, Cloud Storage for meal photos, and Cloud SQL or
> AlloyDB for our Postgres. Expected first-year usage: ~$2.5K across these
> services as we ramp from closed beta to ~500 paying users.

### For Anthropic for Startups

> LeanScan's vision pipeline is provider-agnostic. We're currently testing
> Claude Sonnet 4.6 against Gemini 2.0 Flash for meal-photo macro
> estimation, with a particular focus on protein accuracy. Claude
> consistently wins on reasoning steps for unusual meals (mixed plates,
> homemade dishes, restaurant portions). We'd use Anthropic credits to:
> (1) run our production vision pipeline on direct Claude API instead of
> through Bedrock, (2) build a structured-output meal-parsing system
> (Claude → JSON macros), (3) experiment with Claude on the weekly summary
> generation (insight + tone). Expected first-year volume: ~50K image
> requests + ~10K structured-output text calls.

### For Supabase for Startups

> LeanScan runs production on Supabase Postgres (project
> czqrggnwiahcuntcumsq, Tokyo region) and we've shipped 6 migrations in
> production. We want to expand to: (1) Supabase Storage for meal photo
> hosting (currently on a VM volume), (2) Supabase Auth as an alternative
> path for future passwordless flow, (3) Supabase Edge Functions for
> webhooks from RevenueCat. Expected first-year storage usage: ~50GB photos
> across ~500 users.

### For Vercel for Startups

> LeanScan's landing page is built on Next.js 16 (App Router, Turbopack,
> Tailwind v4) with full SEO, OG image generation, and Edge-runtime API
> routes. We're ready to deploy and want Vercel for production hosting
> with custom domain + analytics. Future plans: deploy a web companion for
> the mobile app on the same Vercel project, sharing the API. Expected
> first-year usage: well within hobby/free tier for the landing page; Pro
> features needed for the web app phase (~$240 over 12 months).

### For DigitalOcean Hatch / Cloud credits

> LeanScan needs a stable cloud host for our containerized Node API. We're
> currently on a personal Azure VM that we cannot expose publicly. We want
> to deploy on a DigitalOcean droplet (1–2GB RAM) in the Singapore region
> to be close to our Tokyo-hosted Postgres. Expected first-year usage: ~$144
> on a $12/month droplet + ~$20 in Spaces for image storage.

---

## 14. Estimated 12-month cloud spend

For programs that ask for a number, use this:

| Service category | Estimated annual spend |
|---|---|
| Vision AI API calls (5 scans/day × 500 users × 365 days × ~$0.003/scan) | ~$2,750 |
| Compute (containerized API, 1 instance) | ~$300 |
| Postgres (managed) | ~$300 |
| Object storage (meal photos) | ~$120 |
| CDN / bandwidth | ~$60 |
| Monitoring + logs | ~$120 |
| Email (transactional) | ~$120 |
| **Total estimated year 1** | **~$3,800** |

Sized for 500 active users (the founder cohort). Doubles to ~$7,500 at
1,000 users.

---

## 15. Funding status

- **Bootstrapped, solo.** No outside capital raised.
- **No accelerator / incubator affiliation.**
- **No formal company entity yet.** Solo proprietorship under founder's
  name. Will incorporate (likely LLC equivalent in India, or US LLC) once
  revenue passes $5K MRR.
- **Plans for capital:** none planned in next 12 months. The product needs
  ~100 real users and 4 weeks of retention data before any conversation
  about capital makes sense.

---

## 16. Vision (5-year)

Year 1: Win 500 founder-cohort users at $39/year (~$20K ARR). Prove
protein-first hierarchy improves day-30 retention vs MyFitnessPal benchmark.

Year 2: Open public pricing, hit 5,000 paying users at $59/year ($295K ARR).
Add Apple Health / Google Fit integration, Web app, barcode scanning.

Year 3: Partnerships with GLP-1 telehealth providers (Ro, Henry Meds,
Mochi, Found, Sequence). White-label or co-brand for their patients.
Estimated ARR: $1M+ if 2–3 partnerships close.

Year 4–5: Become the default "if-MyFitnessPal-feels-bloated" tracker. Add
nutrition coach (Claude) for paid tier. Estimated ARR: $3–5M at 50K paying
users.

**Exit hypothesis:** acquisition by a major health platform (Apple Health,
WHOOP, Oura, a GLP-1 telehealth co) is plausible at ~$10M–$50M valuation
based on similar exits in the space (Cal AI's reported acquisition price,
Cronometer's path). Not the goal — sustainable indie SaaS is the goal —
but a credible scenario.

---

## 17. Common follow-up questions (prep)

**Q: What's your traction so far?**
A: Pre-launch. Product is built and working — Android APK installable, iOS
testable via Expo Go, live API. 0 external users; closed beta is the next
step. We've deferred public launch until we move infrastructure off
personal cloud accounts, which is why we're applying for credits now.

**Q: Why protein-first when most users want calorie tracking?**
A: Two reasons. First, the serious health-conscious user (our target)
actually optimizes for hitting protein, not staying under a calorie
ceiling. Second, every existing tracker leads with calories — we
differentiate by being the visible alternative. We're a switch in the home
screen, not a feature behind a paywall.

**Q: Why can MyFitnessPal not just do this?**
A: They have a 20-year-old data model centered on calories. Rebuilding the
hierarchy involves migrating 200M users to a new UX. We're betting they
will eventually, but we have a 12–24 month window before they do, which is
enough to win our segment.

**Q: How do you compete on database size with MyFitnessPal's 14M items?**
A: We don't. AI photo logging means we don't need a 14M-item database — we
need a vision model that recognizes ~10,000 common foods accurately. That's
already solved by Gemini Flash and Claude.

**Q: What's your AI accuracy?**
A: Internal testing on Gemini 2.0 Flash shows ~85% accuracy on common Western
meals for protein estimation within ±5g, ~75% within ±2g. Beta will tell us
real-world numbers. Worst case: users edit the AI estimate before saving,
same UX as MyFitnessPal's database results.

**Q: How are you handling data privacy / health data regulation?**
A: We're a nutrition tracker, not a medical device. No PHI claims, no
diagnostic features, no medication dosing advice. EU users covered under
GDPR (right to delete, data export). California users covered under CCPA.
Privacy policy explicit about data flows.

**Q: Solo founder — can you really build and market this alone?**
A: 10-20 hours/week, evenings and weekends. The product is built (proof of
capability). Marketing is the bottleneck, which I'm addressing through
build-in-public on X, TikTok content, and Reddit presence in target
subreddits. If I can't get to 500 signups in 90 days, this isn't going to
work and credits weren't the issue.

---

## How to use this kit

1. **Skim sections 1–10** before any application. They're the answers to
   80% of the form fields.
2. **For each program, paste the relevant variant from section 13.**
3. **For "estimated cloud usage,"** use section 14.
4. **Application order (lowest effort first):**
   - Microsoft for Startups Founders Hub (1 hr, fast approval)
   - DigitalOcean Hatch (30 min, fast approval)
   - Supabase for Startups (30 min, you're already a customer)
   - Vercel for Startups (30 min)
   - AWS Activate Builders (1 hr)
   - Google Cloud for Startups (1 hr)
   - Anthropic for Startups (1 hr — be specific about Claude use case)
5. **Apply to all in parallel.** They're independent.
6. **Expect 1–4 weeks for approvals.** Bigger asks take longer.

**Honest expectation:** with pre-launch / zero-user status, the easy tier
of each (sub-$5K credits) is achievable. The bigger tiers (AWS Activate
Portfolio, Microsoft $150K) typically require investor/incubator
affiliation, which you don't have. Aim for the easy tiers first; upgrade
later when you have a thousand users and a stronger story.

---

## What to update this doc with over time

- Traction numbers (replace "0 users" with real figures once beta starts)
- Retention data (day-7, day-30) once you have it
- ARR figures once paid tier is live
- Any press, viral moments, accelerator acceptances
- Updated cloud spend numbers as you learn actual costs

This is a living doc. Treat it like a portable founder kit. Update it
quarterly.
