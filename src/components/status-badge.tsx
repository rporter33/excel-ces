// src/components/status-badge.tsx
import { cn, STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        STATUS_COLORS[status] || "bg-gray-100 text-gray-600"
      )}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}
