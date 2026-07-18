// src/app/admin/products/page.tsx
// Product catalog admin — lets authorized users update unit costs.
// Accessible from Settings → Manage Product Catalog (admin roles)
// or directly from the bottom nav for demo convenience.
import { prisma } from "@/lib/db";
import { requireDbUser } from "@/lib/auth";
import { canEditProductCatalog } from "@/lib/permissions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductRow } from "./product-row";

const CATEGORY_LABELS: Record<string, string> = {
  TEAR_OFF: "Tear-Off Labor", INSTALL: "Install Labor", SHINGLE: "Shingles",
  UNDERLAYMENT: "Underlayment", STARTER: "Starter Strip", HIP_RIDGE: "Hip & Ridge",
  DETAIL_METAL: "Detail Metal", DECKING: "Decking", VENT: "Roof Vents",
  SBS: "SBS / I&W Shield", SEALANT: "Sealant", FASTENER: "Fasteners",
  GUTTER: "Gutters", INSULATION: "Insulation", MISC: "Misc",
};

const CATEGORY_ORDER = [
  "SHINGLE", "TEAR_OFF", "INSTALL", "UNDERLAYMENT", "STARTER", "HIP_RIDGE",
  "DETAIL_METAL", "VENT", "SBS", "SEALANT", "FASTENER", "DECKING", "MISC",
];

export default async function ProductsAdminPage() {
  const { dbUser: user } = await requireDbUser();

  if (!canEditProductCatalog(user)) {
    redirect("/unauthorized");
  }

  const products = await prisma.product.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });

  // Group by category in display order
  const grouped = new Map<string, typeof products>();
  for (const cat of CATEGORY_ORDER) {
    const items = products.filter((p) => p.category === cat);
    if (items.length > 0) grouped.set(cat, items);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/settings" className="rounded-lg p-2 hover:bg-gray-100 -ml-2">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900">Product Catalog</h1>
          <p className="text-sm text-gray-500">{products.length} products · click a price to edit</p>
        </div>
      </div>

      <div className="space-y-6">
        {Array.from(grouped.entries()).map(([cat, items]) => (
          <div key={cat} className="card overflow-hidden p-0">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">
                {CATEGORY_LABELS[cat] ?? cat}
              </h2>
            </div>
            <div className="divide-y divide-gray-50">
              {items.map((p) => (
                <ProductRow key={p.id} product={{
                  id: p.id,
                  name: p.name,
                  unitCost: Number(p.unitCost),
                  unitType: p.unitType,
                  isActive: p.isActive,
                  manufacturer: p.manufacturer ?? null,
                }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
