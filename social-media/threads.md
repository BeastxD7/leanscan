# Long-form threads

Four threads ready to fire. Each is 5–8 tweets. Post them on Fridays or whenever you have a substantial story to tell.

---

## Thread 1 — "I built an AI calorie tracker in 4 weeks. Here's what I shipped and what I broke."

**Use case:** Friday end-of-week wrap-up. Aim for week 4 or whenever you have a substantial build to summarize.

---

**1/8**
4 weeks ago LeanScan was an empty Expo project.

Today it's a working AI calorie tracker that scans a meal photo and returns protein in 5 seconds.

Here's the build, the bugs, and the calls I made — 🧵

---

**2/8**
The stack:

- React Native + Expo SDK 55 (mobile)
- Node 22 + Express + Prisma + Postgres (API)
- Multi-provider AI: Gemini / OpenAI / Azure / Bedrock — swap with one env var
- Custom JWT auth (no Supabase Auth)
- Local filesystem storage for meal photos

No SaaS bloat. ~$35/month all-in to run.

---

**3/8**
The killer flow:

Snap a photo → AI estimates protein + calories → review → save.

End-to-end takes ~5 seconds. The whole product is built around making this loop frictionless.

[VISUAL: 6-second screen recording of the loop]

---

**4/8**
The hardest bug:

Multipart fetch uploads silently failing on Android. Spent half a day before realizing it's a known Expo SDK 55 regression.

Switched to expo-file-system's `uploadAsync` which uses the native HTTP path. Bypassed the bug entirely.

---

**5/8**
The most opinionated UI call:

Protein is the hero, not calories.

Most calorie trackers put kcal in the giant ring. For my user (GLP-1 patients, lifters), the variable that matters is grams of protein. So I flipped the hierarchy.

[VISUAL: home screen showing the protein ring]

---

**6/8**
The thing I almost didn't build:

Medication-aware protein targets. If you're on Ozempic / Mounjaro / Wegovy in a cut, your target floors at 1.6 g/kg automatically. The onboarding shows the math.

Took 2 hours to ship. Closed the biggest gap between what onboarding promised and what the product delivered.

---

**7/8**
What I cut:

- Barcode scanning (AI photo handles 85% of cases)
- Streak counters (anxious users don't need more shame)
- Workout tracking (not the wedge)
- A 14M-item food database (the point is not searching)
- Web app (mobile-first, web is Phase 7)

Cutting features made the product better.

---

**8/8**
What's next:

- TestFlight + Play Store internal track
- 10 real beta users from r/Ozempic + my network
- Retention data (day 3 / day 7 / day 14)
- Then iterating on whatever the data exposes

If you want to try it, reply or DM — I'll send a TestFlight invite.

---

---

## Thread 2 — "Why I'm building a protein-first calorie tracker for GLP-1 users"

**Use case:** Pin this to your profile. It's the "who I am, what I'm building, why" anchor thread.

---

**1/7**
9% of US adults have used a GLP-1 medication. Most are losing weight successfully. Many are also losing muscle without knowing it.

Here's why that's happening, and what I'm building about it — 🧵

---

**2/7**
GLP-1 drugs (Ozempic, Wegovy, Mounjaro, Zepbound) work by suppressing appetite. People eat less. Weight comes off.

But ~25% of the weight dropped is lean mass — muscle, not fat — when protein intake isn't deliberately protected.

That's a clinical fact. It's also a UX problem.

---

**3/7**
The fix is well-known: 1.6+ g/kg of body weight in daily protein.

For a 90kg user, that's 144g/day. About 4 chicken breasts. Reasonable, but only if you track.

The problem is tracking. MyFitnessPal makes you tap through 6 screens to log a chicken breast. The drug already killed your appetite. The app finishes off your motivation.

---

**4/7**
LeanScan is the response.

Snap a photo. Get protein in 3 seconds. Save with one tap. The whole UI is built around making the protein number visible and the logging effort invisible.

Goal: 80% of meals logged in under 10 seconds, no exceptions.

---

**5/7**
What makes LeanScan specifically a GLP-1 tracker:

- Protein target auto-floors at 1.6 g/kg when you're on a GLP-1 in a deficit
- Onboarding shows the math: "Bumped because GLP-1 + cut needs more protein"
- Home shows a small medication acknowledgment so it never feels generic
- AI logs anything edible — including the snacks GLP-1 users still eat

---

**6/7**
What I'm NOT building:

- A 14M-item food database
- Streaks or gamification
- A web version
- AI symptom tracking (yet — coming)
- A workout tracker

Doing fewer things, better. The user I'm building for doesn't need another bloated tracker.

---

**7/7**
Solo-built. Beta soon. If you're on a GLP-1 and want to test it, reply or DM. I'd love feedback from real users before opening it up wider.

Pin this to my profile if I haven't already.

---

---

## Thread 3 — "Switching AI providers cost me a 120x increase per scan. Here's the math."

**Use case:** Technical / decision-making thread. Posted when you've used Bedrock for a few weeks and have actual cost data.

---

**1/8**
Started LeanScan on Gemini 2.0 Flash. Hit the free tier quota in week 1.

Built a multi-provider AI abstraction so I could swap. Switched to Claude Sonnet via Bedrock.

Cost per scan went from $0.0001 to $0.012. 120x more expensive. Here's why I did it anyway — 🧵

---

**2/8**
The Gemini story first:

- Free tier: 15 RPM / 1500/day
- Cost beyond free tier: ~$0.0001/scan
- Latency: ~3 seconds
- Accuracy: solid on common foods, weak on packaged items

For 100 users at 3 scans/day = 300/day, well within free tier. Cost: $0/month. Tempting.

---

**3/8**
But the free tier has hidden costs:

- Quota walls happen unpredictably
- Per-minute RPM is shared across the org, so a marketing demo can take the API down
- Free tier ToS includes "may use prompts for training" which is sketchy for health data

For an MVP that's about to get demoed on TestFlight, the predictability tax matters.

---

**4/8**
The Bedrock + Claude story:

- $0.003/1K input + $0.015/1K output = ~$0.012 per scan
- No quota walls, no per-minute caps
- Better accuracy on packaged food (matters for snack-heavy GLP-1 users)
- Anthropic's commercial ToS doesn't include training-on-prompts
- Pay AWS, who I already pay for the droplet

---

**5/8**
At 100 users × 3 scans/day = 300 scans = $3.60/day = $108/month.

At 1000 users = $1080/month.

That's real money. But the breakeven against a $5/month subscription is ~21 scans per paying user per month. Most won't hit that.

The math works at scale.

---

**6/8**
The bigger insight: I built the provider abstraction BEFORE I needed it.

When Gemini failed, switching was a 1-line env var change. Could've taken 3 days. Took 30 seconds.

Abstractions cost time upfront. They save you when reality breaks your assumptions — which it will.

---

**7/8**
What I'd do differently:

I should have built tiered routing on day 1:

- Free tier users → Gemini (cheap, fine for casual)
- Paid tier users → Bedrock (better accuracy, no caps)
- Fallback chain if either fails

That's roadmap now, not v1.

---

**8/8**
Lesson: optimize for *switchability*, not perfection.

You will switch providers. You will be wrong about which one to start with. The cost of being wrong is the time it takes to switch. Make that time near zero.

---

---

## Thread 4 — Weekly review template

**Use case:** Fill this in every Friday. Copy the structure, swap the specifics.

---

**1/6**
Week N of building LeanScan. Quick recap of what shipped, what broke, and what's next — 🧵

---

**2/6**
🟢 Shipped this week:
- [Feature 1 with one-line description]
- [Feature 2]
- [Feature 3]
- [Doc / refactor / cleanup if applicable]

[Optional: attach a video / screenshot]

---

**3/6**
🔴 Broke this week:
- [Bug or issue 1 — what happened, how you found out, what fix]
- [Bug 2 if applicable]

Lost ~N hours to [specific thing].

---

**4/6**
📊 Numbers:
- [Signups / waitlist / followers / scans / whatever you actually have]
- [Engagement metric — week-over-week change]
- [Cost / spend / revenue if relevant]

[If numbers are zero, say so. "Still pre-launch, 0 users." Honesty beats fake metrics.]

---

**5/6**
💭 One thing I learned:
[A specific insight from the week. Could be technical, product, or about yourself. Not generic.]

---

**6/6**
🚀 Next week:
- [Specific thing 1]
- [Specific thing 2]
- [If applicable: TestFlight / launch / something concrete]

What should I build that I'm not thinking of? Replies welcome.

---

*Tip: Most engagement comes from the first and last tweet of a thread. Make sure those two carry the load if someone only reads two tweets.*
