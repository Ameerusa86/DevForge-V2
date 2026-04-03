import "server-only";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// PATCH /api/admin/enrollments/[enrollmentId] - Update enrollment progress
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ enrollmentId: string }> }
) {
  try {
    const { enrollmentId } = await params;
    const body = await request.json();
    const { progress } = body;

    if (progress === undefined) {
      return NextResponse.json(
        { error: "Progress is required" },
        { status: 400 }
      );
    }

    const enrollment = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        progress: Math.min(Math.max(parseInt(progress), 0), 100),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json(enrollment);
  } catch (error) {
    console.error("Error updating enrollment:", error);
    return NextResponse.json(
      { error: "Failed to update enrollment" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/enrollments/[enrollmentId] - Delete enrollment
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ enrollmentId: string }> }
) {
  try {
    const { enrollmentId } = await params;
    await prisma.enrollment.delete({
      where: { id: enrollmentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting enrollment:", error);
    return NextResponse.json(
      { error: "Failed to delete enrollment" },
      { status: 500 }
    );
  }
}
