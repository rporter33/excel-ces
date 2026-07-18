-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('LEAD_RECEIVED', 'MEASUREMENT_SCHEDULED', 'MEASURED', 'ESTIMATING', 'BID_CREATED', 'BID_PRESENTED', 'ACCEPTED', 'DECLINED', 'MATERIALS_ORDERED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETE', 'INVOICED', 'PAID', 'CLOSED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PROJECT_MANAGER', 'SENIOR_PM', 'OFFICE_ADMIN', 'OPS_MANAGER', 'SYSTEM_ADMIN');

-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('TEAR_OFF', 'INSTALL', 'SHINGLE', 'UNDERLAYMENT', 'STARTER', 'HIP_RIDGE', 'DETAIL_METAL', 'DECKING', 'VENT', 'SBS', 'SEALANT', 'FASTENER', 'GUTTER', 'INSULATION', 'LIGHTING', 'MISC');

-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('SQUARE', 'LINEAR_FOOT', 'UNIT', 'SHEET', 'ROLL', 'EACH', 'BOX', 'CAN', 'BUNDLE');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('BID_STANDARD', 'BID_SENIOR', 'BID_OPEN', 'BID_REPAIR', 'MATERIAL_ORDER', 'ROOFER_INVOICE', 'JOB_ORDER', 'GUTTER_ORDER', 'ROOFER_INSTRUCTIONS', 'CUSTOMER_INVOICE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "clerk_id" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'PROJECT_MANAGER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "default_markup_pct" DECIMAL(5,4) NOT NULL DEFAULT 0.30,
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "zip" TEXT,
    "phone_primary" TEXT,
    "phone_secondary" TEXT,
    "email" TEXT,
    "po_number" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'LEAD_RECEIVED',
    "insurance_provider" TEXT,
    "claim_number" TEXT,
    "extended_warranty" BOOLEAN NOT NULL DEFAULT false,
    "previous_customer" BOOLEAN NOT NULL DEFAULT false,
    "municipality" TEXT,
    "permit_number" TEXT,
    "notes" TEXT,
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "pm_id" TEXT NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "measurements" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "roof_areas" JSONB NOT NULL DEFAULT '[]',
    "ridge_lf" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "eaves_lf" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "iw_shield_lf" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "starter_lf" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "rake_lf" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "extra_rake_lf" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "valley_lf" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "step_flashing_lf" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "counter_flash_lf" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "headwall_flash_lf" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "pipe_flashings" JSONB NOT NULL DEFAULT '[]',
    "skylights" JSONB NOT NULL DEFAULT '{}',
    "chimney_count" INTEGER NOT NULL DEFAULT 0,
    "swamp_cooler_count" INTEGER NOT NULL DEFAULT 0,
    "ac_count" INTEGER NOT NULL DEFAULT 0,
    "additional_layers" INTEGER NOT NULL DEFAULT 0,
    "pitch" TEXT,
    "stories" INTEGER NOT NULL DEFAULT 1,
    "soffit_type" TEXT,
    "gutter_size" TEXT,
    "roof_type_removed" TEXT,
    "ridge_vent_type" TEXT,
    "valley_type" TEXT,
    "flashing_color" TEXT,
    "total_sq_ft" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_squares" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "measurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimates" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "markup_pct" DECIMAL(5,4) NOT NULL DEFAULT 0.30,
    "pm_split_pct" DECIMAL(5,4) NOT NULL DEFAULT 0.44,
    "tax_rate" DECIMAL(5,4) NOT NULL DEFAULT 0.083,
    "fuel_charge" DECIMAL(10,2) NOT NULL DEFAULT 100,
    "overhead_pct" DECIMAL(5,4) NOT NULL DEFAULT 0.10,
    "overhead_cap" DECIMAL(10,2) NOT NULL DEFAULT 2000,
    "permit_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "sale_price_override" DECIMAL(10,2),
    "override_reason" TEXT,
    "shingle_color" TEXT,
    "cached_cash_price" DECIMAL(10,2),
    "estimated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estimates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimate_line_items" (
    "id" TEXT NOT NULL,
    "estimate_id" TEXT NOT NULL,
    "category" "ProductCategory" NOT NULL,
    "product_id" TEXT,
    "product_name" TEXT NOT NULL,
    "unit_cost" DECIMAL(10,2) NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit_type" "UnitType" NOT NULL DEFAULT 'UNIT',
    "layers" INTEGER NOT NULL DEFAULT 1,
    "is_labor" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estimate_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ProductCategory" NOT NULL,
    "manufacturer" TEXT,
    "unit_cost" DECIMAL(10,2) NOT NULL,
    "unit_type" "UnitType" NOT NULL DEFAULT 'UNIT',
    "is_labor" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "auto_populate_rule" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_price_history" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "old_price" DECIMAL(10,2) NOT NULL,
    "new_price" DECIMAL(10,2) NOT NULL,
    "changed_by_id" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shingle_colors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "shingle_colors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "template_version" TEXT,
    "file_url" TEXT,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generated_by_id" TEXT NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_clerk_id_key" ON "users"("clerk_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "projects_pm_id_idx" ON "projects"("pm_id");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE INDEX "projects_created_at_idx" ON "projects"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "measurements_project_id_key" ON "measurements"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "estimates_project_id_key" ON "estimates"("project_id");

-- CreateIndex
CREATE INDEX "estimate_line_items_estimate_id_idx" ON "estimate_line_items"("estimate_id");

-- CreateIndex
CREATE INDEX "products_category_idx" ON "products"("category");

-- CreateIndex
CREATE INDEX "product_price_history_product_id_idx" ON "product_price_history"("product_id");

-- CreateIndex
CREATE INDEX "documents_project_id_idx" ON "documents"("project_id");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_pm_id_fkey" FOREIGN KEY ("pm_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_estimated_by_id_fkey" FOREIGN KEY ("estimated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_line_items" ADD CONSTRAINT "estimate_line_items_estimate_id_fkey" FOREIGN KEY ("estimate_id") REFERENCES "estimates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_line_items" ADD CONSTRAINT "estimate_line_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_price_history" ADD CONSTRAINT "product_price_history_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_price_history" ADD CONSTRAINT "product_price_history_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_generated_by_id_fkey" FOREIGN KEY ("generated_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

