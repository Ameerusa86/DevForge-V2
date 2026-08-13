import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateCategorySlug } from "@/lib/categories";
import { getErrorMessage } from "@/lib/utils";

// GET /api/admin/categories/[categoryId]
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ categoryId: string }> },
) {
  try {
    const { categoryId } = await context.params;

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: "Category ID is required" },
        { status: 400 },
      );
    }

    const category = await prisma.courseCategory.findFirst({
      where: {
        OR: [{ id: categoryId }, { slug: categoryId.toUpperCase() }],
      },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 },
      );
    }

    const courseCount = await prisma.course.count({
      where: {
        OR: [{ category: category.slug }, { category: category.name }],
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...category,
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString(),
        courseCount,
      },
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch category",
        details: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}

// PATCH /api/admin/categories/[categoryId] - Update category
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ categoryId: string }> },
) {
  try {
    const { categoryId } = await context.params;

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: "Category ID is required" },
        { status: 400 },
      );
    }

    const existing = await prisma.courseCategory.findUnique({
      where: { id: categoryId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { name, slug, description, icon, color, order, isActive } = body;

    const updateData: {
      name?: string;
      slug?: string;
      description?: string | null;
      icon?: string;
      color?: string;
      order?: number;
      isActive?: boolean;
    } = {};

    if (name !== undefined) {
      if (!name || typeof name !== "string" || !name.trim()) {
        return NextResponse.json(
          { success: false, error: "Category name cannot be empty" },
          { status: 400 },
        );
      }
      updateData.name = name.trim();
    }

    let finalSlug: string | undefined;
    if (slug !== undefined) {
      finalSlug = (
        slug && typeof slug === "string" && slug.trim()
          ? slug.trim()
          : generateCategorySlug(updateData.name || existing.name)
      ).toUpperCase();

      if (finalSlug !== existing.slug) {
        const slugExists = await prisma.courseCategory.findUnique({
          where: { slug: finalSlug },
        });
        if (slugExists && slugExists.id !== categoryId) {
          return NextResponse.json(
            {
              success: false,
              error: `Category slug '${finalSlug}' is already in use.`,
            },
            { status: 409 },
          );
        }
        updateData.slug = finalSlug;
      }
    }

    if (description !== undefined) {
      updateData.description = description ? String(description).trim() : null;
    }

    if (icon !== undefined) {
      updateData.icon = icon ? String(icon).trim() : "BookOpen";
    }

    if (color !== undefined) {
      updateData.color = color ? String(color).trim() : "orange";
    }

    if (order !== undefined) {
      updateData.order = parseInt(String(order), 10) || 0;
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    const updated = await prisma.courseCategory.update({
      where: { id: categoryId },
      data: updateData,
    });

    // If slug changed, cascade update courses with the old slug
    if (finalSlug && finalSlug !== existing.slug) {
      await prisma.course.updateMany({
        where: { category: existing.slug },
        data: { category: finalSlug },
      });
    }

    const courseCount = await prisma.course.count({
      where: {
        OR: [{ category: updated.slug }, { category: updated.name }],
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        courseCount,
      },
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update category",
        details: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/categories/[categoryId] - Delete category
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ categoryId: string }> },
) {
  try {
    const { categoryId } = await context.params;

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: "Category ID is required" },
        { status: 400 },
      );
    }

    const category = await prisma.courseCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 },
      );
    }

    // Check query params or body for reassignToSlug
    const url = new URL(request.url);
    let reassignToSlug = url.searchParams.get("reassignTo");

    if (!reassignToSlug) {
      try {
        const body = await request.json();
        reassignToSlug = body?.reassignToSlug || null;
      } catch {
        // body is optional
      }
    }

    const coursesInCat = await prisma.course.count({
      where: {
        OR: [{ category: category.slug }, { category: category.name }],
      },
    });

    if (coursesInCat > 0) {
      if (reassignToSlug) {
        const targetCategory = await prisma.courseCategory.findFirst({
          where: {
            OR: [
              { slug: reassignToSlug.toUpperCase() },
              { id: reassignToSlug },
              { name: reassignToSlug },
            ],
          },
        });

        if (!targetCategory) {
          return NextResponse.json(
            {
              success: false,
              error: `Target reassignment category '${reassignToSlug}' not found.`,
            },
            { status: 400 },
          );
        }

        if (targetCategory.id === category.id) {
          return NextResponse.json(
            {
              success: false,
              error: "Cannot reassign courses to the category being deleted.",
            },
            { status: 400 },
          );
        }

        // Reassign courses
        await prisma.course.updateMany({
          where: {
            OR: [{ category: category.slug }, { category: category.name }],
          },
          data: { category: targetCategory.slug },
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: `Cannot delete '${category.name}' because ${coursesInCat} course(s) are currently assigned to it. Please provide a replacement category to reassign them to.`,
            courseCount: coursesInCat,
          },
          { status: 409 },
        );
      }
    }

    await prisma.courseCategory.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({
      success: true,
      message: `Category '${category.name}' deleted successfully.`,
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete category",
        details: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
