import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import {
  analyzeLessonContent,
  type ContentLesson,
  type ContentQaIssue,
  type ContentStats,
  type CourseContentSummary,
} from "@/lib/content-audit";
import { logCourseAuditEventSafe } from "@/lib/course-audit";
import { normalizeCoursePhases, resolveCoursePhaseId } from "@/lib/course-phases";
import { prisma } from "@/lib/db";
import { extractYouTubeId } from "@/lib/youtube";

export async function GET() {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const [courses, lessons, completedProgressGroups] = await Promise.all([
      prisma.course.findMany({
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          phases: true,
          instructor: {
            select: { name: true },
          },
        },
        orderBy: { title: "asc" },
      }),
      prisma.lesson.findMany({
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              status: true,
              phases: true,
              instructor: {
                select: { name: true },
              },
            },
          },
          module: {
            select: {
              id: true,
              title: true,
              phaseId: true,
            },
          },
          quiz: {
            select: {
              id: true,
              title: true,
              _count: {
                select: {
                  questions: true,
                  submissions: true,
                },
              },
            },
          },
          questions: {
            select: {
              id: true,
              _count: {
                select: { answers: true },
              },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.lessonProgress.groupBy({
        by: ["lessonId"],
        where: { completed: true },
        _count: { _all: true },
      }),
    ]);

    const completionCountByLessonId = new Map<string, number>(
      completedProgressGroups.map((group) => [group.lessonId, group._count._all]),
    );

    const coursePhaseMeta = new Map(
      courses.map((course) => {
        const phases = normalizeCoursePhases(course.phases);
        const phaseTitleMap = new Map(phases.map((p) => [p.id, p.title]));
        return [course.id, { phases, phaseTitleMap }];
      }),
    );

    const mapped: ContentLesson[] = lessons.map((lesson) => {
      const analysis = analyzeLessonContent(lesson.content);
      const phaseMeta = coursePhaseMeta.get(lesson.courseId);
      const phases = phaseMeta?.phases ?? [];
      const courseHasPhases = phases.length > 0;
      const resolvedPhaseId = resolveCoursePhaseId(
        lesson.phaseId || lesson.module?.phaseId,
        phases,
      );
      const phaseTitle = resolvedPhaseId
        ? phaseMeta?.phaseTitleMap.get(resolvedPhaseId) ?? null
        : null;

      const hasVideo = Boolean(
        lesson.videoUrl &&
          (extractYouTubeId(lesson.videoUrl) || lesson.videoUrl.trim().length > 0),
      );
      const hasDuration = Boolean(
        lesson.durationSeconds && lesson.durationSeconds > 0,
      );
      const hasQuiz = Boolean(lesson.quiz && lesson.quiz._count.questions > 0);
      const questionCount = lesson.questions.length;
      const unansweredQuestionCount = lesson.questions.filter(
        (q) => q._count.answers === 0,
      ).length;
      const completionCount = completionCountByLessonId.get(lesson.id) ?? 0;

      const qaIssues: ContentQaIssue[] = [];
      if (analysis.hasOnlyTemplateText) {
        qaIssues.push("template_only");
      } else if (analysis.isEmpty) {
        qaIssues.push("empty_draft");
      } else if (analysis.isThin) {
        qaIssues.push("thin_content");
      }
      if (!lesson.moduleId) qaIssues.push("unassigned_module");
      if (courseHasPhases && !resolvedPhaseId) qaIssues.push("missing_phase");
      if (!hasVideo) qaIssues.push("missing_video");
      if (!hasDuration) qaIssues.push("missing_duration");
      if (!hasQuiz) qaIssues.push("missing_quiz");
      if (unansweredQuestionCount > 0) qaIssues.push("unanswered_qa");

      const needsAttention =
        analysis.isEmpty ||
        analysis.isThin ||
        !lesson.moduleId ||
        (courseHasPhases && !resolvedPhaseId);

      return {
        id: lesson.id,
        title: lesson.title,
        order: lesson.order,
        isFree: lesson.isFree,
        videoUrl: lesson.videoUrl ?? null,
        hasVideo,
        durationSeconds: lesson.durationSeconds ?? null,
        wordCount: analysis.wordCount,
        proseWordCount: analysis.proseWordCount,
        codeBlockCount: analysis.codeBlockCount,
        calloutCount: analysis.calloutCount,
        imageCount: analysis.imageCount,
        contentLength: analysis.characterCount,
        estimatedReadMinutes: analysis.estimatedReadMinutes,
        hasOnlyTemplateText: analysis.hasOnlyTemplateText,
        isEmpty: analysis.isEmpty,
        isThin: analysis.isThin,
        excerpt: analysis.excerpt,
        createdAt: lesson.createdAt.toISOString(),
        updatedAt: lesson.updatedAt.toISOString(),
        courseId: lesson.courseId,
        courseTitle: lesson.course.title,
        courseSlug: lesson.course.slug,
        courseStatus: lesson.course.status,
        courseHasPhases,
        instructorName: lesson.course.instructor.name,
        moduleId: lesson.moduleId ?? null,
        moduleTitle: lesson.module?.title ?? null,
        phaseId: resolvedPhaseId,
        phaseTitle,
        hasQuiz,
        quizTitle: lesson.quiz?.title ?? null,
        quizQuestionCount: lesson.quiz?._count.questions ?? 0,
        quizSubmissionCount: lesson.quiz?._count.submissions ?? 0,
        questionCount,
        unansweredQuestionCount,
        completionCount,
        qaIssues,
        needsAttention,
      };
    });

    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    const stats: ContentStats = {
      total: mapped.length,
      publishedLessons: mapped.filter((l) => l.courseStatus === "PUBLISHED").length,
      free: mapped.filter((l) => l.isFree).length,
      paid: mapped.filter((l) => !l.isFree).length,
      empty: mapped.filter((l) => l.isEmpty).length,
      thin: mapped.filter((l) => l.isThin).length,
      needsAttention: mapped.filter((l) => l.needsAttention).length,
      publishedNeedsAttention: mapped.filter(
        (l) => l.courseStatus === "PUBLISHED" && l.needsAttention,
      ).length,
      missingVideo: mapped.filter((l) => !l.hasVideo).length,
      missingDuration: mapped.filter(
        (l) => !l.durationSeconds || l.durationSeconds <= 0,
      ).length,
      missingQuiz: mapped.filter((l) => !l.hasQuiz).length,
      unassignedModule: mapped.filter((l) => !l.moduleId).length,
      unansweredQuestions: mapped.reduce(
        (sum, l) => sum + l.unansweredQuestionCount,
        0,
      ),
      recentlyUpdated: mapped.filter(
        (l) => now - new Date(l.updatedAt).getTime() <= sevenDaysMs,
      ).length,
      avgWordCount:
        mapped.length > 0
          ? Math.round(
              mapped.reduce((sum, l) => sum + l.wordCount, 0) / mapped.length,
            )
          : 0,
      totalCodeBlocks: mapped.reduce((sum, l) => sum + l.codeBlockCount, 0),
      totalCompletions: mapped.reduce((sum, l) => sum + l.completionCount, 0),
    };

    const lessonsByCourseId = new Map<string, ContentLesson[]>();
    for (const lesson of mapped) {
      const group = lessonsByCourseId.get(lesson.courseId);
      if (group) {
        group.push(lesson);
      } else {
        lessonsByCourseId.set(lesson.courseId, [lesson]);
      }
    }

    const courseSummaries: CourseContentSummary[] = courses.map((course) => {
      const courseLessons = lessonsByCourseId.get(course.id) ?? [];
      const totalLessons = courseLessons.length;
      const readyLessons = courseLessons.filter((l) => !l.needsAttention).length;
      const totalWords = courseLessons.reduce((sum, l) => sum + l.wordCount, 0);

      return {
        courseId: course.id,
        courseTitle: course.title,
        courseSlug: course.slug,
        courseStatus: course.status,
        instructorName: course.instructor.name,
        totalLessons,
        readyLessons,
        emptyCount: courseLessons.filter((l) => l.isEmpty).length,
        thinCount: courseLessons.filter((l) => l.isThin).length,
        unassignedCount: courseLessons.filter((l) => !l.moduleId).length,
        missingVideoCount: courseLessons.filter((l) => !l.hasVideo).length,
        noQuizCount: courseLessons.filter((l) => !l.hasQuiz).length,
        freeCount: courseLessons.filter((l) => l.isFree).length,
        unansweredQaCount: courseLessons.reduce(
          (sum, l) => sum + l.unansweredQuestionCount,
          0,
        ),
        totalWords,
        avgWords: totalLessons > 0 ? Math.round(totalWords / totalLessons) : 0,
        readinessScore:
          totalLessons > 0
            ? Math.round((readyLessons / totalLessons) * 100)
            : 0,
      };
    });

    return NextResponse.json({
      lessons: mapped,
      stats,
      courseSummaries,
    });
  } catch (error) {
    console.error("Error fetching content:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const body = (await request.json()) as {
      lessonIds?: string[];
      isFree?: boolean;
    };

    if (!Array.isArray(body.lessonIds) || body.lessonIds.length === 0) {
      return NextResponse.json(
        { error: "lessonIds must be a non-empty array" },
        { status: 400 },
      );
    }

    if (typeof body.isFree !== "boolean") {
      return NextResponse.json(
        { error: "A valid boolean isFree field is required" },
        { status: 400 },
      );
    }

    const result = await prisma.lesson.updateMany({
      where: { id: { in: body.lessonIds } },
      data: { isFree: body.isFree },
    });

    const affected = await prisma.lesson.findMany({
      where: { id: { in: body.lessonIds } },
      select: { courseId: true },
      distinct: ["courseId"],
    });

    await Promise.all(
      affected.map((row) =>
        logCourseAuditEventSafe({
          courseId: row.courseId,
          title: "Bulk lesson access updated",
          description: `Updated preview access to ${body.isFree ? "Free Preview" : "Paid"} from Content QA.`,
          type: "lesson",
          actionUrl: `/admin/courses/${row.courseId}/lessons`,
        }),
      ),
    );

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
      isFree: body.isFree,
    });
  } catch (error) {
    console.error("Error updating lessons in bulk:", error);
    return NextResponse.json(
      { error: "Failed to update lessons" },
      { status: 500 },
    );
  }
}
