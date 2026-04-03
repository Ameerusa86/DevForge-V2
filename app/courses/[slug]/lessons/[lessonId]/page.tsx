import "server-only";

import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  LessonDetailClient,
  type LessonDetailCourse,
  type LessonDetailState,
  type LessonProgressData,
} from "@/components/lms/lesson-detail-client";

export const dynamic = "force-dynamic";

async function getLessonPageData(slug: string, lessonId: string) {
  const [course, lesson] = await Promise.all([
    prisma.course.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        showUnassignedHeader: true,
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
      },
    }),
    prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        title: true,
        content: true,
        order: true,
        isFree: true,
        courseId: true,
      },
    }),
  ]);

  if (!course || course.status !== "PUBLISHED" || !lesson) {
    return null;
  }

  if (lesson.courseId !== course.id) {
    return null;
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  let enrollmentId: string | null = null;
  let progressData: LessonProgressData | null = null;

  if (session?.user?.id) {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: course.id,
        },
      },
    });

    if (enrollment) {
      enrollmentId = enrollment.id;

      const lessonProgressRows = await prisma.lessonProgress.findMany({
        where: {
          userId: session.user.id,
          lesson: {
            courseId: course.id,
          },
        },
        select: {
          lessonId: true,
          completed: true,
        },
      });

      const totalLessons = course.lessons.length;
      const completedLessons = lessonProgressRows.filter(
        (row) => row.completed,
      ).length;
      const progress =
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0;

      progressData = {
        progress,
        completedLessons,
        totalLessons,
        isComplete: progress === 100,
        lessonProgress: Object.fromEntries(
          lessonProgressRows.map((row) => [row.lessonId, row.completed]),
        ),
      };
    }
  }

  const isLocked = !lesson.isFree && !enrollmentId;

  const courseData: LessonDetailCourse = {
    id: course.id,
    slug: course.slug,
    title: course.title,
    lessons: course.lessons,
    modules: course.modules,
    showUnassignedHeader: course.showUnassignedHeader,
  };

  const lessonData: LessonDetailState = {
    id: lesson.id,
    title: lesson.title,
    content: isLocked ? null : lesson.content,
    order: lesson.order,
    isFree: lesson.isFree,
    isLocked,
    message: isLocked
      ? "This lesson requires enrollment. Please enroll in the course to access this content."
      : undefined,
  };

  return {
    course: courseData,
    currentLesson: lessonData,
    enrollmentId,
    progressData,
  };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}) {
  const { slug, lessonId } = await params;

  if (!slug || !lessonId) {
    notFound();
  }

  const pageData = await getLessonPageData(slug, lessonId);

  if (!pageData) {
    notFound();
  }

  return (
    <LessonDetailClient
      course={pageData.course}
      currentLesson={pageData.currentLesson}
      initialEnrollmentId={pageData.enrollmentId}
      initialProgressData={pageData.progressData}
    />
  );
}
