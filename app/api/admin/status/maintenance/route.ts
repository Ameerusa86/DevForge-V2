import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { MaintenanceStatus } from "@/lib/generated/prisma/client";

// CREATE maintenance window
export async function POST(req: NextRequest) {
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
    const {
      title,
      description,
      affectedServices,
      scheduledStart,
      scheduledEnd,
      status,
    } = body;

    if (!title || !description || !scheduledStart || !scheduledEnd) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Title, description, scheduled start, and scheduled end are required",
        },
        { status: 400 },
      );
    }

    const maintenance = await prisma.maintenanceWindow.create({
      data: {
        title,
        description,
        affectedServices: affectedServices || [],
        scheduledStart: new Date(scheduledStart),
        scheduledEnd: new Date(scheduledEnd),
        status: status || "SCHEDULED",
      },
    });

    return NextResponse.json({
      success: true,
      data: maintenance,
    });
  } catch (error) {
    console.error("Error creating maintenance window:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create maintenance window" },
      { status: 500 },
    );
  }
}

// UPDATE maintenance window
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
    const {
      id,
      title,
      description,
      affectedServices,
      scheduledStart,
      scheduledEnd,
      status,
      actualStart,
      actualEnd,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Maintenance window ID is required" },
        { status: 400 },
      );
    }

    const updateData: {
      title?: string;
      description?: string;
      affectedServices?: string[];
      status?: MaintenanceStatus;
      scheduledStart?: Date;
      scheduledEnd?: Date;
      actualStart?: Date | null;
      actualEnd?: Date | null;
    } = {
      title,
      description,
      affectedServices,
      status,
    };

    if (scheduledStart) updateData.scheduledStart = new Date(scheduledStart);
    if (scheduledEnd) updateData.scheduledEnd = new Date(scheduledEnd);
    if (actualStart) updateData.actualStart = new Date(actualStart);
    if (actualEnd) updateData.actualEnd = new Date(actualEnd);

    const maintenance = await prisma.maintenanceWindow.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: maintenance,
    });
  } catch (error) {
    console.error("Error updating maintenance window:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update maintenance window" },
      { status: 500 },
    );
  }
}

// DELETE maintenance window
export async function DELETE(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Maintenance window ID is required" },
        { status: 400 },
      );
    }

    await prisma.maintenanceWindow.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Maintenance window deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting maintenance window:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete maintenance window" },
      { status: 500 },
    );
  }
}
