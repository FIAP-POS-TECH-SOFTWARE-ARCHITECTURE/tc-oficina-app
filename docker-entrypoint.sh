#!/bin/sh
set -e

SEED_MARKER_FILE="/app/.seeded"
MAX_MIGRATION_ATTEMPTS=30
MIGRATION_RETRY_DELAY_SECONDS=2

attempt=1
until npx prisma migrate deploy; do
  if [ "$attempt" -ge "$MAX_MIGRATION_ATTEMPTS" ]; then
    echo "Postgres unavailable after $MAX_MIGRATION_ATTEMPTS attempts. Exiting."
    exit 1
  fi

  echo "Postgres not ready yet. Retrying migration in ${MIGRATION_RETRY_DELAY_SECONDS}s (attempt $attempt/$MAX_MIGRATION_ATTEMPTS)..."
  attempt=$((attempt + 1))
  sleep "$MIGRATION_RETRY_DELAY_SECONDS"
done

if [ ! -f "$SEED_MARKER_FILE" ]; then
  echo "Running seed for first container startup..."
  npm run db:seed
  touch "$SEED_MARKER_FILE"
else
  echo "Seed already executed for this container. Skipping."
fi

exec node dist/src/main.js
