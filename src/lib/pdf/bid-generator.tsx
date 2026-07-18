// src/lib/pdf/bid-generator.tsx
// Generates a standard bid PDF for Excel Roofing.
// Runs server-side only — @react-pdf/renderer uses Node canvas APIs.

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

export interface BidPdfData {
  date: string;
  poNumber: string | null;
  pmName: string;
  pmPhone: string | null;
  customerName: string;
  address: string | null;
  city: string | null;
  zip: string | null;
  phonePrimary: string | null;
  scopeDescription: string;
  cashPrice: number;
  isInsuranceJob: boolean;
  extendedWarranty: boolean;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#111827",
    padding: 48,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    borderBottom: "2px solid #1E3A5F",
    paddingBottom: 12,
  },
  companyName: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#1E3A5F",
  },
  tagline: {
    fontSize: 9,
    color: "#6B7280",
    marginTop: 2,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerLabel: {
    fontSize: 9,
    color: "#6B7280",
  },
  headerValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
    borderBottom: "1px solid #E5E7EB",
    paddingBottom: 3,
  },
  row: {
    flexDirection: "row",
    marginBottom: 3,
  },
  label: {
    width: 90,
    color: "#6B7280",
  },
  value: {
    flex: 1,
  },
  scopeText: {
    lineHeight: 1.6,
    color: "#374151",
  },
  priceBox: {
    backgroundColor: "#F0F4FF",
    borderRadius: 6,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 9,
    color: "#6B7280",
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 32,
    fontFamily: "Helvetica-Bold",
    color: "#1E3A5F",
  },
  priceSubLabel: {
    fontSize: 8,
    color: "#9CA3AF",
    marginTop: 4,
  },
  warrantyBadge: {
    backgroundColor: "#DCFCE7",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 8,
  },
  warrantyText: {
    fontSize: 8,
    color: "#166534",
    fontFamily: "Helvetica-Bold",
  },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    borderTop: "1px solid #E5E7EB",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8,
    color: "#9CA3AF",
  },
});

function fmt(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function BidDocument({ data }: { data: BidPdfData }) {
  return (
    <Document
      title={`Excel Roofing Bid — ${data.customerName}`}
      author="Excel Roofing"
    >
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.companyName}>EXCEL ROOFING</Text>
            <Text style={styles.tagline}>We&apos;re On Top of It · Denver, CO</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerLabel}>Date</Text>
            <Text style={styles.headerValue}>{data.date}</Text>
            {data.poNumber && (
              <>
                <Text style={[styles.headerLabel, { marginTop: 6 }]}>PO #</Text>
                <Text style={styles.headerValue}>{data.poNumber}</Text>
              </>
            )}
            <Text style={[styles.headerLabel, { marginTop: 6 }]}>Project Manager</Text>
            <Text style={styles.headerValue}>{data.pmName}</Text>
            {data.pmPhone && <Text style={styles.headerLabel}>{data.pmPhone}</Text>}
          </View>
        </View>

        {/* Customer */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 12, marginBottom: 4 }}>
            {data.customerName}
          </Text>
          {data.address && <Text style={styles.scopeText}>{data.address}</Text>}
          {(data.city || data.zip) && (
            <Text style={styles.scopeText}>
              {[data.city, data.zip].filter(Boolean).join(", ")}
            </Text>
          )}
          {data.phonePrimary && (
            <Text style={[styles.scopeText, { marginTop: 4 }]}>{data.phonePrimary}</Text>
          )}
        </View>

        {/* Scope of Work */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scope of Work</Text>
          <Text style={styles.scopeText}>{data.scopeDescription}</Text>
        </View>

        {/* Pricing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>
              {data.isInsuranceJob ? "Cash / Insurance Price" : "Cash Price"}
            </Text>
            <Text style={styles.priceValue}>{fmt(data.cashPrice)}</Text>
            <Text style={styles.priceSubLabel}>Due upon completion</Text>
            {data.extendedWarranty && (
              <View style={styles.warrantyBadge}>
                <Text style={styles.warrantyText}>Extended Warranty Included</Text>
              </View>
            )}
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment:</Text>
            <Text style={styles.value}>Due upon completion of work</Text>
          </View>
          {data.isInsuranceJob && (
            <View style={styles.row}>
              <Text style={styles.label}>Insurance:</Text>
              <Text style={styles.value}>
                Price matches insurance scope. Supplements billed directly to carrier.
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            All work guaranteed. Excel Roofing · Denver, CO
          </Text>
          <Text style={styles.footerText}>
            {data.pmName}{data.pmPhone ? ` · ${data.pmPhone}` : ""}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

/** Returns a Buffer containing the PDF bytes. Call server-side only. */
export async function generateBidPdfBuffer(data: BidPdfData): Promise<Buffer> {
  return renderToBuffer(<BidDocument data={data} />) as Promise<Buffer>;
}
