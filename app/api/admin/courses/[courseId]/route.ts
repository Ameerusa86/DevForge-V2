import "server-only";
import { prisma } from "@/lib/db";
import { deleteS3Object } from "@/lib/s3-delete";
import { logCourseAuditEventSafe } from "@/lib/course-audit";
import {
  notifyCoursePublished,
  createNotification,
} from "@/lib/notification-utils";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/courses/[courseId] - Get a single course
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ courseId: string }> },
) {
  try {
    const { courseId } = await context.params;

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 },
      );
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
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
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json(
      { error: "Failed to fetch course" },
      { status: 500 },
    );
  }
}

// PATCH /api/admin/courses/[courseId] - Update a course
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> },
) {
  try {
    const { courseId } = await context.params;

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const {
      title,
      slug,
      description,
      category,
      level,
      price,
      durationMinutes,
      imageUrl,
      tags,
      status,
      publishedAt,
      showUnassignedHeader,
    } = body;

    // Get current course to check if status is changing
    const currentCourse = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        status: true,
        title: true,
        instructorId: true,
        slug: true,
        enrollments: { select: { userId: true } },
      },
    });

    const course = await prisma.course.update({
      where: { id: courseId },
      data: {
        ...(title && { title }),
        ...(slug && { slug }),
        ...(description && { description }),
        ...(category && { category }),
        ...(level && { level }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(durationMinutes && { durationMinutes: parseInt(durationMinutes) }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(tags && { tags }),
        ...(status && { status }),
        ...(showUnassignedHeader !== undefined && { showUnassignedHeader }),
        ...(publishedAt !== undefined && {
          publishedAt: publishedAt ? new Date(publishedAt) : null,
        }),
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

    // Notify instructor and students if status changed to PUBLISHED
    if (status === "PUBLISHED" && currentCourse?.status !== "PUBLISHED") {
      try {
        const courseTitle = title || currentCourse?.title || "Your Course";
        const instructorId = course.instructor.id;
        const courseSlug = course.slug || slug || courseId;

        // Notify instructor
        await notifyCoursePublished(instructorId, courseTitle);

        // Notify all enrolled students about the update
        if (
          currentCourse?.enrollments &&
          currentCourse.enrollments.length > 0
        ) {
          for (const enrollment of currentCourse.enrollments) {
            try {
              await createNotification(enrollment.userId, {
                title: "Course Published",
                message: `"${courseTitle}" is now live and ready to take!`,
                type: "COURSE_UPDATED",
                actionUrl: `/courses/${courseSlug}`,
              });
            } catch (err) {
              console.warn(
                `Failed to notify student ${enrollment.userId}:`,
                err,
              );
            }
          }
        }
      } catch (notificationError) {
        console.warn("Failed to send notifications:", notificationError);
      }
    }

    const updateFields = [
      title !== undefined ? "title" : null,
      slug !== undefined ? "slug" : null,
      description !== undefined ? "description" : null,
      category !== undefined ? "category" : null,
      level !== undefined ? "level" : null,
      price !== undefined ? "price" : null,
      durationMinutes !== undefined ? "duration" : null,
      imageUrl !== undefined ? "image" : null,
      tags !== undefined ? "tags" : null,
      status !== undefined ? "status" : null,
      showUnassignedHeader !== undefined ? "curriculum settings" : null,
    ].filter(Boolean) as string[];

    await logCourseAuditEventSafe({
      courseId,
      title: "Course updated",
      description:
        updateFields.length > 0
          ? `Updated fields: ${updateFields.join(", ")}.`
          : "Course metadata updated.",
      type: "course",
      actionUrl: `/admin/courses/${courseId}/edit`,
    });

    if (status === "PUBLISHED" && currentCourse?.status !== "PUBLISHED") {
      await logCourseAuditEventSafe({
        courseId,
        title: "Course published",
        description: `${course.title} was published.`,
        type: "course",
        actionUrl: `/courses/${course.slug}`,
      });
    }

    if (status === "ARCHIVED" && currentCourse?.status !== "ARCHIVED") {
      await logCourseAuditEventSafe({
        courseId,
        title: "Course archived",
        description: `${course.title} was archived.`,
        type: "course",
        actionUrl: `/admin/courses/${courseId}/edit`,
      });
    }

    return NextResponse.json({
      ...course,
      instructor: course.instructor.name,
      price: Number(course.price),
    });
  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json(
      { error: "Failed to update course" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/courses/[courseId] - Delete a course
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ courseId: string }> },
) {
  try {
    const { courseId } = await context.params;

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 },
      );
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { imageUrl: true, title: true },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    await prisma.course.delete({ where: { id: courseId } });

    await logCourseAuditEventSafe({
      courseId,
      title: "Course deleted",
      description: `${course.title} was deleted from the catalog.`,
      type: "course",
      actionUrl: null,
    });

    if (course.imageUrl) {
      const deleted = await deleteS3Object(course.imageUrl);
      if (!deleted) {
        console.warn(
          "Course deleted but image could not be removed from storage",
          course.imageUrl,
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 },
    );
  }
}
