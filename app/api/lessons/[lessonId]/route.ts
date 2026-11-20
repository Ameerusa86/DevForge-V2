import "server-only";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/lessons/[lessonId] - Get a single lesson
export async function GET(
  _request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  try {
    const { lessonId } = await context.params;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        title: true,
        content: true,
        order: true,
        courseId: true,
        isFree: true,
        course: {
          select: {
            id: true,
            title: true,
            price: true,
            contentType: true,
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const itemNoun =
      lesson.course.contentType === "PROJECT_TUTORIAL"
        ? "project tutorial"
        : "course";

    if (lesson.isFree) {
      return NextResponse.json({
        ...lesson,
        isLocked: false,
      });
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({
        id: lesson.id,
        title: lesson.title,
        order: lesson.order,
        courseId: lesson.courseId,
        content: null,
        isFree: false,
        isLocked: true,
        message: `This lesson requires enrollment. Please enroll in the ${itemNoun} to access this content.`,
      });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: lesson.courseId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json({
        id: lesson.id,
        title: lesson.title,
        order: lesson.order,
        courseId: lesson.courseId,
        content: null,
        isFree: false,
        isLocked: true,
        message: `This lesson requires enrollment. Please enroll in the ${itemNoun} to access this content.`,
      });
    }

    return NextResponse.json({
      ...lesson,
      isLocked: false,
    });
  } catch (error) {
    console.error("Error fetching lesson:", error);
    return NextResponse.json(
      { error: "Failed to fetch lesson" },
      { status: 500 },
    );
  }
}
