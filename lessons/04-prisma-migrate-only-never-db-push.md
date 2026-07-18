# Schema changes go through prisma migrate — db push is banned

**Type:** confirmed approach

Early setup used `prisma db push`. It succeeds silently, leaves no migration
history, and at one point the app hit "table public.projects does not exist"
with no record of what had been applied. Baseline was later captured with
`prisma migrate dev --name baseline`. Every schema change since:
`npx prisma migrate dev --name <description>`. db push in production risks
unrecoverable data loss because there is no rollback trail.
