// Excel Roofing — canonical brand tokens (single source of truth).
//
// Derived verbatim from branding/EXCEL_BRAND_GUIDE.md v1.0 (2026-07). This file
// is intentionally framework-agnostic (plain constants, no imports) so it can
// feed BOTH the Tailwind config and the @react-pdf/renderer StyleSheet — neither
// of which can read the other's tokens.
//
// STATUS: not yet wired into the running app. The live UI still uses the older
// tailwind.config.js brand colors (#1E2A4A navy / #DC2626 red). Adopting these
// values is a deliberate Phase-3 task (see branding/README.md); importing this
// module changes nothing until tailwind.config.js / the PDF templates reference
// it. Keeping it unwired is what lets branding land without touching live builds.

/** Brand anchors. Navy = structure, Red = action only (≤10% of a screen). */
export const brand = {
  navy: "#02205F",
  red: "#E31E26",
  ink: "#011030", // swoosh accent: navy + 50% black
} as const;

/** Navy ramp — structure, chrome, text accents. */
export const navy = {
  50: "#F2F4F8",
  100: "#E6E9F1",
  200: "#C0C8DB",
  300: "#8D9BBB",
  400: "#5B6E9A",
  500: "#2F4880",
  600: "#02205F", // brand
  700: "#021A4D",
  800: "#01153E",
  900: "#011030", // ink / swoosh
} as const;

/** Red ramp — action only. */
export const red = {
  50: "#FDEEEF",
  100: "#FADADC",
  200: "#F4AFB3",
  300: "#EE7B82",
  400: "#E84A53",
  500: "#E31E26", // brand
  600: "#C4161D", // hover
  700: "#A01218", // active/pressed
  900: "#5C0A0E",
} as const;

/** Neutrals — cool gray, slight navy cast. 400 fails AA: decorative/disabled only. */
export const neutral = {
  0: "#FFFFFF",
  25: "#FAFBFD",
  50: "#F4F6FA", // app background
  100: "#ECEEF5",
  200: "#DFE3EC", // borders
  300: "#C6CCDA",
  400: "#98A1B3", // decorative/disabled ONLY
  500: "#6B7488", // lowest tone for real information
  600: "#4B5568", // secondary text
  700: "#333C52",
  800: "#222941",
  900: "#1A2038", // primary text
} as const;

/** Semantic + status pairs (bg/fg), all AA on their backgrounds. */
export const semantic = {
  success: { fg: "#15803D", bg: "#DCFCE7" },
  warning: { fg: "#92400E", bg: "#FEF3C7" }, // replaces the retired "gold"
  danger: { fg: red[600], bg: red[50] },
  info: { fg: navy[600], bg: navy[100] },
} as const;

export const status = {
  LEAD: { bg: navy[100], fg: navy[600] },
  MEASURING: { bg: "#DBEAFE", fg: "#1D4ED8" },
  ESTIMATING: { bg: "#F3E8FF", fg: "#6D28D9" },
  BID_SENT: { bg: "#FEF3C7", fg: "#92400E" },
  ACCEPTED: { bg: "#DCFCE7", fg: "#15803D" },
  CLOSED: { bg: "#F1F5F9", fg: "#475569" },
} as const;

/**
 * Type faces. Display = Jost (open Futura descendant), body = Inter, both free
 * on Google Fonts. Swap `display` to "futura-pt" if an Adobe Fonts kit is added.
 * @react-pdf needs static TTFs registered separately — these strings are for CSS.
 */
export const font = {
  display: "'Jost', 'Futura PT', Futura, 'Century Gothic', sans-serif",
  body: "'Inter', -apple-system, 'Segoe UI', Roboto, sans-serif",
  mono: "'DM Mono', ui-monospace, 'SF Mono', Menlo, monospace",
  googleFontsHref:
    "https://fonts.googleapis.com/css2?family=Jost:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap",
} as const;

/** Type scale (px). 14px is the information-text floor for field use. */
export const fontSize = {
  display: 30,
  h1: 22,
  h2: 16,
  body: 14,
  small: 12.5,
  label: 11,
  bidPrice: 42,
} as const;

/** 4px spacing grid, radii, elevation, motion. */
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32 } as const;

export const radius = { sm: 6, md: 8, lg: 12, xl: 16, pill: 999 } as const;

export const shadow = {
  1: "0 1px 3px rgba(1,16,48,.08), 0 4px 12px rgba(1,16,48,.06)",
  2: "0 4px 16px rgba(1,16,48,.12), 0 1px 4px rgba(1,16,48,.06)",
  focusRing: "0 0 0 3px rgba(2,32,95,.30)",
} as const;

export const motion = {
  ease: "cubic-bezier(.2,.6,.3,1)",
  fast: "150ms",
  medium: "200ms",
} as const;

/** Company facts and legal copy for customer-facing documents (bid PDF). */
export const company = {
  legalName: "Excel Roofing, Inc.",
  address: "4510 S Federal Blvd, Englewood, CO 80110",
  phone: "303-761-6400",
  web: "excelroofing.com",
  tagline: "You Don't Pay a Cent Until You're Content.",
  trustMarks: ["Owens Corning Platinum Preferred", "BBB A+", "4.9 Google (55,000+ customers)"],
} as const;

/**
 * Fields that must NEVER appear on any customer-facing surface (bid PDF, print
 * view, email, share link). Use an allowlist serializer, not this blocklist, for
 * enforcement — this is the human-readable reference. See EXCEL_BRAND_GUIDE.md §9.
 */
export const CUSTOMER_HIDDEN_FIELDS = [
  "rawCost",
  "rawMaterial",
  "rawLabor",
  "cost",
  "unitCost",
  "margin",
  "actualProfitPct",
  "totalProfit",
  "pmProfit",
  "pmSplitPct",
  "markupPct",
  "overheadPct",
  "overheadCap",
  "fuelCharge",
] as const;
