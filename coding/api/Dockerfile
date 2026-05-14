# Multi-stage Dockerfile for LeanScan API.
# Same image runs locally (via docker-compose) and in production (DigitalOcean).

# ----- Build stage -----
FROM node:22-alpine AS build
WORKDIR /app

# openssl is required by Prisma's query engine.
# (bcryptjs is pure JS so no python/compiler needed anymore.)
RUN apk add --no-cache openssl

COPY package.json ./
# Skip the lockfile inside the container — npm chokes on the dev-only
# cross-platform native binaries (esbuild/vitest) that have no version
# field on your install platform. Fresh resolve from package.json works.
RUN npm install --ignore-scripts --no-audit --no-fund

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ----- Production stage -----
FROM node:22-alpine
WORKDIR /app

# Prisma needs openssl at runtime.
RUN apk add --no-cache openssl wget

# Puppeteer / Chromium will be added in Phase 4 (weekly PDF). Sketch below.
# RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont
# ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Non-root user
RUN addgroup -S app && adduser -S app -G app

COPY package.json ./
# Same fresh-resolve approach as the build stage.
# --ignore-scripts skips prisma generate (we copy the generated client from the build stage below).
RUN npm install --omit=dev --ignore-scripts --no-audit --no-fund && npm cache clean --force

COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=build /app/dist ./dist
COPY prisma ./prisma

# Create uploads dir owned by the app user.
RUN mkdir -p /app/uploads && chown -R app:app /app/uploads

USER app
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]
