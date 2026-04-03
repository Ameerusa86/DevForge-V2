import "server-only";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// GET /api/certificates/[enrollmentId] - Get certificate data
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

    // Get enrollment with course details
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            instructor: {
              select: {
                name: true,
              },
            },
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

    // Verify user owns this enrollment
    if (enrollment.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Not authorized to view this certificate" },
        { status: 403 }
      );
    }

    // Check if course is complete
    if (enrollment.progress !== 100) {
      return NextResponse.json(
        { error: "Course not yet complete" },
        { status: 400 }
      );
    }

    // Calculate completion date based on last lesson completion
    const lastCompletedLesson = await prisma.lessonProgress.findFirst({
      where: {
        userId: session.user.id,
        lesson: {
          courseId: enrollment.courseId,
        },
        completed: true,
      },
      orderBy: {
        completedAt: "desc",
      },
    });

    const completedAt = lastCompletedLesson?.completedAt || new Date();
    const certificateId = `CERT-${enrollmentId
      .substring(0, 8)
      .toUpperCase()}-${new Date(completedAt).getFullYear()}`;

    return NextResponse.json({
      enrollmentId,
      courseTitle: enrollment.course.title,
      userName: enrollment.user.name,
      completedAt,
      instructorName: enrollment.course.instructor.name,
      certificateId,
    });
  } catch (error) {
    console.error("Error fetching certificate:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch certificate: ${errorMessage}` },
      { status: 500 }
    );
  }
}
