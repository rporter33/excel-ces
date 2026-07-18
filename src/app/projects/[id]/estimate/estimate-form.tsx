"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { saveEstimate } from "@/lib/actions";
import {
  calculateEstimate,
  calculateTearOffSquares,
  type LineItem,
  type EstimateParams,
} from "@/lib/pricing-engine";
import { formatCurrency } from "@/lib/utils";
import { Check, ChevronDown, ChevronRight, Loader2, Zap } from "lucide-react";
import { GenerateBidButton } from "@/components/generate-bid-button";

// ─── Types ───────────────────────────────────────────────────

type SaveState = "idle" | "saving" | "saved" | "error";
type Tab = "tearoff" | "shingles" | "install" | "summary";

interface Product {
  id: string;
  name: string;
  category: string;
  manufacturer: string | null;
  unitCost: number;
  unitType: string;
  isLabor: boolean;
  sortOrder: number;
}

interface ExistingLineItem {
  productId: string | null;
  productName: string;
  category: string;
  unitCost: number;
  quantity: number;
  unitType: string;
  layers: number;
  isLabor: boolean;
}

interface Measurement {
  totalSquares: number;
  totalSqFt: number;
  ridgeLf: number;
  eavesLf: number;
  iwShieldLf: number;
  starterLf: number;
  rakeLf: number;
  valleyLf: number;
  stepFlashingLf: number;
  counterFlashLf: number;
  headwallFlashLf: number;
  chimneyCount: number;
  swampCoolerCt: number;
  acCount: number;
  stories: number;
  additionalLayers: number;
  gutterSize: string | null;
  pitch: string | null;
  skylights: { small?: number; medium?: number; large?: number };
}

interface ExistingEstimate {
  shingleColor: string;
  markupPct: number;
  taxRate: number;
  fuelCharge: number;
  overheadPct: number;
  overheadCap: number;
  pmSplitPct: number;
  permitCost: number;
  salePriceOverride: number | null;
  lineItems: ExistingLineItem[];
}

interface Props {
  projectId: string;
  measurement: Measurement | null;
  products: Product[];
  existingEstimate: ExistingEstimate | null;
  pmDefaultMarkupPct: number;
}

// ─── Helpers ─────────────────────────────────────────────────

const MATERIAL_CATS = [
  "UNDERLAYMENT", "STARTER", "HIP_RIDGE", "DETAIL_METAL",
  "DECKING", "VENT", "SBS", "SEALANT", "FASTENER",
] as const;

const MATERIAL_LABELS: Record<string, string> = {
  UNDERLAYMENT: "Underlayment",
  STARTER: "Starter Strip",
  HIP_RIDGE: "Hip & Ridge",
  DETAIL_METAL: "Detail Metal",
  DECKING: "Decking",
  VENT: "Roof Vents",
  SBS: "SBS / I&W Shield",
  SEALANT: "Sealant",
  FASTENER: "Fasteners",
};

const TAB_LABELS: Record<Tab, string> = {
  tearoff: "Tear-Off",
  shingles: "Shingles",
  install: "Install",
  summary: "Summary",
};

function isImpactRated(name: string) {
  return name.includes("Class 4") || name.toLowerCase().includes(" ir");
}

/** Auto-populate install quantity from measurement data */
function installAutoQty(name: string, m: Measurement, tearOffSq: number): string {
  const n = name.toLowerCase();
  const r = (v: number) => (v > 0 ? String(Math.round(v * 100) / 100) : "");
  if (n.includes("valley") && n.includes("lf")) return r(m.valleyLf);
  if (n.includes("counter flash") && n.includes("lf")) return r(m.counterFlashLf);
  if (n.includes("headwall") && n.includes("lf")) return r(m.headwallFlashLf);
  if (n.includes("ridge vent") && n.includes("lf")) return r(m.ridgeLf);
  if (n.includes("eave vent") && n.includes("lf")) return r(m.eavesLf);
  if (n.includes("skylight flashing") || n.includes("skylight dome")) {
    const total = (m.skylights.small ?? 0) + (m.skylights.medium ?? 0) + (m.skylights.large ?? 0);
    return total > 0 ? String(total) : "";
  }
  if (n.includes("swamp cooler")) return m.swampCoolerCt > 0 ? String(m.swampCoolerCt) : "";
  if (n.includes("chimney")) return m.chimneyCount > 0 ? String(m.chimneyCount) : "";
  if (n.includes("2 story")) return m.stories >= 2 ? r(tearOffSq) : "";
  if (n.includes("remove gutter")) return m.gutterSize ? r(m.eavesLf) : "";
  if (n.includes("starter")) return r(m.starterLf / 100);
  if (n.includes("ridge shingle")) return r(m.ridgeLf / 100);
  return r(tearOffSq);
}

// ─── Main component ──────────────────────────────────────────

export function EstimateForm({ projectId, measurement, products, existingEstimate, pmDefaultMarkupPct }: Props) {
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  // ── Split products by category ────────────────────────────
  const tearOffProds = useMemo(() => products.filter((p) => p.category === "TEAR_OFF"), [products]);
  const shingleProds = useMemo(() => products.filter((p) => p.category === "SHINGLE"), [products]);
  const installProds = useMemo(() => products.filter((p) => p.category === "INSTALL"), [products]);
  const materialProds = useMemo(
    () => products.filter((p) => (MATERIAL_CATS as readonly string[]).includes(p.category)),
    [products]
  );
  const manufacturers = useMemo(
    () => ["ALL", ...Array.from(new Set(shingleProds.map((p) => p.manufacturer).filter(Boolean) as string[]))],
    [shingleProds]
  );

  const existingLI = existingEstimate?.lineItems ?? [];
  const tearOffSquares = measurement ? calculateTearOffSquares(measurement.totalSquares) : 0;

  // ── Estimate params — markup uses PM default on first load ─
  const [markupPct, setMarkupPct] = useState(existingEstimate?.markupPct ?? pmDefaultMarkupPct);
  const [permitCost, setPermitCost] = useState(existingEstimate?.permitCost ?? 0);

  const estimateParams: EstimateParams = useMemo(() => ({
    markupPct,
    taxRate: existingEstimate?.taxRate ?? 0.083,
    fuelCharge: existingEstimate?.fuelCharge ?? 100,
    overheadPct: existingEstimate?.overheadPct ?? 0.10,
    overheadCap: existingEstimate?.overheadCap ?? 2000,
    pmSplitPct: existingEstimate?.pmSplitPct ?? 0.44,
    permitCost,
    salePriceOverride: existingEstimate?.salePriceOverride ?? null,
  }), [markupPct, permitCost, existingEstimate]);

  // ── State ─────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>("tearoff");
  const [saveState, setSaveState] = useState<SaveState>("idle");

  // Tear-off: { [productId]: { enabled, qty } }
  const [tearOff, setTearOff] = useState<Record<string, { enabled: boolean; qty: string }>>(() => {
    const r: Record<string, { enabled: boolean; qty: string }> = {};
    for (const p of tearOffProds) {
      const ex = existingLI.find((li) => li.productId === p.id);
      if (ex) {
        r[p.id] = { enabled: true, qty: String(ex.quantity) };
      } else {
        const autoQ = tearOffSquares > 0 ? tearOffSquares.toFixed(2) : "";
        r[p.id] = {
          enabled: p.name.toLowerCase().startsWith("asphalt") && tearOffSquares > 0,
          qty: autoQ,
        };
      }
    }
    return r;
  });

  // Shingle
  const [selectedShingleId, setSelectedShingleId] = useState<string | null>(() =>
    existingLI.find((li) => li.category === "SHINGLE")?.productId ?? null
  );
  const [shingleQty, setShingleQty] = useState<string>(() => {
    const ex = existingLI.find((li) => li.category === "SHINGLE");
    return ex ? String(ex.quantity) : tearOffSquares > 0 ? tearOffSquares.toFixed(2) : "";
  });
  const [shingleColor, setShingleColor] = useState(existingEstimate?.shingleColor ?? "");
  const [mfgFilter, setMfgFilter] = useState("ALL");

  // Custom shingle price — empty string = use catalog price
  const [shingleCustomPrice, setShingleCustomPrice] = useState<string>(() => {
    const ex = existingLI.find((li) => li.category === "SHINGLE");
    if (!ex) return "";
    // If saved unit cost differs from catalog, it was a custom price
    const catalogProd = products.find((p) => p.id === ex.productId);
    if (catalogProd && Math.abs(ex.unitCost - catalogProd.unitCost) > 0.005) {
      return String(ex.unitCost);
    }
    return "";
  });

  // Install: { [productId]: { enabled, qty } }
  const [install, setInstall] = useState<Record<string, { enabled: boolean; qty: string }>>(() => {
    const r: Record<string, { enabled: boolean; qty: string }> = {};
    for (const p of installProds) {
      const ex = existingLI.find((li) => li.productId === p.id);
      if (ex) {
        r[p.id] = { enabled: true, qty: String(ex.quantity) };
      } else {
        const autoQ = measurement ? installAutoQty(p.name, measurement, tearOffSquares) : "";
        const isDimensional =
          p.name.toLowerCase().includes("3-tab") || p.name.toLowerCase().includes("dimensional install");
        r[p.id] = { enabled: isDimensional && tearOffSquares > 0, qty: autoQ };
      }
    }
    return r;
  });

  // Materials: { [productId]: qty string }
  const [matQty, setMatQty] = useState<Record<string, string>>(() => {
    const r: Record<string, string> = {};
    for (const p of materialProds) {
      const ex = existingLI.find((li) => li.productId === p.id);
      r[p.id] = ex ? String(ex.quantity) : "";
    }
    return r;
  });

  // Collapsed material sections
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // ── Build line items for pricing engine + save ────────────
  const buildLineItems = useCallback((): LineItem[] => {
    const items: LineItem[] = [];
    for (const p of tearOffProds) {
      const s = tearOff[p.id];
      if (s?.enabled) {
        const qty = parseFloat(s.qty) || 0;
        if (qty > 0) items.push({ unitCost: p.unitCost, quantity: qty, layers: 1, isLabor: true });
      }
    }
    if (selectedShingleId) {
      const shingle = shingleProds.find((p) => p.id === selectedShingleId);
      if (shingle) {
        const qty = parseFloat(shingleQty) || 0;
        const price = parseFloat(shingleCustomPrice) || shingle.unitCost;
        if (qty > 0) items.push({ unitCost: price, quantity: qty, layers: 1, isLabor: false });
      }
    }
    for (const p of installProds) {
      const s = install[p.id];
      if (s?.enabled) {
        const qty = parseFloat(s.qty) || 0;
        if (qty > 0) items.push({ unitCost: p.unitCost, quantity: qty, layers: 1, isLabor: true });
      }
    }
    for (const p of materialProds) {
      const qty = parseFloat(matQty[p.id] || "") || 0;
      if (qty > 0) items.push({ unitCost: p.unitCost, quantity: qty, layers: 1, isLabor: false });
    }
    return items;
  }, [tearOff, selectedShingleId, shingleQty, shingleCustomPrice, install, matQty, tearOffProds, shingleProds, installProds, materialProds]);

  const result = useMemo(
    () => calculateEstimate(buildLineItems(), estimateParams),
    [buildLineItems, estimateParams]
  );

  // ── Save ──────────────────────────────────────────────────
  // Use ref so auto-save timer always reads latest state
  const currentStateRef = useRef({ tearOff, selectedShingleId, shingleQty, shingleCustomPrice, shingleColor, install, matQty, markupPct, permitCost });
  currentStateRef.current = { tearOff, selectedShingleId, shingleQty, shingleCustomPrice, shingleColor, install, matQty, markupPct, permitCost };

  const triggerSave = useCallback(async () => {
    setSaveState("saving");
    const s = currentStateRef.current as typeof currentStateRef.current & {
      markupPct: number; permitCost: number; shingleCustomPrice: string;
    };
    const lineItems: object[] = [];

    for (const p of tearOffProds) {
      const st = s.tearOff[p.id];
      if (st?.enabled) {
        const qty = parseFloat(st.qty) || 0;
        if (qty > 0) lineItems.push({ productId: p.id, productName: p.name, category: "TEAR_OFF", unitCost: p.unitCost, quantity: qty, unitType: "SQUARE", layers: 1, isLabor: true });
      }
    }
    if (s.selectedShingleId) {
      const shingle = shingleProds.find((p) => p.id === s.selectedShingleId);
      if (shingle) {
        const qty = parseFloat(s.shingleQty) || 0;
        const price = parseFloat(s.shingleCustomPrice) || shingle.unitCost;
        if (qty > 0) lineItems.push({ productId: shingle.id, productName: shingle.name, category: "SHINGLE", unitCost: price, quantity: qty, unitType: "SQUARE", layers: 1, isLabor: false });
      }
    }
    for (const p of installProds) {
      const st = s.install[p.id];
      if (st?.enabled) {
        const qty = parseFloat(st.qty) || 0;
        if (qty > 0) lineItems.push({ productId: p.id, productName: p.name, category: "INSTALL", unitCost: p.unitCost, quantity: qty, unitType: "SQUARE", layers: 1, isLabor: true });
      }
    }
    for (const p of materialProds) {
      const qty = parseFloat(s.matQty[p.id] || "") || 0;
      if (qty > 0) lineItems.push({ productId: p.id, productName: p.name, category: p.category, unitCost: p.unitCost, quantity: qty, unitType: p.unitType, layers: 1, isLabor: false });
    }

    const fd = new FormData();
    fd.append("projectId", projectId);
    fd.append("lineItems", JSON.stringify(lineItems));
    fd.append("shingleColor", s.shingleColor);
    fd.append("markupPct", String(s.markupPct));
    fd.append("permitCost", String(s.permitCost));

    const res = await saveEstimate(fd);
    setSaveState(res.success ? "saved" : "error");
    if (res.success) setTimeout(() => setSaveState("idle"), 3000);
  }, [projectId, tearOffProds, shingleProds, installProds, materialProds]);

  // Auto-save 1.5s after any state change
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(triggerSave, 1500);
  }, [tearOff, selectedShingleId, shingleQty, shingleCustomPrice, shingleColor, install, matQty, markupPct, permitCost, triggerSave]);

  // ── Running totals (for footer) ───────────────────────────
  const rawLaborTotal = tearOffProds
    .filter((p) => tearOff[p.id]?.enabled)
    .reduce((s, p) => s + p.unitCost * (parseFloat(tearOff[p.id]?.qty || "0") || 0), 0) +
    installProds
      .filter((p) => install[p.id]?.enabled)
      .reduce((s, p) => s + p.unitCost * (parseFloat(install[p.id]?.qty || "0") || 0), 0);

  // ── Auto-fill from measurements ───────────────────────────
  const autoFill = useCallback(() => {
    if (!measurement) return;

    const sq = tearOffSquares;

    // Tear-off: enable Asphalt with calculated squares
    setTearOff((prev) => {
      const next = { ...prev };
      for (const p of tearOffProds) {
        if (p.name.toLowerCase().startsWith("asphalt")) {
          next[p.id] = { enabled: true, qty: sq.toFixed(2) };
        }
      }
      return next;
    });

    // Install: enable dimensional install + labor helpers
    setInstall((prev) => {
      const next = { ...prev };
      for (const p of installProds) {
        const n = p.name.toLowerCase();
        if (n.includes("3-tab") || n.includes("dimensional install")) {
          next[p.id] = { enabled: true, qty: sq.toFixed(2) };
        } else if (n.includes("starter shingles")) {
          next[p.id] = { enabled: true, qty: String(Math.ceil(measurement.starterLf / 100)) };
        } else if (n.includes("ridge shingles")) {
          next[p.id] = { enabled: true, qty: String(Math.ceil(measurement.ridgeLf / 100)) };
        } else if (n.includes("6 nail")) {
          next[p.id] = { enabled: true, qty: sq.toFixed(2) };
        } else if (n.includes("ice & water") || n.includes("i&w")) {
          const rolls = Math.ceil(measurement.iwShieldLf / 50);
          if (rolls > 0) next[p.id] = { enabled: true, qty: String(rolls) };
        } else if (n.includes("2 story") && measurement.stories >= 2) {
          next[p.id] = { enabled: true, qty: sq.toFixed(2) };
        } else if (n.includes("remove gutter") && measurement.gutterSize) {
          next[p.id] = { enabled: true, qty: String(Math.round(measurement.eavesLf)) };
        }
      }
      return next;
    });
  }, [measurement, tearOffSquares, tearOffProds, installProds]);

  // ── Render ────────────────────────────────────────────────
  return (
    <>
      {/* Auto-fill banner */}
      {measurement && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-brand-blue/20 bg-blue-50/50 px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800">
              {tearOffSquares.toFixed(2)} sq · {measurement.stories} story
            </p>
            <p className="text-xs text-gray-500">
              Starter {measurement.starterLf} LF · Ridge {measurement.ridgeLf} LF · I/W {measurement.iwShieldLf} LF
            </p>
          </div>
          <button
            type="button"
            onClick={autoFill}
            className="ml-3 shrink-0 rounded-lg bg-brand-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-blue/90 active:scale-95 transition-transform"
          >
            Auto-fill
          </button>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex border-b border-gray-200 mb-4 -mx-4 px-4 gap-0 overflow-x-auto">
        {(["tearoff", "shingles", "install", "summary"] as Tab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-brand-blue text-brand-blue"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* ── Tab: Tear-Off ─────────────────────────────────── */}
      {activeTab === "tearoff" && (
        <div className="space-y-3">
          {measurement && (
            <div className="card bg-gray-50 text-sm text-gray-600 flex items-center justify-between">
              <span>Tear-off area ({tearOffSquares.toFixed(2)} sq)</span>
              <span className="text-xs text-gray-400">
                = FLOOR({measurement.totalSquares.toFixed(2)}) × 1.02
              </span>
            </div>
          )}

          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-3">Tear-Off Labor</h2>
            <div className="space-y-2">
              {tearOffProds.map((p) => {
                const s = tearOff[p.id] ?? { enabled: false, qty: "" };
                const rawCost = s.enabled ? p.unitCost * (parseFloat(s.qty) || 0) : 0;
                return (
                  <div
                    key={p.id}
                    className={`rounded-lg border p-3 transition-colors ${
                      s.enabled ? "border-brand-blue/40 bg-blue-50/40" : "border-gray-100 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setTearOff((prev) => ({
                            ...prev,
                            [p.id]: { ...s, enabled: !s.enabled },
                          }))
                        }
                        className={`h-5 w-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                          s.enabled ? "bg-brand-blue border-brand-blue" : "border-gray-300 bg-white"
                        }`}
                      >
                        {s.enabled && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${s.enabled ? "text-gray-900" : "text-gray-500"}`}>
                          {p.name}
                        </p>
                        <p className="text-xs text-gray-400">{formatCurrency(p.unitCost)}/sq</p>
                      </div>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={s.qty}
                        onChange={(e) =>
                          setTearOff((prev) => ({
                            ...prev,
                            [p.id]: { ...s, qty: e.target.value },
                          }))
                        }
                        placeholder="0"
                        className="input-field w-20 py-1.5 text-sm text-right"
                      />
                      <span className="text-xs text-gray-400 w-6">sq</span>
                    </div>
                    {s.enabled && rawCost > 0 && (
                      <div className="flex justify-end mt-1.5">
                        <span className="text-xs text-gray-500">
                          Raw: {formatCurrency(rawCost)} → Marked up: {formatCurrency(rawCost / (1 - estimateParams.markupPct))}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Running tear-off total */}
          <div className="card bg-gray-50">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tear-off raw labor</span>
              <span className="font-semibold">{formatCurrency(rawLaborTotal)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600">Marked up (÷ {1 - estimateParams.markupPct})</span>
              <span className="font-semibold text-brand-blue">
                {formatCurrency(rawLaborTotal / (1 - estimateParams.markupPct))}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Shingles ─────────────────────────────────── */}
      {activeTab === "shingles" && (
        <div className="space-y-3">
          {/* Manufacturer filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
            {manufacturers.map((mfg) => (
              <button
                key={mfg}
                type="button"
                onClick={() => setMfgFilter(mfg)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  mfgFilter === mfg
                    ? "bg-brand-blue text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {mfg === "Owens Corning" ? "OC" : mfg}
              </button>
            ))}
          </div>

          {/* Shingle list */}
          <div className="space-y-2">
            {(mfgFilter === "ALL"
              ? shingleProds
              : shingleProds.filter((p) => p.manufacturer === mfgFilter)
            ).map((p) => {
              const isSelected = selectedShingleId === p.id;
              const ir = isImpactRated(p.name);
              const qty = parseFloat(shingleQty) || 0;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedShingleId(isSelected ? null : p.id)}
                  className={`card w-full text-left transition-all ${
                    isSelected
                      ? "ring-2 ring-brand-blue bg-blue-50/30"
                      : "hover:ring-1 hover:ring-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-medium ${isSelected ? "text-brand-blue" : "text-gray-900"}`}>
                          {p.name}
                        </span>
                        {ir && (
                          <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700">
                            <Zap className="h-3 w-3" />
                            IR
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{p.manufacturer}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {p.unitCost > 0 ? `${formatCurrency(p.unitCost)}/sq` : "Quote"}
                      </p>
                      {isSelected && qty > 0 && p.unitCost > 0 && (
                        <p className="text-xs text-brand-blue font-medium">
                          Total: {formatCurrency(p.unitCost * qty)}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected shingle details */}
          {selectedShingleId && (
            <div className="card border-brand-blue/30 border">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Shingle Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Squares</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={shingleQty}
                    onChange={(e) => setShingleQty(e.target.value)}
                    placeholder="0"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Color</label>
                  <input
                    type="text"
                    value={shingleColor}
                    onChange={(e) => setShingleColor(e.target.value)}
                    placeholder="e.g. Charcoal"
                    className="input-field"
                  />
                </div>
                <div className="col-span-2">
                  <label className="label">
                    Price Override{" "}
                    <span className="text-gray-400 font-normal">
                      (catalog: {formatCurrency(shingleProds.find(p => p.id === selectedShingleId)?.unitCost ?? 0)}/sq)
                    </span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={shingleCustomPrice}
                      onChange={(e) => setShingleCustomPrice(e.target.value)}
                      placeholder={String(shingleProds.find(p => p.id === selectedShingleId)?.unitCost ?? "")}
                      className="input-field pl-7"
                    />
                  </div>
                  {shingleCustomPrice && (
                    <p className="mt-1 text-xs text-amber-600">
                      Using custom price {formatCurrency(parseFloat(shingleCustomPrice))}/sq
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {shingleProds.length === 0 && (
            <div className="card text-center py-8 text-gray-400 text-sm">
              No shingles in product catalog. Run the seed to add products.
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Install ──────────────────────────────────── */}
      {activeTab === "install" && (
        <div className="space-y-3">
          {/* Install labor */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-3">Install Labor</h2>
            <div className="space-y-2">
              {installProds.map((p) => {
                const s = install[p.id] ?? { enabled: false, qty: "" };
                const rawCost = s.enabled ? p.unitCost * (parseFloat(s.qty) || 0) : 0;
                return (
                  <div
                    key={p.id}
                    className={`rounded-lg border p-3 transition-colors ${
                      s.enabled ? "border-brand-blue/40 bg-blue-50/40" : "border-gray-100 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setInstall((prev) => ({
                            ...prev,
                            [p.id]: { ...s, enabled: !s.enabled },
                          }))
                        }
                        className={`h-5 w-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                          s.enabled ? "bg-brand-blue border-brand-blue" : "border-gray-300 bg-white"
                        }`}
                      >
                        {s.enabled && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium leading-tight ${s.enabled ? "text-gray-900" : "text-gray-500"}`}>
                          {p.name}
                        </p>
                        <p className="text-xs text-gray-400">{formatCurrency(p.unitCost)}/sq</p>
                      </div>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={s.qty}
                        onChange={(e) =>
                          setInstall((prev) => ({
                            ...prev,
                            [p.id]: { ...s, qty: e.target.value },
                          }))
                        }
                        placeholder="0"
                        className="input-field w-20 py-1.5 text-sm text-right"
                      />
                      <span className="text-xs text-gray-400 w-6">sq</span>
                    </div>
                    {s.enabled && rawCost > 0 && (
                      <p className="text-right mt-1 text-xs text-gray-500">
                        Raw: {formatCurrency(rawCost)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Material accessories — collapsible by category */}
          {MATERIAL_CATS.map((cat) => {
            const catProds = materialProds.filter((p) => p.category === cat);
            const isOpen = !collapsed[cat];
            const catTotal = catProds.reduce(
              (s, p) => s + p.unitCost * (parseFloat(matQty[p.id] || "") || 0),
              0
            );
            return (
              <div key={cat} className="card">
                <button
                  type="button"
                  onClick={() => setCollapsed((prev) => ({ ...prev, [cat]: isOpen }))}
                  className="flex items-center justify-between w-full"
                >
                  <span className="font-semibold text-gray-900">{MATERIAL_LABELS[cat]}</span>
                  <div className="flex items-center gap-2">
                    {catTotal > 0 && (
                      <span className="text-xs text-gray-500">{formatCurrency(catTotal)}</span>
                    )}
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-3 space-y-2">
                    {catProds.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">
                        No products in catalog for this category.
                      </p>
                    ) : (
                      catProds.map((p) => (
                        <div key={p.id} className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800">{p.name}</p>
                            <p className="text-xs text-gray-400">
                              {formatCurrency(p.unitCost)}/{p.unitType.toLowerCase()}
                            </p>
                          </div>
                          <input
                            type="number"
                            inputMode="decimal"
                            value={matQty[p.id] ?? ""}
                            onChange={(e) =>
                              setMatQty((prev) => ({ ...prev, [p.id]: e.target.value }))
                            }
                            placeholder="0"
                            className="input-field w-20 py-1.5 text-sm text-right"
                          />
                          <span className="text-xs text-gray-400 w-14 shrink-0">
                            {p.unitType.toLowerCase()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Tab: Summary ──────────────────────────────────── */}
      {activeTab === "summary" && (
        <div className="space-y-4">
          {/* Pricing settings */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-3">Pricing Settings</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Markup %</label>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    min="1"
                    max="99"
                    step="1"
                    value={Math.round(markupPct * 100)}
                    onChange={(e) => {
                      const v = Math.min(99, Math.max(1, parseInt(e.target.value) || 1));
                      setMarkupPct(v / 100);
                    }}
                    className="input-field pr-7"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                </div>
                <p className="mt-1 text-xs text-gray-400">Factor: {(1 - markupPct).toFixed(2)}</p>
              </div>
              <div>
                <label className="label">Permit Cost</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    value={permitCost || ""}
                    onChange={(e) => setPermitCost(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="input-field pl-7"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Price breakdown */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-3">Price Breakdown</h2>
            <div className="space-y-2 text-sm">
              <Row label="Materials (marked up)" value={result.materialsCost} />
              <Row label="Labor (marked up)" value={result.laborCost} />
              {result.miscCost > 0 && <Row label="Permit" value={result.miscCost} />}
              <div className="border-t border-gray-100 pt-2 mt-2">
                <Row label={`Tax (${(estimateParams.taxRate * 100).toFixed(1)}% on materials)`} value={result.taxAmount} />
                <Row label="Fuel charge" value={result.fuelCharge} />
                <Row label="Overhead" value={result.overheadAmount} sub="capped at $2,000" />
              </div>
              <div className="border-t-2 border-gray-800 pt-2 mt-2">
                <div className="flex justify-between font-bold text-base">
                  <span>Cash Price</span>
                  <span className="text-brand-blue">{formatCurrency(result.cashPrice)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profit analysis */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-3">Profit Analysis</h2>
            <div className="space-y-2 text-sm">
              <Row label="Total profit" value={result.totalProfit} />
              <Row label={`PM split (${(estimateParams.pmSplitPct * 100).toFixed(0)}%)`} value={result.pmProfit} />
              <div className="flex justify-between text-gray-600">
                <span>Actual margin</span>
                <span className={`font-semibold ${result.actualProfitPct >= 0.2 ? "text-green-600" : "text-amber-600"}`}>
                  {(result.actualProfitPct * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Financing */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-3">Financing Options</h2>
            <div className="space-y-3">
              {result.payment12mo && (
                <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-green-800">12 months / 0%</p>
                    <p className="text-xs text-green-600">Same as cash</p>
                  </div>
                  <p className="text-base font-bold text-green-700">
                    {formatCurrency(result.payment12mo)}/mo
                  </p>
                </div>
              )}
              {result.payment60mo && (
                <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-blue-800">60 months / 7.99%</p>
                    <p className="text-xs text-blue-600">
                      Total financed: {formatCurrency(result.financedAmount)}
                    </p>
                  </div>
                  <p className="text-base font-bold text-blue-700">
                    {formatCurrency(result.payment60mo)}/mo
                  </p>
                </div>
              )}
              {result.payment120mo && (
                <div className="flex items-center justify-between rounded-lg bg-purple-50 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-purple-800">120 months / 7.99%</p>
                    <p className="text-xs text-purple-600">
                      Total financed: {formatCurrency(result.financedAmount)}
                    </p>
                  </div>
                  <p className="text-base font-bold text-purple-700">
                    {formatCurrency(result.payment120mo)}/mo
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">Credit card (+3%)</p>
                  <p className="text-xs text-gray-500">Convenience fee included</p>
                </div>
                <p className="text-base font-bold text-gray-700">
                  {formatCurrency(result.creditCardPrice)}
                </p>
              </div>
            </div>
          </div>

          {/* Raw cost detail */}
          <div className="card bg-gray-50">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Cost Detail (internal)
            </p>
            <div className="space-y-1 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Raw materials</span>
                <span>{formatCurrency(result.rawMaterialCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Raw labor</span>
                <span>{formatCurrency(result.rawLaborCost)}</span>
              </div>
            </div>
          </div>

          {/* Generate Bid */}
          <div className="space-y-2">
            <GenerateBidButton projectId={projectId} />
            <a
              href={`/projects/${projectId}/bid`}
              className="block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-center text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              View / Print Bid Sheet
            </a>
          </div>
        </div>
      )}

      {/* ── Sticky footer ─────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 z-10 border-t border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-gray-900 tabular-nums">
                {formatCurrency(result.cashPrice)}
              </span>
              <span className="text-xs text-gray-400">cash price</span>
            </div>
            {saveState === "saving" && (
              <p className="flex items-center gap-1 text-xs text-gray-400">
                <Loader2 className="h-3 w-3 animate-spin" /> Saving…
              </p>
            )}
            {saveState === "saved" && (
              <p className="flex items-center gap-1 text-xs text-green-600">
                <Check className="h-3 w-3" /> Saved
              </p>
            )}
            {saveState === "error" && (
              <p className="text-xs text-red-600">Save failed</p>
            )}
          </div>
          <button
            type="button"
            onClick={triggerSave}
            disabled={saveState === "saving"}
            className="btn-primary min-w-[80px] disabled:opacity-60"
          >
            {saveState === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

function Row({
  label,
  value,
  sub,
}: {
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <div className="flex justify-between text-gray-600">
      <span>
        {label}
        {sub && <span className="text-xs text-gray-400 ml-1">({sub})</span>}
      </span>
      <span className="font-medium text-gray-900">{formatCurrency(value)}</span>
    </div>
  );
}
