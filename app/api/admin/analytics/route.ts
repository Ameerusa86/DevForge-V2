import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeContentTypeFilter } from "@/lib/content-type";
import type { Prisma } from "@/lib/generated/prisma/client";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const period = searchParams.get("period") || "30";
    const typeFilter = normalizeContentTypeFilter(
      searchParams.get("type"),
      "ALL",
    );

    const daysAgo = parseInt(period, 10) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const courseWhere: Prisma.CourseWhereInput =
      typeFilter !== "ALL" ? { contentType: typeFilter } : {};
    const enrollmentCourseWhere: Prisma.EnrollmentWhereInput =
      typeFilter !== "ALL" ? { course: { contentType: typeFilter } } : {};
    const reviewCourseWhere: Prisma.ReviewWhereInput =
      typeFilter !== "ALL" ? { course: { contentType: typeFilter } } : {};

    const [
      totalUsers,
      totalCatalogItems,
      publishedCatalogItems,
      totalCoursesOnly,
      publishedCoursesOnly,
      totalProjectsOnly,
      publishedProjectsOnly,
      totalEnrollments,
      totalReviews,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.course.count({ where: courseWhere }),
      prisma.course.count({ where: { ...courseWhere, status: "PUBLISHED" } }),
      prisma.course.count({ where: { contentType: "COURSE" } }),
      prisma.course.count({
        where: { contentType: "COURSE", status: "PUBLISHED" },
      }),
      prisma.course.count({ where: { contentType: "PROJECT_TUTORIAL" } }),
      prisma.course.count({
        where: { contentType: "PROJECT_TUTORIAL", status: "PUBLISHED" },
      }),
      prisma.enrollment.count({ where: enrollmentCourseWhere }),
      prisma.review.count({ where: reviewCourseWhere }),
    ]);

    const recentEnrollments = await prisma.enrollment.count({
      where: {
        ...enrollmentCourseWhere,
        createdAt: {
          gte: startDate,
        },
      },
    });

    const topCourses = await prisma.course.findMany({
      where: courseWhere,
      select: {
        id: true,
        title: true,
        slug: true,
        contentType: true,
        _count: {
          select: {
            enrollments: true,
            reviews: true,
          },
        },
      },
      orderBy: {
        enrollments: {
          _count: "desc",
        },
      },
      take: 10,
    });

    const categoryDistribution = await prisma.course.groupBy({
      by: ["category"],
      where: courseWhere,
      _count: {
        category: true,
      },
      orderBy: {
        _count: {
          category: "desc",
        },
      },
    });

    const averageRatings = await prisma.review.aggregate({
      where: reviewCourseWhere,
      _avg: {
        rating: true,
      },
    });

    const completedEnrollments = await prisma.enrollment.count({
      where: { ...enrollmentCourseWhere, progress: 100 },
    });
    const completionRate =
      totalEnrollments > 0
        ? ((completedEnrollments / totalEnrollments) * 100).toFixed(1)
        : 0;

    const enrollmentTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const count = await prisma.enrollment.count({
        where: {
          ...enrollmentCourseWhere,
          createdAt: {
            gte: date,
            lt: nextDay,
          },
        },
      });

      enrollmentTrend.push({
        date: date.toISOString().split("T")[0],
        count,
      });
    }

    const revenueData = await prisma.enrollment.findMany({
      select: {
        course: {
          select: {
            price: true,
          },
        },
        createdAt: true,
      },
      where: {
        ...enrollmentCourseWhere,
        createdAt: {
          gte: startDate,
        },
      },
    });

    const totalRevenue = revenueData.reduce(
      (sum, enrollment) => sum + Number(enrollment.course.price),
      0,
    );

    const recentUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    });

    return NextResponse.json({
      typeFilter,
      overview: {
        totalUsers,
        totalCourses: totalCatalogItems,
        publishedCourses: publishedCatalogItems,
        coursesCount: totalCoursesOnly,
        publishedCoursesCount: publishedCoursesOnly,
        projectsCount: totalProjectsOnly,
        publishedProjectsCount: publishedProjectsOnly,
        totalEnrollments,
        totalReviews,
        completionRate: parseFloat(completionRate as string),
        averageRating: averageRatings._avg.rating || 0,
        totalRevenue,
      },
      period: {
        days: daysAgo,
        recentEnrollments,
        recentUsers,
      },
      topCourses: topCourses.map((course) => ({
        id: course.id,
        title: course.title,
        slug: course.slug,
        contentType: course.contentType,
        enrollments: course._count.enrollments,
        reviews: course._count.reviews,
      })),
      categoryDistribution: categoryDistribution.map((cat) => ({
        category: cat.category,
        count: cat._count.category,
      })),
      enrollmentTrend,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}
