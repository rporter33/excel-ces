# Excel CES — Cost Estimating System

A mobile-first PWA replacing Excel Roofing's CES workbook (v2026.2).
Built with Next.js 15, Prisma, PostgreSQL, and Tailwind CSS.

## Quick Start

```bash
npm install
cp .env.example .env        # Edit with your PostgreSQL connection string
npx prisma db push           # Create tables
npx prisma generate          # Generate client
npx tsx prisma/seed.ts       # Seed product catalog from CES 2026.2
npm run dev                  # http://localhost:3000
```

## Sprint 1 Deliverables

- Full database schema (Projects, Measurements, Estimates, Products, Users)
- Product catalog seed (all labor rates + materials from CES 2026.2)
- Pricing engine replacing ~700 workbook formulas
- Project CRUD with search, status filtering, mobile-first forms
- Responsive layout: bottom nav (mobile) + sidebar (desktop)
- PWA manifest for home screen install

## Pricing Engine

| CES Formula | App Equivalent |
|---|---|
| `=(C*D*E)/$G$6` | `rawCost / (1 - markupPct)` |
| `=F184*0.083` | `rawMaterialCost * taxRate` |
| `=MIN(2000,G192*0.1)` | `MIN(overheadCap, base * overheadPct)` |
| `=PMT(7.99%/12,60,G15)` | `pmt(0.0799, 60, financedAmount)` |
| `=ROUNDDOWN(K4,0)*1.02` | `Math.floor(squares) * 1.02` |
