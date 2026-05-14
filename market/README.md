# market/

Secondary research — published data, competitor scans, industry analysis.

```
market/
├── sizing/        TAM/SAM/SOM, GLP-1 prescription growth, willingness-to-pay
└── competitors/   Feature scans of MyFitnessPal, Cal AI, Lose It, DietGLP, etc.
```

## sizing/

Holds the numbers that justify the niche. Sources to add over time:

- Statista / Grand View Research reports on GLP-1 market size
- IQVIA prescription data
- Anthem / United Healthcare reports on coverage trends
- Endocrine Society publications on muscle-loss outcomes
- Reddit subreddit member counts as a proxy for total addressable audience
- Apple App Store / Google Play category rankings for "calorie counter"

A single `tam-sam-som.xlsx` summarizing all of these is the goal.

## competitors/

NOT review mining (that's in `../research/competitor-reviews/`). This is feature-level analysis:

- `feature-matrix.xlsx` — every competitor × every feature you might build
- `pricing-comparison.md` — how each prices and what they include
- `marketing-channel-scan.md` — where each competitor acquires users

Goal: stay clear-eyed about who's a real threat. When MyFitnessPal launches a "GLP-1 mode" (and they will), this folder tells you what they're missing that you've built.
