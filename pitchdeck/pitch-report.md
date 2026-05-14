# LeanScan — Founder Pitch Report

*An honest write-up. Last updated 14 May 2026.*

---

## One-sentence pitch

**LeanScan is an AI-first calorie tracker that takes the work out of logging — snap a photo, get protein in seconds — tuned for people who actually need to hit a protein target: GLP-1 patients, lifters, and anyone serious about body composition.**

---

## The problem

Logging food is the worst part of every calorie tracker.

MyFitnessPal — the category leader — has a 14-million-item database and still makes you tap through 6 screens to log a chicken breast. The product was designed in 2005 for desktop. Mobile is a port. Search is terrible. Their AI photo feature, added in 2024, is buried four taps deep and gated behind a $20/month subscription.

For most people, this friction means they stop tracking within two weeks. For people who have a *medical* reason to track — GLP-1 patients trying to preserve muscle on Mounjaro, lifters trying to hit 1.6 g/kg, recomp users trying to read the scale — quitting tracking isn't an annoyance. It's a clinical risk.

**Specifically: GLP-1 users in a caloric deficit lose ~25% of their dropped weight as lean mass when protein intake is inadequate** (multiple studies, 2023–2024). The drug suppresses appetite, the user eats less, the macros don't get checked, the muscle goes. The single most evidence-based countermeasure is "consume 1.6+ g/kg protein daily." That number is *exactly* what nobody on Ozempic is hitting, because they can't be bothered to track.

The problem isn't motivation. The problem is the UI.

---

## The solution

Open LeanScan. Tap a button. Photograph your meal. Three seconds later: a protein number, a calorie number, a one-tap save.

That's it. No search. No database scrolling. No barcode dance. No "logged 1 of 47 ingredients."

The home screen is built around a single number: today's protein. Calories sit underneath as context, not as the headline. Macros are tertiary. The brand voice is calm and clinical rather than gamified — no streaks, no shame, no "you have 312 cheat calories left."

Three meal-logging paths cover every situation:
- **Snap** — photo → AI estimate → review → save (the killer demo, ~5 seconds end-to-end)
- **Quick Add** — tap a recent meal chip → re-logs instantly with the saved macros (~1 second)
- **Manual** — type macros directly when AI can't help (~15 seconds)

For GLP-1 users specifically, the protein target auto-bumps to 1.6 g/kg when they're in a deficit, the home screen shows a small medication acknowledgment ("Mounjaro · protein target tuned for muscle protection"), and the onboarding explains *why* their number is what it is.

---

## Why this matters now

Three converging trends:

1. **GLP-1 explosion.** Roughly 9% of US adults have used a GLP-1 medication. ~6 million active users on Ozempic / Wegovy / Mounjaro / Zepbound combined. This number is doubling year-over-year. None of the major calorie trackers were designed for this user.

2. **Vision-model commoditization.** GPT-4V / Gemini Flash / Claude Sonnet can all identify food from a photo with ~85–90% accuracy on common meals. The unit economics work out to <$0.01 per scan at scale, well below the ARPU of a $5/month subscription. The "AI nutrition coach" thesis is finally affordable.

3. **Distribution shift.** TikTok and Reddit are the discovery channels for GLP-1 weight management. r/Ozempic has 250k members. r/loseit has 4.2M. r/SemaglutideFreeSpeech, r/GLP1, r/Mounjaro all >10k each. These communities are starved for products built for them; everything pitched to them today is a re-branded MyFitnessPal.

The window for a vertical, GLP-1-aware calorie tracker is roughly 18–24 months before MyFitnessPal pivots their AI offering. After that, the entrenched data moat wins. Before that, the differentiation on AI-first UX and protein-aware math is enough.

---

## Wedge & competitive landscape

**The wedge is the GLP-1 community**, not "calorie tracking." Going for the calorie tracker market head-on means losing to MyFitnessPal's 14M database. Going for the GLP-1-on-a-cut subsegment means winning a $0 budget against zero direct competitors.

Once we own that beachhead, expansion goes outward — first to general protein-aware tracking (lifters, recomp users), then to broader macro tracking. The product is built for that expansion already: the AI logs anything edible, the math handles any goal, the protein-first hierarchy is a UI choice not a product limitation.

| Competitor | Why they don't win this user |
|---|---|
| **MyFitnessPal** | Generic, search-heavy, 14M-item database is the wrong feature for AI-first logging. Their AI photo feature exists but is buried + paywalled. No GLP-1-specific UX. |
| **Cronometer** | Best-in-class data accuracy, terrible UX. Power-user tool. Won't win mainstream GLP-1 users who don't care about micronutrients. |
| **Lose It!** | Closest in spirit to LeanScan but no AI-first photo flow and no GLP-1 personalization. |
| **MacroFactor** | Strong with lifters, premium-only ($72/year), no AI photo, no medication tuning. |
| **Carbon Diet Coach** | Premium-only, coaching-based, no AI. |
| **Bolt / Calo / Eat This Much** | Recipe-focused, not tracking-focused. |

**LeanScan's defensible moat after the beachhead is held:** the GLP-1-specific math + community + content. A general tracker can't replicate "we know what dose Mounjaro you're on and what protein target that implies" without re-architecting.

---

## Product status (the honest version)

**Built and working as of 14 May 2026:**

- **Phase 0** — full auth (custom JWT, refresh tokens, password reset), 6-step onboarding flow
- **Phase 1** — AI photo scan → estimate → review → save, meal detail screen, manual entry, quick-add chips, settings, branded UI with Feather icons + custom logo mark
- **Personalization** — Mifflin-St Jeor BMR + activity TDEE + goal kcal adjustment for daily calorie target, protein target with GLP-1 medication-aware bump, goal weight progress strip, weigh-in flow
- **Notifications** — daily local weigh-in reminder + meal-log nudge, permission UX, cancel-on-signout
- **AI stack** — multi-provider abstraction (Gemini / OpenAI / Azure OpenAI / AWS Bedrock); currently running Claude Sonnet 4.6 via Bedrock; switch is a one-line env var change

**Architecture:**

- **Mobile** — React Native + Expo SDK 55, Expo Router v5, Zustand state, TanStack Query
- **API** — Node 22 + Express + TypeScript, Prisma 6 + Postgres
- **Auth** — Custom JWT (no Supabase Auth), bcryptjs password hashing
- **Image pipeline** — Multer + Sharp + local filesystem storage (Droplet volume in prod)
- **AI** — Vision provider abstraction, ~5-second scan latency, 1 credit per scan
- **Credits** — 100 grant + 20 onboarding bonus + 10/day refill + 50 cap, scan debits 1
- **Deployment-ready** — Dockerized, env-driven, runs on a single $20/mo droplet

**What's not built yet:**

- TestFlight / Play Store internal track (a few hours of EAS config)
- Web app (deliberately deferred to Phase 7 — mobile-first)
- Payments / subscription (deliberately deferred — see roadmap)
- Symptom tracking for GLP-1 users (Tier 3 work; would close the last onboarding overpromise)
- BarcodeScanning (Tier 3+; AI photo handles ~85% of cases without it)

**Real talk: zero external users so far.** v1 has been built end-to-end but hasn't been put in front of anyone outside the founder. Closing that gap is the next thing — see roadmap.

---

## Business model

Phase 1 (now → next 6 months): **free with a credit cap.** 100 initial credits + 10/day refill + 50 ceiling. Power users who scan more than ~3 meals/day will hit the cap. This is intentional — it's the natural pricing trigger.

Phase 2 (6–12 months): **subscription that lifts the cap.** Target $5/month or $40/year. Industry benchmark for AI-photo tracking is $20+/month from MyFitnessPal Premium AI; we're deliberately undercutting to win the GLP-1 segment.

Phase 3 (12+ months): **partnerships with GLP-1 telehealth providers.** Ro, Henry Meds, Mochi, Found, Sequence, etc. White-label or co-branded for their patients. This is the real unit economics — these companies pay $50–100 CAC for a customer who needs an AI calorie tracker. LeanScan is a natural retention tool.

**Why no payments yet:** validating the AI-photo + protein-first hypothesis is more important than monetization. If users won't use it for free, they won't pay for it.

---

## The ask

LeanScan is currently solo-built and self-funded. The honest ask is:

1. **Beta testers**, especially GLP-1 patients and lifters in a cutting phase. Real usage feedback is worth more than another month of building.
2. **Honest feedback** from anyone who's tried to track macros and failed. What broke?
3. **Introductions** to GLP-1 telehealth founders (Phase 3 partnership target).
4. **No funding ask yet.** The product needs ~100 real users and 4 weeks of retention data before any conversation about capital makes sense. Talking to investors before that is premature.

---

## Roadmap (next 90 days)

| Week | Focus |
|---|---|
| 1 | Production builds → TestFlight + Play Store internal track. Onboarding 10 beta users from network + r/Ozempic. |
| 2–3 | Retention / engagement measurement. What % of beta users log day 3? Day 7? Day 14? |
| 4 | Iterate on the highest-friction step identified from beta data. Likely candidates: signup, first scan, manual entry. |
| 5–6 | Open beta — landing page live, public TestFlight invite, build-in-public Twitter cadence. Target: 100 signups. |
| 7–8 | First paid tier validation. Soft paywall on credit cap. Target: 10% conversion. |
| 9–12 | Reach out to 5 GLP-1 telehealth founders for Phase 3 partnership exploration. |

---

## Why I'm building this

I started building LeanScan because [REPLACE WITH YOUR REAL REASON — e.g., "I watched a friend on Wegovy lose 15 kg and end up weaker, and the cause was inadequate protein tracking that no existing app made easy"].

The product isn't trying to be the most-featured calorie tracker. It's trying to be the *easiest* one to use for the next 6 weeks, for the user who actually needs it to work.

If you're someone who tracks food and gave up on MyFitnessPal — I want to talk to you. If you're on a GLP-1 and worried about muscle loss — I want to talk to you. If you're an indie founder who wants to compare notes on building in this space — I want to talk to you.

---

*Contact: shashank@pebbleroad.com*
*Build journal: [your Twitter / X handle when you start posting]*
*Repo: github.com/BeastxD7/leadscan (private — open beta planned for week 6)*
