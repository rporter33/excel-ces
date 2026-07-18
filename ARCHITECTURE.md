# Excel CES — Architecture Reference

Last updated: 2026-04-05  
Stack: Next.js 15 App Router · Prisma 6 · Supabase PostgreSQL · Clerk v7 · Tailwind CSS · Vercel

---

## Stack Overview

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 15 (App Router) | Server components by default; `"use client"` only where interactivity required |
| Database | PostgreSQL via Supabase | Pooler (port 6543) for runtime; direct (port 5432 pooler) for migrations |
| ORM | Prisma 6 | `db push` in use (no migrations folder); switch to `migrate` before production scale |
| Auth | Clerk v7 | Hosted sign-in/up; clerkId stored on User; graceful degradation when Clerk not configured |
| Styling | Tailwind CSS | Brand colors: `brand-blue` (#0066CC), `brand-navy` (#001F5B) |
| Deployment | Vercel | Build script: `prisma generate && next build` |
| Testing | Vitest | Unit tests for pricing engine; 8 tests, all passing |

---

## Routing Structure

```
src/app/
  layout.tsx              — Root layout (ClerkProvider, brand fonts)
  error.tsx               — App-level error boundary
  global-error.tsx        — Uncaught error fallback
  page.tsx                — Redirects → /projects
  sign-in/[[...sign-in]]/ — Clerk hosted sign-in
  sign-up/[[...sign-up]]/ — Clerk hosted sign-up
  setup/                  — Post-signup account linking (clerkId → DB User)
  projects/
    page.tsx              — Project list (search, filter by status/PM)
    new/                  — Create project (server page + client form)
    [id]/
      page.tsx            — Project detail
      edit/               — Edit project info
      estimate/           — Estimate builder (client, auto-save)
      measurement/        — Roof measurement entry
      bid/                — Printable bid sheet (server + client PrintButton)
  admin/
    products/             — Product catalog price editor (role-gated)
  settings/               — User settings (markup, profile)
  dev/
    accuracy-test/        — Pricing engine accuracy check (public, dev only)
```

---

## Schema Overview

### Core Models

**User** — Maps to a Clerk identity via `clerkId`. Roles: PROJECT_MANAGER, SENIOR_PM, OFFICE_ADMIN, OPS_MANAGER, SYSTEM_ADMIN. Stores `defaultMarkupPct` (used as default for new estimates). `organizationId` is nullable scaffold for future multi-tenancy.

**Project** — Central record. Has `pmId` (required), `createdById` (optional audit field), `organizationId` (nullable scaffold). Status follows a 15-value enum from LEAD_RECEIVED → CLOSED.

**Measurement** — One-to-one with Project. Stores all roof dimensions; `totalSqFt` and `totalSquares` are computed on save.

**Estimate** — One-to-one with Project. Stores markup settings, cached cash price (`cachedCashPrice`), and optional sale price override. `estimatedById` tracks who last saved. Line items store `unitCost` at save time (price snapshot — catalog changes don't affect historical estimates).

**Product** — The pricing catalog. `unitCost` is live price; historical changes are logged to `ProductPriceHistory`.

**ProductPriceHistory** — Audit log: old/new price, changedById, timestamp. Written by `updateProductPrice()` before every catalog change.

---

## Role Model

| Role | See all projects | Edit catalog | Manage users | Delete projects |
|------|-----------------|--------------|--------------|-----------------|
| PROJECT_MANAGER | No (own only) | No | No | No |
| SENIOR_PM | Yes | No | No | Yes |
| OFFICE_ADMIN | Yes | Yes | No | No |
| OPS_MANAGER | Yes | Yes | Yes | Yes |
| SYSTEM_ADMIN | Yes | Yes | Yes | Yes |

Permission checks live in `src/lib/permissions.ts`. Never inline role strings in actions — always import from there.

---

## Critical Flows

### 1. New user sign-up
1. User signs up via Clerk (`/sign-up`)
2. Clerk redirects to `/setup` (NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL)
3. `/setup` checks if Clerk user's email matches an unlinked DB User
4. User selects their DB record → `claimUserRecord()` links `clerkId` → redirects to `/projects`

### 2. Estimate save
1. User edits line items in `estimate-form.tsx` (client component)
2. Auto-save fires on blur / tab change via `triggerSave()`
3. `saveEstimate()` (server action): upserts Estimate header, deletes + recreates line items, recomputes and caches `cachedCashPrice` via pricing engine
4. If project status is MEASURED, auto-advances to ESTIMATING

### 3. Status change
1. `StatusChanger` component renders current status as badge
2. User opens dropdown → `updateProjectStatus()` called via `useTransition` (optimistic update)
3. Server validates against `VALID_STATUSES` whitelist, updates DB, revalidates project and list paths

### 4. Pricing engine
The core formula (in `src/lib/pricing-engine.ts`):
```
baseEstimate = (rawMat + rawLabor) / (1 - markupPct)
overhead     = min(overheadCap, baseEstimate × overheadPct)
cashPrice    = baseEstimate + materialTax + fuelCharge + overhead + permitCost
```
Tax applies only to raw material cost. Permit cost is a pass-through (not marked up). Validated against 5 real CES workbooks with 0.00 error.

---

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| DATABASE_URL | Yes | Supabase pooler (port 6543) — runtime queries |
| DIRECT_URL | Yes | Supabase pooler direct (port 5432) — Prisma migrations |
| NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY | Yes | Clerk frontend key |
| CLERK_SECRET_KEY | Yes | Clerk server key |
| NEXT_PUBLIC_CLERK_SIGN_IN_URL | Yes | `/sign-in` |
| NEXT_PUBLIC_CLERK_SIGN_UP_URL | Yes | `/sign-up` |
| NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL | Yes | `/projects` |
| NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL | Yes | `/setup` |

Clerk missing → `getCurrentDbUser()` returns null, app runs in unauthenticated dev mode.

---

## Feature Flags

See `src/lib/feature-flags.ts`. Compile-time booleans — flip to `true` when a feature ships:

- `DOCUMENT_GENERATION` — PDF bid sheet email delivery
- `ESTIMATE_DUPLICATION` — Copy estimate to new project
- `MULTI_COMPANY` — Multi-tenant organizationId enforcement
- `PRICE_HISTORY_UI` — Show audit trail in product catalog
- `CREW_SCHEDULING` — Calendar / crew scheduling view

---

## Known Trade-offs

| Decision | Trade-off | When to revisit |
|----------|-----------|-----------------|
| `prisma db push` (no migrations) | Fast iteration; no rollback history | Before any shared staging env or team DB |
| Price snapshot at estimate save | Historical accuracy; catalog changes don't break old estimates | Add explicit "re-price" button if users need to refresh |
| No background jobs | Simple deployment; no queue infra | When document generation ships (PDF rendering is slow) |
| Clerk hosted UI | Fast auth setup; limited brand customization | If brand guidelines require fully custom auth screens |
| `organizationId` nullable scaffold | Zero runtime cost now; easy to enforce later | When MULTI_COMPANY flag is enabled |

---

## Future Expansion Path

**Stage 1 — Stabilize (next 3 months)**
- Switch `prisma db push` → `prisma migrate dev` for migration history
- Add integration tests (real DB, not mocks) for critical estimate/measurement flows
- Implement `requireDbUser()` redirect helper on all authenticated pages
- Add Clerk webhook to auto-create DB User records on sign-up

**Stage 2 — Scale (3–9 months)**
- Enable DOCUMENT_GENERATION: PDF generation via headless Chrome or @react-pdf/renderer
- Enable ESTIMATE_DUPLICATION: copy lineItems + header to new project
- Add crew/job scheduling calendar (FullCalendar or custom)
- Reporting dashboard: jobs per PM, revenue pipeline by status

**Stage 3 — Multi-tenant (9+ months)**
- Enforce `organizationId` on all queries (row-level security in Postgres via Supabase RLS)
- Separate product catalogs per organization
- Admin portal for company setup and user invitation
