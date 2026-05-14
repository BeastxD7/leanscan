# coding/

LeanScan source code. Phase 0 scaffold in place.

## Status — Phase 0 (Weeks 1-3)

What's scaffolded:
- ✅ Backend (Express + TypeScript) with Docker + docker-compose
- ✅ Postgres migrations: users, auth_sessions, password_reset_tokens, credit_ledger
- ✅ Mobile app (Expo Router + TypeScript) with brand theme
- ✅ Welcome screen on mobile with API health check
- ✅ Placeholder routes for sign-up / sign-in

What's next (still Phase 0):
- ⏳ Real auth endpoints (signup, login, refresh, logout, forgot/reset password)
- ⏳ Profile + onboarding endpoints
- ⏳ Sign-up / sign-in forms wired to the API
- ⏳ Onboarding flow (6 steps)
- ⏳ Gmail SMTP for password reset
- ⏳ Vitest test suite for auth

## Folder layout

```
coding/
├── api/          Express + TypeScript REST API (Docker-ready)
├── app/          React Native via Expo Router (iOS + Android)
├── admin/        AdminJS console (Phase 6)
├── db/           SQL migrations
├── web/          Empty placeholder for future v2 webapp
└── planning/     ✅ approved scope, architecture, phases docs
```

## Run the whole stack locally

Two terminals.

**Terminal 1 — backend:**

```bash
cd coding/api
cp .env.example .env
# fill in: JWT_SECRET (openssl rand -hex 32), GEMINI_API_KEY, GMAIL_USER, GMAIL_APP_PASSWORD
docker compose up
# in another window once containers are healthy:
docker compose exec api npm run migrate
```

API at http://localhost:3000.
MinIO console at http://localhost:9001 (dev / devpassword).

**Terminal 2 — mobile:**

```bash
cd coding/app
cp .env.example .env
# replace 192.168.1.42 in .env with: ipconfig getifaddr en0 (macOS)
npm install
npx expo start
```

Scan QR with Expo Go on your phone (same WiFi as laptop).

See `api/README.md` and `app/README.md` for detail.

## Tech stack (all locked — see `planning/02-architecture.md`)

- Mobile: React Native + Expo SDK 53
- Backend: Express + TypeScript on Node 22, Docker
- DB: Postgres (local docker-compose, Supabase in prod)
- Storage: MinIO local, Supabase Storage in prod
- Auth: Custom JWT + bcrypt (no Supabase Auth)
- AI: Google Gemini 2.0 Flash
- Email: Gmail SMTP via Nodemailer
- Admin: AdminJS embedded in Express (Phase 6)
- Subscriptions: None in V1 — credit-based gating only
- Production host: DigitalOcean Droplet $6/mo (Phase 7)

## Approval gates

| Doc | Status |
|---|---|
| `planning/01-scope.md` | ✅ approved v0.3 |
| `planning/02-architecture.md` | ✅ approved v0.3 |
| `planning/03-phases.md` | ✅ approved v0.1 |
