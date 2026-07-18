// src/app/projects/[id]/page.tsx
import { getProject } from "@/lib/actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Ruler, Calculator, FileText, ChevronRight } from "lucide-react";
import { StatusChanger } from "@/components/status-changer";
import { DeleteProjectButton } from "@/components/delete-project-button";
import { formatDate, formatCurrency } from "@/lib/utils";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) return notFound();

  const sections = [
    {
      label: "Measurements",
      href: `/projects/${id}/measurements`,
      icon: Ruler,
      status: project.measurement ? "Complete" : "Not started",
      complete: !!project.measurement,
    },
    {
      label: "Estimate",
      href: `/projects/${id}/estimate`,
      icon: Calculator,
      status: project.estimate
        ? project.estimate.cachedCashPrice
          ? formatCurrency(Number(project.estimate.cachedCashPrice))
          : `${project.estimate.lineItems.length} items`
        : "Not started",
      complete: !!project.estimate,
    },
    {
      label: "Documents",
      href: `/projects/${id}/documents`,
      icon: FileText,
      status: `${project.documents.length} generated`,
      complete: project.documents.length > 0,
    },
  ];

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/projects" className="rounded-lg p-2 hover:bg-gray-100 -ml-2">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">
            {project.customerName}
          </h1>
          {project.address && (
            <p className="text-sm text-gray-500 truncate">
              {project.address}{project.city ? `, ${project.city}` : ""} {project.zip}
            </p>
          )}
        </div>
        <StatusChanger projectId={project.id} current={project.status} />
      </div>

      {/* Quick Info Card */}
      <div className="card mb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          {project.poNumber && (
            <div>
              <span className="text-gray-500">PO #</span>
              <p className="font-medium">{project.poNumber}</p>
            </div>
          )}
          {project.pm && (
            <div>
              <span className="text-gray-500">PM</span>
              <p className="font-medium">{project.pm.name}</p>
            </div>
          )}
          {project.phonePrimary && (
            <div>
              <span className="text-gray-500">Phone</span>
              <p className="font-medium">
                <a href={`tel:${project.phonePrimary}`} className="text-brand-blue">
                  {project.phonePrimary}
                </a>
              </p>
            </div>
          )}
          {project.email && (
            <div>
              <span className="text-gray-500">Email</span>
              <p className="font-medium truncate">
                <a href={`mailto:${project.email}`} className="text-brand-blue">
                  {project.email}
                </a>
              </p>
            </div>
          )}
          <div>
            <span className="text-gray-500">Created</span>
            <p className="font-medium">{formatDate(project.createdAt)}</p>
          </div>
          {project.insuranceProvider && (
            <div>
              <span className="text-gray-500">Insurance</span>
              <p className="font-medium text-xs">{project.insuranceProvider}</p>
            </div>
          )}
        </div>
      </div>

      {/* Workflow Sections */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Workflow
      </h2>
      <div className="space-y-2 mb-6">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="card flex items-center gap-4 hover:ring-2 hover:ring-brand-blue/30 transition-all active:scale-[0.99]"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                section.complete ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-400"
              }`}
            >
              <section.icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">{section.label}</p>
              <p className="text-sm text-gray-500">{section.status}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-300" />
          </Link>
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <Link
          href={`/projects/${id}/edit`}
          className="btn-secondary w-full block text-center"
        >
          Edit Customer Info
        </Link>
        <DeleteProjectButton projectId={id} />
      </div>
    </div>
  );
}
