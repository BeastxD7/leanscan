# LeanScan

**Status:** Pre-validation. Day 0 of the 14-day validation sprint (see `leanscan-project-context.md` § 8).
**Owner:** Shashank
**Pitch:** AI camera-based, protein-first calorie tracker for people on GLP-1 medications (Ozempic, Wegovy, Mounjaro, Zepbound).
**Tagline:** Snap your meal. Save your muscle.

---

## Folder map

```
LeanScan/
├── coding/                 App source code (empty until MVP scope is decided)
├── marketing/
│   ├── landing/            Public landing page (deploy target)
│   ├── demos/              Interactive demos used in TikTok / Reddit content
│   ├── tiktok/             Scripts, captions, hashtag plans
│   ├── reddit/             Post drafts, response templates
│   ├── email/              ConvertKit sequences, weekly digests
│   └── social/             X / Instagram build-in-public posts
├── sales/                  Pricing, founder cohort tracking, conversion materials
├── pitchdeck/              Micro-influencer pitches, RD partnership decks
├── research/
│   ├── competitor-reviews/ Review mining workbook + analysis
│   └── user-interviews/    Transcripts and notes (when you start doing them)
├── market/
│   ├── sizing/             TAM/SAM/SOM, GLP-1 growth projections
│   └── competitors/        Competitor feature scans (not review mining)
├── CLAUDE.md               Project instructions for the AI co-pilot
└── leanscan-project-context.md   Master strategy doc — single source of truth
```

Each folder has its own README explaining what belongs there.

---

## Where the validation toolkit lives now

| Asset | Path |
|---|---|
| Landing page (deploy this) | `marketing/landing/index.html` |
| Landing page backup (original draft) | `marketing/landing/leanscan-landing.html` |
| Demo prototype (TikTok prop) | `marketing/demos/demo.html` |
| Review mining workbook | `research/competitor-reviews/review-mining.xlsx` |

---

## Deploy the landing page

```bash
cd marketing/landing
npx vercel
# choose: link to new project → name 'leanscan' → deploy
```

Or drag-and-drop the `marketing/landing/` folder onto vercel.com/new. Before deploying, edit `index.html` and fill in your ConvertKit form ID + your Plausible domain in the `CONFIG` block.

## Run the demo locally

```bash
cd marketing/demos
python3 -m http.server 8000
# open http://localhost:8000/demo.html
```

Uses Google Gemini API. Get a free key at aistudio.google.com/app/apikey.

---

## Current status

- Landing page polished, email capture wired, ready to deploy (needs ConvertKit form ID + Plausible domain).
- Demo prototype working on Gemini 2.0/2.5 Flash. Vision identification is accurate on Western meals, weaker on Indian regional cuisine — that's fine since target persona doesn't eat those.
- Review mining workbook built, 25 seeded complaint patterns + 75 empty rows ready.
- Validation sprint: not started.
- Domain: not registered.
- ConvertKit / Plausible: not signed up.
- MVP build: not started (intentionally — validation comes first).
