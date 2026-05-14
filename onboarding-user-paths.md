# LeanScan — Onboarding User Paths & Experience Deltas

Last updated: 14 May 2026 (Tier 1 gaps closed: medication-aware target + local notifications)
Author: product strategy notes — Shashank + co-pilot
Status: living doc; reflects code as shipped on `main` at the time of writing

---

## TL;DR (read this first)

LeanScan's onboarding collects **six screens of data** about a new user. As of the Tier 1 close-out, the live product **differentiates the experience on five of those inputs** — weight, activity, goal, **medication**, and **reminder preferences (time + meal-nudge toggle)**.

Still unused: sex, DOB, height, goal weight. The data sits in the database waiting for features that don't exist yet (BMR / calorie targets, weigh-in tracking, age-aware protein guidance).

This is not necessarily wrong — capturing data early is cheap, and lets us light up segmented experiences later without re-asking. But it does mean the onboarding's perceived sophistication ("we built a personalized plan for you") doesn't match the delivered sophistication ("we computed one number from three of your answers"). The gap matters because most users will sniff that out, and the moment they do, the rest of the experience feels generic.

This doc walks step-by-step through onboarding, shows the exact protein-target math with worked persona examples, and then names every "we asked, we didn't use" gap so we can decide which ones to actually close.

---

## 1. The flow at a glance

After signup (which now collects email, password, username, first name, last name, DOB, sex), the user lands in a six-screen onboarding stack. Each screen is gated — back is allowed except on step 1, swipe-back is disabled, and the user can't skip ahead.

| # | Screen | Stored fields | Visual style |
|---|---|---|---|
| 1 | Goal | `goal` (lose/build/recomp/maintain) | OptionList, one selection |
| 2 | Body | `height_cm`, `weight_kg`, `goal_weight_kg?` | Three numeric inputs |
| 3 | Activity | `activity_level` (sedentary/light/moderate/active) | OptionList, one selection |
| 4 | Medication | `medication` (none / one of 8 GLP-1 products) | OptionList, one selection |
| 5 | Reminders | `reminder_weight_time` (HH:MM), `reminder_meal_nudges` (bool) | Time input + toggle |
| 6 | Done | (calculates `protein_target_g`, persists everything, +20 credits) | Number reveal + CTA |

All screens use the same `<StepHeader>` (progress bar + step counter + back button) and the same OptionList/Input/Button primitives, so the *look and feel* is identical for every user. Differentiation only kicks in at the Done screen, where the protein number changes based on inputs.

---

## 2. Each step in detail

### Step 1 — Goal

**Question:** "What are you working on?"
**Subtitle in app:** "This sets your daily protein target."

Four mutually-exclusive options, with the hint copy shown in app:

| Value | Label | Hint shown to user |
|---|---|---|
| `lose` | Lose weight | Calorie deficit, protect muscle |
| `build` | Build muscle | Surplus, hit protein hard |
| `recomp` | Recomp | Lose fat and build muscle at once |
| `maintain` | Maintain | Stay where I am |

**What it actually controls:** This input feeds the protein multiplier. Picking `build` adds 0.2 g/kg to the daily target; `recomp` adds 0.1 g/kg; `lose` and `maintain` add nothing (they share the same baseline). So a "build" user gets ~16g more protein per day than a "lose" user at the same weight and activity.

**What it should also control but doesn't yet:**
- Onboarding copy in step 6 ("Your plan") is identical for all goals — there's no "you're cutting, so we're prioritizing protein density" vs "you're bulking, so eat above maintenance"
- Home greeting copy doesn't differ ("Good evening, Devadiga" is the same regardless)
- No goal-specific tips on the home screen ("Cut day: aim for protein > 30% of calories")
- The calorie totals shown on the home ring aren't framed in goal terms (no "deficit / surplus / on target" framing)

---

### Step 2 — Body

**Question:** "How tall, how much, and where to?"
**Inputs:** Height (cm, 100–250 required), Weight (kg, 30–300 required), Goal weight (kg, 30–300 optional)

**What it actually controls:** Weight is the multiplicand for the entire protein target — every gram of bodyweight buys you between 1.2g and 1.8g of daily protein depending on goal and activity. So weight is the single biggest input to the personalized number.

**What it should also control but doesn't yet:**
- `height_cm` is collected but never used. No BMI display, no body-composition framing, no calorie-target calculation that needs it
- `goal_weight_kg` is collected but never visualized. No "trend line" view, no progress arc toward goal weight, no time-to-goal estimate. It just sits in Settings
- The app has no concept of weigh-ins yet, so even if you've set a goal weight, you can't track your current weight over time

---

### Step 3 — Activity

**Question:** "How active are you?"
**Subtitle:** "Bumps your protein target — moderate adds 0.2 g/kg, active adds 0.4 g/kg."

Four levels:

| Value | Label | Hint |
|---|---|---|
| `sedentary` | Sedentary | Desk job, little or no exercise |
| `light` | Light | Light exercise 1–2 days/week |
| `moderate` | Moderate | Gym + some cardio 3–4 days/week |
| `active` | Active | Hard training 5+ days/week |

**What it actually controls:** Activity level is the second protein-target multiplier. `moderate` bumps the multiplier from 1.2 to 1.4 g/kg; `active` bumps it to 1.6. `sedentary` and `light` share the baseline of 1.2.

**Notice the asymmetry:** `sedentary` and `light` are functionally identical in the system. `lose` and `maintain` are also functionally identical. So of the four × four = 16 possible goal × activity combinations, there are really only **3 × 3 = 9 distinct multiplier outcomes**. The product UI pretends to a finer-grained personalization than the math actually delivers.

**What it should also control but doesn't yet:**
- No "rest day vs training day" daily target — an `active` user gets the same target Sunday as Saturday
- No activity-specific nudge ("you logged a gym day, hit 1.8 g/kg today")
- No integration with HealthKit / Health Connect for actual activity data

---

### Step 4 — Medication

**Question:** "Are you on any of these?"
**Subtitle in app:** "If yes, we surface medication-specific symptom tracking. If no, leave it on 'None'."

Nine options: `none`, `ozempic`, `wegovy`, `mounjaro`, `zepbound`, `saxenda`, `compounded_semaglutide`, `compounded_tirzepatide`, `other`.

**What it actually controls today (updated post-Tier-1):**

1. **Protein target bump.** If the user is on a GLP-1 drug (everything except `none` and `other`) AND has a goal of `lose` or `recomp`, the protein target multiplier is floored at 1.6 g/kg. So a 90 kg user on Mounjaro doing a recomp now gets 90 × 1.6 = 144 g/day, instead of the 90 × 1.5 = 135 g they would have gotten without the bump.
2. **Done screen reasoning card.** Right under the protein number on the onboarding finish screen, GLP-1 users in a deficit now see: *"Bumped to 1.6 g/kg — GLP-1 users in a deficit need more protein to protect muscle."* Non-GLP-1 users don't see the card at all.
3. **Home screen acknowledgment banner.** A small forest-tinted strip under the greeting on the home dashboard: a shield icon + *"Mounjaro · protein target tuned for muscle protection."* Only shown for GLP-1 users.

**What it still doesn't control:**
- No symptom tracker yet (nausea, fullness, dose log) — even though the subtitle copy still implies "symptom tracking." That's a Tier 3 item.
- No dose / start date integration into the experience, even though `medication_dose` and `medication_start_date` are stored.
- No injection-day awareness (we don't know which day of the dose cycle they're on).
- Educational content per drug — none yet.

The onboarding subtitle copy is still a slight overpromise — we acknowledge medication via target tuning + a small banner, but the "symptom tracking" phrase will read as half-delivered until that feature exists. Suggest updating the copy to: *"If yes, we'll tune your protein target and surface medication-specific guidance."*

---

### Step 5 — Reminders

**Question:** "When should we remind you to weigh in?" + "Meal-log nudges throughout the day?"
**Inputs:** Time (HH:MM, default 08:00), boolean toggle (default on)

**What it actually controls today (updated post-Tier-1):**

1. **Permission prompt.** After successful onboarding completion, the app calls `requestPermission()` once. iOS shows the system notification dialog; Android 13+ shows the runtime POST_NOTIFICATIONS prompt; older Android grants by default. If the user denies, the rest of the system silently no-ops — onboarding still finishes cleanly.
2. **Daily weigh-in notification** at the configured `reminder_weight_time`. Title: *"Morning weigh-in"* — body: *"Quick step on the scale — takes 10 seconds."* Schedules as a daily-repeating local notification.
3. **Daily meal-log nudge at 13:00 local** if `reminder_meal_nudges` is true. Title: *"How is your protein day going?"* — body: *"Logging meals keeps the ring full. Snap or quick-add now."*
4. **Re-applied on every cold start.** In `app/_layout.tsx`, the AuthGate fetches the user's current reminder settings from the server and re-applies them — covers timezone changes, device restart, and the OS clearing schedules after a force-stop.
5. **Re-applied on Settings save.** Changing the weigh-in time or toggling meal nudges in Settings cancels and re-schedules immediately.
6. **Cancelled on sign-out** so the next user logging in on the same device doesn't inherit the previous user's reminders.
7. **Editable in Settings** — a new "Reminders" section exposes the time field, the meal-nudges toggle, and a permission-status row that shows "Allow" (if undetermined) or "Open settings" (if denied) when permission isn't granted.

**Implementation lives in:** `coding/app/src/lib/notifications.ts` — single service exporting `requestPermission`, `getPermissionStatus`, `applyReminders`, `cancelAllReminders`. Uses `expo-notifications` SDK 55 with Android channel `reminders` and stable IDs `weigh-in-daily` / `meal-nudge-daily` so reschedules don't accumulate duplicates.

**Caveat:** the meal-nudge fires daily regardless of whether the user has already logged today. A "skip if already logged" optimization could be added later (cancel today's nudge when the first meal is saved), but isn't critical for v1.

---

### Step 6 — Done

**Question:** Not a question — a reveal screen.

Shows the calculated protein target as a single large number, with the formula explained in fine print. CTA: "Let's go." Tapping it:
1. PATCHes `/v1/profile` with everything collected during onboarding
2. POSTs `/v1/onboarding/complete`, which grants +20 credits and stamps `onboarding_completed_at`
3. Updates the auth store and lets the AuthGate redirect to `/(app)/home`

**This is the only screen where the differentiated experience is actually visible**, because the protein target number is different for different users. Everything else looks identical.

---

## 3. The protein target formula

Spelled out plainly:

```
multiplier = 1.2                              # baseline (sedentary/light, lose/maintain)
if activity_level == 'moderate':  multiplier = 1.4
if activity_level == 'active':    multiplier = 1.6
if goal == 'build':               multiplier += 0.2
if goal == 'recomp':              multiplier += 0.1

protein_target_g = round(weight_kg × multiplier)
```

That's the entire personalization engine. Three inputs in, one integer out.

### Worked examples — four personas

**Persona A — "Casual cutter Priya"**
- Weight 65 kg, sedentary, goal: lose
- Multiplier: 1.2 + 0 + 0 = **1.2 g/kg**
- Target: 65 × 1.2 = **78 g protein/day**

**Persona B — "Gym bro Karan"**
- Weight 80 kg, active, goal: build
- Multiplier: 1.6 + 0.2 = **1.8 g/kg**
- Target: 80 × 1.8 = **144 g protein/day**

**Persona C — "Recomp parent Maya"**
- Weight 72 kg, moderate, goal: recomp
- Multiplier: 1.4 + 0.1 = **1.5 g/kg**
- Target: 72 × 1.5 = **108 g protein/day**

**Persona D — "GLP-1 maintainer Devadiga"** (the original LeanScan wedge)
- Weight 90 kg, light, goal: maintain, medication: Mounjaro
- Multiplier: 1.2 + 0 = **1.2 g/kg**
- Target: 90 × 1.2 = **108 g protein/day**

Notice that Persona D — a GLP-1 user who chose `Mounjaro` in onboarding — gets *the exact same protein target* as a sedentary 90 kg person who answered "None" for medication. The product made a promise on the medication screen and then delivered no follow-through.

Recommended fix (medication-aware target):

```
# proposed — not yet implemented
if medication in GLP1_DRUGS and goal in ('lose', 'recomp'):
    multiplier = max(multiplier, 1.6)   # GLP-1 in a deficit needs more protein
    notes = "GLP-1 users in a deficit are at higher risk of muscle loss; \
             we bump your target accordingly."
```

That single change would make the medication question matter, and would also justify the original wedge ("protein-first calorie tracker for GLP-1 users") in code — not just in marketing copy.

---

## 4. The "what user X sees vs user Y sees" table

Here's the real, shipped experience delta. Identical except where called out.

| Surface | Casual cutter Priya (65 kg, sedentary, lose) | Gym bro Karan (80 kg, active, build) | GLP-1 maintainer Devadiga (90 kg, light, maintain, Mounjaro) |
|---|---|---|---|
| Onboarding copy | Identical | Identical | Identical |
| Home greeting | "Good evening, Priya." | "Good evening, Karan." | "Good evening, Devadiga." |
| Protein ring target | **78 g** | **144 g** | **108 g** |
| Protein ring color | Identical (forest + amber) | Identical | Identical |
| Today's macros card | Same labels and units | Same | Same |
| Quick Add chips | Same (based on her own recents) | Same | Same |
| Scan flow | Identical | Identical | Identical |
| AI prompt | Identical (asks for protein/cal/carbs/fat regardless) | Identical | Identical |
| Settings copy | Identical | Identical | Identical |
| Daily nudges | None | None | None |
| Medication info | None visible | None visible | **None visible** ← gap |
| Goal weight visualization | None | None | None ← gap |
| Activity-day adjustments | None | None | None |

The only difference any of these users will perceive is a different number on the ring.

---

## 5. Honest gap analysis — collected ≠ used

A clean inventory of what we ask for vs what we do with it. Updated 14 May 2026.

| Field | Collected | Surfaced in Settings | Drives experience |
|---|---|---|---|
| `email` | Signup | Yes | Greeting fallback |
| `password` | Signup | n/a (changeable) | Auth |
| `first_name` | Signup | Yes | Home greeting |
| `last_name` | Signup | Yes | Home greeting (when first+last fits ≤16 chars) |
| `username` | Signup | Yes | Greeting fallback |
| `date_of_birth` | Signup | Yes | **Nothing** |
| `sex` | Signup | Yes | **Nothing** |
| `goal` | Onboarding | Yes | Protein target |
| `height_cm` | Onboarding | Yes | **Nothing** |
| `weight_kg` | Onboarding | Yes | Protein target |
| `goal_weight_kg` | Onboarding | Yes | **Nothing** |
| `activity_level` | Onboarding | Yes | Protein target |
| `medication` | Onboarding | Yes | Protein target bump (GLP-1 + cut) + home banner + Done-screen reasoning |
| `medication_dose` | Settings only | Yes | **Nothing** |
| `medication_start_date` | Settings only | Yes | **Nothing** |
| `reminder_weight_time` | Onboarding | Yes | Schedules daily local notification |
| `reminder_meal_nudges` | Onboarding | Yes | Schedules 13:00 local notification when on |
| `dashboard_priority` | Settings only | Yes | **Nothing** (always renders protein-first) |
| `units_metric` | Settings only | Yes | **Nothing** (everything renders metric) |

Six of the fifteen profile fields drive **literally nothing** in the user experience. Three more drive nothing because the supporting feature (notifications, unit conversion) hasn't shipped.

---

## 6. Recommendations — what to actually differentiate, in priority order

Each of these closes a specific "collected but unused" gap. Listed roughly by impact-per-effort.

### Tier 1 — closes promises made in onboarding copy — ✅ SHIPPED

1. ~~Medication-aware protein target~~ — **shipped 14 May 2026.** Backend + mobile `calculateProteinTarget` now accepts medication. GLP-1 users in `lose`/`recomp` floor at 1.6 g/kg. Done-screen reasoning card and home banner both surface the medication acknowledgment.

2. ~~Notification system~~ — **shipped 14 May 2026.** `coding/app/src/lib/notifications.ts` provides the service. Daily weigh-in notification at user's configured time + 13:00 meal nudge when enabled. Permission requested after onboarding. Re-applied on cold start. Editable in Settings with permission-status row.

### Tier 2 — uses data we already collect for visible payoff

3. **Goal weight progress UI.** A small horizontal progress bar somewhere on the home screen: "78 kg → 72 kg goal." Requires a weigh-in feature (one new endpoint, one mobile screen, ~3 hours). Big perceived sophistication boost from a small surface.

4. **Goal-specific home copy.** Variations on the greeting subtitle keyed off `goal`:
   - `lose`: "On a cut. Protein keeps you full."
   - `build`: "Building. Eat above maintenance."
   - `recomp`: "Recomping. Hit protein, watch the scale slowly."
   - `maintain`: "Steady state. Stay consistent."
   Trivial code change, makes the goal selection feel respected.

5. **BMR / calorie target using height + sex + DOB + weight + activity.** Mifflin-St Jeor formula. Once you have that, the home screen can show calories with framing ("400 kcal under maintenance today") instead of a raw count. This is what every other tracker does, and it's the first thing returning users from MyFitnessPal will look for.

### Tier 3 — defer until after first user contact

6. **Activity-day vs rest-day daily targets.** Requires logging workouts. Out of scope until users ask.
7. **Symptom tracker for GLP-1 users.** Genuinely useful but not validated yet. Don't build until at least 3 GLP-1 users have explicitly asked.
8. **Imperial unit conversion.** Use the `units_metric` flag we already collect. Low effort but only matters once you have non-metric users testing.

---

## 7. Where this leaves us

The shippable summary I'd put on a roadmap:

- **Onboarding is overbuilt for what the product currently delivers.** Fewer screens that mean more would be a better experience than six screens that mean one number.
- **The medication step is the highest-leverage thing to fix.** It's literally the wedge LeanScan was originally pitched on. Right now it's collected and ignored — which is worse than not asking.
- **Three small wins (goal-specific copy, BMR calories, weight tracking) would 3x the perceived personalization** without changing the AI, the scan flow, or the database schema in any meaningful way.
- **Notifications are the unlock for everything reminder-related.** Until you ship those, step 5 of onboarding is a lie of omission.

Anything past Tier 1+2 above is roadmap material once you have real users telling you which features matter to them.

---

*End of doc. Update this whenever you ship a feature that closes one of the gaps above, so the team's mental model stays accurate.*
