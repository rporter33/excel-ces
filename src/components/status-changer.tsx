"use client";

import { useState, useTransition } from "react";
import { updateProjectStatus } from "@/lib/actions";
import { STATUS_LABELS, STATUS_COLORS, cn } from "@/lib/utils";
import { ChevronDown, Loader2 } from "lucide-react";

const ALL_STATUSES = [
  "LEAD_RECEIVED", "MEASUREMENT_SCHEDULED", "MEASURED", "ESTIMATING",
  "BID_CREATED", "BID_PRESENTED", "ACCEPTED", "DECLINED",
  "MATERIALS_ORDERED", "SCHEDULED", "IN_PROGRESS", "COMPLETE",
  "INVOICED", "PAID", "CLOSED",
];

export function StatusChanger({ projectId, current }: { projectId: string; current: string }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(current);
  const [isPending, startTransition] = useTransition();

  function select(next: string) {
    setOpen(false);
    if (next === status) return;
    setStatus(next);
    startTransition(async () => { await updateProjectStatus(projectId, next); });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-opacity",
          STATUS_COLORS[status] || "bg-gray-100 text-gray-600",
          isPending && "opacity-60"
        )}
      >
        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
        {STATUS_LABELS[status] || status}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-52 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => select(s)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50",
                  s === status && "bg-gray-50 font-medium"
                )}
              >
                <span className={cn("h-2 w-2 rounded-full shrink-0", STATUS_COLORS[s]?.split(" ")[0])} />
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
