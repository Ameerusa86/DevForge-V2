import "server-only";

import { NextRequest, NextResponse } from "next/server";
import {
  deleteAdminCatalogItem,
  getAdminCatalogItemById,
  updateAdminCatalogItem,
} from "@/lib/catalog-service";

// GET /api/admin/projects/[projectId] - Get a single Project Tutorial
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

    const project = await getAdminCatalogItemById(projectId);

    if (!project) {
      return NextResponse.json(
        { error: "Project tutorial not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project tutorial:", error);
    return NextResponse.json(
      { error: "Failed to fetch project tutorial" },
      { status: 500 },
    );
  }
}

// PATCH /api/admin/projects/[projectId] - Update a Project Tutorial (supports moving back to COURSE)
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
    const updated = await updateAdminCatalogItem(projectId, body);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating project tutorial:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/projects/[projectId] - Delete a Project Tutorial
export async function DELETE(
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

    const deleted = await deleteAdminCatalogItem(projectId);
    if (!deleted) {
      return NextResponse.json(
        { error: "Project tutorial not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(deleted);
  } catch (error) {
    console.error("Error deleting project tutorial:", error);
    return NextResponse.json(
      { error: "Failed to delete project tutorial" },
      { status: 500 },
    );
  }
}
