// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export const STATUS_LABELS: Record<string, string> = {
  LEAD_RECEIVED: "Lead",
  MEASUREMENT_SCHEDULED: "Meas. Scheduled",
  MEASURED: "Measured",
  ESTIMATING: "Estimating",
  BID_CREATED: "Bid Created",
  BID_PRESENTED: "Bid Presented",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  MATERIALS_ORDERED: "Ordered",
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "In Progress",
  COMPLETE: "Complete",
  INVOICED: "Invoiced",
  PAID: "Paid",
  CLOSED: "Closed",
};

export const STATUS_COLORS: Record<string, string> = {
  LEAD_RECEIVED: "bg-gray-100 text-gray-700",
  MEASUREMENT_SCHEDULED: "bg-blue-50 text-blue-700",
  MEASURED: "bg-blue-100 text-blue-800",
  ESTIMATING: "bg-amber-50 text-amber-700",
  BID_CREATED: "bg-amber-100 text-amber-800",
  BID_PRESENTED: "bg-purple-100 text-purple-800",
  ACCEPTED: "bg-green-100 text-green-800",
  DECLINED: "bg-red-100 text-red-700",
  MATERIALS_ORDERED: "bg-indigo-100 text-indigo-800",
  SCHEDULED: "bg-cyan-100 text-cyan-800",
  IN_PROGRESS: "bg-orange-100 text-orange-800",
  COMPLETE: "bg-emerald-100 text-emerald-800",
  INVOICED: "bg-teal-100 text-teal-800",
  PAID: "bg-green-200 text-green-900",
  CLOSED: "bg-gray-200 text-gray-600",
};
