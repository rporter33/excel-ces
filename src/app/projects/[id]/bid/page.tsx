// src/app/projects/[id]/bid/page.tsx
// Printable bid sheet — open from Estimate → "View / Print Bid Sheet"
// Use browser Print (Ctrl+P) to save as PDF.
import { getProject } from "@/lib/actions";
import { notFound } from "next/navigation";
import { calculateEstimate, type LineItem } from "@/lib/pricing-engine";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PrintButton } from "./print-button";

export default async function BidPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return notFound();

  const e = project.estimate;
  if (!e) {
    return (
      <div className="mx-auto max-w-xl px-4 py-6">
        <Link href={`/projects/${id}`} className="btn-secondary mb-4 inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <p className="text-gray-500">No estimate on this project yet.</p>
      </div>
    );
  }

  // Reconstruct pricing from saved line items + params
  const lineItems: LineItem[] = e.lineItems.map((li) => ({
    unitCost: Number(li.unitCost),
    quantity: Number(li.quantity),
    layers: li.layers,
    isLabor: li.isLabor,
  }));

  const markupPct = Number(e.markupPct);
  const result = calculateEstimate(lineItems, {
    markupPct,
    taxRate: Number(e.taxRate),
    fuelCharge: Number(e.fuelCharge),
    overheadPct: Number(e.overheadPct),
    overheadCap: Number(e.overheadCap),
    pmSplitPct: Number(e.pmSplitPct),
    permitCost: Number(e.permitCost),
    salePriceOverride: e.salePriceOverride ? Number(e.salePriceOverride) : null,
  });

  const shingleItem = e.lineItems.find((li) => li.category === "SHINGLE");
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <>
      {/* Screen-only toolbar */}
      <div className="print:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
        <Link href={`/projects/${id}/estimate`} className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <span className="text-sm font-medium text-gray-700 flex-1">Bid Sheet — {project.customerName}</span>
        <PrintButton />
      </div>

      {/* ── Bid Sheet (printed area) ── */}
      <div className="mx-auto max-w-2xl px-6 py-8 space-y-8 print:px-0 print:py-6 print:max-w-none">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Excel Roofing</h1>
            <p className="text-sm text-gray-500 mt-0.5">Professional Roofing Services</p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p className="font-semibold text-gray-800">BID PROPOSAL</p>
            <p>{today}</p>
            {project.poNumber && <p>PO #{project.poNumber}</p>}
          </div>
        </div>

        <hr className="border-gray-300" />

        {/* Customer + Job Info */}
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Prepared For</p>
            <p className="font-semibold text-gray-900 text-base">{project.customerName}</p>
            {project.address && <p className="text-gray-600">{project.address}</p>}
            {(project.city || project.zip) && (
              <p className="text-gray-600">{[project.city, project.zip].filter(Boolean).join(", ")}</p>
            )}
            {project.phonePrimary && <p className="text-gray-600 mt-1">{project.phonePrimary}</p>}
            {project.email && <p className="text-gray-600">{project.email}</p>}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Project Manager</p>
            <p className="font-semibold text-gray-900">{project.pm?.name ?? "—"}</p>
            {project.insuranceProvider && (
              <>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-3 mb-1">Insurance</p>
                <p className="text-gray-700">{project.insuranceProvider}</p>
              </>
            )}
          </div>
        </div>

        {/* Scope of Work */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Scope of Work</p>
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Item</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-600">Qty</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-600 w-28">Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {e.lineItems.map((li, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2.5 text-gray-800">
                      {li.productName}
                      {li.category === "SHINGLE" && e.shingleColor && (
                        <span className="text-gray-400 ml-1">— {e.shingleColor}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-600 tabular-nums">
                      {Number(li.quantity).toFixed(Number(li.quantity) % 1 === 0 ? 0 : 2)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-400 text-xs">
                      {li.unitType.toLowerCase().replace(/_/g, " ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pricing */}
        <div className="rounded-xl border-2 border-gray-900 overflow-hidden">
          <div className="bg-gray-900 px-4 py-3">
            <p className="text-white font-semibold text-sm uppercase tracking-wider">Investment Summary</p>
          </div>
          <div className="px-4 py-4 space-y-2 text-sm">
            <BidRow label="Materials & Labor" value={result.subtotal} />
            <BidRow label={`Tax (${(Number(e.taxRate) * 100).toFixed(1)}%)`} value={result.taxAmount} />
            <BidRow label="Fuel / Delivery" value={result.fuelCharge} />
            {result.miscCost > 0 && <BidRow label="Permit" value={result.miscCost} />}
            <BidRow label="Overhead" value={result.overheadAmount} />
            <div className="border-t-2 border-gray-900 pt-3 mt-3 flex justify-between items-center">
              <span className="font-bold text-lg text-gray-900">CASH PRICE</span>
              <span className="font-black text-2xl text-gray-900">{formatCurrency(result.displayPrice)}</span>
            </div>
          </div>
        </div>

        {/* Financing options */}
        {(result.payment12mo || result.payment60mo || result.payment120mo) && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Financing Options Available</p>
            <div className="grid grid-cols-3 gap-3 text-sm text-center">
              {result.payment12mo && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-3">
                  <p className="font-bold text-green-800 text-base">{formatCurrency(result.payment12mo)}<span className="text-xs font-normal">/mo</span></p>
                  <p className="text-green-600 text-xs mt-0.5">12 mo / 0% interest</p>
                </div>
              )}
              {result.payment60mo && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-3">
                  <p className="font-bold text-blue-800 text-base">{formatCurrency(result.payment60mo)}<span className="text-xs font-normal">/mo</span></p>
                  <p className="text-blue-600 text-xs mt-0.5">60 mo / 7.99%</p>
                </div>
              )}
              {result.payment120mo && (
                <div className="rounded-xl border border-purple-200 bg-purple-50 px-3 py-3">
                  <p className="font-bold text-purple-800 text-base">{formatCurrency(result.payment120mo)}<span className="text-xs font-normal">/mo</span></p>
                  <p className="text-purple-600 text-xs mt-0.5">120 mo / 7.99%</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Terms */}
        <div className="text-xs text-gray-400 space-y-1 border-t border-gray-200 pt-4">
          <p>This proposal is valid for 30 days from the date above. Prices subject to material cost changes.</p>
          <p>Work will be performed in accordance with all local building codes and manufacturer specifications.</p>
          {project.extendedWarranty && <p>Extended manufacturer warranty included.</p>}
        </div>

        {/* Signature */}
        <div className="grid grid-cols-2 gap-8 pt-4">
          <div>
            <div className="border-b border-gray-400 h-10" />
            <p className="text-xs text-gray-500 mt-1">Customer Signature</p>
          </div>
          <div>
            <div className="border-b border-gray-400 h-10" />
            <p className="text-xs text-gray-500 mt-1">Date</p>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </>
  );
}

function BidRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-gray-700">
      <span>{label}</span>
      <span className="font-medium tabular-nums">{formatCurrency(value)}</span>
    </div>
  );
}
