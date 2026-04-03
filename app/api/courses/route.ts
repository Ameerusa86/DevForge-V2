import "server-only";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * GET /api/courses - Get all published courses (public endpoint)
 */
export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      where: {
        status: "PUBLISHED",
      },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        enrollments: true,
        lessons: true,
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy: {
        publishedAt: "desc",
      },
    });

    // Transform data to include derived fields
    const coursesWithStats = courses.map((course) => {
      const reviews = course.reviews || [];
      const averageRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

      return {
        id: course.id,
        title: course.title,
        slug: course.slug,
        description: course.description,
        category: course.category,
        level: course.level,
        price: Number(course.price),
        imageUrl: course.imageUrl,
        instructor: course.instructor.name,
        status: course.status,
        lessons: course.lessons.length,
        enrollments: course.enrollments.length,
        publishedAt: course.publishedAt,
        rating: averageRating,
        totalReviews: reviews.length,
      };
    });

    return NextResponse.json(coursesWithStats);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}
