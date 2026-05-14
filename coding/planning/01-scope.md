# LeanScan v1 — Scope Plan

**Status:** APPROVED v0.3 — re-approved alongside architecture v0.3 on 2026-05-13.
**Owner:** Shashank
**Last edited:** 2026-05-13
**Approval:** ✅ approved 2026-05-13 by Shashank

---

## 1. What "v1 launch" means

- **Audience:** Beta users acquired through the LeanScan landing page waitlist. Not the public App Store / Play Store.
- **Android:** APK download direct from `leanscan.app/download/android`. User installs by allowing "Install from unknown sources" on their phone.
- **iOS:** TestFlight invite. Apple does not allow direct APK-style installs. Flow: user signs up on leanscan.app → backend collects their Apple ID email → I send TestFlight invite manually for the first 50-100 users → user installs TestFlight app → opens invite link → installs LeanScan.
- **Both platforms ship at the same time.** No "iOS first, Android later" split. Adds ~1-2 weeks vs iOS-only.
- **Not in v1 launch:** App Store + Play Store public listings. Those come 2-4 weeks after beta, once the worst bugs are fixed and 50+ beta users have provided feedback.

---

## 2. Platforms

| Platform | Channel | v1 Launch | v1.1 |
|---|---|---|---|
| iOS | TestFlight (invite via website) | ✓ | App Store public |
| Android | Direct APK download from website | ✓ | Play Store public |
| Web | — | — | Possible v2 |

**Single React Native codebase via Expo.** Per-platform tweaks where they're unavoidable (camera permissions, font loading, native dialogs).

- **iOS minimum:** 16.0 (~94% device coverage)
- **Android minimum:** API 26 / Android 8.0 (~98% device coverage)

---

## 3. Features (v1)

For each: **User story** (in user's voice) → **Why it exists** (the strategic reason) → **What it does** (concrete behaviour) → **Definition of done** (how we know it's shippable) → **Dependencies**.

### F1 — Account creation + onboarding

**User story.** *"I just downloaded LeanScan. I want to spend 90 seconds setting up my profile, then start using the app."*

**Why it exists.**
- We can't calculate a personalized protein target without knowing the user's body weight.
- We can't tailor the experience without knowing the user's goals and activity level.
- We need an account to sync between iOS and Android, and to email weekly reports.
- Required by the data-sync architecture (every meal/weight/etc is tied to a user_id).

**What it does.**
1. App opens → splash screen → welcome.
2. **Guest mode by default.** User can use the app immediately without signup; data stored under an anonymous server-side identity (Supabase Anonymous Auth). User can upgrade to a real account later from Settings to enable cross-device sync.
3. **Step 1 — Goal:** primary goal toggle [Lose weight / Build muscle / Recomp / Maintain]. Drives default protein target.
4. **Step 2 — Body stats:** height (cm or ft/in toggle), current weight (kg or lb toggle), goal weight.
5. **Step 3 — Activity level:** [Sedentary / Lightly active / Moderately active / Very active]. Affects protein target.
6. **Step 4 — Optional medication question:** "Are you on any of these medications? (Optional — helps us tailor the app)" with options [None — most people pick this / Ozempic / Wegovy / Mounjaro / Zepbound / Saxenda / Compounded Semaglutide / Compounded Tirzepatide / Other]. Default selection: "None." This question is *not* the focus of onboarding; it's tucked away with a clear "skip" option.
7. **Step 5 — Reminder preferences:** preferred time for morning weight log, opt in/out of meal nudges.
8. **Step 6 — Calculated protein target reveal:** "Based on your weight and goal, your daily protein target is **128g**." Editorial tone. User can adjust manually if they have specific guidance.
9. **Done → home screen.**

**Definition of done.**
- All 6 steps render and validate input.
- Skip / back works at every step.
- Guest mode works end-to-end (use app, log data, persist locally + server-side via anonymous auth).
- Persists to backend on completion.
- Onboarding only runs on first launch — never re-shown unless user resets.
- Re-running onboarding from Settings overwrites profile.

**Dependencies.** Supabase Anonymous Auth (background — invisible to user) + profile table in DB.

---

### F2 — AI photo meal logging

**User story.** *"It's lunch. I open the app, tap one button, snap one photo, and within 10 seconds I see how much protein this adds to my day and where it puts me on calories."*

**Why it exists.**
- The defining feature. Cal AI proved consumers will pay for this.
- Existing apps require 30+ seconds of searching/typing per meal.
- This is the "wow" moment that drives TikTok shares and word-of-mouth.

**What it does.**
1. From home screen, tap the floating "Snap" button.
2. Choose: take photo (opens camera) OR pick from gallery.
3. Take/pick photo → preview screen.
4. App uploads photo to backend → backend calls Gemini Vision API → returns structured estimate.
5. **Result card:** large protein number on top, meal name, estimated portion, calories/carbs/fat as secondary, confidence indicator.
6. User can:
   - **Accept** → adds to today's protein and calorie totals.
   - **Edit portion** → +/- slider that scales all macros proportionally.
   - **Edit meal name** → rename if AI got it wrong.
   - **Retake** → throw it away.
7. After accept, returns to home screen with updated rings.

**Definition of done.**
- End-to-end latency under 8 seconds on a decent network.
- Photo + AI response stored in DB linked to user.
- Photo physically stored in Supabase Storage with user-scoped access.
- Handles errors gracefully: network failure, AI timeout, low-confidence response, "not a meal" detection.
- Works on both iOS and Android, including portrait/landscape photos and HEIC format.

**Dependencies.** F1 (auth), backend API (Gemini proxy), Supabase Storage, camera permissions.

**Known risk.** Gemini accuracy is roughly directionally correct, not lab-precise. The Edit affordance compensates. Don't promise lab-grade in the UI.

---

### F3 — Manual meal entry + recent meals

**User story.** *"I had Greek yogurt for breakfast — same as every morning. I don't need to photograph it. Let me just tap 'usual yogurt' and go."*

**Why it exists.**
- Photo logging is the headline, but daily reality includes coffee, water, supplements, repeats, packaged foods with nutrition labels.
- "Recent meals" makes repeat logging effortless and drives habit retention.

**What it does.**
1. From home screen, tap "Add manually" or "+" next to the protein ring.
2. Two paths:
   - **Recent:** list of last 10 unique meals logged. Tap one → adjust portion → save.
   - **Quick add:** type meal name + protein g + (optional) calories. AI is NOT called for this path.
3. Save → adds to today's total.

**Definition of done.**
- Recent meals list deduplicates by meal name.
- Quick add validates protein g must be a number 0-200.
- Saved entries appear in today's meal list with a "manual" badge.

**Dependencies.** F1, DB.

---

### F4 — Protein-first dashboard (home screen)

**User story.** *"I opened the app. Tell me, at a glance, how much protein I've eaten today and how much I still need. Show me calories as a secondary number. Don't make me feel bad if I'm over."*

**Why it exists.**
- The product's entire reason for existing in one screen.
- Calories visible but secondary — the wedge against MyFitnessPal/Cal AI.
- Anti-shame: no red numbers if user goes over calorie target.

**What it does.**
1. **Top:** large protein ring. "78g / 128g · 61%". Amber accent fill on forest background.
2. **Secondary ring:** smaller calorie ring next to it. Shows progress, not a "deficit."
3. **Below rings:** today's meals list, latest first. Each row: thumbnail (if photo), meal name, +Xg protein, time of day.
4. **Sub-stats row:** small text — carbs g, fat g.
5. **Floating action button:** "Snap" — opens camera flow.
6. **Bottom tab bar:** Home / Workouts / Reports / Settings.
7. **Pull to refresh:** re-syncs in case of multi-device.
8. **Tap any meal:** edit / delete sheet.
9. **Optional:** users can flip the priority — calories first, protein secondary — in Settings. Default is protein first.

**Definition of done.**
- Rings animate from previous values when meal is added.
- Empty state ("No meals yet today — let's start with breakfast") is intentional, not blank.
- Past-day view accessible via swipe or date picker.
- Designed for one-handed use (thumb reach).

**Dependencies.** F1, F2, F3, theming.

---

### F5 — Daily weight log

**User story.** *"Every morning when I wake up, I want to log my weight in 5 seconds and see my trend over the last 4 weeks."*

**Why it exists.**
- Trend lines reveal what week-to-week noise hides.
- Weight + workouts + food makes the all-in-one story.

**What it does.**
1. **Daily reminder notification** (configurable time, default 8 AM): "Log your morning weight."
2. Tap notification → quick weight entry screen → type number → save.
3. **One entry per calendar day.** Logging again overwrites with confirmation.
4. **Trends screen** (under Reports tab): line chart of weight over selectable range (7d / 30d / 90d / all-time). Goal weight as horizontal line.

**Definition of done.**
- Reminder fires reliably on both platforms (Expo Notifications).
- Chart renders performantly with up to 365 data points.
- Weight units respect user preference (kg or lb).

**Dependencies.** F1, notifications, charting lib.

---

### F6 — "How you feel today" quick-log

**User story.** *"I'm exhausted, bloated, and grumpy. Two taps to log it. Later, I want to see whether my bad days cluster around any pattern — high carb days, poor sleep, missed workouts."*

**Why it exists.**
- Broadens the original GLP-1 side-effect tracker to a wellness signal anyone can use.
- Correlations between food + workouts + how-you-feel are part of the all-in-one value prop.
- Optional surface for the GLP-1 audience: medication-specific symptoms (nausea, sulfur burps) appear in the picker if the user said yes to the optional medication question in onboarding.

**What it does.**
1. **Quick-log button on home screen** (small icon row): tap to expand into a grid of symptom/feeling icons.
2. **Default symptom set:** energy (low/normal/high), mood (off/okay/good), fatigue, GI upset, bloating, headache, sleep quality, hunger level, soreness (post-workout).
3. **For users who picked a GLP-1 medication in onboarding:** add nausea, sulfur burps, injection-site reaction, low appetite to the picker.
4. Tap a symptom → severity slider (1-5) → optional note → save.
5. **Heatmap screen** under Reports: 7-day grid showing symptoms by day, severity-shaded.
6. Light correlations surfaced in weekly report (F8): "Your low-energy days correlated with workouts on the same day. Maybe a rest day is overdue."

**Definition of done.**
- Quick-log takes ≤ 4 taps end to end.
- Heatmap visually clear at a glance.
- Each symptom entry tied to timestamp (not just date) so timing analysis is possible later.
- GLP-1-specific symptoms hidden by default; surface only for users who opted in via onboarding.

**Dependencies.** F1, charting lib.

---

### F7 — Resistance training log

**User story.** *"I went to the gym yesterday. I did squats 3x5 at 60kg, bench 3x8 at 40kg, lat pulldowns 3x10 at 30kg. I want to log it in under a minute, and next time I lift, the app should pre-fill 'last time you did X' so I can try to beat it."*

**Why it exists.**
- Protein only protects muscle if you're lifting.
- Lifting is a core part of recomp — Jamie persona depends on this.
- All-in-one positioning requires the workout tab not be an afterthought.

**What it does.**
1. **Workouts tab** → "Start workout" or "Log past workout (date picker)."
2. **Exercise picker:** preloaded list of common lifts (squat, deadlift, bench press, OHP, row, lunge, pull-up, push-up) + "Custom exercise" → name it once, persists for future use.
3. **Set logger:** weight + reps. Tap "Add set" → repeat. Auto-suggests last session's weight/reps as starting point.
4. **Finish workout:** saves with timestamp.
5. **Workout history:** list view, tap any to see details, edit.
6. **Per-exercise progression chart** (basic): "Your squat 1RM estimate has gone from 80kg to 92kg over 6 weeks."

**Definition of done.**
- Logging 3 exercises × 3 sets takes < 90 seconds.
- Past workouts persist and pre-fill correctly.
- Weight units respect user preference.

**Out of scope for v1:** RPE, rest timers, supersets, periodization, cardio tracking, programmed routines. All v2.

**Dependencies.** F1, DB.

---

### F8 — Weekly summary report (PDF + email)

**User story.** *"Every Sunday morning I get a notification: 'Your week is ready.' I open it, see a one-page summary of last week — protein average, calorie average, weight delta, top symptoms, workouts. It's editorial, not shame-inducing. I can save it or email it."*

**Why it exists.**
- Builds a weekly habit ritual.
- Shareable artifact = LeanScan positioned as a serious tool.
- Premium-feel that justifies the $39/year price.

**What it does.**
1. **Background job** runs every Sunday at 8 AM in the user's timezone.
2. Aggregates last 7 days: protein avg + chart, calorie avg, weight change + chart, symptom heatmap, workout count, top meals by protein, streaks.
3. Generates one-page PDF with brand styling (forest + cream + amber, Fraunces + Manrope).
4. Push notification: "Your weekly report is ready."
5. In-app: viewable in Reports tab, tap to view PDF, share button.
6. **Optional auto-email** every Sunday to a recipient the user configures.

**Definition of done.**
- PDF renders identically on iOS and Android.
- Email delivery works (Resend or equivalent — chosen in architecture phase).
- Brand voice in copy is encouraging, never shaming.
- Empty / sparse weeks don't break ("You logged 2 days this week — let's aim for 5 next week.").

**Dependencies.** F1, F2-F7 data, server-side PDF generation, email service.

---

### F9 — Credit-based AI scan gating (V1 has NO payment integration)

**User story.** *"I want to scan my meals freely as a beta tester. I understand there's a daily limit so the AI doesn't get abused. If I run out, I can still log manually."*

**Why it exists.**
- V1 has no payment gateway (founder decision, May 13, 2026). Paid subscriptions deferred to v1.1.
- Credits prevent any single user from accidentally costing the project hundreds in Gemini API fees.
- Establishes the metaphor users will see in v1.1 when real payment is added.
- Lets us track AI scan usage per user for cost forecasting.

**What it does.**
1. **On signup:** new user is granted **100 credits** automatically. Logged in `credit_ledger`.
2. **Completing onboarding:** +20 bonus credits.
3. **Each AI photo scan costs 1 credit.** Manual meal entry costs nothing.
4. **Daily refill:** +10 credits per 24 hours since last refill, capped at 50 stored. Lazy refill — runs on next API call after 24h elapses.
5. **When credits reach 0:** API returns `402` on photo scans. Mobile app shows: "You're out of credits — refill at midnight, or log this meal manually." Manual entry continues to work without credits.
6. **Credits screen in Settings:** balance + ledger history (every credit change with reason).
7. **Founder cohort flag** still tracked on signup (first 500 users). Used later in v1.1 to grant lifetime discount when paid plan launches.

**Definition of done.**
- New signups get 100 credits via `credit_ledger` entry.
- AI scans deduct 1 credit atomically (failure = no charge).
- Daily refill works without cron — checked lazily on each request.
- 402 response handled gracefully on mobile (clear message, manual logging still works).
- Credit ledger viewable in Settings.

**Out of scope for V1:** payments, subscriptions, paywalls, RevenueCat, Apple IAP, Google Play Billing, Razorpay. All deferred to v1.1.

**Dependencies.** F1 (users table with credit fields), `credit_ledger` table.

---

### F10 — Notifications & reminders

**User story.** *"Remind me to weigh in at 8 AM. Nudge me at 2 PM if I haven't hit my mid-day protein. Tell me when my weekly report drops on Sunday. Don't spam me beyond that."*

**Why it exists.**
- Habits beat motivation.
- Smart nudges distinguish LeanScan from MyFitnessPal's spam.

**What it does.**
1. **Morning weight reminder:** configurable, default 8 AM.
2. **Mid-day protein nudge:** if logged protein < 50% of daily target by 2 PM, "You're at 40g of 128g — what's lunch looking like?" One per day, snoozable.
3. **Weekly report notification:** Sunday 8 AM local.
4. **Anniversary nudges:** 1 week, 1 month, 3 months on the app (light touch).
5. **All configurable in Settings.** Per-type opt-out.

**Definition of done.**
- Permissions requested only after onboarding step 5.
- Reliable delivery in both platforms.
- Respects do-not-disturb.

**Dependencies.** F1, Expo Notifications, backend scheduler.

---

### F12 — Admin console

**User story.** *"As the founder, I want a private web dashboard where I can see all my users, grant credits manually, suspend bad actors, reset someone's password if they're stuck, and view basic platform stats — without ever touching the database directly."*

**Why it exists.**
- Every professional app has one. Trying to manage users via raw SQL is fragile and error-prone.
- Lets you handle customer support requests fast (re-grant credits, reset passwords).
- Enables manual fraud handling before automated systems exist.
- Surfaces basic platform health (DAU, signup rate, scan volume, error counts).
- Required to manage the founder cohort manually.

**What it does (V1 minimum admin surface).**
1. **Login screen** — admin uses same email/password as a normal user, but the `role` column on their user row is `admin` or `super_admin`.
2. **Users list** — searchable + filterable by status, role, signup date. Shows: email, signup date, last seen, credit balance, founder-cohort flag, meal-count, status.
3. **User detail page** — full profile, edit any field, view credit ledger, view recent activity (meals/weights/symptoms/workouts), action buttons:
   - Grant N credits (reason required, logged in audit)
   - Suspend account
   - Reactivate account
   - Trigger password reset email
   - Toggle founder-cohort flag
   - Delete account
4. **Platform stats dashboard:**
   - Total signups
   - Daily/weekly active users
   - Total scans (today, this week)
   - Credit grants by admins (today, this week)
   - Top users by activity
   - Error count from API logs
5. **Audit log viewer** — see who did what, when. Filter by admin, target user, or action type.
6. **Bootstrapping** — first admin account created via env var `ADMIN_BOOTSTRAP_EMAIL/PASSWORD` on first deploy. After that, admins must be promoted via super_admin role.

**Definition of done.**
- Admin can sign in via separate web URL (e.g., admin.leanscan.app).
- All admin actions create rows in `admin_audit_log`.
- Non-admin users get 403 on any `/admin/*` API call.
- UI is usable on a laptop (mobile responsiveness deferred).
- Credit grant action updates user's balance AND inserts ledger entry atomically.

**Out of scope for V1:** email broadcast to all users, refund handling (no payments yet), advanced segmentation, exports, two-factor for admins, per-admin permission scopes.

**Dependencies.** F1 (users + role column), all data tables for stats. Choice of admin tooling (AdminJS vs custom Next.js) deferred to architecture approval.

---

### F11 — Settings, profile, account hygiene

**User story.** *"Let me change my weight, adjust my protein target, switch units, flip protein/calorie priority, upgrade my guest account, manage my subscription, export my data, delete my account."*

**Why it exists.**
- Standard hygiene. Required by App Store / Play Store policies (GDPR, CCPA, data deletion).
- Profile updates affect protein target recalculation.
- Upgrading guest → real account is the key sync moment.

**What it does.**
- **Profile:** edit goal, height, weight, goal weight, activity level, optional medication. Recalculates protein target on save.
- **Display:** protein-first or calorie-first toggle.
- **Notifications:** per-type toggles.
- **Units:** metric (kg, cm) or imperial (lb, ft/in).
- **Account:** if guest, upgrade by adding email + password. If real, change email/password, view sign-in history.
- **Subscription:** view status, manage via Store, cancel.
- **Data:** export all data as JSON, delete account permanently with double-confirmation.
- **Legal:** Privacy policy, Terms of Service.
- **About:** version, founder contact email (shashankdevadiga2003@gmail.com).
- **Sign out** (real accounts only).

**Definition of done.**
- Data export delivers a JSON file via Files app / share sheet.
- Account deletion removes user from auth + DB + storage within 24 hours.
- Both stores' privacy requirements met.

**Dependencies.** F1, F9, all data tables.

---

## 4. Explicitly OUT of scope for v1

| Feature | Reason for deferral |
|---|---|
| Apple Health / Google Fit integration | Adds 1-2 weeks of platform-specific work. |
| Wearable sync (Whoop, Oura, Garmin) | Same reason. |
| Macro breakdown beyond protein/calories | Visible secondary in dashboard, but no deep micro tracking. |
| Recipe builder | Big feature, weeks of work. |
| Social / community features | Major liability surface. |
| Meal planning | Different product. |
| Coaching / AI chat | Bigger AI bill, harder to get right. |
| Maintenance-phase mode | GLP-1-specific, removed with repositioning. |
| Family / team accounts | No demand at this stage. |
| Multi-language | English only at launch. |
| Web app | After mobile is stable. |
| Barcode scanning | Mid-tier feature, defer. |
| Restaurant chain database | Massive content cost. |
| Apple Watch / Wear OS apps | v2+. |
| Voice logging | Cool but not core. |
| Custom macro targets (beyond protein) | Defer until users ask. |
| Body measurements (waist, etc.) | v2. |
| Photo progress pictures | v2. |
| Streaks / gamification | Built-in but minimal in v1, deeper in v2. |

---

## 5. Answers to previously-open questions

1. **iOS distribution:** Manual TestFlight invites for the first 50-100 iOS users. Automate via App Store Connect API later if scale demands.
2. **Data location:** Server-side (Supabase Postgres + Storage). Cross-device sync supported. Landing page FAQ wording will be updated to reflect this.
3. **Anonymous / guest mode:** Yes — default to guest mode via Supabase Anonymous Auth. User can upgrade to real account later from Settings.
4. **Non-GLP-1 users:** Welcome and primary. Generic positioning. Medication question in onboarding is optional and defaults to "None."
5. **Support email:** shashankdevadiga2003@gmail.com.
6. **OS minimums:** iOS 16+, Android API 26+ (Android 8.0+).
7. **Audience positioning:** All-in-one protein-first health tracker (see context doc § 3).
8. **F7 / F8 timing:** Both stay in v1.

---

## 6. Risks I want on the record

- **Scope size.** 11 features × 2 platforms in 13-18 weeks at 10-20 hrs/wk is genuinely tight. Realistic completion: 16-20 weeks if there are surprises. I will tell you when we're slipping.
- **Generic positioning weakens the wedge.** "Protein-first all-in-one" is harder to communicate in 5 seconds of TikTok than "for GLP-1 users." Marketing will need extra effort.
- **AI accuracy.** Gemini may misidentify regional foods. Acceptable for v1 since target persona eats mostly familiar Western/global foods. Edit affordance compensates.
- **App Store review.** Apple sometimes rejects nutrition apps if they smell medical. Strict adherence: nutrition tracking only, no diagnostic claims.
- **No validation signal yet.** Building before knowing whether the positioning resonates. Mitigation: deploy the landing page in parallel and start collecting signups during the build.
- **Founder burnout.** Side project at 10-20 hrs/wk on top of a full-time job is sustainable for ~3 months. Honest weekly retros required.

---

## 7. Effort estimate

| Phase | What ships | Hours estimate |
|---|---|---|
| 0 | Custom auth (F1) + scaffolding + Dockerfile + DB migrations | 35-45 hrs |
| 1 | AI photo logging (F2) + credit gating (F9) + manual entry (F3) + home dashboard (F4) | 45-60 hrs |
| 2 | Weight log (F5) + "how you feel" (F6) | 20-30 hrs |
| 3 | Resistance training (F7) | 20-25 hrs |
| 4 | Weekly PDF + Gmail SMTP email (F8) | 25-35 hrs |
| 5 | Notifications (F10) + settings (F11) + privacy/terms | 20-30 hrs |
| 6 | Admin console F12 (AdminJS path) | 10-15 hrs |
| 6 | Admin console F12 (custom Next.js path) | 25-40 hrs |
| 7 | Android testing + APK download flow + iOS TestFlight setup | 20-30 hrs |
| 8 | Bug bash + polish + ship checklist | 15-25 hrs |
| **Total (with AdminJS)** | | **210-295 hrs** |
| **Total (with custom admin)** | | **225-320 hrs** |

At 15 hrs/wk average → **14-21 weeks** to beta launch. Acknowledged by founder (timeline now slightly higher than the 13-18 in v0.2 due to custom auth + admin console additions).

---

## 8. Approval

When you approve, I move to drafting `02-architecture.md`. Approval can be partial.

**Approval status:** ☐ pending Shashank review

When approved, write "approved" in chat and I lock the doc + move to architecture planning.
