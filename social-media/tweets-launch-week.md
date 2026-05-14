# Launch week — 14 tweets

The first two weeks of build-in-public posting. Use these in roughly this order; tweak the specifics to match what you actually shipped that day. Visual prompts in brackets `[VISUAL:]` tell you what screenshot or video to attach.

---

## Day 1 — The intro tweet

> Building LeanScan: an AI calorie tracker for GLP-1 users.
>
> Snap a photo of your meal. Get protein in 3 seconds. No 14-million-item database. No 6-tap logging dance.
>
> Solo-built. Going to share the whole thing here.
>
> [VISUAL: 30-second screen recording of the snap → result → save flow]

*Why this opens well:* names the product, the user, the differentiator, the format ("share the whole thing here") in 4 lines. The video does the heavy lifting.

---

## Day 2 — A technical decision

> AI provider for LeanScan's protein estimation:
>
> - Gemini 2.0 Flash: $0.0001/scan but quota-limited at 1500/day
> - OpenAI GPT-4V: $0.01/scan, no quota issues
> - Claude Sonnet via Bedrock: $0.012/scan, best accuracy on packaged food
>
> Started on Gemini. Hit the quota in week 1. Built a provider abstraction so I can A/B them.
>
> Currently running Bedrock. Considering tiered routing later (Gemini first, Bedrock fallback).
>
> [VISUAL: code screenshot of the `getAIProvider()` factory or env var]

*Why this works:* specific dollar amounts. Real decisions. Other devs love this kind of "I evaluated 3 options" content.

---

## Day 3 — The candy wrapper test

> Testing LeanScan's "is this actually food?" detector with a Fruittella wrapper.
>
> AI said: "Fruittella candy, 1 piece, 0g protein, 20 kcal."
>
> Correctly identified the brand. Correctly identified it has zero protein. Correctly didn't refuse to log it because "not a real meal."
>
> Snacks count.
>
> [VISUAL: screenshot of the scan result with the wrapper visible and the AI's output]

*Why this works:* funny visual, specific outcome, shows the product working AND signals the audit-everything stance.

---

## Day 4 — A struggle / honesty

> Spent 4 hours yesterday on a bug where the photo upload would fail silently on Android.
>
> Turned out to be a known Expo SDK 55 regression with fetch + FormData multipart. Switched to expo-file-system's uploadAsync — uses the native HTTP path, bypasses the bug.
>
> Working now. Lost an afternoon.
>
> [VISUAL: screenshot of the working scan on Android — could be a video of you scanning something]

*Why this works:* devs respect honest struggle posts. "Lost an afternoon" makes you human. The technical specificity makes you credible.

---

## Day 5 — Design choice with screenshots

> Calorie tracker apps default to a calorie ring as the hero metric. I'm flipping it — LeanScan shows PROTEIN first.
>
> For the user this is for (GLP-1 on a cut, lifter on a recomp), protein is the variable that matters. Calories are context. Most apps have the hierarchy backwards.
>
> [VISUAL: side-by-side — LeanScan home screen vs MyFitnessPal home screen]

*Why this works:* opinionated. Visual. Implicitly defines who the user is.

---

## Day 6 — A small wins tweet

> Just shipped a small thing: when you log a coffee (zero protein), the meal card shows "5 kcal" as the headline instead of "+0g protein" (useless number).
>
> 80% of users will never notice. The 20% who do will think "this app pays attention to me."
>
> [VISUAL: screenshot of two meal cards — one steak with +40g, one coffee with 5 kcal]

*Why this works:* shows attention to detail. Quantifies the trade-off. Devs love this kind of "small thing, deliberate choice" tweet.

---

## Day 7 — End of week 1 thread (use threads.md → "Week 1 build summary")

This is your first Friday thread. Pull from `threads.md`.

---

## Day 8 — A counter-intuitive insight

> I built LeanScan to be a "protein-first" tracker because that's what serious users want.
>
> Then I realized 80% of my own usage is logging zero-protein items — coffee, sparkling water, the occasional candy. Casual logging is what people actually do.
>
> So the AI now identifies anything edible, and the UI gracefully degrades from "+25g protein" to "120 kcal" when protein doesn't apply.
>
> Building for the casual case made the serious case better, not worse.
>
> [VISUAL: the home screen with a mixed meal list — protein-heavy + zero-protein items]

*Why this works:* counter-intuitive. Specific to LeanScan. Useful insight that founders/devs nod at.

---

## Day 9 — A question / poll

> Quick poll for anyone who tracks food (or used to):
>
> Why did you stop?
>
> 🍔 Logging took too long
> 📊 Numbers were inaccurate
> 😩 Felt like a chore
> 🤖 The app felt cold/judgmental
>
> [VISUAL: just the poll, no image]

*Why this works:* invites engagement. Helps you validate. Replies tell you which pain point matters most. Use this signal in the next thread.

---

## Day 10 — The medication moment

> Talked to a friend on Mounjaro last week. She'd lost 12 kg in 4 months. Loved the loss. Hated that her arms looked smaller.
>
> Then I learned: GLP-1 users in a deficit lose ~25% of their dropped weight as muscle when protein is inadequate.
>
> That's the wedge for LeanScan. The math should default to protecting muscle for GLP-1 users on a cut. Built it in this week.
>
> [VISUAL: screenshot of the "Why this number" reasoning card from the onboarding Done screen]

*Why this works:* personal story (the muscle-loss observation). Specific stat. Product mention is incidental but proves there's a real product behind the story.

---

## Day 11 — A roadmap nudge

> Things I'm NOT building for LeanScan v1:
>
> - Barcode scanning (AI photo covers 85% of cases)
> - Workout tracking (not the wedge)
> - A 14-million-item food database (the entire point is not searching)
> - Web version (mobile-first; web in Phase 7)
> - Streaks (gamification = shame; calm > anxious)
>
> Choosing what NOT to build has been harder than choosing what to build.
>
> [VISUAL: optional — a deleted-list-style screenshot, or none]

*Why this works:* opinionated. Signals discipline. Other founders share this kind of post because it justifies their own "no" decisions.

---

## Day 12 — A small tech show-off

> The protein ring on LeanScan's home screen is also the app's logo. Same shape, same colors, same arc.
>
> The hero UI element IS the brand mark. Whenever someone sees the icon, they see a tiny version of their daily goal.
>
> Design decisions like this don't show up in growth metrics. They show up in users telling you the app feels intentional.
>
> [VISUAL: side-by-side of the logo and the home ring]

*Why this works:* design-craft content. Designers reshare this. It's the kind of detail that earns "this person actually cares" trust.

---

## Day 13 — A second poll or reaction

> The "snap a meal" demo for LeanScan takes about 5 seconds end to end.
>
> Snap → AI runs → estimate appears → tap Save.
>
> What's the longest you've ever spent logging a single meal in MyFitnessPal?
>
> [VISUAL: 5-second screen recording]

*Why this works:* sets up MFP as the contrast. Invites a vent reply (everyone has a story about a 3-minute logging session).

---

## Day 14 — End of week 2 thread (use threads.md → "Week 2 build summary")

Friday again. Second thread. By now your follower count should be measurable and the algorithm has data on what works for you.

---

## Notes after week 2

**Look at what landed.** Which 2–3 tweets got 10x the engagement of the others? Those tell you which pillar (technical / opinionated / visual demo / personal story) your audience cares about. Lean into that pillar for the next 30 days.

**Open beta** — by end of week 2, you should have at least a TestFlight link to start sharing in replies to anyone who asked "where can I try this." Reply, don't pitch. "Here's a TestFlight invite if you want to try it — I'd love feedback" is enough.
