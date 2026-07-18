// src/app/dashboard/page.tsx
// Leadership dashboard — SENIOR_PM and above only.
// PROJECT_MANAGERs are redirected to /projects.

import { requireDbUser, hasDashboardAccess } from "@/lib/auth";
import { getDashboardData } from "@/lib/actions";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { BarChart2, Briefcase, DollarSign, TrendingUp } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  LEAD_RECEIVED: "Lead Received",
  MEASUREMENT_SCHEDULED: "Meas. Scheduled",
  MEASURED: "Measured",
  ESTIMATING: "Estimating",
  BID_CREATED: "Bid Created",
  BID_PRESENTED: "Bid Presented",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  MATERIALS_ORDERED: "Materials Ordered",
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "In Progress",
  COMPLETE: "Complete",
  INVOICED: "Invoiced",
  PAID: "Paid",
  CLOSED: "Closed",
};

const STATUS_COLORS: Record<string, string> = {
  LEAD_RECEIVED: "bg-gray-400",
  MEASUREMENT_SCHEDULED: "bg-blue-300",
  MEASURED: "bg-blue-500",
  ESTIMATING: "bg-indigo-400",
  BID_CREATED: "bg-violet-500",
  BID_PRESENTED: "bg-purple-500",
  ACCEPTED: "bg-green-500",
  DECLINED: "bg-red-400",
  IN_PROGRESS: "bg-orange-500",
  COMPLETE: "bg-emerald-500",
  INVOICED: "bg-teal-500",
  PAID: "bg-green-600",
  CLOSED: "bg-gray-500",
};

function monthYear() {
  return new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default async function DashboardPage() {
  const { dbUser } = await requireDbUser();

  if (!hasDashboardAccess(dbUser)) {
    redirect("/projects");
  }

  const data = await getDashboardData();
  const maxCount = Math.max(...data.statusBreakdown.map((s) => s.count), 1);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Leadership Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">{monthYear()} · all project managers</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
        <KpiCard
          icon={<Briefcase className="h-5 w-5 text-blue-600" />}
          label="Active Projects"
          value={data.activeCount.toString()}
        />
        <KpiCard
          icon={<DollarSign className="h-5 w-5 text-green-600" />}
          label="Pipeline Value"
          value={formatCurrency(data.pipelineValue)}
        />
        <KpiCard
          icon={<TrendingUp className="h-5 w-5 text-purple-600" />}
          label="Avg Margin"
          value={`${(data.avgMargin * 100).toFixed(1)}%`}
        />
        <KpiCard
          icon={<BarChart2 className="h-5 w-5 text-orange-600" />}
          label="Estimates This Week"
          value={data.estimatesThisWeek.toString()}
        />
      </div>

      {/* Main content: 60/40 split */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* PM Performance — 60% */}
        <div className="lg:flex-[3] card p-0 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">PM Performance — {monthYear()}</h2>
          </div>
          {data.pmStats.length === 0 ? (
            <p className="px-4 py-8 text-sm text-gray-400 text-center">No jobs this month</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">PM Name</th>
                    <th className="px-4 py-2.5 text-right font-medium text-gray-500">Jobs</th>
                    <th className="px-4 py-2.5 text-right font-medium text-gray-500">Volume</th>
                    <th className="px-4 py-2.5 text-right font-medium text-gray-500">Avg Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.pmStats.map((pm) => (
                    <tr key={pm.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{pm.name}</td>
                      <td className="px-4 py-3 text-right text-gray-600 tabular-nums">{pm.jobCount}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 tabular-nums">
                        {formatCurrency(pm.volume)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            pm.avgMarginPct >= 0.3
                              ? "bg-green-100 text-green-700"
                              : pm.avgMarginPct >= 0.2
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {(pm.avgMarginPct * 100).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pipeline by Status — 40% */}
        <div className="lg:flex-[2] card p-0 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Pipeline by Status</h2>
          </div>
          {data.statusBreakdown.length === 0 ? (
            <p className="px-4 py-8 text-sm text-gray-400 text-center">No projects</p>
          ) : (
            <div className="px-4 py-3 space-y-3">
              {data.statusBreakdown.map((s) => (
                <div key={s.status}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600">{STATUS_LABELS[s.status] ?? s.status}</span>
                    <span className="font-semibold text-gray-900 tabular-nums">{s.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${STATUS_COLORS[s.status] ?? "bg-blue-500"}`}
                      style={{ width: `${Math.max(4, (s.count / maxCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="card flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900 tabular-nums leading-none">{value}</p>
    </div>
  );
}
