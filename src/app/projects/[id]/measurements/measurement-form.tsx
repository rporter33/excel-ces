"use client";

import { useState, useCallback, useRef } from "react";
import { saveMeasurement } from "@/lib/actions";
import { Plus, Trash2, Check, Loader2 } from "lucide-react";

type SaveState = "idle" | "saving" | "saved" | "error";

interface Area {
  key: string;
  label: string;
  length: string;
  width: string;
}

interface Pipe {
  key: string;
  size: string;
  count: string;
}

interface InitialData {
  roofAreas: Array<{ label: string; length: number; width: number }>;
  ridgeLf: number;
  eavesLf: number;
  iwShieldLf: number;
  starterLf: number;
  rakeLf: number;
  extraRakeLf: number;
  valleyLf: number;
  stepFlashingLf: number;
  counterFlashLf: number;
  headwallFlashLf: number;
  pipeFlashings: Array<{ size: string; count: number }>;
  skylights: { small?: number; medium?: number; large?: number };
  chimneyCount: number;
  swampCoolerCt: number;
  acCount: number;
  pitch: string;
  stories: number;
  additionalLayers: number;
  soffitType: string;
  gutterSize: string;
  roofTypeRemoved: string;
  valleyType: string;
  ridgeVentType: string;
  flashingColor: string;
}

interface Props {
  projectId: string;
  initial?: InitialData;
}

let keySeq = 100;
const nextKey = () => String(++keySeq);

function n(val: number) {
  return val > 0 ? String(val) : "";
}

// ─── Sub-components (defined outside to avoid remounting) ───

function LfField({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type="number"
        inputMode="decimal"
        name={name}
        placeholder="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field"
      />
    </div>
  );
}

function CountInput({
  label,
  name,
  value,
  onChange,
  small,
}: {
  label: string;
  name?: string;
  value: string;
  onChange: (v: string) => void;
  small?: boolean;
}) {
  return (
    <div>
      <label className={`label ${small ? "text-xs" : ""}`}>{label}</label>
      <input
        type="number"
        inputMode="numeric"
        name={name}
        placeholder="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`input-field ${small ? "text-sm" : ""}`}
      />
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────

export function MeasurementForm({ projectId, initial }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Roof areas
  const [areas, setAreas] = useState<Area[]>(() =>
    initial?.roofAreas?.length
      ? initial.roofAreas.map((a, i) => ({
          key: String(i),
          label: a.label,
          length: n(a.length),
          width: n(a.width),
        }))
      : [{ key: "0", label: "Main", length: "", width: "" }]
  );

  // Linear feet
  const [ridge, setRidge] = useState(n(initial?.ridgeLf ?? 0));
  const [eaves, setEaves] = useState(n(initial?.eavesLf ?? 0));
  const [iwShield, setIwShield] = useState(n(initial?.iwShieldLf ?? 0));
  const [iwLinked, setIwLinked] = useState(() => {
    if (!initial) return true;
    return initial.iwShieldLf === initial.eavesLf || initial.iwShieldLf === 0;
  });
  const [starter, setStarter] = useState(n(initial?.starterLf ?? 0));
  const [rake, setRake] = useState(n(initial?.rakeLf ?? 0));
  const [extraRake, setExtraRake] = useState(n(initial?.extraRakeLf ?? 0));
  const [valley, setValley] = useState(n(initial?.valleyLf ?? 0));
  const [stepFlashing, setStepFlashing] = useState(n(initial?.stepFlashingLf ?? 0));
  const [counterFlash, setCounterFlash] = useState(n(initial?.counterFlashLf ?? 0));
  const [headwallFlash, setHeadwallFlash] = useState(n(initial?.headwallFlashLf ?? 0));

  // Pipe flashings
  const [pipes, setPipes] = useState<Pipe[]>(() =>
    initial?.pipeFlashings?.length
      ? initial.pipeFlashings.map((p, i) => ({
          key: String(i),
          size: p.size,
          count: n(p.count),
        }))
      : []
  );

  // Skylights
  const [skySmall, setSkySmall] = useState(n(initial?.skylights?.small ?? 0));
  const [skyMedium, setSkyMedium] = useState(n(initial?.skylights?.medium ?? 0));
  const [skyLarge, setSkyLarge] = useState(n(initial?.skylights?.large ?? 0));

  // Counts
  const [chimney, setChimney] = useState(n(initial?.chimneyCount ?? 0));
  const [swampCooler, setSwampCooler] = useState(n(initial?.swampCoolerCt ?? 0));
  const [ac, setAc] = useState(n(initial?.acCount ?? 0));

  // Roof characteristics
  const [pitch, setPitch] = useState(initial?.pitch ?? "");
  const [stories, setStories] = useState(String(initial?.stories ?? 1));
  const [additionalLayers, setAdditionalLayers] = useState(String(initial?.additionalLayers ?? 0));
  const [soffitType, setSoffitType] = useState(initial?.soffitType ?? "");
  const [gutterSize, setGutterSize] = useState(initial?.gutterSize ?? "");
  const [roofTypeRemoved, setRoofTypeRemoved] = useState(initial?.roofTypeRemoved ?? "");
  const [valleyType, setValleyType] = useState(initial?.valleyType ?? "");
  const [ridgeVentType, setRidgeVentType] = useState(initial?.ridgeVentType ?? "");
  const [flashingColor, setFlashingColor] = useState(initial?.flashingColor ?? "");

  const [saveState, setSaveState] = useState<SaveState>("idle");

  // ── Computed ──────────────────────────────────────────────
  const totalSqFt = areas.reduce(
    (sum, a) => sum + (parseFloat(a.length) || 0) * (parseFloat(a.width) || 0),
    0
  );
  const totalSquares = totalSqFt / 100;

  // ── Save logic ────────────────────────────────────────────
  // triggerSave reads from formRef.current (always current DOM = React controlled state)
  const triggerSave = useCallback(async () => {
    if (!formRef.current) return;
    setSaveState("saving");
    const fd = new FormData(formRef.current);
    const result = await saveMeasurement(fd);
    if (result?.error) {
      setSaveState("error");
    } else {
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 3000);
    }
  }, []);

  // Debounce auto-save 1.2s after last blur
  const scheduleAutoSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(triggerSave, 1200);
  }, [triggerSave]);

  // ── Area helpers ──────────────────────────────────────────
  const addArea = () =>
    setAreas((prev) => [...prev, { key: nextKey(), label: "", length: "", width: "" }]);

  const removeArea = (key: string) =>
    setAreas((prev) => (prev.length > 1 ? prev.filter((a) => a.key !== key) : prev));

  const updateArea = (key: string, field: keyof Omit<Area, "key">, value: string) =>
    setAreas((prev) => prev.map((a) => (a.key === key ? { ...a, [field]: value } : a)));

  // ── Pipe helpers ──────────────────────────────────────────
  const addPipe = () =>
    setPipes((prev) => [...prev, { key: nextKey(), size: "", count: "" }]);

  const removePipe = (key: string) =>
    setPipes((prev) => prev.filter((p) => p.key !== key));

  const updatePipe = (key: string, field: keyof Omit<Pipe, "key">, value: string) =>
    setPipes((prev) => prev.map((p) => (p.key === key ? { ...p, [field]: value } : p)));

  // ── Eaves / IW Shield link ────────────────────────────────
  const handleEavesChange = (val: string) => {
    setEaves(val);
    if (iwLinked) setIwShield(val);
  };

  const handleIwShieldChange = (val: string) => {
    setIwShield(val);
    setIwLinked(false);
  };

  // ── Hidden input JSON values ──────────────────────────────
  const roofAreasJson = JSON.stringify(
    areas.map((a) => ({
      label: a.label,
      length: parseFloat(a.length) || 0,
      width: parseFloat(a.width) || 0,
    }))
  );
  const pipeFlashingsJson = JSON.stringify(
    pipes.map((p) => ({ size: p.size, count: parseInt(p.count) || 0 }))
  );
  const skylightsJson = JSON.stringify({
    small: parseInt(skySmall) || 0,
    medium: parseInt(skyMedium) || 0,
    large: parseInt(skyLarge) || 0,
  });

  return (
    <>
      <form
        ref={formRef}
        onBlur={scheduleAutoSave}
        onSubmit={(e) => {
          e.preventDefault();
          triggerSave();
        }}
      >
        {/* Hidden JSON fields — controlled, always in sync with state */}
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="roofAreas" value={roofAreasJson} />
        <input type="hidden" name="pipeFlashings" value={pipeFlashingsJson} />
        <input type="hidden" name="skylights" value={skylightsJson} />

        {/* ── Section 1: Roof Areas ───────────────────────── */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Roof Areas</h2>
            <button
              type="button"
              onClick={addArea}
              className="flex items-center gap-1 text-sm font-medium text-brand-blue active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Add Area
            </button>
          </div>

          <div className="space-y-3">
            {areas.map((area, idx) => {
              const sqFt =
                (parseFloat(area.length) || 0) * (parseFloat(area.width) || 0);
              return (
                <div key={area.key} className="rounded-lg bg-gray-50 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      placeholder={`Area ${idx + 1} label`}
                      value={area.label}
                      onChange={(e) => updateArea(area.key, "label", e.target.value)}
                      className="input-field flex-1 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeArea(area.key)}
                      disabled={areas.length === 1}
                      className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="label text-xs">Length (ft)</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        placeholder="0"
                        value={area.length}
                        onChange={(e) => updateArea(area.key, "length", e.target.value)}
                        className="input-field py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="label text-xs">Width (ft)</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        placeholder="0"
                        value={area.width}
                        onChange={(e) => updateArea(area.key, "width", e.target.value)}
                        className="input-field py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="label text-xs">Sq Ft</label>
                      <div className="input-field py-2 text-sm bg-gray-100 text-gray-600 select-none">
                        {sqFt > 0 ? sqFt.toFixed(0) : "—"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Section 2: Linear Feet ──────────────────────── */}
        <div className="card mb-4">
          <h2 className="font-semibold text-gray-900 mb-3">Linear Feet</h2>
          <div className="grid grid-cols-2 gap-3">
            <LfField label="Ridge" name="ridgeLf" value={ridge} onChange={setRidge} />

            <div>
              <label className="label">Eaves</label>
              <input
                type="number"
                inputMode="decimal"
                name="eavesLf"
                placeholder="0"
                value={eaves}
                onChange={(e) => handleEavesChange(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">I/W Shield</span>
                {iwLinked ? (
                  <span className="text-xs font-medium text-green-600">= Eaves</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIwLinked(true);
                      setIwShield(eaves);
                    }}
                    className="text-xs font-medium text-brand-blue"
                  >
                    Sync to eaves
                  </button>
                )}
              </div>
              <input
                type="number"
                inputMode="decimal"
                name="iwShieldLf"
                placeholder="0"
                value={iwShield}
                onChange={(e) => handleIwShieldChange(e.target.value)}
                className="input-field"
              />
            </div>

            <LfField label="Starter" name="starterLf" value={starter} onChange={setStarter} />
            <LfField label="Rake" name="rakeLf" value={rake} onChange={setRake} />
            <LfField label="Extra Rake" name="extraRakeLf" value={extraRake} onChange={setExtraRake} />
            <LfField label="Valley" name="valleyLf" value={valley} onChange={setValley} />
            <LfField label="Step Flashing" name="stepFlashingLf" value={stepFlashing} onChange={setStepFlashing} />
            <LfField label="Counter Flash" name="counterFlashLf" value={counterFlash} onChange={setCounterFlash} />
            <LfField label="Headwall Flash" name="headwallFlashLf" value={headwallFlash} onChange={setHeadwallFlash} />
          </div>
        </div>

        {/* ── Section 3: Flashings & Penetrations ────────── */}
        <div className="card mb-4">
          <h2 className="font-semibold text-gray-900 mb-4">Flashings & Penetrations</h2>

          {/* Pipe flashings */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Pipe Flashings</h3>
              <button
                type="button"
                onClick={addPipe}
                className="flex items-center gap-1 text-sm font-medium text-brand-blue"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>
            {pipes.length === 0 && (
              <p className="text-sm text-gray-400 italic">None — tap Add to enter pipe flashings</p>
            )}
            <div className="space-y-2">
              {pipes.map((pipe) => (
                <div key={pipe.key} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder='Size (e.g. 3")'
                    value={pipe.size}
                    onChange={(e) => updatePipe(pipe.key, "size", e.target.value)}
                    className="input-field flex-1 py-2 text-sm"
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="Qty"
                    value={pipe.count}
                    onChange={(e) => updatePipe(pipe.key, "count", e.target.value)}
                    className="input-field w-20 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removePipe(pipe.key)}
                    className="p-2 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Skylights */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Skylights</h3>
            <div className="grid grid-cols-3 gap-2">
              <CountInput label="Small" value={skySmall} onChange={setSkySmall} small />
              <CountInput label="Medium" value={skyMedium} onChange={setSkyMedium} small />
              <CountInput label="Large" value={skyLarge} onChange={setSkyLarge} small />
            </div>
          </div>

          {/* Other penetrations */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Other</h3>
            <div className="grid grid-cols-3 gap-2">
              <CountInput label="Chimney" name="chimneyCount" value={chimney} onChange={setChimney} small />
              <CountInput label="Swamp Cooler" name="swampCoolerCt" value={swampCooler} onChange={setSwampCooler} small />
              <CountInput label="A/C Unit" name="acCount" value={ac} onChange={setAc} small />
            </div>
          </div>
        </div>

        {/* ── Section 4: Roof Characteristics ────────────── */}
        <div className="card mb-4">
          <h2 className="font-semibold text-gray-900 mb-3">Roof Characteristics</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Pitch</label>
              <select
                name="pitch"
                value={pitch}
                onChange={(e) => setPitch(e.target.value)}
                className="input-field"
              >
                <option value="">Select</option>
                {["4/12","5/12","6/12","7/12","8/12","9/12","10/12","11/12","12/12"].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Stories</label>
              <select
                name="stories"
                value={stories}
                onChange={(e) => setStories(e.target.value)}
                className="input-field"
              >
                <option value="1">1 Story</option>
                <option value="2">2 Stories</option>
                <option value="3">3 Stories</option>
              </select>
            </div>

            <div>
              <label className="label">Add&apos;l Layers</label>
              <select
                name="additionalLayers"
                value={additionalLayers}
                onChange={(e) => setAdditionalLayers(e.target.value)}
                className="input-field"
              >
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </div>

            <div>
              <label className="label">Valley Type</label>
              <select
                name="valleyType"
                value={valleyType}
                onChange={(e) => setValleyType(e.target.value)}
                className="input-field"
              >
                <option value="">Select</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="label">Gutter Size</label>
              <select
                name="gutterSize"
                value={gutterSize}
                onChange={(e) => setGutterSize(e.target.value)}
                className="input-field"
              >
                <option value="">No gutters</option>
                <option value='5"'>5&quot;</option>
                <option value='6"'>6&quot;</option>
              </select>
            </div>

            <div>
              <label className="label">Soffit Type</label>
              <input
                type="text"
                name="soffitType"
                placeholder="e.g. Vented"
                value={soffitType}
                onChange={(e) => setSoffitType(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="label">Roof Type Removed</label>
              <input
                type="text"
                name="roofTypeRemoved"
                placeholder="e.g. Asphalt"
                value={roofTypeRemoved}
                onChange={(e) => setRoofTypeRemoved(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="label">Ridge Vent Type</label>
              <input
                type="text"
                name="ridgeVentType"
                placeholder="e.g. ShingleVent"
                value={ridgeVentType}
                onChange={(e) => setRidgeVentType(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="col-span-2">
              <label className="label">Flashing Color</label>
              <input
                type="text"
                name="flashingColor"
                placeholder="e.g. Brown, Galvanized"
                value={flashingColor}
                onChange={(e) => setFlashingColor(e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </div>
      </form>

      {/* ── Sticky footer ───────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 z-10 border-t border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900 tabular-nums">
                {totalSquares.toFixed(2)}
              </span>
              <span className="text-sm text-gray-500">squares</span>
              <span className="text-xs text-gray-400">
                ({totalSqFt.toFixed(0)} sq ft)
              </span>
            </div>
            {saveState === "saving" && (
              <p className="flex items-center gap-1 text-xs text-gray-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving…
              </p>
            )}
            {saveState === "saved" && (
              <p className="flex items-center gap-1 text-xs text-green-600">
                <Check className="h-3 w-3" />
                Saved
              </p>
            )}
            {saveState === "error" && (
              <p className="text-xs text-red-600">Save failed — try again</p>
            )}
          </div>

          <button
            type="button"
            onClick={triggerSave}
            disabled={saveState === "saving"}
            className="btn-primary min-w-[80px] disabled:opacity-60"
          >
            {saveState === "saving" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>
    </>
  );
}
