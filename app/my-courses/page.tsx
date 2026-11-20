"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock3,
  Compass,
  FolderCode,
  GraduationCap,
  Loader2,
  Play,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  LearnerPageShell,
  LearnerWorkspaceNav,
} from "@/components/lms/learner-workspace-nav";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/ui/star-rating";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import {
  formatCourseLevel,
  formatDuration,
  getCategoryMeta,
  getInitials,
  getLevelBadgeClass,
} from "@/lib/learner-ui";
import { getProxiedImageUrl } from "@/lib/s3-utils";
import {
  getCatalogBasePath,
  isProjectTutorial,
  type ContentType,
  type ContentTypeFilter,
} from "@/lib/content-type";
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
    contentType?: ContentType;
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

interface ProgressRecord {
  progress: number;
  completedLessons: number;
  totalLessons: number;
  lessonProgress: Record<string, boolean>;
}

type SortOption = "newest" | "progress-desc" | "title-asc";

// ─── API Helpers ──────────────────────────────────────────────────────────────

async function fetchUserReviews(
  userId: string,
): Promise<Record<string, UserReview>> {
  try {
    const res = await fetch(`/api/reviews?userId=${userId}`, {
      cache: "no-store",
    });
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

async function fetchProgressData(
  enrollments: Enrollment[],
): Promise<Record<string, ProgressRecord>> {
  const entries = await Promise.all(
    enrollments.map(async (e) => {
      const fallbackTotal = e.course.lessons.length;
      const fallbackCompleted = Math.round((e.progress / 100) * fallbackTotal);
      try {
        const res = await fetch(
          `/api/enrollments/${e.id}/progress?t=${Date.now()}`,
          { cache: "no-store" },
        );
        if (!res.ok) {
          return [
            e.id,
            {
              progress: e.progress,
              completedLessons: fallbackCompleted,
              totalLessons: fallbackTotal,
              lessonProgress: {},
            },
          ] as const;
        }
        const p: {
          progress?: number;
          completedLessons?: number;
          totalLessons?: number;
          lessonProgress?: Record<string, boolean>;
        } = await res.json();

        const totalLessons = p.totalLessons ?? fallbackTotal;
        const progress = p.progress ?? e.progress;
        const completedLessons =
          p.completedLessons ?? Math.round((progress / 100) * totalLessons);

        return [
          e.id,
          {
            progress,
            completedLessons,
            totalLessons,
            lessonProgress: p.lessonProgress ?? {},
          },
        ] as const;
      } catch {
        return [
          e.id,
          {
            progress: e.progress,
            completedLessons: fallbackCompleted,
            totalLessons: fallbackTotal,
            lessonProgress: {},
          },
        ] as const;
      }
    }),
  );
  return Object.fromEntries(entries);
}

async function fetchMyCoursesData(userId: string) {
  const res = await fetch("/api/enrollments", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch enrollments");
  const enrollments: Enrollment[] = await res.json();
  const [progressData, reviews] = await Promise.all([
    fetchProgressData(enrollments),
    fetchUserReviews(userId),
  ]);
  return { enrollments, progressData, reviews };
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
  const isComplete = actualProgress >= 100;
  const cat = getCategoryMeta(course.category);
  const CatIcon = cat.icon;

  const sortedLessons = course.lessons
    .slice()
    .sort((a, b) => a.order - b.order);
  const completedIds = new Set(
    Object.entries(lessonProgress)
      .filter(([, v]) => v)
      .map(([k]) => k),
  );
  const nextLesson =
    sortedLessons.find((l) => !completedIds.has(l.id)) ??
    sortedLessons[0] ??
    null;
  const isProject = isProjectTutorial(course.contentType);
  const basePath = getCatalogBasePath(course.contentType);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#ff6636]/40 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/40">
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted/40">
        <Link href={`${basePath}/${course.slug}`} className="block h-full w-full">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={course.title}
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#ff8f6a] via-[#ff6636] to-[#1d2026]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </Link>

        {/* Top badges */}
        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-center justify-between gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide backdrop-blur-md",
              isComplete
                ? "bg-emerald-500/85 text-white border border-emerald-400/30"
                : actualProgress > 0
                  ? "bg-[#ff6636]/90 text-white border border-white/15"
                  : "bg-black/60 border border-white/10 text-white",
            )}
          >
            {isComplete
              ? "Completed"
              : actualProgress > 0
                ? "In Progress"
                : "Not Started"}
          </span>

          <button
            type="button"
            onClick={() => onUnenroll(enrollment.id)}
            disabled={unenrollingId === enrollment.id}
            className="pointer-events-auto flex size-7 items-center justify-center rounded-lg border border-white/15 bg-black/50 text-white backdrop-blur-sm hover:border-red-400/60 hover:bg-red-500/80 transition-all duration-200"
            aria-label={`Unenroll from ${course.title}`}
            title="Unenroll from course"
          >
            {unenrollingId === enrollment.id ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
          </button>
        </div>

        {/* Category + Type + Ring */}
        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white backdrop-blur-md border",
                isProject
                  ? "bg-violet-600/85 border-violet-400/30"
                  : "bg-[#ff6636]/85 border-white/15",
              )}
            >
              {isProject ? <FolderCode className="size-2.5" /> : <BookOpen className="size-2.5" />}
              {isProject ? "Project" : "Course"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-md">
              <CatIcon className="size-3" />
              {cat.label}
            </span>
          </div>

          <div className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm">
            <svg className="size-11 -rotate-90" viewBox="0 0 48 48">
              <circle
                cx="24"
                cy="24"
                r="19"
                fill="none"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth="3.5"
              />
              <circle
                cx="24"
                cy="24"
                r="19"
                fill="none"
                stroke={isComplete ? "#22c55e" : "#ff6636"}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 19}`}
                strokeDashoffset={`${2 * Math.PI * 19 * (1 - actualProgress / 100)}`}
                className="transition-all duration-700"
              />
            </svg>
            <span className="absolute text-[10px] font-extrabold text-white">
              {actualProgress}%
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5 space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full font-bold text-[10px]",
                cat.theme.bg,
                cat.theme.text,
              )}
            >
              {getInitials(course.instructor.name)}
            </div>
            <span className="text-xs font-semibold text-muted-foreground truncate">
              {course.instructor.name}
            </span>
          </div>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase shrink-0",
              getLevelBadgeClass(course.level),
            )}
          >
            {formatCourseLevel(course.level)}
          </span>
        </div>

        <div className="flex-1 space-y-1.5">
          <Link href={`${basePath}/${course.slug}`} className="block">
            <h3 className="text-sm font-bold leading-snug text-foreground line-clamp-2 group-hover:text-[#ff6636] transition-colors">
              {course.title}
            </h3>
          </Link>
          <p className="text-xs font-medium text-muted-foreground line-clamp-2 leading-relaxed">
            {course.description}
          </p>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5 pt-2 border-t border-border/60">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-muted-foreground">
              {completedLessons}/{totalLessons} lessons
            </span>
            <span
              className={
                isComplete
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-[#ff6636]"
              }
            >
              {actualProgress}%
            </span>
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

        {/* Meta row */}
        <div className="flex items-center gap-3 text-[11px] font-semibold text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="size-3.5 text-[#ff6636]" />
            {totalLessons} lessons
          </span>
          <span className="flex items-center gap-1">
            <Clock3 className="size-3.5" />
            {formatDuration(course.durationMinutes)}
          </span>
        </div>

        {/* Actions */}
        <div className="pt-1">
          {isComplete ? (
            <div className="grid grid-cols-2 gap-2">
              <Link
                href={`/certificates/${enrollment.id}`}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-foreground py-2.5 px-3 text-xs font-bold text-background hover:bg-foreground/90 transition-colors"
              >
                <Award className="size-3.5" /> Certificate
              </Link>
              <button
                type="button"
                onClick={() => onReview(course.id, course.title)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2.5 px-3 text-xs font-bold text-foreground hover:border-[#ff6636]/50 hover:text-[#ff6636] transition-all"
              >
                <Star
                  className={cn(
                    "size-3.5",
                    hasReview ? "fill-[#fd8e1f] text-[#fd8e1f]" : "",
                  )}
                />
                {hasReview ? "Edit Review" : "Review"}
              </button>
            </div>
          ) : nextLesson ? (
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Link
                href={`${basePath}/${course.slug}/lessons/${nextLesson.id}`}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] py-2.5 px-3 text-xs font-bold text-white transition-colors"
              >
                <Play className="size-3.5 fill-current" />
                {actualProgress > 0
                  ? "Continue"
                  : isProject
                    ? "Start Project"
                    : "Start Course"}
              </Link>
              <Link
                href={`${basePath}/${course.slug}`}
                className="flex items-center justify-center rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-xs font-bold text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] transition-colors"
              >
                {isProject ? "Overview" : "Syllabus"}
              </Link>
            </div>
          ) : (
            <Link
              href={`${basePath}/${course.slug}`}
              className="flex w-full items-center justify-center rounded-xl border border-border bg-muted/30 py-2.5 text-xs font-bold text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] transition-colors"
            >
              {isProject ? "View Project" : "View Course"}
            </Link>
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
  const [reviewCourse, setReviewCourse] = useState<{
    id: string;
    title: string;
    existingRating?: number;
    existingComment?: string;
  } | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [userReviews, setUserReviews] = useState<Record<string, UserReview>>(
    {},
  );
  const [progressMap, setProgressMap] = useState<
    Record<string, ProgressRecord>
  >({});

  const [activeTab, setActiveTab] = useState<
    "all" | "in-progress" | "completed"
  >("all");
  const [contentTypeFilter, setContentTypeFilter] =
    useState<ContentTypeFilter>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [searchQuery, setSearchQuery] = useState("");

  const shouldRedirectToLogin = !isPending && !session?.user;

  useEffect(() => {
    if (shouldRedirectToLogin) router.replace("/login");
  }, [router, shouldRedirectToLogin]);

  useEffect(() => {
    if (!session?.user?.id) return;
    setLoading(true);
    fetchMyCoursesData(session.user.id)
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
      const d = await fetchMyCoursesData(session.user.id);
      setEnrollments(d.enrollments);
      setProgressMap(d.progressData);
      setUserReviews(d.reviews);
      toast.success("Courses refreshed.");
    } catch {
      toast.error("Failed to refresh courses.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleUnenroll = async (enrollmentId: string) => {
    setUnenrollingId(enrollmentId);
    try {
      const res = await fetch(`/api/enrollments/${enrollmentId}`, {
        method: "DELETE",
      });
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
        throw new Error(d.error || "Failed to submit review");
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
      toast.success("Review saved!");
      setReviewDialogOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const enriched = useMemo(() => {
    return enrollments.map((e) => {
      const p = progressMap[e.id];
      const actualProgress = p?.progress ?? e.progress;
      const totalLessons = p?.totalLessons ?? e.course.lessons.length;
      const completedLessons =
        p?.completedLessons ?? Math.round((actualProgress / 100) * totalLessons);
      const lessonProgress = p?.lessonProgress ?? {};
      return {
        enrollment: e,
        actualProgress,
        totalLessons,
        completedLessons,
        lessonProgress,
      };
    });
  }, [enrollments, progressMap]);

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(enrollments.map((e) => e.course.category).filter(Boolean)),
    );
    return unique;
  }, [enrollments]);

  const completedCourses = useMemo(
    () => enriched.filter((e) => e.actualProgress >= 100),
    [enriched],
  );
  const activeCourses = useMemo(
    () => enriched.filter((e) => e.actualProgress < 100),
    [enriched],
  );
  const avgProgress = useMemo(() => {
    if (enriched.length === 0) return 0;
    return Math.round(
      enriched.reduce((sum, e) => sum + e.actualProgress, 0) / enriched.length,
    );
  }, [enriched]);

  const enrolledCourseCount = useMemo(
    () =>
      enriched.filter(
        (e) => e.enrollment.course.contentType !== "PROJECT_TUTORIAL",
      ).length,
    [enriched],
  );
  const enrolledProjectCount = useMemo(
    () =>
      enriched.filter(
        (e) => e.enrollment.course.contentType === "PROJECT_TUTORIAL",
      ).length,
    [enriched],
  );

  const filteredCourses = useMemo(() => {
    const items = enriched.filter(({ enrollment, actualProgress }) => {
      if (activeTab === "in-progress" && actualProgress >= 100) return false;
      if (activeTab === "completed" && actualProgress < 100) return false;
      if (
        contentTypeFilter === "COURSE" &&
        enrollment.course.contentType === "PROJECT_TUTORIAL"
      ) {
        return false;
      }
      if (
        contentTypeFilter === "PROJECT_TUTORIAL" &&
        enrollment.course.contentType !== "PROJECT_TUTORIAL"
      ) {
        return false;
      }
      if (
        selectedCategory !== "ALL" &&
        enrollment.course.category !== selectedCategory
      ) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = enrollment.course.title.toLowerCase().includes(q);
        const catMatch = enrollment.course.category.toLowerCase().includes(q);
        const instrMatch = enrollment.course.instructor.name
          .toLowerCase()
          .includes(q);
        return titleMatch || catMatch || instrMatch;
      }
      return true;
    });

    const sorted = [...items];
    if (sortBy === "progress-desc") {
      sorted.sort((a, b) => b.actualProgress - a.actualProgress);
    } else if (sortBy === "title-asc") {
      sorted.sort((a, b) =>
        a.enrollment.course.title.localeCompare(b.enrollment.course.title),
      );
    } else {
      sorted.sort(
        (a, b) =>
          new Date(b.enrollment.createdAt).getTime() -
          new Date(a.enrollment.createdAt).getTime(),
      );
    }
    return sorted;
  }, [
    enriched,
    activeTab,
    contentTypeFilter,
    selectedCategory,
    searchQuery,
    sortBy,
  ]);

  const resetFilters = () => {
    setActiveTab("all");
    setContentTypeFilter("ALL");
    setSelectedCategory("ALL");
    setSearchQuery("");
    setSortBy("newest");
  };

  if (shouldRedirectToLogin || isPending || loading) {
    return (
      <LearnerPageShell activePath="/my-courses">
        <section className="border-b border-border/40 bg-[#fff9f7] dark:bg-[#111318] py-10 lg:py-14">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 space-y-8">
            <Skeleton className="h-11 w-full max-w-xl rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-6 w-36 rounded-full" />
              <Skeleton className="h-11 w-80 rounded-xl" />
              <Skeleton className="h-5 w-96 rounded-lg" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))}
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-88 rounded-2xl" />
            ))}
          </div>
        </section>
      </LearnerPageShell>
    );
  }

  return (
    <LearnerPageShell activePath="/my-courses">
      {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border/40 bg-[#fff9f7] dark:bg-[#111318] py-10 lg:py-14">
        <div className="pointer-events-none absolute -top-40 right-0 size-[500px] rounded-full bg-[#ff6636]/5 blur-3xl" />
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 relative space-y-8">
          <LearnerWorkspaceNav activePath="/my-courses" />

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#ff6636]/30 bg-[#ff6636]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-[#ff6636]">
                <GraduationCap className="size-3.5" /> My Learning Library
              </span>
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]">
                Your Enrolled{" "}
                <span className="bg-gradient-to-r from-[#ff6636] to-[#ff9f60] bg-clip-text text-transparent">
                  Courses &amp; Projects
                </span>
              </h1>
              <p className="text-sm sm:text-base font-semibold leading-relaxed text-muted-foreground">
                Resume lessons where you stopped, filter your active tracks, and
                claim certificates or leave reviews as you finish courses.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] disabled:opacity-60 transition-all"
              >
                <RefreshCw
                  className={cn("size-3.5", refreshing && "animate-spin")}
                />
                {refreshing ? "Refreshing…" : "Refresh"}
              </button>

              <Link
                href="/certificates"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] transition-all"
              >
                <Award className="size-4 text-[#ff6636]" /> Certificates (
                {completedCourses.length})
              </Link>

              <Link
                href="/courses"
                className="inline-flex items-center gap-2 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-md shadow-[#ff6636]/20 transition-colors"
              >
                <Compass className="size-4" /> Browse Courses
              </Link>
            </div>
          </div>

          {/* Stats Strip */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Enrolled",
                value: enrollments.length.toString(),
                icon: BookOpen,
                color: "text-[#ff6636]",
                bg: "bg-[#ff6636]/10",
                desc: "Total active & finished paths",
              },
              {
                label: "In Progress",
                value: activeCourses.length.toString(),
                icon: TrendingUp,
                color: "text-violet-500",
                bg: "bg-violet-500/10",
                desc: "Currently underway",
              },
              {
                label: "Completed",
                value: completedCourses.length.toString(),
                icon: CheckCircle2,
                color: "text-emerald-500",
                bg: "bg-emerald-500/10",
                desc: "Eligible for certificates",
              },
              {
                label: "Avg Progress",
                value: `${avgProgress}%`,
                icon: Sparkles,
                color: "text-amber-500",
                bg: "bg-amber-500/10",
                desc: "Overall syllabus completion",
              },
            ].map((stat) => {
              const SIcon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-2xs"
                >
                  <div
                    className={cn(
                      "flex size-12 shrink-0 items-center justify-center rounded-2xl",
                      stat.bg,
                      stat.color,
                    )}
                  >
                    <SIcon className="size-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold tracking-tight text-foreground">
                      {stat.value}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-[10px] font-semibold text-muted-foreground/80 mt-0.5">
                      {stat.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Filter & Sort Bar ───────────────────────────────────────────────── */}
      <div className="border-b border-border/40 bg-card py-4">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Content Type Tabs */}
              <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-muted/50 p-1 w-fit">
                <button
                  type="button"
                  onClick={() => setContentTypeFilter("ALL")}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                    contentTypeFilter === "ALL"
                      ? "bg-foreground text-background shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  All ({enriched.length})
                </button>
                <button
                  type="button"
                  onClick={() => setContentTypeFilter("COURSE")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                    contentTypeFilter === "COURSE"
                      ? "bg-[#ff6636] text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <BookOpen className="size-3" />
                  Courses ({enrolledCourseCount})
                </button>
                <button
                  type="button"
                  onClick={() => setContentTypeFilter("PROJECT_TUTORIAL")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                    contentTypeFilter === "PROJECT_TUTORIAL"
                      ? "bg-violet-600 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <FolderCode className="size-3" />
                  Projects ({enrolledProjectCount})
                </button>
              </div>

              {/* Status Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-muted/50 p-1 w-fit">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={cn(
                    "rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all",
                    activeTab === "all"
                      ? "bg-[#ff6636] text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Any Status
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("in-progress")}
                  className={cn(
                    "rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all",
                    activeTab === "in-progress"
                      ? "bg-[#ff6636] text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  In Progress ({activeCourses.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("completed")}
                  className={cn(
                    "rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all",
                    activeTab === "completed"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Completed ({completedCourses.length})
                </button>
              </div>
            </div>

            {/* Search, Category & Sort Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 lg:max-w-2xl lg:justify-end">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search enrolled courses, category, instructor..."
                  className="h-10 w-full rounded-xl border border-border bg-background pl-10 pr-9 text-xs font-medium text-foreground placeholder:text-muted-foreground/70 focus:border-[#ff6636]/60 focus:outline-none focus:ring-2 focus:ring-[#ff6636]/10"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {categories.length > 1 && (
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="h-10 w-full sm:w-44 rounded-xl border-border bg-background text-xs font-semibold">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border bg-popover">
                    <SelectItem value="ALL" className="text-xs font-semibold">
                      All Categories
                    </SelectItem>
                    {categories.map((cat) => (
                      <SelectItem
                        key={cat}
                        value={cat}
                        className="text-xs font-semibold"
                      >
                        {getCategoryMeta(cat).label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select
                value={sortBy}
                onValueChange={(v) => setSortBy(v as SortOption)}
              >
                <SelectTrigger className="h-10 w-full sm:w-44 rounded-xl border-border bg-background text-xs font-semibold">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border bg-popover">
                  <SelectItem value="newest" className="text-xs font-semibold">
                    Recently Enrolled
                  </SelectItem>
                  <SelectItem
                    value="progress-desc"
                    className="text-xs font-semibold"
                  >
                    Highest Progress
                  </SelectItem>
                  <SelectItem
                    value="title-asc"
                    className="text-xs font-semibold"
                  >
                    Title (A–Z)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Courses Grid ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
        {filteredCourses.length === 0 ? (
          <div className="flex min-h-[24rem] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-8 py-16 text-center space-y-4">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-[#ff6636]/10 text-[#ff6636]">
              <BookOpen className="size-8" />
            </div>
            <h2 className="text-xl font-extrabold text-foreground">
              {searchQuery || selectedCategory !== "ALL" || activeTab !== "all"
                ? "No courses match your filters"
                : "No enrolled courses yet"}
            </h2>
            <p className="text-sm text-muted-foreground max-w-md font-semibold leading-relaxed">
              {searchQuery || selectedCategory !== "ALL" || activeTab !== "all"
                ? "Try clearing your search or switching back to all enrolled courses."
                : "Explore the catalog, enroll in a course, and your learning library will appear right here."}
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-1">
              {(searchQuery ||
                selectedCategory !== "ALL" ||
                activeTab !== "all") && (
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="rounded-xl text-xs font-bold"
                >
                  Reset Filters
                </Button>
              )}
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 rounded-xl bg-[#ff6636] px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white hover:bg-[#e95a2b] transition-colors"
              >
                Browse Catalog <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCourses.map(
              ({
                enrollment,
                actualProgress,
                totalLessons,
                completedLessons,
                lessonProgress,
              }) => (
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
              ),
            )}
          </div>
        )}
      </section>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold">
              {reviewCourse?.existingRating
                ? "Update Your Review"
                : "Write a Course Review"}
            </DialogTitle>
            <DialogDescription className="text-xs font-semibold text-muted-foreground">
              {reviewCourse?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-bold text-foreground block mb-2">
                Your Rating
              </label>
              <div className="flex items-center gap-2">
                <StarRating
                  rating={reviewRating}
                  onRatingChange={setReviewRating}
                  interactive
                  size="lg"
                />
                <span className="text-xs font-bold text-[#ff6636] ml-1">
                  {reviewRating > 0 ? `${reviewRating} / 5` : "Select rating"}
                </span>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-foreground">
                Your Review (optional)
              </label>
              <Textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="What did you appreciate about the curriculum, exercises, and pacing?"
                className="mt-1.5 text-xs rounded-xl border-border resize-none"
                rows={4}
                maxLength={1000}
              />
              <p className="mt-1 text-[10px] font-medium text-muted-foreground text-right">
                {reviewComment.length}/1000
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
              className="rounded-xl text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={submittingReview || reviewRating === 0}
              className="rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] text-white text-xs font-bold"
            >
              {submittingReview ? (
                <Loader2 className="size-3.5 animate-spin mr-1.5" />
              ) : null}
              {reviewCourse?.existingRating ? "Update Review" : "Submit Review"}
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
            <AlertDialogTitle className="text-base font-extrabold">
              Unenroll from course?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed font-medium">
              Are you sure you want to unenroll? Your enrollment record for this
              course will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl text-xs font-bold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmUnenroll && handleUnenroll(confirmUnenroll)}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-bold"
            >
              Yes, Unenroll
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </LearnerPageShell>
  );
}
