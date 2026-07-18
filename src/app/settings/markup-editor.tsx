"use client";

import { useState, useTransition } from "react";
import { updateDefaultMarkup } from "@/lib/actions";
import { Check, Loader2 } from "lucide-react";

export function MarkupEditor({ userId, currentMarkup }: { userId: string; currentMarkup: number }) {
  const [value, setValue] = useState(Math.round(currentMarkup * 100));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save() {
    const pct = value / 100;
    if (pct < 0.01 || pct > 0.99) { setError("Must be between 1% and 99%."); return; }
    setError(null);
    startTransition(async () => {
      const result = await updateDefaultMarkup(userId, pct);
      if (result?.error) { setError(result.error); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 max-w-[120px]">
        <input
          type="number"
          min="1"
          max="99"
          value={value}
          onChange={(e) => setValue(parseInt(e.target.value) || 0)}
          className="input-field pr-7"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
      </div>
      <button
        type="button"
        onClick={save}
        disabled={isPending}
        className="btn-primary text-sm px-4 min-h-0 py-2 disabled:opacity-60"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : "Save"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
