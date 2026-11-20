import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { bulkUpdateAdminCatalog } from "@/lib/catalog-service";
import { isContentType, type ContentType } from "@/lib/content-type";
import { getErrorMessage } from "@/lib/utils";

const ALLOWED_STATUSES = new Set(["PUBLISHED", "DRAFT", "ARCHIVED"]);

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseIds, status, category, contentType } = body as {
      courseIds?: string[];
      status?: string;
      category?: string;
      contentType?: string;
    };

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json(
        { error: "courseIds must be a non-empty array" },
        { status: 400 },
      );
    }

    if (!status && !category && !contentType) {
      return NextResponse.json(
        {
          error:
            "At least one field (status, category, or contentType) is required",
        },
        { status: 400 },
      );
    }

    if (status && !ALLOWED_STATUSES.has(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    if (category !== undefined && (typeof category !== "string" || !category.trim())) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    if (contentType !== undefined && !isContentType(contentType)) {
      return NextResponse.json(
        { error: "Invalid contentType" },
        { status: 400 },
      );
    }

    const result = await bulkUpdateAdminCatalog({
      courseIds,
      status: status as "PUBLISHED" | "DRAFT" | "ARCHIVED" | undefined,
      category,
      contentType: contentType as ContentType | undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in bulk course update:", error);
    return NextResponse.json(
      {
        error: "Failed to update courses",
        details: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
