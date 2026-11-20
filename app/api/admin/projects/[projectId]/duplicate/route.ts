import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { duplicateAdminCatalogItem } from "@/lib/catalog-service";
import { getErrorMessage } from "@/lib/utils";

export async function POST(
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

    const body = await request.json().catch(() => ({}));
    const includeCurriculum =
      body && typeof body.includeCurriculum === "boolean"
        ? body.includeCurriculum
        : true;

    const duplicated = await duplicateAdminCatalogItem(
      projectId,
      includeCurriculum,
    );

    if (!duplicated) {
      return NextResponse.json(
        { error: "Project tutorial not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(duplicated, { status: 201 });
  } catch (error) {
    console.error("Error duplicating project tutorial:", error);
    return NextResponse.json(
      {
        error: "Failed to duplicate project tutorial",
        details: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
