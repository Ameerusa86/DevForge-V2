import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import {
  getCourseAuditEvents,
  logCourseAuditEventSafe,
} from "@/lib/course-audit";

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
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    let events = await getCourseAuditEvents(courseId, 80);

    // Seed legacy courses once so they have an initial persisted timeline.
    if (events.length === 0) {
      await logCourseAuditEventSafe({
        courseId,
        title: "Course created",
        description: `Course was created by ${course.instructor.name}.`,
        type: "course",
        actionUrl: `/admin/courses/${courseId}/edit`,
        occurredAt: course.createdAt,
      });

      if (course.publishedAt) {
        await logCourseAuditEventSafe({
          courseId,
          title: "Course published",
          description: "Course was published and made visible to students.",
          type: "course",
          actionUrl: `/courses/${course.slug}`,
          occurredAt: course.publishedAt,
        });
      }

      events = await getCourseAuditEvents(courseId, 80);
    }

    return NextResponse.json({
      course: {
        id: course.id,
        title: course.title,
        status: course.status,
      },
      events,
    });
  } catch (error) {
    console.error("Error fetching course audit timeline:", error);
    return NextResponse.json(
      { error: "Failed to fetch course audit timeline" },
      { status: 500 },
    );
  }
}
