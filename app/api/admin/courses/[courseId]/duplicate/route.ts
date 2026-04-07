import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { generateSlug } from "@/lib/slug";
import { getErrorMessage } from "@/lib/utils";

async function createUniqueSlug(baseTitle: string) {
  const base = generateSlug(baseTitle);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const suffix = attempt === 0 ? "" : `-${attempt + 1}`;
    const candidate = `${base}${suffix}`;

    const existing = await prisma.course.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }
  }

  return `${base}-${Date.now()}`;
}

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

    const sourceCourse = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: { order: "asc" },
        },
        lessons: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!sourceCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const copiedTitle = `${sourceCourse.title} (Copy)`;
    const copiedSlug = await createUniqueSlug(copiedTitle);

    const duplicated = await prisma.$transaction(async (tx) => {
      const createdCourse = await tx.course.create({
        data: {
          title: copiedTitle,
          slug: copiedSlug,
          description: sourceCourse.description,
          category: sourceCourse.category,
          level: sourceCourse.level,
          tags: sourceCourse.tags,
          price: sourceCourse.price,
          durationMinutes: sourceCourse.durationMinutes,
          imageUrl: sourceCourse.imageUrl,
          showUnassignedHeader: sourceCourse.showUnassignedHeader,
          status: "DRAFT",
          publishedAt: null,
          instructorId: sourceCourse.instructorId,
          userId: sourceCourse.userId,
        },
      });

      if (!includeCurriculum) {
        return createdCourse;
      }

      const moduleIdMap = new Map<string, string>();

      for (const moduleItem of sourceCourse.modules) {
        const newModule = await tx.module.create({
          data: {
            courseId: createdCourse.id,
            title: moduleItem.title,
            order: moduleItem.order,
            description: moduleItem.description,
          },
        });
        moduleIdMap.set(moduleItem.id, newModule.id);
      }

      if (sourceCourse.lessons.length > 0) {
        await tx.lesson.createMany({
          data: sourceCourse.lessons.map((lesson) => ({
            courseId: createdCourse.id,
            moduleId: lesson.moduleId
              ? (moduleIdMap.get(lesson.moduleId) ?? null)
              : null,
            title: lesson.title,
            order: lesson.order,
            content: lesson.content,
            isFree: lesson.isFree,
          })),
        });
      }

      return createdCourse;
    });

    return NextResponse.json(
      {
        id: duplicated.id,
        title: duplicated.title,
        slug: duplicated.slug,
      },
      { status: 201 },
    );
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
