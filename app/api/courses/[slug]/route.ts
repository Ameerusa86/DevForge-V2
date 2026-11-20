import "server-only";

import { NextResponse } from "next/server";
import { getPublishedCatalogItemBySlug } from "@/lib/catalog-service";
import { getErrorMessage } from "@/lib/utils";

// Public endpoint to fetch a single published course by slug
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const result = await getPublishedCatalogItemBySlug(slug, "COURSE");

    if (!result || result.mismatch) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error fetching course by slug", error);
    return NextResponse.json(
      {
        error: "Failed to fetch course",
        details: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
