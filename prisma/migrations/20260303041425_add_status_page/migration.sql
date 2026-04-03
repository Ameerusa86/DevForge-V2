-- CreateEnum
CREATE TYPE "StatusLevel" AS ENUM ('OPERATIONAL', 'DEGRADED', 'PARTIAL_OUTAGE', 'MAJOR_OUTAGE', 'MINOR', 'MAJOR', 'CRITICAL', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "system_status" (
    "id" TEXT NOT NULL,
    "status" "StatusLevel" NOT NULL DEFAULT 'OPERATIONAL',
    "message" TEXT,
    "lastChecked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "StatusLevel" NOT NULL DEFAULT 'OPERATIONAL',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'INVESTIGATING',
    "severity" "StatusLevel" NOT NULL DEFAULT 'MINOR',
    "affectedServices" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_update" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "IncidentStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_update_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_window" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "affectedServices" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_window_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_order_idx" ON "service"("order");

-- CreateIndex
CREATE INDEX "service_isActive_idx" ON "service"("isActive");

-- CreateIndex
CREATE INDEX "incident_status_idx" ON "incident"("status");

-- CreateIndex
CREATE INDEX "incident_startedAt_idx" ON "incident"("startedAt");

-- CreateIndex
CREATE INDEX "incident_update_incidentId_idx" ON "incident_update"("incidentId");

-- CreateIndex
CREATE INDEX "incident_update_createdAt_idx" ON "incident_update"("createdAt");

-- CreateIndex
CREATE INDEX "maintenance_window_scheduledStart_idx" ON "maintenance_window"("scheduledStart");

-- CreateIndex
CREATE INDEX "maintenance_window_status_idx" ON "maintenance_window"("status");

-- AddForeignKey
ALTER TABLE "incident_update" ADD CONSTRAINT "incident_update_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
