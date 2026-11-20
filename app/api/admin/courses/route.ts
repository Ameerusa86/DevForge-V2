import "server-only";

import { NextRequest, NextResponse } from "next/server";
import {
  createAdminCatalogItem,
  listAdminCatalogItems,
} from "@/lib/catalog-service";
import { normalizeContentTypeFilter } from "@/lib/content-type";
import { getErrorMessage } from "@/lib/utils";

// GET /api/admin/courses - Get courses (defaults to COURSE; pass ?type=ALL|COURSE|PROJECT_TUTORIAL)
export async function GET(request: NextRequest) {
  try {
    const typeParam = request.nextUrl.searchParams.get("type");
    const typeFilter = typeParam
      ? normalizeContentTypeFilter(typeParam, "COURSE")
      : "COURSE";

    const coursesWithStats = await listAdminCatalogItems(typeFilter);
    return NextResponse.json(coursesWithStats);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch courses",
        details: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

// POST /api/admin/courses - Create a new course (defaults to COURSE unless contentType specified)
export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    const { title, description, category, level, instructorId } = body;

    if (!title || !description || !category || !level || !instructorId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const course = await createAdminCatalogItem({
      ...body,
      contentType: body.contentType ?? "COURSE",
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json(
      {
        error: "Failed to create course",
        details: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
