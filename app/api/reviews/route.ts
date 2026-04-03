import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

// POST /api/reviews - Create a new review
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { courseId, rating, comment } = body;

    if (!courseId || !rating) {
      return NextResponse.json(
        { error: "Course ID and rating are required" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Check if user has completed the course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: courseId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "You must be enrolled in this course to review it" },
        { status: 403 }
      );
    }

    if (enrollment.progress < 100) {
      return NextResponse.json(
        { error: "You must complete the course before reviewing it" },
        { status: 403 }
      );
    }

    // Create or update review
    const review = await prisma.review.upsert({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: courseId,
        },
      },
      create: {
        userId: session.user.id,
        courseId: courseId,
        rating: rating,
        comment: comment || null,
      },
      update: {
        rating: rating,
        comment: comment || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}

// GET /api/reviews?courseId=xxx - Get reviews for a course
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const courseId = searchParams.get("courseId");
    const userId = searchParams.get("userId");

    if (!courseId && !userId) {
      return NextResponse.json(
        { error: "Either courseId or userId is required" },
        { status: 400 }
      );
    }

    const where: any = {};
    if (courseId) where.courseId = courseId;
    if (userId) where.userId = userId;

    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
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
    });

    // If getting course reviews, also calculate average rating
    if (courseId) {
      const stats = await prisma.review.aggregate({
        where: { courseId },
        _avg: { rating: true },
        _count: true,
      });

      return NextResponse.json({
        reviews,
        averageRating: stats._avg.rating || 0,
        totalReviews: stats._count,
      });
    }

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
