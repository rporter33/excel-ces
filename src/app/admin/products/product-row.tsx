"use client";

import { useState, useRef, useTransition } from "react";
import { updateProductPrice } from "@/lib/actions";
import { Check, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  unitCost: number;
  unitType: string;
  isActive: boolean;
  manufacturer: string | null;
}

export function ProductRow({ product }: { product: Product }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(product.unitCost.toFixed(2));
  const [displayCost, setDisplayCost] = useState(product.unitCost);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    setValue(displayCost.toFixed(2));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function cancel() {
    setEditing(false);
    setError(null);
  }

  function save() {
    const parsed = parseFloat(value);
    if (isNaN(parsed) || parsed < 0) { setError("Enter a valid price."); return; }
    if (parsed > 10000) { setError("Price seems too high — double check."); return; }
    setError(null);
    startTransition(async () => {
      const result = await updateProductPrice(product.id, parsed);
      if (result?.error) { setError(result.error); return; }
      setDisplayCost(parsed);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") save();
    if (e.key === "Escape") cancel();
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${!product.isActive ? "opacity-50" : ""}`}>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 leading-tight">{product.name}</p>
        {product.manufacturer && (
          <p className="text-xs text-gray-400 mt-0.5">{product.manufacturer}</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {editing ? (
          <>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
              <input
                ref={inputRef}
                type="number"
                min="0"
                step="0.01"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKey}
                className="input-field w-24 pl-5 py-1 text-sm text-right"
              />
            </div>
            <button
              onClick={save}
              disabled={isPending}
              className="btn-primary text-xs px-3 py-1.5 min-h-0 disabled:opacity-60"
            >
              {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
            </button>
            <button onClick={cancel} className="text-xs text-gray-400 hover:text-gray-600">
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={startEdit}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {saved && <Check className="h-3.5 w-3.5 text-green-600" />}
            <span className="tabular-nums">{formatCurrency(displayCost)}</span>
            <span className="text-xs text-gray-400">/{product.unitType.toLowerCase()}</span>
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-600 shrink-0">{error}</p>}
    </div>
  );
}
