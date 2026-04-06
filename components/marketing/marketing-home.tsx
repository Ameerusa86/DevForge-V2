"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Braces,
  Clock3,
  Code2,
  Database,
  Globe,
  Layers3,
  MonitorPlay,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

import {
  MarketingPublicFooter,
  MarketingPublicHeader,
} from "@/components/marketing/public-chrome";
import { getS3PublicUrl } from "@/lib/s3-utils";

interface HomeCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  level: string;
  price: number;
  imageUrl?: string | null;
  instructor: string;
  lessons: number;
  enrollments: number;
  publishedAt?: string | null;
  rating: number;
  totalReviews: number;
}

const categoryAppearance: Record<
  string,
  {
    label: string;
    icon: typeof Code2;
    cardClassName: string;
    iconClassName: string;
  }
> = {
  FRONTEND: {
    label: "Frontend",
    icon: MonitorPlay,
    cardClassName: "bg-[#ebebff]",
    iconClassName: "bg-white text-[#564ffd]",
  },
  BACKEND: {
    label: "Backend",
    icon: Database,
    cardClassName: "bg-[#e1f7e3]",
    iconClassName: "bg-white text-[#23bd33]",
  },
  FULL_STACK: {
    label: "Full Stack",
    icon: Layers3,
    cardClassName: "bg-[#ffeee8]",
    iconClassName: "bg-white text-[#ff6636]",
  },
  PYTHON: {
    label: "Python",
    icon: Code2,
    cardClassName: "bg-[#fff2e5]",
    iconClassName: "bg-white text-[#fd8e1f]",
  },
  JAVASCRIPT: {
    label: "JavaScript",
    icon: Braces,
    cardClassName: "bg-[#ebebff]",
    iconClassName: "bg-white text-[#564ffd]",
  },
  TYPESCRIPT: {
    label: "TypeScript",
    icon: Braces,
    cardClassName: "bg-[#f5f7fa]",
    iconClassName: "bg-white text-[#6e7485]",
  },
  CSHARP: {
    label: "C#",
    icon: Code2,
    cardClassName: "bg-[#e1f7e3]",
    iconClassName: "bg-white text-[#23bd33]",
  },
  DOT_NET: {
    label: ".NET",
    icon: Globe,
    cardClassName: "bg-[#ffeee8]",
    iconClassName: "bg-white text-[#ff6636]",
  },
  ASP_NET: {
    label: "ASP.NET",
    icon: Globe,
    cardClassName: "bg-[#fff2e5]",
    iconClassName: "bg-white text-[#fd8e1f]",
  },
};

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);
}

function formatPrice(price: number) {
  return price > 0 ? `$${price.toFixed(2)}` : "Free";
}

function HomeSkeleton() {
  return (
    <div className="space-y-10">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_520px]">
        <div className="space-y-4">
          <div className="h-4 w-44 bg-[#e9eaf0]" />
          <div className="h-20 w-full max-w-[640px] bg-[#e9eaf0]" />
          <div className="h-8 w-full max-w-[560px] bg-[#f1f3f7]" />
          <div className="flex gap-4">
            <div className="h-14 w-40 bg-[#e9eaf0]" />
            <div className="h-14 w-40 bg-[#f1f3f7]" />
          </div>
        </div>
        <div className="aspect-[860/560] bg-[#e9eaf0]" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="h-32 bg-[#e9eaf0]" />
        <div className="h-32 bg-[#e9eaf0]" />
        <div className="h-32 bg-[#e9eaf0]" />
        <div className="h-32 bg-[#e9eaf0]" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <div className="h-[360px] bg-[#e9eaf0]" />
        <div className="h-[360px] bg-[#e9eaf0]" />
        <div className="h-[360px] bg-[#e9eaf0]" />
      </div>
    </div>
  );
}

function CourseCard({ course }: { course: HomeCourse }) {
  const imageUrl = course.imageUrl ? getS3PublicUrl(course.imageUrl) : null;
  const appearance =
    categoryAppearance[course.category] || categoryAppearance.FULL_STACK;

  return (
    <article className="group overflow-hidden border border-[#e9eaf0] bg-white transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(18,24,40,0.1)]">
      <Link href={`/courses/${course.slug}`} className="block">
        <div className="relative aspect-[244/180] overflow-hidden border-b border-[#e9eaf0] bg-[#1d2026]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={course.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 20vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#ff8f6a_0%,#ff6636_45%,#1d2026_100%)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1d2026]/70 to-transparent" />
          <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-3">
            <span
              className={`inline-flex px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${appearance.cardClassName} text-[#1d2026]`}
            >
              {appearance.label}
            </span>
            <div className="bg-white px-2 py-1 text-xs font-semibold text-[#1d2026]">
              {formatPrice(course.price)}
            </div>
          </div>
        </div>
      </Link>

      <div className="space-y-4 p-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#8c94a3]">
            {course.instructor}
          </p>
          <Link href={`/courses/${course.slug}`}>
            <h3 className="mt-2 text-sm font-semibold leading-6 text-[#1d2026] transition hover:text-[#ff6636]">
              {course.title}
            </h3>
          </Link>
        </div>

        <div className="flex items-center justify-between border-t border-[#e9eaf0] pt-3 text-xs text-[#6e7485]">
          <span className="inline-flex items-center gap-1">
            <Star className="size-3.5 fill-[#fd8e1f] text-[#fd8e1f]" />
            {course.totalReviews > 0 ? course.rating.toFixed(1) : "New"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5 text-[#8c94a3]" />
            {formatCompactNumber(course.enrollments)}
          </span>
          <span className="inline-flex items-center gap-1">
            <BookOpen className="size-3.5 text-[#8c94a3]" />
            {course.lessons}
          </span>
        </div>
      </div>
    </article>
  );
}

export function MarketingHomePage() {
  const [courses, setCourses] = useState<HomeCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch("/api/courses", { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to fetch homepage data");
        const data = await response.json();
        setCourses(data || []);
      } catch (error) {
        console.error("Failed to fetch homepage courses", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchCourses();
  }, []);

  const publishedCourses = courses;
  const totalEnrollments = publishedCourses.reduce(
    (sum, course) => sum + course.enrollments,
    0,
  );
  const uniqueInstructors = new Set(
    publishedCourses.map((course) => course.instructor),
  ).size;
  const totalReviews = publishedCourses.reduce(
    (sum, course) => sum + course.totalReviews,
    0,
  );
  const weightedRating = publishedCourses.reduce(
    (sum, course) => sum + course.rating * course.totalReviews,
    0,
  );
  const averageRating = totalReviews ? weightedRating / totalReviews : 0;

  const categoryCounts = Object.entries(
    publishedCourses.reduce<Record<string, number>>((accumulator, course) => {
      accumulator[course.category] = (accumulator[course.category] || 0) + 1;
      return accumulator;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const popularCourses = [...publishedCourses]
    .sort(
      (a, b) =>
        b.enrollments - a.enrollments ||
        b.rating - a.rating ||
        b.totalReviews - a.totalReviews,
    )
    .slice(0, 6);

  const featuredCourses = [...publishedCourses]
    .sort(
      (a, b) =>
        b.rating - a.rating ||
        b.totalReviews - a.totalReviews ||
        b.enrollments - a.enrollments,
    )
    .slice(0, 4);

  const recentCourses = [...publishedCourses]
    .sort((a, b) => {
      const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return bDate - aDate;
    })
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-white text-[#1d2026]">
      <MarketingPublicHeader activePath="/" />

      <main>
        <section className="overflow-hidden bg-gradient-to-b from-[#f5f7fa] via-[#f5f7fa] to-white">
          <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            {loading ? (
              <HomeSkeleton />
            ) : (
              <div className="space-y-16">
                <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,648px)_minmax(0,1fr)]">
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#ff6636]">
                        Advance faster with DevForge
                      </p>
                      <h1 className="max-w-[648px] text-[40px] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[56px] lg:text-[72px] lg:leading-[74px]">
                        Master in-demand tech skills with confidence.
                      </h1>
                      <p className="max-w-[580px] text-lg leading-8 text-[#4e5566] lg:text-2xl">
                        Premium, project-driven courses designed to get you
                        job-ready faster.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <Link
                        href="/courses"
                        className="inline-flex items-center justify-center gap-2 bg-[#ff6636] px-8 py-4 text-base font-semibold text-white transition hover:bg-[#e95a2b]"
                      >
                        Start learning now
                      </Link>
                      <Link
                        href="/my-courses"
                        className="inline-flex items-center gap-3 text-sm font-semibold transition hover:text-[#ff6636]"
                      >
                        <span className="inline-flex size-12 items-center justify-center border border-[#e9eaf0] bg-white">
                          <BookOpen className="size-5" />
                        </span>
                        Resume my path
                      </Link>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 text-sm text-[#6e7485]">
                      <span className="inline-flex items-center gap-2">
                        <Sparkles className="size-4 text-[#ff6636]" />
                        {publishedCourses.length} published courses
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Users className="size-4 text-[#564ffd]" />
                        {formatCompactNumber(totalEnrollments)} enrollments
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Star className="size-4 text-[#23bd33]" />
                        {totalReviews ? averageRating.toFixed(1) : "New"}{" "}
                        average rating
                      </span>
                    </div>
                  </div>

                  <div className="relative mx-auto w-full max-w-[760px]">
                    <div
                      className="absolute inset-y-4 right-0 hidden w-[92%] bg-[#1d2026] lg:block"
                      style={{
                        clipPath: "polygon(18% 0,100% 0,82% 100%,0 100%)",
                      }}
                    />
                    <div
                      className="relative aspect-[900/548] overflow-hidden bg-[#1d2026] shadow-[0_24px_60px_rgba(29,32,38,0.18)]"
                      style={{
                        clipPath: "polygon(18% 0,100% 0,82% 100%,0 100%)",
                      }}
                    >
                      <Image
                        src="/images/HeroImg.jpg"
                        alt="DevForge learning hero"
                        fill
                        priority
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover"
                        style={{ objectPosition: "center 24%" }}
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(29,32,38,0.08)_0%,rgba(29,32,38,0.18)_100%)]" />
                    </div>

                    <div className="mt-4 flex max-w-[520px] flex-wrap gap-3 bg-white p-4 shadow-[0_18px_40px_rgba(29,32,38,0.1)] sm:absolute sm:-bottom-6 sm:left-0 sm:mt-0">
                      <div className="flex min-w-[140px] flex-1 items-center gap-3 border-r border-[#e9eaf0] pr-4">
                        <div className="flex size-11 items-center justify-center bg-[#ebebff] text-[#564ffd]">
                          <BookOpen className="size-5" />
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.08em] text-[#8c94a3]">
                            Courses
                          </p>
                          <p className="font-semibold">
                            {publishedCourses.length}
                          </p>
                        </div>
                      </div>
                      <div className="flex min-w-[140px] flex-1 items-center gap-3 border-r border-[#e9eaf0] pr-4">
                        <div className="flex size-11 items-center justify-center bg-[#e1f7e3] text-[#23bd33]">
                          <Users className="size-5" />
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.08em] text-[#8c94a3]">
                            Learners
                          </p>
                          <p className="font-semibold">
                            {formatCompactNumber(totalEnrollments)}
                          </p>
                        </div>
                      </div>
                      <div className="flex min-w-[140px] flex-1 items-center gap-3">
                        <div className="flex size-11 items-center justify-center bg-[#ffeee8] text-[#ff6636]">
                          <Globe className="size-5" />
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.08em] text-[#8c94a3]">
                            Instructors
                          </p>
                          <p className="font-semibold">{uniqueInstructors}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <section className="bg-[#f5f7fa] py-16 lg:py-20">
                  <div className="mx-auto max-w-[1320px] px-0">
                    <div className="mx-auto max-w-[640px] text-center">
                      <h2 className="text-[28px] font-semibold leading-[1.2] tracking-[-0.02em] text-[#1d2026] sm:text-[32px]">
                        Browse live categories
                      </h2>
                      <p className="mt-3 text-sm leading-6 text-[#6e7485] sm:text-base">
                        Choose your focus and start building.
                      </p>
                    </div>
                    <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {categoryCounts.map(([category, count]) => {
                        const appearance =
                          categoryAppearance[category] ||
                          categoryAppearance.FULL_STACK;
                        const Icon = appearance.icon;

                        return (
                          <article
                            key={category}
                            className={`${appearance.cardClassName} flex items-center gap-5 p-5 transition hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(29,32,38,0.1)]`}
                          >
                            <div
                              className={`${appearance.iconClassName} flex size-16 items-center justify-center`}
                            >
                              <Icon className="size-7" />
                            </div>
                            <div>
                              <h3 className="text-base font-semibold text-[#1d2026]">
                                {appearance.label}
                              </h3>
                              <p className="mt-2 text-sm text-[#6e7485]">
                                {count} live{" "}
                                {count === 1 ? "course" : "courses"}
                              </p>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                </section>

                <section className="py-4">
                  <div className="mx-auto max-w-[1320px] px-0">
                    <div className="mx-auto max-w-[640px] text-center">
                      <h2 className="text-[28px] font-semibold leading-[1.2] tracking-[-0.02em] text-[#1d2026] sm:text-[32px]">
                        Most popular right now
                      </h2>
                      <p className="mt-3 text-sm leading-6 text-[#6e7485] sm:text-base">
                        Top picks learners enroll in first.
                      </p>
                    </div>
                    <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                      {popularCourses.map((course) => (
                        <CourseCard key={course.id} course={course} />
                      ))}
                    </div>
                  </div>
                </section>

                <section className="bg-[#f5f7fa] py-16 lg:py-20">
                  <div className="mx-auto max-w-[1480px] px-0">
                    <div className="border border-[#e9eaf0] bg-white px-6 py-8 sm:px-10 lg:px-20 lg:py-16">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                          <h2 className="text-[28px] font-semibold leading-[1.2] tracking-[-0.02em] text-[#1d2026] sm:text-[32px]">
                            Top rated learning paths
                          </h2>
                          <p className="mt-3 max-w-[560px] text-sm leading-6 text-[#6e7485] sm:text-base">
                            High-impact paths curated for outcomes.
                          </p>
                        </div>
                        <Link
                          href="/courses"
                          className="inline-flex items-center gap-2 text-sm font-semibold text-[#1d2026] transition hover:text-[#ff6636]"
                        >
                          Browse all courses
                          <ArrowRight className="size-4" />
                        </Link>
                      </div>
                      <div className="mt-10 grid gap-6 lg:grid-cols-2">
                        {featuredCourses.map((course) => (
                          <article
                            key={course.id}
                            className="grid overflow-hidden border border-[#e9eaf0] bg-white sm:grid-cols-[220px_minmax(0,1fr)]"
                          >
                            <div className="relative min-h-[180px] overflow-hidden border-b border-[#e9eaf0] bg-[#1d2026] sm:border-b-0 sm:border-r">
                              {course.imageUrl ? (
                                <Image
                                  src={getS3PublicUrl(course.imageUrl)}
                                  alt={course.title}
                                  fill
                                  sizes="(max-width: 640px) 100vw, 220px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="absolute inset-0 bg-[linear-gradient(135deg,#ff8f6a_0%,#ff6636_45%,#1d2026_100%)]" />
                              )}
                            </div>
                            <div className="space-y-4 p-5">
                              <div className="flex flex-wrap items-center gap-3 text-xs text-[#8c94a3]">
                                <span className="bg-[#fff2e5] px-2 py-1 font-semibold uppercase tracking-[0.08em] text-[#ff6636]">
                                  {
                                    (
                                      categoryAppearance[course.category] ||
                                      categoryAppearance.FULL_STACK
                                    ).label
                                  }
                                </span>
                                <span>{course.instructor}</span>
                              </div>
                              <h3 className="text-lg font-semibold leading-7 text-[#1d2026]">
                                {course.title}
                              </h3>
                              <div className="flex flex-wrap gap-5 text-sm text-[#6e7485]">
                                <span className="inline-flex items-center gap-2">
                                  <BookOpen className="size-4 text-[#8c94a3]" />
                                  {course.lessons} lessons
                                </span>
                                <span className="inline-flex items-center gap-2">
                                  <Users className="size-4 text-[#8c94a3]" />
                                  {formatCompactNumber(course.enrollments)}{" "}
                                  learners
                                </span>
                                <span className="inline-flex items-center gap-2">
                                  <Star className="size-4 fill-[#fd8e1f] text-[#fd8e1f]" />
                                  {course.totalReviews > 0
                                    ? course.rating.toFixed(1)
                                    : "New"}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e9eaf0] pt-4">
                                <div className="text-sm font-semibold text-[#1d2026]">
                                  {formatPrice(course.price)}
                                </div>
                                <Link
                                  href={`/courses/${course.slug}`}
                                  className="inline-flex items-center justify-center bg-[#ffeee8] px-4 py-2 text-sm font-semibold text-[#ff6636] transition hover:bg-[#ffe2d6]"
                                >
                                  View course
                                </Link>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="py-4">
                  <div className="mx-auto max-w-[1320px] px-0">
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                      <div>
                        <div className="mx-auto max-w-[640px] text-center xl:mx-0 xl:text-left">
                          <h2 className="text-[28px] font-semibold leading-[1.2] tracking-[-0.02em] text-[#1d2026] sm:text-[32px]">
                            Recently published
                          </h2>
                          <p className="mt-3 text-sm leading-6 text-[#6e7485] sm:text-base">
                            Newest releases, ready when you are.
                          </p>
                        </div>
                        <div className="mt-10 grid gap-6 md:grid-cols-3">
                          {recentCourses.map((course) => (
                            <CourseCard key={course.id} course={course} />
                          ))}
                        </div>
                      </div>

                      <aside className="border border-[#e9eaf0] bg-white p-6 shadow-[0_12px_24px_rgba(29,32,38,0.08)]">
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#ff6636]">
                              Why learners choose DevForge
                            </p>
                            <h3 className="mt-2 text-2xl font-semibold">
                              Clear paths. Real progress.
                            </h3>
                          </div>
                          <div className="bg-[#f5f7fa] p-4">
                            <div className="flex items-end gap-3">
                              <span className="text-4xl font-semibold">
                                {publishedCourses.length}
                              </span>
                              <span className="pb-1 text-sm text-[#8c94a3]">
                                published courses
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-[#6e7485]">
                              Compare tracks, pick a goal, and start in minutes.
                            </p>
                          </div>
                          <div className="space-y-3 text-sm text-[#4e5566]">
                            <p className="inline-flex items-center gap-2">
                              <Sparkles className="size-4 text-[#23bd33]" />
                              {uniqueInstructors} vetted instructors
                            </p>
                            <p className="inline-flex items-center gap-2">
                              <Users className="size-4 text-[#564ffd]" />
                              {formatCompactNumber(totalEnrollments)}{" "}
                              enrollments and counting
                            </p>
                            <p className="inline-flex items-center gap-2">
                              <Clock3 className="size-4 text-[#ff6636]" />
                              New classes added regularly
                            </p>
                          </div>
                          <div className="grid gap-3 pt-2">
                            <Link
                              href="/courses"
                              className="inline-flex items-center justify-center bg-[#ff6636] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#e95a2b]"
                            >
                              Explore courses
                            </Link>
                            <Link
                              href="/my-courses"
                              className="inline-flex items-center justify-center border border-[#d7dae0] bg-white px-5 py-3 text-sm font-semibold text-[#1d2026] transition hover:border-[#ff6636] hover:text-[#ff6636]"
                            >
                              View my learning
                            </Link>
                          </div>
                        </div>
                      </aside>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>
        </section>
      </main>

      <MarketingPublicFooter />
    </div>
  );
}
