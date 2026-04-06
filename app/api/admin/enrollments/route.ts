import "server-only";
import { prisma } from "@/lib/db";
import {
  notifyUserEnrolled,
  createNotification,
} from "@/lib/notification-utils";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/enrollments - Get all enrollments
export async function GET() {
  try {
    const enrollments = await prisma.enrollment.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform data to include derived fields
    const enrollmentsWithDetails = enrollments.map((enrollment) => ({
      ...enrollment,
      studentName: enrollment.user.name,
      email: enrollment.user.email,
      courseName: enrollment.course.title,
    }));

    return NextResponse.json(enrollmentsWithDetails);
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    return NextResponse.json(
      { error: "Failed to fetch enrollments" },
      { status: 500 },
    );
  }
}

// POST /api/admin/enrollments - Create a new enrollment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, courseId, progress } = body;

    if (!userId || !courseId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId,
        progress: progress || 0,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            instructorId: true,
            slug: true,
          },
        },
      },
    });

    // Notify student about enrollment
    try {
      await notifyUserEnrolled(userId, enrollment.course.title);
    } catch (err) {
      console.warn("Failed to notify student about enrollment:", err);
    }

    // Notify instructor about new enrollment
    try {
      await createNotification(enrollment.course.instructorId, {
        title: "New Enrollment",
        message: `${enrollment.user.name} enrolled in "${enrollment.course.title}"`,
        type: "COURSE_ENROLLED",
        actionUrl: `/admin/enrollments`,
      });
    } catch (err) {
      console.warn("Failed to notify instructor about enrollment:", err);
    }

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error) {
    console.error("Error creating enrollment:", error);
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "User is already enrolled in this course" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create enrollment" },
      { status: 500 },
    );
  }
}
