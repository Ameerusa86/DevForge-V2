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
    ? "border-[#ff6636] bg-[#ff6636]/10 text-foreground"
    : "border-border bg-card text-foreground hover:border-[#ff6636]/80 hover:bg-[#ff6636]/5";
  const mutedClassName = isActive ? "text-[#ff6636]/80" : "text-muted-foreground";
  const previewClassName = isActive
    ? "bg-white/15 text-[#ff6636] border border-[#ff6636]/20"
    : "bg-[#fff2e5] text-[#ff6636]";

  return (
    <Link
      href={`/courses/${courseSlug}/lessons/${lesson.id}`}
      className={`flex items-start gap-3 rounded-xl border p-3.5 transition-all duration-200 ${activeClassName}`}
    >
      <span
        className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          isActive
            ? "bg-[#ff6636]/20 text-[#ff6636]"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {lessonNumber}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold leading-snug">{lesson.title}</p>
          {lesson.isFree ? (
            <span
              className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${previewClassName}`}
            >
              Preview
            </span>
          ) : null}
        </div>
        <p
          className={`mt-1.5 text-[10px] font-bold uppercase tracking-wider ${mutedClassName}`}
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
          className={`mt-1 size-4 shrink-0 ${isActive ? "text-[#ff6636]" : "text-[#23bd33]"}`}
        />
      ) : (
        <PlayCircle
          className={`mt-1 size-4 shrink-0 ${isActive ? "text-[#ff6636]" : "text-[#ff6636]"}`}
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
            <div className="pl-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#ff6636]">
                Quick start
              </p>
              <h3 className="mt-1.5 text-base font-bold text-foreground">
                Standalone Lessons
              </h3>
            </div>
          ) : null}

          <div className="grid gap-2">
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
          className="space-y-3"
        >
          {orderedModules.map((moduleItem) => (
            <AccordionItem
              key={moduleItem.id}
              value={moduleItem.id}
              className="border border-border rounded-xl overflow-hidden bg-muted/15 transition-all duration-300 hover:border-border/80"
            >
              <AccordionTrigger className="px-5 py-4 text-left hover:no-underline hover:bg-muted/40 transition-colors [&[data-state=open]]:bg-muted/30">
                <div className="pr-4">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    Module {moduleItem.order}
                  </p>
                  <p className="mt-1 text-base font-bold text-foreground leading-tight">
                    {moduleItem.title}
                  </p>
                </div>
              </AccordionTrigger>

              <AccordionContent className="border-t border-border/40 px-4 py-4 bg-card">
                {moduleItem.description ? (
                  <p className="mb-4 text-xs leading-relaxed text-muted-foreground font-medium pl-1">
                    {moduleItem.description}
                  </p>
                ) : null}

                <div className="grid gap-2">
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
        {/* Deep, Premium Dark Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#121418] via-[#16181d] to-[#1e222b] text-white border-b border-border py-12 lg:py-16">
          {/* Subtle Ambient Background Light */}
          <div className="absolute -left-20 -top-20 size-[350px] rounded-full bg-[#ff6636]/10 blur-[120px] pointer-events-none" />
          <div className="absolute right-10 bottom-0 size-[400px] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />

          <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 relative">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-[760px] space-y-5">
                <Link
                  href={`/courses/${course.slug}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#8c94a3] transition-colors duration-200 hover:text-white"
                >
                  <ArrowLeft className="size-4" />
                  Back to course
                </Link>

                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md bg-white/10 border border-white/10 text-white">
                    <ClipboardCheck className="size-3.5 text-[#ff6636]" />
                    Lesson {currentLesson.order}
                  </span>
                </div>

                <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl leading-[1.1]">
                  {currentLesson.title}
                </h1>
                
                <p className="text-base sm:text-lg leading-relaxed text-gray-300">
                  {course.title} and lesson {currentIndex + 1} of{" "}
                  {orderedLessons.length}.
                </p>
              </div>

              {/* Responsive Outline Trigger for Small Screens */}
              <div className="flex items-center gap-3 lg:hidden self-end">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      className="rounded-xl border-white/15 bg-white/5 px-4.5 py-2.5 text-sm font-bold text-white hover:bg-white/10 hover:text-white"
                    >
                      <Layers3 className="mr-2 size-4" />
                      Outline
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="right"
                    className="w-[min(28rem,100vw)] overflow-y-auto border-border px-0 bg-background"
                  >
                    <SheetHeader className="px-6 pb-4">
                      <SheetTitle className="text-left text-xl font-bold">
                        Course Outline
                      </SheetTitle>
                      <SheetDescription className="text-left text-sm leading-relaxed text-muted-foreground">
                        Jump between lessons and keep track of the full learning path.
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

            {/* Hero Stats */}
            <div className="mt-8 grid gap-4 grid-cols-3">
              <div className="rounded-xl border border-white/5 bg-white/[0.03] backdrop-blur p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8c94a3]">
                  Current Lesson
                </p>
                <p className="mt-1 text-lg font-bold text-white">
                  {currentIndex + 1} of {orderedLessons.length}
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.03] backdrop-blur p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8c94a3]">
                  Access Mode
                </p>
                <p className="mt-1 text-lg font-bold text-white">
                  {currentLesson.isLocked
                    ? "Enrollment required"
                    : currentLesson.isFree
                      ? "Free Preview"
                      : "Full Access"}
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.03] backdrop-blur p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8c94a3]">
                  Progress
                </p>
                <p className="mt-1 text-lg font-bold text-white">
                  {progressData
                    ? `${progressPercent}% complete`
                    : "Enroll to track"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Content & Outline Sidebar Grid */}
        <section className="mx-auto max-w-[1320px] px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 xl:grid-cols-[1fr_360px]">
            {/* Left Column: Lesson Article Content */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ff6636]/10 border border-[#ff6636]/20 px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#ff6636]">
                    <ClipboardCheck className="size-3.5" />
                    Lesson {currentLesson.order}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground shadow-sm">
                    <BookOpen className="size-3.5 text-[#ff6636]" />
                    {course.title}
                  </span>
                </div>

                {currentLesson.isLocked ? (
                  <div className="mt-8 rounded-2xl border border-border bg-muted/30 px-6 py-12 text-center max-w-2xl mx-auto space-y-6">
                    <div className="mx-auto flex size-14 items-center justify-center rounded-xl bg-[#ff6636]/10 text-[#ff6636] shadow-sm">
                      <Lock className="size-6" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold tracking-tight">
                        This lesson is locked
                      </h2>
                      <p className="text-sm leading-relaxed text-muted-foreground font-medium">
                        {currentLesson.message ||
                          "Enroll in the course to access the full lesson and keep your progress in sync."}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center pt-2">
                      <Link
                        href={`/courses/${course.slug}`}
                        className="inline-flex items-center justify-center rounded-xl bg-[#ff6636] px-6 py-3 text-sm font-bold text-white transition-colors duration-200 hover:bg-[#e95a2b] shadow-md shadow-[#ff6636]/15"
                      >
                        View course and enroll
                      </Link>
                      <Link
                        href="/courses"
                        className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-6 py-3 text-sm font-bold text-foreground transition-colors duration-200 hover:border-[#ff6636] hover:bg-[#ff6636]/5"
                      >
                        Browse more courses
                      </Link>
                    </div>
                  </div>
                ) : (
                  <article
                    className="
                      lesson-content prose prose-neutral mt-8 max-w-none
                      px-0
                      prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground
                      prose-h1:mb-6 prose-h1:mt-0 prose-h1:text-3xl
                      prose-h2:mb-4 prose-h2:mt-10 prose-h2:border-b prose-h2:border-border prose-h2:pb-3 prose-h2:text-2xl
                      prose-h3:mb-3 prose-h3:mt-8 prose-h3:text-xl
                      prose-h4:mb-2 prose-h4:mt-6 prose-h4:text-lg
                      prose-p:my-4 prose-p:text-base prose-p:leading-relaxed prose-p:text-foreground/80
                      prose-ul:my-5 prose-ul:space-y-2
                      prose-ol:my-5 prose-ol:space-y-2
                      prose-li:text-foreground/80 prose-li:leading-relaxed
                      prose-strong:text-foreground
                      prose-code:rounded-lg prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:text-foreground prose-code:before:content-[''] prose-code:after:content-[''] prose-code:font-bold prose-code:text-sm
                      prose-pre:rounded-xl prose-pre:border prose-pre:border-border prose-pre:bg-[#16181d]
                      prose-blockquote:rounded-xl prose-blockquote:border-l-4 prose-blockquote:border-[#ff6636] prose-blockquote:bg-[#ff6636]/5 prose-blockquote:px-5 prose-blockquote:py-4 prose-blockquote:not-italic prose-blockquote:text-foreground/90
                      prose-a:text-[#ff6636] prose-a:font-semibold prose-a:underline hover:prose-a:text-[#e95a2b]
                      prose-img:rounded-xl prose-img:border prose-img:border-border
                      prose-hr:my-8 prose-hr:border-border
                    "
                  >
                    {(() => {
                      if (!currentLesson.content) {
                        return (
                          <p className="text-sm leading-relaxed text-muted-foreground font-semibold">
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
                          <div className="rounded-xl border border-dashed border-border bg-muted/40 px-6 py-8 text-sm leading-relaxed text-muted-foreground font-semibold text-center">
                            Lesson content could not be displayed. Refresh the
                            page and try again.
                          </div>
                        );
                      }
                    })()}
                  </article>
                )}
              </div>

              {/* Progress Controls Box */}
              <div className="rounded-2xl border border-border bg-muted/40 p-5 sm:p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      Progress Controls
                    </p>
                    <p className="mt-1.5 text-sm font-semibold text-muted-foreground">
                      {initialEnrollmentId
                        ? "Save your place and move through the course in order."
                        : "Enroll in the course to unlock tracked progress and completion history."}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <Button
                      onClick={handleMarkComplete}
                      disabled={isMarking || !initialEnrollmentId}
                      className={`rounded-xl px-5 py-2.5 text-sm font-bold shadow-md shadow-[#ff6636]/15 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 ${
                        isLessonComplete
                          ? "bg-foreground text-background hover:bg-foreground/90"
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
                          Mark Complete
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={scrollToTop}
                      className="rounded-xl border-border px-5 py-2.5 text-sm font-bold text-foreground hover:border-[#ff6636] hover:bg-[#ff6636]/5 hover:text-[#ff6636]"
                    >
                      <ArrowUp className="mr-2 size-4" />
                      Back to Top
                    </Button>
                  </div>
                </div>
              </div>

              {/* Navigation Footer */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
                {previousLesson ? (
                  <Link
                    href={`/courses/${course.slug}/lessons/${previousLesson.id}`}
                    className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-5 py-3 text-sm font-bold text-foreground transition-all duration-200 hover:border-[#ff6636] hover:text-[#ff6636] hover:bg-[#ff6636]/5"
                  >
                    <ChevronLeft className="mr-2 size-4" />
                    Previous Lesson
                  </Link>
                ) : (
                  <Link
                    href={`/courses/${course.slug}`}
                    className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-5 py-3 text-sm font-bold text-foreground transition-all duration-200 hover:border-[#ff6636] hover:text-[#ff6636] hover:bg-[#ff6636]/5"
                  >
                    <ArrowLeft className="mr-2 size-4" />
                    Back to Course
                  </Link>
                )}

                {nextLesson ? (
                  <Link
                    href={`/courses/${course.slug}/lessons/${nextLesson.id}`}
                    className="inline-flex items-center justify-center rounded-xl bg-[#ff6636] px-5 py-3 text-sm font-bold text-white transition-colors duration-200 hover:bg-[#e95a2b] shadow-md shadow-[#ff6636]/15"
                  >
                    Next Lesson
                    <ChevronRight className="ml-2 size-4" />
                  </Link>
                ) : (
                  <Link
                    href={`/courses/${course.slug}`}
                    className="inline-flex items-center justify-center rounded-xl bg-[#1d2026] px-5 py-3 text-sm font-bold text-white transition-colors duration-200 hover:bg-[#111318]"
                  >
                    Finish Course
                    <CheckCircle2 className="ml-2 size-4" />
                  </Link>
                )}
              </div>
            </div>

            {/* Right Column: Outline Sidebar & Progress Gauge */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-6">
                {/* Gauge card */}
                <div className="rounded-2xl border border-border bg-[#1d2026] p-6 text-white shadow-md">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#b7bac7]">
                    Your Pace
                  </p>
                  <div className="mt-3.5 flex items-end gap-2.5">
                    <span className="text-[44px] font-extrabold leading-none tracking-tight">
                      {progressPercent}%
                    </span>
                    <span className="pb-1 text-xs font-semibold text-[#d0d3dd]">
                      complete
                    </span>
                  </div>
                  <div className="mt-5 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#ff6636] rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="mt-4 text-xs font-bold text-white uppercase tracking-wider">
                    {progressState}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-[#d0d3dd] font-semibold">
                    {progressData
                      ? `${completedLessons} of ${progressData.totalLessons} lessons marked complete.`
                      : "Progress tracking starts after you enroll in the course."}
                  </p>
                </div>

                {/* Outline Sidebar Component */}
                <div className="flex max-h-[calc(100vh-14rem)] flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-3 border-b border-border pb-5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                        Course Outline
                      </p>
                      <h2 className="mt-1.5 text-xl font-bold tracking-tight">
                        Navigate the path
                      </h2>
                    </div>
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#fff2e5] text-[#ff6636]">
                      <Layers3 className="size-4.5" />
                    </div>
                  </div>

                  <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1 space-y-2">
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

                {/* Study advice card */}
                <div className="rounded-2xl border border-border bg-muted/40 p-6 space-y-4 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Study Mode
                  </p>
                  <div className="space-y-4 text-xs leading-relaxed text-muted-foreground font-semibold">
                    <div className="flex items-start gap-3">
                      <Sparkles className="mt-0.5 size-4 shrink-0 text-[#ff6636]" />
                      <p className="mt-0.5">Read the lesson once, then revisit the outline for context.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Sparkles className="mt-0.5 size-4 shrink-0 text-[#ff6636]" />
                      <p className="mt-0.5">Mark progress only after you can explain the idea back in your own words.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Sparkles className="mt-0.5 size-4 shrink-0 text-[#ff6636]" />
                      <p className="mt-0.5">Move to the next lesson while the examples are still fresh.</p>
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
