import "server-only";

import { NextResponse } from "next/server";
import { getPublishedCatalogItemBySlug } from "@/lib/catalog-service";
import { getErrorMessage } from "@/lib/utils";

/**
 * GET /api/projects/[slug] - Fetch a single published Project Tutorial by slug
 * Enforces server-side gating of starterRepoUrl & githubUrl for paid projects.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const result = await getPublishedCatalogItemBySlug(slug, "PROJECT_TUTORIAL");

    if (!result || result.mismatch) {
      return NextResponse.json(
        { error: "Project tutorial not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error fetching project tutorial by slug", error);
    return NextResponse.json(
      {
        error: "Failed to fetch project tutorial",
        details: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
