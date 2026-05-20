# LeanScan — Website

Marketing site + waitlist landing page. Built with Next.js 16 (App Router),
Tailwind v4, and the brand system from `leanscan-project-context.md`.

## Quick start

```bash
npm install
npm run dev
# → http://localhost:3000
```

## What's inside

### SEO assets (production-ready)

| File | What it produces |
|---|---|
| `app/layout.tsx` | Full metadata (OG, Twitter, robots, canonical, JSON-LD Organization + WebSite) |
| `app/page.tsx` | JSON-LD `SoftwareApplication` schema for the product |
| `app/robots.ts` | `/robots.txt` generator |
| `app/sitemap.ts` | `/sitemap.xml` generator |
| `app/manifest.ts` | `/manifest.webmanifest` for PWA installability |
| `app/opengraph-image.tsx` | Dynamic 1200×630 OG image for social shares |
| `app/twitter-image.tsx` | Twitter card (reuses OG) |
| `app/icon.tsx` | Generated 32×32 favicon |
| `app/apple-icon.tsx` | Generated 180×180 apple-touch-icon |
| `app/not-found.tsx` | Branded 404 |
| `app/privacy/page.tsx` | Plain-English privacy policy |
| `app/terms/page.tsx` | Plain-English terms of service |

### Pages

- `/` — landing page with hero, features, how-it-works, founder cohort CTA
- `/privacy` — privacy policy (template, get legal review before public launch)
- `/terms` — terms of service (template, get legal review before public launch)
- `/api/subscribe` — POST endpoint for waitlist email capture

### Components & lib

- `app/components/EmailForm.tsx` — client component with light/dark variants
- `lib/site.ts` — single source of truth for site metadata (name, URL,
  description, keywords, social handles)

## Configuration

Set `NEXT_PUBLIC_SITE_URL` to the deployed origin. Used for canonical URLs,
OG image absolute paths, sitemap entries, robots.txt host, and JSON-LD.

```bash
cp .env.example .env.local
# edit .env.local
```

## Important — local file storage won't work on Vercel

The current `/api/subscribe` route writes to `data/subscribers.json`. That
works in `npm run dev` but **fails on Vercel** (read-only filesystem). Before
deploying, swap the storage in `app/api/subscribe/route.ts` for:

- **Supabase** — a `leads` table with insert-only RLS (LeanScan already uses
  Supabase for the API — lowest-friction option)
- **Resend audiences** — free tier, integrates with transactional sends
- **Buttondown / ConvertKit / MailerLite** — purpose-built newsletter services

`/data` is gitignored, so test emails are never committed.

## Deploy

### Vercel (easiest)

1. Push to GitHub (this is already done in the LeanScan repo).
2. Vercel → New Project → Import the `LeanScan` repo.
3. **Root Directory:** `coding/website`
4. **Framework Preset:** Next.js
5. **Env vars:** `NEXT_PUBLIC_SITE_URL=https://your-domain.com`
6. Deploy. Free tier covers the landing site comfortably.

Add a custom domain in Vercel → Settings → Domains.

### Other hosts

Anything that supports Next.js 16 works. Standard build:

```bash
npm run build
npm run start
```

## Customizing the brand

Brand tokens are in `app/globals.css` under `@theme inline` and mirrored in
`lib/site.ts` for usage outside CSS (OG images, JSON-LD, etc.).

| Token | Value | Where it's used |
|---|---|---|
| `forest` | `#1a3a2e` | Primary text, dark CTA |
| `forest-deep` | `#112720` | Hover state |
| `cream` | `#f5f1ea` | Page background |
| `paper` | `#faf7f0` | Card / mock background |
| `amber` | `#c8975b` | Accent, italic emphasis |
| `Fraunces` | serif | Headlines |
| `Manrope` | sans | Body |

## SEO checklist before public launch

- [ ] Set `NEXT_PUBLIC_SITE_URL` to the real production domain
- [ ] Update Twitter handle in `lib/site.ts` if it changes
- [ ] Add real social URLs in `app/layout.tsx` JSON-LD `sameAs` array
- [ ] Have privacy + terms reviewed by counsel for your jurisdiction
- [ ] Wire `/api/subscribe` to Supabase (or chosen email provider)
- [ ] Add analytics (`@vercel/analytics` or Plausible)
- [ ] Test OG image at https://www.opengraph.xyz/ or by pasting your URL
      into LinkedIn / X share preview
- [ ] Submit sitemap to Google Search Console once domain is live
- [ ] Run Lighthouse audit (`npm run build && npm run start`, then test)
- [ ] Pre-register social handles (@leanscan_app on X, TikTok, IG)
