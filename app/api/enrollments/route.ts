import "server-only";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  notifyUserEnrolled,
  createNotification,
} from "@/lib/notification-utils";
import { sendEnrollmentReceiptEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

// POST /api/enrollments - Enroll in a course or project tutorial
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 },
      );
    }

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: "Already enrolled in this item" },
        { status: 400 },
      );
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        userId: session.user.id,
        courseId,
        progress: 0,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            contentType: true,
            price: true,
            instructorId: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    try {
      await notifyUserEnrolled(
        session.user.id,
        enrollment.course.title,
        enrollment.course.contentType,
        enrollment.course.slug,
      );
    } catch (err) {
      console.warn("Failed to notify student about enrollment:", err);
    }

    if (enrollment.user.email) {
      try {
        await sendEnrollmentReceiptEmail(
          { email: enrollment.user.email, name: enrollment.user.name },
          {
            title: enrollment.course.title,
            price: Number(enrollment.course.price),
            slug: enrollment.course.slug,
            contentType: enrollment.course.contentType,
          },
        );
      } catch (err) {
        console.warn("Failed to send enrollment email receipt:", err);
      }
    }

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
    return NextResponse.json(
      { error: "Failed to enroll" },
      { status: 500 },
    );
  }
}

// GET /api/enrollments - Get user's enrollments
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
            contentType: true,
            category: true,
            level: true,
            imageUrl: true,
            durationMinutes: true,
            techStack: true,
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
        createdAt: "desc",
      },
    });

    return NextResponse.json(enrollments);
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    return NextResponse.json(
      { error: "Failed to fetch enrollments" },
      { status: 500 },
    );
  }
}
