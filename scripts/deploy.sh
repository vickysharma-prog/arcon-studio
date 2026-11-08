#!/usr/bin/env bash
# Migrate, build and ship Studio to Vercel production. DATABASE_URL must be the production database.
# The build links routes to the server function with absolute symlinks, which do not survive an upload from
# Windows, so they are replaced with copies first (Vercel stores identical files once).
set -euo pipefail
: "${DATABASE_URL:?set DATABASE_URL to the production database}"
corepack pnpm migrate:production
NITRO_PRESET=vercel AGENT_NATIVE_VERCEL_CRON_SCHEDULE="${AGENT_NATIVE_VERCEL_CRON_SCHEDULE:-0 9 * * *}" corepack pnpm build
cd .vercel/output/functions
for f in *.func; do
  if [ -L "$f" ]; then target=$(readlink "$f"); rm "$f"; cp -r "$(basename "$target")" "$f"; fi
done
cd - >/dev/null
npx --yes vercel@latest deploy --prebuilt --prod
