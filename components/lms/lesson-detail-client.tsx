"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { JSONContent } from "@tiptap/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { RichTextRenderer } from "@/components/editor/RichTextRenderer";
import { LessonQA } from "@/components/lms/lesson-qa";
import {
  MarketingPublicFooter,
  MarketingPublicHeader,
} from "@/components/marketing/public-chrome";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowUp,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  ClipboardCheck,
  Layers3,
  Lock,
  PlayCircle,
  Sparkles,
} from "lucide-react";

export interface LessonOutlineItem {
  id: string;
  title: string;
  order: number;
  isFree?: boolean;
  moduleId?: string | null;
}

export interface LessonOutlineModule {
  id: string;
  title: string;
  order: number;
  description?: string | null;
  lessons: LessonOutlineItem[];
}

export interface LessonDetailCourse {
  id: string;
  slug: string;
  title: string;
  lessons: LessonOutlineItem[];
  modules?: LessonOutlineModule[];
  showUnassignedHeader?: boolean;
}

export interface LessonDetailState {
  id: string;
  title: string;
  content: string | JSONContent | null;
  order: number;
  isFree?: boolean;
  isLocked?: boolean;
  message?: string;
}

export interface LessonProgressData {
  progress: number;
  completedLessons: number;
  totalLessons: number;
  lessonProgress: Record<string, boolean>;
  isComplete: boolean;
}

function scrollToTop() {
  if (typeof window === "undefined") return;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function OutlineLessonLink({
  courseSlug,
  lesson,
  lessonNumber,
  activeLessonId,
  completionMap,
  hasEnrollment,
}: {
  courseSlug: string;
  lesson: LessonOutlineItem;
  lessonNumber: number;
  activeLessonId: string;
  completionMap: Record<string, boolean>;
  hasEnrollment: boolean;
}) {
  const isActive = lesson.id === activeLessonId;
  const isComplete = completionMap[lesson.id] ?? false;
  const isLocked = !lesson.isFree && !hasEnrollment;
  const activeClassName = isActive
    ? "border-[#1d2026] bg-[#1d2026] text-white"
    : "border-border bg-card text-foreground hover:border-primary hover:bg-primary/5";
  const mutedClassName = isActive ? "text-white/70" : "text-muted-foreground";
  const previewClassName = isActive
    ? "bg-white/15 text-white"
    : "bg-primary/10 text-primary";

  return (
    <Link
      href={`/courses/${courseSlug}/lessons/${lesson.id}`}
      className={`flex items-start gap-3 border px-4 py-4 transition ${activeClassName}`}
    >
      <span
        className={`mt-0.5 flex size-8 shrink-0 items-center justify-center border text-xs font-semibold ${
          isActive ? "border-white/20 bg-white/10" : "border-border bg-muted"
        }`}
      >
        {lessonNumber}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold leading-6">{lesson.title}</p>
          {lesson.isFree ? (
            <span
              className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${previewClassName}`}
            >
              Preview
            </span>
          ) : null}
        </div>
        <p
          className={`mt-2 text-xs font-medium uppercase tracking-[0.16em] ${mutedClassName}`}
        >
          {isLocked
            ? "Enrollment required"
            : isComplete
              ? "Completed"
              : "Available now"}
        </p>
      </div>

      {isLocked ? (
        <Lock className={`mt-1 size-4 shrink-0 ${mutedClassName}`} />
      ) : isComplete ? (
        <CheckCircle2
          className={`mt-1 size-4 shrink-0 ${isActive ? "text-[#ffb199]" : "text-[#23bd33]"}`}
        />
      ) : (
        <PlayCircle
          className={`mt-1 size-4 shrink-0 ${isActive ? "text-white" : "text-[#ff6636]"}`}
        />
      )}
    </Link>
  );
}

function CourseOutline({
  courseSlug,
  orderedModules,
  unassignedLessons,
  showNoModuleHeader,
  activeLessonId,
  lessonIndexMap,
  completionMap,
  hasEnrollment,
}: {
  courseSlug: string;
  orderedModules: LessonOutlineModule[];
  unassignedLessons: LessonOutlineItem[];
  showNoModuleHeader: boolean;
  activeLessonId: string;
  lessonIndexMap: Record<string, number>;
  completionMap: Record<string, boolean>;
  hasEnrollment: boolean;
}) {
  const defaultOpenModules = orderedModules
    .filter((moduleItem) =>
      moduleItem.lessons.some((lesson) => lesson.id === activeLessonId),
    )
    .map((moduleItem) => moduleItem.id);

  return (
    <div className="space-y-4">
      {unassignedLessons.length > 0 ? (
        <div className="space-y-3">
          {showNoModuleHeader ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Quick start
              </p>
              <h3 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-foreground">
                Lessons outside a module
              </h3>
            </div>
          ) : null}

          <div className="space-y-2">
            {unassignedLessons.map((lesson) => (
              <OutlineLessonLink
                key={lesson.id}
                courseSlug={courseSlug}
                lesson={lesson}
                lessonNumber={lessonIndexMap[lesson.id]}
                activeLessonId={activeLessonId}
                completionMap={completionMap}
                hasEnrollment={hasEnrollment}
              />
            ))}
          </div>
        </div>
      ) : null}

      {orderedModules.length > 0 ? (
        <Accordion
          type="multiple"
          defaultValue={defaultOpenModules}
          className="space-y-4"
        >
          {orderedModules.map((moduleItem) => (
            <AccordionItem
              key={moduleItem.id}
              value={moduleItem.id}
              className="border border-border bg-muted"
            >
              <AccordionTrigger className="px-5 py-4 text-left hover:no-underline">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Module {moduleItem.order}
                  </p>
                  <p className="mt-2 text-base font-semibold text-foreground">
                    {moduleItem.title}
                  </p>
                </div>
              </AccordionTrigger>

              <AccordionContent className="border-t border-border px-5 py-5">
                {moduleItem.description ? (
                  <p className="mb-4 text-sm leading-7 text-muted-foreground">
                    {moduleItem.description}
                  </p>
                ) : null}

                <div className="space-y-2">
                  {moduleItem.lessons
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((lesson) => (
                      <OutlineLessonLink
                        key={lesson.id}
                        courseSlug={courseSlug}
                        lesson={lesson}
                        lessonNumber={lessonIndexMap[lesson.id]}
                        activeLessonId={activeLessonId}
                        completionMap={completionMap}
                        hasEnrollment={hasEnrollment}
                      />
                    ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : null}
    </div>
  );
}

export function LessonDetailClient({
  course,
  currentLesson,
  initialEnrollmentId,
  initialProgressData,
}: {
  course: LessonDetailCourse;
  currentLesson: LessonDetailState;
  initialEnrollmentId: string | null;
  initialProgressData: LessonProgressData | null;
}) {
  const [progressData, setProgressData] = useState(initialProgressData);
  const [isMarking, setIsMarking] = useState(false);
  const [isLessonComplete, setIsLessonComplete] = useState(
    initialProgressData?.lessonProgress?.[currentLesson.id] ?? false,
  );

  const sortedLessons = useMemo(
    () => course.lessons.slice().sort((a, b) => a.order - b.order),
    [course.lessons],
  );
  const orderedModules = useMemo(
    () => (course.modules || []).slice().sort((a, b) => a.order - b.order),
    [course.modules],
  );
  const unassignedLessons = useMemo(
    () => sortedLessons.filter((lesson) => !lesson.moduleId),
    [sortedLessons],
  );
  const orderedLessons = useMemo(
    () => [
      ...unassignedLessons,
      ...orderedModules.flatMap((moduleItem) =>
        moduleItem.lessons.slice().sort((a, b) => a.order - b.order),
      ),
    ],
    [orderedModules, unassignedLessons],
  );
  const lessonIndexMap = useMemo(
    () =>
      orderedLessons.reduce<Record<string, number>>((acc, lesson, index) => {
        acc[lesson.id] = index + 1;
        return acc;
      }, {}),
    [orderedLessons],
  );

  const currentIndex = orderedLessons.findIndex(
    (lesson) => lesson.id === currentLesson.id,
  );
  const previousLesson =
    currentIndex > 0 ? orderedLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < orderedLessons.length - 1
      ? orderedLessons[currentIndex + 1]
      : null;

  const progressPercent = progressData?.progress ?? 0;
  const completedLessons = progressData?.completedLessons ?? 0;
  const progressState =
    progressPercent >= 100
      ? "Course complete"
      : progressPercent >= 75
        ? "Almost there"
        : progressPercent >= 40
          ? "Steady progress"
          : progressPercent > 0
            ? "Getting started"
            : initialEnrollmentId
              ? "Ready to learn"
              : "Enroll to track";

  const handleMarkComplete = async () => {
    if (!initialEnrollmentId) {
      toast.error("Enroll in the course to save lesson progress.");
      return;
    }

    setIsMarking(true);

    try {
      const response = await fetch(
        `/api/enrollments/${initialEnrollmentId}/progress`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lessonId: currentLesson.id,
            completed: !isLessonComplete,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.details || errorData.error || "Failed to update progress",
        );
      }

      const updated = await response.json();

      setProgressData((previous) => ({
        progress: updated.progress,
        completedLessons: updated.completedLessons,
        totalLessons: updated.totalLessons,
        isComplete: updated.progress === 100,
        lessonProgress: {
          ...(previous?.lessonProgress ?? {}),
          [currentLesson.id]: !isLessonComplete,
        },
      }));
      setIsLessonComplete((value) => !value);

      toast.success(
        isLessonComplete
          ? "Lesson marked incomplete."
          : "Lesson marked complete.",
      );
    } catch (error) {
      console.error("Failed to update lesson progress", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update lesson progress.",
      );
    } finally {
      setIsMarking(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingPublicHeader activePath="/courses" />

      <main>
        <section className="border-b border-border bg-card">
          <div className="mx-auto max-w-[1320px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-[760px]">
                <Link
                  href={`/courses/${course.slug}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-primary"
                >
                  <ArrowLeft className="size-4" />
                  Back to course
                </Link>

                <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Course lesson
                </p>
                <h1 className="mt-3 text-[2.4rem] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[3.2rem]">
                  {currentLesson.title}
                </h1>
                <p className="mt-4 max-w-[680px] text-base leading-8 text-muted-foreground">
                  {course.title} and lesson {currentIndex + 1} of{" "}
                  {orderedLessons.length}.
                </p>
              </div>

              <div className="flex items-center gap-3 lg:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      className="rounded-none border-border px-4 py-3 text-sm font-semibold text-foreground"
                    >
                      <Layers3 className="mr-2 size-4" />
                      Course outline
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="right"
                    className="w-[min(28rem,100vw)] rounded-none border-border px-0"
                  >
                    <SheetHeader className="px-6 pb-4">
                      <SheetTitle className="text-left text-xl font-semibold text-foreground">
                        Course outline
                      </SheetTitle>
                      <SheetDescription className="text-left text-sm leading-7 text-muted-foreground">
                        Jump between lessons and keep track of the full learning
                        path.
                      </SheetDescription>
                    </SheetHeader>

                    <div className="border-t border-border px-6 py-6">
                      <CourseOutline
                        courseSlug={course.slug}
                        orderedModules={orderedModules}
                        unassignedLessons={unassignedLessons}
                        showNoModuleHeader={course.showUnassignedHeader ?? true}
                        activeLessonId={currentLesson.id}
                        lessonIndexMap={lessonIndexMap}
                        completionMap={progressData?.lessonProgress ?? {}}
                        hasEnrollment={Boolean(initialEnrollmentId)}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="border border-border bg-muted px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Current lesson
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {currentIndex + 1} of {orderedLessons.length}
                </p>
              </div>

              <div className="border border-border bg-muted px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Access
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {currentLesson.isLocked
                    ? "Enrollment required"
                    : currentLesson.isFree
                      ? "Free preview"
                      : "Full lesson access"}
                </p>
              </div>

              <div className="border border-border bg-muted px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Tracking
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {progressData
                    ? `${progressPercent}% complete`
                    : "Enroll to save progress"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1320px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <div className="border border-border bg-card p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 bg-primary/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                    <ClipboardCheck className="size-3.5" />
                    Lesson {currentLesson.order}
                  </span>
                  <span className="inline-flex items-center gap-2 border border-border bg-muted px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/75">
                    <BookOpen className="size-3.5 text-[#ff6636]" />
                    {course.title}
                  </span>
                </div>

                {currentLesson.isLocked ? (
                  <div className="mt-8 border border-border bg-muted px-6 py-10 sm:px-8">
                    <div className="flex size-14 items-center justify-center bg-foreground text-background">
                      <Lock className="size-6" />
                    </div>
                    <h2 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                      This lesson is locked
                    </h2>
                    <p className="mt-4 max-w-[560px] text-sm leading-7 text-muted-foreground">
                      {currentLesson.message ||
                        "Enroll in the course to access the full lesson and keep your progress in sync."}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link
                        href={`/courses/${course.slug}`}
                        className="inline-flex items-center justify-center bg-[#ff6636] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#e95a2b]"
                      >
                        View course and enroll
                      </Link>
                      <Link
                        href="/courses"
                        className="inline-flex items-center justify-center border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
                      >
                        Browse more courses
                      </Link>
                    </div>
                  </div>
                ) : (
                  <article
                    className="
                      lesson-content prose prose-neutral mt-8 max-w-none
                      dark:prose-invert
                      px-0
                      prose-headings:font-semibold prose-headings:tracking-[-0.03em]
                      prose-h1:mb-6 prose-h1:mt-0 prose-h1:text-4xl
                      prose-h2:mb-4 prose-h2:mt-12 prose-h2:border-b prose-h2:border-border prose-h2:pb-3 prose-h2:text-3xl
                      prose-h3:mb-3 prose-h3:mt-8 prose-h3:text-2xl
                      prose-h4:mb-2 prose-h4:mt-6 prose-h4:text-xl
                      prose-p:my-4 prose-p:text-base prose-p:leading-8
                      prose-ul:my-5 prose-ul:space-y-2
                      prose-ol:my-5 prose-ol:space-y-2
                      prose-li:leading-8
                      prose-code:rounded-none prose-code:bg-muted prose-code:px-1.5 prose-code:py-1 prose-code:before:content-[''] prose-code:after:content-['']
                      prose-pre:rounded-none prose-pre:border prose-pre:border-border prose-pre:bg-[#1d2026]
                      prose-blockquote:rounded-none prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:px-5 prose-blockquote:py-3 prose-blockquote:not-italic
                      prose-a:text-primary
                      prose-img:rounded-none prose-img:border prose-img:border-border
                      prose-hr:my-10 prose-hr:border-border
                    "
                  >
                    {(() => {
                      if (!currentLesson.content) {
                        return (
                          <p className="text-sm leading-7 text-[#6e7485]">
                            Lesson content is not available yet.
                          </p>
                        );
                      }

                      try {
                        const content =
                          typeof currentLesson.content === "string"
                            ? JSON.parse(currentLesson.content)
                            : currentLesson.content;
                        return <RichTextRenderer content={content} />;
                      } catch (error) {
                        console.error("Failed to parse lesson content", error);
                        return (
                          <div className="border border-dashed border-border bg-muted px-6 py-8 text-sm leading-7 text-muted-foreground">
                            Lesson content could not be displayed. Refresh the
                            page and try again.
                          </div>
                        );
                      }
                    })()}
                  </article>
                )}

                {/* Q&A Section */}
                <LessonQA
                  lessonId={currentLesson.id}
                  isEnrolled={Boolean(initialEnrollmentId)}
                  enrollmentId={initialEnrollmentId || undefined}
                />
              </div>

              <div className="border border-border bg-card p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Progress controls
                    </p>
                    <p className="mt-2 text-base font-semibold text-foreground">
                      {initialEnrollmentId
                        ? "Save your place and move through the course in order."
                        : "Enroll in the course to unlock tracked progress and completion history."}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={handleMarkComplete}
                      disabled={isMarking || !initialEnrollmentId}
                      className={`rounded-none px-6 py-3 text-sm font-semibold ${
                        isLessonComplete
                          ? "bg-[#1d2026] text-white hover:bg-[#111318]"
                          : "bg-[#ff6636] text-white hover:bg-[#e95a2b]"
                      }`}
                    >
                      {isLessonComplete ? (
                        <>
                          <CheckCircle2 className="mr-2 size-4" />
                          Completed
                        </>
                      ) : (
                        <>
                          <Circle className="mr-2 size-4" />
                          Mark complete
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={scrollToTop}
                      className="rounded-none border-border px-6 py-3 text-sm font-semibold text-foreground hover:border-primary hover:bg-primary/5 hover:text-primary"
                    >
                      <ArrowUp className="mr-2 size-4" />
                      Back to top
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {previousLesson ? (
                  <Link
                    href={`/courses/${course.slug}/lessons/${previousLesson.id}`}
                    className="inline-flex items-center justify-center border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
                  >
                    <ChevronLeft className="mr-2 size-4" />
                    Previous lesson
                  </Link>
                ) : (
                  <Link
                    href={`/courses/${course.slug}`}
                    className="inline-flex items-center justify-center border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
                  >
                    <ArrowLeft className="mr-2 size-4" />
                    Back to course
                  </Link>
                )}

                {nextLesson ? (
                  <Link
                    href={`/courses/${course.slug}/lessons/${nextLesson.id}`}
                    className="inline-flex items-center justify-center bg-[#ff6636] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#e95a2b]"
                  >
                    Next lesson
                    <ChevronRight className="ml-2 size-4" />
                  </Link>
                ) : (
                  <Link
                    href={`/courses/${course.slug}`}
                    className="inline-flex items-center justify-center bg-[#1d2026] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#111318]"
                  >
                    Finish course
                    <CheckCircle2 className="ml-2 size-4" />
                  </Link>
                )}
              </div>
            </div>

            <aside className="hidden xl:block">
              <div className="sticky top-24 space-y-6">
                <div className="border border-[#1d2026] bg-[#1d2026] p-6 text-white">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b7bac7]">
                    Your pace
                  </p>
                  <div className="mt-4 flex items-end gap-3">
                    <span className="text-[52px] font-semibold leading-none tracking-[-0.05em]">
                      {progressPercent}%
                    </span>
                    <span className="pb-1 text-sm font-medium text-[#d0d3dd]">
                      complete
                    </span>
                  </div>
                  <div className="mt-5 h-2 bg-white/10">
                    <div
                      className="h-full bg-[#ff6636]"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="mt-4 text-sm font-medium text-white">
                    {progressState}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[#d0d3dd]">
                    {progressData
                      ? `${completedLessons} of ${progressData.totalLessons} lessons marked complete.`
                      : "Progress tracking starts after you enroll in the course."}
                  </p>
                </div>

                <div className="border border-border bg-card p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Course outline
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                        Navigate the path
                      </h2>
                    </div>
                    <div className="flex size-11 items-center justify-center bg-[#fff2e5] text-[#ff6636]">
                      <Layers3 className="size-5" />
                    </div>
                  </div>

                  <div className="mt-6">
                    <CourseOutline
                      courseSlug={course.slug}
                      orderedModules={orderedModules}
                      unassignedLessons={unassignedLessons}
                      showNoModuleHeader={course.showUnassignedHeader ?? true}
                      activeLessonId={currentLesson.id}
                      lessonIndexMap={lessonIndexMap}
                      completionMap={progressData?.lessonProgress ?? {}}
                      hasEnrollment={Boolean(initialEnrollmentId)}
                    />
                  </div>
                </div>

                <div className="border border-border bg-primary/5 p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Study mode
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                    Keep momentum
                  </h2>
                  <div className="mt-5 space-y-3 text-sm leading-7 text-foreground/80">
                    <div className="flex gap-3">
                      <Sparkles className="mt-1 size-4 shrink-0 text-[#ff6636]" />
                      Read the lesson once, then revisit the outline for
                      context.
                    </div>
                    <div className="flex gap-3">
                      <Sparkles className="mt-1 size-4 shrink-0 text-[#ff6636]" />
                      Mark progress only after you can explain the idea back in
                      your own words.
                    </div>
                    <div className="flex gap-3">
                      <Sparkles className="mt-1 size-4 shrink-0 text-[#ff6636]" />
                      Move to the next lesson while the examples are still
                      fresh.
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <MarketingPublicFooter />
    </div>
  );
}
