# LeanScan API — MVP Deploy (Azure VM, plain HTTP)

Fastest path to getting the API live so testers can hit it. No domain, no TLS,
no nginx. Just Docker + a public IP. ~15 min end-to-end.

**Architecture:**

```
mobile app  ──HTTP──►  http://20.244.27.80:3000  ──►  leanscan-api (docker)
                                                          │
                                                          └──►  Supabase Postgres
                                                          └──►  AWS Bedrock
```

> ⚠️ **This is intentionally insecure** — credentials and meal photos travel
> in cleartext. Fine for closed beta / TestFlight feedback. NOT fine for App
> Store production launch. When you're ready to graduate: buy a domain, set
> the port binding back to `127.0.0.1` in `docker-compose.prod.yml`, and use
> the nginx + Let's Encrypt path documented in `deploy/nginx/leanscan.conf`.

---

## 0. Pre-flight

- [ ] **Rotate any secrets** that have touched git / chat / screenshots
      (AWS access keys, Gmail app password, JWT secret).
- [ ] **Set Azure Public IP to Static** — portal → VM → Networking → click
      the public IP → set Assignment: Static. Otherwise it can change and
      break everything.
- [ ] **Open port 3000 in NSG** — portal → VM → Networking → Add inbound:

  | Priority | Port | Protocol | Source | Name |
  |---|---|---|---|---|
  | 1000 | 22 | TCP | Your IP | AllowSSH |
  | 1010 | 3000 | TCP | `*` | AllowAPI |

- [ ] **Fix the `@` in your Supabase DB password** — URL-encode as `%40`,
      OR change the password to one without special characters.

---

## 1. SSH in

From your Mac:

```bash
ssh shashank@20.244.27.80
```

(Use `-i /path/to/key.pem` if you need a key file. Confirm with `whoami` —
should return `shashank`, NOT `Openclaw` or some other host.)

---

## 2. Install Docker

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sudo sh
sudo apt install -y docker-compose-plugin

# Let your user run docker without sudo
sudo usermod -aG docker $USER
exit
```

SSH back in so the docker group takes effect:

```bash
ssh shashank@20.244.27.80
docker --version    # sanity check
```

---

## 3. Get the code

```bash
sudo mkdir -p /opt/leanscan && sudo chown $USER:$USER /opt/leanscan
cd /opt/leanscan
git clone https://github.com/<your-user>/<your-repo>.git .
cd coding/api
```

> No GitHub repo yet? From your laptop:
> `scp -r coding/api shashank@20.244.27.80:/opt/leanscan/coding/`

---

## 4. Create the production `.env`

```bash
nano /opt/leanscan/coding/api/.env
```

Paste this (filling in actual values):

```env
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Supabase — note the URL-encoded password (%40 = @)
DATABASE_URL=postgresql://postgres.czqrggnwiahcuntcumsq:leanscan%40123@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres.czqrggnwiahcuntcumsq:leanscan%40123@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres

UPLOADS_DIR=/app/uploads
UPLOADS_MAX_BYTES=10485760

JWT_SECRET=<generate fresh: openssl rand -hex 32>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
BCRYPT_COST=12

AI_PROVIDER=bedrock
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<ROTATED key>
AWS_SECRET_ACCESS_KEY=<ROTATED secret>
BEDROCK_MODEL_ID=global.anthropic.claude-sonnet-4-6

GMAIL_USER=shashankdevadiga2003@gmail.com
GMAIL_APP_PASSWORD=<your 16-char app password>
EMAIL_FROM_NAME=LeanScan

ADMIN_BOOTSTRAP_EMAIL=shashankdevadiga2003@gmail.com
ADMIN_BOOTSTRAP_PASSWORD=<strong password — NOT "change-me-immediately">

# Mobile app calls from the device — no web origin needed for MVP
CORS_ORIGINS=exp://*,leanscan://

CREDITS_INITIAL_GRANT=100
CREDITS_ONBOARDING_BONUS=20
CREDITS_DAILY_REFILL=10
CREDITS_REFILL_CAP=50
```

Lock it down:

```bash
chmod 600 /opt/leanscan/coding/api/.env
```

---

## 5. Build and start

```bash
cd /opt/leanscan/coding/api
docker compose -f docker-compose.prod.yml up -d --build
```

First build ~3–5 min. Verify:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=50 api

# Local smoke test
curl http://127.0.0.1:3000/health
# → {"status":"ok",...}
```

---

## 6. Run database migrations

```bash
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
```

Verify in Supabase Studio → Table editor — you should see `User`, `Meal`, etc.

---

## 7. Smoke test from your laptop

```bash
curl http://20.244.27.80:3000/health
```

Should return the same JSON. If it hangs / times out: NSG isn't open on port 3000.

---

## 8. Point the mobile app at it

On your laptop, edit `coding/app/.env`:

```env
EXPO_PUBLIC_API_URL=http://20.244.27.80:3000
```

The app reads this at build time via `coding/app/src/lib/api.ts:26`.

`app.json` already has the iOS ATS exception (`NSAllowsArbitraryLoads`) and
Android cleartext flag (`usesCleartextTraffic`) — required because the URL is
plain HTTP, not HTTPS.

Build for testers via EAS:

```bash
cd coding/app
npx eas-cli login
npx eas-cli build:configure
npx eas-cli build --platform ios --profile preview
npx eas-cli build --platform android --profile preview
```

---

## Day-2 operations

### Deploy a new version

```bash
ssh shashank@20.244.27.80
cd /opt/leanscan
git pull
cd coding/api
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
```

### Tail logs

```bash
docker compose -f docker-compose.prod.yml logs -f api
```

### Restart

```bash
docker compose -f docker-compose.prod.yml restart
```

### Backups

Supabase handles Postgres backups (daily, 7-day retention on free tier).
For meal photos:

```bash
docker run --rm -v leanscan_uploads:/data -v $(pwd):/backup alpine \
  tar czf /backup/uploads-$(date +%F).tar.gz -C /data .
```

### Disk pressure

```bash
df -h
docker system prune -af --volumes
```

---

## Graduating to HTTPS + a real domain

When you're ready to ship to the App Store:

1. Buy a domain (e.g. `leanscan.app` on Porkbun ~$15/yr)
2. Add A record: `api.leanscan.app → 20.244.27.80`
3. Open ports 80 + 443 in NSG, close 3000
4. Change port binding in `docker-compose.prod.yml` back to `127.0.0.1:3000:3000`
5. Install nginx + certbot: `sudo apt install -y nginx certbot python3-certbot-nginx`
6. Copy `deploy/nginx/leanscan.conf` to `/etc/nginx/sites-available/`, edit the
   `server_name`, symlink to `sites-enabled/`, `sudo nginx -t && sudo systemctl reload nginx`
7. `sudo certbot --nginx -d api.leanscan.app`
8. Update mobile app: `EXPO_PUBLIC_API_URL=https://api.leanscan.app`
9. Remove `NSAllowsArbitraryLoads` and `usesCleartextTraffic` from `app.json`
10. Rebuild and resubmit

---

## Cost summary (MVP phase)

| Item | Cost |
|---|---|
| Azure B-series VM (2GB) | ~$15/mo (probably free with credits) |
| Supabase Postgres | $0 (free tier) |
| AWS Bedrock (Claude Sonnet 4.6) | ~$0.003/image scan |
| Domain / TLS | $0 (deferred) |

For ~50 testers logging 5 meals/day = 250 scans/day = **~$22/mo** all-in.
