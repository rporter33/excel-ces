import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getUsers } from "@/lib/actions";
import { NewProjectForm } from "./new-project-form";

export default async function NewProjectPage() {
  const users = await getUsers();

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/projects" className="rounded-lg p-2 hover:bg-gray-100 -ml-2">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">New Project</h1>
      </div>

      <NewProjectForm users={users} />
    </div>
  );
}
