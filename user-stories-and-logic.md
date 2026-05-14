# LeanScan — User Stories & Product Logic

Last updated: 14 May 2026
Companion to `onboarding-user-paths.md` (which is the strategic gap analysis); this doc is the concrete spec: every meaningful user shape, what they experience, and the logic that produces that experience.

---

## How to use this doc

- **Part 1** — Eight persona narratives. Each is a real user shape that produces a distinct experience. Day-in-the-life paragraphs are concrete, not abstract.
- **Part 2** — The math, rules, and state machines behind what each persona sees. If you want to know *why* persona X gets experience Y, look here.
- **Part 3** — Edge cases and operational states (no credits, denied notifications, brand-new user, etc.) that overlay onto every persona.

Together, every shipping behavior in the app is covered. If you find one that isn't, the doc is wrong and needs an update.

---

## Part 1 — The eight unique user stories

I clustered the math into eight distinct experience clusters. Within each cluster, the *number* on the protein ring changes per user, but the *UI behavior* is the same.

### Persona 1 — "Priya, the casual cutter"

**Profile (onboarding answers):**
- Goal: `lose`
- Body: 65 kg, 162 cm, goal weight 58 kg
- Activity: `sedentary`
- Medication: `none`
- Reminders: 08:00, meal nudges on

**Protein target math:** 1.2 g/kg base × 65 kg = **78 g/day.** No bumps, no floors.

**What Priya sees in the app:**
- Home greeting: "Good morning, Priya."
- Protein ring: filled toward 78 g
- No medication banner (she's `none`)
- Quick Add row with her recent meals once she's logged a few; before then, just the "Add manually" chip
- Snap pill at the bottom

**Day in the life — Tuesday 08:00:**
The weigh-in notification fires. Priya taps it, the app opens to home. She sees "0 / 78 g" on the ring with the soft amber arc. She doesn't weigh in yet — no weigh-in UI shipped — but the notification has done its job of reminding her this is the app she's using today.

At 12:45 she eats a chicken salad. She opens LeanScan, taps Snap, photographs her plate. Five seconds later: "Chicken salad · 32g protein · 280 kcal." She accepts. The ring jumps to 32 / 78. Toast: *"Looks like 32g of protein. Saved."*

At 13:00 the meal nudge fires. She ignores it — she just logged. The nudge doesn't know she logged; it's a hard daily schedule. This is mildly annoying but not catastrophic.

At 19:00 she eats salmon with rice. She opens LeanScan, taps Snap again, but she's running low on data — no problem, manual entry works too. The day ends at 72 / 78. Close enough.

**What Priya specifically doesn't see:**
- No medication banner
- No reasoning card on the onboarding Done screen — her target is the boring baseline
- No goal-specific copy yet (the doc's Tier 2 recommendation)
- No BMR / calorie target framing — she just sees raw calorie numbers

---

### Persona 2 — "Karan, the hard-training builder"

**Profile:**
- Goal: `build`
- Body: 80 kg, 178 cm, no goal weight set
- Activity: `active`
- Medication: `none`
- Reminders: 06:30, meal nudges on

**Protein target math:** 1.6 g/kg (active) + 0.2 g/kg (build) = 1.8 g/kg × 80 = **144 g/day.** Aggressive but legitimate for hypertrophy.

**What Karan sees that Priya doesn't:**
- A target nearly twice the size — the ring is harder to fill
- His weigh-in notification fires at 6:30 AM, an hour before his lift

**Day in the life — Saturday 06:30:**
Notification. Karan checks the app in bed. 0 / 144 g. He gets up, makes a 30-egg-white omelette — kidding, 6 — and weighs it. He uses Quick Add to log "Egg whites and oats" from yesterday because it's the same breakfast. One tap. 35 g logged.

At 10:00 post-lift, he downs a protein shake. Manual entry — 30 g protein, 180 kcal, ~25 g carbs. Saves in three seconds.

Lunch, dinner, evening snack. By 21:00 he's at 142 / 144 g. The ring is almost full. He doesn't get a "you nailed it" celebration animation because we haven't built one. Should we? Probably. (Tier 3 idea.)

**What Karan specifically doesn't see:**
- No "rest day" mode — his protein target is identical whether he lifts that day or not
- No workout integration — he could be doing nothing and the math wouldn't care

---

### Persona 3 — "Devadiga, the GLP-1 patient on a cut" — *the original LeanScan wedge*

**Profile:**
- Goal: `lose`
- Body: 95 kg, 175 cm, goal weight 80 kg
- Activity: `light`
- Medication: `mounjaro`
- Reminders: 08:00, meal nudges on

**Protein target math:**
- Base 1.2 g/kg (light counts as low) × 95 kg = 114 g/day standard.
- GLP-1 + lose goal → floor at **1.6 g/kg** × 95 = **152 g/day.**
- **+38 g vs the non-medication baseline.**

**What Devadiga sees that Priya and Karan don't:**

On the onboarding **Done** screen, a `reasoningCard` appears right below the protein number:

> **Why this number**
> Bumped to 1.6 g/kg — GLP-1 users in a deficit need more protein to protect muscle.

On the **home** screen, every time he opens the app, a small forest-tinted pill sits under his greeting:

> 🛡️  Mounjaro · protein target tuned for muscle protection

**Day in the life — Wednesday 08:00:**
Mounjaro injection day. He took the dose Sunday; today is day 3, when appetite suppression is strongest. The weigh-in notification fires. He's not hungry at all but he opens the app anyway because the Mounjaro banner reminds him: hitting protein matters MORE on a cut with this drug.

He uses Quick Add to log a Greek yogurt + protein-shake breakfast from yesterday. 30 g already in by 09:00.

By noon he's at 50 / 152 g. The meal nudge fires at 13:00. He's not hungry but he sees the ring is below half. He drinks a protein shake. 80 / 152 g.

Evening he forces a chicken breast he doesn't really want. Ends the day at 138 / 152 g. Not quite there but much further than he'd be without the bump — and without the banner reminding him to push, he probably would have stopped at 50.

**This is the user the entire product was originally built for.** The Tier 1 work (medication-aware target, banner, reasoning card, notifications) is what makes the medication question matter in code, not just marketing copy.

**What Devadiga specifically doesn't see (still gaps):**
- No injection-day awareness — the app doesn't know it's day 3 of his dose cycle
- No "softer foods on injection week" quick-add suggestions
- No nausea / fullness symptom tracker — the onboarding subtitle still alludes to this
- No protein-shake or fortified-food product database

---

### Persona 4 — "Sara, the GLP-1 maintainer"

**Profile:**
- Goal: `maintain`
- Body: 72 kg, 168 cm, goal weight 72 kg (already at target)
- Activity: `moderate`
- Medication: `wegovy`
- Reminders: 09:00, meal nudges off

**Protein target math:**
- 1.4 g/kg (moderate) + 0 (maintain) = 1.4 g/kg × 72 = **101 g/day.**
- GLP-1 floor applies only to `lose` and `recomp`. Maintain doesn't qualify, so **no bump.**

**What Sara sees:**
- Same medication banner as Devadiga ("Wegovy · protein target tuned for muscle protection") — *but the math didn't actually change.* This is intentional UX honesty: the banner reads "tuned" not "bumped." She's still being acknowledged.
- No reasoning card on Done screen (the bump didn't trigger)
- No meal-log nudge fires at 13:00 — she opted out

**Day in the life — Tuesday 09:00:**
Notification. Sara's been on Wegovy for 8 months, lost the weight she wanted, now maintaining. She opens the app once a day, sometimes skips entirely. Her ring is filled to 50 / 101 g by lunch, finishes at 95 / 101 g most days. Good enough.

**Subtle design point:** Sara is a *retained* user. The product needs to feel low-friction for her — she's not going to scan every meal forever. Quick Add and Manual entry are her dominant inputs. Snap is mostly used for novel foods.

---

### Persona 5 — "Maya, the recomp parent"

**Profile:**
- Goal: `recomp`
- Body: 68 kg, 165 cm, goal weight 65 kg
- Activity: `moderate`
- Medication: `none`
- Reminders: 07:00, meal nudges on

**Protein target math:** 1.4 g/kg (moderate) + 0.1 (recomp) = 1.5 g/kg × 68 = **102 g/day.**

**What Maya sees:**
- Mid-range target — feels achievable on most days
- No medication banner
- No bump reasoning card
- Standard onboarding Done screen

**Day in the life — Thursday 07:00:**
Notification. Maya is a busy parent doing recomp slowly. Her phone buzzes during the school run. She'll log lunch and dinner only — breakfast was a coffee and a kids' leftover pancake she'd rather not record. The ring is forgiving; she ends the day at 78 / 102. She doesn't beat herself up about it. The brand voice is calm, the app doesn't shame her.

**What she would love that doesn't exist yet:**
- A way to log "kids' leftovers" without typing macros
- A way to log "coffee" once as a default and have it auto-log every morning
- A streak that doesn't break when she has one chaotic day

---

### Persona 6 — "Tom, the maintain-no-medication user"

**Profile:**
- Goal: `maintain`
- Body: 75 kg, 180 cm, no goal weight
- Activity: `sedentary`
- Medication: `none`
- Reminders: 08:00, meal nudges off

**Protein target math:** 1.2 g/kg × 75 = **90 g/day.** No bumps at all.

**What Tom sees:** the most baseline experience LeanScan offers. No banner, no reasoning card, no meal nudge, no medication tracking, no recomp framing. Just a ring and a list. He's the "is this app even doing anything for me" persona.

This is a useful persona to keep in mind because **it's the persona we will lose first.** A maintainer with no medical context and no athletic goal has the weakest reason to keep opening LeanScan. If we don't give him a hook beyond "track protein," he churns within two weeks.

**Speculative hooks (none built):**
- Weekly summary email — "you averaged 88 / 90 g this week"
- A small streak counter
- Recipe suggestions based on what he's been eating

---

### Persona 7 — "Riya, the brand-new user (any goal)"

**Profile state:** Just completed onboarding. Zero meals logged. No recent meals. No history.

**What Riya sees, regardless of her actual demographic answers:**
- Home greeting: "Good morning, Riya."
- Protein ring at 0 / [her target]
- An empty Today section with the empty-state card: *"Nothing logged yet. Snap a photo or enter your first meal manually."*
- Quick Add row shows ONLY the "Add manually" chip (no recents to populate from)
- Snap pill at the bottom

**Day in the life — minute 1 of her LeanScan use:**
The onboarding flow completed. She got the +20 credit bonus toast. She landed on the home screen. The very first thing she sees, after her name, is the ring at zero. The Quick Add row has just one chip: "Add manually." The Snap pill is glowing amber.

She taps Snap. Photographs her coffee. AI says: "Coffee · 0g protein · 5 kcal." She accepts. The ring still shows 0g (zero-protein log) but now Today shows one row — and a calories-as-headline display because protein is 0. The Quick Add row picks up "Coffee" as a recent. Manual chip still leads.

**Crucial design point:** **the first 60 seconds of the new-user experience must work even with zero data.** The Quick Add chip for "Add manually" was added specifically because a brand-new user has no recents and would otherwise see an empty section. Without that chip, the row would just hide, and Manual entry would have nowhere to live in the UI.

---

### Persona 8 — "Alex, the out-of-credits user"

**Profile state:** Any onboarding profile, but credit balance is 0.

**What Alex sees:**
- Home looks normal
- Tapping Snap → camera opens normally
- After photo selection, the API rejects with `out_of_credits` → toast: *"You're out of credits. Log this meal manually for free."* → kicked back to idle scan screen with no AI call made
- The Quick Add chips and Manual entry still work — those don't cost credits
- The credit pill in the top bar shows "0 credits"

**Day in the life — Saturday evening:**
Alex has been scanning enthusiastically all week — 100 starting credits + 20 onboarding bonus + 10/day refills, but he's blown through them. He tries to scan dinner. Gets the out-of-credits toast. Annoying. He uses Manual entry, types in "chicken biryani · 35g protein · 600 kcal" — takes 30 seconds. He's mildly frustrated but not blocked. He'll wait until tomorrow when the daily refill (+10) lands.

**Design point:** the credit ceiling caps at 50 (it doesn't accumulate indefinitely), so the most a power user can ever bank is 50 scans. The product nudges them toward Quick Add (free) and Manual (free) when scans are exhausted, which is the right behavior — but a paid plan that removes the credit cap is the obvious monetization hook later.

---

### (Operational overlay) — "The notifications-denied user"

This isn't a persona, it's an operational *state* that overlays on any persona.

**What happens if a user denies notifications:**
- Onboarding completes normally
- No reminders fire — `applyReminders()` silently no-ops when permission isn't granted
- In Settings, the "Reminders" section shows a red-tinted permission row: *"Notifications are blocked. Enable them in your phone settings to get reminders."* with an "Open settings" CTA that opens iOS/Android settings deep-link
- The reminder time and meal-nudge toggle in Settings still save to the server — so if the user grants permission later, schedules light up immediately on Save

**Day in the life — Sunday afternoon:**
Devadiga reflexively denied the notification prompt during onboarding. By Tuesday he realizes he's forgetting to log. He opens Settings, sees the red permission row, taps "Open settings", grants notification permission in iOS Settings, comes back to the app, hits Save. The schedule activates instantly. From the next morning onward, he gets the 08:00 weigh-in nudge.

---

## Part 2 — System logic reference

The math, rules, and state machines that produce the persona experiences above. Cite this section when explaining "why does user X see Y?"

### 2.1 Protein target calculation

Identical math on backend (`coding/api/src/routes/profile.ts`) and mobile (`coding/app/src/state/onboarding.ts`). Backend is source of truth; mobile copy is for the Done-screen preview only.

```
multiplier := 1.2                               # baseline
if activity == 'moderate':     multiplier := 1.4
if activity == 'active':       multiplier := 1.6
if goal == 'build':            multiplier += 0.2
if goal == 'recomp':           multiplier += 0.1

# GLP-1 floor — applied AFTER goal/activity contributions
if medication in GLP1_MEDICATIONS and goal in {'lose', 'recomp'}:
    if multiplier < 1.6:
        multiplier := 1.6
        reasoning := "Bumped to 1.6 g/kg — GLP-1 users in a deficit..."
    else:
        reasoning := "Already meets the GLP-1 muscle-protection guideline..."

protein_target_g := round(weight_kg × multiplier)
```

**Inputs that DO NOT affect the target today:** sex, age, height, goal weight, dose, dose start date.

### 2.2 GLP-1 medication set

`{ozempic, wegovy, mounjaro, zepbound, saxenda, compounded_semaglutide, compounded_tirzepatide}`.

`none` and `other` don't trigger the bump or the banner. `other` is an honest "we don't know what this is, so we treat it like none" — a known minor flaw for users on Saxenda alternatives, etc.

### 2.3 When the target gets recalculated

- On `POST /v1/onboarding/complete`, if no target is set yet
- On `PATCH /v1/profile` whenever `weight_kg`, `activity_level`, `goal`, or `medication` changes — UNLESS the client also supplied an explicit `protein_target_g` (manual override)
- Never recalculated implicitly elsewhere

**Important:** Changing `medication` in Settings now triggers a recalc. This was a deliberate addition during the Tier 1 work — if a user adds Mounjaro mid-life, the protein target should update.

### 2.4 AI scan state machine (`coding/app/app/(app)/scan.tsx`)

```
   ┌──────┐  user picks/takes photo   ┌────────────┐  AI returns + saves photo   ┌───────────┐
   │ idle │ ────────────────────────▶ │ analyzing  │ ──────────────────────────▶ │ reviewing │
   └──────┘                            └────────────┘                              └─────┬─────┘
       ▲                                     │                                           │ accept
       │           AI returns not_a_meal     │                                           ▼
       │ ◀─────────────────────────────────  │                                     ┌──────────┐
       │                                                                            │  saving  │
       │                                                                            └─────┬────┘
       │  user taps Retake                                                                │ ok
       └───────────────────────────────────────────────────────────────────────────────────┘
                                                                       (returns to home via router.back)
```

**State-by-state behavior:**
- `idle` — buttons for camera / gallery, no spinner
- `analyzing` — large preview of the photo + spinner + "Looking at your plate…" copy. Lasts ~3-8 s depending on provider latency (Bedrock Sonnet 4.6 is on the slower end)
- `reviewing` — full estimate visible, all fields editable, Retake (returns to `idle`) and Save (advances to `saving`) buttons
- `saving` — small spinner, "Saving meal…" copy. Lasts ~200 ms (no AI call, just DB insert). On success, invalidates `['meals']` query and pops back to home

**Special branch — `not_a_meal`:**
If the AI returns `error: 'not_a_meal'`, scan jumps from `analyzing` directly back to `idle`, with a toast keyed off confidence:
- `high`: "We couldn't find any food or drink in this photo — 1 credit used."
- `medium`: "Not sure what's in this photo — 1 credit used. Try a clearer shot…"
- `low`: "No food found — 1 credit used. Try framing the item more directly."

The credit is debited *before* the not-a-meal branch — server-side guarantee. This is by design: it stops users from spamming non-food photos to game the AI.

### 2.5 Credit system

- Initial grant: **100 credits** on signup
- Onboarding bonus: **+20 credits** when `POST /v1/onboarding/complete` succeeds (idempotent — won't double-grant)
- Daily refill: **+10 credits** lazy-applied on the first authenticated request each new UTC day
- Credit ceiling: **50** — refills cap here, so a long-idle account doesn't accumulate
- Debit: **1 credit per `POST /v1/meals/photo`** request, regardless of whether the AI returned a real meal or `not_a_meal`
- Manual entry, quick-add, edit, delete: **0 credits**

`POST /v1/meals/photo` returns 402 `out_of_credits` if balance ≤ 0 before debit.

### 2.6 Notification scheduling logic

Lives in `coding/app/src/lib/notifications.ts`.

**Two schedules with stable IDs:**
1. `weigh-in-daily` — fires daily at `reminder_weight_time` HH:MM
2. `meal-nudge-daily` — fires daily at 13:00 if `reminder_meal_nudges == true`

**Re-application triggers:**
- After `POST /v1/onboarding/complete` succeeds — first-ever schedule, permission prompt happens here
- After Settings save — picks up time / toggle changes immediately
- On cold app start (in `_layout.tsx`) — covers timezone changes, force-stop schedule loss, device restart
- Cancelled completely on sign-out so the next user doesn't inherit

**Silent no-op cases:**
- Permission `denied` or `undetermined` → `applyReminders()` returns without scheduling
- Bad time string (not HH:MM) → falls back to 08:00 (doesn't crash)

### 2.7 The three meal-logging paths

LeanScan has three distinct paths to log a meal. The user picks based on context.

| Path | Trigger | Cost | Typical time | Source field |
|---|---|---|---|---|
| Photo scan | Home → Snap → camera/gallery | 1 credit | ~5-10 seconds | `'photo'` |
| Manual entry | Home → Quick Add → "Add manually" chip | 0 credits | ~15-30 seconds | `'manual'` |
| Quick add | Home → Quick Add → tap a recent meal chip | 0 credits | ~1 second | `'quick_add'` |

All three end at the same `POST /v1/meals` endpoint with different `source` values — useful later for analytics ("what % of meals are scanned vs manual?").

### 2.8 Home screen state combinations

The home screen renders different things based on three state dimensions:

| State | Determining factor | What's shown |
|---|---|---|
| Loading | `today.isLoading == true` | Centered spinner instead of ring |
| Has meals today | `meals.length > 0` | Full meal list under "Today" |
| No meals today | `meals.length == 0` | Empty-state card with "Snap a photo or enter your first meal manually." |
| Has recents | `recents.items.length > 0` | Recent chips + Manual chip in Quick Add row |
| No recents | `recents.items.length == 0` | Only the Manual chip in Quick Add row (still renders the section because `onAddManual` is passed) |
| GLP-1 user | `isGlp1User(user.medication)` | Banner under greeting |
| Non-GLP-1 user | `medication == 'none' \|\| 'other'` | No banner |
| Has protein logged today | `totals.protein_g > 0` | Ring shows progress |
| Zero protein logged today | `totals.protein_g == 0` | Ring shows empty state |

These dimensions are independent — they combine. A brand-new GLP-1 user sees: loading spinner briefly → ring at 0 → empty Today state → only-manual Quick Add → banner.

### 2.9 Auth + onboarding gate state machine (`app/_layout.tsx`)

```
        ┌───────────────────┐
        │  Hydrating from   │
        │  SecureStore      │
        └────────┬──────────┘
                 │ accessToken? user? onboarding_completed?
        ┌────────┴────────────────────────────────┐
        │                                          │
   No token                                Has token + onboarded
        │                                          │
        ▼                                          ▼
   Welcome / sign-in / sign-up         /(app)/home + downstream

        ┌── Has token, NOT onboarded ──┐
        │                              │
        ▼
   /onboarding/goal (forced)
```

**Edge cases handled:**
- Token expired mid-session → `requestWithMessage` auto-refreshes once, retries; if refresh fails, wipes session and gate kicks user back to welcome
- User signs up but force-quits mid-onboarding → token is still valid, gate redirects back to `/onboarding/goal` on next launch
- User completes onboarding → gate ensures any path starting with `/onboarding/*` redirects to `/(app)/home` once `onboarding_completed` flips true

---

## Part 3 — Edge cases and operational overlays

Every persona above can have these operational conditions overlay on top.

### 3.1 Network states

| Condition | Behavior |
|---|---|
| Offline at app launch | Hydrates from cached `userJson`; meal queries fail silently (no toast for `silent: true`); user can still see today's already-cached meals |
| Offline mid-scan | `fetch` throws → `network_error` ApiError → toast "Couldn't reach the server." Stays on idle. No credit charge (the request never reached the API) |
| Offline mid-save | Same toast, stays on reviewing screen. User can retry without re-scanning |

### 3.2 Token / auth states

| Condition | Behavior |
|---|---|
| Access token expires (15 min) | Next authenticated request → 401 → tryRefresh() runs → new access token issued → original request retried transparently |
| Refresh token also expired (30 days) | Refresh returns failure → auth store cleared → user kicked to welcome |
| User signs in on a second device | Both devices have valid refresh tokens; no forced sign-out on the first device |

### 3.3 Permission states

| Permission | Effect |
|---|---|
| Camera denied | Toast: "Camera permission denied. Enable in Settings to snap meals." User can still use Manual entry and Quick Add |
| Media library denied | Toast: "Photo library permission denied." Camera still works if granted separately |
| Notifications denied | All `applyReminders()` calls silently no-op. Settings shows the red permission row with "Open settings" CTA |
| Notifications undetermined (never asked) | Same as denied UI-wise. Settings shows "Allow" button which triggers the OS prompt |

### 3.4 The "edge persona" matrix

To make sure every combination is covered, here's a 4 × 3 × 2 cube of math outcomes (goal × activity-tier × medication-category). Each cell shows the multiplier, which determines the target per kg of body weight.

| | Sedentary/Light | Moderate | Active |
|---|---|---|---|
| **Maintain · No GLP-1** | 1.2 | 1.4 | 1.6 |
| **Maintain · GLP-1** | 1.2 | 1.4 | 1.6 |
| **Lose · No GLP-1** | 1.2 | 1.4 | 1.6 |
| **Lose · GLP-1** | **1.6** | **1.6** | 1.6 |
| **Recomp · No GLP-1** | 1.3 | 1.5 | 1.7 |
| **Recomp · GLP-1** | **1.6** | **1.6** | 1.7 |
| **Build · No GLP-1** | 1.4 | 1.6 | 1.8 |
| **Build · GLP-1** | 1.4 | 1.6 | 1.8 |

**Bolded cells** are where the GLP-1 floor actually changes the math. Everywhere else, the GLP-1 user gets the same number as the non-medicated user — only the banner and reasoning card differ.

This means **roughly 5 out of 24 distinct user shapes get a math change from the GLP-1 floor.** The other 19 GLP-1 users get visual acknowledgment but not numeric.

That's not wrong. It's calibrated. Active builders on Mounjaro don't need more protein than they're already getting from `build + active`. The floor only kicks in when the math would otherwise underdeliver.

### 3.5 Why some answers don't matter

In one place, plainly:

- **Sex** — collected at signup. Used for nothing in v1. Slated for BMR calc (Mifflin-St Jeor) when calorie targets ship.
- **DOB / age** — same.
- **Height** — same.
- **Goal weight** — collected; surfaced in Settings; never visualized. Needs a weigh-in feature to be useful.
- **Dose / dose start date** — collected in Settings only. No injection-day awareness yet.
- **Display name override** — falls through after `first_name`/`last_name`/`username` in greeting; works but rarely needed.
- **`units_metric` flag** — always renders metric regardless.
- **`dashboard_priority`** — always renders protein-first regardless.

These aren't bugs; they're staged data capture. Each one is a feature waiting to ship. The doc `onboarding-user-paths.md` lays out the priority order for closing these gaps.

---

## Appendix A — Glossary of key fields

| Field | Type | Where set | Where read |
|---|---|---|---|
| `protein_target_g` | int | onboarding/complete + profile patch (auto-recalc) | home ring, settings |
| `credit_balance` | int | signup grant + onboarding bonus + daily refill + scan debits | top bar pill, gating scan endpoint |
| `medication` | enum | onboarding step 4 + settings | protein math, home banner, done-screen reasoning |
| `goal` | enum (lose/build/recomp/maintain) | onboarding step 1 + settings | protein math |
| `weight_kg` | decimal | onboarding step 2 + settings | protein math |
| `activity_level` | enum | onboarding step 3 + settings | protein math |
| `reminder_weight_time` | string "HH:MM" | onboarding step 5 + settings | notification scheduler |
| `reminder_meal_nudges` | bool | onboarding step 5 + settings | notification scheduler |
| `onboarding_completed_at` | timestamp | POST /v1/onboarding/complete | auth gate redirect logic |
| `meal_name`, `protein_g`, `calories`, `carbs_g`, `fat_g` | various | scan flow review screen + manual entry + quick-add re-log | meal list, ring totals, edit screen |
| `source` | enum (photo/manual/quick_add) | implicit per meal-creation path | meal list (icon), analytics later |
| `confidence` | enum (low/medium/high) | AI response | meal detail "AI confidence" row |

---

*End of doc. Companion read: `onboarding-user-paths.md` for the strategic gap analysis, `leanscan-project-context.md` for product positioning, `coding/api/src/routes/` for the actual implementation.*
