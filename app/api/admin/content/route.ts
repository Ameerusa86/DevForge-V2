import "server-only";

import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const lessons = await prisma.lesson.findMany({
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
          },
        },
        module: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const mapped = lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      order: lesson.order,
      isFree: lesson.isFree,
      wordCount: lesson.content
        ? lesson.content
            .replace(/<[^>]*>/g, " ")
            .split(/\s+/)
            .filter(Boolean).length
        : 0,
      contentLength: lesson.content?.length ?? 0,
      isEmpty: !lesson.content || lesson.content.trim().length < 50,
      createdAt: lesson.createdAt.toISOString(),
      updatedAt: lesson.updatedAt.toISOString(),
      courseId: lesson.courseId,
      courseTitle: lesson.course.title,
      courseSlug: lesson.course.slug,
      courseStatus: lesson.course.status,
      moduleId: lesson.moduleId ?? null,
      moduleTitle: lesson.module?.title ?? null,
    }));

    const stats = {
      total: mapped.length,
      free: mapped.filter((l) => l.isFree).length,
      paid: mapped.filter((l) => !l.isFree).length,
      empty: mapped.filter((l) => l.isEmpty).length,
      recentlyUpdated: mapped.filter((l) => {
        const days =
          (Date.now() - new Date(l.updatedAt).getTime()) /
          (1000 * 60 * 60 * 24);
        return days <= 7;
      }).length,
      avgWordCount:
        mapped.length > 0
          ? Math.round(
              mapped.reduce((sum, l) => sum + l.wordCount, 0) / mapped.length,
            )
          : 0,
    };

    return NextResponse.json({ lessons: mapped, stats });
  } catch (error) {
    console.error("Error fetching content:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 },
    );
  }
}
