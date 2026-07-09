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
  Bookmark,
  ChevronRight,
  Zap,
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
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── API helpers ──────────────────────────────────────────────────────────────

async function fetchDashboardData(): Promise<DashboardData> {
  const response = await fetch("/api/dashboard", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to fetch dashboard");
  }
  return response.json();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(minutes: number | null) {
  if (!minutes) return "Self-paced";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) return `${remainingMinutes}m`;
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
      className: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-500",
    };
  }

  if (progress > 0) {
    return {
      label: "In Progress",
      className: "bg-[#ff6636]/10 text-[#ff6636]",
    };
  }

  return {
    label: "Ready",
    className: "bg-muted text-muted-foreground/80",
  };
}

const levelColors: Record<string, string> = {
  BEGINNER:     "bg-emerald-500/10 text-emerald-600",
  INTERMEDIATE: "bg-amber-500/10 text-amber-600",
  ADVANCED:     "bg-red-500/10 text-red-600",
};

// ─── Dashboard layout shell ───────────────────────────────────────────────────

function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <MarketingPublicHeader activePath="/dashboard" showSearch={false} />
      {children}
      <MarketingPublicFooter />
    </div>
  );
}

// ─── Main page component ──────────────────────────────────────────────────────

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
    () => data?.enrollments.filter((enrollment) => enrollment.progress < 100) ?? [],
    [data],
  );

  const readyToStartCount = useMemo(
    () => activeEnrollments.filter((enrollment) => enrollment.progress === 0).length,
    [activeEnrollments],
  );

  const nextFocus = useMemo(
    () => activeEnrollments.find((enrollment) => enrollment.progress > 0) ?? activeEnrollments[0] ?? null,
    [activeEnrollments],
  );

  const validRecentActivity = useMemo(
    () =>
      data?.recentActivity.filter(
        (activity): activity is RecentActivity & { lesson: NonNullable<RecentActivity["lesson"]> } =>
          Boolean(activity.lesson),
      ) ?? [],
    [data],
  );

  const recentActivityPreview = useMemo(() => validRecentActivity.slice(0, 5), [validRecentActivity]);
  const resumeCourses = useMemo(() => activeEnrollments.slice(0, 3), [activeEnrollments]);

  const lastActivityLabel = recentActivityPreview[0]
    ? formatDate(recentActivityPreview[0].completedAt)
    : "No recent completions";

  if (shouldRedirectToLogin || isPending || loading) {
    return (
      <DashboardShell>
        <div className="mx-auto max-w-[1320px] px-4 py-12 sm:px-6 lg:px-8 space-y-8">
          <Skeleton className="h-10 w-64 rounded-2xl" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <Skeleton className="h-[500px] rounded-2xl" />
            <Skeleton className="h-[500px] rounded-2xl" />
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (!data) {
    return (
      <DashboardShell>
        <div className="mx-auto flex min-h-[70vh] max-w-[1320px] items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border bg-card p-10 text-center max-w-md shadow-sm">
            <LayoutDashboard className="size-12 text-muted-foreground/40 mx-auto mb-4" />
            <h1 className="text-xl font-extrabold text-foreground">
              Dashboard unavailable
            </h1>
            <p className="mt-2 text-sm text-muted-foreground font-semibold leading-relaxed">
              We couldn't load your dashboard stats at this moment. Please check your connection or try again.
            </p>
            <Button
              onClick={handleRefresh}
              className="mt-6 rounded-xl bg-[#ff6636] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#e95a2b]"
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
        {/* ── Hero section & Current Focus ──────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-border/40 bg-[#fff9f7] dark:bg-[#111318] py-10 lg:py-14">
          <div className="pointer-events-none absolute -top-40 right-0 size-[500px] rounded-full bg-[#ff6636]/5 blur-3xl" />
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 relative">
            <div className="grid gap-8 lg:grid-cols-[1fr_380px] items-start">
              
              {/* Left Column: Heading & Buttons */}
              <div className="space-y-5">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#ff6636]/30 bg-[#ff6636]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-[#ff6636]">
                  <LayoutDashboard className="size-3.5" /> Summary Hub
                </span>
                <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
                  Welcome back, {firstName} 👋
                </h1>
                <p className="text-sm font-semibold text-muted-foreground leading-relaxed max-w-xl">
                  This is your summary hub. Jump back into lessons, track completions, and manage your active paths from here. Course detail actions live on `/my-courses`.
                </p>

                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] disabled:opacity-60 transition-all duration-200"
                  >
                    <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
                    {refreshing ? "Refreshing…" : "Refresh"}
                  </button>
                  <Link
                    href="/my-courses"
                    className="flex items-center gap-2 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors duration-200 shadow-md shadow-[#ff6636]/10"
                  >
                    <BookOpen className="size-4" /> Go to My Courses
                  </Link>
                </div>
              </div>

              {/* Right Column: Current Focus Widget */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4 border-b border-border/50 pb-3">
                  <Target className="size-4 text-[#ff6636]" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Current Focus
                  </p>
                </div>

                {nextFocus ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-foreground line-clamp-1">
                        {nextFocus.course.title}
                      </h3>
                      <p className="text-xs font-semibold text-muted-foreground mt-1">
                        By {nextFocus.course.instructor.name}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                        {nextFocus.course.category}
                      </span>
                      {nextFocus.course.level && (
                        <span className={cn(
                          "rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                          levelColors[nextFocus.course.level.toUpperCase()] ?? "bg-muted text-muted-foreground"
                        )}>
                          {nextFocus.course.level}
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[10px] font-semibold">
                        <span className="text-muted-foreground">
                          {nextFocus.completedLessons}/{nextFocus.totalLessons} lessons
                        </span>
                        <span className="text-[#ff6636] font-bold">{nextFocus.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-[#ff6636] rounded-full transition-all duration-700"
                          style={{ width: `${nextFocus.progress}%` }}
                        />
                      </div>
                    </div>

                    <Link
                      href={`/courses/${nextFocus.course.slug}`}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] py-2.5 text-xs font-extrabold uppercase tracking-wider text-white transition-colors"
                    >
                      Resume Focus Course <ChevronRight className="size-4" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4 text-center py-2">
                    <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                      No active path yet. Explore the catalog and pick a course to begin tracking focus progress.
                    </p>
                    <Link
                      href="/courses"
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-card hover:border-[#ff6636]/50 hover:bg-[#ff6636]/5 hover:text-[#ff6636] py-2.5 text-xs font-bold uppercase tracking-wider text-foreground transition-all duration-200"
                    >
                      Browse Catalog
                    </Link>
                  </div>
                )}
              </div>

            </div>

            {/* ── Stat strip ────────────────────────────────────────────────── */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Active Paths", value: data.stats.totalEnrolled.toString(), icon: Bookmark, color: "text-[#ff6636]", bg: "bg-[#ff6636]/10", desc: "Total enrolled courses" },
                { label: "Moving Now", value: data.stats.inProgress.toString(), icon: TrendingUp, color: "text-violet-500", bg: "bg-violet-500/10", desc: "Courses already started" },
                { label: "Ready To Start", value: readyToStartCount.toString(), icon: Sparkles, color: "text-amber-500", bg: "bg-amber-500/10", desc: "Courses not yet started" },
                { label: "Lessons Done", value: data.stats.totalLessonsCompleted.toString(), icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", desc: "Completions recorded" },
              ].map((stat) => {
                const SIcon = stat.icon;
                return (
                  <div key={stat.label} className="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4">
                    <div className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${stat.bg} ${stat.color}`}>
                      <SIcon className="size-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-extrabold tracking-tight text-foreground">{stat.value}</p>
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{stat.label}</p>
                      <p className="text-[10px] font-semibold text-muted-foreground/70 mt-0.5">{stat.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* ── Main content grid ─────────────────────────────────────────────── */}
        <section className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 py-12">
          {data.enrollments.length === 0 && recentActivityPreview.length === 0 ? (
            /* Empty state */
            <div className="flex min-h-[26rem] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-8 py-16 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-[#ff6636]/10 text-[#ff6636] mb-5">
                <BookOpen className="size-8" />
              </div>
              <h2 className="text-xl font-extrabold text-foreground">No learning activity yet</h2>
              <p className="mt-2 max-w-sm text-sm font-semibold text-muted-foreground leading-relaxed">
                Start your journey by exploring the catalog and enrolling in a path. Your summaries will display here.
              </p>
              <Link
                href="/courses"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] px-6 py-2.5 text-sm font-bold text-white transition-colors duration-200"
              >
                Explore Courses
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_360px] items-start">
              
              {/* Left Column: Learning sections */}
              <div className="space-y-8">
                
                {/* Resume learning */}
                {resumeCourses.length > 0 && (
                  <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                    <div className="flex items-center justify-between gap-4 mb-6 border-b border-border/50 pb-5">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                          Resume Learning
                        </p>
                        <h2 className="text-lg font-extrabold text-foreground mt-0.5">
                          Enrolled active paths
                        </h2>
                      </div>
                      <Link
                        href="/my-courses"
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#ff6636] hover:text-[#e95a2b] transition-colors"
                      >
                        All Paths <ArrowRight className="size-3.5" />
                      </Link>
                    </div>

                    <div className="space-y-4">
                      {resumeCourses.map((enrollment) => {
                        const course = enrollment.course;
                        const imageUrl = course.imageUrl ? getProxiedImageUrl(course.imageUrl) : null;
                        const state = getProgressState(enrollment.progress);
                        const lvlKey = course.level?.toUpperCase();

                        return (
                          <article
                            key={enrollment.id}
                            className="group grid gap-4 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-[120px_minmax(0,1fr)_auto] sm:items-center hover:bg-muted/40 transition-colors"
                          >
                            {/* Thumbnail */}
                            <div className="relative h-20 w-full sm:w-auto overflow-hidden rounded-lg bg-[#1d2026] shrink-0 border border-border/60">
                              {imageUrl ? (
                                <Image
                                  src={imageUrl}
                                  alt={course.title}
                                  fill
                                  unoptimized
                                  sizes="120px"
                                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                              ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-[#ff8f6a] via-[#ff6636] to-[#1d2026]" />
                              )}
                            </div>

                            {/* Info */}
                            <div className="min-w-0 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                                  {course.category}
                                </span>
                                {lvlKey && levelColors[lvlKey] && (
                                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${levelColors[lvlKey]}`}>
                                    {course.level}
                                  </span>
                                )}
                                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${state.className}`}>
                                  {state.label}
                                </span>
                              </div>

                              <h3 className="text-sm font-bold text-foreground leading-snug truncate group-hover:text-[#ff6636] transition-colors">
                                {course.title}
                              </h3>

                              <p className="text-[11px] font-semibold text-muted-foreground leading-none">
                                By {course.instructor.name} · {formatDuration(course.durationMinutes)}
                              </p>

                              {/* Progress bar */}
                              <div className="space-y-1 pt-1 max-w-md">
                                <div className="flex items-center justify-between text-[10px] font-semibold">
                                  <span className="text-muted-foreground">{enrollment.completedLessons}/{enrollment.totalLessons} lessons</span>
                                  <span className="text-foreground">{enrollment.progress}%</span>
                                </div>
                                <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                                  <div className="h-full bg-[#ff6636] rounded-full" style={{ width: `${enrollment.progress}%` }} />
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex sm:flex-col gap-2 shrink-0 pt-2 sm:pt-0">
                              <Link
                                href={`/courses/${course.slug}`}
                                className="flex-1 sm:flex-initial rounded-lg bg-[#ff6636] hover:bg-[#e95a2b] text-white text-[10px] font-extrabold uppercase tracking-wider px-3.5 py-2 text-center transition-colors"
                              >
                                Resume
                              </Link>
                              <Link
                                href="/my-courses"
                                className="flex-1 sm:flex-initial rounded-lg border border-border bg-card text-foreground hover:border-[#ff6636]/50 hover:text-[#ff6636] text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 text-center transition-all"
                              >
                                Manage
                              </Link>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Timeline activity */}
                {recentActivityPreview.length > 0 && (
                  <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                    <div className="mb-6 border-b border-border/50 pb-5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                        Recent Activity
                      </p>
                      <h2 className="text-lg font-extrabold text-foreground mt-0.5">
                        Completed lessons timeline
                      </h2>
                    </div>

                    <div className="space-y-4">
                      {recentActivityPreview.map((activity) => (
                        <Link
                          key={`${activity.lessonId}-${activity.completedAt}`}
                          href={`/courses/${activity.lesson!.course.slug}`}
                          className="block rounded-xl border border-border bg-muted/20 p-4 hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                              <CheckCircle2 className="size-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-foreground leading-snug truncate">
                                {activity.lesson!.title}
                              </p>
                              <p className="text-[10px] font-semibold text-muted-foreground mt-1 truncate">
                                {activity.lesson!.course.title}
                              </p>
                            </div>
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground shrink-0">
                              <Clock3 className="size-3 text-[#ff6636]" />
                              {formatDate(activity.completedAt)}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {/* Progress Map (compact list) */}
                <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                  <div className="flex items-center justify-between gap-4 mb-6 border-b border-border/50 pb-5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                        Progress Map
                      </p>
                      <h2 className="text-lg font-extrabold text-foreground mt-0.5">
                        Compact status tracking
                      </h2>
                    </div>
                    <Link
                      href="/my-courses"
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#ff6636] hover:text-[#e95a2b] transition-colors"
                    >
                      Full Actions <ArrowRight className="size-3.5" />
                    </Link>
                  </div>

                  <div className="space-y-4">
                    {data.enrollments.map((enrollment) => {
                      const state = getProgressState(enrollment.progress);
                      return (
                        <div
                          key={enrollment.id}
                          className="rounded-xl border border-border bg-muted/20 p-4 space-y-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="min-w-0">
                              <Link
                                href={`/courses/${enrollment.course.slug}`}
                                className="text-xs font-bold text-foreground hover:text-[#ff6636] transition-colors"
                              >
                                {enrollment.course.title}
                              </Link>
                              <p className="text-[10px] font-semibold text-muted-foreground mt-1">
                                By {enrollment.course.instructor.name} · {enrollment.completedLessons}/{enrollment.totalLessons} lessons
                              </p>
                            </div>
                            <span className={cn("rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider", state.className)}>
                              {state.label}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-semibold">
                              <span className="text-muted-foreground">Completion</span>
                              <span className="text-foreground">{enrollment.progress}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-[#ff6636] rounded-full" style={{ width: `${enrollment.progress}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

              </div>

              {/* Right Column: Statistics & Links */}
              <div className="space-y-6">
                
                {/* Stats block */}
                <div className="rounded-2xl border border-border bg-card p-6 space-y-6 shadow-sm">
                  <div className="border-b border-border/50 pb-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      Learning Overview
                    </p>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold tracking-tight text-foreground">
                      {averageProgress}%
                    </span>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      average progress
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase text-muted-foreground">
                        <span>Average progress</span>
                        <span className="text-foreground">{averageProgress}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-[#ff6636] rounded-full" style={{ width: `${averageProgress}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase text-muted-foreground">
                        <span>Completion rate</span>
                        <span className="text-foreground">{completionRate}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-foreground rounded-full" style={{ width: `${completionRate}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border/50 pt-4 space-y-3 text-[11px] font-semibold text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Last activity</span>
                      <span className="text-foreground font-bold">{lastActivityLabel}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Completed courses</span>
                      <span className="text-foreground font-bold">{data.stats.completed}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Not started yet</span>
                      <span className="text-foreground font-bold">{readyToStartCount}</span>
                    </div>
                  </div>
                </div>

                {/* Quick links */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="border-b border-border/50 pb-3 mb-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      Quick Links
                    </p>
                  </div>

                  <div className="grid gap-2">
                    {[
                      { label: "Open my courses", href: "/my-courses" },
                      { label: "Profile settings", href: "/profile" },
                      { label: "Browse catalog", href: "/courses" },
                    ].map((link) => (
                      <Link
                        key={link.label}
                        href={link.href}
                        className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3 text-xs font-bold text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] hover:bg-[#ff6636]/5 transition-all"
                      >
                        {link.label}
                        <ArrowRight className="size-3.5" />
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Recommended courses */}
                {data.recommendedCourses.length > 0 && (
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 border-b border-border/50 pb-3">
                      <Sparkles className="size-4 text-[#ff6636]" />
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                        Recommended Next
                      </p>
                    </div>

                    <div className="space-y-4">
                      {data.recommendedCourses.slice(0, 3).map((course) => {
                        const imageUrl = course.imageUrl ? getProxiedImageUrl(course.imageUrl) : null;
                        return (
                          <Link
                            key={course.id}
                            href={`/courses/${course.slug}`}
                            className="group grid gap-3 rounded-xl border border-border bg-muted/20 p-3 grid-cols-[80px_minmax(0,1fr)] hover:bg-muted/40 transition-colors"
                          >
                            {/* Thumbnail */}
                            <div className="relative h-16 w-20 overflow-hidden rounded-lg bg-[#1d2026] border border-border/60">
                              {imageUrl ? (
                                <Image
                                  src={imageUrl}
                                  alt={course.title}
                                  fill
                                  unoptimized
                                  sizes="80px"
                                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                              ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-[#ff8f6a] via-[#ff6636] to-[#1d2026]" />
                              )}
                            </div>

                            <div className="min-w-0 space-y-1">
                              <h4 className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-[#ff6636] transition-colors leading-snug">
                                {course.title}
                              </h4>
                              <p className="text-[10px] font-semibold text-muted-foreground">
                                By {course.instructor.name}
                              </p>
                              <div className="flex items-center gap-2.5 text-[9px] font-semibold text-muted-foreground/80">
                                <span className="flex items-center gap-0.5"><BookOpen className="size-3" />{course.lessons.length}</span>
                                <span className="flex items-center gap-0.5"><Clock3 className="size-3" />{formatDuration(course.durationMinutes)}</span>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>

            </div>
          )}
        </section>
      </main>
    </DashboardShell>
  );
}
