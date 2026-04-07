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
      className="group flex items-start gap-4 border border-[#e9eaf0] bg-white px-4 py-4 transition hover:border-[#ff6636] hover:bg-[#fffaf6]"
    >
      <span className="flex size-10 shrink-0 items-center justify-center bg-[#fff2e5] text-sm font-semibold text-[#ff6636]">
        {lesson.order}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-base font-semibold text-[#1d2026]">
            {lesson.title}
          </p>
          {lesson.isFree ? (
            <span className="bg-[#fff2e5] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#ff6636]">
              Preview
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-sm text-[#6e7485]">
          Lesson {lesson.order} in this learning path.
        </p>
      </div>
      <ArrowRight className="mt-1 size-4 shrink-0 text-[#8c94a3] transition group-hover:text-[#ff6636]" />
    </Link>
  );
}

export function CourseDetailClient({ course }: { course: CourseDetail }) {
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    setIsEnrolled(false);

    const checkEnrollment = async () => {
      try {
        const res = await fetch("/api/enrollments");
        if (!res.ok) return;
        const enrollments = await res.json();
        const enrollment = enrollments.find(
          (item: { course: { id: string }; id: string }) =>
            item.course.id === course.id,
        );
        if (enrollment) setIsEnrolled(true);
      } catch (error) {
        console.error("Failed to check enrollment", error);
      }
    };

    checkEnrollment();
  }, [course.id]);

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
  const courseTags = course.tags ?? [];
  const showNoModuleHeader = course.showUnassignedHeader ?? true;
  const moduleCount = orderedModules.length;
  const firstLessonHref =
    sortedLessons.length > 0
      ? `/courses/${course.slug}/lessons/${sortedLessons[0].id}`
      : null;

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-[#1d2026]">
      <MarketingPublicHeader activePath="/courses" />

      <main>
        <section className="border-b border-[#e9eaf0] bg-white">
          <div className="mx-auto max-w-[1320px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#4e5566] transition hover:text-[#ff6636]"
            >
              <ArrowLeft className="size-4" />
              Back to courses
            </Link>

            <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
              <div className="max-w-[760px]">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 bg-[#fff2e5] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ff6636]">
                    <Tag className="size-3.5" />
                    {course.category}
                  </span>
                  <span className="inline-flex items-center gap-2 border border-[#e9eaf0] bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4e5566]">
                    <GraduationCap className="size-3.5 text-[#ff6636]" />
                    {course.level}
                  </span>
                  <span className="inline-flex items-center gap-2 border border-[#e9eaf0] bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4e5566]">
                    <Users className="size-3.5 text-[#ff6636]" />
                    {formatCompactNumber(course.enrollments)} enrolled
                  </span>
                  {course.price <= 0 ? (
                    <span className="inline-flex items-center gap-2 bg-[#1d2026] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                      <Sparkles className="size-3.5" />
                      Free access
                    </span>
                  ) : null}
                </div>

                <h1 className="mt-6 text-[2.4rem] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[3.3rem]">
                  {course.title}
                </h1>
                <p className="mt-5 max-w-[680px] text-base leading-8 text-[#6e7485]">
                  {course.description}
                </p>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  <div className="border border-[#e9eaf0] bg-[#f5f7fa] px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c94a3]">
                      Lessons
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                      {sortedLessons.length}{" "}
                      {pluralize(sortedLessons.length, "lesson")}
                    </p>
                  </div>
                  <div className="border border-[#e9eaf0] bg-[#f5f7fa] px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c94a3]">
                      Duration
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                      {formatDuration(course.durationMinutes)}
                    </p>
                  </div>
                  <div className="border border-[#e9eaf0] bg-[#f5f7fa] px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c94a3]">
                      Modules
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                      {moduleCount} {pluralize(moduleCount, "module")}
                    </p>
                  </div>
                </div>

                {courseTags.length > 0 ? (
                  <div className="mt-8 flex flex-wrap gap-2">
                    {courseTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center border border-[#e9eaf0] bg-[#f5f7fa] px-3 py-2 text-sm font-medium text-[#4e5566]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="overflow-hidden border border-[#1d2026] bg-[#1d2026]">
                <div className="relative min-h-[320px]">
                  {heroImage ? (
                    <Image
                      src={heroImage}
                      alt={course.title}
                      fill
                      priority
                      sizes="(max-width: 1279px) 100vw, 420px"
                      className="object-cover"
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
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1d2026] via-[#1d2026]/35 to-transparent" />
                  <div className="absolute left-0 right-0 top-0 flex items-start justify-between gap-3 p-5">
                    <span className="bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1d2026]">
                      {formatPrice(course.price)}
                    </span>
                    <span className="border border-white/15 bg-white/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur">
                      By {course.instructor}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d0d3dd]">
                      Featured learning path
                    </p>
                    <p className="mt-3 text-xl font-semibold leading-tight">
                      Structured curriculum, guided pace, and content you can
                      return to whenever needed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1320px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-8">
              <section className="border border-[#e9eaf0] bg-white p-6 sm:p-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c94a3]">
                  What you will learn
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#1d2026]">
                  Course overview and outcomes
                </h2>
                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  {learningPoints.map((point) => (
                    <div
                      key={point}
                      className="flex items-start gap-3 border border-[#e9eaf0] bg-[#f5f7fa] p-4"
                    >
                      <span className="mt-0.5 flex size-8 items-center justify-center bg-[#fff2e5] text-[#ff6636]">
                        <CheckCircle2 className="size-4" />
                      </span>
                      <p className="text-sm leading-7 text-[#4e5566]">
                        {point}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {sortedLessons.length > 0 ? (
                <section className="border border-[#e9eaf0] bg-white p-6 sm:p-8">
                  <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c94a3]">
                        Curriculum
                      </p>
                      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#1d2026]">
                        Lesson breakdown
                      </h2>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm font-medium text-[#4e5566]">
                      <span className="border border-[#e9eaf0] bg-[#f5f7fa] px-4 py-2">
                        {sortedLessons.length}{" "}
                        {pluralize(sortedLessons.length, "lesson")}
                      </span>
                      <span className="border border-[#e9eaf0] bg-[#f5f7fa] px-4 py-2">
                        {moduleCount} {pluralize(moduleCount, "module")}
                      </span>
                    </div>
                  </div>

                  {unassignedLessons.length > 0 ? (
                    <div className="mt-8 space-y-4">
                      {showNoModuleHeader ? (
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c94a3]">
                          Standalone lessons
                        </p>
                      ) : null}
                      <div className="space-y-3">
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
                    <div className="mt-8">
                      <Accordion type="multiple" className="w-full space-y-4">
                        {orderedModules.map((moduleItem) => (
                          <AccordionItem
                            key={moduleItem.id}
                            value={moduleItem.id}
                            className="border border-[#e9eaf0] px-0"
                          >
                            <AccordionTrigger className="px-5 py-4 text-left hover:no-underline">
                              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div className="flex items-start gap-3">
                                  <span className="flex size-10 items-center justify-center bg-[#fff2e5] text-[#ff6636]">
                                    <Layers3 className="size-4" />
                                  </span>
                                  <div>
                                    <p className="text-lg font-semibold text-[#1d2026]">
                                      {moduleItem.title}
                                    </p>
                                    {moduleItem.description ? (
                                      <p className="mt-1 text-sm leading-7 text-[#6e7485]">
                                        {moduleItem.description}
                                      </p>
                                    ) : null}
                                  </div>
                                </div>
                                <span className="border border-[#e9eaf0] bg-[#f5f7fa] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4e5566]">
                                  {moduleItem.lessons.length}{" "}
                                  {pluralize(
                                    moduleItem.lessons.length,
                                    "lesson",
                                  )}
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-5 pb-5">
                              <div className="space-y-3">
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

              <section className="space-y-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c94a3]">
                    Reviews
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#1d2026]">
                    What learners are saying
                  </h2>
                </div>
                <ReviewList courseId={course.id} />
              </section>
            </div>

            <aside className="space-y-6">
              <div className="sticky top-24 space-y-6">
                <div className="border border-[#e9eaf0] bg-white p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c94a3]">
                    Enrollment
                  </p>
                  <div className="mt-3 flex items-end justify-between gap-4">
                    <h2 className="text-4xl font-semibold tracking-[-0.04em] text-[#1d2026]">
                      {formatPrice(course.price)}
                    </h2>
                    <span className="bg-[#fff2e5] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ff6636]">
                      {course.level}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[#6e7485]">
                    By {course.instructor}. Enroll to track progress, return to
                    lessons anytime, and keep the course in your dashboard.
                  </p>

                  <div className="mt-6">
                    {isEnrolled ? (
                      firstLessonHref ? (
                        <Link
                          href={firstLessonHref}
                          className="inline-flex h-12 w-full items-center justify-center gap-2 bg-[#ff6636] px-5 text-sm font-semibold text-white transition hover:bg-[#e95a2b]"
                        >
                          Continue learning
                          <ArrowRight className="size-4" />
                        </Link>
                      ) : (
                        <Button
                          className="h-12 w-full rounded-none bg-[#1d2026] text-white hover:bg-[#101318]"
                          disabled
                        >
                          No lessons available
                        </Button>
                      )
                    ) : (
                      <Button
                        className="h-12 w-full rounded-none bg-[#ff6636] text-white hover:bg-[#e95a2b]"
                        onClick={handleEnroll}
                        disabled={enrolling}
                      >
                        {enrolling ? "Enrolling..." : "Enroll now"}
                      </Button>
                    )}
                  </div>

                  <div className="mt-6 space-y-3 border-t border-[#e9eaf0] pt-6">
                    <div className="flex items-center justify-between text-sm text-[#4e5566]">
                      <span className="inline-flex items-center gap-2">
                        <BookOpen className="size-4 text-[#ff6636]" />
                        Lessons
                      </span>
                      <span className="font-semibold text-[#1d2026]">
                        {sortedLessons.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-[#4e5566]">
                      <span className="inline-flex items-center gap-2">
                        <Clock3 className="size-4 text-[#ff6636]" />
                        Duration
                      </span>
                      <span className="font-semibold text-[#1d2026]">
                        {formatDuration(course.durationMinutes)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-[#4e5566]">
                      <span className="inline-flex items-center gap-2">
                        <Users className="size-4 text-[#ff6636]" />
                        Learners
                      </span>
                      <span className="font-semibold text-[#1d2026]">
                        {formatCompactNumber(course.enrollments)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border border-[#1d2026] bg-[#1d2026] p-6 text-white">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c94a3]">
                    Why this course
                  </p>
                  <div className="mt-5 space-y-4 text-sm leading-7 text-[#d0d3dd]">
                    <div className="flex items-start gap-3">
                      <span className="mt-1 flex size-8 items-center justify-center bg-white/10">
                        <PlayCircle className="size-4" />
                      </span>
                      <p>
                        Structured lesson ordering keeps the next step obvious.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="mt-1 flex size-8 items-center justify-center bg-white/10">
                        <Layers3 className="size-4" />
                      </span>
                      <p>
                        Module breakdown makes it easier to review and revisit.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="mt-1 flex size-8 items-center justify-center bg-white/10">
                        <Sparkles className="size-4" />
                      </span>
                      <p>Built for learners who want clarity over clutter.</p>
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
