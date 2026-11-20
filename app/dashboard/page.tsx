"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Award,
  BookOpen,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Compass,
  Flame,
  FolderCode,
  LayoutDashboard,
  Play,
  PlayCircle,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import {
  LearnerPageShell,
  LearnerWorkspaceNav,
} from "@/components/lms/learner-workspace-nav";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import {
  formatCourseLevel,
  formatDuration,
  formatShortDate,
  getCategoryMeta,
  getLevelBadgeClass,
  getProgressState,
} from "@/lib/learner-ui";
import { getProxiedImageUrl } from "@/lib/s3-utils";
import {
  getItemHref,
  getLessonHref,
  isProjectTutorial,
  type ContentType,
} from "@/lib/content-type";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  contentType?: ContentType;
  category: string;
  level: string;
  price?: number;
  imageUrl: string | null;
  durationMinutes: number | null;
  lessons: { id: string; title?: string; order?: number }[];
  instructor: { name: string };
}

interface Enrollment {
  id: string;
  courseId: string;
  course: Course;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  nextLesson: { id: string; title: string; order: number } | null;
  enrolledAt: string;
  updatedAt?: string;
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
      contentType?: ContentType;
    };
  } | null;
}

interface DashboardData {
  stats: {
    totalEnrolled: number;
    enrolledCourses?: number;
    enrolledProjects?: number;
    inProgress: number;
    readyToStart: number;
    completed: number;
    totalLessonsCompleted: number;
    completedThisWeek: number;
    activeStreakDays: number;
    averageProgress: number;
  };
  enrollments: Enrollment[];
  recentActivity: RecentActivity[];
  recommendedCourses: Course[];
  recommendedProjects?: Course[];
}

// ─── API Helper ───────────────────────────────────────────────────────────────

async function fetchDashboardData(): Promise<DashboardData> {
  const response = await fetch("/api/dashboard", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to fetch dashboard");
  }
  return response.json();
}

// ─── Page Component ───────────────────────────────────────────────────────────

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
    () =>
      data?.enrollments.filter((enrollment) => enrollment.progress < 100) ?? [],
    [data],
  );

  const completedEnrollments = useMemo(
    () =>
      data?.enrollments.filter((enrollment) => enrollment.progress >= 100) ??
      [],
    [data],
  );

  const nextFocus = useMemo(
    () =>
      activeEnrollments.find((enrollment) => enrollment.progress > 0) ??
      activeEnrollments[0] ??
      null,
    [activeEnrollments],
  );

  const displayedEnrollments = useMemo(() => {
    if (!data?.enrollments) return [];
    const prioritized = [...activeEnrollments, ...completedEnrollments];
    return prioritized.slice(0, 4);
  }, [activeEnrollments, completedEnrollments, data?.enrollments]);

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
    () => validRecentActivity.slice(0, 5),
    [validRecentActivity],
  );

  if (shouldRedirectToLogin || isPending || loading) {
    return (
      <LearnerPageShell activePath="/dashboard">
        <section className="border-b border-border/40 bg-[#fff9f7] dark:bg-[#111318] py-10 lg:py-14">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 space-y-8">
            <Skeleton className="h-11 w-full max-w-xl rounded-2xl" />
            <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
              <div className="space-y-4">
                <Skeleton className="h-6 w-36 rounded-full" />
                <Skeleton className="h-12 w-3/4 rounded-xl" />
                <Skeleton className="h-5 w-2/3 rounded-lg" />
                <div className="flex gap-3 pt-2">
                  <Skeleton className="h-11 w-40 rounded-xl" />
                  <Skeleton className="h-11 w-36 rounded-xl" />
                </div>
              </div>
              <Skeleton className="h-52 rounded-2xl" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))}
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <div className="grid gap-5 sm:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-2xl" />
              ))}
            </div>
            <div className="space-y-6">
              <Skeleton className="h-72 rounded-2xl" />
              <Skeleton className="h-72 rounded-2xl" />
            </div>
          </div>
        </section>
      </LearnerPageShell>
    );
  }

  if (!data) {
    return (
      <LearnerPageShell activePath="/dashboard">
        <div className="mx-auto flex min-h-[65vh] max-w-[1320px] items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-[#ff6636]/10 text-[#ff6636]">
              <LayoutDashboard className="size-7" />
            </div>
            <h1 className="text-xl font-extrabold text-foreground">
              Dashboard unavailable
            </h1>
            <p className="mt-2 text-sm font-semibold text-muted-foreground leading-relaxed">
              We couldn&apos;t load your learning workspace right now. Please try
              refreshing.
            </p>
            <Button
              onClick={handleRefresh}
              className="mt-6 rounded-xl bg-[#ff6636] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#e95a2b]"
            >
              Retry
            </Button>
          </div>
        </div>
      </LearnerPageShell>
    );
  }

  const nextFocusHref = nextFocus
    ? nextFocus.nextLesson
      ? getLessonHref(
          nextFocus.course.contentType,
          nextFocus.course.slug,
          nextFocus.nextLesson.id,
        )
      : getItemHref(nextFocus.course.contentType, nextFocus.course.slug)
    : "/courses";

  const focusCat = nextFocus ? getCategoryMeta(nextFocus.course.category) : null;

  return (
    <LearnerPageShell activePath="/dashboard">
      {/* ── Hero Banner & Workspace Navigation ──────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border/40 bg-[#fff9f7] dark:bg-[#111318] py-10 lg:py-14">
        <div className="pointer-events-none absolute -top-40 right-0 size-[500px] rounded-full bg-[#ff6636]/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-1/3 size-[400px] rounded-full bg-violet-500/5 blur-3xl" />

        <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 relative space-y-8">
          <LearnerWorkspaceNav activePath="/dashboard" />

          <div className="grid gap-8 lg:grid-cols-[1fr_390px] items-center">
            {/* Left: Greeting & Primary Actions */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#ff6636]/30 bg-[#ff6636]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-[#ff6636]">
                  <LayoutDashboard className="size-3.5" /> Learner Dashboard
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
                  <CalendarRange className="size-3.5 text-[#ff6636]" />
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>

              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]">
                Welcome back,{" "}
                <span className="bg-gradient-to-r from-[#ff6636] to-[#ff9f60] bg-clip-text text-transparent">
                  {firstName}
                </span>
              </h1>

              <p className="max-w-xl text-sm sm:text-base font-semibold leading-relaxed text-muted-foreground">
                {nextFocus
                  ? `Pick up right where you left off in "${nextFocus.course.title}", review recent completions, or explore new courses.`
                  : "Track your enrollments, monitor lesson progress, and earn verified DevForge certificates as you build real skills."}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                {nextFocus ? (
                  <Link
                    href={nextFocusHref}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-md shadow-[#ff6636]/20 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <PlayCircle className="size-4" />
                    {nextFocus.progress > 0 ? "Resume Learning" : "Start Course"}
                  </Link>
                ) : (
                  <Link
                    href="/courses"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-md shadow-[#ff6636]/20 transition-all duration-200"
                  >
                    <Compass className="size-4" /> Explore Courses
                  </Link>
                )}

                <Link
                  href="/my-courses"
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] transition-all"
                >
                  <BookOpen className="size-4 text-[#ff6636]" /> My Courses (
                  {data.stats.totalEnrolled})
                </Link>

                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:border-[#ff6636]/40 hover:text-foreground disabled:opacity-60 transition-all"
                >
                  <RefreshCw
                    className={cn("size-3.5", refreshing && "animate-spin")}
                  />
                  {refreshing ? "Refreshing…" : "Refresh"}
                </button>
              </div>
            </div>

            {/* Right: Current Focus Card */}
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-border/60 pb-3.5 mb-4">
                <div className="flex items-center gap-2">
                  <Target className="size-4 text-[#ff6636]" />
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground">
                    Current Focus
                  </span>
                </div>
                {focusCat && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                      focusCat.theme.badge,
                    )}
                  >
                    {focusCat.label}
                  </span>
                )}
              </div>

              {nextFocus ? (
                <div className="space-y-4">
                  <div>
                    <Link
                      href={getItemHref(
                        nextFocus.course.contentType,
                        nextFocus.course.slug,
                      )}
                      className="text-base font-bold text-foreground hover:text-[#ff6636] transition-colors line-clamp-1"
                    >
                      {nextFocus.course.title}
                    </Link>
                    <p className="text-xs font-semibold text-muted-foreground mt-1">
                      By {nextFocus.course.instructor.name} ·{" "}
                      {formatDuration(nextFocus.course.durationMinutes)}
                    </p>
                    {nextFocus.nextLesson && (
                      <p className="mt-1.5 text-xs font-medium text-muted-foreground truncate">
                        Next: <span className="text-foreground font-semibold">{nextFocus.nextLesson.title}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-muted-foreground">
                        {nextFocus.completedLessons} of {nextFocus.totalLessons}{" "}
                        lessons
                      </span>
                      <span className="text-[#ff6636]">
                        {nextFocus.progress}%
                      </span>
                    </div>
                    <Progress
                      value={nextFocus.progress}
                      className="h-2 rounded-full"
                    />
                  </div>

                  <div className="grid grid-cols-[1fr_auto] gap-2 pt-1">
                    <Link
                      href={nextFocusHref}
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] py-2.5 px-4 text-xs font-extrabold uppercase tracking-wider text-white transition-colors"
                    >
                      <Play className="size-3.5 fill-current" />
                      {nextFocus.progress > 0 ? "Continue Lesson" : "Start Lesson"}
                    </Link>
                    <Link
                      href={getItemHref(
                        nextFocus.course.contentType,
                        nextFocus.course.slug,
                      )}
                      className="flex items-center justify-center rounded-xl border border-border bg-muted/40 hover:border-[#ff6636]/40 hover:text-[#ff6636] px-3.5 py-2.5 text-xs font-bold text-foreground transition-colors"
                    >
                      {isProjectTutorial(nextFocus.course.contentType)
                        ? "Overview"
                        : "Syllabus"}
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center space-y-3">
                  <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-[#ff6636]/10 text-[#ff6636]">
                    <Compass className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {data.stats.completed > 0
                        ? "All active courses completed!"
                        : "Ready for your first path"}
                    </p>
                    <p className="mt-1 text-xs font-medium text-muted-foreground">
                      {data.stats.completed > 0
                        ? "View your earned certificates or pick another course."
                        : "Enroll in a course from the catalog to start tracking progress."}
                    </p>
                  </div>
                  <div className="flex justify-center gap-2 pt-1">
                    {data.stats.completed > 0 && (
                      <Link
                        href="/certificates"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/40 px-3.5 py-2 text-xs font-bold text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] transition-colors"
                      >
                        <Award className="size-3.5 text-[#ff6636]" /> Certificates
                      </Link>
                    )}
                    <Link
                      href="/courses"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#ff6636] px-4 py-2 text-xs font-bold text-white hover:bg-[#e95a2b] transition-colors"
                    >
                      Explore Catalog <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats Strip */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-2xs">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#ff6636]/10 text-[#ff6636]">
                <TrendingUp className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold tracking-tight text-foreground">
                  {data.stats.inProgress}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  In Progress
                </p>
                <p className="text-[10px] font-semibold text-muted-foreground/80 mt-0.5">
                  {data.stats.readyToStart > 0
                    ? `${data.stats.readyToStart} ready to start`
                    : `${data.stats.totalEnrolled} total enrolled`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-2xs">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold tracking-tight text-foreground">
                  {data.stats.totalLessonsCompleted}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Lessons Completed
                </p>
                <p className="text-[10px] font-semibold text-muted-foreground/80 mt-0.5">
                  {data.stats.completedThisWeek} in the last 7 days
                </p>
              </div>
            </div>

            <Link
              href="/certificates"
              className="group flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-2xs hover:border-[#ff6636]/40 transition-colors"
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-500">
                <Award className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-extrabold tracking-tight text-foreground">
                  {data.stats.completed}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Certificates Earned
                </p>
                <p className="text-[10px] font-semibold text-[#ff6636] mt-0.5 group-hover:underline">
                  View credentials →
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-2xs">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                <Flame className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold tracking-tight text-foreground">
                  {data.stats.activeStreakDays}{" "}
                  <span className="text-sm font-bold text-muted-foreground">
                    {data.stats.activeStreakDays === 1 ? "Day" : "Days"}
                  </span>
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Learning Streak
                </p>
                <p className="text-[10px] font-semibold text-muted-foreground/80 mt-0.5">
                  Avg completion: {data.stats.averageProgress}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content Grid ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px] items-start">
          {/* Left Column: Active & Enrolled Paths */}
          <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#ff6636]">
                  Your Learning
                </p>
                <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
                  Enrolled Courses
                </h2>
              </div>
              <Link
                href="/my-courses"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ff6636] hover:underline"
              >
                Manage all ({data.stats.totalEnrolled}){" "}
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            {displayedEnrollments.length === 0 ? (
              <div className="flex min-h-[22rem] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-8 py-14 text-center">
                <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-[#ff6636]/10 text-[#ff6636]">
                  <BookOpen className="size-7" />
                </div>
                <h3 className="text-lg font-extrabold text-foreground">
                  No enrolled courses yet
                </h3>
                <p className="mt-2 max-w-md text-sm font-semibold text-muted-foreground leading-relaxed">
                  Explore the DevForge course catalog to pick your first
                  learning path. Your active progress and recent lessons will
                  appear here.
                </p>
                <Link
                  href="/courses"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white transition-colors"
                >
                  Browse Catalog <ArrowRight className="size-3.5" />
                </Link>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {displayedEnrollments.map((enrollment) => {
                  const state = getProgressState(enrollment.progress);
                  const cat = getCategoryMeta(enrollment.course.category);
                  const CatIcon = cat.icon;
                  const imageUrl = enrollment.course.imageUrl
                    ? getProxiedImageUrl(enrollment.course.imageUrl)
                    : null;
                  const isComplete = enrollment.progress >= 100;
                  const isProject = isProjectTutorial(
                    enrollment.course.contentType,
                  );
                  const itemHref = getItemHref(
                    enrollment.course.contentType,
                    enrollment.course.slug,
                  );
                  const resumeHref = isComplete
                    ? `/certificates/${enrollment.id}`
                    : enrollment.nextLesson
                      ? getLessonHref(
                          enrollment.course.contentType,
                          enrollment.course.slug,
                          enrollment.nextLesson.id,
                        )
                      : itemHref;

                  return (
                    <article
                      key={enrollment.id}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#ff6636]/40 hover:shadow-lg"
                    >
                      {/* Thumbnail */}
                      <Link
                        href={itemHref}
                        className="relative block aspect-video overflow-hidden bg-muted/40"
                      >
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={enrollment.course.title}
                            fill
                            unoptimized
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-[#ff8f6a] via-[#ff6636] to-[#1d2026]" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

                        <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white backdrop-blur-sm border",
                                isProject
                                  ? "bg-violet-600/85 border-violet-400/30"
                                  : "bg-[#ff6636]/85 border-white/15",
                              )}
                            >
                              {isProject ? "Project" : "Course"}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                              <CatIcon className="size-3" />
                              {cat.label}
                            </span>
                          </div>
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide backdrop-blur-md",
                              isComplete
                                ? "bg-emerald-500/85 text-white border border-emerald-400/30"
                                : "bg-black/60 text-white border border-white/10",
                            )}
                          >
                            {state.label}
                          </span>
                        </div>

                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-semibold text-white">
                          <span className="truncate">
                            By {enrollment.course.instructor.name}
                          </span>
                          <span className="shrink-0">
                            {formatDuration(enrollment.course.durationMinutes)}
                          </span>
                        </div>
                      </Link>

                      {/* Card Body */}
                      <div className="flex flex-1 flex-col p-5 space-y-4">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase",
                              getLevelBadgeClass(enrollment.course.level),
                            )}
                          >
                            {formatCourseLevel(enrollment.course.level)}
                          </span>
                          <span className="text-[11px] font-semibold text-muted-foreground">
                            Enrolled {formatShortDate(enrollment.enrolledAt)}
                          </span>
                        </div>

                        <div className="flex-1">
                          <Link
                            href={itemHref}
                            className="block text-base font-bold leading-snug text-foreground line-clamp-2 group-hover:text-[#ff6636] transition-colors"
                          >
                            {enrollment.course.title}
                          </Link>
                          <p className="mt-1.5 text-xs font-medium text-muted-foreground line-clamp-2 leading-relaxed">
                            {enrollment.course.description}
                          </p>
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-border/60">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-muted-foreground">
                              {enrollment.completedLessons}/
                              {enrollment.totalLessons} lessons
                            </span>
                            <span
                              className={
                                isComplete
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-[#ff6636]"
                              }
                            >
                              {enrollment.progress}%
                            </span>
                          </div>
                          <Progress
                            value={enrollment.progress}
                            className="h-1.5 rounded-full"
                          />
                        </div>

                        <div className="grid grid-cols-[1fr_auto] gap-2">
                          <Link
                            href={resumeHref}
                            className={cn(
                              "flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-xs font-bold transition-colors",
                              isComplete
                                ? "bg-foreground text-background hover:bg-foreground/90"
                                : "bg-[#ff6636] text-white hover:bg-[#e95a2b]",
                            )}
                          >
                            {isComplete ? (
                              <>
                                <Award className="size-3.5" />
                                <span>View Certificate</span>
                              </>
                            ) : (
                              <>
                                <Play className="size-3.5 fill-current" />
                                <span>
                                  {enrollment.progress > 0
                                    ? isProject
                                      ? "Continue Project"
                                      : "Continue Learning"
                                    : isProject
                                      ? "Start Project"
                                      : "Start Course"}
                                </span>
                              </>
                            )}
                          </Link>
                          <Link
                            href={itemHref}
                            className="flex items-center justify-center rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-xs font-bold text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] transition-colors"
                          >
                            Details
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Sidebar: Activity Timeline, Recommended Courses, Quick Links */}
          <aside className="space-y-6">
            {/* Recent Activity */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
                <div className="flex items-center gap-2">
                  <Activity className="size-4 text-[#ff6636]" />
                  <h3 className="text-sm font-extrabold text-foreground">
                    Recent Activity
                  </h3>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Latest lessons
                </span>
              </div>

              {recentActivityPreview.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <Clock3 className="size-7 text-muted-foreground/40 mx-auto" />
                  <p className="text-xs font-semibold text-muted-foreground">
                    Complete a lesson to see your learning timeline here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivityPreview.map((item) => (
                    <Link
                      key={item.lessonId}
                      href={getLessonHref(
                        item.lesson.course.contentType,
                        item.lesson.course.slug,
                        item.lesson.id,
                      )}
                      className="group flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 hover:border-[#ff6636]/40 hover:bg-muted/40 transition-all"
                    >
                      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground group-hover:text-[#ff6636] transition-colors line-clamp-1">
                          {item.lesson.title}
                        </p>
                        <p className="text-[11px] font-medium text-muted-foreground truncate mt-0.5">
                          {item.lesson.course.title}
                        </p>
                        <span className="mt-1 block text-[10px] font-semibold text-muted-foreground/80">
                          Completed {formatShortDate(item.completedAt)}
                        </span>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground group-hover:text-[#ff6636] shrink-0 mt-1.5" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Recommended Courses */}
            {data.recommendedCourses.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-[#ff6636]" />
                    <h3 className="text-sm font-extrabold text-foreground">
                      Recommended Courses
                    </h3>
                  </div>
                  <Link
                    href="/courses"
                    className="text-[11px] font-bold text-[#ff6636] hover:underline"
                  >
                    View all
                  </Link>
                </div>

                <div className="space-y-3">
                  {data.recommendedCourses.slice(0, 3).map((course) => {
                    const cat = getCategoryMeta(course.category);
                    const imageUrl = course.imageUrl
                      ? getProxiedImageUrl(course.imageUrl)
                      : null;

                    return (
                      <Link
                        key={course.id}
                        href={`/courses/${course.slug}`}
                        className="group grid grid-cols-[76px_minmax(0,1fr)] items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-2.5 hover:border-[#ff6636]/40 hover:bg-muted/40 transition-all"
                      >
                        <div className="relative h-14 w-[76px] overflow-hidden rounded-lg bg-muted shrink-0">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={course.title}
                              fill
                              unoptimized
                              sizes="76px"
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-[#ff8f6a] via-[#ff6636] to-[#1d2026]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#ff6636]">
                            {cat.label}
                          </span>
                          <p className="text-xs font-bold text-foreground group-hover:text-[#ff6636] transition-colors line-clamp-1">
                            {course.title}
                          </p>
                          <p className="text-[10px] font-medium text-muted-foreground mt-0.5 truncate">
                            {course.instructor.name} · {course.lessons.length}{" "}
                            lessons
                            {typeof course.price === "number"
                              ? ` · ${course.price > 0 ? `$${course.price.toFixed(0)}` : "Free"}`
                              : ""}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recommended Project Tutorials */}
            {data.recommendedProjects && data.recommendedProjects.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
                  <div className="flex items-center gap-2">
                    <FolderCode className="size-4 text-violet-500" />
                    <h3 className="text-sm font-extrabold text-foreground">
                      Recommended Projects
                    </h3>
                  </div>
                  <Link
                    href="/projects"
                    className="text-[11px] font-bold text-violet-500 hover:underline"
                  >
                    View all
                  </Link>
                </div>

                <div className="space-y-3">
                  {data.recommendedProjects.slice(0, 3).map((project) => {
                    const cat = getCategoryMeta(project.category);
                    const imageUrl = project.imageUrl
                      ? getProxiedImageUrl(project.imageUrl)
                      : null;

                    return (
                      <Link
                        key={project.id}
                        href={`/projects/${project.slug}`}
                        className="group grid grid-cols-[76px_minmax(0,1fr)] items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-2.5 hover:border-violet-500/40 hover:bg-muted/40 transition-all"
                      >
                        <div className="relative h-14 w-[76px] overflow-hidden rounded-lg bg-muted shrink-0">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={project.title}
                              fill
                              unoptimized
                              sizes="76px"
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-[#ff6636] to-[#1d2026]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-violet-500">
                            Project · {cat.label}
                          </span>
                          <p className="text-xs font-bold text-foreground group-hover:text-violet-500 transition-colors line-clamp-1">
                            {project.title}
                          </p>
                          <p className="text-[10px] font-medium text-muted-foreground mt-0.5 truncate">
                            {project.instructor.name} · {project.lessons.length}{" "}
                            lessons
                            {typeof project.price === "number"
                              ? ` · ${project.price > 0 ? `$${project.price.toFixed(0)}` : "Free"}`
                              : ""}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Workspace Shortcuts */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-3">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground border-b border-border/60 pb-3">
                Quick Shortcuts
              </p>
              <div className="grid gap-2">
                {[
                  { label: "Manage My Courses", href: "/my-courses" },
                  { label: "Certificates & Credentials", href: "/certificates" },
                  { label: "Profile & Security", href: "/profile" },
                  { label: "Community Discussions", href: "/community" },
                ].map((shortcut) => (
                  <Link
                    key={shortcut.href}
                    href={shortcut.href}
                    className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 px-4 py-2.5 text-xs font-bold text-foreground hover:border-[#ff6636]/40 hover:bg-[#ff6636]/5 hover:text-[#ff6636] transition-all"
                  >
                    <span>{shortcut.label}</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </LearnerPageShell>
  );
}
