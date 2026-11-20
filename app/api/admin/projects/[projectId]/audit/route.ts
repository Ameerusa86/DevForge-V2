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

    const project = await prisma.course.findUnique({
      where: { id: projectId },
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

    if (!project) {
      return NextResponse.json(
        { error: "Project tutorial not found" },
        { status: 404 },
      );
    }

    const meta = getContentTypeMeta(project.contentType);
    let events = await getCourseAuditEvents(projectId, 80);

    if (events.length === 0) {
      await logCourseAuditEventSafe({
        courseId: projectId,
        title: `${meta.singular} created`,
        description: `${meta.singular} was created by ${project.instructor.name}.`,
        type: "course",
        actionUrl: getAdminEditHref(project.contentType, projectId),
        occurredAt: project.createdAt,
      });

      if (project.publishedAt) {
        await logCourseAuditEventSafe({
          courseId: projectId,
          title: `${meta.singular} published`,
          description: `${meta.singular} was published and made visible to learners.`,
          type: "course",
          actionUrl: getItemHref(project.contentType, project.slug),
          occurredAt: project.publishedAt,
        });
      }

      events = await getCourseAuditEvents(projectId, 80);
    }

    return NextResponse.json({
      course: {
        id: project.id,
        title: project.title,
        status: project.status,
        contentType: project.contentType,
      },
      events,
    });
  } catch (error) {
    console.error("Error fetching project audit timeline:", error);
    return NextResponse.json(
      { error: "Failed to fetch project audit timeline" },
      { status: 500 },
    );
  }
}
