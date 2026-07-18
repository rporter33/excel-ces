import { getProject } from "@/lib/actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MeasurementForm } from "./measurement-form";

export default async function MeasurementsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return notFound();

  const m = project.measurement;

  const initial = m
    ? {
        roofAreas: (m.roofAreas as Array<{ label: string; length: number; width: number }>) ?? [],
        ridgeLf: Number(m.ridgeLf),
        eavesLf: Number(m.eavesLf),
        iwShieldLf: Number(m.iwShieldLf),
        starterLf: Number(m.starterLf),
        rakeLf: Number(m.rakeLf),
        extraRakeLf: Number(m.extraRakeLf),
        valleyLf: Number(m.valleyLf),
        stepFlashingLf: Number(m.stepFlashingLf),
        counterFlashLf: Number(m.counterFlashLf),
        headwallFlashLf: Number(m.headwallFlashLf),
        pipeFlashings: (m.pipeFlashings as Array<{ size: string; count: number }>) ?? [],
        skylights: (m.skylights as { small?: number; medium?: number; large?: number }) ?? {},
        chimneyCount: m.chimneyCount,
        swampCoolerCt: m.swampCoolerCt,
        acCount: m.acCount,
        pitch: m.pitch ?? "",
        stories: m.stories,
        additionalLayers: m.additionalLayers,
        soffitType: m.soffitType ?? "",
        gutterSize: m.gutterSize ?? "",
        roofTypeRemoved: m.roofTypeRemoved ?? "",
        valleyType: m.valleyType ?? "",
        ridgeVentType: m.ridgeVentType ?? "",
        flashingColor: m.flashingColor ?? "",
      }
    : undefined;

  return (
    <div className="mx-auto max-w-xl px-4 py-6 pb-32">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/projects/${id}`}
          className="rounded-lg p-2 hover:bg-gray-100 -ml-2"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900">Measurements</h1>
          <p className="text-sm text-gray-500 truncate">{project.customerName}</p>
        </div>
      </div>

      <MeasurementForm projectId={id} initial={initial} />
    </div>
  );
}
