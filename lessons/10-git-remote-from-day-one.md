# The only copy of the source must never live in one folder — git remote from day one

**Type:** correction

The entire codebase existed only in a local Downloads folder; losing the
machine meant losing the project. Recovery was possible only because Vercel
CLI deployments retain the uploaded source tree. What the July 2026 recovery
taught:

- The Vercel CLI cannot download deployment source, but the REST API can
  (`/v6/deployments/:id/files`). `scripts/recover-v3.js` does it: set
  `$env:SCOPE_SLUG` and `$env:PROJECT` from the dashboard URL; auth comes from
  `$env:VERCEL_TOKEN` or the CLI's stored login.
- `vercel env pull` defaults to the *development* environment. Our vars lived
  only in Production — pull with `--environment=production` or you get an
  empty file.
- The deployment bundle included `.env`, so deploy artifacts carry secrets.
  Anyone with account access has the credentials → rotate everything
  (DB password, Clerk keys, webhook secret) after any recovery or compromise.
- Supabase free tier auto-pauses after ~a week idle. Pooler error
  "Tenant or user not found" means paused project, not bad credentials —
  restore it from the Supabase dashboard first, then debug.

- CLI deploys upload the working directory *including `.env`* unless
  `.vercelignore` excludes it — that is exactly how secrets ended up inside
  deployment bundles. `.vercelignore` now excludes all env files; keep it.
- Vercel "Sensitive" env vars are write-only: `vercel env pull` emits the
  literal string `[SENSITIVE]` and will clobber a working `.env`. Never
  blind-pull over a good `.env`; keep sensitive values (DB password, webhook
  secret) in the password manager and restore them locally by hand.
- Rotation paste traps that cost an hour: Supabase "Direct connection"
  (`db.<ref>...`) is IPv6-only — the app needs the *Transaction pooler*
  (`:6543` + `?pgbouncer=true`) and migrations the *Session pooler* (`:5432`);
  stray trailing newlines in dashboard paste fields break the database name.

Permanent fix: private GitHub remote, push every session. A deploy platform
is an accidental backup, not a source of truth.
