import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Get or create system status
    let systemStatus = await prisma.systemStatus.findFirst();

    if (!systemStatus) {
      systemStatus = await prisma.systemStatus.create({
        data: {
          status: "OPERATIONAL",
          message: "All systems operational",
        },
      });
    }

    // Get active services
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
      },
    });

    // Get active incidents (not resolved)
    const activeIncidents = await prisma.incident.findMany({
      where: {
        status: { not: "RESOLVED" },
      },
      orderBy: { startedAt: "desc" },
      include: {
        updates: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // Get recent incidents (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentIncidents = await prisma.incident.findMany({
      where: {
        startedAt: { gte: sevenDaysAgo },
      },
      orderBy: { startedAt: "desc" },
      take: 10,
      include: {
        updates: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // Get upcoming maintenance windows
    const upcomingMaintenance = await prisma.maintenanceWindow.findMany({
      where: {
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
        scheduledStart: { gte: new Date() },
      },
      orderBy: { scheduledStart: "asc" },
    });

    // Calculate uptime (simplified - based on incidents in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const incidentsLast30Days = await prisma.incident.findMany({
      where: {
        startedAt: { gte: thirtyDaysAgo },
        status: "RESOLVED",
      },
    });

    // Simple uptime calculation
    const totalMinutes = 30 * 24 * 60; // 30 days in minutes
    let downtimeMinutes = 0;

    incidentsLast30Days.forEach((incident) => {
      if (incident.resolvedAt) {
        const duration =
          incident.resolvedAt.getTime() - incident.startedAt.getTime();
        downtimeMinutes += duration / (1000 * 60);
      }
    });

    const uptime = ((totalMinutes - downtimeMinutes) / totalMinutes) * 100;

    return NextResponse.json({
      success: true,
      data: {
        systemStatus,
        services,
        activeIncidents,
        recentIncidents,
        upcomingMaintenance,
        uptime: uptime.toFixed(2),
      },
    });
  } catch (error) {
    console.error("Error fetching status data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch status data" },
      { status: 500 },
    );
  }
}
