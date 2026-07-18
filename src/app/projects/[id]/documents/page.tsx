import { getProject } from "@/lib/actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return notFound();

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/projects/${id}`} className="rounded-lg p-2 hover:bg-gray-100 -ml-2">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900">Documents</h1>
          <p className="text-sm text-gray-500 truncate">{project.customerName}</p>
        </div>
      </div>

      {project.documents.length === 0 ? (
        <div className="card flex flex-col items-center py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 mb-4">
            <FileText className="h-7 w-7 text-gray-400" />
          </div>
          <h2 className="font-semibold text-gray-900 mb-1">No documents yet</h2>
          <p className="text-sm text-gray-500 max-w-xs">
            Bids, material orders, and invoices will appear here once an estimate is complete.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {project.documents.map((doc) => (
            <div key={doc.id} className="card flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-blue/10">
                <FileText className="h-5 w-5 text-brand-blue" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">
                  {doc.type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                </p>
                <p className="text-xs text-gray-500">{formatDate(doc.generatedAt)}</p>
              </div>
              {doc.fileUrl && (
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-xs px-3 py-1.5 min-h-0"
                >
                  View
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
