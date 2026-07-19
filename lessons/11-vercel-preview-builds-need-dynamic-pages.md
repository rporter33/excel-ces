# Vercel Preview builds have no Production env vars — auth/DB pages must be force-dynamic

**Type:** correction

After git-connecting the repo to Vercel, a Preview deploy of a branch failed
`next build` while prerendering `/projects/new`: it is a static page that calls
`getUsers()` → Prisma at build time, and Vercel **Preview** deployments do not
receive **Production-scoped** environment variables, so `DATABASE_URL` was
absent and the build-time query threw `Environment variable not found:
DATABASE_URL`. The original Production build only succeeded because Production
env had the var.

Fix: any per-user, auth-gated page that reads the database must render at
request time, never be prerendered. Add `export const dynamic = "force-dynamic"`
to the page. `/projects/new` was the only offender — every other data page is
already dynamic because it calls `auth()`/`requireDbUser()` (which read headers)
or is a `[id]` dynamic route. Verify with `next build`: the route must show
`ƒ (Dynamic)`, not `○ (Static)`. Prerendering an authenticated page also bakes a
build-time-frozen copy of per-user data, so this is a correctness win, not just
a build fix.

Two related consequences of git-connected Vercel:
- Merging to `main` now **auto-deploys to production**. Test on a preview (or a
  quiet-hour prod check) before merging anything that touches auth.
- Preview deploys will now *build*, but their DB/Clerk pages error at *runtime*
  until env vars are also scoped to Preview — and doing that points previews at
  the production database. Prefer a separate staging Supabase project for
  Preview over sharing prod data.
