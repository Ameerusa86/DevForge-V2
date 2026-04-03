import "server-only";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// GET /api/dashboard - Get dashboard data for authenticated user
export async function GET() {
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

    // Get user's enrollments with course details and progress
    const enrollments = await prisma.enrollment.findMany({
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
    });

    // Get lesson progress for calculating actual progress
    const lessonProgress = await prisma.lessonProgress.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        lesson: {
          select: {
            courseId: true,
          },
        },
      },
      orderBy: {
        completedAt: "desc",
      },
    });

    // Calculate stats and enrich enrollments with actual progress
    const enrichedEnrollments = enrollments.map((enrollment) => {
      const courseProgress = lessonProgress.filter(
        (p) => p.lesson.courseId === enrollment.courseId && p.completed
      );
      const totalLessons = enrollment.course.lessons.length;
      const completedCount = courseProgress.length;
      const actualProgress =
        totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

      return {
        id: enrollment.id,
        courseId: enrollment.courseId,
        course: enrollment.course,
        progress: actualProgress,
        completedLessons: completedCount,
        totalLessons,
        enrolledAt: enrollment.createdAt,
      };
    });

    const stats = {
      totalEnrolled: enrollments.length,
      inProgress: enrichedEnrollments.filter((e) => e.progress > 0 && e.progress < 100)
        .length,
      completed: enrichedEnrollments.filter((e) => e.progress === 100).length,
      totalLessonsCompleted: lessonProgress.filter((p) => p.completed).length,
    };

    // Get recent activity (last 5 completed lessons)
    const recentActivity = lessonProgress
      .filter((p) => p.completed && p.completedAt)
      .slice(0, 5)
      .map((p) => ({
        lessonId: p.lessonId,
        completedAt: p.completedAt,
      }));

    // Get enriched recent activity with lesson and course info
    const recentActivityEnriched = await Promise.all(
      recentActivity.map(async (activity) => {
        const lesson = await prisma.lesson.findUnique({
          where: { id: activity.lessonId },
          select: {
            id: true,
            title: true,
            course: {
              select: {
                id: true,
                slug: true,
                title: true,
              },
            },
          },
        });
        return {
          ...activity,
          lesson,
        };
      })
    );

    // Get recommended courses (published courses not enrolled in)
    const enrolledCourseIds = enrollments.map((e) => e.courseId);
    const recommendedCourses = await prisma.course.findMany({
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

    return NextResponse.json({
      stats,
      enrollments: enrichedEnrollments,
      recentActivity: recentActivityEnriched,
      recommendedCourses,
    });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
