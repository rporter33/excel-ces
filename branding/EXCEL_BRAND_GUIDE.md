# Excel Roofing — Brand System for CES (Complete Estimating System)

**Version 1.0 · July 2026 · Owner: Robert Porter, robert@excelroofing.com**

This is the source of truth for how the CES web app looks, reads, and behaves.
It is written for Claude Code. Drop this file and `excel-brand.css` into the repo
root and add one line to `CLAUDE.md`:

```
Read EXCEL_BRAND_GUIDE.md before touching any UI, copy, or customer-facing output. It is authoritative.
```

---

## 1. Brand snapshot

| Fact | Value |
|---|---|
| Company | Excel Roofing, Inc. — family-owned since 1993 |
| HQ | 4510 S Federal Blvd, Englewood, CO 80110 |
| Phone / web | 303-761-6400 · excelroofing.com |
| Markets | Denver Metro · Colorado Springs · Casper, WY · Sheridan, WY |
| Tagline | "You Don't Pay a Cent Until You're Content." |
| Trust marks | Owens Corning Platinum Preferred · BBB A+ · 4.9 Google (55,000+ customers) |
| Mascot | Eco the frog (internal delight moments only; see §6) |

The product personality: **a sharp foreman's clipboard, not a startup dashboard.**
Confident, numerate, zero fluff. Navy carries the structure; red is spent only on
action; everything else stays quiet so the numbers read fast.

---

## 2. Color system

### 2.1 Canonical brand values

| Color | HEX | RGB | CMYK (print) |
|---|---|---|---|
| **Excel Navy** | `#02205F` | 2, 32, 95 | C100 M87 Y0 K2 |
| **Excel Red** | `#E31E26` | 227, 30, 38 | C4 M100 Y100 K1 |
| **Ink (swoosh accent)** | `#011030` | 1, 16, 48 | C100 M85 Y0 K50 (navy + 50% black) |

> **Correction flag — read before implementing.** The request cited red `#B21010`.
> Per the corrected brand standard established during the business-card rebuild,
> `#B21010` was an error in older templates; the canonical red is **`#E31E26`**.
> This package uses `#E31E26` everywhere. If ownership has since re-standardized
> on `#B21010`, change one token (`--excel-red-500`) and the hover/active shades
> in `excel-brand.css`; nothing else needs to move.
>
> **The demo matches neither value.** `Excel_CES_Demo.html` shipped with
> `--red:#ED1132` and `--navy:#00137F`; both are off-brand approximations and
> must be replaced. The compatibility layer in `excel-brand.css` fixes every
> instance in one step.

### 2.2 Token ramps

Full scales live in `excel-brand.css`. Anchor points:

**Navy** (structure, text, chrome)
`50 #F2F4F8 · 100 #E6E9F1 · 200 #C0C8DB · 300 #8D9BBB · 400 #5B6E9A · 500 #2F4880 · 600 #02205F (brand) · 700 #021A4D · 800 #01153E · 900 #011030 (ink)`

**Red** (action only)
`50 #FDEEEF · 100 #FADADC · 300 #EE7B82 · 500 #E31E26 (brand) · 600 #C4161D (hover) · 700 #A01218 (active)`

**Neutrals** (cool gray, slight navy cast)
`0 #FFFFFF · 50 #F4F6FA (app bg) · 100 #ECEEF5 · 200 #DFE3EC · 300 #C6CCDA · 400 #98A1B3 · 500 #6B7488 · 600 #4B5568 · 900 #1A2038 (primary text)`

### 2.3 Usage rules

1. **Navy is structure.** Sidebar, section headers, price panels, table emphasis,
   primary text accents. Sidebar runs a subtle gradient navy-600 → navy-900 (the
   ink/swoosh value) top to bottom.
2. **Red is action, and only action.** Primary buttons, the active nav item, the
   active tab underline, destructive confirms, the bid header rule. Red should
   never exceed roughly 10% of any screen. Red is not a status color, not a KPI
   color, not a decoration.
3. **Gold is retired.** The demo's `#FBBF2A` "gold" is off-brand. Amber survives
   only as a *semantic warning* pair (`#FEF3C7` bg / `#92400E` text). Pipeline
   Value and other KPIs use navy, not gold.
4. **White space is the third brand color.** Cards on `neutral-50`, generous
   padding, one accent per component.

### 2.4 Semantic and status colors

Status hues are functional (fast scanning), not brand expression. All pairs pass
WCAG AA on their backgrounds.

| Status | Background | Text | Note |
|---|---|---|---|
| Lead | `#E6E9F1` (navy-100) | `#02205F` | On-brand "new"; replaces the demo's pink, which read as an alert |
| Measuring | `#DBEAFE` | `#1D4ED8` | |
| Estimating | `#F3E8FF` | `#6D28D9` | |
| Bid Sent | `#FEF3C7` | `#92400E` | |
| Accepted | `#DCFCE7` | `#15803D` | |
| Closed | `#F1F5F9` | `#475569` | |

Semantic: success `#15803D`, warning `#92400E`/`#FEF3C7`, danger = brand red,
info = navy tints. Margin thresholds on dashboards: ≥30% success green,
25–29% warning amber, <25% danger red (confirm cutoffs with Dom/J. before wiring).

### 2.5 Contrast reference (verified)

| Pair | Ratio | Verdict |
|---|---|---|
| White on Navy `#02205F` | 15.3:1 | AAA; use freely |
| Navy on White | 15.3:1 | AAA; default text accent |
| White on Red `#E31E26` | 4.7:1 | AA at button sizes (≥13px, weight ≥500); do not use for long body text |
| Red on White | 4.7:1 | AA; fine for accents, not for small light-weight text |
| Neutral-600 `#4B5568` on White | 7.6:1 | AA/AAA; secondary text |
| Neutral-400 `#98A1B3` on White | 2.9:1 | Fails AA; decorative/disabled only, never for information |

The demo uses `--text3 #9CA3AF` for real information (timestamps, PO numbers,
insurance claim numbers). Bump those to neutral-500 or darker.

---

## 3. Typography

### 3.1 The decision

The brand typeface is **Futura PT Book** (used on business cards and print).
Futura PT requires an Adobe Fonts license for web embedding, so CES uses a
two-face free stack that keeps the geometric brand feel where it shows and
maximizes legibility where the data is dense:

| Role | Face | Why |
|---|---|---|
| Display, headings, nav, KPIs, bid documents | **Jost** (Google Fonts) | The closest open Futura descendant; carries the brand voice |
| Body, forms, tables, line items | **Inter** (Google Fonts) | Excellent at 13–15px, first-class `tabular-nums` for money columns |
| PO / claim / job numbers (optional) | Keep **DM Mono** or drop | Nice-to-have, not brand-critical |

If Excel later adds an Adobe Fonts subscription, swap `--excel-font-display` to
`futura-pt` in one token; the scale and weights hold. This supersedes the demo's
DM Sans. Flagged as a call, not a mandate; DM Sans is serviceable but reads
generic and has no tie to the brand.

```html
<link href="https://fonts.googleapis.com/css2?family=Jost:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### 3.2 Scale and rules

| Token | Size / weight / face | Use |
|---|---|---|
| `display` | 30px / 700 / Jost | KPI values, cash price panel |
| `h1` | 22px / 700 / Jost | Page headings |
| `h2` | 16px / 600 / Jost | Card titles, section headers |
| `body` | 14px / 400 / Inter | Default (demo's 13–13.5px is below the floor for field use) |
| `small` | 12.5px / 400–500 / Inter | Meta lines, secondary info |
| `label` | 11px / 600 / Inter, uppercase, +0.5px tracking | Form labels, table headers, eyebrows |
| `bid-price` | 42px / 700 / Jost | Bid document price box |

Non-negotiables:

- Every money or quantity column gets `font-variant-numeric: tabular-nums` and
  right alignment.
- Form inputs are **16px on touch devices** (prevents iOS focus zoom; PMs will
  use this on phones at the kitchen table).
- Line-height 1.5 for body, 1.1–1.2 for display numbers.
- No letter-spacing on body text; reserve tracking for uppercase labels.

---

## 4. Logo

### 4.1 Assets and gotchas

| Asset | Status |
|---|---|
| `ECO_OnLogo.ai` | Vector master (Illustrator). **Action for Robert: export `excel-logo.svg` (full color) and `excel-logo-white.svg` (knockout) from this file.** SVG is the only correct format for app chrome. |
| `Excel_Roofing_Logo_no_box.png` | Transparent, light-blue variant; usable interim on light backgrounds |
| `IMG_5423.png` | **JPEG despite the .png extension** (392×280, white background). Fine embedded in documents on white; will render as a white box on the navy sidebar. Do not use in app chrome. If base64-embedding, the MIME prefix is `data:image/jpeg;base64,`. |

### 4.2 Interim wordmark (until SVGs exist)

Sidebar lockup, all type, no images:

- Line 1: `EXCEL ROOFING` — Jost 700, 15px, white, +0.5px tracking
- Line 2: `Complete Estimating System` — Inter 500, 10px, white 45%, uppercase
- Optional mark: 36px square, red-500, 6px radius, white "ER" (the demo's badge
  is acceptable as a placeholder only)

### 4.3 Rules

Clear space = height of the "E" on all sides. Never stretch, recolor, add
effects, or place the full-color logo on navy or red; use the white knockout
there. Never use the tagline as a logo substitute; the tagline appears in red
italic near the logo on customer-facing documents, quoted exactly:
*"You Don't Pay a Cent Until You're Content."*

---

## 5. Voice and microcopy

**Internal app surfaces** (everything a PM or manager sees): plain verbs,
sentence case, numerate, terse. "Generate bid," not "Let's create your
proposal!" Buttons name the exact outcome and keep that name through the flow
(Generate PDF → toast: "PDF generated"). Errors say what happened and what to do
next; they never apologize or go vague. Empty states direct action ("No projects
match. Clear filters or start a new project.") and may include Eco.

**Customer-facing surfaces** (bid PDF, emails): confident, warm, concrete.
Lead with what the customer gets; name materials and warranty terms precisely;
close with the tagline. No exclamation points, no emojis, no jargon
("tear-off and replacement," not "demo/re-roof scope").

House style in both registers: semicolons over em dashes; minimal em dashes in
body copy; no emojis anywhere in the product.

---

## 6. Eco the frog

Eco is an internal-delight asset: empty states, success moments ("Bid
accepted"), loading states. Keep Eco off customer-facing documents unless
ownership signs off; a signed bid is a legal document and stays clean. One Eco
appearance per screen maximum.

---

## 7. Component specifications

Implemented in `excel-brand.css` with the demo's existing class names, so
adoption is a stylesheet swap, not a rewrite.

**Buttons.** Primary: red-500 bg, white text, hover red-600, active red-700,
8px radius, 600 weight, 14px. Secondary: white bg, neutral-200 border,
neutral-900 text. Navy: navy-600 bg (reserve for "present/customer" actions such
as Generate Bid PDF, so red keeps meaning "commit"). Ghost: transparent.
All buttons: visible focus ring (see §8), disabled at 45% opacity with
`cursor:not-allowed`.

**Filter chips / manufacturer tabs.** Inactive: white bg, neutral-200 border,
neutral-600 text. Active: navy-600 bg, white text. Chips are selection, never
action; only buttons are red.

**Status badges.** Pill, 11px/600 uppercase, +0.3px tracking, colors per §2.4.

**Cards.** White, neutral-200 border, 12px radius, `--excel-shadow-1`; hover on
interactive cards lifts to `--excel-shadow-2` with a 1px translate. Project
cards keep the 4px left red bar only for rows needing attention (new lead,
expiring bid); an all-red list means nothing. Default the bar to transparent or
navy-200 and let status badges carry state.

**Forms.** Labels per §3.2; inputs 1.5px neutral-200 border, 8px radius, white
bg; focus = navy-600 border plus ring; read-only computed fields on neutral-50
with normal-contrast text. Required fields marked with a red asterisk and
`aria-required`.

**Tables.** Header row: 11px/600 uppercase neutral-500 with a 2px neutral-200
underline. Rows: 14px, 10–12px vertical padding, neutral-100 dividers, hover
neutral-50. Money columns right-aligned tabular. Margin cells colored per the
§2.4 thresholds.

**Sidebar.** 240px; gradient navy-600 → navy-900; nav items white 60%, hover
white 8% overlay, active red-500 with white text; section labels 10px uppercase
white 35%; tagline in italic white 35% under the logo block; user chip pinned to
the bottom.

**Price summary panel.** Sticky; navy-600 header band with white uppercase
title; cash price display on navy-600 with 32px Jost white; profit and margin
rows are internal-only (§9).

**Bid document (customer-facing).** White page. Header: logo (or interim navy
wordmark, 22px Jost 800) with the tagline in red italic beneath; right-aligned
company block (address · 303-761-6400 · excelroofing.com); 3px red-500 rule
under the header, matching the business cards; optional single ink-colored
swoosh flourish at the footer, nothing else decorative. Sections in order:
Prepared for · Scope of Work (neutral-50 panel) · Price (navy-600 box, 42px
white; label "Cash Price" or "Insurance Price" as applicable) · Terms &
Inclusions · Customer Authorization (signature and date lines) · Footer with
trust marks (Owens Corning Platinum Preferred · BBB A+ · 4.9 Google) and
license/insurance line. Serial-comma, precise materials language throughout.

> **Compliance flag (verify with counsel before first customer use).** Colorado's
> Residential Roofing Act (SB12-038, C.R.S. 6-22-101 et seq.) requires roofing
> contracts to include scope, approximate costs and dates, contractor contact
> info, the customer's 72-hour right to rescind (including after an insurer
> denies a claim), and the statement that the contractor cannot pay, waive, or
> rebate the insurance deductible. The bid template ships with placeholder
> language for these; ownership/counsel must approve final wording. Wyoming jobs
> do not carry the Colorado requirements; keep the terms block market-aware.

---

## 8. Layout, motion, accessibility

- **Spacing:** 4px base grid; common steps 4/8/12/16/20/24/32. Content max-width
  1280px; bid preview max-width 680px.
- **Radii:** 6 (small controls) / 8 (buttons, inputs) / 12 (cards) / 16 (modals).
- **Elevation:** two shadow levels plus a focus ring; defined as tokens.
- **Motion:** 150ms ease for hovers, 200ms for screen transitions; nothing
  bounces. Respect `prefers-reduced-motion` (in the stylesheet).
- **Focus:** every interactive element shows `--excel-focus-ring` on
  `:focus-visible`. The demo has none; this is a P0 fix.
- **Floors:** 14px minimum information text; 44px minimum touch targets on
  mobile; never encode meaning in color alone (badges keep their text labels).

---

## 9. Data-visibility guardrail

CES holds numbers customers must never see. Hard rule for every customer-facing
renderer (bid PDF, print view, email, share link):

**Never output:** raw cost, labor cost, margin %, profit $, markup, PM split,
overhead cap, fuel charge, accuracy benchmarks, PM performance data.
**Safe to output:** price, scope, materials, warranty, financing monthly
payments, terms, company info.

Implement as an explicit allowlist serializer for customer documents, not a
"hide these fields" blocklist; new internal fields must default to private.
Claim numbers and customer contact info are personal data: keep them off
screenshots/demos and out of logs.

---

## 10. Do / Don't

**Do** spend red only on the one action that matters per screen; keep money in
tabular figures; let navy and white do the talking; write buttons as outcomes;
show Eco when a PM wins.

**Don't** use `#ED1132`, `#00137F`, `#B21010`, or gold anywhere; put red behind
long text; use the JPEG logo on navy; let low-contrast gray carry real
information; ship a customer document containing the word "margin"; add a third
typeface beyond the stack; use emojis or em-dash-heavy copy in product text.

---

## 11. Migration map (demo variable → brand token)

The compatibility layer in `excel-brand.css` applies all of this automatically;
this table is the reference.

| Demo variable | Old value | New value | Token |
|---|---|---|---|
| `--red` | `#ED1132` | `#E31E26` | `--excel-red-500` |
| `--red-dark` | `#C00D28` | `#C4161D` | `--excel-red-600` |
| `--red-light` | `#FF3352` | `#E84A53` | `--excel-red-400` |
| `--navy` | `#00137F` | `#02205F` | `--excel-navy-600` |
| `--navy-dark` | `#000E60` | `#01153E` | `--excel-navy-800` |
| `--navy-light` | `#1A2FA0` | `#2F4880` | `--excel-navy-500` |
| `--dark` | `#282D67` | `#011030` | `--excel-navy-900` |
| `--gold` / `--gold-dark` | `#FBBF2A` / `#D4A020` | retired; semantic amber for warnings only | `--excel-warning-*` |
| `--bg` / `--bg2` | `#F4F6FA` / `#ECEEF5` | unchanged | `--excel-neutral-50/100` |
| `--text` | `#1A1F3C` | `#1A2038` | `--excel-neutral-900` |
| `--text2` | `#4B5568` | unchanged | `--excel-neutral-600` |
| `--text3` | `#9CA3AF` | `#6B7488` (real info) | `--excel-neutral-500` |
| `--font` | DM Sans | Inter (body) + Jost (display) | `--excel-font-*` |

---

*Package prepared 2026-07-18 from the CES demo and the corrected brand standard;
excelroofing.com was not re-crawled in this pass, so if the site has newer brand
assets, send them and the tokens get updated.*
