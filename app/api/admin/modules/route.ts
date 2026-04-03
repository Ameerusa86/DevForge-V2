import "server-only";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/modules?courseId= - list modules for a course
export async function GET(request: NextRequest) {
  try {
    const courseId = request.nextUrl.searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 },
      );
    }

    const modules = await prisma.module.findMany({
      where: { courseId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(modules);
  } catch (error) {
    console.error("Error fetching modules:", error);
    return NextResponse.json(
      { error: "Failed to fetch modules" },
      { status: 500 },
    );
  }
}

// POST /api/admin/modules - create a module
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseId, title, order, description } = body;

    if (!courseId || !title) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    let nextOrder = Number.isFinite(order) ? Number(order) : null;

    if (!nextOrder || nextOrder < 1) {
      const last = await prisma.module.findFirst({
        where: { courseId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      nextOrder = (last?.order ?? 0) + 1;
    }

    const moduleItem = await prisma.module.create({
      data: {
        courseId,
        title,
        order: nextOrder,
        description: description || null,
      },
    });

    return NextResponse.json(moduleItem, { status: 201 });
  } catch (error) {
    console.error("Error creating module:", error);
    return NextResponse.json(
      { error: "Failed to create module" },
      { status: 500 },
    );
  }
}
