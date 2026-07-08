"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MarketingPublicFooter,
  MarketingPublicHeader,
} from "@/components/marketing/public-chrome";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/ui/star-rating";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { getProxiedImageUrl } from "@/lib/s3-utils";
import { toast } from "sonner";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Loader2,
  Play,
  RefreshCw,
  Sparkles,
  Star,
  TrendingUp,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Enrollment {
  id: string;
  progress: number;
  createdAt: string;
  course: {
    id: string;
    slug: string;
    title: string;
    description: string;
    category: string;
    level: string;
    imageUrl: string | null;
    durationMinutes: number | null;
    lessons: { id: string; title: string; order: number }[];
    instructor: { name: string };
  };
}

interface UserReview {
  course: { id: string };
  rating: number;
  comment?: string | null;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function fetchUserReviews(userId: string): Promise<Record<string, UserReview>> {
  try {
    const res = await fetch(`/api/reviews?userId=${userId}`, { cache: "no-store" });
    if (!res.ok) return {};
    const data: { reviews?: UserReview[] } = await res.json();
    return (data.reviews ?? []).reduce<Record<string, UserReview>>((acc, r) => {
      acc[r.course.id] = r;
      return acc;
    }, {});
  } catch { return {}; }
}

async function fetchProgressData(enrollments: Enrollment[]) {
  const entries = await Promise.all(
    enrollments.map(async (e) => {
      try {
        const res = await fetch(`/api/enrollments/${e.id}/progress?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return [e.id, { progress: e.progress, totalLessons: e.course.lessons.length, lessonProgress: {} }] as const;
        const p: { progress?: number; totalLessons?: number; lessonProgress?: Record<string, boolean> } = await res.json();
        return [e.id, { progress: p.progress ?? e.progress, totalLessons: p.totalLessons ?? e.course.lessons.length, lessonProgress: p.lessonProgress ?? {} }] as const;
      } catch {
        return [e.id, { progress: e.progress, totalLessons: e.course.lessons.length, lessonProgress: {} }] as const;
      }
    }),
  );
  return Object.fromEntries(entries);
}

async function fetchDashboard(userId: string) {
  const res = await fetch("/api/enrollments", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch enrollments");
  const enrollments: Enrollment[] = await res.json();
  const [progressData, reviews] = await Promise.all([fetchProgressData(enrollments), fetchUserReviews(userId)]);
  return { enrollments, progressData, reviews };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(minutes: number | null) {
  if (!minutes) return "Self-paced";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

const levelColor: Record<string, string> = {
  BEGINNER:     "bg-emerald-500/10 text-emerald-600",
  INTERMEDIATE: "bg-amber-500/10 text-amber-600",
  ADVANCED:     "bg-red-500/10 text-red-600",
};

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingPublicHeader activePath="/my-courses" showSearch={false} />
      <div className="mx-auto max-w-[1320px] px-4 py-10 sm:px-6 lg:px-8 space-y-8">
        <Skeleton className="h-10 w-56 rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-96 rounded-2xl" />)}
        </div>
      </div>
    </div>
  );
}

// ─── Enrollment Card ──────────────────────────────────────────────────────────

function EnrollmentCard({
  enrollment,
  actualProgress,
  totalLessons,
  completedLessons,
  lessonProgress,
  hasReview,
  unenrollingId,
  onUnenroll,
  onReview,
}: {
  enrollment: Enrollment;
  actualProgress: number;
  totalLessons: number;
  completedLessons: number;
  lessonProgress: Record<string, boolean>;
  hasReview: boolean;
  unenrollingId: string | null;
  onUnenroll: (id: string) => void;
  onReview: (id: string, title: string) => void;
}) {
  const course = enrollment.course;
  const imageUrl = course.imageUrl ? getProxiedImageUrl(course.imageUrl) : null;
  const isComplete = actualProgress === 100;

  const sortedLessons = course.lessons.slice().sort((a, b) => a.order - b.order);
  const completedIds = new Set(Object.entries(lessonProgress).filter(([, v]) => v).map(([k]) => k));
  const nextLesson = sortedLessons.find((l) => !completedIds.has(l.id)) ?? (sortedLessons.at(-1) ?? null);

  const lvlKey = course.level?.toUpperCase();

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/40">
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={course.title}
            fill
            unoptimized
            sizes="(max-width: 1279px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#ff8f6a] via-[#ff6636] to-[#1d2026]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Top row */}
        <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
          <span className={cn(
            "rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide backdrop-blur-sm",
            isComplete
              ? "bg-emerald-500/80 text-white border border-emerald-400/30"
              : "bg-black/55 border border-white/10 text-white"
          )}>
            {isComplete ? "✓ Completed" : "In Progress"}
          </span>
          <button
            type="button"
            onClick={() => onUnenroll(enrollment.id)}
            disabled={unenrollingId === enrollment.id}
            className="flex size-8 items-center justify-center rounded-xl border border-white/15 bg-black/40 text-white backdrop-blur-sm hover:border-red-400/60 hover:bg-red-500/70 transition-all duration-200"
            aria-label="Unenroll"
          >
            {unenrollingId === enrollment.id
              ? <Loader2 className="size-3.5 animate-spin" />
              : <Trash2 className="size-3.5" />}
          </button>
        </div>

        {/* Progress ring overlay */}
        <div className="absolute bottom-3 right-3">
          <div className="relative flex size-12 items-center justify-center">
            <svg className="size-12 -rotate-90" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
              <circle
                cx="24" cy="24" r="20" fill="none"
                stroke={isComplete ? "#22c55e" : "#ff6636"}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - actualProgress / 100)}`}
                className="transition-all duration-700"
              />
            </svg>
            <span className="absolute text-[10px] font-extrabold text-white">{actualProgress}%</span>
          </div>
        </div>

        {/* Bottom title */}
        <div className="absolute bottom-3 left-3 right-16">
          <h2 className="text-sm font-bold leading-tight text-white line-clamp-2">{course.title}</h2>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4 space-y-4">
        {/* Instructor + level */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#ff6636]/10 text-[#ff6636] font-bold text-[9px]">
              {course.instructor.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-muted-foreground truncate">{course.instructor.name}</span>
          </div>
          {lvlKey && levelColor[lvlKey] && (
            <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${levelColor[lvlKey]}`}>
              {course.level}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-semibold">
            <span className="text-muted-foreground">{completedLessons}/{totalLessons} lessons</span>
            <span className={isComplete ? "text-emerald-600" : "text-[#ff6636]"}>{actualProgress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                isComplete ? "bg-emerald-500" : "bg-[#ff6636]",
              )}
              style={{ width: `${actualProgress}%` }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-[10px] font-semibold text-muted-foreground">
          <span className="flex items-center gap-1"><BookOpen className="size-3" />{course.lessons.length} lessons</span>
          <span className="flex items-center gap-1"><Clock3 className="size-3" />{formatDuration(course.durationMinutes)}</span>
          <span className="flex items-center gap-1"><GraduationCap className="size-3" />{course.category}</span>
        </div>

        {/* CTA */}
        <div className="pt-1 space-y-2">
          {isComplete ? (
            <>
              <Link
                href={`/certificates/${enrollment.id}`}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-2.5 text-xs font-bold text-background hover:bg-foreground/90 transition-colors duration-200"
              >
                <Award className="size-3.5" /> View Certificate
              </Link>
              <button
                type="button"
                onClick={() => onReview(course.id, course.title)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-xs font-bold text-foreground hover:border-[#ff6636]/50 hover:text-[#ff6636] transition-all duration-200"
              >
                <Star className={cn("size-3.5", hasReview ? "fill-[#fd8e1f] text-[#fd8e1f]" : "")} />
                {hasReview ? "Update Review" : "Write Review"}
              </button>
            </>
          ) : nextLesson ? (
            <Link
              href={`/courses/${course.slug}/lessons/${nextLesson.id}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] py-2.5 text-xs font-bold text-white transition-colors duration-200"
            >
              <Play className="size-3.5 ml-0.5" fill="currentColor" />
              {actualProgress > 0 ? "Continue Learning" : "Start Learning"}
            </Link>
          ) : (
            <div className="flex w-full items-center justify-center rounded-xl border border-dashed border-border py-2.5 text-xs font-semibold text-muted-foreground">
              No lessons available yet
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyCoursesPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const [enrollments, setEnrollments]         = useState<Enrollment[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [refreshing, setRefreshing]           = useState(false);
  const [unenrollingId, setUnenrollingId]     = useState<string | null>(null);
  const [confirmUnenroll, setConfirmUnenroll] = useState<string | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewCourse, setReviewCourse]       = useState<{ id: string; title: string; existingRating?: number; existingComment?: string } | null>(null);
  const [reviewRating, setReviewRating]       = useState(0);
  const [reviewComment, setReviewComment]     = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [userReviews, setUserReviews]         = useState<Record<string, UserReview>>({});
  const [progressMap, setProgressMap]         = useState<Record<string, { progress: number; totalLessons: number; lessonProgress: Record<string, boolean> }>>({});

  const shouldRedirectToLogin = !isPending && !session?.user;

  useEffect(() => {
    if (shouldRedirectToLogin) router.replace("/login");
  }, [router, shouldRedirectToLogin]);

  useEffect(() => {
    if (!session?.user?.id) return;
    setLoading(true);
    fetchDashboard(session.user.id).then((d) => {
      setEnrollments(d.enrollments);
      setProgressMap(d.progressData);
      setUserReviews(d.reviews);
    }).catch((e) => { console.error(e); toast.error("Failed to load your courses."); })
    .finally(() => setLoading(false));
  }, [session?.user?.id]);

  const handleRefresh = async () => {
    if (!session?.user?.id) return;
    setRefreshing(true);
    try {
      const d = await fetchDashboard(session.user.id);
      setEnrollments(d.enrollments);
      setProgressMap(d.progressData);
      setUserReviews(d.reviews);
      toast.success("Dashboard refreshed.");
    } catch { toast.error("Failed to refresh."); }
    finally { setRefreshing(false); }
  };

  const handleUnenroll = async (enrollmentId: string) => {
    setUnenrollingId(enrollmentId);
    try {
      const res = await fetch(`/api/enrollments/${enrollmentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setEnrollments((p) => p.filter((e) => e.id !== enrollmentId));
      setProgressMap((p) => { const n = { ...p }; delete n[enrollmentId]; return n; });
      toast.success("Unenrolled successfully.");
    } catch { toast.error("Failed to unenroll."); }
    finally { setUnenrollingId(null); setConfirmUnenroll(null); }
  };

  const handleOpenReview = (courseId: string, courseTitle: string) => {
    const existing = userReviews[courseId];
    setReviewCourse({ id: courseId, title: courseTitle, existingRating: existing?.rating, existingComment: existing?.comment ?? undefined });
    setReviewRating(existing?.rating ?? 0);
    setReviewComment(existing?.comment ?? "");
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewCourse || reviewRating === 0) { toast.error("Please select a rating."); return; }
    setSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: reviewCourse.id, rating: reviewRating, comment: reviewComment.trim() || null }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const review = await res.json();
      setUserReviews((p) => ({ ...p, [reviewCourse.id]: { course: { id: reviewCourse.id }, rating: review.rating, comment: review.comment } }));
      toast.success("Review submitted!");
      setReviewDialogOpen(false);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to submit review."); }
    finally { setSubmittingReview(false); }
  };

  // ── Derived stats ─────────────────────────────────────────────────────────
  const enriched = useMemo(() =>
    enrollments.map((e) => {
      const p = progressMap[e.id];
      const actualProgress  = p?.progress    ?? e.progress;
      const totalLessons    = p?.totalLessons ?? e.course.lessons.length;
      const lessonProgress  = p?.lessonProgress ?? {};
      const completedLessons = Math.round((actualProgress / 100) * totalLessons);
      return { enrollment: e, actualProgress, totalLessons, completedLessons, lessonProgress };
    }),
  [enrollments, progressMap]);

  const completedCourses = enriched.filter((e) => e.actualProgress === 100);
  const activeCourses    = enriched.filter((e) => e.actualProgress  < 100);
  const avgProgress      = enriched.length
    ? Math.round(enriched.reduce((s, e) => s + e.actualProgress, 0) / enriched.length)
    : 0;

  if (shouldRedirectToLogin || isPending || loading) return <PageSkeleton />;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <MarketingPublicHeader activePath="/my-courses" showSearch={false} />

      <main className="flex-1">
        {/* ── Hero banner ──────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-border/40 bg-[#fff9f7] dark:bg-[#111318] py-10 lg:py-14">
          <div className="pointer-events-none absolute -top-40 right-0 size-[500px] rounded-full bg-[#ff6636]/5 blur-3xl" />
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 relative">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-2xl space-y-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#ff6636]/30 bg-[#ff6636]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-[#ff6636]">
                  <GraduationCap className="size-3.5" /> My Learning
                </span>
                <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
                  {session?.user?.name
                    ? `Welcome back, ${session.user.name.split(" ")[0]} 👋`
                    : "Your Learning Dashboard"}
                </h1>
                <p className="text-sm font-semibold text-muted-foreground leading-relaxed max-w-lg">
                  Track progress, jump back into lessons, and celebrate your completions — all in one place.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] disabled:opacity-60 transition-all duration-200"
                >
                  <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
                  {refreshing ? "Refreshing…" : "Refresh"}
                </button>
                <Link
                  href="/courses"
                  className="flex items-center gap-2 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] px-4 py-2.5 text-sm font-bold text-white transition-colors duration-200"
                >
                  <BookOpen className="size-4" /> Browse Courses
                </Link>
              </div>
            </div>

            {/* ── Stat cards ────────────────────────────────────────────────── */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Enrolled",    value: enrollments.length.toString(),  icon: BookOpen,      color: "text-[#ff6636]",  bg: "bg-[#ff6636]/10",  desc: "Total learning paths"       },
                { label: "In Progress", value: activeCourses.length.toString(),icon: TrendingUp,    color: "text-violet-500", bg: "bg-violet-500/10", desc: "Courses still underway"     },
                { label: "Completed",   value: completedCourses.length.toString(), icon: CheckCircle2,  color: "text-emerald-500",bg: "bg-emerald-500/10",desc: "Ready to certify"           },
                { label: "Avg Progress",value: `${avgProgress}%`,              icon: Sparkles,      color: "text-amber-500",  bg: "bg-amber-500/10",  desc: "Across all your courses"   },
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

        {/* ── Course Grid ───────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
          {enriched.length === 0 ? (
            /* Empty state */
            <div className="flex min-h-[26rem] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-8 py-16 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-[#ff6636]/10 text-[#ff6636] mb-5">
                <BookOpen className="size-8" />
              </div>
              <h2 className="text-xl font-extrabold text-foreground">No enrolled courses yet</h2>
              <p className="mt-2 max-w-sm text-sm font-semibold text-muted-foreground leading-relaxed">
                Browse the catalog, pick a learning path, and your progress dashboard will appear here.
              </p>
              <Link
                href="/courses"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] px-6 py-2.5 text-sm font-bold text-white transition-colors duration-200"
              >
                <BookOpen className="size-4" /> Browse Courses
              </Link>
            </div>
          ) : (
            <>
              {/* Section label */}
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Your library</p>
                  <h2 className="mt-0.5 text-xl font-extrabold text-foreground">
                    {enriched.length} Course{enriched.length !== 1 ? "s" : ""} Enrolled
                  </h2>
                </div>
                {completedCourses.length > 0 && (
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600">
                    🎉 {completedCourses.length} Completed
                  </span>
                )}
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {enriched.map(({ enrollment, actualProgress, totalLessons, completedLessons, lessonProgress }) => (
                  <EnrollmentCard
                    key={enrollment.id}
                    enrollment={enrollment}
                    actualProgress={actualProgress}
                    totalLessons={totalLessons}
                    completedLessons={completedLessons}
                    lessonProgress={lessonProgress}
                    hasReview={Boolean(userReviews[enrollment.course.id])}
                    unenrollingId={unenrollingId}
                    onUnenroll={(id) => setConfirmUnenroll(id)}
                    onReview={handleOpenReview}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      <MarketingPublicFooter />

      {/* ── Unenroll confirmation ─────────────────────────────────────────── */}
      <AlertDialog open={Boolean(confirmUnenroll)} onOpenChange={(o) => !o && setConfirmUnenroll(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-extrabold">Unenroll from this course?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-semibold text-muted-foreground">
              This removes the course from your dashboard and clears your saved progress permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmUnenroll && handleUnenroll(confirmUnenroll)}
              className="rounded-xl bg-destructive font-bold text-destructive-foreground hover:bg-destructive/90"
            >
              Unenroll
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Review dialog ─────────────────────────────────────────────────── */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold">
              {reviewCourse?.existingRating ? "Update your review" : "Write a review"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-1">
            <div className="rounded-xl bg-muted/40 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Course</p>
              <p className="mt-1 text-sm font-bold text-foreground">{reviewCourse?.title}</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your rating</p>
              <StarRating rating={reviewRating} size="lg" interactive onRatingChange={setReviewRating} />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Comment <span className="normal-case font-normal">(optional)</span></label>
              <Textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share what this course did well and where it helped most…"
                rows={4}
                className="rounded-xl resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <Button variant="outline" onClick={() => setReviewDialogOpen(false)} className="rounded-xl font-bold">
                Cancel
              </Button>
              <Button
                onClick={handleSubmitReview}
                disabled={submittingReview || reviewRating === 0}
                className="rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] font-bold text-white"
              >
                {submittingReview ? <><Loader2 className="mr-2 size-4 animate-spin" />Saving…</> : reviewCourse?.existingRating ? "Update Review" : "Submit Review"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
