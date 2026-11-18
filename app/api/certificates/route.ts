import "server-only";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/certificates - List earned certificates and in-progress certificate tracks
export async function GET() {
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

    const [user, platformSetting, enrollments, lessonProgress] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: session.user.id },
          select: { id: true, name: true, email: true },
        }),
        prisma.platformSetting.findUnique({
          where: { id: "default" },
          select: { settings: true },
        }),
        prisma.enrollment.findMany({
          where: { userId: session.user.id },
          include: {
            course: {
              select: {
                id: true,
                slug: true,
                title: true,
                description: true,
                category: true,
                level: true,
                imageUrl: true,
                durationMinutes: true,
                lessons: {
                  select: { id: true },
                },
                instructor: {
                  select: { name: true },
                },
              },
            },
          },
          orderBy: { updatedAt: "desc" },
        }),
        prisma.lessonProgress.findMany({
          where: {
            userId: session.user.id,
            completed: true,
          },
          select: {
            lessonId: true,
            completedAt: true,
            lesson: {
              select: {
                courseId: true,
              },
            },
          },
          orderBy: { completedAt: "desc" },
        }),
      ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const settingsObj = platformSetting?.settings as
      | { features?: { certificates?: boolean } }
      | undefined;
    const certificatesEnabled = settingsObj?.features?.certificates ?? true;

    const completedLessonIds = new Set(lessonProgress.map((p) => p.lessonId));

    const earned: Array<{
      enrollmentId: string;
      certificateId: string;
      courseId: string;
      courseSlug: string;
      courseTitle: string;
      courseCategory: string;
      courseLevel: string;
      courseImageUrl: string | null;
      durationMinutes: number | null;
      totalLessons: number;
      instructorName: string;
      userName: string;
      completedAt: Date;
      enrolledAt: Date;
    }> = [];

    const inProgress: Array<{
      enrollmentId: string;
      courseId: string;
      courseSlug: string;
      courseTitle: string;
      courseCategory: string;
      courseLevel: string;
      courseImageUrl: string | null;
      durationMinutes: number | null;
      instructorName: string;
      progress: number;
      completedLessons: number;
      totalLessons: number;
      remainingLessons: number;
    }> = [];

    for (const enrollment of enrollments) {
      const totalLessons = enrollment.course.lessons.length;
      const completedLessons = enrollment.course.lessons.filter((lesson) =>
        completedLessonIds.has(lesson.id),
      ).length;

      const actualProgress =
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : enrollment.progress;

      if (actualProgress >= 100) {
        const lastCompleted = lessonProgress.find(
          (p) => p.lesson.courseId === enrollment.courseId && p.completedAt,
        );
        const completedAt = lastCompleted?.completedAt || enrollment.updatedAt;
        const certificateId = `CERT-${enrollment.id
          .substring(0, 8)
          .toUpperCase()}-${new Date(completedAt).getFullYear()}`;

        earned.push({
          enrollmentId: enrollment.id,
          certificateId,
          courseId: enrollment.course.id,
          courseSlug: enrollment.course.slug,
          courseTitle: enrollment.course.title,
          courseCategory: enrollment.course.category,
          courseLevel: enrollment.course.level,
          courseImageUrl: enrollment.course.imageUrl,
          durationMinutes: enrollment.course.durationMinutes,
          totalLessons,
          instructorName: enrollment.course.instructor.name,
          userName: user.name,
          completedAt,
          enrolledAt: enrollment.createdAt,
        });
      } else {
        inProgress.push({
          enrollmentId: enrollment.id,
          courseId: enrollment.course.id,
          courseSlug: enrollment.course.slug,
          courseTitle: enrollment.course.title,
          courseCategory: enrollment.course.category,
          courseLevel: enrollment.course.level,
          courseImageUrl: enrollment.course.imageUrl,
          durationMinutes: enrollment.course.durationMinutes,
          instructorName: enrollment.course.instructor.name,
          progress: actualProgress,
          completedLessons,
          totalLessons,
          remainingLessons: Math.max(0, totalLessons - completedLessons),
        });
      }
    }

    return NextResponse.json({
      certificatesEnabled,
      user,
      earned,
      inProgress,
    });
  } catch (error) {
    console.error("Error fetching certificates:", error);
    return NextResponse.json(
      { error: "Failed to fetch certificates" },
      { status: 500 },
    );
  }
}
