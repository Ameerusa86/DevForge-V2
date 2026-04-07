import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { logCourseAuditEventSafe } from "@/lib/course-audit";
import { getErrorMessage } from "@/lib/utils";

const ALLOWED_STATUSES = new Set(["PUBLISHED", "DRAFT", "ARCHIVED"]);
const ALLOWED_CATEGORIES = new Set([
  "FRONTEND",
  "BACKEND",
  "FULL_STACK",
  "PYTHON",
  "JAVASCRIPT",
  "TYPESCRIPT",
  "CSHARP",
  "DOT_NET",
  "ASP_NET",
]);

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseIds, status, category } = body as {
      courseIds?: string[];
      status?: string;
      category?: string;
    };

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json(
        { error: "courseIds must be a non-empty array" },
        { status: 400 },
      );
    }

    if (!status && !category) {
      return NextResponse.json(
        { error: "At least one field (status or category) is required" },
        { status: 400 },
      );
    }

    if (status && !ALLOWED_STATUSES.has(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    if (category && !ALLOWED_CATEGORIES.has(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const updateData: {
      status?: "PUBLISHED" | "DRAFT" | "ARCHIVED";
      category?:
        | "FRONTEND"
        | "BACKEND"
        | "FULL_STACK"
        | "PYTHON"
        | "JAVASCRIPT"
        | "TYPESCRIPT"
        | "CSHARP"
        | "DOT_NET"
        | "ASP_NET";
      publishedAt?: Date | null;
    } = {};

    if (status) {
      updateData.status = status as "PUBLISHED" | "DRAFT" | "ARCHIVED";
      updateData.publishedAt = status === "PUBLISHED" ? new Date() : null;
    }

    if (category) {
      updateData.category = category as
        | "FRONTEND"
        | "BACKEND"
        | "FULL_STACK"
        | "PYTHON"
        | "JAVASCRIPT"
        | "TYPESCRIPT"
        | "CSHARP"
        | "DOT_NET"
        | "ASP_NET";
    }

    const result = await prisma.course.updateMany({
      where: { id: { in: courseIds } },
      data: updateData,
    });

    const updatedCourses = await prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: { id: true, title: true, slug: true },
    });

    const actionParts = [
      status ? `status -> ${status}` : null,
      category ? `category -> ${category}` : null,
    ].filter(Boolean);

    await Promise.all(
      updatedCourses.map((course) =>
        logCourseAuditEventSafe({
          courseId: course.id,
          title: "Bulk update applied",
          description:
            actionParts.length > 0
              ? `Bulk action updated ${actionParts.join(" and ")}.`
              : "Bulk action updated this course.",
          type: "course",
          actionUrl: `/admin/courses/${course.id}/edit`,
        }),
      ),
    );

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
    });
  } catch (error) {
    console.error("Error in bulk course update:", error);
    return NextResponse.json(
      {
        error: "Failed to update courses",
        details: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
