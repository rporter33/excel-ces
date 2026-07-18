// src/lib/actions.ts
// Server actions for project creation, editing, and listing
"use server";

import { prisma } from "./db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { calculateEstimate, type LineItem } from "./pricing-engine";
import { auth } from "@clerk/nextjs/server";
import { requireDbUserAction } from "./auth";
import {
  canSeeAllProjects,
  canEditProductCatalog,
  canUpdateMarkup,
  canDeleteProject,
} from "./permissions";

// ─── AUTH HELPERS ────────────────────────────────────────────

/** Returns the logged-in DB User, or null if not authenticated / not linked. */
export async function getCurrentDbUser() {
  try {
    const { userId } = await auth();
    if (!userId) return null;
    return prisma.user.findUnique({ where: { clerkId: userId } });
  } catch {
    // Clerk not configured (missing env vars) — allow unauthenticated access in dev
    return null;
  }
}

/** Claim a DB User record for a newly-signed-in Clerk user. */
export async function claimUserRecord(clerkId: string, dbUserId: string) {
  // Verify the target record isn't already claimed
  const target = await prisma.user.findUnique({ where: { id: dbUserId } });
  if (!target) return { error: "User record not found." };
  if (target.clerkId && target.clerkId !== clerkId) {
    return { error: "This account is already linked to another login." };
  }
  await prisma.user.update({ where: { id: dbUserId }, data: { clerkId } });
  redirect("/projects");
}

// ─── VALIDATION SCHEMAS ─────────────────────────────────────

const CreateProjectSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  zip: z.string().optional(),
  phonePrimary: z.string().optional(),
  phoneSecondary: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  poNumber: z.string().optional(),
  insuranceProvider: z.string().optional(),
  claimNumber: z.string().optional(),
  extendedWarranty: z.boolean().optional(),
  notes: z.string().optional(),
  pmId: z.string().optional(),
});

const UpdateProjectSchema = CreateProjectSchema.partial().extend({
  id: z.string(),
  status: z.string().optional(),
});

// ─── PROJECT ACTIONS ────────────────────────────────────────

export async function createProject(formData: FormData) {
  const { dbUser: currentUser } = await requireDbUserAction();

  const raw = Object.fromEntries(formData.entries());
  const parsed = CreateProjectSchema.safeParse({
    ...raw,
    extendedWarranty: raw.extendedWarranty === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  // Resolve pmId — use provided value or fall back to current user
  let pmId = parsed.data.pmId;
  if (!pmId) {
    pmId = currentUser.id;
  }

  let project;
  try {
    project = await prisma.project.create({
      data: {
        ...parsed.data,
        pmId,
        email: parsed.data.email || null,
        status: "LEAD_RECEIVED",
        ...(currentUser ? { createdById: currentUser.id } : {}),
      },
    });
  } catch (e: any) {
    return { error: { _form: [e?.message ?? "Database error — project not saved."] } };
  }

  revalidatePath("/projects");
  return { success: true, projectId: project.id };
}

// Form-layer action: validates, creates, then redirects. Used by the new project page.
export async function createProjectForm(
  _prevState: Record<string, string[]> | null,
  formData: FormData
): Promise<Record<string, string[]> | null> {
  const result = await createProject(formData);
  if (result.success && result.projectId) {
    redirect(`/projects/${result.projectId}`);
  }
  return (result as any).error ?? { _form: ["Something went wrong. Please try again."] };
}

export async function updateProject(formData: FormData) {
  await requireDbUserAction();

  const raw = Object.fromEntries(formData.entries());
  const parsed = UpdateProjectSchema.safeParse({
    ...raw,
    extendedWarranty: raw.extendedWarranty === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { id, pmId, ...data } = parsed.data;

  await prisma.project.update({
    where: { id },
    data: {
      ...(data as any),
      email: data.email || undefined,
      ...(pmId ? { pmId } : {}),
    },
  });

  revalidatePath(`/projects/${id}`);
  revalidatePath("/projects");
  return { success: true, projectId: id };
}

// Form-layer action: validates, updates, then redirects. Used by the edit project page.
export async function updateProjectForm(
  _prevState: Record<string, string[]> | null,
  formData: FormData
): Promise<Record<string, string[]> | null> {
  const result = await updateProject(formData);
  if (result.success && result.projectId) {
    redirect(`/projects/${result.projectId}`);
  }
  return (result as any).error ?? { _form: ["Something went wrong. Please try again."] };
}

const VALID_STATUSES = [
  "LEAD_RECEIVED","MEASUREMENT_SCHEDULED","MEASURED","ESTIMATING",
  "BID_CREATED","BID_PRESENTED","ACCEPTED","DECLINED",
  "MATERIALS_ORDERED","SCHEDULED","IN_PROGRESS","COMPLETE",
  "INVOICED","PAID","CLOSED",
] as const;
type ProjectStatus = typeof VALID_STATUSES[number];

export async function updateProjectStatus(projectId: string, status: string) {
  await requireDbUserAction();

  if (!(VALID_STATUSES as readonly string[]).includes(status)) {
    return { error: `Invalid status: ${status}` };
  }
  await prisma.project.update({
    where: { id: projectId },
    data: { status: status as ProjectStatus },
  });
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
}

export async function getProjects(filters?: {
  status?: string;
  search?: string;
  pmId?: string;
}) {
  const currentUser = await getCurrentDbUser();
  const where: any = {};

  // PMs only see their own projects; senior/admin roles see all
  if (currentUser && !canSeeAllProjects(currentUser)) {
    where.pmId = currentUser.id;
  } else if (filters?.pmId) {
    where.pmId = filters.pmId;
  }

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.search) {
    where.OR = [
      { customerName: { contains: filters.search, mode: "insensitive" } },
      { address: { contains: filters.search, mode: "insensitive" } },
      { poNumber: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  where.deletedAt = null;

  return prisma.project.findMany({
    where,
    include: {
      pm: { select: { name: true } },
      estimate: {
        select: { salePriceOverride: true, cachedCashPrice: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
}

export async function getProject(id: string) {
  return prisma.project.findFirst({
    where: { id, deletedAt: null },
    include: {
      pm: true,
      measurement: true,
      estimate: {
        include: {
          lineItems: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
      documents: {
        orderBy: { generatedAt: "desc" },
      },
    },
  });
}

export async function deleteProject(id: string) {
  const { dbUser: current } = await requireDbUserAction();
  if (!canDeleteProject(current)) {
    return { error: "Not authorized to delete projects." };
  }
  await prisma.project.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  revalidatePath("/projects");
  return { success: true };
}

export async function updateProductPrice(productId: string, newPrice: number) {
  if (newPrice < 0 || newPrice > 10000) return { error: "Price out of valid range." };
  const { dbUser: current } = await requireDbUserAction();
  if (!canEditProductCatalog(current)) {
    return { error: "Not authorized to edit product prices." };
  }
  // Log the price change before updating
  const existing = await prisma.product.findUnique({ where: { id: productId } });
  if (existing) {
    await prisma.productPriceHistory.create({
      data: {
        productId,
        oldPrice: existing.unitCost,
        newPrice,
        ...(current ? { changedById: current.id } : {}),
      },
    });
  }
  await prisma.product.update({ where: { id: productId }, data: { unitCost: newPrice } });
  revalidatePath("/admin/products");
  revalidatePath("/projects");
}

export async function updateDefaultMarkup(userId: string, markupPct: number) {
  if (markupPct < 0.01 || markupPct > 0.99) return { error: "Markup must be between 1% and 99%." };
  const { dbUser: current } = await requireDbUserAction();
  if (!canUpdateMarkup(current, userId)) {
    return { error: "Not authorized." };
  }
  await prisma.user.update({ where: { id: userId }, data: { defaultMarkupPct: markupPct } });
  revalidatePath("/settings");
}

export async function getUsers() {
  return prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });
}

// ─── ESTIMATE ACTIONS ───────────────────────────────────────

export async function saveEstimate(formData: FormData) {
  const { dbUser: estimator } = await requireDbUserAction();

  const projectId = formData.get("projectId") as string;
  const lineItemsStr = formData.get("lineItems") as string;
  const shingleColor = (formData.get("shingleColor") as string) || null;
  const markupPct = parseFloat((formData.get("markupPct") as string) || "0.30") || 0.30;
  const permitCost = parseFloat((formData.get("permitCost") as string) || "0") || 0;
  const salePriceOverrideRaw = formData.get("salePriceOverride") as string;
  const salePriceOverride = salePriceOverrideRaw ? parseFloat(salePriceOverrideRaw) || null : null;

  if (!projectId) return { success: false as const, error: "Missing projectId" };

  let lineItems: Array<{
    productId: string | null;
    productName: string;
    category: string;
    unitCost: number;
    quantity: number;
    unitType: string;
    layers: number;
    isLabor: boolean;
  }> = [];
  try {
    lineItems = JSON.parse(lineItemsStr ?? "[]");
  } catch {
    /* empty */
  }

  // Compute and cache the current cash price
  const engineItems: LineItem[] = lineItems.map((li) => ({
    unitCost: li.unitCost,
    quantity: li.quantity,
    layers: li.layers ?? 1,
    isLabor: li.isLabor,
  }));
  const engineResult = calculateEstimate(engineItems, {
    markupPct,
    taxRate: 0.083,
    fuelCharge: 100,
    overheadPct: 0.10,
    overheadCap: 2000,
    pmSplitPct: 0.44,
    permitCost,
    salePriceOverride,
  });
  const cachedCashPrice = engineResult.cashPrice;
  const estimatedById = estimator.id;

  // Upsert the estimate header
  const estimate = await prisma.estimate.upsert({
    where: { projectId },
    create: { projectId, shingleColor, markupPct, permitCost, salePriceOverride, cachedCashPrice, estimatedById },
    update: { shingleColor, markupPct, permitCost, salePriceOverride, cachedCashPrice, estimatedById },
  });

  // Replace all line items (delete + recreate is simplest for full-form saves)
  await prisma.estimateLineItem.deleteMany({ where: { estimateId: estimate.id } });

  if (lineItems.length > 0) {
    await prisma.estimateLineItem.createMany({
      data: lineItems.map((li, i) => ({
        estimateId: estimate.id,
        category: li.category as any,
        productId: li.productId ?? null,
        productName: li.productName,
        unitCost: li.unitCost,
        quantity: li.quantity,
        unitType: (li.unitType ?? "SQUARE") as any,
        layers: li.layers ?? 1,
        isLabor: li.isLabor,
        sortOrder: i,
      })),
    });
  }

  // Advance status from MEASURED → ESTIMATING
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (project?.status === "MEASURED") {
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "ESTIMATING" },
    });
  }

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

// ─── MEASUREMENT ACTIONS ────────────────────────────────────

const MeasurementSchema = z.object({
  projectId: z.string(),
  roofAreas: z.string().default("[]"), // JSON string
  ridgeLf: z.coerce.number().min(0).default(0),
  eavesLf: z.coerce.number().min(0).default(0),
  iwShieldLf: z.coerce.number().min(0).default(0),
  starterLf: z.coerce.number().min(0).default(0),
  rakeLf: z.coerce.number().min(0).default(0),
  extraRakeLf: z.coerce.number().min(0).default(0),
  valleyLf: z.coerce.number().min(0).default(0),
  stepFlashingLf: z.coerce.number().min(0).default(0),
  counterFlashLf: z.coerce.number().min(0).default(0),
  headwallFlashLf: z.coerce.number().min(0).default(0),
  pipeFlashings: z.string().default("[]"), // JSON string
  skylights: z.string().default("{}"), // JSON string
  chimneyCount: z.coerce.number().int().min(0).default(0),
  swampCoolerCt: z.coerce.number().int().min(0).default(0),
  acCount: z.coerce.number().int().min(0).default(0),
  pitch: z.string().optional(),
  stories: z.coerce.number().int().min(1).default(1),
  additionalLayers: z.coerce.number().int().min(0).default(0),
  soffitType: z.string().optional(),
  gutterSize: z.string().optional(),
  roofTypeRemoved: z.string().optional(),
  valleyType: z.string().optional(),
  ridgeVentType: z.string().optional(),
  flashingColor: z.string().optional(),
});

export async function saveMeasurement(formData: FormData) {
  await requireDbUserAction();

  const raw = Object.fromEntries(formData.entries());
  const parsed = MeasurementSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const {
    projectId,
    roofAreas: roofAreasStr,
    pipeFlashings: pipeFlashingsStr,
    skylights: skylightsStr,
    iwShieldLf: rawIwShieldLf,
    ...data
  } = parsed.data;

  // Parse JSON fields
  let roofAreas: Array<{ label: string; length: number; width: number }> = [];
  let pipeFlashings: Array<{ size: string; count: number }> = [];
  let skylights: { small: number; medium: number; large: number } = { small: 0, medium: 0, large: 0 };
  try { roofAreas = JSON.parse(roofAreasStr); } catch { /* empty */ }
  try { pipeFlashings = JSON.parse(pipeFlashingsStr); } catch { /* empty */ }
  try { skylights = JSON.parse(skylightsStr); } catch { /* empty */ }

  const totalSqFt = roofAreas.reduce((sum, a) => sum + a.length * a.width, 0);
  const totalSquares = totalSqFt / 100;

  // Default I/W Shield to eaves LF if not explicitly set
  const iwShieldLf = rawIwShieldLf > 0 ? rawIwShieldLf : data.eavesLf;

  await prisma.measurement.upsert({
    where: { projectId },
    update: {
      ...data,
      roofAreas: roofAreas as any,
      pipeFlashings: pipeFlashings as any,
      skylights: skylights as any,
      iwShieldLf,
      totalSqFt,
      totalSquares,
    },
    create: {
      projectId,
      ...data,
      roofAreas: roofAreas as any,
      pipeFlashings: pipeFlashings as any,
      skylights: skylights as any,
      iwShieldLf,
      totalSqFt,
      totalSquares,
    },
  });

  // Update project status if still in early stages
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (project && ["LEAD_RECEIVED", "MEASUREMENT_SCHEDULED"].includes(project.status)) {
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "MEASURED" },
    });
  }

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

// ─── PDF ACTIONS ────────────────────────────────────────────

export async function generateBidPdf(projectId: string): Promise<
  { success: true; base64: string } | { success: false; error: string }
> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
    include: {
      pm: true,
      measurement: true,
      estimate: { include: { lineItems: { orderBy: { sortOrder: "asc" } } } },
    },
  });

  if (!project) return { success: false, error: "Project not found." };
  if (!project.estimate) {
    return { success: false, error: "No estimate found. Save an estimate first." };
  }

  const { renderBidPdf } = await import("./pdf/bid-template");

  const m = project.measurement;
  const shingleLine = project.estimate.lineItems.find((li) => li.category === "SHINGLE");
  const cashPrice = project.estimate.salePriceOverride
    ? Number(project.estimate.salePriceOverride)
    : Number(project.estimate.cachedCashPrice ?? 0);

  const now = new Date();
  const date = `${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}/${now.getFullYear()}`;

  const data = {
    date,
    projectId: project.id,
    pmName: project.pm.name,
    pmPhone: project.pm.phone,
    customerName: project.customerName,
    address: project.address,
    city: project.city,
    zip: project.zip,
    phonePrimary: project.phonePrimary,
    roofTypeRemoved: m?.roofTypeRemoved ?? null,
    shingleName: shingleLine?.productName ?? null,
    totalSquares: m ? Number(m.totalSquares).toFixed(1) : null,
    pitch: m?.pitch ?? null,
    stories: m?.stories ?? 1,
    hasValley: m ? Number(m.valleyLf) > 0 : false,
    cashPrice,
    isInsuranceJob: !!(project.insuranceProvider || project.claimNumber),
    extendedWarranty: project.extendedWarranty,
  };

  try {
    const buffer = await renderBidPdf(data);
    return { success: true, base64: buffer.toString("base64") };
  } catch (e: any) {
    return { success: false, error: e?.message ?? "PDF generation failed." };
  }
}

// ─── DASHBOARD ACTIONS ──────────────────────────────────────

const CLOSED_STATUSES = ["CLOSED", "DECLINED", "PAID"] as const;

export async function getDashboardData() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [activeProjects, estimatesThisWeek, allPmStats, statusCounts] =
    await Promise.all([
      // Active projects with line items for accurate margin calculation
      prisma.project.findMany({
        where: { status: { notIn: CLOSED_STATUSES as any }, deletedAt: null },
        include: {
          estimate: {
            select: {
              cachedCashPrice: true,
              markupPct: true,
              lineItems: { select: { unitCost: true, quantity: true, layers: true, isLabor: true } },
            },
          },
        },
      }),

      // Estimates created this week
      prisma.estimate.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),

      // PM performance this month
      prisma.user.findMany({
        where: { isActive: true },
        include: {
          projects: {
            where: { createdAt: { gte: startOfMonth }, deletedAt: null },
            include: {
              estimate: {
                select: {
                  cachedCashPrice: true,
                  lineItems: { select: { unitCost: true, quantity: true, layers: true, isLabor: true } },
                },
              },
            },
          },
        },
        orderBy: { name: "asc" },
      }),

      // Project counts by status (exclude soft-deleted)
      prisma.project.groupBy({
        by: ["status"],
        where: { deletedAt: null },
        _count: { id: true },
      }),
    ]);

  const pipelineValue = activeProjects.reduce((sum, p) => {
    return sum + (p.estimate?.cachedCashPrice ? Number(p.estimate.cachedCashPrice) : 0);
  }, 0);

  // Compute raw material + labor cost from line items for accurate margin
  function computeRawCosts(lineItems: { unitCost: any; quantity: any; layers: number; isLabor: boolean }[]) {
    let rawMat = 0, rawLabor = 0;
    for (const li of lineItems) {
      const raw = Number(li.unitCost) * Number(li.quantity) * (li.layers ?? 1);
      if (li.isLabor) rawLabor += raw;
      else rawMat += raw;
    }
    return { rawMat, rawLabor };
  }

  // Average margin = (cashPrice - rawMat - rawLabor) / cashPrice, month-to-date
  const estimatesWithData = activeProjects.filter(
    (p) => p.estimate?.cachedCashPrice && (p.estimate.lineItems?.length ?? 0) > 0
  );
  const avgMargin =
    estimatesWithData.length > 0
      ? estimatesWithData.reduce((sum, p) => {
          const cash = Number(p.estimate!.cachedCashPrice);
          const { rawMat, rawLabor } = computeRawCosts(p.estimate!.lineItems);
          return sum + (cash > 0 ? (cash - rawMat - rawLabor) / cash : 0);
        }, 0) / estimatesWithData.length
      : 0;

  const pmStats = allPmStats
    .map((pm) => {
      const volume = pm.projects.reduce(
        (sum, p) =>
          sum + (p.estimate?.cachedCashPrice ? Number(p.estimate.cachedCashPrice) : 0),
        0
      );
      const projectsWithData = pm.projects.filter(
        (p) => p.estimate?.cachedCashPrice && (p.estimate.lineItems?.length ?? 0) > 0
      );
      const avgMgn =
        projectsWithData.length > 0
          ? projectsWithData.reduce((sum, p) => {
              const cash = Number(p.estimate!.cachedCashPrice);
              const { rawMat, rawLabor } = computeRawCosts(p.estimate!.lineItems);
              return sum + (cash > 0 ? (cash - rawMat - rawLabor) / cash : 0);
            }, 0) / projectsWithData.length
          : 0;
      return {
        id: pm.id,
        name: pm.name,
        role: pm.role as string,
        jobCount: pm.projects.length,
        volume,
        avgMarginPct: avgMgn,
      };
    })
    .filter((pm) => pm.jobCount > 0)
    .sort((a, b) => b.volume - a.volume);

  const statusBreakdown = statusCounts
    .map((s) => ({ status: s.status as string, count: s._count.id }))
    .sort((a, b) => b.count - a.count);

  return {
    activeCount: activeProjects.length,
    pipelineValue,
    avgMargin,
    estimatesThisWeek,
    pmStats,
    statusBreakdown,
  };
}
