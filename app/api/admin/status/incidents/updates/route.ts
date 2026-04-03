import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// CREATE incident update
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
    const { incidentId, message, status } = body;

    if (!incidentId || !message || !status) {
      return NextResponse.json(
        {
          success: false,
          error: "Incident ID, message, and status are required",
        },
        { status: 400 },
      );
    }

    const update = await prisma.incidentUpdate.create({
      data: {
        incidentId,
        message,
        status,
      },
    });

    // Also update the incident status
    await prisma.incident.update({
      where: { id: incidentId },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      data: update,
    });
  } catch (error) {
    console.error("Error creating incident update:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create incident update" },
      { status: 500 },
    );
  }
}
