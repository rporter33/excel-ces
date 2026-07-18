"use client";

import { useState } from "react";
import { generateBidPdf } from "@/lib/actions";
import { FileDown, Loader2 } from "lucide-react";

export function GenerateBidButton({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const result = await generateBidPdf(projectId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      // Open PDF in a new tab via data URL
      const url = `data:application/pdf;base64,${result.base64}`;
      window.open(url, "_blank");
    } catch {
      setError("Failed to generate PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-brand-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-navy/90 disabled:opacity-60 transition-opacity"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileDown className="h-4 w-4" />
        )}
        {loading ? "Generating PDF…" : "Generate Bid PDF"}
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
