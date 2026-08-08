"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ReviewForm } from "@/components/review-form";
import { ReviewList } from "@/components/review-list";
import {
  MarketingPublicFooter,
  MarketingPublicHeader,
} from "@/components/marketing/public-chrome";
import { getProxiedImageUrl } from "@/lib/s3-utils";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Layers3,
  PlayCircle,
  Sparkles,
  Tag,
  Users,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";

export interface LessonItem {
  id: string;
  title: string;
  order: number;
  isFree?: boolean;
  moduleId?: string | null;
}

export interface ModuleItem {
  id: string;
  title: string;
  order: number;
  description?: string | null;
  lessons: LessonItem[];
}

export interface CourseDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  level: string;
  tags: string[];
  price: number;
  durationMinutes?: number | null;
  imageUrl?: string | null;
  instructor: string;
  lessons: LessonItem[];
  modules?: ModuleItem[];
  showUnassignedHeader?: boolean;
  enrollments: number;
}

function formatPrice(price: number) {
  return price > 0 ? `$${price.toFixed(2)}` : "Free";
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);
}

function formatDuration(minutes?: number | null) {
  if (!minutes) return "Self-paced";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) return `${remainingMinutes} min`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

function pluralize(count: number, singular: string) {
  return count === 1 ? singular : `${singular}s`;
}

function getTagBadgeStyle(tag: string) {
  const normalized = tag.toLowerCase().trim();

  if (normalized.includes("python")) {
    return "bg-emerald-600 border-emerald-500/20 text-white";
  }
  if (
    normalized.includes("asp") ||
    normalized.includes("dot_net") ||
    normalized.includes(".net") ||
    normalized.includes("csharp") ||
    normalized.includes("c#")
  ) {
    return "bg-purple-600 border-purple-500/20 text-white";
  }
  if (normalized.includes("javascript") || normalized.includes("js")) {
    return "bg-amber-600 border-amber-500/20 text-white";
  }
  if (normalized.includes("typescript") || normalized.includes("ts")) {
    return "bg-blue-600 border-blue-500/20 text-white";
  }
  if (normalized.includes("powershell") || normalized.includes("pwsh")) {
    return "bg-sky-700 border-sky-600/20 text-white";
  }
  if (normalized.includes("frontend") || normalized.includes("front-end")) {
    return "bg-pink-600 border-pink-500/20 text-white";
  }
  if (normalized.includes("backend") || normalized.includes("back-end")) {
    return "bg-indigo-600 border-indigo-500/20 text-white";
  }
  if (normalized.includes("full") && normalized.includes("stack")) {
    return "bg-teal-600 border-teal-500/20 text-white";
  }
  if (
    normalized.includes("sql") ||
    normalized.includes("db") ||
    normalized.includes("database") ||
    normalized.includes("postgres")
  ) {
    return "bg-cyan-600 border-cyan-500/20 text-white";
  }
  return "bg-[#ff6636] border-[#ff6636]/20 text-white";
}

function LessonRow({
  courseSlug,
  lesson,
}: {
  courseSlug: string;
  lesson: LessonItem;
}) {
  return (
    <Link
      href={`/courses/${courseSlug}/lessons/${lesson.id}`}
      className="group flex items-start gap-3.5 rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-[#ff6636] hover:bg-[#ff6636]/5 hover:shadow-2xs"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground transition-colors duration-200 group-hover:bg-[#ff6636]/10 group-hover:text-[#ff6636] font-mono">
        {lesson.order}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-foreground transition-colors duration-200 group-hover:text-[#ff6636] leading-snug break-words">
            {lesson.title}
          </p>
          {lesson.isFree ? (
            <span className="rounded-full bg-[#ff6636]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#ff6636]">
              Preview
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          Lesson {lesson.order} in this learning path.
        </p>
      </div>
      <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[#ff6636]" />
    </Link>
  );
}

export function CourseDetailClient({ course }: { course: CourseDetail }) {
  const { data: session } = authClient.useSession();
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentProgress, setEnrollmentProgress] = useState<number | null>(
    null,
  );
  const [lessonProgress, setLessonProgress] = useState<Record<
    string,
    boolean
  > | null>(null);
  const [existingReview, setExistingReview] = useState<{
    rating: number;
    comment: string | null;
  } | null>(null);
  const [reviewRefreshTrigger, setReviewRefreshTrigger] = useState(0);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    setIsEnrolled(false);
    setEnrollmentProgress(null);
    setLessonProgress(null);

    const checkEnrollment = async () => {
      try {
        const res = await fetch("/api/enrollments");
        if (!res.ok) return;
        const enrollments = await res.json();
        const enrollment = enrollments.find(
          (item: { course: { id: string }; id: string; progress: number }) =>
            item.course.id === course.id,
        );
        if (enrollment) {
          setIsEnrolled(true);

          try {
            const progressRes = await fetch(
              `/api/enrollments/${enrollment.id}/progress?t=${Date.now()}`,
              {
                cache: "no-store",
              },
            );

            if (progressRes.ok) {
              const progressData: {
                progress?: number;
                lessonProgress?: Record<string, boolean>;
              } = await progressRes.json();

              setEnrollmentProgress(
                progressData.progress ?? enrollment.progress ?? 0,
              );
              setLessonProgress(progressData.lessonProgress ?? null);
            } else {
              setEnrollmentProgress(enrollment.progress ?? 0);
            }
          } catch (progressError) {
            console.error("Failed to fetch lesson progress", progressError);
            setEnrollmentProgress(enrollment.progress ?? 0);
          }
        }
      } catch (error) {
        console.error("Failed to check enrollment", error);
      }
    };

    checkEnrollment();
  }, [course.id]);

  useEffect(() => {
    if (!session?.user?.id) {
      setExistingReview(null);
      return;
    }

    const loadMyReview = async () => {
      try {
        const response = await fetch(`/api/reviews?userId=${session.user.id}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data: {
          reviews?: Array<{
            course: { id: string };
            rating: number;
            comment: string | null;
          }>;
        } = await response.json();

        const currentCourseReview = data.reviews?.find(
          (review) => review.course.id === course.id,
        );

        setExistingReview(
          currentCourseReview
            ? {
                rating: currentCourseReview.rating,
                comment: currentCourseReview.comment,
              }
            : null,
        );
      } catch (error) {
        console.error("Failed to load current user review", error);
      }
    };

    void loadMyReview();
  }, [course.id, reviewRefreshTrigger, session?.user?.id]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to enroll");
      }

      await res.json();
      setIsEnrolled(true);
      toast.success("Successfully enrolled in course!");
    } catch (error) {
      console.error("Enrollment error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to enroll in course",
      );
    } finally {
      setEnrolling(false);
    }
  };

  const sortedLessons = useMemo(
    () => (course.lessons || []).slice().sort((a, b) => a.order - b.order),
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

  const learningPoints = useMemo(() => {
    const points = [
      `${sortedLessons.length} structured ${pluralize(sortedLessons.length, "lesson")} designed to build momentum.`,
      course.durationMinutes
        ? `${formatDuration(course.durationMinutes)} of material you can revisit at any time.`
        : "Self-paced content you can move through around your schedule.",
      `A ${course.level.toLowerCase()}-friendly path for ${course.category.toLowerCase()} skills.`,
    ];

    if (course.tags?.length) {
      points.push(`Key topics include ${course.tags.slice(0, 3).join(", ")}.`);
    } else {
      points.push(
        `Led by ${course.instructor} with a practical, progression-first structure.`,
      );
    }

    return points;
  }, [course, sortedLessons.length]);

  const heroImage = course.imageUrl
    ? getProxiedImageUrl(course.imageUrl)
    : null;
  const courseTags = useMemo(() => {
    const rawTags = course.tags ?? [];
    return rawTags
      .flatMap((tag) => tag.split(",").map((t) => t.trim()))
      .filter(Boolean);
  }, [course.tags]);
  const showNoModuleHeader = course.showUnassignedHeader ?? true;
  const moduleCount = orderedModules.length;
  const orderedLessons = useMemo(
    () => [
      ...unassignedLessons,
      ...orderedModules.flatMap((moduleItem) =>
        moduleItem.lessons.slice().sort((a, b) => a.order - b.order),
      ),
    ],
    [orderedModules, unassignedLessons],
  );

  const continueLessonHref = useMemo(() => {
    if (orderedLessons.length === 0) {
      return null;
    }

    if (!lessonProgress) {
      return `/courses/${course.slug}/lessons/${orderedLessons[0].id}`;
    }

    const nextUncompletedLesson = orderedLessons.find(
      (lesson) => !lessonProgress[lesson.id],
    );

    if (nextUncompletedLesson) {
      return `/courses/${course.slug}/lessons/${nextUncompletedLesson.id}`;
    }

    return `/courses/${course.slug}/lessons/${orderedLessons[orderedLessons.length - 1].id}`;
  }, [course.slug, lessonProgress, orderedLessons]);

  const learningCtaLabel =
    enrollmentProgress === 100
      ? "Review lessons"
      : (enrollmentProgress ?? 0) > 0
        ? "Continue learning"
        : "Start learning";

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
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#8c94a3] transition-colors duration-200 hover:text-white"
            >
              <ArrowLeft className="size-4" />
              Back to courses
            </Link>

            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_880px] items-center">
              <div className="max-w-190 space-y-6">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md bg-white/10 border border-white/10 text-white">
                    <Tag className="size-3.5 text-[#ff6636]" />
                    {course.category}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md bg-white/10 border border-white/10 text-white">
                    <GraduationCap className="size-3.5 text-[#ff6636]" />
                    {course.level}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md bg-white/10 border border-white/10 text-white">
                    <Users className="size-3.5 text-[#ff6636]" />
                    {formatCompactNumber(course.enrollments)} enrolled
                  </span>
                  {course.price <= 0 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ff6636] border border-transparent px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                      <Sparkles className="size-3.5" />
                      Free Access
                    </span>
                  ) : null}
                </div>

                <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl leading-[1.1]">
                  {course.title}
                </h1>

                <p className="text-base sm:text-lg leading-relaxed text-gray-300">
                  {course.description}
                </p>

                {/* Hero Stats */}
                <div className="grid gap-3 grid-cols-3 pt-2">
                  <div className="rounded-xl border border-white/5 bg-white/[0.03] backdrop-blur p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#8c94a3]">
                      Lessons
                    </p>
                    <p className="mt-1 text-lg font-bold text-white">
                      {sortedLessons.length}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.03] backdrop-blur p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#8c94a3]">
                      Duration
                    </p>
                    <p className="mt-1 text-lg font-bold text-white">
                      {formatDuration(course.durationMinutes)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.03] backdrop-blur p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#8c94a3]">
                      Modules
                    </p>
                    <p className="mt-1 text-lg font-bold text-white">
                      {moduleCount}
                    </p>
                  </div>
                </div>

                {courseTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {courseTags.map((tag) => (
                      <span
                        key={tag}
                        className={`inline-flex items-center rounded-full border px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm ${getTagBadgeStyle(tag)}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Course Detail Hero Image Frame */}
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-[#121418] shadow-2xl shadow-black/60 group">
                {heroImage ? (
                  <Image
                    src={heroImage}
                    alt={course.title}
                    fill
                    unoptimized
                    priority
                    sizes="(max-width: 1024px) 100vw, 580px"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-102"
                    onError={() => {
                      console.warn("Course image failed to load", {
                        title: course.title,
                        storedImageUrl: course.imageUrl,
                      });
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,#ff8f6a_0%,#ff6636_40%,#1d2026_100%)]" />
                )}

                {/* Visual Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                {/* Top Overlay Badges */}
                <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#121418] shadow-md">
                    {formatPrice(course.price)}
                  </span>
                  <span className="rounded-full border border-white/15 bg-black/40 backdrop-blur px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
                    By {course.instructor}
                  </span>
                </div>

                {/* Bottom Overlay Label */}
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#ff6636]">
                    Curated Syllabus
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-200 leading-snug">
                    Get lifetime access to study files and structured
                    progression maps.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content & Sidebar Section */}
        <section className="mx-auto max-w-[1320px] px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            {/* Left Column: Learning Objectives & Course Curriculum */}
            <div className="space-y-8">
              {/* Outcomes Box */}
              <section className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  What you will learn
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Course overview and outcomes
                </h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {learningPoints.map((point) => (
                    <div
                      key={point}
                      className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/40 p-4 transition-colors duration-200 hover:bg-muted/65"
                    >
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#ff6636]/10 text-[#ff6636]">
                        <CheckCircle2 className="size-4.5" />
                      </span>
                      <p className="text-sm leading-relaxed text-foreground/80 font-medium">
                        {point}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Curriculum Breakdown */}
              {sortedLessons.length > 0 ? (
                <section className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                        Curriculum
                      </p>
                      <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                        Lesson breakdown
                      </h2>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-bold text-muted-foreground">
                      <span className="rounded-full border border-border bg-muted px-3.5 py-1.5 uppercase tracking-wider">
                        {sortedLessons.length}{" "}
                        {pluralize(sortedLessons.length, "lesson")}
                      </span>
                      <span className="rounded-full border border-border bg-muted px-3.5 py-1.5 uppercase tracking-wider">
                        {moduleCount} {pluralize(moduleCount, "module")}
                      </span>
                    </div>
                  </div>

                  {unassignedLessons.length > 0 ? (
                    <div className="mt-6 space-y-4">
                      {showNoModuleHeader ? (
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#ff6636] pl-1">
                          Standalone lessons
                        </p>
                      ) : null}
                      <div className="grid gap-3">
                        {unassignedLessons.map((lesson) => (
                          <LessonRow
                            key={lesson.id}
                            courseSlug={course.slug}
                            lesson={lesson}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {orderedModules.length > 0 ? (
                    <div className="mt-8 space-y-4">
                      <Accordion type="multiple" className="w-full space-y-3.5">
                        {orderedModules.map((moduleItem) => (
                          <AccordionItem
                            key={moduleItem.id}
                            value={moduleItem.id}
                            className="border border-border rounded-xl overflow-hidden bg-muted/15 transition-all duration-300 hover:border-border/80"
                          >
                            <AccordionTrigger className="px-5 py-4.5 text-left hover:no-underline hover:bg-muted/40 transition-colors [&[data-state=open]]:bg-muted/30">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full pr-4">
                                <div className="flex items-start gap-3 min-w-0 flex-1">
                                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#ff6636]/10 text-[#ff6636]">
                                    <Layers3 className="size-4.5" />
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-base font-bold text-foreground leading-snug break-words">
                                      {moduleItem.title}
                                    </p>
                                    {moduleItem.description ? (
                                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed font-normal break-words">
                                        {moduleItem.description}
                                      </p>
                                    ) : null}
                                  </div>
                                </div>
                                <span className="self-start sm:self-auto shrink-0 rounded-full border border-border bg-card px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground shadow-2xs">
                                  {moduleItem.lessons.length}{" "}
                                  {pluralize(
                                    moduleItem.lessons.length,
                                    "lesson",
                                  )}
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-5 pt-3 pb-5 border-t border-border/40 bg-card">
                              <div className="grid gap-3 mt-1">
                                {moduleItem.lessons
                                  .slice()
                                  .sort((a, b) => a.order - b.order)
                                  .map((lesson) => (
                                    <LessonRow
                                      key={lesson.id}
                                      courseSlug={course.slug}
                                      lesson={lesson}
                                    />
                                  ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  ) : null}
                </section>
              ) : null}

              {/* Reviews Section */}
              <section className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Reviews
                  </p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    What learners are saying
                  </h2>
                </div>

                {session?.user ? (
                  isEnrolled ? (
                    enrollmentProgress === 100 ? (
                      <ReviewForm
                        courseId={course.id}
                        courseTitle={course.title}
                        existingReview={existingReview || undefined}
                        onReviewSubmitted={() =>
                          setReviewRefreshTrigger((value) => value + 1)
                        }
                      />
                    ) : (
                      <div className="rounded-xl border border-border bg-muted/40 p-5 text-sm leading-relaxed text-foreground/75 font-medium">
                        Finish this course to unlock reviews. Your current
                        progress is {enrollmentProgress ?? 0}%.
                      </div>
                    )
                  ) : (
                    <div className="rounded-xl border border-border bg-muted/40 p-5 text-sm leading-relaxed text-foreground/75 font-medium">
                      Enroll in this course to leave a review after completion.
                    </div>
                  )
                ) : (
                  <div className="rounded-xl border border-border bg-muted/40 p-5 text-sm leading-relaxed text-foreground/75 font-medium">
                    Sign in and enroll to leave your review after completing the
                    course.
                  </div>
                )}

                <ReviewList
                  courseId={course.id}
                  refreshTrigger={reviewRefreshTrigger}
                />
              </section>
            </div>

            {/* Right Column: Enrollment Card and "Why This Course" */}
            <aside className="space-y-6">
              <div className="sticky top-24 space-y-6">
                {/* Main Action card */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-md transition-shadow duration-300 hover:shadow-lg">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Enrollment
                  </p>

                  <div className="mt-4 flex items-center justify-between gap-4">
                    <h2 className="text-4xl font-extrabold tracking-tight text-foreground">
                      {formatPrice(course.price)}
                    </h2>
                    <span className="rounded-full bg-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                      {course.level}
                    </span>
                  </div>

                  <p className="mt-4 text-xs leading-relaxed text-muted-foreground font-medium">
                    By {course.instructor}. Enroll to track progress, return to
                    lessons anytime, and keep the course in your dashboard.
                  </p>

                  <div className="mt-6">
                    {isEnrolled ? (
                      continueLessonHref ? (
                        <Link
                          href={continueLessonHref}
                          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#ff6636] px-5 text-sm font-bold text-white transition-all duration-200 hover:bg-[#e95a2b] shadow-md shadow-[#ff6636]/15 hover:scale-[1.01] active:scale-[0.99]"
                        >
                          {learningCtaLabel}
                          <ArrowRight className="size-4" />
                        </Link>
                      ) : (
                        <Button
                          className="h-12 w-full rounded-xl bg-[#1d2026] text-white hover:bg-[#101318]"
                          disabled
                        >
                          No lessons available
                        </Button>
                      )
                    ) : (
                      <Button
                        className="h-12 w-full rounded-xl bg-[#ff6636] text-white transition-all duration-200 hover:bg-[#e95a2b] font-bold shadow-md shadow-[#ff6636]/15 hover:scale-[1.01] active:scale-[0.99]"
                        onClick={handleEnroll}
                        disabled={enrolling}
                      >
                        {enrolling ? "Enrolling..." : "Enroll now"}
                      </Button>
                    )}
                  </div>

                  <div className="mt-6 space-y-4 border-t border-border pt-6 font-semibold">
                    <div className="flex items-center justify-between text-xs text-foreground/80">
                      <span className="inline-flex items-center gap-2">
                        <BookOpen className="size-4 text-[#ff6636]" />
                        Lessons
                      </span>
                      <span className="text-foreground">
                        {sortedLessons.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-foreground/80">
                      <span className="inline-flex items-center gap-2">
                        <Clock3 className="size-4 text-[#ff6636]" />
                        Duration
                      </span>
                      <span className="text-foreground">
                        {formatDuration(course.durationMinutes)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-foreground/80">
                      <span className="inline-flex items-center gap-2">
                        <Users className="size-4 text-[#ff6636]" />
                        Learners
                      </span>
                      <span className="text-foreground">
                        {formatCompactNumber(course.enrollments)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Secondary Feature Card */}
                <div className="rounded-2xl border border-border bg-muted/40 p-6 space-y-5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#ff6636]">
                    Why this course
                  </p>
                  <div className="space-y-4 text-xs leading-relaxed text-muted-foreground font-semibold">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#ff6636]/10 text-[#ff6636]">
                        <PlayCircle className="size-4.5" />
                      </span>
                      <p className="mt-1">
                        Structured lesson ordering keeps the next step obvious.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#ff6636]/10 text-[#ff6636]">
                        <Layers3 className="size-4.5" />
                      </span>
                      <p className="mt-1">
                        Module breakdown makes it easier to review and revisit.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#ff6636]/10 text-[#ff6636]">
                        <Sparkles className="size-4.5" />
                      </span>
                      <p className="mt-1">
                        Built for learners who want clarity over clutter.
                      </p>
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
