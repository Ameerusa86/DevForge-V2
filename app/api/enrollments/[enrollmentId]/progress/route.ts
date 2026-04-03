import "server-only";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// POST /api/enrollments/[enrollmentId]/progress - Mark lesson as complete
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ enrollmentId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { enrollmentId } = await params;
    let body: { lessonId?: string; completed?: boolean };

    try {
      body = await request.json();
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { lessonId, completed } = body;

    if (!lessonId) {
      return NextResponse.json(
        { error: "Lesson ID is required" },
        { status: 400 }
      );
    }

    // Verify enrollment belongs to user
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          select: {
            id: true,
            lessons: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Enrollment not found" },
        { status: 404 }
      );
    }

    if (enrollment.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Not authorized to update this enrollment" },
        { status: 403 }
      );
    }

    // Verify lesson belongs to this course
    const lessonExists = enrollment.course.lessons.some(
      (l) => l.id === lessonId
    );
    if (!lessonExists) {
      return NextResponse.json(
        { error: "Lesson not found in this course" },
        { status: 400 }
      );
    }

    // Update or create lesson progress
    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId,
        },
      },
      create: {
        userId: session.user.id,
        lessonId,
        completed: completed === true,
        completedAt: completed === true ? new Date() : null,
      },
      update: {
        completed: completed === true,
        completedAt: completed === true ? new Date() : null,
      },
    });

    // Calculate progress percentage
    const totalLessons = enrollment.course.lessons.length;
    const completedLessons = await prisma.lessonProgress.count({
      where: {
        userId: session.user.id,
        lesson: {
          courseId: enrollment.courseId,
        },
        completed: true,
      },
    });

    const progress =
      totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

    // Update enrollment progress
    const updatedEnrollment = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { progress },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...updatedEnrollment,
      progress,
      completedLessons,
      totalLessons,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error updating progress:", errorMessage, error);
    return NextResponse.json(
      { error: "Failed to update progress", details: errorMessage },
      { status: 500 }
    );
  }
}

// GET /api/enrollments/[enrollmentId]/progress - Get user's lesson progress
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ enrollmentId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { enrollmentId } = await params;

    // Verify enrollment belongs to user
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          select: {
            id: true,
            lessons: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Enrollment not found" },
        { status: 404 }
      );
    }

    if (enrollment.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Not authorized to view this enrollment" },
        { status: 403 }
      );
    }

    // Get lesson progress
    const lessonProgress = await prisma.lessonProgress.findMany({
      where: {
        userId: session.user.id,
        lesson: {
          courseId: enrollment.courseId,
        },
      },
      select: {
        lessonId: true,
        completed: true,
        completedAt: true,
      },
    });

    const totalLessons = enrollment.course.lessons.length;
    const completedLessons = lessonProgress.filter((p) => p.completed).length;
    const progress =
      totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;
    const isComplete = progress === 100;

    return NextResponse.json({
      enrollmentId,
      courseId: enrollment.courseId,
      progress,
      completedLessons,
      totalLessons,
      isComplete,
      lessonProgress: Object.fromEntries(
        lessonProgress.map((p) => [p.lessonId, p.completed])
      ),
    });
  } catch (error) {
    console.error("Error fetching progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}
