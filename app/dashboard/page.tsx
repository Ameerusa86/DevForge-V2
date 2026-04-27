"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  BookOpen,
  CalendarRange,
  CheckCircle2,
  Clock3,
  LayoutDashboard,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import {
  MarketingPublicFooter,
  MarketingPublicHeader,
} from "@/components/marketing/public-chrome";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { getProxiedImageUrl } from "@/lib/s3-utils";
import { toast } from "sonner";

interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  level: string;
  imageUrl: string | null;
  durationMinutes: number | null;
  lessons: { id: string }[];
  instructor: { name: string };
}

interface Enrollment {
  id: string;
  courseId: string;
  course: Course;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  enrolledAt: string;
}

interface RecentActivity {
  lessonId: string;
  completedAt: string;
  lesson: {
    id: string;
    title: string;
    course: {
      id: string;
      slug: string;
      title: string;
    };
  } | null;
}

interface DashboardData {
  stats: {
    totalEnrolled: number;
    inProgress: number;
    completed: number;
    totalLessonsCompleted: number;
  };
  enrollments: Enrollment[];
  recentActivity: RecentActivity[];
  recommendedCourses: Course[];
}

async function fetchDashboardData(): Promise<DashboardData> {
  const response = await fetch("/api/dashboard", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard");
  }

  return response.json();
}

function formatDuration(minutes: number | null) {
  if (!minutes) return "Self-paced";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) return `${remainingMinutes} min`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getProgressState(progress: number) {
  if (progress >= 100) {
    return {
      label: "Completed",
      className: "bg-primary text-primary-foreground",
    };
  }

  if (progress > 0) {
    return {
      label: "In Progress",
      className: "bg-primary/10 text-primary",
    };
  }

  return {
    label: "Ready to Start",
    className: "border border-border bg-card text-muted-foreground",
  };
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingPublicHeader activePath="/dashboard" showSearch={false} />
      {children}
      <MarketingPublicFooter />
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const shouldRedirectToLogin = !isPending && !session?.user;
  const firstName = session?.user?.name?.split(" ")[0] || "Learner";

  useEffect(() => {
    if (shouldRedirectToLogin) {
      router.replace("/login");
    }
  }, [router, shouldRedirectToLogin]);

  useEffect(() => {
    if (!session?.user?.id) return;

    const run = async () => {
      setLoading(true);
      try {
        const dashboardData = await fetchDashboardData();
        setData(dashboardData);
      } catch (error) {
        console.error("Failed to load dashboard:", error);
        toast.error("Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [session?.user?.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const dashboardData = await fetchDashboardData();
      setData(dashboardData);
      toast.success("Dashboard refreshed.");
    } catch (error) {
      console.error("Failed to refresh dashboard:", error);
      toast.error("Failed to refresh dashboard.");
    } finally {
      setRefreshing(false);
    }
  };

  const completionRate = useMemo(() => {
    if (!data?.stats.totalEnrolled) return 0;
    return Math.round((data.stats.completed / data.stats.totalEnrolled) * 100);
  }, [data]);

  const averageProgress = useMemo(() => {
    if (!data?.enrollments.length) return 0;
    const totalProgress = data.enrollments.reduce(
      (sum, enrollment) => sum + enrollment.progress,
      0,
    );
    return Math.round(totalProgress / data.enrollments.length);
  }, [data]);

  const activeEnrollments = useMemo(
    () =>
      data?.enrollments.filter((enrollment) => enrollment.progress < 100) ?? [],
    [data],
  );

  const readyToStartCount = useMemo(
    () =>
      activeEnrollments.filter((enrollment) => enrollment.progress === 0)
        .length,
    [activeEnrollments],
  );

  const nextFocus = useMemo(
    () =>
      activeEnrollments.find((enrollment) => enrollment.progress > 0) ??
      activeEnrollments[0] ??
      null,
    [activeEnrollments],
  );

  const validRecentActivity = useMemo(
    () =>
      data?.recentActivity.filter(
        (
          activity,
        ): activity is RecentActivity & {
          lesson: NonNullable<RecentActivity["lesson"]>;
        } => Boolean(activity.lesson),
      ) ?? [],
    [data],
  );

  const recentActivityPreview = useMemo(
    () => validRecentActivity.slice(0, 6),
    [validRecentActivity],
  );

  const resumeCourses = useMemo(
    () => activeEnrollments.slice(0, 3),
    [activeEnrollments],
  );

  const lastActivityLabel = recentActivityPreview[0]
    ? formatDate(recentActivityPreview[0].completedAt)
    : "No recent completions";

  if (shouldRedirectToLogin || isPending || loading) {
    return (
      <DashboardShell>
        <div className="mx-auto max-w-[1320px] px-4 py-12 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <Skeleton className="h-12 w-64 rounded-none" />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Skeleton className="h-32 rounded-none" />
              <Skeleton className="h-32 rounded-none" />
              <Skeleton className="h-32 rounded-none" />
              <Skeleton className="h-32 rounded-none" />
            </div>
            <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_360px]">
              <Skeleton className="h-[620px] rounded-none" />
              <Skeleton className="h-[620px] rounded-none" />
            </div>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (!data) {
    return (
      <DashboardShell>
        <div className="mx-auto flex min-h-[70vh] max-w-[1320px] items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="border border-border bg-card px-8 py-10 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Dashboard unavailable
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-foreground">
              The dashboard could not be loaded.
            </h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Try the request again. The page still reads from the live
              dashboard API.
            </p>
            <Button
              onClick={handleRefresh}
              className="mt-6 rounded-none bg-[#ff6636] px-6 py-3 text-sm font-semibold text-white hover:bg-[#e95a2b]"
            >
              Retry
            </Button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <main>
        <section className="border-b border-border bg-card">
          <div className="mx-auto max-w-[1320px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
            <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="max-w-[760px]">
                <Link
                  href="/my-courses"
                  className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-primary"
                >
                  <BookOpen className="size-4" />
                  Open full course manager
                </Link>

                <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Dashboard
                </p>
                <h1 className="mt-3 text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[3.4rem]">
                  Welcome back, {firstName}. Here is what matters next.
                </h1>
                <p className="mt-5 max-w-[700px] text-base leading-8 text-muted-foreground">
                  This page is now your summary hub: current focus, recent
                  lesson completions, and progress across every active path.
                  Course management stays on `/my-courses`.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="rounded-none border-border bg-background px-5 py-3 text-sm font-semibold text-foreground hover:border-primary hover:bg-muted hover:text-primary"
                  >
                    <RefreshCw
                      className={`mr-2 size-4 ${refreshing ? "animate-spin" : ""}`}
                    />
                    {refreshing ? "Refreshing" : "Refresh dashboard"}
                  </Button>
                  <Link
                    href="/my-courses"
                    className="inline-flex items-center justify-center bg-[#ff6636] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#e95a2b]"
                  >
                    Go to my courses
                  </Link>
                </div>
              </div>

              <div className="border border-border bg-card p-6 text-card-foreground">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Current focus
                </p>
                {nextFocus ? (
                  <>
                    <div className="mt-4 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-2xl font-semibold tracking-[-0.03em]">
                          {nextFocus.course.title}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-muted-foreground">
                          By {nextFocus.course.instructor.name}
                        </p>
                      </div>
                      <div className="flex size-12 items-center justify-center border border-border bg-muted/40">
                        <Target className="size-5" />
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                      <span className="border border-border bg-muted/40 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
                        {nextFocus.course.category}
                      </span>
                      <span className="border border-border bg-muted/40 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
                        {nextFocus.course.level}
                      </span>
                    </div>

                    <div className="mt-6">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {nextFocus.completedLessons}/{nextFocus.totalLessons}{" "}
                          lessons
                        </span>
                        <span className="font-semibold">
                          {nextFocus.progress}%
                        </span>
                      </div>
                      <div className="mt-3 h-2 bg-muted">
                        <div
                          className="h-full bg-[#ff6636]"
                          style={{ width: `${nextFocus.progress}%` }}
                        />
                      </div>
                    </div>

                    <Link
                      href={`/courses/${nextFocus.course.slug}`}
                      className="mt-6 inline-flex items-center justify-center bg-[#ff6636] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#e95a2b]"
                    >
                      Open focus course
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="mt-4 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-2xl font-semibold tracking-[-0.03em]">
                          No active path yet
                        </p>
                        <p className="mt-2 text-sm leading-7 text-muted-foreground">
                          Browse the catalog and enroll in a course. Your
                          summary dashboard will start here.
                        </p>
                      </div>
                      <div className="flex size-12 items-center justify-center border border-border bg-muted/40">
                        <LayoutDashboard className="size-5" />
                      </div>
                    </div>

                    <Link
                      href="/courses"
                      className="mt-6 inline-flex items-center justify-center bg-[#ff6636] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#e95a2b]"
                    >
                      Browse courses
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="border border-border bg-muted/35 p-5">
                <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <LayoutDashboard className="size-3.5 text-[#ff6636]" />
                  Active Paths
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-foreground">
                  {data.stats.totalEnrolled}
                </p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  Total courses currently attached to your account.
                </p>
              </div>
              <div className="border border-border bg-muted/35 p-5">
                <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <TrendingUp className="size-3.5 text-[#ff6636]" />
                  Moving Now
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-foreground">
                  {data.stats.inProgress}
                </p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  Courses where progress has already started.
                </p>
              </div>
              <div className="border border-border bg-muted/35 p-5">
                <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <Sparkles className="size-3.5 text-[#ff6636]" />
                  Ready To Start
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-foreground">
                  {readyToStartCount}
                </p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  Enrolled paths that have not started yet.
                </p>
              </div>
              <div className="border border-border bg-muted/35 p-5">
                <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <Activity className="size-3.5 text-[#ff6636]" />
                  Lessons Done
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-foreground">
                  {data.stats.totalLessonsCompleted}
                </p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  Lesson completions recorded by the API.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1320px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          {data.enrollments.length === 0 &&
          recentActivityPreview.length === 0 ? (
            <div className="border border-dashed border-border bg-card px-8 py-14 text-center">
              <div className="mx-auto flex size-14 items-center justify-center bg-primary/10 text-primary">
                <BookOpen className="size-6" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                No learning activity yet
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Enroll in a course and the dashboard will start filling with
                focus items, activity history, and progress summaries.
              </p>
              <Link
                href="/courses"
                className="mt-6 inline-flex items-center justify-center bg-[#ff6636] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#e95a2b]"
              >
                Explore courses
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_380px]">
              <div className="space-y-6">
                {resumeCourses.length > 0 ? (
                  <section className="border border-border bg-card p-6 sm:p-8">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Resume learning
                        </p>
                        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-foreground">
                          Your next actions, not every course action.
                        </h2>
                      </div>
                      <Link
                        href="/my-courses"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary/85"
                      >
                        Open my courses
                        <ArrowRight className="size-4" />
                      </Link>
                    </div>

                    <div className="mt-8 space-y-4">
                      {resumeCourses.map((enrollment) => {
                        const course = enrollment.course;
                        const imageUrl = course.imageUrl
                          ? getProxiedImageUrl(course.imageUrl)
                          : null;
                        const progressState = getProgressState(
                          enrollment.progress,
                        );

                        return (
                          <article
                            key={enrollment.id}
                            className="grid gap-4 border border-border bg-muted/35 p-4 lg:grid-cols-[160px_minmax(0,1fr)_auto] lg:items-center"
                          >
                            <div className="relative h-28 overflow-hidden border border-border bg-[#1d2026]">
                              {imageUrl ? (
                                <Image
                                  src={imageUrl}
                                  alt={course.title}
                                  fill
                                  sizes="160px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="absolute inset-0 bg-[linear-gradient(135deg,#ff8f6a_0%,#ff6636_45%,#1d2026_100%)]" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="bg-primary/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                                  {course.category}
                                </span>
                                <span className="border border-border bg-card px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                  {course.level}
                                </span>
                                <span
                                  className={`px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] ${progressState.className}`}
                                >
                                  {progressState.label}
                                </span>
                              </div>

                              <h3 className="mt-4 text-xl font-semibold leading-tight text-foreground">
                                {course.title}
                              </h3>
                              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                                By {course.instructor.name}
                              </p>

                              <div className="mt-4">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">
                                    {enrollment.completedLessons}/
                                    {enrollment.totalLessons} lessons completed
                                  </span>
                                  <span className="font-semibold text-foreground">
                                    {enrollment.progress}%
                                  </span>
                                </div>
                                <Progress
                                  value={enrollment.progress}
                                  className="mt-3 h-2 bg-muted"
                                />
                              </div>

                              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                <span className="inline-flex items-center gap-2">
                                  <CalendarRange className="size-4 text-[#ff6636]" />
                                  Added {formatDate(enrollment.enrolledAt)}
                                </span>
                                <span className="inline-flex items-center gap-2">
                                  <Clock3 className="size-4 text-[#ff6636]" />
                                  {formatDuration(course.durationMinutes)}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-3">
                              <Link
                                href={`/courses/${course.slug}`}
                                className="inline-flex items-center justify-center bg-[#ff6636] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#e95a2b]"
                              >
                                Open course
                              </Link>
                              <Link
                                href="/my-courses"
                                className="inline-flex items-center justify-center border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-muted hover:text-primary"
                              >
                                Manage path
                              </Link>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                ) : null}

                {recentActivityPreview.length > 0 ? (
                  <section className="border border-border bg-card p-6 sm:p-8">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Recent activity
                      </p>
                      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-foreground">
                        Lesson completions in timeline form.
                      </h2>
                    </div>

                    <div className="mt-8 space-y-4">
                      {recentActivityPreview.map((activity) => (
                        <Link
                          key={`${activity.lessonId}-${activity.completedAt}`}
                          href={`/courses/${activity.lesson.course.slug}`}
                          className="block border border-border bg-muted/35 p-5 transition hover:border-primary hover:bg-muted"
                        >
                          <div className="grid gap-4 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-start">
                            <div className="flex size-12 items-center justify-center bg-card text-primary">
                              <CheckCircle2 className="size-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-base font-semibold text-foreground">
                                {activity.lesson.title}
                              </p>
                              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                                {activity.lesson.course.title}
                              </p>
                            </div>
                            <span className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
                              <Clock3 className="size-4 text-[#ff6636]" />
                              {formatDate(activity.completedAt)}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                ) : null}

                <section className="border border-border bg-card p-6 sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Progress map
                      </p>
                      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-foreground">
                        Every enrolled path, one compact list.
                      </h2>
                    </div>
                    <Link
                      href="/my-courses"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary/85"
                    >
                      Full course actions
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>

                  <div className="mt-8 space-y-4">
                    {data.enrollments.map((enrollment) => {
                      const state = getProgressState(enrollment.progress);

                      return (
                        <article
                          key={enrollment.id}
                          className="border border-border bg-muted/35 p-5"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="min-w-0">
                              <Link
                                href={`/courses/${enrollment.course.slug}`}
                                className="text-lg font-semibold text-foreground transition hover:text-primary"
                              >
                                {enrollment.course.title}
                              </Link>
                              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                                By {enrollment.course.instructor.name} ·{" "}
                                {enrollment.completedLessons}/
                                {enrollment.totalLessons} lessons
                              </p>
                            </div>
                            <span
                              className={`px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] ${state.className}`}
                            >
                              {state.label}
                            </span>
                          </div>

                          <div className="mt-5">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                Completion
                              </span>
                              <span className="font-semibold text-foreground">
                                {enrollment.progress}%
                              </span>
                            </div>
                            <Progress
                              value={enrollment.progress}
                              className="mt-3 h-2 bg-muted"
                            />
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                <div className="border border-border bg-card p-6 text-card-foreground">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Learning overview
                  </p>
                  <div className="mt-4 flex items-end gap-3">
                    <span className="text-[52px] font-semibold leading-none tracking-[-0.05em]">
                      {averageProgress}%
                    </span>
                    <span className="pb-1 text-sm font-medium text-muted-foreground">
                      average progress
                    </span>
                  </div>
                  <div className="mt-6 space-y-5">
                    <div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Average progress
                        </span>
                        <span className="font-semibold">
                          {averageProgress}%
                        </span>
                      </div>
                      <div className="mt-3 h-2 bg-muted">
                        <div
                          className="h-full bg-[#ff6636]"
                          style={{ width: `${averageProgress}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Completion rate
                        </span>
                        <span className="font-semibold">{completionRate}%</span>
                      </div>
                      <div className="mt-3 h-2 bg-muted">
                        <div
                          className="h-full bg-foreground"
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4 border-t border-border pt-5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Last activity
                      </span>
                      <span className="font-semibold">{lastActivityLabel}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Completed courses
                      </span>
                      <span className="font-semibold">
                        {data.stats.completed}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Not started yet
                      </span>
                      <span className="font-semibold">{readyToStartCount}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-border bg-card p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Quick links
                  </p>
                  <div className="mt-5 grid gap-3">
                    <Link
                      href="/my-courses"
                      className="inline-flex items-center justify-between border border-border bg-muted/35 px-4 py-4 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-muted hover:text-primary"
                    >
                      Open my courses
                      <ArrowRight className="size-4" />
                    </Link>
                    <Link
                      href="/profile"
                      className="inline-flex items-center justify-between border border-border bg-muted/35 px-4 py-4 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-muted hover:text-primary"
                    >
                      Profile settings
                      <ArrowRight className="size-4" />
                    </Link>
                    <Link
                      href="/courses"
                      className="inline-flex items-center justify-between border border-border bg-muted/35 px-4 py-4 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-muted hover:text-primary"
                    >
                      Browse catalog
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </div>

                {data.recommendedCourses.length > 0 ? (
                  <div className="border border-border bg-card p-6">
                    <div className="flex items-start gap-3">
                      <div className="flex size-12 items-center justify-center bg-primary/10 text-primary">
                        <Sparkles className="size-5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Recommended next
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                          Explore something outside your current queue.
                        </h2>
                      </div>
                    </div>

                    <div className="mt-6 space-y-4">
                      {data.recommendedCourses.slice(0, 3).map((course) => {
                        const imageUrl = course.imageUrl
                          ? getProxiedImageUrl(course.imageUrl)
                          : null;

                        return (
                          <Link
                            key={course.id}
                            href={`/courses/${course.slug}`}
                            className="grid gap-4 border border-border bg-muted/35 p-4 sm:grid-cols-[96px_minmax(0,1fr)] transition hover:border-primary hover:bg-muted"
                          >
                            <div className="relative h-24 overflow-hidden border border-border bg-[#1d2026]">
                              {imageUrl ? (
                                <Image
                                  src={imageUrl}
                                  alt={course.title}
                                  fill
                                  sizes="96px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="absolute inset-0 bg-[linear-gradient(135deg,#ff8f6a_0%,#ff6636_45%,#1d2026_100%)]" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap gap-2">
                                <span className="bg-primary/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                                  {course.category}
                                </span>
                                <span className="border border-border bg-card px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                  {course.level}
                                </span>
                              </div>
                              <h3 className="mt-3 text-lg font-semibold leading-tight text-foreground">
                                {course.title}
                              </h3>
                              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                                By {course.instructor.name}
                              </p>
                              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                <span className="inline-flex items-center gap-2">
                                  <BookOpen className="size-4 text-[#ff6636]" />
                                  {course.lessons.length} lessons
                                </span>
                                <span className="inline-flex items-center gap-2">
                                  <Clock3 className="size-4 text-[#ff6636]" />
                                  {formatDuration(course.durationMinutes)}
                                </span>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </section>
      </main>
    </DashboardShell>
  );
}
