import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getUsers } from "@/lib/actions";
import { NewProjectForm } from "./new-project-form";

// Per-user, auth-gated page that reads the DB (getUsers) — must render at
// request time, never be prerendered at build. Without this, `next build`
// tries to statically generate it and fails when DATABASE_URL is absent
// (e.g. Vercel Preview deployments, which don't get Production-scoped env vars).
export const dynamic = "force-dynamic";

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
