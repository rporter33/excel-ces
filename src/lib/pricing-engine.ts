// src/lib/pricing-engine.ts
// Core pricing logic — replaces Asphalt Roofing WS formulas (rows 184-194)
// and the markup calculation pattern =(C*D*E)/$G$6

export interface LineItem {
  unitCost: number;
  quantity: number;
  layers: number;
  isLabor: boolean;
}

export interface EstimateParams {
  markupPct: number;
  taxRate: number;
  fuelCharge: number;
  overheadPct: number;
  overheadCap: number;
  pmSplitPct: number;
  permitCost: number;
  salePriceOverride?: number | null;
}

export interface EstimateResult {
  rawMaterialCost: number;
  rawLaborCost: number;
  markedUpMaterialCost: number;
  markedUpLaborCost: number;
  materialsCost: number;
  laborCost: number;
  miscCost: number;
  subtotal: number;
  taxAmount: number;
  fuelCharge: number;
  baseEstimate: number;
  overheadAmount: number;
  cashPrice: number;
  totalProfit: number;
  pmProfit: number;
  actualProfitPct: number;
  creditCardPrice: number;
  financedAmount: number;
  payment12mo: number | null;
  payment60mo: number | null;
  payment120mo: number | null;
  displayPrice: number;
}

/** Markup: rawCost / (1 - markupPct). Replaces =(C*D*E)/$G$6 */
export function calculateMarkedUpCost(rawCost: number, markupPct: number): number {
  if (markupPct >= 1) return rawCost;
  return rawCost / (1 - markupPct);
}

/** Raw line cost. Replaces =C*D*E */
export function calculateRawCost(item: LineItem): number {
  return item.unitCost * item.quantity * item.layers;
}

/** Tear-off squares from measurement. Replaces =ROUNDDOWN(Measurement!K4,0)*1.02 */
export function calculateTearOffSquares(totalSquares: number): number {
  return Math.floor(totalSquares) * 1.02;
}

/** PMT function for financing. Replaces =PMT(rate/12, months, principal) */
function pmt(annualRate: number, months: number, principal: number): number {
  if (annualRate === 0) return principal / months;
  const r = annualRate / 12;
  return Math.abs((principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));
}

/**
 * Main estimate calculation — single source of truth for all pricing.
 * Replaces ~50 formulas across rows 184-194 of Asphalt WS + Bid tab financing.
 */
export function calculateEstimate(lineItems: LineItem[], params: EstimateParams): EstimateResult {
  const laborItems = lineItems.filter((li) => li.isLabor && li.quantity > 0);
  const materialItems = lineItems.filter((li) => !li.isLabor && li.quantity > 0);

  const rawLaborCost = laborItems.reduce((s, li) => s + calculateRawCost(li), 0);
  const rawMaterialCost = materialItems.reduce((s, li) => s + calculateRawCost(li), 0);

  const markedUpLaborCost = laborItems.reduce(
    (s, li) => s + calculateMarkedUpCost(calculateRawCost(li), params.markupPct), 0
  );
  const markedUpMaterialCost = materialItems.reduce(
    (s, li) => s + calculateMarkedUpCost(calculateRawCost(li), params.markupPct), 0
  );

  const materialsCost = markedUpMaterialCost;
  const laborCost = markedUpLaborCost;
  const miscCost = params.permitCost;
  const subtotal = materialsCost + laborCost + miscCost;
  const taxAmount = rawMaterialCost * params.taxRate; // Tax on raw materials only
  const fuelCharge = params.fuelCharge;
  const baseEstimate = subtotal + taxAmount + fuelCharge;
  const overheadAmount = Math.min(params.overheadCap, baseEstimate * params.overheadPct);
  const cashPrice = baseEstimate + overheadAmount;

  // Profit = markup gain only — permit/misc pass-throughs are not profit
  const totalProfit = subtotal - miscCost - rawMaterialCost - rawLaborCost;
  const pmProfit = totalProfit * params.pmSplitPct;
  const actualProfitPct = cashPrice > 0 ? totalProfit / cashPrice : 0;

  const creditCardPrice = cashPrice * 1.03;
  const financedAmount = cashPrice * 1.06;
  const payment12mo = financedAmount >= 1000 ? pmt(0.0001, 12, financedAmount) : null;
  const payment60mo = financedAmount >= 1000 ? pmt(0.0799, 60, financedAmount) : null;
  const payment120mo = financedAmount >= 7500 ? pmt(0.0799, 120, financedAmount) : null;

  const r2 = (n: number) => Math.round(n * 100) / 100;
  const r4 = (n: number) => Math.round(n * 10000) / 10000;

  return {
    rawMaterialCost: r2(rawMaterialCost), rawLaborCost: r2(rawLaborCost),
    markedUpMaterialCost: r2(markedUpMaterialCost), markedUpLaborCost: r2(markedUpLaborCost),
    materialsCost: r2(materialsCost), laborCost: r2(laborCost), miscCost: r2(miscCost),
    subtotal: r2(subtotal), taxAmount: r2(taxAmount), fuelCharge: r2(fuelCharge),
    baseEstimate: r2(baseEstimate), overheadAmount: r2(overheadAmount), cashPrice: r2(cashPrice),
    totalProfit: r2(totalProfit), pmProfit: r2(pmProfit), actualProfitPct: r4(actualProfitPct),
    creditCardPrice: r2(creditCardPrice), financedAmount: r2(financedAmount),
    payment12mo: payment12mo ? r2(payment12mo) : null,
    payment60mo: payment60mo ? r2(payment60mo) : null,
    payment120mo: payment120mo ? r2(payment120mo) : null,
    displayPrice: r2(params.salePriceOverride ?? cashPrice),
  };
}

/** Material order quantity — always round up. Replaces =ROUNDUP in Asphalt Order. */
export function materialOrderQty(estimateQty: number): number {
  return Math.ceil(estimateQty);
}
