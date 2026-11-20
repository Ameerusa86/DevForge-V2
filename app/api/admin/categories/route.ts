import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateCategorySlug } from "@/lib/categories";
import { ensureDefaultCategories } from "@/lib/categories-server";
import { normalizeCategoryScope } from "@/lib/content-type";
import { getErrorMessage } from "@/lib/utils";
import type { Prisma } from "@/lib/generated/prisma/client";

// GET /api/admin/categories - Get all categories with split courseCount & projectCount
export async function GET(request: NextRequest) {
  try {
    await ensureDefaultCategories();

    const scopeParam = request.nextUrl.searchParams.get("scope");
    const where: Prisma.CourseCategoryWhereInput = {};
    if (scopeParam) {
      const upper = scopeParam.trim().toUpperCase();
      if (upper === "COURSE") {
        where.scope = { in: ["BOTH", "COURSE"] };
      } else if (upper === "PROJECT_TUTORIAL") {
        where.scope = { in: ["BOTH", "PROJECT_TUTORIAL"] };
      } else if (upper === "BOTH") {
        where.scope = "BOTH";
      }
    }

    const [categories, groupedCourses] = await Promise.all([
      prisma.courseCategory.findMany({
        where,
        orderBy: [{ order: "asc" }, { name: "asc" }],
      }),
      prisma.course.groupBy({
        by: ["category", "contentType"],
        _count: {
          _all: true,
        },
      }),
    ]);

    const courseCountMap = new Map<string, number>();
    const projectCountMap = new Map<string, number>();

    groupedCourses.forEach((item) => {
      const targetMap =
        item.contentType === "PROJECT_TUTORIAL"
          ? projectCountMap
          : courseCountMap;
      const upper = item.category.toUpperCase();
      targetMap.set(
        item.category,
        (targetMap.get(item.category) ?? 0) + item._count._all,
      );
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

    const categoriesWithStats = categories.map((cat) => {
      const courseCount = resolveCount(courseCountMap, cat.slug, cat.name);
      const projectCount = resolveCount(projectCountMap, cat.slug, cat.name);

      return {
        ...cat,
        createdAt: cat.createdAt.toISOString(),
        updatedAt: cat.updatedAt.toISOString(),
        courseCount,
        projectCount,
        totalCount: courseCount + projectCount,
      };
    });

    return NextResponse.json({
      success: true,
      data: categoriesWithStats,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
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

// POST /api/admin/categories - Create a new category
export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    const { name, slug, description, icon, color, scope, order, isActive } =
      body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Category name is required" },
        { status: 400 },
      );
    }

    const normalizedName = name.trim();
    const finalSlug = (
      slug && typeof slug === "string" && slug.trim()
        ? slug.trim()
        : generateCategorySlug(normalizedName)
    ).toUpperCase();

    const existing = await prisma.courseCategory.findUnique({
      where: { slug: finalSlug },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: `A category with slug '${finalSlug}' already exists.`,
        },
        { status: 409 },
      );
    }

    let parsedOrder = 0;
    if (order !== undefined && order !== null) {
      parsedOrder = parseInt(String(order), 10) || 0;
    } else {
      const last = await prisma.courseCategory.findFirst({
        orderBy: { order: "desc" },
        select: { order: true },
      });
      parsedOrder = (last?.order ?? -1) + 1;
    }

    const category = await prisma.courseCategory.create({
      data: {
        name: normalizedName,
        slug: finalSlug,
        description: description ? String(description).trim() : null,
        icon: icon ? String(icon).trim() : "BookOpen",
        color: color ? String(color).trim() : "orange",
        scope: normalizeCategoryScope(scope, "BOTH"),
        order: parsedOrder,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...category,
          createdAt: category.createdAt.toISOString(),
          updatedAt: category.updatedAt.toISOString(),
          courseCount: 0,
          projectCount: 0,
          totalCount: 0,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create category",
        details: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
