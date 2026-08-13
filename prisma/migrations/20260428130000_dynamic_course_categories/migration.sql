-- AlterTable
ALTER TABLE "course" ALTER COLUMN "category" TYPE text USING "category"::text;

-- CreateTable
CREATE TABLE "course_category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT DEFAULT 'BookOpen',
    "color" TEXT DEFAULT 'text-[#ff6636]',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_category_slug_key" ON "course_category"("slug");

-- CreateIndex
CREATE INDEX "course_category_order_idx" ON "course_category"("order");

-- CreateIndex
CREATE INDEX "course_category_isActive_idx" ON "course_category"("isActive");
