import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET all status data for admin
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const currentUser = session?.user?.id
      ? await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { role: true },
        })
      : null;

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Get or create system status
    let systemStatus = await prisma.systemStatus.findFirst();

    if (!systemStatus) {
      systemStatus = await prisma.systemStatus.create({
        data: {},
      });
    }

    // Get all services (including inactive)
    const services = await prisma.service.findMany({
      orderBy: { order: "asc" },
    });

    // Get all incidents
    const incidents = await prisma.incident.findMany({
      orderBy: { startedAt: "desc" },
      include: {
        updates: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // Get all maintenance windows
    const maintenanceWindows = await prisma.maintenanceWindow.findMany({
      orderBy: { scheduledStart: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        systemStatus,
        services,
        incidents,
        maintenanceWindows,
      },
    });
  } catch (error) {
    console.error("Error fetching admin status data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch status data" },
      { status: 500 },
    );
  }
}

// UPDATE system status
export async function PUT(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const currentUser = session?.user?.id
      ? await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { role: true },
        })
      : null;

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { status, message } = body;

    let systemStatus = await prisma.systemStatus.findFirst();

    if (!systemStatus) {
      systemStatus = await prisma.systemStatus.create({
        data: { status, message },
      });
    } else {
      systemStatus = await prisma.systemStatus.update({
        where: { id: systemStatus.id },
        data: {
          status,
          message,
          lastChecked: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: systemStatus,
    });
  } catch (error) {
    console.error("Error updating system status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update system status" },
      { status: 500 },
    );
  }
}
