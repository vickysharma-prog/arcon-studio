#!/usr/bin/env bash
# Migrate, build and ship Studio to Vercel production. DATABASE_URL must be the production database.
# The build links routes to the server function with absolute symlinks, which do not survive an upload from
# Windows, so they are replaced with copies first (Vercel stores identical files once).
set -euo pipefail
: "${DATABASE_URL:?set DATABASE_URL to the production database}"
corepack pnpm migrate:production
AGENT_NATIVE_RELEASE_MIGRATIONS=true NITRO_PRESET=vercel AGENT_NATIVE_VERCEL_CRON_SCHEDULE="${AGENT_NATIVE_VERCEL_CRON_SCHEDULE:-0 9 * * *}" corepack pnpm build
cd .vercel/output/functions
for f in *.func; do
  if [ -L "$f" ]; then target=$(readlink "$f"); rm "$f"; cp -r "$(basename "$target")" "$f"; fi
done
cd - >/dev/null
# Run next to the database (Supabase us-west-2): every query from another continent costs a round trip.
REGION="${STUDIO_REGION:-pdx1}" node -e '
const fs = require("fs"), path = require("path"), dir = ".vercel/output/functions";
for (const f of fs.readdirSync(dir)) {
  const file = path.join(dir, f, ".vc-config.json");
  if (!fs.existsSync(file)) continue;
  const c = JSON.parse(fs.readFileSync(file, "utf8"));
  c.regions = [process.env.REGION];
  fs.writeFileSync(file, JSON.stringify(c, null, 2));
}'
npx --yes vercel@latest deploy --prebuilt --prod
