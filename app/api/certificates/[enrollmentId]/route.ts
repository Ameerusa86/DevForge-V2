import "server-only";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getCertificateCode } from "@/lib/content-type";

// GET /api/certificates/[enrollmentId] - Get certificate data
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ enrollmentId: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { enrollmentId } = await params;

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
            slug: true,
            title: true,
            contentType: true,
            techStack: true,
            category: true,
            level: true,
            durationMinutes: true,
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
        { status: 404 },
      );
    }

    if (enrollment.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Not authorized to view this certificate" },
        { status: 403 },
      );
    }

    const completedLessons = await prisma.lessonProgress.findMany({
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
      select: {
        lessonId: true,
        completedAt: true,
      },
    });

    const totalLessons = enrollment.course.lessons.length;
    const actualProgress =
      totalLessons > 0
        ? Math.round((completedLessons.length / totalLessons) * 100)
        : enrollment.progress;

    if (actualProgress < 100 && enrollment.progress !== 100) {
      return NextResponse.json(
        { error: "Course not yet complete" },
        { status: 400 },
      );
    }

    const completedAt =
      completedLessons[0]?.completedAt || enrollment.updatedAt || new Date();
    const certificateId = getCertificateCode(
      enrollment.course.contentType,
      enrollmentId,
      completedAt,
    );

    return NextResponse.json({
      enrollmentId,
      courseSlug: enrollment.course.slug,
      courseTitle: enrollment.course.title,
      contentType: enrollment.course.contentType,
      techStack: enrollment.course.techStack || [],
      courseCategory: enrollment.course.category,
      courseLevel: enrollment.course.level,
      durationMinutes: enrollment.course.durationMinutes,
      totalLessons,
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
      { status: 500 },
    );
  }
}
