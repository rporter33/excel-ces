# Branding package — integration status

Source: `Excel Branding Package.zip` (v1.0, 2026-07-18). This folder is the
**design source of truth**. It is *reference material*, not yet wired into the
running app — adopting it is a deliberate task, so that landing the package does
not change any live build.

## What's here

| File | What it is |
|---|---|
| `EXCEL_BRAND_GUIDE.md` | Authoritative brand system: colors, type, logo, voice, components, compliance. |
| `excel-brand.css` | Drop-in token stylesheet + component classes. **Written for the standalone demo, not this app** (see below). |
| `CES_UPGRADE_PLAN.md` | The package author's demo→production plan. Reads against the demo; overlaps our own roadmap. |
| `Excel_CES_Demo_Branded.html` | Branded visual mockup — **kept OUTSIDE this repo** at `../excel-ces-recovery/` because it embeds real customer PII (names, addresses, phones, emails, insurance claim numbers). `branding/*.html` is git-ignored as a backstop. Never commit or screenshot. |
| `../src/lib/brand.ts` | Canonical tokens as framework-agnostic TS constants — the machine-consumable source that will feed Tailwind and the PDF. Currently imported by nothing. |

## Important: the package targets the demo, not this app

The package was authored from `Excel_CES_Demo.html`, a static HTML/CSS mockup —
it predates (or was unaware of) the recovered Next.js + Tailwind app. Practical
consequences:

- **`excel-brand.css` will not restyle this app as-is.** It remaps plain CSS
  variables (`--red`, `--navy`) and targets demo class names (`.btn-primary`,
  `.sidebar`, `.status-badge`). This app uses Tailwind utilities and
  `tailwind.config.js` tokens, so those overrides have nothing to attach to.
- `CES_UPGRADE_PLAN.md` Phase 2 ("make it real — the demo is hard-coded HTML;
  nothing computes") describes building the product that **already exists**.
  Treat its Phase 1 (brand + compliance) and the customer-data guardrail as the
  useful parts; the rest is largely already done in the recovered app.

## What actually changes when we wire this in (Phase 3)

Every current brand hex changes — decide before applying:

| Token | App today | Brand package |
|---|---|---|
| Navy | `#1E2A4A` (tailwind) / `#1E3A5F` (PDF) | **`#02205F`** |
| Red | `#DC2626` | **`#E31E26`** (note: not `#B21010`; see guide §2.1) |
| Gold | `#F59E0B` | **retired** (amber = semantic warning only) |
| UI font | "Inter" declared, never loaded (renders system-ui) | **Jost** (display) + **Inter** (body), via `next/font` |

Planned wiring (Phase 3, deliberate, not done here):
1. Point `tailwind.config.js` at `src/lib/brand.ts` values (or mirror them).
2. Load Jost + Inter via `next/font`; wire the CSS variable into Tailwind's font family.
3. Replace the copy-pasted "ER" divs with one `<Logo/>` component.
4. Rebrand the bid PDF from `src/lib/brand.ts` + add Colorado SB12-038 compliance blocks.
5. Add the customer-facing allowlist serializer (guide §9 / `CUSTOMER_HIDDEN_FIELDS`).

## Blocked on Robert (from the package's own open items)

- Export `excel-logo.svg` + `excel-logo-white.svg` from `ECO_OnLogo.ai` (blocks logo work).
- Counsel review of the SB12-038 contract language (blocks first customer bid).
- Confirm margin color thresholds + PM pricing-visibility rules with J. and Dom.
- Send the current pricing workbook (for catalog import + benchmarks).
