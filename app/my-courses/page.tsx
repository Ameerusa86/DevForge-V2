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
import { LearnerShell } from "@/components/lms/learner-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/ui/star-rating";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { getProxiedImageUrl } from "@/lib/s3-utils";
import { toast } from "sonner";
import {
  Award,
  BookOpen,
  Clock3,
  Loader2,
  Play,
  RefreshCw,
  Star,
  Trash2,
  Search,
  ArrowRight,
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
  } catch {
    return {};
  }
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
    })
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
  BEGINNER: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  INTERMEDIATE: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
  ADVANCED: "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20",
};

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
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xs transition-all duration-300 hover:border-[#ff6636]/40 hover:shadow-md">
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
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide backdrop-blur-md",
              isComplete
                ? "bg-emerald-500/80 text-white border border-emerald-400/30"
                : "bg-black/60 border border-white/10 text-white"
            )}
          >
            {isComplete ? "✓ Completed" : "In Progress"}
          </span>
          <button
            type="button"
            onClick={() => onUnenroll(enrollment.id)}
            disabled={unenrollingId === enrollment.id}
            className="flex size-7 items-center justify-center rounded-lg border border-white/15 bg-black/40 text-white backdrop-blur-sm hover:border-red-400/60 hover:bg-red-500/70 transition-all duration-200"
            aria-label="Unenroll"
          >
            {unenrollingId === enrollment.id ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
          </button>
        </div>

        {/* Progress ring overlay */}
        <div className="absolute bottom-3 right-3">
          <div className="relative flex size-11 items-center justify-center">
            <svg className="size-11 -rotate-90" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
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
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#ff6636]">
            {course.category}
          </span>
          <h3 className="text-xs font-bold leading-tight text-white line-clamp-1 truncate">
            {course.title}
          </h3>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4 space-y-3.5">
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
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] font-semibold">
            <span className="text-muted-foreground">{completedLessons}/{totalLessons} lessons</span>
            <span className={isComplete ? "text-emerald-600 font-bold" : "text-[#ff6636] font-bold"}>
              {actualProgress}%
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                isComplete ? "bg-emerald-500" : "bg-[#ff6636]"
              )}
              style={{ width: `${actualProgress}%` }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-[10px] font-semibold text-muted-foreground pt-0.5">
          <span className="flex items-center gap-1"><BookOpen className="size-3" />{course.lessons.length} lessons</span>
          <span className="flex items-center gap-1"><Clock3 className="size-3" />{formatDuration(course.durationMinutes)}</span>
        </div>

        {/* CTA Button */}
        <div className="pt-2 space-y-2">
          {isComplete ? (
            <div className="grid grid-cols-2 gap-2">
              <Link
                href={`/certificates/${enrollment.id}`}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-foreground py-2 text-xs font-bold text-background hover:bg-foreground/90 transition-colors"
              >
                <Award className="size-3.5" /> Certificate
              </Link>
              <button
                type="button"
                onClick={() => onReview(course.id, course.title)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2 text-xs font-bold text-foreground hover:border-[#ff6636]/50 hover:text-[#ff6636] transition-all"
              >
                <Star className={cn("size-3.5", hasReview ? "fill-amber-500 text-amber-500" : "")} />
                {hasReview ? "Edit Review" : "Review"}
              </button>
            </div>
          ) : nextLesson ? (
            <Link
              href={`/courses/${course.slug}/lessons/${nextLesson.id}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] py-2.5 text-xs font-bold text-white transition-colors"
            >
              <Play className="size-3.5 fill-current" />
              {actualProgress > 0 ? "Continue Lesson" : "Start Learning"}
            </Link>
          ) : (
            <div className="flex w-full items-center justify-center rounded-xl border border-dashed border-border py-2 text-xs font-semibold text-muted-foreground">
              No lessons available
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

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unenrollingId, setUnenrollingId] = useState<string | null>(null);
  const [confirmUnenroll, setConfirmUnenroll] = useState<string | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewCourse, setReviewCourse] = useState<{ id: string; title: string; existingRating?: number; existingComment?: string } | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [userReviews, setUserReviews] = useState<Record<string, UserReview>>({});
  const [progressMap, setProgressMap] = useState<Record<string, { progress: number; totalLessons: number; lessonProgress: Record<string, boolean> }>>({});
  const [activeTab, setActiveTab] = useState<"all" | "in-progress" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const shouldRedirectToLogin = !isPending && !session?.user;

  useEffect(() => {
    if (shouldRedirectToLogin) router.replace("/login");
  }, [router, shouldRedirectToLogin]);

  useEffect(() => {
    if (!session?.user?.id) return;
    setLoading(true);
    fetchDashboard(session.user.id)
      .then((d) => {
        setEnrollments(d.enrollments);
        setProgressMap(d.progressData);
        setUserReviews(d.reviews);
      })
      .catch((e) => {
        console.error(e);
        toast.error("Failed to load your courses.");
      })
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
      toast.success("Courses refreshed.");
    } catch {
      toast.error("Failed to refresh.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleUnenroll = async (enrollmentId: string) => {
    setUnenrollingId(enrollmentId);
    try {
      const res = await fetch(`/api/enrollments/${enrollmentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setEnrollments((p) => p.filter((e) => e.id !== enrollmentId));
      setProgressMap((p) => {
        const n = { ...p };
        delete n[enrollmentId];
        return n;
      });
      toast.success("Unenrolled successfully.");
    } catch {
      toast.error("Failed to unenroll.");
    } finally {
      setUnenrollingId(null);
      setConfirmUnenroll(null);
    }
  };

  const handleOpenReview = (courseId: string, courseTitle: string) => {
    const existing = userReviews[courseId];
    setReviewCourse({
      id: courseId,
      title: courseTitle,
      existingRating: existing?.rating,
      existingComment: existing?.comment ?? undefined,
    });
    setReviewRating(existing?.rating ?? 0);
    setReviewComment(existing?.comment ?? "");
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewCourse || reviewRating === 0) {
      toast.error("Please select a rating.");
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: reviewCourse.id,
          rating: reviewRating,
          comment: reviewComment.trim() || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      const review = await res.json();
      setUserReviews((p) => ({
        ...p,
        [reviewCourse.id]: {
          course: { id: reviewCourse.id },
          rating: review.rating,
          comment: review.comment,
        },
      }));
      toast.success("Review submitted!");
      setReviewDialogOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // ── Derived list ───────────────────────────────────────────────────────────
  const enriched = useMemo(() => {
    return enrollments.map((e) => {
      const p = progressMap[e.id];
      const actualProgress = p?.progress ?? e.progress;
      const totalLessons = p?.totalLessons ?? e.course.lessons.length;
      const lessonProgress = p?.lessonProgress ?? {};
      const completedLessons = Math.round((actualProgress / 100) * totalLessons);
      return { enrollment: e, actualProgress, totalLessons, completedLessons, lessonProgress };
    });
  }, [enrollments, progressMap]);

  const filteredCourses = useMemo(() => {
    return enriched.filter(({ enrollment, actualProgress }) => {
      // Tab filter
      if (activeTab === "in-progress" && actualProgress >= 100) return false;
      if (activeTab === "completed" && actualProgress < 100) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = enrollment.course.title.toLowerCase().includes(q);
        const catMatch = enrollment.course.category.toLowerCase().includes(q);
        const instrMatch = enrollment.course.instructor.name.toLowerCase().includes(q);
        return titleMatch || catMatch || instrMatch;
      }
      return true;
    });
  }, [enriched, activeTab, searchQuery]);

  const completedCourses = enriched.filter((e) => e.actualProgress === 100);
  const activeCourses = enriched.filter((e) => e.actualProgress < 100);

  if (shouldRedirectToLogin || isPending || loading) {
    return (
      <LearnerShell pageTitle="My Courses" pageDescription="Loading your enrolled courses...">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
          <Skeleton className="h-10 w-48 rounded-2xl" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        </div>
      </LearnerShell>
    );
  }

  return (
    <LearnerShell
      pageTitle="My Courses"
      pageDescription="Manage your enrolled courses, certificates, and reviews"
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        {/* Top Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
          {/* Tab buttons */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border w-fit">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors",
                activeTab === "all"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              All ({enriched.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("in-progress")}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors",
                activeTab === "in-progress"
                  ? "bg-card text-[#ff6636] shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              In Progress ({activeCourses.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("completed")}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors",
                activeTab === "completed"
                  ? "bg-card text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Completed ({completedCourses.length})
            </button>
          </div>

          {/* Search input + Refresh */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by course or topic..."
                className="w-full rounded-xl border border-border bg-card pl-9 pr-3 py-1.5 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:border-[#ff6636]/50 focus:outline-none"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="rounded-xl text-xs font-semibold"
            >
              <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Course Grid */}
        {filteredCourses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center space-y-4">
            <BookOpen className="size-10 text-muted-foreground/40 mx-auto" />
            <h3 className="text-base font-bold text-foreground">
              {searchQuery ? "No matching courses found" : "No courses in this tab"}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto font-medium">
              {searchQuery
                ? "Try adjusting your search keyword."
                : "Explore our catalog to find your next development course."}
            </p>
            {!searchQuery && (
              <Link
                href="/courses"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#ff6636] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#e95a2b] transition-colors"
              >
                Browse Catalog <ArrowRight className="size-3.5" />
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCourses.map(
              ({ enrollment, actualProgress, totalLessons, completedLessons, lessonProgress }) => (
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
              )
            )}
          </div>
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {reviewCourse?.existingRating ? "Update Your Review" : "Write a Review"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="text-xs text-muted-foreground mb-1 font-medium">{reviewCourse?.title}</p>
              <div className="flex items-center gap-1.5">
                <StarRating rating={reviewRating} onRatingChange={setReviewRating} interactive size="lg" />
                <span className="text-xs font-bold text-[#ff6636] ml-2">
                  {reviewRating > 0 ? `${reviewRating} / 5` : "Select rating"}
                </span>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-foreground">Your Thoughts (optional)</label>
              <Textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="What did you think of the curriculum, code exercises, and pacing?"
                className="mt-1 text-xs rounded-xl border-border resize-none"
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={submittingReview || reviewRating === 0}
              className="rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] text-white text-xs font-bold"
            >
              {submittingReview ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
              Submit Review
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unenroll Confirm Alert */}
      <AlertDialog
        open={Boolean(confirmUnenroll)}
        onOpenChange={(open) => !open && setConfirmUnenroll(null)}
      >
        <AlertDialogContent className="rounded-2xl border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">Unenroll from course?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed font-medium">
              Are you sure you want to unenroll? Your lesson completion history for this course will be reset.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmUnenroll && handleUnenroll(confirmUnenroll)}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-bold"
            >
              Yes, Unenroll
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </LearnerShell>
  );
}
