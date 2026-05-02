#!/bin/sh
set -e

SEED_MARKER_FILE="/app/.seeded"

npx prisma migrate deploy

if [ ! -f "$SEED_MARKER_FILE" ]; then
  echo "Running seed for first container startup..."
  npm run db:seed
  touch "$SEED_MARKER_FILE"
else
  echo "Seed already executed for this container. Skipping."
fi

exec node dist/src/main.js
