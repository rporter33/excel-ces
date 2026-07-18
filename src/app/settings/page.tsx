// src/app/settings/page.tsx
import { prisma } from "@/lib/db";
import { requireDbUser } from "@/lib/auth";
import Link from "next/link";
import { UserCog } from "lucide-react";
import { MarkupEditor } from "./markup-editor";

export default async function SettingsPage() {
  const { dbUser: user } = await requireDbUser();

  // Reload with full data
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, email: true, role: true, defaultMarkupPct: true },
  });
  if (!fullUser) return null;

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-navy text-white">
          <UserCog className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">{fullUser.name} · {fullUser.role.replace(/_/g, " ").toLowerCase()}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">My Defaults</h2>

          <div>
            <p className="text-xs text-gray-500 mb-1">Name</p>
            <p className="font-medium text-gray-900">{fullUser.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Email</p>
            <p className="font-medium text-gray-900">{fullUser.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2">Default Markup %</p>
            <MarkupEditor userId={fullUser.id} currentMarkup={Number(fullUser.defaultMarkupPct)} />
            <p className="mt-1 text-xs text-gray-400">
              New estimates will start with this markup. You can still change it per job.
            </p>
          </div>
        </div>

        {["SYSTEM_ADMIN", "OPS_MANAGER", "OFFICE_ADMIN"].includes(fullUser.role) && (
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Admin</h2>
            <Link href="/admin/products" className="btn-secondary w-full text-center block text-sm">
              Manage Product Catalog
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
