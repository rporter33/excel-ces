// src/lib/pdf/bid-template.tsx
// Printable bid document for Excel Roofing.
// Runs server-side only — @react-pdf/renderer uses Node APIs.

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

export interface BidTemplateData {
  // Header
  date: string; // MM/DD/YYYY
  projectId: string;
  pmName: string;
  pmPhone: string | null;
  // Customer
  customerName: string;
  address: string | null;
  city: string | null;
  zip: string | null;
  phonePrimary: string | null;
  // Scope
  roofTypeRemoved: string | null;
  shingleName: string | null;
  totalSquares: string | null; // formatted, e.g. "23.5"
  pitch: string | null;
  stories: number;
  hasValley: boolean;
  // Pricing
  cashPrice: number;
  isInsuranceJob: boolean;
  extendedWarranty: boolean;
}

const C = {
  navy: "#1E3A5F",
  gray: "#6B7280",
  lightGray: "#F3F4F6",
  border: "#E5E7EB",
  green: "#166534",
  greenBg: "#DCFCE7",
  text: "#111827",
  muted: "#9CA3AF",
};

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, color: C.text, padding: 48 },

  // Header
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 12,
    marginBottom: 16,
    borderBottom: `2 solid ${C.navy}`,
  },
  companyName: { fontSize: 24, fontFamily: "Helvetica-Bold", color: C.navy },
  tagline: { fontSize: 9, color: C.gray, marginTop: 3 },
  headerRight: { alignItems: "flex-end" },
  headerMeta: { fontSize: 9, color: C.gray, marginTop: 3 },
  headerMetaVal: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.text },

  // Rule
  rule: { borderBottom: `1 solid ${C.border}`, marginBottom: 14 },

  // Section
  section: { marginBottom: 16 },
  sectionHeading: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.gray,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  preparedFor: { fontSize: 9, color: C.gray, marginBottom: 4 },
  customerName: { fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  bodyText: { fontSize: 10, color: C.text, lineHeight: 1.55 },

  // Pricing box
  priceBox: {
    backgroundColor: C.lightGray,
    borderRadius: 6,
    padding: 20,
    alignItems: "center",
    marginBottom: 12,
  },
  priceLabel: { fontSize: 9, color: C.gray, marginBottom: 6 },
  priceValue: { fontSize: 28, fontFamily: "Helvetica-Bold", color: C.navy },
  priceSecondary: { fontSize: 11, color: C.navy, marginTop: 6 },
  bullet: { fontSize: 10, color: C.gray, marginTop: 5, lineHeight: 1.5 },

  // Signature
  sigRow: { flexDirection: "row", gap: 24, marginTop: 6 },
  sigLine: { flex: 1, borderBottom: `1 solid ${C.text}`, paddingBottom: 2 },
  sigLabel: { fontSize: 9, color: C.gray, marginTop: 3 },

  // Warranty badge
  warrantyBadge: {
    backgroundColor: C.greenBg,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 8,
  },
  warrantyText: { fontSize: 8, color: C.green, fontFamily: "Helvetica-Bold" },

  // Footer
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    borderTop: `1 solid ${C.border}`,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 8, color: C.muted },
});

function fmt(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function buildScopeParagraph(d: BidTemplateData): string {
  const roofType = d.roofTypeRemoved ?? "existing";
  const shingle = d.shingleName ?? "architectural shingle";
  const squares = d.totalSquares ? `${d.totalSquares} squares` : "";
  const pitch = d.pitch ? `${d.pitch} pitch` : "";
  const stories = `${d.stories}-story`;

  const parts = [
    `Complete tear-off and replacement of existing ${roofType} roofing.`,
    `Installation of ${shingle} shingles${squares ? ` over ${squares}` : ""}.`,
    [pitch, stories].filter(Boolean).join(", ") + (pitch || stories ? "." : ""),
    d.hasValley ? "Open/closed valley as noted." : "",
  ];

  return parts.filter(Boolean).join(" ").trim();
}

function BidDocument({ d }: { d: BidTemplateData }) {
  const scope = buildScopeParagraph(d);

  return (
    <Document title={`Excel Roofing Bid — ${d.customerName}`} author="Excel Roofing">
      <Page size="LETTER" style={styles.page}>

        {/* ── Header ── */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.companyName}>EXCEL ROOFING</Text>
            <Text style={styles.tagline}>We&apos;re On Top of It</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerMeta}>Date</Text>
            <Text style={styles.headerMetaVal}>{d.date}</Text>
            <Text style={[styles.headerMeta, { marginTop: 5 }]}>PO</Text>
            <Text style={styles.headerMetaVal}>{d.projectId.slice(0, 8).toUpperCase()}</Text>
            <Text style={[styles.headerMeta, { marginTop: 5 }]}>PM</Text>
            <Text style={styles.headerMetaVal}>{d.pmName}</Text>
          </View>
        </View>

        {/* ── Rule ── */}
        <View style={styles.rule} />

        {/* ── Customer ── */}
        <View style={styles.section}>
          <Text style={styles.preparedFor}>Prepared for:</Text>
          <Text style={styles.customerName}>{d.customerName}</Text>
          {d.address && <Text style={styles.bodyText}>{d.address}</Text>}
          {(d.city || d.zip) && (
            <Text style={styles.bodyText}>
              {[d.city, d.zip].filter(Boolean).join(", ")}
            </Text>
          )}
          {d.phonePrimary && <Text style={styles.bodyText}>{d.phonePrimary}</Text>}
        </View>

        {/* ── Scope of Work ── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Scope of Work</Text>
          <Text style={styles.bodyText}>{scope}</Text>
        </View>

        {/* ── Pricing ── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Pricing</Text>
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Cash Price</Text>
            <Text style={styles.priceValue}>{fmt(d.cashPrice)}</Text>
            {d.isInsuranceJob && (
              <Text style={styles.priceSecondary}>Insurance Price: {fmt(d.cashPrice)}</Text>
            )}
            {d.extendedWarranty && (
              <View style={styles.warrantyBadge}>
                <Text style={styles.warrantyText}>Extended Warranty Included</Text>
              </View>
            )}
          </View>
          <Text style={styles.bullet}>• All labor and materials included</Text>
          <Text style={styles.bullet}>• Cleanup and haul-away included</Text>
          <Text style={styles.bullet}>• Due upon completion</Text>
        </View>

        {/* ── Signature ── */}
        <View style={[styles.section, { marginTop: 24 }]}>
          <View style={styles.sigRow}>
            <View style={{ flex: 3 }}>
              <View style={styles.sigLine} />
              <Text style={styles.sigLabel}>Customer signature</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.sigLine} />
              <Text style={styles.sigLabel}>Date</Text>
            </View>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Excel Roofing | Denver, CO{d.pmPhone ? ` | ${d.pmPhone}` : ""}
          </Text>
          <Text style={styles.footerText}>
            All workmanship guaranteed. Licensed and insured.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

/** Renders the bid PDF and returns a Node Buffer. Server-side only. */
export async function renderBidPdf(data: BidTemplateData): Promise<Buffer> {
  return renderToBuffer(<BidDocument d={data} />) as Promise<Buffer>;
}
