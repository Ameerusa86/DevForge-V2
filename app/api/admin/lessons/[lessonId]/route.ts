import "server-only";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// PATCH /api/admin/lessons/[lessonId] - Update a lesson
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  try {
    const { lessonId } = await params;
    const body = await request.json();
    const { title, content, order, isFree, moduleId } = body;

    const lesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(order !== undefined && { order }),
        ...(isFree !== undefined && { isFree }),
        ...(moduleId !== undefined && { moduleId: moduleId || null }),
      },
    });

    return NextResponse.json(lesson);
  } catch (error) {
    console.error("Error updating lesson:", error);
    return NextResponse.json(
      { error: "Failed to update lesson" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/lessons/[lessonId] - Delete a lesson
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  try {
    const { lessonId } = await params;
    await prisma.lesson.delete({
      where: { id: lessonId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return NextResponse.json(
      { error: "Failed to delete lesson" },
      { status: 500 },
    );
  }
}
