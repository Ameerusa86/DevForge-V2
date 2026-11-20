import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getCourseAuditEvents,
  logCourseAuditEventSafe,
} from "@/lib/course-audit";
import {
  getAdminEditHref,
  getContentTypeMeta,
  getItemHref,
} from "@/lib/content-type";

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

    const meta = getContentTypeMeta(course.contentType);
    let events = await getCourseAuditEvents(courseId, 80);

    if (events.length === 0) {
      await logCourseAuditEventSafe({
        courseId,
        title: `${meta.singular} created`,
        description: `${meta.singular} was created by ${course.instructor.name}.`,
        type: "course",
        actionUrl: getAdminEditHref(course.contentType, courseId),
        occurredAt: course.createdAt,
      });

      if (course.publishedAt) {
        await logCourseAuditEventSafe({
          courseId,
          title: `${meta.singular} published`,
          description: `${meta.singular} was published and made visible to learners.`,
          type: "course",
          actionUrl: getItemHref(course.contentType, course.slug),
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
        contentType: course.contentType,
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
