#!/usr/bin/env bash
# deploy.sh — safe production deploy for Excel CES.
#
# CHANGED (Phase 0 hardening): this script no longer writes/overwrites .env and
# no longer reseeds the database. The old version did `cat > .env` (which wiped
# the Clerk keys and webhook secret) and ran `prisma db seed` against production
# on every deploy — both were data-loss footguns. Environment variables now live
# in the Vercel project settings; pull them locally with:
#   npx vercel env pull .env --environment=production
#
# Preferred long-term path: connect the Vercel project to the GitHub repo so a
# push to main deploys automatically. This script is the manual fallback.

set -euo pipefail

echo ""
echo "=== Excel CES — production deploy ==="
echo ""

# 1. Apply any pending migrations to the database in .env (DIRECT_URL).
#    migrate deploy only applies existing migrations; it never resets data.
echo "Applying migrations (prisma migrate deploy)..."
npx prisma migrate deploy
echo "✓ Migrations applied"

# 2. Deploy to Vercel production. Env vars come from the Vercel project, not .env.
echo ""
echo "Deploying to Vercel..."
npx vercel --prod --yes

echo ""
echo "=== Done ==="
echo "Env vars are managed in the Vercel dashboard. This script does not touch"
echo ".env or seed the database. To (re)seed intentionally: npm run db:seed."
