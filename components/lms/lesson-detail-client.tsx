"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { ThemeToggle } from "@/components/themeToggle";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  ClipboardCheck,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Interfaces ───────────────────────────────────────────────────────────────

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

// ─── Outline Subcomponents ───────────────────────────────────────────────────

function OutlineLessonLink({
  courseSlug,
  lesson,
  lessonNumber,
  activeLessonId,
  completionMap,
  hasEnrollment,
  onNavigate,
}: {
  courseSlug: string;
  lesson: LessonOutlineItem;
  lessonNumber: number;
  activeLessonId: string;
  completionMap: Record<string, boolean>;
  hasEnrollment: boolean;
  onNavigate?: () => void;
}) {
  const isActive = lesson.id === activeLessonId;
  const isComplete = completionMap[lesson.id] ?? false;
  const isLocked = !lesson.isFree && !hasEnrollment;

  return (
    <Link
      href={`/courses/${courseSlug}/lessons/${lesson.id}`}
      onClick={onNavigate}
      className={cn(
        "flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-200 group relative border",
        isActive
          ? "border-[#ff6636]/50 bg-[#ff6636]/10 text-foreground shadow-2xs font-semibold"
          : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/70 hover:text-foreground"
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold font-mono",
          isActive
            ? "bg-[#ff6636] text-white shadow-xs"
            : isComplete
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : "bg-muted text-muted-foreground"
        )}
      >
        {isComplete ? <CheckCircle2 className="size-3.5" /> : lessonNumber}
      </span>

      <div className="min-w-0 flex-1 leading-snug break-words">
        <p className={cn("text-xs", isActive ? "text-foreground font-bold" : "text-foreground/90")}>
          {lesson.title}
        </p>
      </div>

      {lesson.isFree && !hasEnrollment && (
        <span className="shrink-0 rounded-md bg-[#ff6636]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#ff6636]">
          Free
        </span>
      )}

      {isLocked && <Lock className="size-3.5 text-muted-foreground/70 shrink-0 mt-0.5" />}
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
  onNavigate,
}: {
  courseSlug: string;
  orderedModules: LessonOutlineModule[];
  unassignedLessons: LessonOutlineItem[];
  showNoModuleHeader: boolean;
  activeLessonId: string;
  lessonIndexMap: Record<string, number>;
  completionMap: Record<string, boolean>;
  hasEnrollment: boolean;
  onNavigate?: () => void;
}) {
  const defaultOpenModules = orderedModules
    .filter((moduleItem) =>
      moduleItem.lessons.some((lesson) => lesson.id === activeLessonId)
    )
    .map((moduleItem) => moduleItem.id);

  return (
    <div className="space-y-3">
      {/* Unassigned Lessons */}
      {unassignedLessons.length > 0 && (
        <div className="space-y-1.5">
          {showNoModuleHeader && (
            <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Core Lessons
            </p>
          )}
          {unassignedLessons.map((lesson) => (
            <OutlineLessonLink
              key={lesson.id}
              courseSlug={courseSlug}
              lesson={lesson}
              lessonNumber={lessonIndexMap[lesson.id] ?? lesson.order}
              activeLessonId={activeLessonId}
              completionMap={completionMap}
              hasEnrollment={hasEnrollment}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}

      {/* Module Accordions */}
      {orderedModules.length > 0 && (
        <Accordion
          type="multiple"
          defaultValue={defaultOpenModules.length > 0 ? defaultOpenModules : [orderedModules[0].id]}
          className="space-y-2.5"
        >
          {orderedModules.map((moduleItem) => {
            const completedCount = moduleItem.lessons.filter((l) => completionMap[l.id]).length;

            return (
              <AccordionItem
                key={moduleItem.id}
                value={moduleItem.id}
                className="rounded-2xl border border-border/80 bg-card/60 shadow-2xs overflow-hidden"
              >
                <AccordionTrigger className="px-3.5 py-3 text-xs font-bold hover:no-underline hover:bg-muted/40 transition-colors">
                  <div className="flex items-start justify-between w-full gap-2 pr-2 text-left">
                    <span className="text-xs font-bold text-foreground leading-snug break-words flex-1">
                      {moduleItem.title}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0 mt-0.5 bg-muted/80 rounded-md px-1.5 py-0.5">
                      {completedCount}/{moduleItem.lessons.length}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-1.5 space-y-1 border-t border-border/40 bg-background/50">
                  {moduleItem.lessons
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((lesson) => (
                      <OutlineLessonLink
                        key={lesson.id}
                        courseSlug={courseSlug}
                        lesson={lesson}
                        lessonNumber={lessonIndexMap[lesson.id] ?? lesson.order}
                        activeLessonId={activeLessonId}
                        completionMap={completionMap}
                        hasEnrollment={hasEnrollment}
                        onNavigate={onNavigate}
                      />
                    ))}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}

// ─── Main Classroom Client Component ──────────────────────────────────────────

export function LessonDetailClient({
  course,
  currentLesson,
  initialEnrollmentId,
  initialProgressData,
}: {
  course: LessonDetailCourse;
  currentLesson: LessonDetailState;
  initialEnrollmentId?: string | null;
  initialProgressData?: LessonProgressData | null;
}) {
  const router = useRouter();
  const [progressData, setProgressData] = useState<LessonProgressData | null>(
    initialProgressData ?? null
  );
  const [isLessonComplete, setIsLessonComplete] = useState<boolean>(
    initialProgressData?.lessonProgress?.[currentLesson.id] ?? false
  );
  const [isMarking, setIsMarking] = useState(false);

  // Left sidebar collapsible state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  // Ordered lessons and navigation computation
  const orderedModules = useMemo(() => {
    return (course.modules ?? []).slice().sort((a, b) => a.order - b.order);
  }, [course.modules]);

  const orderedLessons = useMemo(() => {
    const unassigned = course.lessons
      .filter((lesson) => !lesson.moduleId)
      .slice()
      .sort((a, b) => a.order - b.order);

    const moduleLessons = orderedModules.flatMap((m) =>
      m.lessons.slice().sort((a, b) => a.order - b.order)
    );

    return [...unassigned, ...moduleLessons];
  }, [course.lessons, orderedModules]);

  const lessonIndexMap = useMemo(() => {
    return orderedLessons.reduce<Record<string, number>>((acc, lesson, index) => {
      acc[lesson.id] = index + 1;
      return acc;
    }, {});
  }, [orderedLessons]);

  const currentIndex = orderedLessons.findIndex((l) => l.id === currentLesson.id);
  const previousLesson = currentIndex > 0 ? orderedLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < orderedLessons.length - 1 ? orderedLessons[currentIndex + 1] : null;

  const unassignedLessons = useMemo(() => {
    return course.lessons
      .filter((lesson) => !lesson.moduleId)
      .slice()
      .sort((a, b) => a.order - b.order);
  }, [course.lessons]);

  const progressPercent = progressData?.progress ?? 0;
  const completedLessons = progressData?.completedLessons ?? 0;

  // Keyboard navigation shortcuts (Shift + N = next, Shift + P = prev)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.shiftKey && e.key.toLowerCase() === "n" && nextLesson) {
        e.preventDefault();
        router.push(`/courses/${course.slug}/lessons/${nextLesson.id}`);
      } else if (e.shiftKey && e.key.toLowerCase() === "p" && previousLesson) {
        e.preventDefault();
        router.push(`/courses/${course.slug}/lessons/${previousLesson.id}`);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [course.slug, nextLesson, previousLesson, router]);

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
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || "Failed to update progress");
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
      setIsLessonComplete((val) => !val);

      toast.success(
        isLessonComplete ? "Lesson marked incomplete." : "Lesson marked complete!"
      );
    } catch (error) {
      console.error("Failed to update lesson progress", error);
      toast.error(error instanceof Error ? error.message : "Failed to update lesson progress.");
    } finally {
      setIsMarking(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background text-foreground overflow-hidden select-none">
      {/* ── 1. Top Distraction-Free Header Bar ───────────────────────────────── */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/85 px-3 sm:px-6 backdrop-blur-xl z-20">
        {/* Left: Back Link, Sidebar Toggle, & Lesson Info */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <Link
            href={`/courses/${course.slug}`}
            className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-muted/40 px-2.5 py-1.5 text-xs font-bold text-foreground hover:border-[#ff6636]/40 hover:bg-muted transition-colors shrink-0"
            title="Back to Course Overview"
          >
            <ArrowLeft className="size-3.5" />
            <span className="hidden sm:inline truncate max-w-[180px]">{course.title}</span>
          </Link>

          <div className="h-4 w-px bg-border/60 hidden lg:block" />

          {/* Desktop Left Sidebar Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted"
            title={sidebarOpen ? "Collapse Curriculum Sidebar" : "Expand Curriculum Sidebar"}
          >
            {sidebarOpen ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
            <span className="text-[11px] font-bold">{sidebarOpen ? "Hide Outline" : "Show Outline"}</span>
          </Button>

          {/* Mobile Drawer Trigger */}
          <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                <Menu className="size-4" />
                <span className="text-[11px]">Outline</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[min(24rem,100vw)] p-0 bg-card border-border">
              <SheetHeader className="p-4 border-b border-border text-left">
                <SheetTitle className="text-sm font-bold text-foreground truncate">
                  {course.title}
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  {completedLessons} of {orderedLessons.length} lessons completed ({progressPercent}%)
                </SheetDescription>
              </SheetHeader>
              <div className="p-4 overflow-y-auto max-h-[calc(100vh-5rem)]">
                <CourseOutline
                  courseSlug={course.slug}
                  orderedModules={orderedModules}
                  unassignedLessons={unassignedLessons}
                  showNoModuleHeader={course.showUnassignedHeader ?? true}
                  activeLessonId={currentLesson.id}
                  lessonIndexMap={lessonIndexMap}
                  completionMap={progressData?.lessonProgress ?? {}}
                  hasEnrollment={Boolean(initialEnrollmentId)}
                  onNavigate={() => setMobileSheetOpen(false)}
                />
              </div>
            </SheetContent>
          </Sheet>

          {/* Current Lesson Badge */}
          <div className="min-w-0 truncate hidden md:flex items-center gap-2">
            <span className="rounded-md bg-[#ff6636]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#ff6636] shrink-0">
              Lesson {currentLesson.order}
            </span>
            <span className="text-xs font-bold text-foreground truncate max-w-md">
              {currentLesson.title}
            </span>
          </div>
        </div>

        {/* Right: Progress Controls & Theme */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mark Complete Instant Action */}
          {initialEnrollmentId && (
            <Button
              size="sm"
              onClick={handleMarkComplete}
              disabled={isMarking}
              className={cn(
                "rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-200 shadow-2xs",
                isLessonComplete
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30"
                  : "bg-[#ff6636] text-white hover:bg-[#e95a2b]"
              )}
            >
              {isLessonComplete ? (
                <>
                  <CheckCircle2 className="size-3.5 mr-1.5" />
                  <span>Completed</span>
                </>
              ) : (
                <>
                  <Circle className="size-3.5 mr-1.5" />
                  <span>Mark Done</span>
                </>
              )}
            </Button>
          )}

          {/* Theme Toggle */}
          <ThemeToggle className="size-8 rounded-xl" />
        </div>
      </header>

      {/* ── 2. Fluid Full-Window Workspace (Left Sidebar + Expanded Main Content) ─ */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* ── Left Pane: Collapsible Curriculum Tree ─────────────────────────── */}
        {sidebarOpen && (
          <aside className="hidden lg:flex w-80 xl:w-[340px] flex-col border-r border-border bg-card/60 shrink-0 select-none overflow-hidden transition-all duration-300">
            {/* Header & Course Progress */}
            <div className="p-4 border-b border-border space-y-2.5 bg-muted/20">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="size-3 text-[#ff6636]" /> Course Syllabus
                </span>
                <span className="text-xs font-mono font-bold text-[#ff6636]">
                  {progressPercent}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-[#ff6636] rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground font-medium truncate">
                {completedLessons} of {orderedLessons.length} lessons completed
              </p>
            </div>

            {/* Tree Scroll Area with full-text wrapping */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-2">
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

            {/* Bottom Collapse Helper */}
            <div className="p-2.5 border-t border-border/70 bg-card/80">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-xl h-8"
              >
                <PanelLeftClose className="size-3.5" />
                <span>Hide Sidebar</span>
              </Button>
            </div>
          </aside>
        )}

        {/* ── Center Pane: Expanded Full-Window Content Workspace ────────────── */}
        <main className="flex-1 flex flex-col min-w-0 bg-background overflow-y-auto select-text">
          <div className="flex-1 w-full px-4 py-8 sm:px-8 md:px-12 lg:px-16 xl:px-20 space-y-8">
            
            {/* Article Heading */}
            <div className="space-y-3 border-b border-border pb-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-[#ff6636]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#ff6636]">
                  <ClipboardCheck className="size-3.5" />
                  Lesson {currentLesson.order}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  Part of {course.title}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                {currentLesson.title}
              </h1>
            </div>

            {/* Locked vs Content View */}
            {currentLesson.isLocked ? (
              <div className="rounded-3xl border border-border bg-card p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-5 shadow-sm my-8">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#ff6636]/10 text-[#ff6636]">
                  <Lock className="size-6" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-foreground">This lesson requires enrollment</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                    {currentLesson.message || "Enroll in this course to access the full interactive code and text lessons."}
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href={`/courses/${course.slug}`}
                    className="inline-flex items-center justify-center rounded-xl bg-[#ff6636] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#e95a2b] shadow-md shadow-[#ff6636]/20 transition-all"
                  >
                    Enroll in Course
                  </Link>
                </div>
              </div>
            ) : (
              <article
                className="
                  lesson-content prose prose-neutral dark:prose-invert max-w-none w-full
                  prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground
                  prose-h1:text-3xl prose-h1:mb-6
                  prose-h2:border-b prose-h2:border-border prose-h2:pb-2.5 prose-h2:mt-10 prose-h2:text-2xl
                  prose-h3:text-xl prose-h3:mt-8
                  prose-p:leading-relaxed prose-p:text-foreground/90 prose-p:text-base
                  prose-code:rounded-md prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:font-mono prose-code:text-sm
                  prose-pre:rounded-2xl prose-pre:border prose-pre:border-border prose-pre:bg-[#16181d] prose-pre:w-full prose-pre:p-5
                  prose-blockquote:rounded-xl prose-blockquote:border-l-4 prose-blockquote:border-[#ff6636] prose-blockquote:bg-[#ff6636]/5 prose-blockquote:px-5 prose-blockquote:py-3.5 prose-blockquote:not-italic
                  prose-a:text-[#ff6636] prose-a:font-semibold hover:prose-a:underline
                  prose-img:rounded-2xl prose-img:border prose-img:border-border
                "
              >
                {(() => {
                  if (!currentLesson.content) {
                    return (
                      <p className="text-sm text-muted-foreground italic">
                        Lesson content is being authored for this module.
                      </p>
                    );
                  }
                  try {
                    const content =
                      typeof currentLesson.content === "string"
                        ? JSON.parse(currentLesson.content)
                        : currentLesson.content;
                    return <RichTextRenderer content={content} />;
                  } catch (err) {
                    console.error("Content parsing error:", err);
                    return (
                      <div className="rounded-xl border border-dashed border-border bg-muted/40 p-6 text-center text-xs text-muted-foreground">
                        Lesson content could not be displayed. Refresh to retry.
                      </div>
                    );
                  }
                })()}
              </article>
            )}

            {/* Sticky Bottom Navigation Controls */}
            <div className="pt-10 pb-12 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {previousLesson ? (
                <Link
                  href={`/courses/${course.slug}/lessons/${previousLesson.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-foreground hover:border-[#ff6636]/50 hover:text-[#ff6636] transition-all"
                  title="Shortcut: Shift + P"
                >
                  <ChevronLeft className="size-4" />
                  <span>Previous Lesson</span>
                </Link>
              ) : (
                <Link
                  href={`/courses/${course.slug}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-foreground hover:border-[#ff6636]/50 hover:text-[#ff6636] transition-all"
                >
                  <ArrowLeft className="size-4" />
                  <span>Course Syllabus</span>
                </Link>
              )}

              {nextLesson ? (
                <Link
                  href={`/courses/${course.slug}/lessons/${nextLesson.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-[#ff6636]/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                  title="Shortcut: Shift + N"
                >
                  <span>Next Lesson</span>
                  <ChevronRight className="size-4" />
                </Link>
              ) : (
                <Link
                  href={`/courses/${course.slug}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-background hover:bg-foreground/90 transition-all"
                >
                  <span>Finish Course</span>
                  <CheckCircle2 className="size-4" />
                </Link>
              )}
            </div>
          </div>
        </main>

      </div>
    </div>
  );
}
