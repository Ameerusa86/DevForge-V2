import "server-only";

import { NextRequest, NextResponse } from "next/server";
import {
  deleteAdminCatalogItem,
  getAdminCatalogItemById,
  updateAdminCatalogItem,
} from "@/lib/catalog-service";

// GET /api/admin/courses/[courseId] - Get a single course or project tutorial
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

    const course = await getAdminCatalogItemById(courseId);

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

// PATCH /api/admin/courses/[courseId] - Update a course (supports reclassifying contentType)
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
    const updated = await updateAdminCatalogItem(courseId, body);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
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

    const deleted = await deleteAdminCatalogItem(courseId);
    if (!deleted) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(deleted);
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 },
    );
  }
}
