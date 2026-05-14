# Ongoing tweet rotation

30+ tweets across five content pillars. After the launch-week sequence, rotate through these. Each is meant to stand alone, so you can fire them in any order based on what you actually shipped that day.

---

## Pillar 1 — Technical decisions (for the dev audience)

> Decided to use Prisma over Drizzle for LeanScan's API. Reason: Prisma's migration tooling is mature, and at MVP scale I'd rather optimize for *fewer footguns* than *more performance*. Drizzle is faster. Prisma is safer.

> Auth in LeanScan is custom JWT + bcrypt + refresh tokens, not Supabase Auth or Clerk. Why: I wanted full control of the user lifecycle (medication-aware protein bumps, custom credit grants on signup) and I didn't want a vendor between me and my own user table. Cost: ~4 hours to build the auth flow. Value: full ownership.

> Image storage for meal photos = local filesystem on a $20 droplet. Not S3, not Supabase Storage. At 1000 users × 5 photos/day × 200KB each = ~1GB/day. A 500GB droplet volume = 18 months of headroom. Premature S3 = premature optimization.

> Rate-limited every endpoint in LeanScan. The scan endpoint at 300/hour, auth at 200/15min. Most indie apps don't bother. The first time someone runs a credential-stuffing attack against you, you'll wish you had. Cost: 4 lines of code.

> Tip for solo founders: don't use a state management library you don't already know. I picked Zustand for LeanScan because I've used it before. Could've used Redux Toolkit, Jotai, Valtio — all fine. Familiar > optimal when you're moving fast.

> Switched LeanScan's AI from Gemini to Bedrock+Claude Sonnet this week. Cost per scan went from ~$0.0001 to ~$0.012. 120x more expensive. But: no quota walls, better packaged-food recognition, and Bedrock means I pay AWS not Google. Calculus is different at MVP scale where the cap is "what can I afford to test" not "what's optimal per scan."

---

## Pillar 2 — Product opinions (for the indie founder audience)

> I'm not building "AI MyFitnessPal." I'm building the calorie tracker for one specific user — the GLP-1 patient on a cut who's losing muscle without knowing it. Generic positioning loses to incumbents. Sharp positioning wins a beachhead.

> Removed streaks from LeanScan's roadmap. They drive engagement at the cost of shame. The user I'm building for is already anxious about food; the app shouldn't make it worse. Calm > addictive.

> Building in public is a marketing channel only if you also have a product. Posting daily about a vaporware app is the indie equivalent of pre-revenue VC fundraising — it looks busy, but nothing's shipping. Build first, post second.

> Every feature I've cut from LeanScan v1 has made the product better, not worse. Cut barcode scanning. Cut workout tracking. Cut a recipe database. Cut social/sharing. What's left is the thing that matters.

> The hardest decision in building this app wasn't technical. It was admitting the medication-step copy lied to users. The onboarding said "medication-specific tracking" — we didn't have any. So I built it. Step 1 was acknowledging the gap; step 2 was closing it.

---

## Pillar 3 — Show the work (visual)

> [Drop a screenshot of the home screen with the protein ring filled to ~60%]
>
> Today's home in LeanScan. Protein ring is the hero. Calories + macros are context. Goal-keyed eyebrow at the top reminds you what you're working toward.

> [Drop a 10-second video of opening the app and tapping Snap]
>
> Snap-to-save in LeanScan. Camera → AI → review → save. Done in under 6 seconds.

> [Drop a screenshot of the meal detail screen]
>
> Meal detail in LeanScan. Big photo, big protein number, AI confidence, source, notes. Every field clickable, every field editable.

> [Drop a screenshot of the calorie strip]
>
> Calorie progress on the home screen. "480 / 1820 kcal · 1340 left · 200 under maintenance." Three pieces of information, one strip, fits under the protein ring. This is the Tier 2 work that closed the BMR / TDEE gap.

> [Drop a screenshot of the Weight strip with current → goal]
>
> Weight strip. Current → goal kg + delta. Tap to weigh in via a numeric sheet. Protein + calorie targets recompute instantly when weight changes.

---

## Pillar 4 — Personal / behind-the-scenes

> Solo founder week-1 budget for LeanScan:
> $20/mo (droplet) + $5/mo (Postgres) + $0 (Gemini free tier) + $9.99 (Apple Dev) = $34.99/mo
>
> Could be lower if I cut Apple. Could be 100x higher if I added a designer, a CSM, a growth lead. Spending more doesn't mean building faster.

> 6 weeks into building LeanScan. Today I shipped 4 features and broke 2 of them by 4pm. Indie life.

> The number-one reason I'm building LeanScan: I watched someone I care about lose 15kg on Wegovy and end up weaker. The cause was inadequate protein. The fix was a 30-second daily habit no app made easy. I want to be the app that does.
>
> [adapt to your actual reason]

> Tools I'm using to build LeanScan: VS Code, Expo Go, Postman, TablePlus, Linear, this very platform (Cowork) for AI pair-programming. Total cost: ~$0/month for me; the AI subscription is the most expensive thing. Lean stack.

> Took my first day off in 3 weeks today. Closed the laptop, walked outside, didn't think about onboarding flows. Came back at 6pm and immediately saw a UX issue I'd been blind to for a week. Rest is a debugging tool.

---

## Pillar 5 — Numbers / milestones (use these when you have actual numbers)

> [When you have signups] N people signed up for LeanScan today. Half from a single Reddit thread in r/Ozempic. Distribution is finding the room your user is already in.

> [When you have retention data] X% of LeanScan beta users logged a meal on day 3. The classic SaaS bar is 40%. Beating it means the product loop works; missing it means the first scan isn't sticky enough.

> [When AI cost data builds] N scans this week. Bedrock bill: $X. Per-user cost: $Y. Per-paying-user breakeven: $Z.

> [When you have testimonials] "I went from forgetting to log 90% of meals to logging every meal" — beta tester on day 14. This is the validation that matters. Not Reddit upvotes, not Twitter likes — a behavior change in a real user.

> [When you ship a milestone] 100 days. 23,000 lines of code. 12 features shipped. 2 features killed. 1 working product. 0 users yet. Now the real work starts.

---

## Bonus — Reactions and quote tweets

These are templates for when someone tweets something LeanScan-adjacent and you want to chime in.

> [QT of a MyFitnessPal complaint] "This is why I started building LeanScan. Logging a meal shouldn't take longer than eating it."

> [QT of a GLP-1 thread] "Protein protection is the most under-discussed part of GLP-1 weight loss. The math is well-established (1.6+ g/kg in a deficit), the UX to actually hit it is what's missing. Building it. [link]"

> [QT of an indie founder shipping something good] "This is exactly the kind of work I wish I'd shipped a month earlier. Bookmarking the approach."

> [QT of an AI announcement] "What this means for LeanScan: [thoughtful 1-line take]. What it doesn't change: the user still has to want to log."

---

## Posting hygiene

- **Don't post all of these in one week.** Pace them.
- **If a tweet works, double down on that pillar for 3 days.** The algorithm will reward the streak.
- **Don't reply to your own tweets in a thread unless you have something genuinely new to add.** "Inflated thread" tweets get punished.
- **Screenshots > text-only.** When in doubt, attach a visual.
