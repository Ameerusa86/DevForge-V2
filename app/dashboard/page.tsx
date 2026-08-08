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
  ChevronRight,
  Flame,
  Award,
  PlayCircle,
  Compass,
} from "lucide-react";

import { LearnerShell } from "@/components/lms/learner-shell";
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
      className: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20",
    };
  }

  if (progress > 0) {
    return {
      label: "In Progress",
      className: "bg-[#ff6636]/10 text-[#ff6636] border border-[#ff6636]/20",
    };
  }

  return {
    label: "Ready to Start",
    className: "bg-muted text-muted-foreground border border-border",
  };
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

  const activeEnrollments = useMemo(
    () => data?.enrollments.filter((enrollment) => enrollment.progress < 100) ?? [],
    [data]
  );

  const nextFocus = useMemo(
    () => activeEnrollments.find((enrollment) => enrollment.progress > 0) ?? activeEnrollments[0] ?? null,
    [activeEnrollments]
  );

  const validRecentActivity = useMemo(
    () =>
      data?.recentActivity.filter(
        (activity): activity is RecentActivity & { lesson: NonNullable<RecentActivity["lesson"]> } =>
          Boolean(activity.lesson)
      ) ?? [],
    [data]
  );

  const recentActivityPreview = useMemo(() => validRecentActivity.slice(0, 5), [validRecentActivity]);

  if (shouldRedirectToLogin || isPending || loading) {
    return (
      <LearnerShell pageTitle="Learner Dashboard" pageDescription="Loading your developer workspace...">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-96 rounded-2xl lg:col-span-2" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        </div>
      </LearnerShell>
    );
  }

  if (!data) {
    return (
      <LearnerShell pageTitle="Learner Dashboard">
        <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center px-4">
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm w-full">
            <LayoutDashboard className="size-12 text-muted-foreground/40 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground">Dashboard unavailable</h2>
            <p className="mt-2 text-sm text-muted-foreground font-medium">
              We couldn&apos;t load your dashboard stats at this moment.
            </p>
            <Button
              onClick={handleRefresh}
              className="mt-6 rounded-xl bg-[#ff6636] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#e95a2b]"
            >
              Retry
            </Button>
          </div>
        </div>
      </LearnerShell>
    );
  }

  return (
    <LearnerShell
      pageTitle="Learner Dashboard"
      pageDescription="Track your progress, daily goals, and resume your coding paths"
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 space-y-8">
        
        {/* ── 1. Hero Resume Banner (Bento Top) ─────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/40 p-6 sm:p-8 shadow-sm">
          <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-[#ff6636]/10 blur-3xl" />
          <div className="pointer-events-none absolute right-1/3 -bottom-20 size-60 rounded-full bg-primary/10 blur-3xl" />

          <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-center relative z-10">
            {/* Welcome & Info */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ff6636]/30 bg-[#ff6636]/10 px-3 py-1 text-xs font-bold text-[#ff6636] uppercase tracking-wider">
                  <Sparkles className="size-3.5" /> Workspace Active
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-semibold text-muted-foreground">
                  <CalendarRange className="size-3.5" /> {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  Welcome back, {firstName} 👋
                </h2>
                <p className="mt-1 text-sm text-muted-foreground font-medium max-w-xl leading-relaxed">
                  {nextFocus
                    ? `You're currently making great progress in "${nextFocus.course.title}". Pick up right where you left off!`
                    : "Explore our developer courses to start building production-ready apps."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                {nextFocus ? (
                  <Link
                    href={`/courses/${nextFocus.course.slug}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-[#ff6636]/20 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <PlayCircle className="size-4" /> Resume Learning
                  </Link>
                ) : (
                  <Link
                    href="/courses"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-[#ff6636]/20 transition-all"
                  >
                    <Compass className="size-4" /> Browse Catalog
                  </Link>
                )}

                <Link
                  href="/my-courses"
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/80 hover:bg-muted px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground transition-colors"
                >
                  <BookOpen className="size-4 text-muted-foreground" /> View All Enrolled ({data.stats.totalEnrolled})
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className={cn("size-3.5 mr-1.5", refreshing && "animate-spin")} />
                  {refreshing ? "Updating..." : "Refresh"}
                </Button>
              </div>
            </div>

            {/* Quick Resume Card (Right Box) */}
            {nextFocus ? (
              <div className="rounded-2xl border border-border bg-card/90 p-5 backdrop-blur-sm shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="size-4 text-[#ff6636]" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Active Path Focus
                    </span>
                  </div>
                  <span className="rounded-full bg-[#ff6636]/10 px-2.5 py-0.5 text-[9px] font-bold uppercase text-[#ff6636]">
                    {nextFocus.course.category}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-foreground line-clamp-1">
                    {nextFocus.course.title}
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">
                    {nextFocus.completedLessons} of {nextFocus.totalLessons} lessons completed
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-muted-foreground">Course Progress</span>
                    <span className="text-[#ff6636]">{nextFocus.progress}%</span>
                  </div>
                  <Progress value={nextFocus.progress} className="h-2 rounded-full" />
                </div>

                <Link
                  href={`/courses/${nextFocus.course.slug}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-muted hover:bg-muted/80 hover:text-[#ff6636] py-2 text-xs font-bold text-foreground transition-colors"
                >
                  Continue Course <ChevronRight className="size-4" />
                </Link>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center space-y-3">
                <Compass className="size-8 text-muted-foreground/50 mx-auto" />
                <p className="text-xs font-semibold text-muted-foreground">
                  No active courses yet. Find your first path today!
                </p>
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ff6636] hover:underline"
                >
                  Explore Catalog <ArrowRight className="size-3.5" />
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ── 2. Bento Stats & Daily Goal Grid ─────────────────────────────────── */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Stat 1: In Progress */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs hover:border-[#ff6636]/30 transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                In Progress
              </span>
              <div className="flex size-9 items-center justify-center rounded-xl bg-[#ff6636]/10 text-[#ff6636]">
                <Clock3 className="size-4.5" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-foreground tracking-tight">
              {data.stats.inProgress}
            </p>
            <p className="mt-1 text-xs text-muted-foreground font-medium">
              Active learning paths
            </p>
          </div>

          {/* Stat 2: Lessons Completed */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs hover:border-emerald-500/30 transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Lessons Finished
              </span>
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4.5" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-foreground tracking-tight">
              {data.stats.totalLessonsCompleted}
            </p>
            <p className="mt-1 text-xs text-muted-foreground font-medium">
              Completed modules & lessons
            </p>
          </div>

          {/* Stat 3: Completed Courses */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs hover:border-primary/30 transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Graduated
              </span>
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Award className="size-4.5" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-foreground tracking-tight">
              {data.stats.completed}
            </p>
            <p className="mt-1 text-xs text-muted-foreground font-medium">
              100% course completions
            </p>
          </div>

          {/* Stat 4: Daily Goal & Streak */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs hover:border-amber-500/30 transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Study Streak
              </span>
              <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Flame className="size-4.5" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-1.5">
              5 <span className="text-base font-bold text-muted-foreground">Days</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground font-medium">
              Target: 30m / day 🔥
            </p>
          </div>
        </section>

        {/* ── 3. Main Workspace Bento Split: Active Courses & Timeline ─────────── */}
        <div className="grid gap-8 lg:grid-cols-3">
          
          {/* Left 2 Cols: Active Enrollments */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-foreground">
                  Active Enrollments
                </h3>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  Continue your current syllabus modules
                </p>
              </div>
              <Link
                href="/my-courses"
                className="text-xs font-bold text-[#ff6636] hover:underline flex items-center gap-1"
              >
                View all <ChevronRight className="size-3.5" />
              </Link>
            </div>

            {data.enrollments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center space-y-4">
                <BookOpen className="size-10 text-muted-foreground/40 mx-auto" />
                <h4 className="text-base font-bold text-foreground">No enrollments yet</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto font-medium leading-relaxed">
                  You haven&apos;t enrolled in any courses yet. Browse our comprehensive developer catalog to get started.
                </p>
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#ff6636] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#e95a2b] transition-colors"
                >
                  Browse Catalog
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {data.enrollments.map((enrollment) => {
                  const state = getProgressState(enrollment.progress);
                  const imageUrl = getProxiedImageUrl(enrollment.course.imageUrl);

                  return (
                    <div
                      key={enrollment.id}
                      className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden shadow-2xs hover:border-[#ff6636]/40 hover:shadow-md transition-all duration-200"
                    >
                      {/* Thumbnail Header */}
                      <div className="relative h-36 w-full overflow-hidden bg-muted">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={enrollment.course.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-muted via-card to-[#ff6636]/10 flex items-center justify-center">
                            <BookOpen className="size-10 text-muted-foreground/30" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        
                        <div className="absolute left-3 top-3">
                          <span className="rounded-full bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                            {enrollment.course.category}
                          </span>
                        </div>

                        <div className="absolute right-3 top-3">
                          <span className={cn("rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider backdrop-blur-md", state.className)}>
                            {state.label}
                          </span>
                        </div>

                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-[11px] font-semibold">
                          <span>By {enrollment.course.instructor.name}</span>
                          <span>{formatDuration(enrollment.course.durationMinutes)}</span>
                        </div>
                      </div>

                      {/* Content Body */}
                      <div className="flex flex-1 flex-col p-4 space-y-4">
                        <div className="flex-1">
                          <Link
                            href={`/courses/${enrollment.course.slug}`}
                            className="text-sm font-bold text-foreground group-hover:text-[#ff6636] transition-colors line-clamp-2 leading-snug"
                          >
                            {enrollment.course.title}
                          </Link>
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {enrollment.course.description}
                          </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5 pt-1 border-t border-border/60">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-muted-foreground">
                              {enrollment.completedLessons}/{enrollment.totalLessons} lessons
                            </span>
                            <span className="text-[#ff6636]">{enrollment.progress}%</span>
                          </div>
                          <Progress value={enrollment.progress} className="h-1.5 rounded-full" />
                        </div>

                        <Link
                          href={`/courses/${enrollment.course.slug}`}
                          className="flex items-center justify-center gap-1.5 rounded-xl bg-muted hover:bg-[#ff6636] hover:text-white py-2 text-xs font-bold text-foreground transition-all duration-200"
                        >
                          <span>{enrollment.progress > 0 ? "Continue Learning" : "Start Course"}</span>
                          <ArrowRight className="size-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right 1 Col: Recent Activity & Recommendations */}
          <div className="space-y-6">
            {/* Recent Activity Timeline */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="size-4 text-[#ff6636]" />
                  <h4 className="text-sm font-bold text-foreground">Recent Activity</h4>
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground">Last completions</span>
              </div>

              {recentActivityPreview.length === 0 ? (
                <div className="py-6 text-center space-y-2">
                  <Clock3 className="size-6 text-muted-foreground/40 mx-auto" />
                  <p className="text-xs text-muted-foreground font-medium">No recent completions yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivityPreview.map((item) => (
                    <div
                      key={item.lessonId}
                      className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/20 p-3 hover:bg-muted/40 transition-colors"
                    >
                      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/courses/${item.lesson.course.slug}/lessons/${item.lesson.id}`}
                          className="text-xs font-bold text-foreground hover:text-[#ff6636] transition-colors line-clamp-1"
                        >
                          {item.lesson.title}
                        </Link>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {item.lesson.course.title}
                        </p>
                        <span className="text-[9px] font-semibold text-muted-foreground/80 mt-1 block">
                          {formatDate(item.completedAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommended Next Steps */}
            {data.recommendedCourses.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-[#ff6636]" />
                    <h4 className="text-sm font-bold text-foreground">Recommended</h4>
                  </div>
                  <Link href="/courses" className="text-[10px] font-bold text-[#ff6636] hover:underline">
                    Explore
                  </Link>
                </div>

                <div className="space-y-3">
                  {data.recommendedCourses.slice(0, 3).map((course) => (
                    <Link
                      key={course.id}
                      href={`/courses/${course.slug}`}
                      className="group flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-muted/20 p-3 hover:border-[#ff6636]/40 hover:bg-muted/40 transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#ff6636]">
                          {course.category}
                        </span>
                        <p className="text-xs font-bold text-foreground group-hover:text-[#ff6636] transition-colors truncate">
                          {course.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-medium">
                          By {course.instructor.name} · {course.lessons.length} lessons
                        </p>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground group-hover:text-[#ff6636] transition-transform group-hover:translate-x-0.5 shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </LearnerShell>
  );
}
