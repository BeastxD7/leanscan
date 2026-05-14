# LeanScan v1 — Phased Build Plan

**Status:** Draft v0.1 — awaiting Shashank approval before code starts.
**Owner:** Shashank
**Last edited:** 2026-05-13
**Approval:** ☐ not yet
**Prerequisites:** `01-scope.md` (approved v0.3), `02-architecture.md` (approved v0.3)

---

## How phases work

- Phases are **sequential**. No phase starts until the previous one's Definition of Done is met.
- Each phase ends with something **demoable** — a build you (or a trusted friend) can install and use end-to-end for that slice of the product. This is "tracer bullet" / vertical slice development, not "build the whole backend then the whole frontend."
- Hours estimates assume 15 hrs/wk solo founder pace.
- A phase is "done" when its DoD checklist is fully ticked. We don't move forward on partial completion.
- Each phase ends with a **manual smoke test on both iOS and Android.** If a regression breaks something from a prior phase, that's a phase blocker.

## Total schedule

> **Local-first build.** Phases 0–6 run entirely on Shashank's laptop. No production infrastructure exists until Phase 7.

| Phase | Title | Weeks | Hours | Where it runs |
|---|---|---|---|---|
| 0 | Foundations (local) | 1–3 | 30–40 | Laptop |
| 1 | Snap → save (core loop) | 4–7 | 45–60 | Laptop |
| 2 | Weight + symptoms | 8–10 | 20–30 | Laptop |
| 3 | Resistance training | 11–12 | 20–25 | Laptop |
| 4 | Weekly digest (PDF + email) | 13–14 | 25–35 | Laptop |
| 5 | Settings, notifications, polish | 15 | 20–30 | Laptop |
| 6 | Admin console (AdminJS) | 16 | 10–15 | Laptop |
| 7 | Deployment + ship prep | 17–19 | 35–50 | **Production** |
| 8 | Beta launch + bug bash | 20–22 | 15–25 | Production |
| **Total** | | **17–22 weeks** | **220–310 hours** | |

---

## Phase 0 — Foundations (local) (Weeks 1–3, 30–40 hours)

### By the end of this phase, you can demo:
**You run `docker compose up` on your laptop. The API server starts at `http://localhost:3000`. You run `npx expo start` in another terminal. You scan the QR code with Expo Go on your phone (connected to the same WiFi). The app opens to a LeanScan welcome screen. You tap "Sign Up," enter email + password, complete onboarding (height, weight, goal, activity, optional medication), and see your personalized protein target.** Everything runs on your laptop. Nothing is deployed yet.

### Features delivered
- F1 (Account creation + onboarding) — complete

### Backend work (all local)
- [ ] Express + TypeScript project scaffold with linting, formatting, Vitest
- [ ] Dockerfile (production-ready, but used locally for now)
- [ ] `docker-compose.yml` with Postgres + MinIO + API services
- [ ] DB migration runner script + migrations: `001_users.sql`, `002_auth_sessions.sql`, `003_password_reset_tokens.sql`, `004_credit_ledger.sql`
- [ ] Health endpoint: `GET /health`
- [ ] Auth endpoints: signup, login, refresh, logout, forgot-password, reset-password, me
- [ ] Profile endpoints: GET, PATCH
- [ ] Onboarding endpoint: POST /onboarding/complete (+20 credit bonus)
- [ ] Gmail SMTP wired (Nodemailer) for password reset emails — uses your real Gmail App Password from dev, sends to test Gmail address
- [ ] JWT signing with strong secret + refresh token rotation
- [ ] bcrypt password hashing (cost 12)
- [ ] Rate limiting on `/auth/*` routes (per-IP + per-email)
- [ ] Error handler middleware with structured JSON responses
- [ ] Logging with Pino (JSON to stdout)

### Mobile work
- [ ] Expo Router project scaffold with TypeScript
- [ ] Brand theme (`src/theme/`) — colors, typography from context doc
- [ ] Font loading (Fraunces, Manrope) via `@expo-google-fonts`
- [ ] API client wrapper (axios or fetch) with auth header injection + 401 refresh handling
- [ ] **API base URL = `http://<your-laptop-LAN-IP>:3000`** for dev (e.g. `http://192.168.1.42:3000`). Switch to `https://api.leanscan.app` only at phase 7.
- [ ] Secure storage of tokens (expo-secure-store)
- [ ] Zustand store for auth + profile
- [ ] TanStack Query setup
- [ ] Screens: Welcome, Sign Up, Sign In, Forgot Password, Reset Password
- [ ] Onboarding flow: Goal → Body → Activity → Medication (optional) → Reminders → Target Reveal
- [ ] Empty home screen (placeholder — "Coming next phase")
- [ ] Navigation guards: redirect to auth if no token; redirect to onboarding if not complete

### Definition of Done
- [ ] You can sign up + onboard + see personalized protein target on iOS *and* Android via Expo Go on your phone
- [ ] Password reset email arrives in your inbox within 1 minute
- [ ] Local Vitest test suite passes (>60% coverage on auth routes)
- [ ] No secrets committed to repo (`.env` in `.gitignore`, only `.env.example` committed)
- [ ] README in `coding/api/` documents how to run locally
- [ ] README in `coding/app/` documents how to run with Expo Go + how to find your laptop's LAN IP

### Risks for this phase
- Custom auth bugs (token expiry, refresh race conditions) — mitigate with thorough Vitest tests on auth routes
- Expo Go connectivity issues if phone is on a different WiFi / VPN — document the LAN IP setup clearly
- Expo SDK version mismatches with libraries — pin versions in package.json early

### Parallel marketing work (recommended, even though build is sequential)
- Deploy the landing page in week 1 (it'll be off-message until rewritten, but presence matters for SEO + early signups)
- Register `leanscan.app` domain on Cloudflare or Namecheap
- Set up ConvertKit free tier
- Set up Plausible analytics

---

## Phase 1 — Snap → Save (Weeks 4–7, 45–60 hours)

### By the end of this phase, you can demo:
**You snap a photo of your lunch. The app shows a protein-first result card 6-8 seconds later. You tap "Save." The home screen's protein ring fills from 0g to 28g. You scan another meal. Ring goes to 54g. You're below your daily 128g target, so you tap "Add manually" and quick-add a protein shake (+30g). Ring is now 84g. You see your meal history for today, swipe right to delete one, ring goes back to 56g.**

This is the **killer demo phase**. After this, LeanScan exists as a product. Everything else is polish + completeness.

### Features delivered
- F2 (AI photo meal logging)
- F3 (Manual meal entry + recent meals)
- F4 (Protein-first dashboard)
- F9 (Credit-based scan gating)

### Backend work
- [ ] DB migrations: `005_meals.sql`
- [ ] Meal endpoints: list by date, photo upload (with Gemini call), save, edit, delete, recent
- [ ] Gemini integration service with structured-output parsing + error handling
- [ ] Photo upload to Supabase Storage (private bucket, user-scoped path)
- [ ] Image resizing middleware (max 1024px, JPEG output to save bandwidth)
- [ ] Credit-gating middleware: check balance, deduct, log ledger entry, atomic transaction
- [ ] Credit refill (lazy, on credit check): +10 per 24h, capped at 50
- [ ] GET /credits endpoint with balance + paginated ledger
- [ ] Rate limiting on /meals/photo (10/min per user)
- [ ] Endpoint tests in Vitest

### Mobile work
- [ ] Home screen (real, not placeholder):
  - [ ] Protein ring (primary) + calorie ring (secondary) with Victory Native XL
  - [ ] Today's meals list (latest first)
  - [ ] Floating "Snap" button
  - [ ] Pull-to-refresh
  - [ ] Empty state copy
- [ ] Camera flow (expo-image-picker):
  - [ ] Take photo OR pick from gallery
  - [ ] Preview screen
  - [ ] Upload with progress
  - [ ] Result card (Fraunces big number, edit affordance)
  - [ ] Accept / retake / edit-portion / edit-name / cancel
- [ ] Manual entry flow:
  - [ ] "Add manually" sheet
  - [ ] Quick add form (name, protein, optional calories)
  - [ ] Recent meals list (last 10 unique, deduped by name)
- [ ] Meal edit + delete via swipe / long-press
- [ ] Credit balance pill on home screen (small, top-right)
- [ ] "Out of credits" sheet with "log manually" CTA when 402 received

### Definition of Done
- [ ] Snap → AI estimate → save round trip < 10 seconds on Wi-Fi
- [ ] Tested on iOS + Android, portrait + landscape photos, HEIC + JPEG + PNG
- [ ] Credit deduction is atomic (failed Gemini call = no charge)
- [ ] Recent meals list updates immediately after a save (TanStack Query invalidation)
- [ ] Edit/delete works and protein ring updates correctly
- [ ] Home screen renders with 0 meals (empty state) and 30 meals (no perf issue)
- [ ] 402 (out of credits) shows clear UX, doesn't crash
- [ ] All meal endpoint tests pass

### Risks for this phase
- Gemini accuracy variance — if estimates are wildly wrong on common meals (eggs, chicken), pause and tune prompt before continuing
- Image upload size on mobile networks — test on 3G simulation
- Storage costs creeping up — monitor Supabase Storage usage weekly

---

## Phase 2 — Weight + symptoms (Weeks 8–10, 20–30 hours)

### By the end of this phase, you can demo:
**You wake up Monday. Notification reminds you to log your weight. Tap → enter 78.4 kg → save. You feel bloated, so you tap the symptoms icon → "Bloating" → severity 3 → save. Wednesday: 78.1 kg, low energy. Friday: 77.9 kg. You open the Reports tab. You see a weight chart trending down 0.5kg over the week, and a symptom heatmap showing bloating on Mon/Wed/Fri.**

### Features delivered
- F5 (Daily weight log)
- F6 ("How you feel today")

### Backend work
- [ ] DB migrations: `006_weights.sql`, `007_symptoms.sql`
- [ ] Weight endpoints: list by range, upsert today's weight
- [ ] Symptom endpoints: list by range, log
- [ ] Validation: weight 20-300 kg, severity 1-5

### Mobile work
- [ ] Reports tab (new bottom tab)
- [ ] Weight screen:
  - [ ] Quick entry sheet
  - [ ] Line chart (7d / 30d / 90d / all-time selector)
  - [ ] Goal weight as horizontal line
- [ ] Symptom quick-log:
  - [ ] Expandable icon row on home screen
  - [ ] Symptom grid: energy, mood, fatigue, GI, bloating, headache, sleep, hunger, soreness (+ GLP-1 specific if applicable)
  - [ ] Severity slider + optional note
- [ ] Symptom heatmap screen (7-day grid view)

### Definition of Done
- [ ] Weight reminder notification fires reliably 7 mornings in a row
- [ ] Chart renders 30 data points smoothly
- [ ] Quick-log takes ≤ 4 taps end to end
- [ ] Symptoms screen shows correct color-coding for severity
- [ ] Unit toggle (kg/lb) works everywhere

---

## Phase 3 — Resistance training (Weeks 11–12, 20–25 hours)

### By the end of this phase, you can demo:
**You head to the gym. Open the Workouts tab. Tap "Start workout." Pick "Squat" from the preloaded list. Log 3 sets: 60kg×5, 60kg×5, 60kg×4. Add "Bench press" → 40kg×8 for 3 sets. Finish workout. Next session a week later, you start a workout, tap Squat, the app pre-fills "Last time: 60kg×5,5,4. Try 62.5kg?"**

### Features delivered
- F7 (Resistance training log)

### Backend work
- [ ] DB migrations: `008_workouts.sql`, `009_workout_sets.sql`, `010_user_exercises.sql`
- [ ] Workout endpoints: start, add-set, finish, list, last performance for exercise
- [ ] Preloaded exercise list seeded in DB

### Mobile work
- [ ] Workouts tab
- [ ] Start workout flow
- [ ] Exercise picker (search + recent + add-custom)
- [ ] Set logger (weight + reps, "Add set" button)
- [ ] Last-session pre-fill banner
- [ ] Workout history list + detail
- [ ] Per-exercise progression sparkline

### Definition of Done
- [ ] Logging 3 exercises × 3 sets takes < 90 seconds (timed test)
- [ ] Past workouts persist correctly
- [ ] Pre-fill suggestion shows last session's top set
- [ ] Custom exercises persist after restart

---

## Phase 4 — Weekly digest (Weeks 13–14, 25–35 hours)

### By the end of this phase, you can demo:
**Sunday morning 8 AM. You get a notification: "Your week is ready." You tap it. Beautiful one-page PDF opens — protein average chart, calorie average, weight trend, symptom heatmap, workout count, top 3 meals by protein. Brand voice in the intro and outro. You tap "Share" → email it to your friend who's also tracking.**

### Features delivered
- F8 (Weekly metabolic report PDF + email)

### Backend work
- [ ] DB migrations: `011_reports.sql`
- [ ] Cron job: Sunday 00:00 UTC, iterate active users, generate report per user's local timezone
- [ ] Aggregation queries: protein avg, calorie avg, weight delta, symptom counts, workout counts, top meals
- [ ] HTML template for the report (forest/cream/amber brand)
- [ ] Puppeteer render to PDF
- [ ] Upload PDF to Supabase Storage
- [ ] Send push notification via Expo Push API
- [ ] Optional Gmail SMTP email with PDF attachment

### Mobile work
- [ ] Reports tab gains "Weekly" section
- [ ] List of past reports with date range
- [ ] PDF viewer (expo-document-picker or react-native-pdf)
- [ ] Share button (system share sheet)
- [ ] Settings toggle: auto-email reports yes/no, email address override

### Definition of Done
- [ ] First Sunday after deploy: PDF generates for at least one test user
- [ ] PDF looks correct on iOS Files and Android share sheet
- [ ] Empty/sparse week renders without errors ("You logged 2 days — let's aim for 5 next week")
- [ ] Email delivery succeeds via Gmail SMTP
- [ ] Notification fires reliably

### Risks for this phase
- Puppeteer in Docker can OOM on a 1GB Droplet under load. Mitigation: queue jobs, run one at a time, restart Chromium per job
- Gmail SMTP rate limit could throttle Sunday morning burst. Mitigation: spread sends across the morning, retry on rate-limit error

---

## Phase 5 — Settings, notifications, polish (Week 15, 20–30 hours)

### By the end of this phase, you can demo:
**You go into Settings. Update your weight (protein target recalculates). Switch units to imperial. Flip dashboard priority to calorie-first (just to see). View your credit ledger. Toggle off mid-day protein nudges. Export your data as JSON. Cancel your account (test only).**

### Features delivered
- F10 (Notifications & reminders) — full implementation
- F11 (Settings + privacy/terms + account hygiene)

### Backend work
- [ ] Push notification scheduling (Expo Push API integration)
- [ ] Mid-day protein nudge job (checks at 2 PM user-local time)
- [ ] Anniversary nudges (1 week, 1 month, 3 months)
- [ ] Privacy policy + terms of service pages (boilerplate from termly.io, hosted on website)
- [ ] Account export endpoint (returns ZIP of all user data as JSON)
- [ ] Account delete endpoint (cascade + audit log entry)

### Mobile work
- [ ] Settings screen with all sections (profile, display, units, notifications, account, legal, about)
- [ ] Profile edit with protein-target recalc
- [ ] Unit toggle propagates everywhere
- [ ] Dashboard-priority toggle (protein vs calorie first)
- [ ] Credit ledger view
- [ ] Notification preferences (per-type toggles)
- [ ] Data export → share sheet
- [ ] Account deletion (double-confirmation)
- [ ] Sign out

### Definition of Done
- [ ] Notification preferences honored (turn off, no nudges; turn on, nudges fire)
- [ ] Data export delivers valid JSON
- [ ] Account deletion removes user from all tables (verified via SQL spot check)
- [ ] Privacy + terms hosted at leanscan.app/privacy and /terms

---

## Phase 6 — Admin console (Week 16, 10–15 hours)

### By the end of this phase, you can demo:
**You visit admin.leanscan.app, sign in with your founder admin account. See a list of all 30 beta users. Click on one. View their profile, credit balance, meal count. Click "Grant 50 credits" → enter reason "Friend testing the new dashboard" → save. Their balance updates. The action shows up in the audit log. Visit Stats: 30 users, 12 DAU, 240 scans today.**

### Features delivered
- F12 (Admin console)

### Backend work
- [ ] AdminJS package install + Express integration
- [ ] AdminJS resources for: users, meals, weights, workouts, credit_ledger, admin_audit_log
- [ ] Custom AdminJS action: "Grant Credits" with reason input
- [ ] Custom AdminJS action: "Suspend / Reactivate User"
- [ ] Custom AdminJS action: "Reset Password" (triggers email)
- [ ] Custom AdminJS action: "Toggle Founder Cohort"
- [ ] AdminJS auth: role check via session
- [ ] Bootstrap script: create first admin from env vars on first deploy
- [ ] Audit logging via AdminJS hooks
- [ ] Stats dashboard component: DAU, signups today, scans today, error count

### Mobile work
- None for this phase.

### Definition of Done
- [ ] Admin can sign in at /admin
- [ ] Non-admin users get 403
- [ ] All admin actions create audit log rows
- [ ] Stats dashboard loads in < 2 seconds with 100 test users
- [ ] Credit grant updates balance atomically + creates ledger entry

---

## Phase 7 — Deployment + ship prep (Weeks 17–19, 35–50 hours)

> **This phase is now bigger than before** because all deployment work that was originally seeded into Phase 0 lives here. Per founder decision (local-first development), the entire production stack is set up in one chunk after the app is feature-complete locally.

### By the end of this phase, you can demo:
**A non-technical friend opens leanscan.app on their phone. Sees a "Join the Beta" CTA. Enters their email. Picks "iOS" → gets an email with a TestFlight invite within minutes (you send it manually). Picks "Android" → gets an APK download link, taps it, allows install, opens LeanScan. They onboard, snap a meal, and it works — the same app you've been running locally for months, now on production infrastructure.**

### What ships
- Production backend at `api.leanscan.app`
- Production mobile builds (TestFlight + signed APK)
- Public landing page at `leanscan.app`
- Beta-invite workflow

### Production infrastructure work (NEW for this phase)
- [ ] Create production Supabase project (Postgres + Storage)
- [ ] Run all DB migrations against production Postgres
- [ ] Create production Storage bucket with correct policies
- [ ] Provision DigitalOcean Droplet (Ubuntu 24.04 LTS, $6/mo basic)
- [ ] SSH hardening (disable root login, key-only auth, ufw firewall)
- [ ] Install Docker + Docker Compose on Droplet
- [ ] Install Caddy with auto-TLS
- [ ] Caddyfile: reverse-proxy `api.leanscan.app` → localhost:3000
- [ ] Generate production secrets (JWT_SECRET, etc.) and store in Droplet env vars
- [ ] DNS: `api.leanscan.app` A-record → Droplet IP
- [ ] DNS: `leanscan.app` A-record → Vercel/Cloudflare Pages (landing)
- [ ] DNS: `admin.leanscan.app` → Droplet (admin console on same backend)
- [ ] First deploy: clone repo, populate `.env`, `docker compose up -d` (without local-only services)
- [ ] Health check: `curl https://api.leanscan.app/health` returns 200
- [ ] Smoke test: sign up + onboard via Expo Go (pointing at prod API)
- [ ] Set up nightly DB backup script via cron (pg_dump to local Droplet disk + Supabase has its own)
- [ ] Optional: GitHub Actions auto-deploy on push to `main` (otherwise SSH-and-pull is fine for V1)

### Mobile distribution work
- [ ] Switch app's API base URL to `https://api.leanscan.app` (build-time env)
- [ ] App icons + splash screens for iOS + Android (final brand assets)
- [ ] EAS Build configuration (eas.json)
- [ ] iOS bundle ID registered in App Store Connect (requires $99 Apple Dev account)
- [ ] Android signing keystore generated + stored safely
- [ ] First TestFlight build uploaded
- [ ] First signed APK built + uploaded to `leanscan.app/download/android`
- [ ] Smoke test on iOS 16, 17, 18 simulators + physical device
- [ ] Smoke test on Android 8, 11, 14 (emulator)

### Landing page work
- [ ] Rewrite landing copy to match all-in-one health-tracker positioning
- [ ] Add "Join the Beta" form with iOS / Android picker
- [ ] Wire form to ConvertKit (or backend `/beta/signup` endpoint)
- [ ] Deploy to Vercel / Cloudflare Pages
- [ ] OG image, favicon, social share preview tested

### Admin / TestFlight workflow
- [ ] Admin console route for managing beta-invite queue
- [ ] When admin marks a signup "iOS approved" → manually send TestFlight invite from App Store Connect
- [ ] When admin marks "Android approved" → send templated email with APK link

### Definition of Done
- [ ] `curl https://api.leanscan.app/health` → 200
- [ ] Local-pointed Expo Go works against production API (test sign up + onboard)
- [ ] You can sign up on `leanscan.app` → receive TestFlight invite within 30 minutes (manual)
- [ ] Friend on Android downloads APK → installs → onboards → snaps a meal → it works
- [ ] App tested on 2 iOS versions + 2 Android versions without crash
- [ ] Nightly DB backup script runs on schedule, output verified
- [ ] DEPLOY.md in `coding/api/` documents the exact reproducible steps

### Risks for this phase
- **First-deploy surprises.** Things that work in `docker compose up` locally sometimes break in prod due to env differences. Budget 6-10 hours for "production smoke turned up X." Most common: Chromium permissions for Puppeteer, file system paths, network DNS.
- **Apple TestFlight review for first submission** can take 24-48 hours. Submit early in the week.
- **Android APK install requires user to enable "Unknown sources"** — write a clear step-by-step in the invite email.
- **DigitalOcean Droplet 1GB RAM ceiling** — if Puppeteer + Express + Postgres-client all run concurrently and OOM, we'll see it here. Mitigation: queue PDF jobs, restart Chromium per render.
- **Production secrets management** — first time storing real secrets. Don't paste them in commit messages or Slack. Keep them on the Droplet only.

---

## Phase 8 — Beta launch + bug bash (Weeks 20–22, 15–25 hours)

### By the end of this phase, you can demo:
**You have 25-50 real beta users. They've logged > 500 meals, > 100 weights, run > 30 workouts. You've fixed every show-stopper bug they've reported. The app feels solid. You're ready to start thinking about v1.1 (App Store + payments) — but that's a different planning doc.**

### Features delivered
- None new — this phase is iteration + bug fixes.

### Work
- [ ] Recruit 25-50 beta testers (waitlist users + your network)
- [ ] Send TestFlight invites + APK links
- [ ] Daily check of error logs (Pino → SSH `docker logs`)
- [ ] Triage bugs into critical (block release) / important (this week) / nice-to-have (v1.1)
- [ ] Fix critical immediately, important within 3 days
- [ ] Weekly user survey (5 questions: Net Promoter Score + favorite feature + biggest annoyance + protein logging frequency + retention intent)
- [ ] Document V1.1 backlog in `planning/decisions.md`

### Definition of Done
- [ ] No critical bug open for > 24 hours
- [ ] No important bug open for > 7 days
- [ ] User retention > 40% on day 7
- [ ] At least 5 users say they'd pay $39/year for it
- [ ] Beta hits 25 users minimum

---

## What V1 does NOT include (deferred to v1.1+)

- Apple In-App Purchase / Google Play Billing (payments)
- RevenueCat
- Public App Store / Play Store listings
- Razorpay (for future webapp)
- Apple Health / Google Fit integration
- Wearable sync
- Webapp
- Sentry / PostHog (re-evaluate when needed)
- Anything else in `01-scope.md` § 4 "Explicitly OUT of scope for v1"

---

## Parallel marketing work (build is sequential, but these can run in parallel)

The build is officially sequential per the founder decision (May 13, 2026). But these don't require code work and shouldn't block:

| When | What |
|---|---|
| Week 1 | Register domain, deploy landing page (current GLP-1 copy → "coming soon" placeholder) |
| Week 1 | Set up ConvertKit free tier, point landing form to it |
| Week 1 | Set up Plausible analytics on landing |
| Week 2 | Review mining (replace remaining GLP-1 patterns with generic ones) — 4-5 hours |
| Weeks 3-15 | Reddit lurking, occasional helpful posts in r/Fitness, r/loseit, r/leangains |
| Weeks 6-15 | TikTok content: 1-2 videos per week, batch-shoot on weekends |
| Week 12 | Re-write landing page copy to match new positioning |
| Week 17 | First micro-influencer DMs |
| Week 19 | Send TestFlight + APK invites to waitlist |

This parallel work doesn't add code-build hours — it's marketing / strategy work. But signups during the build is what makes phase 8 (beta) actually have users.

---

## Risk register (build-wide)

- **Founder burnout.** 14-21 weeks of 15 hrs/wk side-project effort = real risk. Mitigation: weekly retro, take week 21 off if needed, no shame in slipping.
- **Scope creep.** Every "while I'm in there..." adds 20% to the phase. Mitigation: write down v1.1 ideas in `decisions.md` and move on.
- **AI cost surprise.** Gemini free tier evaporates if 100 beta users average 20 scans/day. Mitigation: PostHog-less monitoring via simple Pino log analysis + credit caps.
- **DigitalOcean Droplet outage.** $6 droplets aren't HA. Mitigation: nightly DB backup to Supabase, weekly snapshot of droplet.
- **Apple TestFlight review delays.** Submit phase 7 build by week 17 Tuesday to allow buffer.

---

## Approval

When you approve, the next step is for me to actually start writing code — Phase 0 scaffolding.

**Approval status:** ☐ pending Shashank review

If you approve and want to start, write **"approved, start phase 0"** and I begin scaffolding the Express + Expo projects, Dockerfile, DB migrations, and the first end-to-end auth flow.

If anything in this phasing feels wrong (timing too long/short, phase boundaries off, wrong features grouped together), flag it and I'll revise.
