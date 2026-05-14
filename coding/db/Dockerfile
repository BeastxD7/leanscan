# LeanScan Postgres
# Extends the official Postgres 16 Alpine image with our credentials baked in.
#
# Build:  docker build -t leanscan-postgres .
# Run:    docker run -d -p 54320:5432 -v leanscan_pgdata:/var/lib/postgresql/data leanscan-postgres
# Easier: docker compose up -d  (uses docker-compose.yml in this folder)

FROM postgres:16-alpine

# Credentials — match coding/api/.env DATABASE_URL
ENV POSTGRES_USER=leanscan
ENV POSTGRES_PASSWORD=dev
ENV POSTGRES_DB=leanscan_dev

# Tweak for dev — log slow queries (>100ms) for visibility during development
ENV POSTGRES_INITDB_ARGS="--encoding=UTF-8 --lc-collate=C --lc-ctype=C"

# Optional: any *.sql / *.sh files copied here run on first init.
# COPY ./init/*.sql /docker-entrypoint-initdb.d/

EXPOSE 5432

# Healthcheck baked into the image so external orchestrators don't need to repeat it.
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD pg_isready -U leanscan -d leanscan_dev || exit 1
