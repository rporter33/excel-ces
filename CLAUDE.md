# Excel CES — Claude Code notes

Before making changes, read all files in ./lessons/

Mobile-first roofing estimation app for Excel Roofing. Next.js 15 (App Router,
src/ layout), Prisma 6 + Supabase Postgres, Clerk auth, vitest.

## Commands

- `npm run dev` — dev server (localhost:3000)
- `npx vitest run` — pricing test suite (8 tests, must always pass)
- `npx prisma migrate dev --name <desc>` — schema changes (never `db push`; see lessons/04)
- `npx vercel --prod` — production deploy

## Non-negotiables

- Prisma CLI reads `.env`, not `.env.local` (lessons/01)
- Middleware lives at `src/middleware.ts` only (lessons/02)
- Pricing accuracy is validated against real CES workbook jobs at
  `/dev/accuracy-test` and in `src/lib/__tests__/pricing-engine.test.ts` (lessons/07)
- Secrets never in chat or commits; rotate immediately on leak (lessons/05)
- Disaster recovery: `scripts/recover-v3.js` + lessons/10
