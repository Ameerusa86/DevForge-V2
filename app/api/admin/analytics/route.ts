import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const period = searchParams.get("period") || "30"; // days

    const daysAgo = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Get total counts
    const [
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalReviews,
      publishedCourses,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.enrollment.count(),
      prisma.review.count(),
      prisma.course.count({ where: { status: "PUBLISHED" } }),
    ]);

    // Get recent enrollments
    const recentEnrollments = await prisma.enrollment.count({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    });

    // Get course enrollments breakdown
    const topCourses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
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

    // Get category distribution
    const categoryDistribution = await prisma.course.groupBy({
      by: ["category"],
      _count: {
        category: true,
      },
      orderBy: {
        _count: {
          category: "desc",
        },
      },
    });

    // Get average ratings
    const averageRatings = await prisma.review.aggregate({
      _avg: {
        rating: true,
      },
    });

    // Calculate completion rate
    const completedEnrollments = await prisma.enrollment.count({
      where: { progress: 100 },
    });
    const completionRate =
      totalEnrollments > 0
        ? ((completedEnrollments / totalEnrollments) * 100).toFixed(1)
        : 0;

    // Get enrollment trend (last 7 days)
    const enrollmentTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const count = await prisma.enrollment.count({
        where: {
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

    // Get revenue data (if courses have prices)
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
        createdAt: {
          gte: startDate,
        },
      },
    });

    const totalRevenue = revenueData.reduce(
      (sum, enrollment) => sum + Number(enrollment.course.price),
      0
    );

    // Get recent users
    const recentUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    });

    return NextResponse.json({
      overview: {
        totalUsers,
        totalCourses,
        publishedCourses,
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
      { status: 500 }
    );
  }
}
