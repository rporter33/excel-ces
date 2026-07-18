// src/app/projects/page.tsx
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { getProjects } from "@/lib/actions";
import { requireDbUser } from "@/lib/auth";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatCurrency } from "@/lib/utils";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireDbUser(); // enforces sign-in; return value unused here
  const params = await searchParams;
  const projects = await getProjects({
    status: params.status,
    search: params.q,
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/projects/new" className="btn-primary gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Project</span>
        </Link>
      </div>

      {/* Search */}
      <form className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            name="q"
            type="search"
            placeholder="Search by customer, address, or PO#..."
            defaultValue={params.q}
            className="input-field pl-10"
          />
        </div>
      </form>

      {/* Status Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-4 px-4 scrollbar-hide">
        {["ALL", "LEAD_RECEIVED", "MEASURED", "BID_CREATED", "ACCEPTED", "IN_PROGRESS", "COMPLETE"].map(
          (status) => (
            <Link
              key={status}
              href={status === "ALL" ? "/projects" : `/projects?status=${status}`}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                (status === "ALL" && !params.status) || params.status === status
                  ? "bg-brand-blue text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {status === "ALL" ? "All" : status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
            </Link>
          )
        )}
      </div>

      {/* Project Cards */}
      {projects.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">No projects found</p>
          <Link href="/projects/new" className="btn-primary">
            Create your first project
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="card block hover:ring-brand-blue/30 hover:ring-2 transition-all active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {project.customerName}
                  </h3>
                  {project.address && (
                    <p className="text-sm text-gray-500 truncate mt-0.5">
                      {project.address}
                      {project.city && `, ${project.city}`}
                      {project.zip && ` ${project.zip}`}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    {project.pm && <span>PM: {project.pm.name}</span>}
                    <span>{formatDate(project.updatedAt)}</span>
                    {project.poNumber && <span>PO: {project.poNumber}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <StatusBadge status={project.status} />
                  {project.estimate?.cachedCashPrice && (
                    <span className="text-sm font-semibold text-gray-700 tabular-nums">
                      {formatCurrency(Number(project.estimate.cachedCashPrice))}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
