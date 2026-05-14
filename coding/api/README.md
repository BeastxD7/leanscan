# LeanScan API

Express + TypeScript + Prisma. Local-first development; production deploy comes in Phase 7.

## Prereqs

- Node 22 LTS (`node --version`)
- Docker Desktop running (`docker --version` and `docker compose version`)

## First-run setup

```bash
cd coding/api

# 1. Configure env
cp .env.example .env
# Edit .env and fill in:
#   - JWT_SECRET           generate with: openssl rand -hex 32
#   - GEMINI_API_KEY       from https://aistudio.google.com/app/apikey
#   - GMAIL_USER           shashankdevadiga2003@gmail.com (your address)
#   - GMAIL_APP_PASSWORD   16-char app password — https://myaccount.google.com/apppasswords
#   - ADMIN_BOOTSTRAP_PASSWORD   something you'll change after first login
#
# Dummy values are OK for first boot — server starts but those features won't work
# until real values are in. Don't ship dummies past local dev.

# 2. Start the stack (Postgres + API)
docker compose up
```

When the containers report healthy (~30 seconds), open a second terminal:

```bash
# 3. Generate + apply the first migration
docker compose exec api npm run migrate:dev -- --name init

# Prisma will:
#   - read prisma/schema.prisma
#   - generate prisma/migrations/<timestamp>_init/migration.sql
#   - apply it to Postgres
#   - regenerate the typed Prisma client
```

## Sanity check

```bash
curl http://localhost:3000/health
# → {"data":{"status":"ok","uptime_s":...,"version":"0.1.0","timestamp":"..."},"error":null}

curl http://localhost:3000/health/ready
# → {"data":{"status":"ready","database":"ok"},"error":null}
```

If `/health/ready` returns 503, the API can't talk to Postgres — usually means migrations haven't run yet, or Postgres isn't healthy yet.

## Useful commands

```bash
# Visual DB browser (Prisma Studio, opens in your browser)
docker compose exec api npm run prisma:studio

# Run tests
docker compose exec api npm test

# Typecheck
docker compose exec api npm run typecheck

# Stop everything
docker compose down

# Stop + wipe DB and uploads (DANGEROUS, dev only)
docker compose down -v
```

## After changing prisma/schema.prisma

```bash
docker compose exec api npm run migrate:dev -- --name describe_what_changed
```

This generates a new SQL migration file and applies it.

## Project layout

```
coding/api/
├── prisma/
│   ├── schema.prisma         Source of truth for the DB schema
│   └── migrations/           Auto-generated SQL migrations (commit these)
├── src/
│   ├── server.ts             Express app entry
│   ├── config.ts             Env loading + validation
│   ├── db.ts                 Prisma client singleton
│   ├── routes/               Route modules (health.ts so far)
│   ├── auth/                 JWT signing, password hashing (next)
│   ├── credits/              Credit balance, refill, debit (next)
│   ├── services/
│   │   └── storage.ts        Local-filesystem photo storage
│   ├── middleware/           Auth, error, rate-limit
│   ├── jobs/                 Cron jobs (Phase 4)
│   └── lib/                  logger, helpers
├── scripts/
│   └── migrate.ts            Stub — deprecated, see Prisma scripts instead
├── tests/                    Vitest tests
├── Dockerfile                Same image runs locally and in prod
├── docker-compose.yml        Local dev stack (Postgres + API)
└── .env.example              Template — copy to .env and fill in
```

## Without Docker (bare-metal local)

```bash
# Install + run Postgres 16 yourself
createdb leanscan_dev

# Install deps (postinstall runs `prisma generate`)
npm ci

# Run migrations
npm run migrate:dev -- --name init

# Run dev server
npm run dev
```

`UPLOADS_DIR` defaults to `/app/uploads` — change it in `.env` to a local path like `./uploads` if running outside Docker.

## Phase 0 status

✅ Health endpoints live
✅ Prisma client + schema for users / auth_sessions / password_reset_tokens / credit_ledger
✅ Local-filesystem storage service ready
✅ Helmet, CORS, Pino logging, structured error responses
✅ Graceful shutdown

⏳ Coming next iteration: auth routes, profile routes, onboarding, Gmail SMTP, rate limiting, Vitest coverage.
