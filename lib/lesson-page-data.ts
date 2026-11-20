import "server-only";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizeCoursePhases } from "@/lib/course-phases";
import type { ContentType } from "@/lib/content-type";
import type {
  LessonDetailCourse,
  LessonDetailState,
  LessonProgressData,
} from "@/components/lms/lesson-detail-client";

export async function getLessonPageData(
  slug: string,
  lessonId: string,
  expectedType: ContentType,
) {
  const [course, lesson] = await Promise.all([
    prisma.course.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        title: true,
        contentType: true,
        status: true,
        phases: true,
        showUnassignedHeader: true,
        lessons: {
          select: {
            id: true,
            title: true,
            order: true,
            isFree: true,
            moduleId: true,
            phaseId: true,
            videoUrl: true,
            durationSeconds: true,
          },
          orderBy: { order: "asc" },
        },
        modules: {
          select: {
            id: true,
            title: true,
            order: true,
            description: true,
            phaseId: true,
            lessons: {
              select: {
                id: true,
                title: true,
                order: true,
                isFree: true,
                moduleId: true,
                phaseId: true,
                videoUrl: true,
                durationSeconds: true,
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
        videoUrl: true,
        durationSeconds: true,
        quiz: {
          include: {
            questions: {
              orderBy: { order: "asc" },
              include: {
                options: {
                  orderBy: { order: "asc" },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  if (!course || course.status !== "PUBLISHED" || !lesson) {
    return null;
  }

  if (lesson.courseId !== course.id) {
    return null;
  }

  if (course.contentType !== expectedType) {
    return {
      mismatch: true as const,
      actualContentType: course.contentType,
      slug: course.slug,
      lessonId: lesson.id,
    };
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
  const itemNoun =
    course.contentType === "PROJECT_TUTORIAL" ? "project tutorial" : "course";

  const courseData: LessonDetailCourse = {
    id: course.id,
    slug: course.slug,
    title: course.title,
    contentType: course.contentType,
    phases: normalizeCoursePhases(course.phases),
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
    videoUrl: isLocked ? null : lesson.videoUrl,
    durationSeconds: lesson.durationSeconds,
    quiz: isLocked ? null : lesson.quiz,
    message: isLocked
      ? `This lesson requires enrollment. Please enroll in the ${itemNoun} to access this content.`
      : undefined,
  };

  return {
    mismatch: false as const,
    course: courseData,
    currentLesson: lessonData,
    enrollmentId,
    progressData,
  };
}
