import "server-only";
import { prisma } from "@/lib/db";
import { generateSlug } from "@/lib/slug";
import { getErrorMessage } from "@/lib/utils";
import { notifyCoursePublished } from "@/lib/notification-utils";
import { logCourseAuditEventSafe } from "@/lib/course-audit";
import { CourseWithStats } from "@/types/api-response";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/courses - Get all courses
export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        enrollments: true,
        modules: true,
        lessons: true,
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform data to include derived fields
    const coursesWithStats = courses.map((course: (typeof courses)[0]) => {
      const reviews = course.reviews || [];
      const averageRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

      return {
        ...course,
        instructor: course.instructor.name,
        enrollments: course.enrollments.length,
        modules: course.modules.length,
        lessons: course.lessons.length,
        rating: Number(averageRating.toFixed(1)),
        totalReviews: reviews.length,
        price: Number(course.price),
        revenue: `$${(
          course.enrollments.length * Number(course.price)
        ).toLocaleString()}`,
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString(),
        publishedAt: course.publishedAt?.toISOString(),
      };
    }) as CourseWithStats[];

    return NextResponse.json(coursesWithStats);
  } catch (error) {
    console.error("Error fetching courses:", error);
    const errorMessage = getErrorMessage(error);
    return NextResponse.json(
      {
        error: "Failed to fetch courses",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

// POST /api/admin/courses - Create a new course
export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    const {
      title,
      description,
      category,
      level,
      price,
      durationMinutes,
      imageUrl,
      tags,
      status,
      instructorId,
    } = body;

    if (!title || !description || !category || !level || !instructorId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const slug = generateSlug(title);

    const course = await prisma.course.create({
      data: {
        title,
        slug,
        description,
        category,
        level,
        price: parseFloat(price) || 0,
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : null,
        imageUrl: imageUrl || null,
        tags: tags || [],
        status: status || "DRAFT",
        publishedAt: status === "PUBLISHED" ? new Date() : null,
        instructorId,
      },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Notify instructor if course is published immediately
    if (status === "PUBLISHED") {
      try {
        await notifyCoursePublished(instructorId, title);
      } catch (notificationError) {
        console.warn(
          "Failed to send publication notification:",
          notificationError,
        );
        // Don't fail the API if notification fails
      }
    }

    await logCourseAuditEventSafe({
      courseId: course.id,
      title: "Course created",
      description: `${course.title} was created as ${course.status}.`,
      type: "course",
      actionUrl: `/admin/courses/${course.id}/edit`,
    });

    if (course.status === "PUBLISHED") {
      await logCourseAuditEventSafe({
        courseId: course.id,
        title: "Course published",
        description: `${course.title} was published at creation time.`,
        type: "course",
        actionUrl: `/courses/${course.slug}`,
      });
    }

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error("Error creating course:", error);
    const errorMessage = getErrorMessage(error);
    return NextResponse.json(
      {
        error: "Failed to create course",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
