// scripts/seed-real-jobs.ts
// Seeds 3 real completed jobs (Michael Karr, Santiago Luevanos, Jim Hathaway)
// with full Project + Measurement + Estimate + line items.
//
// Run: npx tsx scripts/seed-real-jobs.ts

import { PrismaClient } from "@prisma/client";
import { calculateEstimate, type LineItem } from "../src/lib/pricing-engine";

const prisma = new PrismaClient();

// Admin user (SYSTEM_ADMIN, clerkId linked)
const PM_ID = "3b73ddfd-8b71-44f8-bcb7-5701dfb7128d";

// ─── Types ────────────────────────────────────────────────────────────────────

type LISpec = {
  category: string;
  productName: string;
  unitCost: number;
  quantity: number;
  unitType: string;
  isLabor: boolean;
};

function cashPrice(items: LISpec[], markupPct: number): number {
  const li: LineItem[] = items.map((i) => ({
    unitCost: i.unitCost,
    quantity: i.quantity,
    layers: 1,
    isLabor: i.isLabor,
  }));
  return calculateEstimate(li, {
    markupPct,
    taxRate: 0.083,
    fuelCharge: 100,
    overheadPct: 0.10,
    overheadCap: 2000,
    pmSplitPct: 0.44,
    permitCost: 0,
    salePriceOverride: null,
  }).cashPrice;
}

// ─── Job 1 — Michael Karr | PO 30050 ─────────────────────────────────────────

const KARR_ITEMS: LISpec[] = [
  // ── Tear-off ──
  { category: "TEAR_OFF", productName: "Asphalt tear off",                         unitCost: 46,    quantity: 19.38, unitType: "SQUARE",      isLabor: true  },

  // ── Install labor ──
  { category: "INSTALL",  productName: "3-tab LL 2 layer Dimensional install",     unitCost: 40,    quantity: 21.44, unitType: "SQUARE",      isLabor: true  },
  { category: "INSTALL",  productName: "Starter 3-tab dimensional shingles",       unitCost: 9,     quantity: 3,     unitType: "UNIT",        isLabor: true  },
  { category: "INSTALL",  productName: "Ridge 3-tab dimensional shingles",         unitCost: 9,     quantity: 4,     unitType: "UNIT",        isLabor: true  },
  { category: "INSTALL",  productName: "6 nail application",                       unitCost: 10,    quantity: 21.44, unitType: "SQUARE",      isLabor: true  },
  { category: "INSTALL",  productName: "Chimney Flashing and Counter Flashing",    unitCost: 70,    quantity: 1,     unitType: "UNIT",        isLabor: true  },
  { category: "INSTALL",  productName: "Install counter flashing",                 unitCost: 1.25,  quantity: 16,    unitType: "LINEAR_FOOT", isLabor: true  },
  { category: "INSTALL",  productName: "Ice & Water ($50 per roll)",               unitCost: 55,    quantity: 4,     unitType: "ROLL",        isLabor: true  },
  { category: "INSTALL",  productName: "D & R Satellite Dish",                    unitCost: 50,    quantity: 1,     unitType: "UNIT",        isLabor: true  },
  { category: "INSTALL",  productName: "Remove gutters per LF",                   unitCost: 1,     quantity: 106,   unitType: "LINEAR_FOOT", isLabor: true  },

  // ── Shingle ──
  { category: "SHINGLE",      productName: "OC Duration Storm Limited Life - Class 4 IR", unitCost: 140,   quantity: 21.44, unitType: "SQUARE", isLabor: false },

  // ── Materials ──
  { category: "UNDERLAYMENT", productName: "RhinoRoof 10sq",                       unitCost: 92.99,  quantity: 3,  unitType: "ROLL",  isLabor: false },
  { category: "UNDERLAYMENT", productName: "Rhino G ice and water shield",         unitCost: 102.99, quantity: 4,  unitType: "ROLL",  isLabor: false },
  { category: "STARTER",      productName: "OC Starter Strip Plus",                unitCost: 72.64,  quantity: 3,  unitType: "BUNDLE",isLabor: false },
  { category: "HIP_RIDGE",    productName: "OC ProEdge Storm Hip & Ridge",         unitCost: 95.99,  quantity: 4,  unitType: "BUNDLE",isLabor: false },
  { category: "DETAIL_METAL", productName: "90 degree Painted Rake 2x4",           unitCost: 14.10,  quantity: 16, unitType: "EACH",  isLabor: false },
  { category: "DETAIL_METAL", productName: "Painted Drip Edge 2x4",                unitCost: 14.10,  quantity: 13, unitType: "EACH",  isLabor: false },
  { category: "DETAIL_METAL", productName: "Painted Counter Flashing",             unitCost: 23.99,  quantity: 2,  unitType: "EACH",  isLabor: false },
  { category: "DETAIL_METAL", productName: "8 x 8 Painted Step Flashing",          unitCost: 104.99, quantity: 1,  unitType: "UNIT",  isLabor: false },
  { category: "VENT",         productName: "RVG-55 slantback with Filter",         unitCost: 21.50,  quantity: 6,  unitType: "UNIT",  isLabor: false },
  { category: "VENT",         productName: 'Broan Vent 4" 636',                    unitCost: 37.99,  quantity: 1,  unitType: "UNIT",  isLabor: false },
  { category: "VENT",         productName: 'Broan Vent 8" 634',                    unitCost: 61.99,  quantity: 1,  unitType: "UNIT",  isLabor: false },
  { category: "DETAIL_METAL", productName: '1-3" Pipe Flashing',                   unitCost: 11.50,  quantity: 2,  unitType: "UNIT",  isLabor: false },
  { category: "DETAIL_METAL", productName: "Split boot",                           unitCost: 48.99,  quantity: 1,  unitType: "UNIT",  isLabor: false },
  { category: "DETAIL_METAL", productName: '5"-7" Versa Cap',                      unitCost: 83.99,  quantity: 2,  unitType: "UNIT",  isLabor: false },
  { category: "FASTENER",     productName: '1-1/4" plastic Caps 2M/Box',           unitCost: 44.99,  quantity: 1,  unitType: "BOX",   isLabor: false },
  { category: "SEALANT",      productName: "Roof Cement",                          unitCost: 6.99,   quantity: 1,  unitType: "CAN",   isLabor: false },
  { category: "SEALANT",      productName: "Geocel OR MH Sealant",                 unitCost: 13.99,  quantity: 1,  unitType: "UNIT",  isLabor: false },
  { category: "SEALANT",      productName: "NP1 Clear",                            unitCost: 12.36,  quantity: 2,  unitType: "UNIT",  isLabor: false },
  { category: "MISC",         productName: "Spray paint 11 oz can",               unitCost: 13.75,  quantity: 1,  unitType: "CAN",   isLabor: false },
];

// ─── Job 2 — Santiago Luevanos | PO 30078 ────────────────────────────────────

const LUEVANOS_ITEMS: LISpec[] = [
  // ── Tear-off ──
  { category: "TEAR_OFF", productName: "Asphalt tear off",                         unitCost: 46,    quantity: 19.38, unitType: "SQUARE", isLabor: true },
  { category: "TEAR_OFF", productName: "Modified",                                 unitCost: 33,    quantity: 3.57,  unitType: "SQUARE", isLabor: true },

  // ── Install labor ──
  { category: "INSTALL",  productName: "3-tab LL 2 layer Dimensional install",     unitCost: 40,    quantity: 22,    unitType: "SQUARE", isLabor: true },
  { category: "INSTALL",  productName: "Starter 3-tab dimensional shingles",       unitCost: 9,     quantity: 3,     unitType: "UNIT",   isLabor: true },
  { category: "INSTALL",  productName: "Ridge 3-tab dimensional shingles",         unitCost: 9,     quantity: 3,     unitType: "UNIT",   isLabor: true },
  { category: "INSTALL",  productName: "6 nail application",                       unitCost: 10,    quantity: 22,    unitType: "SQUARE", isLabor: true },
  { category: "INSTALL",  productName: "Modified Bitumen / Peel & Stick",          unitCost: 47,    quantity: 4,     unitType: "SQUARE", isLabor: true },
  { category: "INSTALL",  productName: "Ice & Water ($50 per roll)",               unitCost: 55,    quantity: 3,     unitType: "ROLL",   isLabor: true },

  // ── Shingles ──
  { category: "SHINGLE",      productName: "OC Duration & Designer Dimensional Limited Life", unitCost: 141,    quantity: 1,  unitType: "SQUARE", isLabor: false },
  { category: "SHINGLE",      productName: "OC Duration Storm Limited Life - Class 4 IR",     unitCost: 159,    quantity: 21, unitType: "SQUARE", isLabor: false },

  // ── Materials ──
  { category: "UNDERLAYMENT", productName: "RhinoRoof 10sq",                       unitCost: 92.99,  quantity: 2,  unitType: "ROLL",   isLabor: false },
  { category: "UNDERLAYMENT", productName: "CertainTeed Winterguard Gran",         unitCost: 110,    quantity: 1,  unitType: "ROLL",   isLabor: false },
  { category: "UNDERLAYMENT", productName: "OC Weatherlock G 2sq/roll",            unitCost: 113.30, quantity: 3,  unitType: "ROLL",   isLabor: false },
  { category: "STARTER",      productName: "OC Starter Strip Plus",                unitCost: 72.64,  quantity: 3,  unitType: "BUNDLE", isLabor: false },
  { category: "HIP_RIDGE",    productName: "OC ProEdge Storm Hip & Ridge",         unitCost: 95.99,  quantity: 3,  unitType: "BUNDLE", isLabor: false },
  { category: "DETAIL_METAL", productName: "90 degree Painted Rake 2x4",           unitCost: 14.10,  quantity: 16, unitType: "EACH",   isLabor: false },
  { category: "DETAIL_METAL", productName: "Painted Drip Edge 2x4",                unitCost: 14.10,  quantity: 16, unitType: "EACH",   isLabor: false },
  { category: "DETAIL_METAL", productName: "Galv Drip Edge 2x4",                  unitCost: 14.10,  quantity: 3,  unitType: "EACH",   isLabor: false },
  { category: "DETAIL_METAL", productName: "Gravel Stop",                          unitCost: 12.99,  quantity: 4,  unitType: "EACH",   isLabor: false },
  { category: "DETAIL_METAL", productName: '1-3" Pipe Flashing',                   unitCost: 11.50,  quantity: 3,  unitType: "UNIT",   isLabor: false },
  { category: "VENT",         productName: "Turbine vents",                        unitCost: 89.99,  quantity: 3,  unitType: "UNIT",   isLabor: false },
  { category: "SBS",          productName: "Polyglass Elastoflex Cap Sheet",       unitCost: 185.99, quantity: 4,  unitType: "ROLL",   isLabor: false },
  { category: "SBS",          productName: "Polyglass Elastoflex Base Sheet",      unitCost: 185.99, quantity: 2,  unitType: "ROLL",   isLabor: false },
  { category: "MISC",         productName: "Asphalt Spray Primer",                 unitCost: 28.99,  quantity: 1,  unitType: "CAN",    isLabor: false },
  { category: "SEALANT",      productName: "Geocel OR MH Sealant",                 unitCost: 13.99,  quantity: 1,  unitType: "UNIT",   isLabor: false },
  { category: "SEALANT",      productName: "NP1 Clear",                            unitCost: 12.36,  quantity: 1,  unitType: "UNIT",   isLabor: false },
  { category: "MISC",         productName: "Spray paint 11 oz can",               unitCost: 13.75,  quantity: 2,  unitType: "CAN",    isLabor: false },
  { category: "FASTENER",     productName: '1-1/4" plastic Caps 2M/Box',           unitCost: 44.99,  quantity: 1,  unitType: "BOX",    isLabor: false },
];

// ─── Job 3 — Jim Hathaway | PO 30134 ─────────────────────────────────────────

const HATHAWAY_ITEMS: LISpec[] = [
  // ── Tear-off ──
  { category: "TEAR_OFF", productName: "Asphalt tear off",                         unitCost: 46,    quantity: 25.5, unitType: "SQUARE", isLabor: true },
  { category: "TEAR_OFF", productName: "Steep TO/install - 7/12",                  unitCost: 11,    quantity: 2,    unitType: "SQUARE", isLabor: true },
  { category: "TEAR_OFF", productName: "Steep TO/Install - 9/12",                  unitCost: 24,    quantity: 4,    unitType: "SQUARE", isLabor: true },

  // ── Install labor ──
  { category: "INSTALL",  productName: "3-tab LL 2 layer Dimensional install",     unitCost: 40,    quantity: 28,   unitType: "SQUARE",      isLabor: true },
  { category: "INSTALL",  productName: "Starter 3-tab dimensional shingles",       unitCost: 9,     quantity: 4,    unitType: "UNIT",        isLabor: true },
  { category: "INSTALL",  productName: "Ridge 3-tab dimensional shingles",         unitCost: 9,     quantity: 5,    unitType: "UNIT",        isLabor: true },
  { category: "INSTALL",  productName: "6 nail application",                       unitCost: 10,    quantity: 28,   unitType: "SQUARE",      isLabor: true },
  { category: "INSTALL",  productName: "Ice & Water ($50 per roll)",               unitCost: 55,    quantity: 6,    unitType: "ROLL",        isLabor: true },
  { category: "INSTALL",  productName: "Remove gutters per LF",                   unitCost: 1,     quantity: 85,   unitType: "LINEAR_FOOT", isLabor: true },
  { category: "INSTALL",  productName: "2 Story",                                  unitCost: 15,    quantity: 24,   unitType: "SQUARE",      isLabor: true },

  // ── Shingle ──
  { category: "SHINGLE",      productName: "OC Duration & Designer Dimensional Limited Life", unitCost: 141, quantity: 28, unitType: "SQUARE", isLabor: false },

  // ── Materials ──
  { category: "UNDERLAYMENT", productName: "RhinoRoof 10sq",                       unitCost: 92.99,  quantity: 3,  unitType: "ROLL",   isLabor: false },
  { category: "UNDERLAYMENT", productName: "Rhino G ice and water shield",         unitCost: 102.99, quantity: 6,  unitType: "ROLL",   isLabor: false },
  { category: "STARTER",      productName: "OC Starter Strip Plus",                unitCost: 72.64,  quantity: 4,  unitType: "BUNDLE", isLabor: false },
  { category: "HIP_RIDGE",    productName: "OC ProEdge Hip & Ridge",               unitCost: 78.99,  quantity: 5,  unitType: "BUNDLE", isLabor: false },
  { category: "DETAIL_METAL", productName: "90 degree Painted Rake 2x4",           unitCost: 14.10,  quantity: 23, unitType: "EACH",   isLabor: false },
  { category: "DETAIL_METAL", productName: "Painted Drip Edge 2x4",                unitCost: 14.10,  quantity: 13, unitType: "EACH",   isLabor: false },
  { category: "DETAIL_METAL", productName: "8 x 8 Painted Step Flashing",          unitCost: 104.99, quantity: 1,  unitType: "UNIT",   isLabor: false },
  { category: "VENT",         productName: "RVG-55 slantback with Filter",         unitCost: 21.50,  quantity: 5,  unitType: "UNIT",   isLabor: false },
  { category: "DETAIL_METAL", productName: '1-3" Pipe Flashing',                   unitCost: 11.50,  quantity: 4,  unitType: "UNIT",   isLabor: false },
  { category: "DETAIL_METAL", productName: '5"-7" Versa Cap',                      unitCost: 83.99,  quantity: 1,  unitType: "UNIT",   isLabor: false },
  { category: "FASTENER",     productName: '1-1/4" plastic Caps 2M/Box',           unitCost: 44.99,  quantity: 2,  unitType: "BOX",    isLabor: false },
  { category: "SEALANT",      productName: "Roof Cement",                          unitCost: 6.99,   quantity: 3,  unitType: "CAN",    isLabor: false },
  { category: "SEALANT",      productName: "NP1 Clear",                            unitCost: 12.36,  quantity: 6,  unitType: "UNIT",   isLabor: false },
  { category: "MISC",         productName: "Spray paint 11 oz can",               unitCost: 13.75,  quantity: 3,  unitType: "CAN",    isLabor: false },
];

// ─── Job definitions ──────────────────────────────────────────────────────────

const JOBS = [
  {
    project: {
      customerName:      "Michael Karr",
      address:           "1990 Quebec St",
      city:              "Denver",
      zip:               "80220",
      phonePrimary:      "720-318-0143",
      email:             "mjkarr555@gmail.com",
      status:            "CLOSED" as const,
      insuranceProvider: "Allstate",
      claimNumber:       "0816984116",
      poNumber:          "30050",
      pmId:              PM_ID,
      createdById:       PM_ID,
    },
    measurement: {
      totalSquares:    19.49,
      totalSqFt:       1949,
      iwShieldLf:      159,
      starterLf:       238,
      ridgeLf:         0,
      eavesLf:         0,
      rakeLf:          0,
      valleyLf:        0,
      stepFlashingLf:  0,
      pitch:           "5/12",
      stories:         1,
      additionalLayers: 0,
      soffitType:      "1.5",
      gutterSize:      "5",
      valleyType:      "closed",
      roofTypeRemoved: "Asphalt",
    },
    markupPct:       0.27,
    lineItems:       KARR_ITEMS,
    expectedCash:    12543.22,
    poNumber:        "30050",
  },
  {
    project: {
      customerName:      "Santiago Luevanos",
      address:           "11864 E Cornell Ave",
      city:              "Aurora",
      zip:               "80013",
      phonePrimary:      "303-264-9373",
      email:             "santiago.luevanos1966@gmail.com",
      status:            "CLOSED" as const,
      insuranceProvider: "State Farm",
      claimNumber:       "06-91J3-64R",
      poNumber:          "30078",
      pmId:              PM_ID,
      createdById:       PM_ID,
    },
    measurement: {
      totalSquares:    19.19,
      totalSqFt:       1919,
      iwShieldLf:      132,
      starterLf:       263,
      ridgeLf:         0,
      eavesLf:         0,
      rakeLf:          0,
      valleyLf:        0,
      stepFlashingLf:  0,
      pitch:           "4/12",
      stories:         2,
      additionalLayers: 0,
      soffitType:      "1",
      gutterSize:      "5",
      valleyType:      "closed",
      roofTypeRemoved: "Asphalt",
    },
    markupPct:       0.30,
    lineItems:       LUEVANOS_ITEMS,
    expectedCash:    15230.17,
    poNumber:        "30078",
  },
  {
    project: {
      customerName:      "Jim Hathaway",
      address:           "3445 First Light Drive",
      city:              "Castle Rock",
      zip:               "80109",
      phonePrimary:      "303-807-9515",
      email:             "jhathaway@5280group.com",
      status:            "CLOSED" as const,
      insuranceProvider: "Allstate",
      claimNumber:       "0794981076",
      poNumber:          "30134",
      pmId:              PM_ID,
      createdById:       PM_ID,
    },
    measurement: {
      totalSquares:    25.66,
      totalSqFt:       2566,
      ridgeLf:         78,
      eavesLf:         108,
      iwShieldLf:      108,
      starterLf:       295,
      rakeLf:          187,
      valleyLf:        77,
      stepFlashingLf:  32,
      pitch:           "5/12",
      stories:         2,
      additionalLayers: 0,
      soffitType:      "1",
      gutterSize:      "5",
      valleyType:      "closed",
      roofTypeRemoved: "Asphalt",
      pipeFlashings:   [{ size: "1-3", count: 4 }, { size: "5-7", count: 1 }],
    },
    markupPct:       0.37,
    lineItems:       HATHAWAY_ITEMS,
    expectedCash:    18442.17,
    poNumber:        "30134",
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding real jobs...\n");

  for (const job of JOBS) {
    // Delete existing project with same poNumber to allow re-runs
    const existing = await prisma.project.findFirst({
      where: { poNumber: job.poNumber },
    });
    if (existing) {
      console.log(`  Deleting existing project ${job.poNumber} (${existing.customerName})...`);
      await prisma.project.delete({ where: { id: existing.id } });
    }

    // Compute cash price
    const computed = cashPrice(job.lineItems, job.markupPct);
    const delta = Math.abs(computed - job.expectedCash);
    const pass = delta <= 1.00;

    // Create project
    const project = await prisma.project.create({
      data: { ...job.project },
    });

    // Create measurement
    await prisma.measurement.create({
      data: {
        projectId: project.id,
        ...job.measurement,
      },
    });

    // Create estimate with line items
    await prisma.estimate.create({
      data: {
        projectId:      project.id,
        markupPct:      job.markupPct,
        taxRate:        0.083,
        fuelCharge:     100,
        overheadPct:    0.10,
        overheadCap:    2000,
        pmSplitPct:     0.44,
        permitCost:     0,
        cachedCashPrice: computed,
        estimatedById:  PM_ID,
        lineItems: {
          create: job.lineItems.map((li, idx) => ({
            category:    li.category as any,
            productName: li.productName,
            unitCost:    li.unitCost,
            quantity:    li.quantity,
            unitType:    li.unitType as any,
            isLabor:     li.isLabor,
            layers:      1,
            sortOrder:   idx,
          })),
        },
      },
    });

    const status = pass ? "✅ PASS" : "❌ FAIL";
    console.log(
      `${status}  PO ${job.poNumber} — ${job.project.customerName}` +
      `\n        computed: $${computed.toFixed(2)}  expected: $${job.expectedCash.toFixed(2)}  Δ $${delta.toFixed(2)}`
    );
  }

  console.log("\nVerifying DB...");
  const projects = await prisma.project.findMany({
    where: { poNumber: { in: ["30050", "30078", "30134"] } },
    include: {
      estimate: { include: { lineItems: true } },
      measurement: true,
    },
    orderBy: { poNumber: "asc" },
  });

  console.log(`\n${"─".repeat(60)}`);
  console.log(`  Found ${projects.length}/3 projects in DB`);
  for (const p of projects) {
    const li = p.estimate?.lineItems.length ?? 0;
    const cached = p.estimate?.cachedCashPrice?.toString() ?? "—";
    console.log(`  PO ${p.poNumber}  ${p.customerName.padEnd(22)} ${li} line items  cached=$${cached}`);
  }
  console.log(`${"─".repeat(60)}\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
