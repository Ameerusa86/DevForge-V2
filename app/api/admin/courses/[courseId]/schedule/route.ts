import "server-only";

import { NextRequest, NextResponse } from "next/server";

import {
  getCourseScheduleById,
  setCourseSchedule,
} from "@/lib/course-schedule";
import { logCourseAuditEventSafe } from "@/lib/course-audit";

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

    const schedule = await getCourseScheduleById(courseId);
    return NextResponse.json({ schedule });
  } catch (error) {
    console.error("Error fetching course schedule:", error);
    return NextResponse.json(
      { error: "Failed to fetch course schedule" },
      { status: 500 },
    );
  }
}

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
    const publishAtRaw = body?.publishAt ?? null;
    const unpublishAtRaw = body?.unpublishAt ?? null;

    const publishAt = publishAtRaw ? new Date(publishAtRaw) : null;
    const unpublishAt = unpublishAtRaw ? new Date(unpublishAtRaw) : null;

    if (publishAt && Number.isNaN(publishAt.getTime())) {
      return NextResponse.json(
        { error: "Invalid publishAt value" },
        { status: 400 },
      );
    }

    if (unpublishAt && Number.isNaN(unpublishAt.getTime())) {
      return NextResponse.json(
        { error: "Invalid unpublishAt value" },
        { status: 400 },
      );
    }

    await setCourseSchedule(courseId, publishAt, unpublishAt);

    await logCourseAuditEventSafe({
      courseId,
      title: "Schedule updated",
      description: `Publish: ${publishAt ? publishAt.toISOString() : "none"}, Unpublish: ${unpublishAt ? unpublishAt.toISOString() : "none"}.`,
      type: "course",
      actionUrl: `/admin/courses/${courseId}/edit`,
    });

    const schedule = await getCourseScheduleById(courseId);
    return NextResponse.json({ success: true, schedule });
  } catch (error) {
    console.error("Error updating course schedule:", error);
    return NextResponse.json(
      { error: "Failed to update course schedule" },
      { status: 500 },
    );
  }
}
