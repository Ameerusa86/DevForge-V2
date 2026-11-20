import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { listPublishedCatalogItems } from "@/lib/catalog-service";
import { normalizeContentTypeFilter } from "@/lib/content-type";

/**
 * GET /api/courses - Get published courses (defaults to contentType=COURSE; supports ?type=ALL|COURSE|PROJECT_TUTORIAL)
 */
export async function GET(request: NextRequest) {
  try {
    const typeParam = request.nextUrl.searchParams.get("type");
    const typeFilter = typeParam
      ? normalizeContentTypeFilter(typeParam, "COURSE")
      : "COURSE";

    const coursesWithStats = await listPublishedCatalogItems(typeFilter);
    return NextResponse.json(coursesWithStats);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 },
    );
  }
}
