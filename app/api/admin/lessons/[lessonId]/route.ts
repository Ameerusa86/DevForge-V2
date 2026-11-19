import "server-only";
import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

// GET /api/admin/lessons/[lessonId] - Get full lesson details (including TipTap content)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const { lessonId } = await params;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
          },
        },
        module: {
          select: {
            id: true,
            title: true,
            phaseId: true,
          },
        },
        quiz: {
          include: {
            questions: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    return NextResponse.json(lesson);
  } catch (error) {
    console.error("Error fetching lesson:", error);
    return NextResponse.json(
      { error: "Failed to fetch lesson" },
      { status: 500 },
    );
  }
}

// PATCH /api/admin/lessons/[lessonId] - Update a lesson
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const { lessonId } = await params;
    const body = await request.json();
    const {
      title,
      content,
      order,
      isFree,
      moduleId,
      phaseId,
      videoUrl,
      durationSeconds,
    } = body;

    const lesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(order !== undefined && { order }),
        ...(isFree !== undefined && { isFree }),
        ...(moduleId !== undefined && { moduleId: moduleId || null }),
        ...(phaseId !== undefined && { phaseId: phaseId || null }),
        ...(videoUrl !== undefined && {
          videoUrl: videoUrl ? String(videoUrl).trim() : null,
        }),
        ...(durationSeconds !== undefined && {
          durationSeconds: durationSeconds
            ? parseInt(String(durationSeconds), 10)
            : null,
        }),
      },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                options: true,
              },
            },
          },
        },
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
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

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
