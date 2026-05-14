# Visual content prompts

Every tweet with a screenshot or short video outperforms a text-only tweet by ~3-5x in this audience. This file is the visual companion to your posting plan: every entry tells you exactly what to capture and from where.

---

## Hero visuals — capture once, use many times

### V1 — The 30-second snap-to-save demo

**What:** Screen recording of opening LeanScan → tapping Snap → photographing a real meal (use a chicken bowl, a protein shake, or a sandwich — recognizable food) → AI returns the estimate → tap Save → home updates.

**How:** Use iOS screen recording (Control Center → Screen Record). Record at the actual app — don't zoom or simulate. Aim for under 30 seconds total. Trim ruthlessly.

**Where you'll use it:**
- Day 1 launch tweet (the intro)
- The "this is what 5 seconds of logging looks like" tweet
- Pinned tweet on profile
- Future ad / landing-page hero video

**Tip:** Hold the phone in landscape if your app supports it; otherwise portrait. Record at 60fps if possible.

---

### V2 — The home screen with a real day's data

**What:** Screenshot of the home screen with ~3-5 meals logged, the protein ring at ~60-70% full, calorie strip showing real numbers, weight strip visible.

**How:** Log a realistic-looking day in TestFlight or dev build. Screenshot. Crop to remove the status bar.

**Where you'll use it:**
- Every "look at this" tweet
- App Store listings later
- The pitch report

---

### V3 — Side-by-side LeanScan vs MyFitnessPal

**What:** Two phone screenshots placed side-by-side. LeanScan home on the left (protein ring + calorie strip + weight strip), MyFitnessPal home on the right (calorie ring + ad + 7 nav buttons).

**How:** Take a fresh screenshot of MFP home (free version, with ads). Take a clean LeanScan screenshot. Compose side-by-side in Figma or Photoshop with a 4px white gutter. Export at 2:1 aspect ratio for Twitter.

**Where you'll use it:**
- The "protein-first not calorie-first" tweet
- The "I'm not building AI MFP" tweet
- Comparison threads

---

### V4 — The candy wrapper test

**What:** Screenshot showing the AI correctly identifying a Fruittella wrapper. Either capture the scan flow result OR the saved meal card.

**How:** Photograph a Fruittella wrapper in good light. Run it through LeanScan. Screenshot the result.

**Where you'll use it:**
- Day 3 launch tweet (the candy wrapper test)
- The "audit everything" tweet
- Reply bait when people ask "does it work for snacks?"

---

### V5 — The logo evolution

**What:** Visual showing the logo at 4 sizes — 16px (favicon), 24px (nav header), 64px (app showcase), 1024px (app icon on dark forest background).

**How:** Use the SVG files in `marketing/brand/`. Compose into a single 16:9 image at multiple scales. Export PNG.

**Where you'll use it:**
- The "logo is also the protein ring" tweet
- Brand-craft content
- Anywhere you mention design decisions

---

## On-demand visuals — capture as you ship

### V6 — Code screenshots

**For:** Technical decision tweets. Show the actual code that makes the point.

**Tool:** Use [Carbon](https://carbon.now.app/) or [ray.so](https://ray.so) to make code screenshots that look intentional. Default to:
- Theme: VS Code dark or Night Owl
- Font: JetBrains Mono or Fira Code
- Background: a soft color from the LeanScan brand if you want (cream / forest)
- Width: ~640px so it doesn't get downsized

**What to screenshot:**
- The `getAIProvider()` factory (multi-provider abstraction)
- The `calculateProteinTarget()` function (the GLP-1 bump logic)
- The `ConfirmSheet` component (custom UI craft)
- A diff showing a before / after for any meaningful change

---

### V7 — Bug story screenshots

**For:** Honest-struggle tweets. Show the actual error.

**What to screenshot:**
- The "network request failed" error from your Expo SDK 55 upload bug
- A TypeScript compiler error you eventually solved
- A Stack Overflow page that helped (cite the link)
- The exact line of code that fixed a multi-day bug (highlight it)

---

### V8 — Numbers / dashboard

**For:** Milestone tweets, when you have numbers.

**What to make:**
- A simple line chart of daily signups (use a free tool — no need for fancy analytics)
- A "before / after" comparison of two metrics
- A screenshot of your own database showing real user count (redact emails)

**Tip:** Don't fake it. Empty dashboards posted as "milestones" get punished. Wait until you have something real.

---

### V9 — Settings screen / profile screen

**For:** Product-craft tweets.

**What to screenshot:**
- The full Settings page with sections (Identity / Body / Goal / Activity / Reminders)
- The Reminders section specifically (with the permission row visible)
- The TimePickerField in action — open the iOS modal, screenshot, close

---

### V10 — Onboarding flow

**For:** "Here's the new-user experience" content.

**What to capture:**
- The 6-step onboarding sequence as a 6-frame composite (one screenshot per step, arranged in a 2x3 grid)
- The Done screen with the protein target + calorie target visible
- The "Why this number" reasoning card for a GLP-1 user

---

## Visual hygiene rules

1. **Status bar.** Crop it out unless it's relevant. Cleaner.
2. **Aspect ratio.** Twitter previews 16:9 best for images and videos. Phone screenshots are 9:19.5 — they get letterboxed. Always check the preview before posting.
3. **No watermarks.** Don't add "Built by Shashank" or "LeanScan™" to every screenshot. The app's own UI is the watermark.
4. **One image per tweet, usually.** Two is fine. Three or more dilutes attention.
5. **Caption the visual in the tweet.** "Home screen showing protein ring at 60%" — accessibility AND helps SEO/algorithm understanding.
6. **Compress before uploading.** Twitter recompresses anyway, but a 5MB image upload is slow and crash-prone. Aim for <500KB.

---

## What NOT to post visually

- ❌ Stock photos of "person on phone"
- ❌ Generic illustrations from undraw.co (everyone uses them, signals low effort)
- ❌ Selfies at your desk (unless it's a meaningful moment — milestone, first signup, etc.)
- ❌ Whiteboard scribbles (looks busy, says nothing)
- ❌ Memes you didn't make (use sparingly; one tier-A meme per month max)

---

## Production cadence

Set aside ~30 minutes once a week to capture visuals. Otherwise you'll keep saying "I'll post about that later" and never actually post.

The capture session:
1. Open the app on your phone
2. Walk through the 4-5 key flows once
3. Screenshot each meaningful state
4. AirDrop to your laptop
5. Save in `social-media/visuals/raw/` with descriptive names
6. Crop / annotate as needed in Figma or Pixelmator

Have ~20 visual assets ready at any time, so you never have to think about visuals on the day you're writing a tweet.
