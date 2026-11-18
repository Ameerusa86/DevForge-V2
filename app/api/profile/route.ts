import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

// GET /api/profile - Get user profile with accurate progress and stats
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user, lessonProgress, credentialAccount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          enrollments: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
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
            orderBy: {
              updatedAt: "desc",
            },
          },
          reviews: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      }),
      prisma.lessonProgress.findMany({
        where: {
          userId: session.user.id,
          completed: true,
        },
        select: {
          lessonId: true,
          completedAt: true,
        },
      }),
      prisma.account.findFirst({
        where: {
          userId: session.user.id,
          providerId: "credential",
        },
        select: {
          id: true,
          password: true,
        },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const completedLessonIds = new Set(lessonProgress.map((p) => p.lessonId));

    const enrichedEnrollments = user.enrollments.map((enrollment) => {
      const totalLessons = enrollment.course.lessons.length;
      const completedLessons = enrollment.course.lessons.filter((lesson) =>
        completedLessonIds.has(lesson.id),
      ).length;
      const actualProgress =
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : enrollment.progress;

      return {
        id: enrollment.id,
        progress: actualProgress,
        completedLessons,
        totalLessons,
        createdAt: enrollment.createdAt,
        updatedAt: enrollment.updatedAt,
        course: {
          id: enrollment.course.id,
          title: enrollment.course.title,
          slug: enrollment.course.slug,
          category: enrollment.course.category,
          level: enrollment.course.level,
          imageUrl: enrollment.course.imageUrl,
          durationMinutes: enrollment.course.durationMinutes,
          instructor: enrollment.course.instructor,
        },
      };
    });

    const totalEnrollments = enrichedEnrollments.length;
    const completedCourses = enrichedEnrollments.filter(
      (e) => e.progress >= 100,
    ).length;
    const totalReviews = user.reviews.length;
    const averageProgress =
      totalEnrollments > 0
        ? Math.round(
            enrichedEnrollments.reduce((sum, e) => sum + e.progress, 0) /
              totalEnrollments,
          )
        : 0;

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        role: user.role,
        image: user.image,
        createdAt: user.createdAt,
        mustChangePassword: user.mustChangePassword,
        hasCredentialAccount: Boolean(credentialAccount?.password),
      },
      stats: {
        totalEnrollments,
        completedCourses,
        totalReviews,
        totalLessonsCompleted: lessonProgress.length,
        averageProgress,
      },
      enrollments: enrichedEnrollments,
      reviews: user.reviews,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}

// PATCH /api/profile - Update user profile
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, image } = body as { name?: string; image?: string | null };

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const updateData: { name: string; image?: string | null } = {
      name: name.trim(),
    };

    if (image !== undefined) {
      updateData.image = image ? image.trim() : null;
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
