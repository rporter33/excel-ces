/**
 * Pricing Engine Accuracy Tests
 * Source of truth: real CES workbooks for jobs 30050, 30059, 30078, 30089, 30134.
 *
 * Each test builds two synthetic line items (one material, one labor) whose
 * raw costs equal the exact totals pulled from the actual Excel files, then
 * asserts the engine's output matches the known-correct values.
 *
 * Tolerances:
 *   Cash Price / PM Split: ±$1.00
 *   Tax:                   ±$0.10
 */

import { describe, it, expect } from "vitest";
import { calculateEstimate, type LineItem, type EstimateParams } from "../pricing-engine";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Build the simplest possible LineItem array that produces exact raw totals. */
function makeItems(rawMat: number, rawLabor: number): LineItem[] {
  return [
    { unitCost: rawMat,   quantity: 1, layers: 1, isLabor: false },
    { unitCost: rawLabor, quantity: 1, layers: 1, isLabor: true  },
  ];
}

/** Standard params shared by all jobs — job-specific markup passed separately. */
function baseParams(markupPct: number): EstimateParams {
  return {
    markupPct,
    taxRate:     0.083,
    fuelCharge:  100,
    overheadPct: 0.10,
    overheadCap: 2000,
    pmSplitPct:  0.44,
    permitCost:  0,
    salePriceOverride: null,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("Pricing Engine — real CES workbook accuracy", () => {

  it("Job 30050 — Michael Karr | 27% markup", () => {
    // Raw totals from actual Excel file
    const items  = makeItems(5429.67, 2492.48);
    const params = baseParams(0.27);
    const result = calculateEstimate(items, params);

    expect(result.taxAmount).toBeCloseTo(450.66,  1); // ±$0.10
    expect(result.baseEstimate).toBeCloseTo(11402.92, 1);
    expect(result.overheadAmount).toBeCloseTo(1140.29, 1);
    expect(result.cashPrice).toBeCloseTo(12543.22, 0);  // ±$1.00
    expect(result.totalProfit).toBeCloseTo(2930.11, 0);
    expect(result.pmProfit).toBeCloseTo(1289.25,   0);
  });

  it("Job 30059 — Verda Gully | 36% markup", () => {
    const items  = makeItems(5777.38, 2109.52);
    const params = baseParams(0.36);
    const result = calculateEstimate(items, params);

    expect(result.taxAmount).toBeCloseTo(479.52, 1);
    expect(result.baseEstimate).toBeCloseTo(12902.80, 1);
    expect(result.overheadAmount).toBeCloseTo(1290.28, 1);
    expect(result.cashPrice).toBeCloseTo(14193.08, 0);
    expect(result.totalProfit).toBeCloseTo(4436.38, 0);
    expect(result.pmProfit).toBeCloseTo(1952.01,   0);
  });

  it("Job 30078 — Santiago Luevanos | 30% markup", () => {
    const items  = makeItems(6715.47, 2516.29);
    const params = baseParams(0.30);
    const result = calculateEstimate(items, params);

    expect(result.taxAmount).toBeCloseTo(557.38, 1);
    expect(result.baseEstimate).toBeCloseTo(13845.61, 1);
    expect(result.overheadAmount).toBeCloseTo(1384.56, 1);
    expect(result.cashPrice).toBeCloseTo(15230.17, 0);
    expect(result.totalProfit).toBeCloseTo(3956.47, 0);
    expect(result.pmProfit).toBeCloseTo(1740.85,   0);
  });

  it("Job 30089 — Bill Searless | 28% markup", () => {
    const items  = makeItems(6434.17, 2596.48);
    const params = baseParams(0.28);
    const result = calculateEstimate(items, params);

    expect(result.taxAmount).toBeCloseTo(534.04, 1);
    expect(result.baseEstimate).toBeCloseTo(13176.61, 1);
    expect(result.overheadAmount).toBeCloseTo(1317.66, 1);
    expect(result.cashPrice).toBeCloseTo(14494.27, 0);
    expect(result.totalProfit).toBeCloseTo(3511.92, 0);
    expect(result.pmProfit).toBeCloseTo(1545.24,   0);
  });

  it("Job 30134 — Jim Hathaway | 37% markup", () => {
    const items  = makeItems(6606.86, 3547.00);
    const params = baseParams(0.37);
    const result = calculateEstimate(items, params);

    expect(result.taxAmount).toBeCloseTo(548.37, 1);
    expect(result.baseEstimate).toBeCloseTo(16765.61, 1);
    expect(result.overheadAmount).toBeCloseTo(1676.56, 1);
    expect(result.cashPrice).toBeCloseTo(18442.17, 0);
    expect(result.totalProfit).toBeCloseTo(5963.38, 0);
    expect(result.pmProfit).toBeCloseTo(2623.89,   0);
  });

  it("Overhead is capped at $2,000", () => {
    // A very large job: raw mat $20,000, raw labor $8,000 at 10% markup
    // Base estimate would be (28000/0.90) + tax + fuel = 31111 + 2324 + 100 = 33535
    // 10% of 33535 = 3353 — must be capped to 2000
    const items  = makeItems(20000, 8000);
    const params = baseParams(0.10);
    const result = calculateEstimate(items, params);

    expect(result.overheadAmount).toBe(2000);
  });

  it("Tax is on raw materials only, not marked-up materials", () => {
    // If tax were applied to marked-up cost it would be higher
    const rawMat  = 5000;
    const markup  = 0.30;
    const taxRate = 0.083;
    const items   = makeItems(rawMat, 1000);
    const params  = baseParams(markup);
    const result  = calculateEstimate(items, params);

    const expectedTax = rawMat * taxRate;           // $415
    const wrongTax    = (rawMat / (1 - markup)) * taxRate; // $592.86 if applied to marked-up

    expect(result.taxAmount).toBeCloseTo(expectedTax, 2);
    expect(result.taxAmount).not.toBeCloseTo(wrongTax, 0);
  });

  it("Permit cost is NOT counted as markup profit", () => {
    const items   = makeItems(5000, 2000);
    const noPermit = calculateEstimate(items, { ...baseParams(0.30), permitCost: 0 });
    const permit   = calculateEstimate(items, { ...baseParams(0.30), permitCost: 500 });

    // Permit should not inflate totalProfit
    expect(permit.totalProfit).toBeCloseTo(noPermit.totalProfit, 2);
    // But it should increase the cash price
    expect(permit.cashPrice).toBeGreaterThan(noPermit.cashPrice);
  });
});
