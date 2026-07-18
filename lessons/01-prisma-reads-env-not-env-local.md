# Prisma CLI reads .env, not .env.local — always copy or symlink

**Type:** correction

`npx prisma db push` failed with "Environment variable not found: DATABASE_URL"
even though .env.local was correctly filled in. Next.js reads .env.local;
Prisma CLI does not. Fix: keep DATABASE_URL and DIRECT_URL in a plain `.env`
(or run `copy .env.local .env` after edits). Cost roughly an hour of debugging
on first setup.
