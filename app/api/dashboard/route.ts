import "server-only";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

function calculateStreakDays(completedDates: Date[]): number {
  if (completedDates.length === 0) return 0;

  const daySet = new Set(
    completedDates.map((d) => d.toISOString().slice(0, 10)),
  );

  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);

  const todayKey = cursor.toISOString().slice(0, 10);
  if (!daySet.has(todayKey)) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    const yesterdayKey = cursor.toISOString().slice(0, 10);
    if (!daySet.has(yesterdayKey)) {
      return 0;
    }
  }

  let streak = 0;
  while (daySet.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}

// GET /api/dashboard - Get dashboard data for authenticated user
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

    const [enrollments, lessonProgress] = await Promise.all([
      prisma.enrollment.findMany({
        where: {
          userId: session.user.id,
        },
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
                select: {
                  id: true,
                  title: true,
                  order: true,
                },
                orderBy: {
                  order: "asc",
                },
              },
              instructor: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      }),
      prisma.lessonProgress.findMany({
        where: {
          userId: session.user.id,
          completed: true,
        },
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
              courseId: true,
              course: {
                select: {
                  id: true,
                  slug: true,
                  title: true,
                },
              },
            },
          },
        },
        orderBy: {
          completedAt: "desc",
        },
      }),
    ]);

    const completedLessonIds = new Set(lessonProgress.map((p) => p.lessonId));

    const enrichedEnrollments = enrollments.map((enrollment) => {
      const sortedLessons = enrollment.course.lessons;
      const totalLessons = sortedLessons.length;
      const completedCount = sortedLessons.filter((l) =>
        completedLessonIds.has(l.id),
      ).length;
      const actualProgress =
        totalLessons > 0
          ? Math.round((completedCount / totalLessons) * 100)
          : enrollment.progress;

      const nextLesson =
        sortedLessons.find((l) => !completedLessonIds.has(l.id)) ??
        sortedLessons[0] ??
        null;

      return {
        id: enrollment.id,
        courseId: enrollment.courseId,
        course: enrollment.course,
        progress: actualProgress,
        completedLessons: completedCount,
        totalLessons,
        nextLesson,
        enrolledAt: enrollment.createdAt,
        updatedAt: enrollment.updatedAt,
      };
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const completionTimestamps = lessonProgress
      .map((p) => p.completedAt)
      .filter((d): d is Date => Boolean(d));

    const completedThisWeek = completionTimestamps.filter(
      (d) => d >= sevenDaysAgo,
    ).length;

    const activeStreakDays = calculateStreakDays(completionTimestamps);

    const averageProgress =
      enrichedEnrollments.length > 0
        ? Math.round(
            enrichedEnrollments.reduce((sum, e) => sum + e.progress, 0) /
              enrichedEnrollments.length,
          )
        : 0;

    const stats = {
      totalEnrolled: enrichedEnrollments.length,
      inProgress: enrichedEnrollments.filter(
        (e) => e.progress > 0 && e.progress < 100,
      ).length,
      readyToStart: enrichedEnrollments.filter((e) => e.progress === 0).length,
      completed: enrichedEnrollments.filter((e) => e.progress >= 100).length,
      totalLessonsCompleted: lessonProgress.length,
      completedThisWeek,
      activeStreakDays,
      averageProgress,
    };

    const recentActivity = lessonProgress
      .filter((p) => p.completedAt && p.lesson)
      .slice(0, 6)
      .map((p) => ({
        lessonId: p.lessonId,
        completedAt: p.completedAt,
        lesson: {
          id: p.lesson.id,
          title: p.lesson.title,
          course: p.lesson.course,
        },
      }));

    const enrolledCourseIds = enrollments.map((e) => e.courseId);
    const recommendedCoursesRaw = await prisma.course.findMany({
      where: {
        status: "PUBLISHED",
        id: {
          notIn: enrolledCourseIds,
        },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        category: true,
        level: true,
        price: true,
        imageUrl: true,
        durationMinutes: true,
        lessons: {
          select: {
            id: true,
          },
        },
        instructor: {
          select: {
            name: true,
          },
        },
      },
      take: 6,
      orderBy: {
        createdAt: "desc",
      },
    });

    const recommendedCourses = recommendedCoursesRaw.map((course) => ({
      ...course,
      price: Number(course.price),
    }));

    return NextResponse.json({
      stats,
      enrollments: enrichedEnrollments,
      recentActivity,
      recommendedCourses,
    });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
}
