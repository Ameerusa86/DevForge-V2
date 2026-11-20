import "server-only";

import { NextRequest, NextResponse } from "next/server";
import {
  getCourseScheduleById,
  setCourseSchedule,
} from "@/lib/course-schedule";
import { logCourseAuditEventSafe } from "@/lib/course-audit";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await context.params;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 },
      );
    }

    const schedule = await getCourseScheduleById(projectId);
    return NextResponse.json({ schedule });
  } catch (error) {
    console.error("Error fetching project schedule:", error);
    return NextResponse.json(
      { error: "Failed to fetch project schedule" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await context.params;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
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

    await setCourseSchedule(projectId, publishAt, unpublishAt);

    await logCourseAuditEventSafe({
      courseId: projectId,
      title: "Schedule updated",
      description: `Publish: ${publishAt ? publishAt.toISOString() : "none"}, Unpublish: ${unpublishAt ? unpublishAt.toISOString() : "none"}.`,
      type: "course",
      actionUrl: `/admin/projects/${projectId}/edit`,
    });

    const schedule = await getCourseScheduleById(projectId);
    return NextResponse.json({ success: true, schedule });
  } catch (error) {
    console.error("Error updating project schedule:", error);
    return NextResponse.json(
      { error: "Failed to update project schedule" },
      { status: 500 },
    );
  }
}
