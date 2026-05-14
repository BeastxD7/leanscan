# LeanScan v1 — Architecture Plan

**Status:** APPROVED v0.3 — all decisions locked.
**Owner:** Shashank
**Last edited:** 2026-05-13
**Approval:** ☐ not yet
**Prerequisite:** `01-scope.md` (approved); will be updated to add F12 (admin console).

---

## 1. Architecture in one sentence

A React Native (Expo) mobile app on iOS + Android talks to an Express REST API server (Dockerised, hostable anywhere) which handles its own JWT auth, gates AI scans by credit balance, talks to Supabase Postgres + Storage for data, calls Gemini for AI vision, and sends emails via Gmail SMTP. A separate admin console (web) lets you manage users, grant credits, and view system stats.

---

## 2. Folder structure (monorepo)

```
LeanScan/coding/
├── app/                    React Native mobile app (Expo)
│   ├── app/                Expo Router routes
│   ├── src/
│   │   ├── components/
│   │   ├── lib/            API client, auth helpers, formatters
│   │   ├── theme/          Colors, typography
│   │   └── types/          Shared types (mirrored from api/)
│   ├── assets/             Icons, splash, fonts
│   ├── app.json
│   ├── package.json
│   └── .env.example
├── api/                    Node + Express + TypeScript REST API
│   ├── src/
│   │   ├── routes/         /v1/meals, /v1/weights, etc.
│   │   ├── routes/admin/   Admin-only endpoints
│   │   ├── services/       Gemini, Supabase, Gmail SMTP clients
│   │   ├── auth/           JWT signing, password hashing, sessions
│   │   ├── credits/        Credit balance, refill, debit logic
│   │   ├── middleware/     auth, role, rate-limit, error handler
│   │   ├── jobs/           Cron-style jobs (weekly report, credit refill)
│   │   ├── types/
│   │   └── server.ts       Express app entry
│   ├── tests/              Vitest unit tests
│   ├── Dockerfile          Hostable on any Docker host
│   ├── docker-compose.yml  Local dev with Postgres + API
│   ├── package.json
│   └── .env.example
├── admin/                  Admin console (see § 13 for which approach we pick)
│   └── README.md
├── db/                     Database schema as code
│   ├── migrations/         SQL files run in order (001_, 002_, ...)
│   ├── seed/               Optional dev seed data
│   └── README.md
├── web/                    Empty placeholder for future user webapp (v2)
│   └── README.md
└── planning/
    ├── 01-scope.md         ✅ approved (with v0.3 update for F12 coming)
    ├── 02-architecture.md  this file
    ├── 03-phases.md        next, after approval
    └── decisions.md        running log of architecture decisions
```

---

## 3. Tech stack

| Layer | Choice | Rationale |
|---|---|---|
| Mobile UI | React Native via Expo SDK 53+ | Single codebase iOS + Android. |
| Mobile routing | Expo Router v4 | File-based routing, deep links. |
| Mobile state | Zustand + TanStack Query | Light client state + server cache. |
| Charting | Victory Native XL | Best-supported RN charts. |
| API framework | **Express on Node 22 LTS + TypeScript** | Battle-tested, huge ecosystem, fine for V1 needs. |
| API hosting | **DigitalOcean Droplet** ($6/mo) running Docker | Locked. Battle-tested, predictable cost, full SSH access. Dockerfile keeps the option to move anywhere later. |
| Database | Supabase Postgres | Free tier (500MB), reliable. Not using Supabase Auth (see below). |
| File storage | Supabase Storage | Free tier 1GB. For meal photos. |
| Auth | **Custom JWT in API server** | Bcrypt-hashed passwords in our own `users` table. Access tokens (15-min) + refresh tokens (30-day) signed by API. No Supabase Auth, no third-party auth provider. |
| AI vision | Google Gemini 2.5 Flash | Cheap, vision-capable, generous free tier. |
| Subscriptions / payment | **None in V1.** Credit-based scan gating only. | Added in v1.1 (Apple IAP + Google Play Billing via RevenueCat for app, Razorpay for future web). |
| Email | **Gmail SMTP via Nodemailer** | Free 500-2000/day per Google account. Sufficient for V1 weekly reports + transactional emails. |
| PDF generation | Puppeteer in API job | HTML → PDF, reuses brand styling. Heavy but works in Docker. |
| Push notifications | Expo Notifications | Bundled, iOS + Android. |
| Analytics | **None in V1.** Add PostHog later when needed. | User opted to skip. Logs only. |
| Error tracking | **None in V1.** Pino logs only. Add Sentry later if pain demands. | User opted to skip. |
| CI/CD | GitHub Actions | Auto-deploy API on push, EAS Build for mobile. |
| Logging | Pino → JSON to stdout (Docker host aggregates) | Free, fast, structured logs. |
| Rate limiting | `express-rate-limit` middleware | Per-IP + per-user limits to protect Gemini quota. |
| Secrets | `.env` files locally, host env vars in prod (Hetzner/Fly/Railway/etc.) | No Vault/Doppler for V1. |
| Admin console | **AdminJS embedded in Express** | Locked. Auto-generated CRUD UI plus custom actions for credit grants. ~10-15 hours. Migrate to custom Next.js later if needed. |

---

## 4. Third-party service inventory (revised — minimal cost)

| Service | Tier | What it does | Monthly cost |
|---|---|---|---|
| Supabase | Free (no Pro upgrade until needed) | Postgres + Storage (no Auth) | $0 |
| API host | Hetzner CX11 (~$4) or Fly.io free tier | Run the Docker container | $0-5 |
| Google Gemini | Free tier (1500 req/day) | Vision API | $0 for MVP |
| Gmail SMTP | Free (500/day) or Workspace (~$6/user/mo, 2000/day) | Send emails | $0 |
| Expo EAS | Free 30 builds/mo | Cloud iOS/Android builds | $0 |
| Apple Developer | $99/year | App Store submission (later) | $8.25 amortised |
| Google Play | $25 one-time | Play Store submission (later) | $2 amortised |
| Plausible analytics for landing | $9/mo (or self-host free) | Landing page analytics only | $9 |
| Domain | leanscan.app ~$15/year | DNS | $1.25 |

**Total monthly recurring: ~$13-20/mo** (host + Plausible).
**First-year one-time: ~$140** (Apple + Play + domain).

---

## 5. Database schema (revised — no Supabase Auth)

Postgres on Supabase. Backend manages auth via its own `users` table. No `auth.users` reference. All FKs point to our `users` table with `ON DELETE CASCADE`.

```sql
-- =========================================================
-- USERS — auth + profile in one table (since we manage auth)
-- =========================================================
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  email_verified_at timestamptz,

  -- Role-based access
  role text not null default 'user' check (role in ('user','admin','super_admin')),
  status text not null default 'active' check (status in ('active','suspended','deleted')),

  -- Profile fields (filled during onboarding)
  display_name text,
  goal text check (goal in ('lose','build','recomp','maintain')),
  height_cm numeric(5,2),
  weight_kg numeric(5,2),
  goal_weight_kg numeric(5,2),
  activity_level text check (activity_level in ('sedentary','light','moderate','active')),
  protein_target_g int,
  units_metric boolean default true,
  dashboard_priority text default 'protein' check (dashboard_priority in ('protein','calories')),

  -- Optional medication info
  medication text check (medication in (
    'none','ozempic','wegovy','mounjaro','zepbound','saxenda',
    'compounded_semaglutide','compounded_tirzepatide','other'
  )) default 'none',
  medication_dose text,
  medication_start_date date,

  -- Credit system (replaces subscription in V1)
  credit_balance int not null default 100,
  credit_last_refilled_at timestamptz default now(),
  is_founder_cohort boolean default false,

  -- Reminder preferences
  reminder_weight_time time default '08:00',
  reminder_meal_nudges boolean default true,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index users_email_idx on users(email);
create index users_role_idx on users(role);

-- =========================================================
-- AUTH_SESSIONS — refresh tokens
-- =========================================================
create table auth_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  refresh_token_hash text not null,           -- store hash, not the token
  expires_at timestamptz not null,
  user_agent text,
  ip_address inet,
  revoked_at timestamptz,
  created_at timestamptz default now(),
  last_used_at timestamptz default now()
);

create index auth_sessions_user_idx on auth_sessions(user_id);
create index auth_sessions_token_idx on auth_sessions(refresh_token_hash);

-- =========================================================
-- PASSWORD_RESET_TOKENS — for "forgot password" flow
-- =========================================================
create table password_reset_tokens (
  token_hash text primary key,
  user_id uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz default now()
);

-- =========================================================
-- CREDIT_LEDGER — every credit change for audit + transparency
-- =========================================================
create table credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  delta int not null,                          -- +10 refill, -1 scan, +50 admin grant, etc.
  balance_after int not null,
  reason text not null check (reason in (
    'initial_grant','daily_refill','photo_scan','admin_grant','referral_bonus','onboarding_bonus'
  )),
  admin_user_id uuid references users(id),     -- if admin granted, who
  notes text,
  created_at timestamptz default now()
);

create index credit_ledger_user_idx on credit_ledger(user_id, created_at desc);

-- =========================================================
-- MEALS
-- =========================================================
create table meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  logged_at timestamptz not null default now(),
  log_date date generated always as ((logged_at at time zone 'UTC')::date) stored,

  meal_name text not null,
  estimated_portion text,
  photo_path text,                             -- Supabase Storage path

  protein_g numeric(6,2) not null default 0,
  calories int,
  carbs_g numeric(6,2),
  fat_g numeric(6,2),

  source text not null default 'photo' check (source in ('photo','manual','quick_add')),
  confidence text check (confidence in ('low','medium','high')),
  ai_notes text,
  raw_ai_response jsonb,

  edited_by_user boolean default false,
  deleted_at timestamptz,
  created_at timestamptz default now()
);

create index meals_user_logged_idx on meals(user_id, logged_at desc);
create index meals_user_date_idx on meals(user_id, log_date);

-- =========================================================
-- WEIGHTS
-- =========================================================
create table weights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  weight_kg numeric(5,2) not null,
  measured_on date not null default current_date,
  notes text,
  created_at timestamptz default now(),
  unique (user_id, measured_on)
);

create index weights_user_date_idx on weights(user_id, measured_on desc);

-- =========================================================
-- SYMPTOMS
-- =========================================================
create table symptoms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  logged_at timestamptz not null default now(),
  log_date date generated always as ((logged_at at time zone 'UTC')::date) stored,
  symptom text not null,
  severity int check (severity between 1 and 5),
  notes text,
  created_at timestamptz default now()
);

create index symptoms_user_logged_idx on symptoms(user_id, logged_at desc);

-- =========================================================
-- WORKOUTS + WORKOUT_SETS
-- =========================================================
create table workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  workout_date date not null default current_date,
  started_at timestamptz default now(),
  finished_at timestamptz,
  notes text,
  created_at timestamptz default now()
);

create table workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references workouts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  exercise_name text not null,
  set_number int not null,
  reps int not null,
  weight_kg numeric(6,2),
  rpe numeric(3,1),
  notes text,
  created_at timestamptz default now()
);

create table user_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  category text default 'strength',
  created_at timestamptz default now(),
  unique (user_id, name)
);

-- =========================================================
-- REPORTS
-- =========================================================
create table reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  pdf_path text,
  summary_json jsonb,
  generated_at timestamptz default now(),
  emailed_at timestamptz,
  unique (user_id, period_start)
);

-- =========================================================
-- ADMIN_AUDIT_LOG — track every admin action
-- =========================================================
create table admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references users(id),
  target_user_id uuid references users(id),
  action text not null check (action in (
    'view_user','grant_credits','suspend_user','reactivate_user','reset_password',
    'change_role','delete_user','toggle_founder_cohort','update_profile','export_data'
  )),
  details jsonb,
  ip_address inet,
  created_at timestamptz default now()
);

create index admin_audit_admin_idx on admin_audit_log(admin_user_id, created_at desc);
create index admin_audit_target_idx on admin_audit_log(target_user_id, created_at desc);
```

**Note on RLS.** Since we're not using Supabase Auth, RLS becomes harder to wire up cleanly. For V1, **RLS is OFF**. The API server is the sole gatekeeper — every query includes `WHERE user_id = $1` and the Supabase service role key never leaves the backend. This is acceptable because no client ever connects directly to Postgres. Trade-off: if the API server is compromised, attacker gets full DB access. Mitigation: keep service-role key in env vars only, never log it, rotate periodically.

---

## 6. Credit system mechanics

| Lifecycle event | Credit change | Reason code |
|---|---|---|
| New user signup | +100 | `initial_grant` |
| Complete onboarding | +20 bonus | `onboarding_bonus` |
| AI photo scan | -1 | `photo_scan` |
| Daily refill (lazy, on next request after 24h since last refill) | +10 (capped at 50 total) | `daily_refill` |
| Admin grants credits manually | +N | `admin_grant` (admin_user_id recorded) |
| Referral signup (future) | +25 | `referral_bonus` |

When user has 0 credits and tries to scan:
- API returns `402 Payment Required` with `{ "error": "out_of_credits", "next_refill_at": "..." }`
- Mobile app shows: "You're out of credits. Refill at midnight UTC, or log this meal manually."
- Manual logging (no AI) is always free, no credits required.

All credit changes are logged in `credit_ledger` for transparency and admin audit.

---

## 7. API surface (revised — no Supabase Auth endpoints)

Base URL: `https://api.leanscan.app/v1`. All routes (except auth + health) require `Authorization: Bearer <access_token>`.

### Auth
| Method | Path | What it does |
|---|---|---|
| POST | `/auth/signup` | email + password → access + refresh tokens, +100 initial credits |
| POST | `/auth/login` | email + password → access + refresh tokens |
| POST | `/auth/refresh` | refresh token → new access token |
| POST | `/auth/logout` | revoke refresh token |
| POST | `/auth/forgot-password` | email → send reset link via Gmail SMTP |
| POST | `/auth/reset-password` | token + new password → reset |
| GET | `/auth/me` | current user info |

### Profile & onboarding
| Method | Path | What it does |
|---|---|---|
| GET | `/profile` | full profile |
| PATCH | `/profile` | update profile (recalc protein target) |
| POST | `/onboarding/complete` | mark onboarding done, +20 credit bonus |

### Meals
| Method | Path | What it does |
|---|---|---|
| GET | `/meals?date=YYYY-MM-DD` | list for a date |
| POST | `/meals/photo` | upload photo, **-1 credit**, return Gemini estimate (not yet saved) |
| POST | `/meals` | save (manual or post-photo) |
| PATCH | `/meals/:id` | edit |
| DELETE | `/meals/:id` | soft-delete |
| GET | `/meals/recent` | last 10 unique meals (for quick re-log) |

### Other features
| Method | Path | What it does |
|---|---|---|
| GET | `/weights?from=&to=` | list |
| POST | `/weights` | upsert today's weight |
| GET | `/symptoms?from=&to=` | list |
| POST | `/symptoms` | log |
| GET | `/workouts?from=&to=` | list |
| POST | `/workouts` | start workout |
| POST | `/workouts/:id/sets` | add set |
| POST | `/workouts/:id/finish` | finish workout |
| GET | `/workouts/last/:exercise` | last performance of an exercise |
| GET | `/reports/weekly` | list past weekly reports |
| GET | `/reports/weekly/latest` | latest summary + PDF URL |
| POST | `/notifications/register` | register Expo push token |
| GET | `/credits` | current balance + ledger |
| GET | `/account/export` | full data export as JSON |
| DELETE | `/account` | delete account + cascade |

### Admin (role `admin` or `super_admin` required; every call logged)
| Method | Path | What it does |
|---|---|---|
| GET | `/admin/users?q=&status=&page=` | list users with search/filter |
| GET | `/admin/users/:id` | full user detail incl. credits + activity counts |
| PATCH | `/admin/users/:id` | edit profile, role, status |
| POST | `/admin/users/:id/credits` | grant N credits with reason |
| POST | `/admin/users/:id/suspend` | suspend account |
| POST | `/admin/users/:id/reactivate` | reactivate |
| POST | `/admin/users/:id/reset-password` | trigger password reset email |
| GET | `/admin/stats` | platform metrics (DAU, signups, scans, errors) |
| GET | `/admin/audit-log` | recent admin actions |

### Public
| Method | Path | What it does |
|---|---|---|
| GET | `/health` | liveness probe |

---

## 8. Auth flow (custom JWT, no Supabase)

### Signup
```
User enters email + password
   ↓
POST /auth/signup { email, password }
   ↓
API:
  1. Validate email format + password strength
  2. Check email not already used
  3. bcrypt.hash(password, 12)
  4. INSERT into users
  5. INSERT into credit_ledger (+100 initial_grant)
  6. Sign access token (15min) + refresh token (30d)
  7. INSERT into auth_sessions (storing hash of refresh token)
  8. (Optional) send welcome email via Gmail SMTP
  9. Return { access_token, refresh_token, user }
```

### Login
```
POST /auth/login { email, password }
   ↓
API:
  1. SELECT user by email
  2. bcrypt.compare(password, password_hash)
  3. If user.status != 'active' → 403
  4. Issue new access + refresh tokens
  5. INSERT into auth_sessions
  6. Return tokens + user
```

### Refresh (transparent to user)
```
Mobile app intercepts 401 on any API call
   ↓
POST /auth/refresh { refresh_token }
   ↓
API:
  1. Hash incoming refresh token
  2. SELECT auth_sessions where hash matches and not revoked and not expired
  3. Issue new access token (refresh stays the same; rotate optionally)
  4. UPDATE auth_sessions.last_used_at
  5. Return new access_token
   ↓
Mobile app retries original request with new access token
```

### JWT structure
- **Access token:** signed HS256 with `JWT_SECRET`. Claims: `{ sub: user_id, role, exp: now+15min, iat }`.
- **Refresh token:** opaque random 256-bit string. Stored hashed in `auth_sessions`.

---

## 9. Admin console — two paths (open decision)

### Path A: AdminJS embedded in Express (Recommended)
- AdminJS is an open-source admin panel generator for Node.js.
- Plugs into Express at `/admin`.
- Auto-generates CRUD UI from Postgres schema.
- Customisable actions (e.g., "Grant 50 credits" button).
- Login screen, role-based access, audit trail (we add our own audit log via hooks).
- **Effort: ~10-15 hours.**
- **Look:** functional, slightly generic. Good enough for solo founder.

### Path B: Custom Next.js admin app in `coding/admin/`
- Separate Next.js app, deployed to Vercel free tier or same Docker host.
- Calls API server's `/admin/*` endpoints.
- Full control over UI/UX with Tailwind + shadcn/ui components.
- **Effort: ~25-40 hours.**
- **Look:** professional, branded, polished. Worth it if you want clients/investors to see it.

**Recommendation:** AdminJS (Path A) for V1. Migrate to custom (Path B) in v1.x if you outgrow it.

---

## 10. Secrets & environment variables

### API server (`coding/api/.env`)
```
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgres://...                  # Supabase connection string
SUPABASE_URL=https://xxxxx.supabase.co       # for Storage SDK only
SUPABASE_SERVICE_ROLE_KEY=eyJ...             # Storage admin

# Auth
JWT_SECRET=...                               # 256-bit random
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
BCRYPT_COST=12

# AI
GEMINI_API_KEY=AIza...

# Email
GMAIL_USER=shashankdevadiga2003@gmail.com
GMAIL_APP_PASSWORD=...                       # generated from Google account
EMAIL_FROM_NAME=LeanScan

# Admin defaults (for bootstrapping)
ADMIN_BOOTSTRAP_EMAIL=shashankdevadiga2003@gmail.com
ADMIN_BOOTSTRAP_PASSWORD=...                 # one-time, change after first login

# Optional
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

### Mobile app (`coding/app/.env`)
```
EXPO_PUBLIC_API_URL=https://api.leanscan.app
```

---

## 11. Local development (default for V1 build)

**Dev workflow is 100% local until phase 7.** Per founder decision (May 13, 2026), all features are built and tested on the developer machine first. Production deployment is the last step.

### Local stack (`coding/api/docker-compose.yml`)

```yaml
# Sketch — full version in repo when we build
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: leanscan
      POSTGRES_PASSWORD: dev
      POSTGRES_DB: leanscan_dev
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: dev
      MINIO_ROOT_PASSWORD: devpassword
    ports: ["9000:9000", "9001:9001"]
    volumes: [miniodata:/data]

  api:
    build: .
    env_file: .env
    ports: ["3000:3000"]
    depends_on: [postgres, minio]
    volumes: ["./src:/app/src"]  # hot reload in dev

volumes:
  pgdata:
  miniodata:
```

### Local commands

```bash
# Spin up everything
cd coding/api && docker compose up

# Run migrations against local Postgres
docker compose exec api npm run migrate

# Mobile dev (separate terminal)
cd coding/app && npx expo start
# Then scan QR with Expo Go on your phone (same WiFi as laptop)
```

### Why MinIO and not direct Supabase Storage in dev?
- MinIO is S3-compatible and runs locally → no internet round-trip on every photo upload.
- The S3 SDK (which Supabase Storage also exposes) works against both. Same code in dev and prod.
- Free, offline-capable, fast iteration.

### Switching to production
At phase 7, we swap two env vars: `DATABASE_URL` → Supabase Postgres, `S3_*` → Supabase Storage credentials. No code changes.

---

## 12. Production deployment (Phase 7)

**Locked: DigitalOcean Droplet, $6/mo (Basic plan, 1 vCPU / 1 GB RAM / 25 GB SSD).**

Done as one chunk during phase 7. Setup checklist (full instructions in `coding/api/DEPLOY.md` when we get there):

1. **Supabase project setup.** Create production project. Run migrations. Create Storage bucket. Note service-role key for backend.
2. **DigitalOcean Droplet.** Create — Ubuntu 24.04 LTS, basic plan, region close to majority of beta users. SSH in, install Docker + Docker Compose, install Caddy.
3. **DNS.** `leanscan.app` A-record → Cloudflare or Vercel (for landing). `api.leanscan.app` A-record → Droplet IP.
4. **Caddy config** — auto-renews Let's Encrypt certs for `api.leanscan.app`. Reverse proxies to localhost:3000.
5. **Firewall** — UFW: allow 80, 443, SSH only.
6. **Deploy.** Clone repo, copy production `.env`, `docker compose up -d` (without the postgres + minio services — these are dev-only; prod uses Supabase).
7. **Smoke test** — `curl https://api.leanscan.app/health` returns 200.
8. **Optional but recommended:** `fail2ban` for SSH brute-force protection, nightly DB backup script via cron.

`Dockerfile` in `coding/api/` is the contract. The same image you ran locally is the one that runs in prod.

If we ever outgrow $6/mo or want HA, the Dockerfile makes Hetzner / Fly / Railway / Kubernetes a low-friction migration.

```dockerfile
# Sketch — full version in repo when we build
FROM node:22-alpine AS base
RUN apk add --no-cache chromium  # for Puppeteer
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci --production

FROM base AS build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM base
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package*.json ./
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

---

## 12. CI/CD

### API
- Push to `main` → GitHub Actions → `npm test` → build Docker image → push to host (Hetzner via SSH, Railway/Fly via their CLI)
- Push to feature branch → preview env (when feasible) or skip

### Mobile
- Push to `main` → GitHub Actions → EAS Build → `.ipa` + `.apk`
- `.apk` uploaded to public URL on `leanscan.app/download/android`
- `.ipa` uploaded to TestFlight manually for now (automate later)

### DB migrations
- Numbered SQL files in `coding/db/migrations/`
- Manual: `psql $DATABASE_URL < db/migrations/00X_*.sql` from your laptop
- For V1 simplicity. Postgres-migrate or Sqitch later if it hurts.

---

## 13. Decisions (all locked)

| # | Decision | Choice |
|---|---|---|
| 1 | Admin console | ✅ AdminJS embedded in Express |
| 2 | API host | ✅ DigitalOcean Droplet ($6/mo) |
| 3 | Domain | ✅ leanscan.app (assumed unless you say otherwise) |
| 4 | GitHub repo | ✅ Private (assumed unless you say otherwise) |
| 5 | Charts (mobile) | ✅ Victory Native XL |
| 6 | State (mobile) | ✅ Zustand + TanStack Query |
| 7 | PDF generation | ✅ Puppeteer in API |
| 8 | Push notifications | ✅ Expo Notifications |
| 9 | Backend framework | ✅ Express + TypeScript on Node 22 |
| 10 | Auth | ✅ Custom JWT, bcrypt, refresh tokens — no Supabase Auth |
| 11 | Email | ✅ Gmail SMTP via Nodemailer |
| 12 | Error tracking | ✅ None in V1 (skip Sentry) |
| 13 | Analytics | ✅ None in V1 (skip PostHog) |
| 14 | Payments | ✅ None in V1 (credit system instead, payments in v1.1) |

If any default in this table needs to change, flag it before approval. Otherwise we lock and move to phases planning.

---

## 14. What we will NOT do in V1

- No Supabase Auth (custom JWT instead — user decision)
- No payment processing (credit system instead — user decision)
- No Sentry / no PostHog (skip until needed — user decision)
- No Resend / no third-party email (Gmail SMTP — user decision)
- No realtime / websockets
- No GraphQL (REST only)
- No microservices (one Express app)
- No Redis cache (Postgres queries with indexes are enough)
- No Kubernetes (Docker on a single VM)
- No event bus (cron in-process)
- No feature flags
- No A/B testing
- No automated migrations pipeline

---

## 15. Risks I want on the record (architecture-specific)

- **Custom auth = more attack surface.** We have to get password hashing, JWT signing, refresh tokens, brute-force protection, and rate limiting right ourselves. Standard libraries help (bcrypt, jsonwebtoken, express-rate-limit) but the responsibility is on us. Mitigation: code-review every auth route extra carefully.
- **No error tracking means slower incident response.** When something breaks in production, we won't know unless a user emails. Acceptable for V1; revisit when we have >50 active users.
- **No analytics means flying blind on usage.** We won't know which features users actually use. Acceptable for V1 because there are no users yet; revisit before public launch.
- **Gmail SMTP rate limits.** 500 emails/day on free Gmail. Once we have >500 weekly-report-receivers, we hit the cap. Mitigation: upgrade to Workspace ($6/mo, 2000/day) when we get there.
- **Credit-based system without payments means no revenue validation in V1.** We won't know if users would pay until v1.1. Building free and converting later is doable but a real strategic risk.
- **Single API server is a SPOF.** Acceptable for MVP. Add HA when uptime matters.
- **Manual TestFlight invites at scale becomes painful.** Manageable for first 100 users; needs automation after.
- **Puppeteer in Docker is heavy.** Image gets to ~250MB with Chromium. Slow to deploy. Alternative: external PDF service if it becomes a problem.

---

## 16. Approval

When you approve, I move to drafting `03-phases.md` (the build phases with milestones, now including F12 admin work).

**Approval status:** ☐ pending Shashank review
