import { getProject } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EstimateForm } from "./estimate-form";

export default async function EstimatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [project, products] = await Promise.all([
    getProject(id),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    }),
  ]);

  if (!project) return notFound();

  // Serialize measurement — convert Prisma Decimals to numbers
  const m = project.measurement;
  const measurement = m
    ? {
        totalSquares: Number(m.totalSquares),
        totalSqFt: Number(m.totalSqFt),
        ridgeLf: Number(m.ridgeLf),
        eavesLf: Number(m.eavesLf),
        iwShieldLf: Number(m.iwShieldLf),
        starterLf: Number(m.starterLf),
        rakeLf: Number(m.rakeLf),
        valleyLf: Number(m.valleyLf),
        stepFlashingLf: Number(m.stepFlashingLf),
        counterFlashLf: Number(m.counterFlashLf),
        headwallFlashLf: Number(m.headwallFlashLf),
        chimneyCount: m.chimneyCount,
        swampCoolerCt: m.swampCoolerCt,
        acCount: m.acCount,
        stories: m.stories,
        additionalLayers: m.additionalLayers,
        gutterSize: m.gutterSize ?? null,
        pitch: m.pitch ?? null,
        skylights: (m.skylights ?? {}) as { small?: number; medium?: number; large?: number },
      }
    : null;

  // Serialize existing estimate
  const e = project.estimate;
  const existingEstimate = e
    ? {
        shingleColor: e.shingleColor ?? "",
        markupPct: Number(e.markupPct),
        taxRate: Number(e.taxRate),
        fuelCharge: Number(e.fuelCharge),
        overheadPct: Number(e.overheadPct),
        overheadCap: Number(e.overheadCap),
        pmSplitPct: Number(e.pmSplitPct),
        permitCost: Number(e.permitCost),
        salePriceOverride: e.salePriceOverride ? Number(e.salePriceOverride) : null,
        lineItems: e.lineItems.map((li) => ({
          productId: li.productId ?? null,
          productName: li.productName,
          category: li.category as string,
          unitCost: Number(li.unitCost),
          quantity: Number(li.quantity),
          unitType: li.unitType as string,
          layers: li.layers,
          isLabor: li.isLabor,
        })),
      }
    : null;

  // Serialize products
  const serializedProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category as string,
    manufacturer: p.manufacturer ?? null,
    unitCost: Number(p.unitCost),
    unitType: p.unitType as string,
    isLabor: p.isLabor,
    sortOrder: p.sortOrder,
  }));

  // Use PM's default markup for new estimates
  const pmDefaultMarkupPct = project.pm ? Number((project.pm as any).defaultMarkupPct ?? 0.30) : 0.30;

  return (
    <div className="mx-auto max-w-xl px-4 py-6 pb-32">
      <div className="flex items-center gap-3 mb-5">
        <Link
          href={`/projects/${id}`}
          className="rounded-lg p-2 hover:bg-gray-100 -ml-2"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900">Estimate</h1>
          <p className="text-sm text-gray-500 truncate">{project.customerName}</p>
        </div>
      </div>

      {!measurement && (
        <div className="mb-4 rounded-lg border-l-4 border-amber-400 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-800">Measurements required</p>
          <p className="text-sm text-amber-700 mt-0.5">
            Complete{" "}
            <Link href={`/projects/${id}/measurements`} className="underline font-medium">
              measurements
            </Link>{" "}
            first to auto-fill quantities.
          </p>
        </div>
      )}

      <EstimateForm
        projectId={id}
        measurement={measurement}
        products={serializedProducts}
        existingEstimate={existingEstimate}
        pmDefaultMarkupPct={pmDefaultMarkupPct}
      />
    </div>
  );
}
