import "server-only";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/lessons - Get all lessons for a course
export async function GET(request: NextRequest) {
  try {
    const courseId = request.nextUrl.searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 },
      );
    }

    const lessons = await prisma.lesson.findMany({
      where: { courseId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(lessons);
  } catch (error) {
    console.error("Error fetching lessons:", error);
    return NextResponse.json(
      { error: "Failed to fetch lessons" },
      { status: 500 },
    );
  }
}

// POST /api/admin/lessons - Create a new lesson
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseId, title, content, order, isFree, moduleId } = body;

    if (!courseId || !title || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const lesson = await prisma.lesson.create({
      data: {
        courseId,
        title,
        content,
        order: order || 0,
        isFree: isFree || false,
        moduleId: moduleId || null,
      },
    });

    return NextResponse.json(lesson, { status: 201 });
  } catch (error) {
    console.error("Error creating lesson:", error);
    return NextResponse.json(
      { error: "Failed to create lesson" },
      { status: 500 },
    );
  }
}
