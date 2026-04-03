import "server-only";

import { prisma } from "@/lib/db";
import { getErrorMessage } from "@/lib/utils";
import { NextResponse } from "next/server";

// Public endpoint to fetch a single published course by slug
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const course = await prisma.course.findUnique({
      where: { slug },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lessons: {
          select: {
            id: true,
            title: true,
            order: true,
            isFree: true,
            moduleId: true,
          },
          orderBy: { order: "asc" },
        },
        modules: {
          select: {
            id: true,
            title: true,
            order: true,
            description: true,
            lessons: {
              select: {
                id: true,
                title: true,
                order: true,
                isFree: true,
                moduleId: true,
              },
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
        enrollments: true,
      },
    });

    if (!course || course.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const payload = {
      ...course,
      instructor: course.instructor.name,
      lessons: course.lessons,
      modules: course.modules,
      showUnassignedHeader: course.showUnassignedHeader,
      enrollments: course.enrollments.length,
      price: Number(course.price),
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Error fetching course by slug", error);
    return NextResponse.json(
      {
        error: "Failed to fetch course",
        details: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
