import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { duplicateAdminCatalogItem } from "@/lib/catalog-service";
import { getErrorMessage } from "@/lib/utils";

export async function POST(
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

    const body = await request.json().catch(() => ({}));
    const includeCurriculum =
      body && typeof body.includeCurriculum === "boolean"
        ? body.includeCurriculum
        : true;

    const duplicated = await duplicateAdminCatalogItem(
      courseId,
      includeCurriculum,
    );

    if (!duplicated) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(duplicated, { status: 201 });
  } catch (error) {
    console.error("Error duplicating course:", error);
    return NextResponse.json(
      {
        error: "Failed to duplicate course",
        details: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
