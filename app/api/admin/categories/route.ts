import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateCategorySlug } from "@/lib/categories";
import { ensureDefaultCategories } from "@/lib/categories-server";
import { getErrorMessage } from "@/lib/utils";

// GET /api/admin/categories - Get all categories with course count
export async function GET() {
  try {
    await ensureDefaultCategories();

    const [categories, courses] = await Promise.all([
      prisma.courseCategory.findMany({
        orderBy: [{ order: "asc" }, { name: "asc" }],
      }),
      prisma.course.groupBy({
        by: ["category"],
        _count: {
          _all: true,
        },
      }),
    ]);

    const countMap = new Map<string, number>();
    courses.forEach((item) => {
      countMap.set(item.category, item._count._all);
      countMap.set(item.category.toUpperCase(), item._count._all);
    });

    const categoriesWithStats = categories.map((cat) => {
      const directCount = countMap.get(cat.slug) || 0;
      const nameCount = countMap.get(cat.name) || 0;
      const upperNameCount = countMap.get(cat.name.toUpperCase()) || 0;
      const count = Math.max(directCount, nameCount, upperNameCount);

      return {
        ...cat,
        createdAt: cat.createdAt.toISOString(),
        updatedAt: cat.updatedAt.toISOString(),
        courseCount: count,
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

    const { name, slug, description, icon, color, order, isActive } = body;

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

    // Check slug uniqueness
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
