import "server-only";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureDefaultCategories } from "@/lib/categories-server";
import { getErrorMessage } from "@/lib/utils";

// GET /api/categories - Public categories list for catalog filters and navigation
export async function GET() {
  try {
    await ensureDefaultCategories();

    const [categories, publishedCourses] = await Promise.all([
      prisma.courseCategory.findMany({
        where: { isActive: true },
        orderBy: [{ order: "asc" }, { name: "asc" }],
      }),
      prisma.course.groupBy({
        by: ["category"],
        where: { status: "PUBLISHED" },
        _count: {
          _all: true,
        },
      }),
    ]);

    const countMap = new Map<string, number>();
    publishedCourses.forEach((item) => {
      countMap.set(item.category, item._count._all);
      countMap.set(item.category.toUpperCase(), item._count._all);
    });

    const activeCategories = categories.map((cat) => {
      const directCount = countMap.get(cat.slug) || 0;
      const nameCount = countMap.get(cat.name) || 0;
      const upperNameCount = countMap.get(cat.name.toUpperCase()) || 0;
      const count = Math.max(directCount, nameCount, upperNameCount);

      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon || "BookOpen",
        color: cat.color || "orange",
        order: cat.order,
        courseCount: count,
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
