import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";

type AuditEvent = {
  id: string;
  title: string;
  description: string;
  occurredAt: string;
  type: "course" | "module" | "lesson" | "enrollment" | "review";
};

export async function GET(
  _request: NextRequest,
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

    const [course, modules, lessons, enrollments, reviews] = await Promise.all([
      prisma.course.findUnique({
        where: { id: courseId },
        include: {
          instructor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.module.findMany({
        where: { courseId },
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.lesson.findMany({
        where: { courseId },
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
      prisma.enrollment.findMany({
        where: { courseId },
        select: {
          id: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
      prisma.review.findMany({
        where: { courseId },
        select: {
          id: true,
          rating: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
    ]);

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const events: AuditEvent[] = [];

    events.push({
      id: `course-created-${course.id}`,
      title: "Course created",
      description: `Course was created by ${course.instructor.name}.`,
      occurredAt: course.createdAt.toISOString(),
      type: "course",
    });

    if (course.publishedAt) {
      events.push({
        id: `course-published-${course.id}`,
        title: "Course published",
        description: `Course was published and made visible to students.`,
        occurredAt: course.publishedAt.toISOString(),
        type: "course",
      });
    }

    events.push({
      id: `course-updated-${course.id}`,
      title: "Course updated",
      description: "Latest metadata/content update timestamp.",
      occurredAt: course.updatedAt.toISOString(),
      type: "course",
    });

    for (const moduleItem of modules) {
      events.push({
        id: `module-created-${moduleItem.id}`,
        title: "Module added",
        description: `${moduleItem.title}`,
        occurredAt: moduleItem.createdAt.toISOString(),
        type: "module",
      });
    }

    for (const lesson of lessons) {
      events.push({
        id: `lesson-created-${lesson.id}`,
        title: "Lesson added",
        description: `${lesson.title}`,
        occurredAt: lesson.createdAt.toISOString(),
        type: "lesson",
      });
    }

    for (const enrollment of enrollments) {
      events.push({
        id: `enrollment-${enrollment.id}`,
        title: "New enrollment",
        description: `${enrollment.user.name || enrollment.user.email} enrolled.`,
        occurredAt: enrollment.createdAt.toISOString(),
        type: "enrollment",
      });
    }

    for (const review of reviews) {
      events.push({
        id: `review-${review.id}`,
        title: "Review submitted",
        description: `${review.user.name || review.user.email} rated ${review.rating}/5.`,
        occurredAt: review.createdAt.toISOString(),
        type: "review",
      });
    }

    events.sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );

    return NextResponse.json({
      course: {
        id: course.id,
        title: course.title,
        status: course.status,
      },
      events: events.slice(0, 60),
    });
  } catch (error) {
    console.error("Error fetching course audit timeline:", error);
    return NextResponse.json(
      { error: "Failed to fetch course audit timeline" },
      { status: 500 },
    );
  }
}
