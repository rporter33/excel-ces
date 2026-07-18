// src/app/dev/accuracy-test/page.tsx
// Internal pricing-engine accuracy test — not linked from any nav.
// Visit /dev/accuracy-test to verify all 5 CES reference jobs pass.
"use client";

import { useMemo } from "react";
import { calculateEstimate, type LineItem, type EstimateParams } from "@/lib/pricing-engine";

// ─── Reference jobs (raw totals pulled directly from Excel workbooks) ────────

interface ReferenceJob {
  jobNo: string;
  customer: string;
  markupPct: number;
  rawMat: number;
  rawLabor: number;
  expectedTax: number;
  expectedBaseEstimate: number;
  expectedOverhead: number;
  expectedCash: number;
  expectedProfit: number;
  expectedPmSplit: number;
  expectedMarginPct: number;
}

const REFERENCE_JOBS: ReferenceJob[] = [
  {
    jobNo: "30050",
    customer: "Michael Karr",
    markupPct: 0.27,
    rawMat: 5429.67,
    rawLabor: 2492.48,
    expectedTax: 450.66,
    expectedBaseEstimate: 11402.92,
    expectedOverhead: 1140.29,
    expectedCash: 12543.22,
    expectedProfit: 2930.11,
    expectedPmSplit: 1289.25,
    expectedMarginPct: 23.4,
  },
  {
    jobNo: "30059",
    customer: "Verda Gully",
    markupPct: 0.36,
    rawMat: 5777.38,
    rawLabor: 2109.52,
    expectedTax: 479.52,
    expectedBaseEstimate: 12902.80,
    expectedOverhead: 1290.28,
    expectedCash: 14193.08,
    expectedProfit: 4436.38,
    expectedPmSplit: 1952.01,
    expectedMarginPct: 31.3,
  },
  {
    jobNo: "30078",
    customer: "Santiago Luevanos",
    markupPct: 0.30,
    rawMat: 6715.47,
    rawLabor: 2516.29,
    expectedTax: 557.38,
    expectedBaseEstimate: 13845.61,
    expectedOverhead: 1384.56,
    expectedCash: 15230.17,
    expectedProfit: 3956.47,
    expectedPmSplit: 1740.85,
    expectedMarginPct: 26.0,
  },
  {
    jobNo: "30089",
    customer: "Bill Searless",
    markupPct: 0.28,
    rawMat: 6434.17,
    rawLabor: 2596.48,
    expectedTax: 534.04,
    expectedBaseEstimate: 13176.61,
    expectedOverhead: 1317.66,
    expectedCash: 14494.27,
    expectedProfit: 3511.92,
    expectedPmSplit: 1545.24,
    expectedMarginPct: 24.2,
  },
  {
    jobNo: "30134",
    customer: "Jim Hathaway",
    markupPct: 0.37,
    rawMat: 6606.86,
    rawLabor: 3547.00,
    expectedTax: 548.37,
    expectedBaseEstimate: 16765.61,
    expectedOverhead: 1676.56,
    expectedCash: 18442.17,
    expectedProfit: 5963.38,
    expectedPmSplit: 2623.89,
    expectedMarginPct: 32.3,
  },
];

// ─── Thresholds ──────────────────────────────────────────────────────────────

const CASH_TOLERANCE   = 1.00;   // ±$1.00 → green
const CASH_WARN        = 10.00;  // ±$10.00 → yellow, else red

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function diff(a: number, b: number) {
  return Math.abs(a - b);
}

function statusColor(delta: number): string {
  if (delta <= CASH_TOLERANCE) return "bg-green-100 text-green-800";
  if (delta <= CASH_WARN)      return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

function statusLabel(delta: number): string {
  if (delta <= CASH_TOLERANCE) return "PASS";
  if (delta <= CASH_WARN)      return "WARN";
  return "FAIL";
}

// ─── Per-job result ──────────────────────────────────────────────────────────

interface JobResult {
  job: ReferenceJob;
  calcCash: number;
  calcTax: number;
  calcProfit: number;
  calcPmSplit: number;
  calcOverhead: number;
  calcBase: number;
  cashDelta: number;
  taxDelta: number;
  profitDelta: number;
  pass: boolean;
}

function runJob(job: ReferenceJob): JobResult {
  const items: LineItem[] = [
    { unitCost: job.rawMat,   quantity: 1, layers: 1, isLabor: false },
    { unitCost: job.rawLabor, quantity: 1, layers: 1, isLabor: true  },
  ];
  const params: EstimateParams = {
    markupPct:   job.markupPct,
    taxRate:     0.083,
    fuelCharge:  100,
    overheadPct: 0.10,
    overheadCap: 2000,
    pmSplitPct:  0.44,
    permitCost:  0,
    salePriceOverride: null,
  };
  const r = calculateEstimate(items, params);

  const cashDelta   = diff(r.cashPrice,    job.expectedCash);
  const taxDelta    = diff(r.taxAmount,    job.expectedTax);
  const profitDelta = diff(r.totalProfit,  job.expectedProfit);

  return {
    job,
    calcCash:     r.cashPrice,
    calcTax:      r.taxAmount,
    calcProfit:   r.totalProfit,
    calcPmSplit:  r.pmProfit,
    calcOverhead: r.overheadAmount,
    calcBase:     r.baseEstimate,
    cashDelta,
    taxDelta,
    profitDelta,
    pass: cashDelta <= CASH_TOLERANCE,
  };
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AccuracyTestPage() {
  const results = useMemo(() => REFERENCE_JOBS.map(runJob), []);
  const passing = results.filter((r) => r.pass).length;
  const total   = results.length;
  const allPass = passing === total;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pricing Engine Accuracy Test</h1>
        <p className="text-sm text-gray-500 mt-1">
          Internal tool — compares engine output against real CES workbook values.
          Green = within $1.00, Yellow = within $10.00, Red = over $10.00 off.
        </p>
      </div>

      {/* Score banner */}
      <div
        className={`rounded-xl px-6 py-4 flex items-center gap-4 ${
          allPass ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
        }`}
      >
        <span className={`text-4xl font-black ${allPass ? "text-green-600" : "text-red-600"}`}>
          {passing}/{total}
        </span>
        <div>
          <p className={`font-semibold text-lg ${allPass ? "text-green-800" : "text-red-800"}`}>
            {allPass ? "All tests passing — 100% accurate" : `${total - passing} test${total - passing > 1 ? "s" : ""} failing`}
          </p>
          <p className="text-sm text-gray-500">
            Tolerance: ±$1.00 on Cash Price | ±$0.10 on Tax
          </p>
        </div>
      </div>

      {/* Results table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Job</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Customer</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Markup</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Expected Cash</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Calculated Cash</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Δ</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-600">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {results.map((r) => {
              const color = statusColor(r.cashDelta);
              const label = statusLabel(r.cashDelta);
              return (
                <tr key={r.job.jobNo} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-medium text-gray-800">{r.job.jobNo}</td>
                  <td className="px-4 py-3 text-gray-700">{r.job.customer}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{(r.job.markupPct * 100).toFixed(0)}%</td>
                  <td className="px-4 py-3 text-right font-mono">{fmt(r.job.expectedCash)}</td>
                  <td className="px-4 py-3 text-right font-mono">{fmt(r.calcCash)}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-500">
                    {r.cashDelta < 0.005 ? "—" : `$${r.cashDelta.toFixed(2)}`}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${color}`}>
                      {label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detail cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Detail — all intermediate values</h2>
        {results.map((r) => (
          <details key={r.job.jobNo} className="border border-gray-200 rounded-xl overflow-hidden">
            <summary className="flex items-center justify-between px-4 py-3 cursor-pointer bg-gray-50 hover:bg-gray-100">
              <span className="font-medium text-gray-800">
                #{r.job.jobNo} — {r.job.customer}
                <span className="ml-2 text-gray-400 text-sm">({(r.job.markupPct * 100).toFixed(0)}% markup)</span>
              </span>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${statusColor(r.cashDelta)}`}>
                {statusLabel(r.cashDelta)}
              </span>
            </summary>
            <div className="px-4 py-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <DetailRow label="Raw Materials" calc={r.job.rawMat} />
              <DetailRow label="Raw Labor"     calc={r.job.rawLabor} />
              <DetailRow label="Tax (8.3%)"    calc={r.calcTax}    expected={r.job.expectedTax}    delta={r.taxDelta}    tol={0.10} />
              <DetailRow label="Base Estimate" calc={r.calcBase}   expected={r.job.expectedBaseEstimate} />
              <DetailRow label="Overhead"      calc={r.calcOverhead} expected={r.job.expectedOverhead} />
              <DetailRow label="Cash Price"    calc={r.calcCash}   expected={r.job.expectedCash}   delta={r.cashDelta}   tol={1.00} highlight />
              <DetailRow label="Total Profit"  calc={r.calcProfit} expected={r.job.expectedProfit} delta={r.profitDelta} tol={1.00} />
              <DetailRow label="PM Split (44%)" calc={r.calcPmSplit} expected={r.job.expectedPmSplit} />
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

// ─── Detail row sub-component ────────────────────────────────────────────────

function DetailRow({
  label, calc, expected, delta, tol, highlight,
}: {
  label: string;
  calc: number;
  expected?: number;
  delta?: number;
  tol?: number;
  highlight?: boolean;
}) {
  const hasDiff = expected !== undefined && delta !== undefined && tol !== undefined;
  const pass    = hasDiff ? delta <= tol : true;

  return (
    <div className={`rounded-lg p-3 ${highlight ? "bg-blue-50 border border-blue-100" : "bg-gray-50"}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`font-mono font-semibold ${highlight ? "text-blue-700" : "text-gray-800"}`}>
        {fmt(calc)}
      </p>
      {expected !== undefined && (
        <p className={`text-xs mt-1 ${pass ? "text-green-600" : "text-red-600"}`}>
          expected {fmt(expected)}
          {hasDiff && delta! > 0.004 && ` (Δ $${delta!.toFixed(2)})`}
        </p>
      )}
    </div>
  );
}
