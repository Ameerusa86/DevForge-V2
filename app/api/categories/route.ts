import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureDefaultCategories } from "@/lib/categories-server";
import { normalizeContentTypeFilter } from "@/lib/content-type";
import { getErrorMessage } from "@/lib/utils";
import type { Prisma } from "@/lib/generated/prisma/client";

// GET /api/categories?type=COURSE|PROJECT_TUTORIAL|ALL - Public categories list for catalog filters and navigation
export async function GET(request: NextRequest) {
  try {
    await ensureDefaultCategories();

    const typeParam = request.nextUrl.searchParams.get("type");
    const typeFilter = typeParam
      ? normalizeContentTypeFilter(typeParam, "ALL")
      : "ALL";

    const categoryWhere: Prisma.CourseCategoryWhereInput = {
      isActive: true,
      ...(typeFilter === "COURSE"
        ? { scope: { in: ["BOTH", "COURSE"] } }
        : typeFilter === "PROJECT_TUTORIAL"
          ? { scope: { in: ["BOTH", "PROJECT_TUTORIAL"] } }
          : {}),
    };

    const [categories, publishedGrouped] = await Promise.all([
      prisma.courseCategory.findMany({
        where: categoryWhere,
        orderBy: [{ order: "asc" }, { name: "asc" }],
      }),
      prisma.course.groupBy({
        by: ["category", "contentType"],
        where: { status: "PUBLISHED" },
        _count: {
          _all: true,
        },
      }),
    ]);

    const courseCountMap = new Map<string, number>();
    const projectCountMap = new Map<string, number>();

    publishedGrouped.forEach((item) => {
      const targetMap =
        item.contentType === "PROJECT_TUTORIAL"
          ? projectCountMap
          : courseCountMap;
      const upper = item.category.toUpperCase();
      targetMap.set(item.category, (targetMap.get(item.category) ?? 0) + item._count._all);
      if (upper !== item.category) {
        targetMap.set(upper, (targetMap.get(upper) ?? 0) + item._count._all);
      }
    });

    const resolveCount = (
      map: Map<string, number>,
      slug: string,
      name: string,
    ) =>
      Math.max(
        map.get(slug) || 0,
        map.get(name) || 0,
        map.get(name.toUpperCase()) || 0,
      );

    const activeCategories = categories.map((cat) => {
      const courseCount = resolveCount(courseCountMap, cat.slug, cat.name);
      const projectCount = resolveCount(projectCountMap, cat.slug, cat.name);
      const totalCount = courseCount + projectCount;

      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon || "BookOpen",
        color: cat.color || "orange",
        scope: cat.scope,
        order: cat.order,
        courseCount:
          typeFilter === "PROJECT_TUTORIAL" ? projectCount : courseCount,
        projectCount,
        totalCount,
      };
    });

    return NextResponse.json({
      success: true,
      data: activeCategories,
    });
  } catch (error) {
    console.error("Error fetching public categories:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch categories",
        details: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
