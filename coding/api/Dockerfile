# Multi-stage Dockerfile for LeanScan API.
# Same image runs locally (via docker-compose) and in production.
#
# Base: node:24.14.0-bookworm-slim (Debian, not Alpine).
#
# Why Debian instead of Alpine: Sharp's prebuilt libvips for musl (Alpine)
# does NOT include HEIC support. iOS photos default to HEIC since iOS 11,
# so every iPhone meal photo upload 500'd. Debian's prebuilt libvips
# bundles libheif and "just works" for HEIC, JPEG, PNG, WebP, AVIF.
# The image is ~50MB larger than Alpine but it's the right trade.

# ----- Build stage -----
FROM node:24.14.0-bookworm-slim AS build
WORKDIR /app

# openssl is required by Prisma's query engine.
RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

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
FROM node:24.14.0-bookworm-slim
WORKDIR /app

# Prisma needs openssl at runtime. wget for the healthcheck.
RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl ca-certificates wget && \
    rm -rf /var/lib/apt/lists/*

# Non-root user
RUN groupadd --system app && useradd --system --gid app --shell /bin/bash app

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
