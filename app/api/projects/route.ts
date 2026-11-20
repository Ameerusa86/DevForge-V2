import "server-only";

import { NextResponse } from "next/server";
import { listPublishedCatalogItems } from "@/lib/catalog-service";

/**
 * GET /api/projects - Get all published Project Tutorials (public endpoint)
 */
export async function GET() {
  try {
    const projectsWithStats = await listPublishedCatalogItems("PROJECT_TUTORIAL");
    return NextResponse.json(projectsWithStats);
  } catch (error) {
    console.error("Error fetching project tutorials:", error);
    return NextResponse.json(
      { error: "Failed to fetch project tutorials" },
      { status: 500 },
    );
  }
}
