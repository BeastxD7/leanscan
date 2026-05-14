# LeanScan App

React Native via Expo Router. iOS + Android from one codebase.

## Prereqs

- Node 22 LTS (`node --version`)
- Expo Go app installed on your phone ([App Store](https://apps.apple.com/app/expo-go/id982107779) / [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent))
- Phone and laptop on the **same WiFi network**
- The API running locally (see `../api/README.md`)

## Setup (first time)

```bash
cd coding/app
cp .env.example .env

# Find your laptop's LAN IP:
ipconfig getifaddr en0       # macOS
# or
hostname -I | awk '{print $1}'   # Linux

# Edit .env: replace 192.168.1.42 with the IP you just printed
```

Install deps:

```bash
npm install
```

## Run

```bash
npx expo start
```

You'll see a QR code. Open Expo Go on your phone, scan it. The app loads on your phone.

## What you'll see (Phase 0)

- **Welcome screen** with the LeanScan brand, headline ("Snap your meal. Track your day."), and two buttons (Create Account / Sign In).
- **Footer status pill** that connects to your local API at `http://YOUR-LAN-IP:3000/health` and tells you whether the API is reachable. Green = good. Red = check your `.env` IP, WiFi, and that `docker compose up` is running.
- Tapping either button takes you to a Phase 0 placeholder screen (real forms come next iteration).

## Project layout

```
coding/app/
├── app/                     Expo Router routes (file-based)
│   ├── _layout.tsx          Root: font loading, query provider, status bar
│   ├── index.tsx            Welcome screen
│   ├── (auth)/              Auth flow group
│   │   ├── _layout.tsx
│   │   ├── sign-up.tsx
│   │   └── sign-in.tsx
│   └── onboarding/          (empty — coming next iteration)
├── src/
│   ├── theme/               Brand tokens (colors, typography, spacing)
│   └── lib/
│       └── api.ts           Fetch wrapper for the LeanScan API
├── assets/                  Icons + splash (placeholders for now)
├── app.json                 Expo config
├── package.json
└── .env.example             Template — copy to .env and set EXPO_PUBLIC_API_URL
```

## Common issues

- **"Cannot reach API"** in the footer status pill:
  - Confirm `cd ../api && docker compose ps` shows healthy containers.
  - Confirm your phone is on the same WiFi as your laptop.
  - Confirm `.env` has your laptop's actual LAN IP, not `localhost`.
  - Try `curl http://YOUR-LAN-IP:3000/health` from your laptop — it should return JSON.
- **Fonts look wrong on first load:** the splash screen waits for Fraunces + Manrope to download from Google. First launch can take 5-10s on slow networks.
- **iOS simulator instead of physical phone:** in `.env`, change `EXPO_PUBLIC_API_URL` to `http://localhost:3000`. The simulator shares the host's network.

## Coming next (still Phase 0)

- Sign-up form (real, wired to `/auth/signup`)
- Sign-in form (real, wired to `/auth/login`)
- Forgot password + reset flow
- Onboarding flow (6 steps: goal, body, activity, optional medication, reminders, target reveal)
- Token storage via expo-secure-store
- Zustand auth store + auto-refresh on 401
- Navigation guards (no token → redirect to welcome; no onboarding → redirect to onboarding)
