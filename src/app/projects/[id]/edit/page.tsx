import { getProject, getUsers } from "@/lib/actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EditForm } from "./edit-form";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, users] = await Promise.all([getProject(id), getUsers()]);
  if (!project) return notFound();

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/projects/${id}`} className="rounded-lg p-2 hover:bg-gray-100 -ml-2">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Edit Customer Info</h1>
      </div>

      <EditForm
        projectId={id}
        users={users}
        initial={{
          customerName: project.customerName,
          address: project.address ?? "",
          city: project.city ?? "",
          zip: project.zip ?? "",
          phonePrimary: project.phonePrimary ?? "",
          phoneSecondary: project.phoneSecondary ?? "",
          email: project.email ?? "",
          poNumber: project.poNumber ?? "",
          insuranceProvider: project.insuranceProvider ?? "",
          claimNumber: project.claimNumber ?? "",
          extendedWarranty: project.extendedWarranty,
          notes: project.notes ?? "",
          pmId: project.pmId,
        }}
      />
    </div>
  );
}
