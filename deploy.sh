#!/usr/bin/env bash
# deploy.sh — One-shot Supabase + Vercel deployment for Excel CES
# Usage: bash deploy.sh
# Prerequisites:
#   1. You have a Supabase project created at supabase.com
#   2. You've run: vercel login

set -e

echo ""
echo "=== Excel CES — Deploy to Supabase + Vercel ==="
echo ""

# ── Step 1: Collect Supabase credentials ────────────────────────────────────

echo "You need two URLs from your Supabase project."
echo "Go to: supabase.com → your project → Settings → Database → Connection string"
echo ""
echo "Paste the TRANSACTION POOLER url (port 6543, used by the app at runtime):"
read -r DATABASE_URL

echo ""
echo "Paste the SESSION MODE / DIRECT url (port 5432, used by Prisma migrations):"
read -r DIRECT_URL

echo ""
echo "Got it. Validating connection..."

# ── Step 2: Write local .env ─────────────────────────────────────────────────

cat > .env <<EOF
DATABASE_URL="${DATABASE_URL}"
DIRECT_URL="${DIRECT_URL}"
EOF

echo "✓ .env written"

# ── Step 3: Run migrations against Supabase ──────────────────────────────────

echo ""
echo "Running Prisma migrations..."
npx prisma migrate deploy
echo "✓ Migrations applied"

# ── Step 4: Seed the database ────────────────────────────────────────────────

echo ""
echo "Seeding database (products, users)..."
npx prisma db seed
echo "✓ Database seeded"

# ── Step 5: Deploy to Vercel with env vars ───────────────────────────────────

echo ""
echo "Deploying to Vercel..."

# Set env vars on Vercel (all environments)
echo "$DATABASE_URL" | vercel env add DATABASE_URL production --force 2>/dev/null || \
  vercel env add DATABASE_URL production <<< "$DATABASE_URL"

echo "$DIRECT_URL" | vercel env add DIRECT_URL production --force 2>/dev/null || \
  vercel env add DIRECT_URL production <<< "$DIRECT_URL"

# Deploy
vercel --prod --yes

echo ""
echo "=== Done! ==="
echo "Your app is live. Check the URL above."
echo "Share /dev/accuracy-test with anyone to verify the pricing engine."
