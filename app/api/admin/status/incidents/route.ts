import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { IncidentStatus, StatusLevel } from "@/lib/generated/prisma/client";

// CREATE incident
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
    const { title, description, status, severity, affectedServices } = body;

    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: "Title and description are required" },
        { status: 400 },
      );
    }

    const incident = await prisma.incident.create({
      data: {
        title,
        description,
        status: status || "INVESTIGATING",
        severity: severity || "MINOR",
        affectedServices: affectedServices || [],
      },
    });

    return NextResponse.json({
      success: true,
      data: incident,
    });
  } catch (error) {
    console.error("Error creating incident:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create incident" },
      { status: 500 },
    );
  }
}

// UPDATE incident
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
      status,
      severity,
      affectedServices,
      resolvedAt,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Incident ID is required" },
        { status: 400 },
      );
    }

    const updateData: {
      title?: string;
      description?: string;
      status?: IncidentStatus;
      severity?: StatusLevel;
      affectedServices?: string[];
      resolvedAt?: Date;
    } = {
      title,
      description,
      status,
      severity,
      affectedServices,
    };

    // If status is RESOLVED, set resolvedAt
    if (status === "RESOLVED" && !resolvedAt) {
      updateData.resolvedAt = new Date();
    }

    const incident = await prisma.incident.update({
      where: { id },
      data: updateData,
      include: {
        updates: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: incident,
    });
  } catch (error) {
    console.error("Error updating incident:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update incident" },
      { status: 500 },
    );
  }
}

// DELETE incident
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
        { success: false, error: "Incident ID is required" },
        { status: 400 },
      );
    }

    await prisma.incident.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Incident deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting incident:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete incident" },
      { status: 500 },
    );
  }
}
