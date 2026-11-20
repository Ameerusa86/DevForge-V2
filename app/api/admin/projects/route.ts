import "server-only";

import { NextRequest, NextResponse } from "next/server";
import {
  createAdminCatalogItem,
  listAdminCatalogItems,
} from "@/lib/catalog-service";
import { getErrorMessage } from "@/lib/utils";

// GET /api/admin/projects - List all Project Tutorials
export async function GET() {
  try {
    const projectsWithStats = await listAdminCatalogItems("PROJECT_TUTORIAL");
    return NextResponse.json(projectsWithStats);
  } catch (error) {
    console.error("Error fetching project tutorials:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch project tutorials",
        details: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

// POST /api/admin/projects - Create a new Project Tutorial
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

    const project = await createAdminCatalogItem(body, "PROJECT_TUTORIAL");
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project tutorial:", error);
    return NextResponse.json(
      {
        error: "Failed to create project tutorial",
        details: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
