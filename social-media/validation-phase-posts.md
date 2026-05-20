# Validation Phase — Posts to Use Right Now

**For:** the 2–3 weeks between "applied for cloud credits" and "credits arrive
+ public launch."

**Goal:**
- Build curiosity / pre-launch interest on X
- Validate the positioning by reading what people actually say back
- NOT pitch the product yet — you don't even have a public URL

**Tone reminder (from `README.md`):** first person, specific numbers, show
the work, honest about what's broken, no growth-hacker bro speak.

---

## 1. Reality check before you post on Reddit

Read this twice. Most founders get banned in week 1 because they don't.

Reddit ≠ X. On X you're allowed to talk about your product all day. On
Reddit, the moment you mention your product, the post auto-modders kill it
and the human mods may ban your account. The big fitness subs
(r/loseit 4.2M, r/Fitness 14M) have **strict anti-self-promotion rules**
that they enforce ruthlessly.

**Your job in weeks 1–3 on Reddit:**
- Be a genuinely helpful person
- Answer questions about protein, macros, tracking, GLP-1, weight loss
- NEVER link to leanscan.app
- NEVER say "I'm building an app for this"
- NEVER mention the product in the first 5 comments you make on a sub
- Use the SAME Reddit account you'll later use for the soft-launch post

**Why this works:**
- Mods see your comment history, see you contributing, don't auto-ban you
- Users recognize your username and trust you when you finally post
- The 4-week "be helpful first" rule is actual Reddit etiquette, not a
  marketing trick — communities can smell a marketer in 30 seconds

**When you can finally mention LeanScan on Reddit (week 4+):**
- Only after 20+ helpful comments per subreddit
- Only in posts where someone is *literally asking for what you built*
- Use "I'm building" not "check out" — frame as your project, not a pitch
- Mention name only when asked. Don't drop links unsolicited.

The discipline here is what separates founders who get to 1,000 signups
from founders who get shadowbanned in week 2.

---

## 2. X / Twitter — 18 ready-to-post tweets for the next 3 weeks

Use them in any order. Cadence per `README.md`: **1 tweet/day + 1 thread per
week.** Don't post all 18 in one day — you're building presence, not
flooding the timeline.

### Week 1 — "I shipped this thing, here's what I'm thinking"

**Post 1.1 — the milestone tweet**
> Shipped the first deployable build of my side project this week.
>
> AI-powered protein tracker. Snap a meal → get protein and macros in 3 seconds. No food database scrolling, no "47 baby carrots" jokes.
>
> Build in public starts now. Beta in a few weeks.

**Post 1.2 — the unexpected reflection**
> Spent today fighting Gradle build errors on the Android APK pipeline.
>
> When indie devs say "the boring 20% takes 80% of the time," this is the 20% they mean.
>
> The product itself was the easy part.

**Post 1.3 — the question / validation probe**
> Genuine question for anyone who tracks macros:
>
> What % of your protein target do you actually hit on an average day?
>
> Be honest — I'm building a tracker around the answer, and "I miss it by 30g most days" is what I'm betting on.

**Post 1.4 — the contrarian tech take**
> I have a $200/yr personal AWS limit. So I'm using Gemini 2.0 Flash for my AI vision pipeline instead of Claude via Bedrock.
>
> Gemini is 10–20x cheaper, ~85% as accurate on common meals. For MVP, the cost difference is the only thing that matters. Premium model can come later.

**Post 1.5 — show the work (screenshot)**
> [screenshot of the home screen — protein ring filled to ~75%]
>
> Today's home screen in LeanScan. Protein is the headline. Calories sit underneath as context, not the lead.
>
> Most trackers do this backwards. Calorie ceilings are exhausting. Protein targets are motivating.

**Post 1.6 — the founder moment**
> Realization while debugging tonight:
>
> I've been building this app for the user I want to BE in 12 months, not the user I currently AM.
>
> That's either a useful frame or a giant blindspot. I'm 60/40 useful.

### Week 2 — "Here's the thinking, here's the trade-off"

**Post 2.1 — the deliberate cut**
> Cut "barcode scanning" from LeanScan v1.
>
> AI photo logging handles 85% of cases (homemade meals, restaurant plates, packaged snacks).
>
> Barcode covers the remaining 15% — but adds a whole new UX surface to maintain.
>
> Ship the 85%. Add the 15% if users actually ask.

**Post 2.2 — the personal angle**
> Why I'm building a protein-first tracker:
>
> Watched a friend lose 15 kg on Wegovy and end up visibly weaker. Cause: she ate less protein, lost muscle, the scale "won" but her body didn't.
>
> Every existing tracker leads with calories. The one number she needed (protein) was buried.

**Post 2.3 — the question / validation probe**
> If you use MyFitnessPal or Cal AI right now — what's the ONE thing that frustrates you the most?
>
> Building something opposite to that one thing.

**Post 2.4 — the build-in-public number**
> Three weeks of work to get the deployable APK:
>
> - 6 Postgres migrations
> - 14 mobile screens
> - ~6,200 lines of TypeScript
> - 4 different AI providers wired
> - 1 fight with Gradle that took longer than building the photo scan feature
>
> Indie product engineering is an inverted iceberg.

**Post 2.5 — the show, not tell**
> [screenshot of the meal detail screen]
>
> Tap a logged meal in LeanScan. Photo, protein, calories, macros, notes.
>
> Every field editable, AI confidence visible, "log similar tomorrow" in one tap.
>
> The whole point: faster than scrolling a food database for a chicken breast.

**Post 2.6 — the data point**
> Cost-per-meal-scan in my app:
>
> Gemini 2.0 Flash: ~$0.0001
> GPT-4o: ~$0.005
> Claude Sonnet via Bedrock: ~$0.012
>
> Premium tier in v2 will use Claude. Free tier in v1 uses Gemini. The math at 1,000 users is the difference between $0.10/mo and $36/mo in AI costs.

### Week 3 — "Almost ready, here's the ask"

**Post 3.1 — the soft pre-announcement**
> Closing in on the closed-beta release of LeanScan.
>
> Looking for 10–20 testers who:
> - Already track macros (or have tried and quit)
> - Want a protein-first hierarchy
> - Will give honest "this sucks" feedback when something sucks
>
> Reply or DM if that's you.

**Post 3.2 — the moment you saw something working**
> Wife logged her dinner in my app tonight. Took 4 seconds — photo, see protein number, tap save.
>
> Then she said "huh, I'm at like 70g, way under my target."
>
> THAT is the moment I'm building for. Awareness in seconds, not minutes of menu hunting.

**Post 3.3 — the unanswered question**
> Big question I'm not sure how to answer yet:
>
> Should the home screen ALWAYS lead with protein? Or should it adapt to the user's goal — calories first if they're in a deficit, protein first if they're recomping?
>
> Lean: always protein. Bias: I think too many options is the enemy.

**Post 3.4 — the credit application moment**
> Applied to 6 cloud startup credit programs today.
>
> Microsoft for Startups, AWS Activate, Google Cloud, Anthropic, Supabase, Vercel.
>
> Total time: ~3 hours. Potential value: ~$5–15K in compute, hosting, AI calls.
>
> If you're solo-building, this is the second-highest leverage move after just shipping.

**Post 3.5 — show LBM idea (validates the premium feature thesis)**
> Idea I'm sitting on for the premium tier:
>
> Upload your InBody / DEXA scan. App calculates your protein target from your actual lean body mass, not your bodyweight.
>
> Most apps do `weight × 1.6g/kg`. The correct math is `lean mass × 2.0g/kg`. Easily 20g/day different.
>
> Worth $5/mo? Real question.

**Post 3.6 — the build-in-public week-3 recap thread starter**
> Three-week side-project recap, the honest version:
>
> 🧵

(Then turn this into a thread — see thread template below)

### Bonus — a thread template for end of week 3

> Three-week side-project recap, the honest version:
>
> 1/ Goal: ship a deployable AI protein tracker in evenings + weekends.
>
> Got: working iOS + Android build + live API + landing page + SEO. About 70% of what I planned. The other 30% is on hold for cloud credits to arrive.
>
> 2/ What worked:
> - Picking a focused wedge (protein-first, not "another tracker")
> - Choosing Expo + Next.js — boring, mature, fast
> - Building the API and the app at the same time so neither was a guess
>
> 3/ What didn't work:
> - Three hours fighting an Android build error that turned out to be a missing peer dependency
> - Choosing Bedrock + Claude over Gemini for AI — too expensive at MVP scale, switched back
> - Trying to write marketing copy for "everyone" — too vague, lost the wedge
>
> 4/ What I learned about myself:
> - Engineering is comfortable. Marketing isn't. Every hour I spent on Gradle was an hour I avoided posting.
> - "Validate first, build second" is correct advice. I did it backwards. Working out OK so far.
>
> 5/ What's next:
> - Closed beta with ~10 people this week
> - Apply for App Store, Play Store accounts when credits arrive
> - Then public landing page, public launch, real money
>
> Following along helps. Reply if you'd test the beta.

---

## 3. Reddit — helpful contribution templates (NO LINKS, NO PITCHES)

Use these as the SHAPE of your first 30 Reddit comments. Pick threads
where these answers genuinely help.

### Template A — "How do I hit my protein target?"

> Couple of things that actually work for hitting protein consistently:
>
> 1. **Front-load it.** Aim for half your daily target by lunch. 40g
>    breakfast + 40g lunch = the back half of the day is just easy
>    snacks (greek yogurt, cottage cheese, jerky, protein shake) to
>    close the gap.
> 2. **Reverse-engineer staples.** Pick 5–6 meals you already eat that
>    are high-protein. Repeat them. Most people who hit their target
>    aren't eating 30 different meals, they're rotating 6.
> 3. **Eat protein when you don't feel hungry.** Especially if you're
>    on a GLP-1 — appetite drops, you eat less, protein drops first.
>    Force a 20g snack mid-afternoon even if you're not hungry.
>
> The tracking tool barely matters if these three habits aren't in
> place.

### Template B — "Is MyFitnessPal worth $79/year?"

> Honest take: no, unless you specifically need their barcode/recipe
> database. For 90% of users, the free tier is enough. The premium
> features (custom macros, AI photo scan, ad removal) are nice but not
> $79/yr nice.
>
> Cronometer ($40/yr) is better for micronutrient tracking. MacroFactor
> ($72/yr) is better for actual macro coaching. Lose It is the cheapest
> and the UI is the friendliest.
>
> The deeper question is whether you'll still be tracking in 30 days.
> Most people quit MFP within 2 weeks because the friction wears them
> down. If you're new to tracking, pick the one with the lowest tap
> count, not the most features.

### Template C — "Why am I not building muscle on a cut?"

> Three things, in order of likelihood:
>
> 1. **Protein isn't actually at 1.6+ g/kg.** People estimate they
>    "eat a lot of protein" and end up at 0.9 g/kg. Track for 3 days
>    and you'll be surprised which direction you're off.
> 2. **You're not training heavy enough.** A cut is the worst time to
>    drop intensity. Same weights, same reps, just less food.
> 3. **You're cutting too aggressively.** -500 kcal/day max if you
>    want to keep muscle. -1000 kcal will rip muscle off you regardless
>    of protein.
>
> If 1 + 3 are dialed in, you'll preserve almost all of your muscle
> through a 6–8 week cut.

### Template D — "Just started Ozempic — what should I track?"

> Two things matter more than everything else combined:
>
> 1. **Protein in grams per day.** Aim for 1.4–1.6 g/kg of your CURRENT
>    bodyweight. Higher than you'd think — the appetite suppression
>    makes it really easy to undershoot, and undershooting is what
>    causes the muscle loss most GLP-1 users end up dealing with.
> 2. **Weekly weight average, not daily.** GLP-1 weight loss is noisy
>    week to week. Weigh daily, average it, only look at the trend.
>
> If you do those two things you'll be ahead of 80% of people on the
> medication. Everything else (calorie counting, micronutrients, body
> composition scans) is secondary at the start.

### Template E — "Anyone tried switching from MyFitnessPal?"

> Switched off MFP about 18 months ago, here's what I learned:
>
> - The migration pain is real. MFP exports CSV; most other apps don't
>   import it cleanly. You'll re-add your common foods manually for the
>   first week.
> - You don't need 14 million food entries. The 80/20 holds — 90% of
>   what most people eat is covered by maybe 300 foods.
> - The tracking method matters more than the app. AI photo or quick
>   add chips beat search-driven entry by 10x in actual time-on-task.
>
> The hard truth: most people who quit MFP don't switch to a better
> tracker, they just stop tracking. That's the real risk to manage.

---

## 4. Reddit — "soft mention" posts you can use in week 4+

ONLY after you've made 20+ helpful comments per sub. ONLY in subs where
the rules allow it (check the wiki). ONLY when someone is literally asking
for what you built.

### Soft mention A — answering a "what app should I use?" post

> If you're already off the calorie-first wagon and care about protein,
> the existing apps mostly don't lead with protein on the home screen
> (calories first by default, protein buried). Some let you customize
> the hierarchy if you dig into settings.
>
> Slight bias to disclose: I'm building an indie one that's protein-
> first by default and uses AI photo logging instead of database
> search. It's in closed beta. Not pitching it here, just noting it
> exists for the next time someone asks. Happy to share if you want a
> tester slot.

### Soft mention B — answering "anyone else frustrated with MFP?"

> Frustrated enough that I started building a side project to scratch
> the itch — protein-first home screen, AI photo logging, all-in-one
> with weight + training. Not ready for public yet (closed beta this
> month).
>
> Disclosure aside: even if I weren't building this, my recommendation
> for MFP-frustrated users right now would be either MacroFactor
> ($72/yr, expensive but worth it for actual macro coaching) or Lose
> It (free, friendlier UI, calorie-first but quick to log).

---

## 5. Posting calendar — next 3 weeks

| Day | Platform | What | Effort |
|---|---|---|---|
| Mon | X | Progress / what shipped over weekend | 5m |
| Tue | X | Tech decision / opinion | 10m |
| Tue | Reddit | 1 helpful comment in r/Fitness, r/loseit, or r/leangains | 10m |
| Wed | X | Screenshot or WIP question | 3m |
| Thu | X | Question / validation probe | 5m |
| Thu | Reddit | 1 helpful comment somewhere new | 10m |
| Fri | X | Reflection or contrarian take | 5m |
| Sat | X | Recap thread (every other week) | 30m |
| Sun | (rest) | | 0m |

**Total per week:** ~5 X posts + 2 Reddit comments = ~1.5 hours.

Repeat for 3 weeks. By week 4 you should have:
- 15+ X posts, hopefully 1 with traction
- 6+ helpful Reddit comments accumulating karma
- The ability to soft-mention the product on Reddit without getting banned

---

## 6. What to do when something works

**If a tweet gets 50+ likes:**
- Reply to every reply within 24 hours
- Pin the tweet
- Quote-tweet it 3 days later with a follow-up ("update on this…")
- Use the same exact framing in 1–2 future tweets

**If a Reddit comment gets gold / awards / 100+ upvotes:**
- Don't pitch in the same thread, ever
- Save the comment text — that framing works
- Reuse the framing in a tweet
- Make 3 more comments on the same sub in the next week to compound

**If someone DMs you on X saying "I'd test it":**
- Reply within 12 hours
- Don't gate-keep — give them the Android APK link or Expo Go URL today
- Ask them ONE follow-up question after 3 days of use ("what's the worst
  part?")
- Their answer is the most valuable thing you'll hear all month

---

## 7. What NOT to post (avoid these failure modes)

- **Generic motivational posts.** "Remember to drink water!" — no.
- **Self-deprecating beg-posts.** "It's so hard, am I crazy for trying?"
  — no. Confidence + honesty, not pity.
- **Engagement-bait threads.** "RT if you also hate calorie tracking" —
  no. Indie hacker audience sees through it instantly.
- **Posting your landing page URL on X repeatedly.** Once per week max
  at this stage. The URL doesn't even exist publicly yet — you have
  nothing to share.
- **Replying to viral fitness tweets with your pitch.** Reply Guy energy
  is repellent. Reply to small accounts you actually find interesting.
- **Reposting other people's content with "thoughts?"** — feels lazy.
  Original observations only.

---

## 8. After credits arrive (preview)

When the credit emails land and you can finally make this public, the
posts shift:
- "It's live. Here's the URL." (waitlist signup ask)
- "First 100 signups in 24 hours — here's what surprised me"
- "Day-3 retention for the first cohort was X%"
- TestFlight invite open posts
- Honest "what's working / what's broken" weekly updates

But that's two weeks away. For now, the job is: build presence, learn
what people say, refine the pitch in public.

---

## File map for context

Other social-media files in this folder (for reference):
- `README.md` — voice + cadence
- `tweets-launch-week.md` — for the public launch arc (use after credits)
- `tweets-ongoing.md` — rotation pool (pre-pivot, may need refresh for
  current positioning)
- `threads.md` — thread templates
- `viral-hooks.md` — hook formulas
- `engagement-templates.md` — reply patterns
- `visual-prompts.md` — screenshot ideas
- `weekly-review-template.md` — your own review process

This file (`validation-phase-posts.md`) is the **only one you need to
look at this week.** The others are for later phases.
