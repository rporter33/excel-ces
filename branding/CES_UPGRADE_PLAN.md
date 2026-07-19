# CES Upgrade Plan — Demo to Production

**Companion to EXCEL_BRAND_GUIDE.md and excel-brand.css · July 2026**

Management liked the demo; this is the path from a clickable mockup to a tool
PMs run jobs on. Work the phases in order; each item is written so it can be
handed to Claude Code nearly verbatim, with acceptance criteria to verify
against. Sizes: S (< half day), M (1–2 days), L (3+ days).

---

## Kickoff prompt (paste into Claude Code)

> This repo contains Excel_CES_Demo.html, a static demo of our estimating app.
> EXCEL_BRAND_GUIDE.md is the authoritative brand system and
> excel-brand.css is the drop-in token stylesheet; read both fully before
> changing anything. Execute Phase 1 of CES_UPGRADE_PLAN.md now: link the
> brand stylesheet and fonts, remove the demo's :root block, and verify every
> acceptance criterion in Phase 1. Do not begin Phase 2 until Phase 1 checks
> pass. Never render internal financial fields (cost, margin, PM split,
> markup, overhead, fuel) on any customer-facing surface; customer documents
> use an allowlist serializer.

---

## Phase 1 — Brand and compliance (P0, do first)

**1.1 Adopt the brand package (S).** Add the Jost + Inter font links to
`<head>`, then `excel-brand.css` last, after the app's own styles (load order
matters; the brand overrides must win specificity ties); delete the demo's
`:root` block so the compatibility layer supplies all variables.
*Accept:* no occurrence of `#ED1132`, `#00137F`, `#B21010`, or `#FBBF2A`
anywhere in computed styles; primary buttons render `#E31E26`; sidebar renders
the `#02205F → #011030` gradient; DM Sans no longer loads.

**1.2 Typography pass (S).** Body/table text to 14px; page headings, card
titles, KPI values, and prices render in Jost; all money and quantity columns
right-aligned with tabular figures; inputs 16px on touch.
*Accept:* no information text below 12.5px; a column of prices aligns digit-for-digit.

**1.3 Logo integration (S, blocked on asset).** Robert exports
`excel-logo.svg` and `excel-logo-white.svg` from `ECO_OnLogo.ai`. Until then,
use the interim wordmark spec (guide §4.2). Never place `IMG_5423.png` on navy;
it is a JPEG with a white background despite the extension.
*Accept:* sidebar and bid header show the white-knockout SVG (or interim
wordmark) with correct clear space.

**1.4 Bid document rebrand and compliance language (M).** Rebuild the bid
template per guide §7: red header rule, tagline, full company block, trust-mark
footer, and placeholder blocks for Colorado SB12-038 requirements (72-hour
rescission notice, deductible statement, scope/costs/dates/contact). Terms
block is market-aware (CO vs WY).
*Accept:* rendered bid contains all §7 elements; compliance placeholders are
clearly marked `[COUNSEL REVIEW]`; ownership sign-off recorded before first
customer use.

**1.5 Customer-data guardrail (M).** Implement the allowlist serializer for
every customer-facing output (guide §9).
*Accept:* a unit test proves the bid payload cannot contain cost, margin,
profit, markup, PM split, overhead, fuel, or benchmark fields even when added
to the project model later.

**1.6 Accessibility floor (M).** Focus-visible rings on every interactive
element; 44px touch targets on mobile; status badges keep text labels; raise
all `--text3` information text to neutral-500+; add `aria-current` to nav,
labels tied to inputs, and semantic buttons instead of clickable divs.
*Accept:* keyboard-only walkthrough reaches every action; axe scan shows no
critical issues.

---

## Phase 2 — Make it real (P1)

The demo is hard-coded HTML; nothing computes. This phase creates the product.

**2.1 App state and persistence (L).** Choose the stack (recommendation:
React + a hosted Postgres/Supabase backend; keeps auth, storage, and realtime
in one service and fits a lean-overhead budget; flag final choice to J. before
committing). Model: Project, Customer, Measurements, EstimateLineItem,
CatalogProduct, Settings, User.
*Accept:* create/edit/reload a project across devices; nothing lives only in
the DOM.

**2.2 Pricing engine (L).** One pure, tested function from measurements +
catalog + settings → line items, totals, margin, and financing. Encode the
current workbook logic: squares from areas, waste factor, pitch/story labor
multipliers, tax, overhead cap, fuel, PM split, markup.
*Accept:* the six benchmark jobs from the dashboard's accuracy table reproduce
expected prices within ±1%; engine has unit tests per rule.

**2.3 Editable measurements with live recalc (M).** Replace read-only fields
with inputs; areas support multiple rows; totals, squares badge, estimate, and
summary panel update on change; autosave with visible "Saved" state.
*Accept:* changing Ridge LF updates the estimate total without a reload;
refresh loses nothing.

**2.4 Catalog CRUD and workbook import (M).** Categories per the demo; add/edit
products with price history; one-time import script seeded from the current
pricing workbook.
*Accept:* Dom can change a shingle price and every open (non-sent) estimate
reflects it; sent bids keep their locked prices.

**2.5 Working search, filters, and sort (S).** Wire the projects search
(name, address, PM, PO, claim #) and status chips; default sort by last
updated.
*Accept:* typing "Hathaway" or "30134" isolates the job in under a second.

**2.6 Real PDF generation (M).** Server-side render of the branded bid to PDF
(Playwright print pipeline is already proven in our other tooling); filename
`ExcelRoofing_Bid_{Customer}_{PO}.pdf`.
*Accept:* pixel-parity with the on-screen bid; passes guardrail 1.5; opens
clean in Adobe and iOS preview.

**2.7 Auth and roles (M).** Sign-in; roles: PM (own projects), Sales Manager
(team), Admin (settings, catalog, dashboard). PM split, margins, and company
settings hidden from PM role if ownership wants pricing opacity; confirm with
J. and Dom.
*Accept:* a PM account cannot view another PM's projects or the settings screen.

---

## Phase 3 — Field and sales workflow (P2)

**3.1 Field mode (M).** The kitchen-table flow on a phone: bottom nav (already
stubbed), oversized inputs, measurement entry ordered the way a roof is walked,
offline-tolerant autosave (localStorage outbox pattern proven in the canvasser
app).
*Accept:* full measure → estimate → bid flow completable one-handed on a
375px screen with airplane mode toggled mid-entry.

**3.2 Good / Better / Best presentation (M).** One-tap comparison of three
shingle tiers (e.g., Duration, Duration Storm, Duration Flex) with monthly
financing per tier; customer-facing view hides everything but price, product,
and warranty.
*Accept:* PM can flip the screen to the homeowner without exposing internal
numbers.

**3.3 Insurance job support (M).** Claim fields, deductible display,
supplement tracking, and an insurance-vs-cash price presentation consistent
with the SB12-038 deductible language.
*Accept:* an Allstate job shows claim metadata and the correct disclosure block
on the bid.

**3.4 E-signature and acceptance (L).** Signature capture on the bid, timestamp,
signed-PDF storage, automatic status flip to Accepted, and notification to the
office (reuse the lead-alert email routing pattern: office@, norma@, dominic@).
*Accept:* signed bid archived and emailed within a minute of signature.

**3.5 Photo capture (M).** Roof/damage photos attached to the project;
compressed upload; optional inclusion page in the bid PDF.
*Accept:* 10 photos attach from a phone on LTE in under a minute.

---

## Phase 4 — Management and integrations (P3)

**4.1 Live dashboard (M).** KPIs, PM performance, and pipeline computed from
real data with month filters; margin thresholds per guide §2.4 (confirm cutoffs
with ownership).
*Accept:* dashboard matches a hand query of the database for the same period.

**4.2 Accuracy benchmark harness (S).** Keep the demo's benchmark idea as a CI
test: known jobs in, expected prices out; fails the build on drift > 1%.
*Accept:* changing a labor rate intentionally breaks the harness until
benchmarks are re-approved.

**4.3 JobNimbus sync (L).** Push accepted projects (customer, address, price,
signed PDF) into JobNimbus; direction and field mapping to be scoped with Dom
before build.
*Accept:* an accepted CES job appears in JobNimbus without re-keying.

**4.4 Audit log (S).** Who changed price-affecting fields, when, old → new.
*Accept:* every settings and catalog change is queryable.

**4.5 Polish (S).** Empty states with Eco, print styles beyond the bid,
keyboard shortcuts for line-item entry, dark-sidebar contrast QA.

---

## Decisions made in this package (flagged, reversible)

1. **Red = `#E31E26`,** not the `#B21010` cited in the request and not the
   demo's `#ED1132`; rationale in guide §2.1. One-token change if overridden.
2. **Jost + Inter replace DM Sans**; Futura PT remains the print face, with a
   one-line upgrade path if an Adobe Fonts kit is added.
3. **Gold retired** from KPIs; amber survives only as semantic warning.
4. **Lead status recolored** from pink to navy tint so red stays action-only.
5. **Backend recommendation** (2.1) framed for lean overhead; final platform
   call deferred to ownership.
6. **PM-role pricing visibility** (2.7) deferred to J. and Dom.

## Open items for Robert

- Export the two logo SVGs from `ECO_OnLogo.ai` (blocks 1.3).
- Counsel review of the SB12-038 contract language (blocks first customer bid).
- Confirm margin color thresholds and PM visibility rules with J. and Dom.
- Send the current pricing workbook for the 2.4 import and 2.2 benchmarks.
