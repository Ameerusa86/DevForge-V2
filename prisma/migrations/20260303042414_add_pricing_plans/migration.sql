-- CreateTable
CREATE TABLE "pricing_plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "billingPeriod" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "buttonText" TEXT NOT NULL DEFAULT 'Get Started',
    "buttonLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_feature" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "included" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_feature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pricing_plan_isActive_idx" ON "pricing_plan"("isActive");

-- CreateIndex
CREATE INDEX "pricing_plan_order_idx" ON "pricing_plan"("order");

-- CreateIndex
CREATE INDEX "pricing_feature_planId_idx" ON "pricing_feature"("planId");

-- CreateIndex
CREATE INDEX "pricing_feature_order_idx" ON "pricing_feature"("order");

-- AddForeignKey
ALTER TABLE "pricing_feature" ADD CONSTRAINT "pricing_feature_planId_fkey" FOREIGN KEY ("planId") REFERENCES "pricing_plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
