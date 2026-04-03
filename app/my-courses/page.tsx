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
import { getS3PublicUrl } from "@/lib/s3-utils";
import { toast } from "sonner";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Clock3,
  GraduationCap,
  Loader2,
  RefreshCw,
  Sparkles,
  Star,
  Tag,
  Trash2,
} from "lucide-react";

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
    lessons: {
      id: string;
      title: string;
      order: number;
    }[];
    instructor: {
      name: string;
    };
  };
}

interface UserReview {
  course: {
    id: string;
  };
  rating: number;
  comment?: string | null;
}

async function fetchUserReviews(
  userId: string,
): Promise<Record<string, UserReview>> {
  try {
    const response = await fetch(`/api/reviews?userId=${userId}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return {};
    }

    const data: { reviews?: UserReview[] } = await response.json();
    return (data.reviews || []).reduce<Record<string, UserReview>>(
      (accumulator, review) => {
        accumulator[review.course.id] = review;
        return accumulator;
      },
      {},
    );
  } catch (error) {
    console.error("Failed to fetch user reviews:", error);
    return {};
  }
}

async function fetchProgressData(enrollmentsData: Enrollment[]) {
  const entries = await Promise.all(
    enrollmentsData.map(async (enrollment) => {
      try {
        const response = await fetch(
          `/api/enrollments/${enrollment.id}/progress?t=${Date.now()}`,
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          return [
            enrollment.id,
            {
              progress: enrollment.progress,
              totalLessons: enrollment.course.lessons.length,
            },
          ] as const;
        }

        const progress = await response.json();
        return [
          enrollment.id,
          {
            progress: progress.progress,
            totalLessons: progress.totalLessons,
          },
        ] as const;
      } catch (error) {
        console.error(
          `Failed to fetch progress for enrollment ${enrollment.id}:`,
          error,
        );

        return [
          enrollment.id,
          {
            progress: enrollment.progress,
            totalLessons: enrollment.course.lessons.length,
          },
        ] as const;
      }
    }),
  );

  return Object.fromEntries(entries);
}

async function fetchLearningDashboard(userId: string) {
  const response = await fetch("/api/enrollments", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch enrollments");
  }

  const enrollments: Enrollment[] = await response.json();
  const [progressData, reviews] = await Promise.all([
    fetchProgressData(enrollments),
    fetchUserReviews(userId),
  ]);

  return { enrollments, progressData, reviews };
}

function formatDuration(minutes: number | null) {
  if (!minutes) return "Self-paced";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) return `${remainingMinutes} min`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

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
    Record<string, { progress: number; totalLessons: number }>
  >({});

  const shouldRedirectToLogin = !isPending && !session?.user;

  useEffect(() => {
    if (shouldRedirectToLogin) {
      router.replace("/login");
    }
  }, [router, shouldRedirectToLogin]);

  useEffect(() => {
    if (!session?.user?.id) return;
    setLoading(true);
    const userId = session.user.id;

    const run = async () => {
      try {
        const data = await fetchLearningDashboard(userId);
        setEnrollments(data.enrollments);
        setProgressMap(data.progressData);
        setUserReviews(data.reviews);
      } catch (error) {
        console.error("Failed to load enrollments:", error);
        toast.error("Failed to load your courses.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [session?.user?.id]);

  const handleRefresh = async () => {
    if (!session?.user?.id) return;
    setRefreshing(true);
    try {
      const data = await fetchLearningDashboard(session.user.id);
      setEnrollments(data.enrollments);
      setProgressMap(data.progressData);
      setUserReviews(data.reviews);
      toast.success("Learning dashboard updated.");
    } catch (error) {
      console.error("Failed to refresh:", error);
      toast.error("Failed to refresh your courses.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleUnenroll = async (enrollmentId: string) => {
    setUnenrollingId(enrollmentId);
    try {
      const response = await fetch(`/api/enrollments/${enrollmentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to unenroll");
      }

      setEnrollments((previous) =>
        previous.filter((enrollment) => enrollment.id !== enrollmentId),
      );
      setProgressMap((previous) => {
        const next = { ...previous };
        delete next[enrollmentId];
        return next;
      });

      toast.success("Successfully unenrolled from course.");
    } catch (error) {
      console.error("Unenroll error:", error);
      toast.error("Failed to unenroll from course.");
    } finally {
      setUnenrollingId(null);
      setConfirmUnenroll(null);
    }
  };

  const handleOpenReview = (courseId: string, courseTitle: string) => {
    const existingReview = userReviews[courseId];
    setReviewCourse({
      id: courseId,
      title: courseTitle,
      existingRating: existingReview?.rating,
      existingComment: existingReview?.comment ?? undefined,
    });
    setReviewRating(existingReview?.rating || 0);
    setReviewComment(existingReview?.comment || "");
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewCourse || reviewRating === 0) {
      toast.error("Please select a rating.");
      return;
    }

    setSubmittingReview(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: reviewCourse.id,
          rating: reviewRating,
          comment: reviewComment.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit review");
      }

      const review = await response.json();
      setUserReviews((previous) => ({
        ...previous,
        [reviewCourse.id]: {
          course: { id: reviewCourse.id },
          rating: review.rating,
          comment: review.comment,
        },
      }));

      toast.success("Review submitted successfully.");
      setReviewDialogOpen(false);
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to submit review.",
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  const enrollmentsWithProgress = useMemo(
    () =>
      enrollments.map((enrollment) => {
        const progress = progressMap[enrollment.id];
        const actualProgress = progress
          ? progress.progress
          : enrollment.progress;
        const totalLessons = progress
          ? progress.totalLessons
          : enrollment.course.lessons.length;
        const completedLessons = Math.round(
          (actualProgress / 100) * totalLessons,
        );

        return {
          enrollment,
          actualProgress,
          totalLessons,
          completedLessons,
        };
      }),
    [enrollments, progressMap],
  );

  const completedCourses = enrollmentsWithProgress.filter(
    (item) => item.actualProgress === 100,
  );
  const activeCourses = enrollmentsWithProgress.filter(
    (item) => item.actualProgress < 100,
  );
  const averageProgress = enrollmentsWithProgress.length
    ? Math.round(
        enrollmentsWithProgress.reduce(
          (sum, item) => sum + item.actualProgress,
          0,
        ) / enrollmentsWithProgress.length,
      )
    : 0;

  if (shouldRedirectToLogin || isPending || loading) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] text-[#1d2026]">
        <MarketingPublicHeader activePath="/my-courses" showSearch={false} />
        <div className="mx-auto max-w-[1320px] px-4 py-12 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <Skeleton className="h-12 w-64 rounded-none" />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Skeleton className="h-32 rounded-none" />
              <Skeleton className="h-32 rounded-none" />
              <Skeleton className="h-32 rounded-none" />
              <Skeleton className="h-32 rounded-none" />
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              <Skeleton className="h-[420px] rounded-none" />
              <Skeleton className="h-[420px] rounded-none" />
              <Skeleton className="h-[420px] rounded-none" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-[#1d2026]">
      <MarketingPublicHeader activePath="/my-courses" showSearch={false} />

      <main>
        <section className="border-b border-[#e9eaf0] bg-white">
          <div className="mx-auto max-w-[1320px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-[760px]">
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#4e5566] transition hover:text-[#ff6636]"
                >
                  <ArrowLeft className="size-4" />
                  Back to catalog
                </Link>

                <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c94a3]">
                  My learning
                </p>
                <h1 className="mt-3 text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[3.4rem]">
                  Keep moving through your enrolled courses.
                </h1>
                <p className="mt-5 max-w-[680px] text-base leading-8 text-[#6e7485]">
                  Track current progress, jump back into lessons, review
                  completed courses, and manage your active learning paths from
                  one place.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="rounded-none border-[#d7dae0] bg-white px-5 py-3 text-sm font-semibold text-[#1d2026] hover:border-[#ff6636] hover:bg-[#fffaf6] hover:text-[#ff6636]"
                >
                  <RefreshCw
                    className={`mr-2 size-4 ${refreshing ? "animate-spin" : ""}`}
                  />
                  {refreshing ? "Refreshing" : "Refresh"}
                </Button>
                <Link
                  href="/courses"
                  className="inline-flex items-center justify-center bg-[#ff6636] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#e95a2b]"
                >
                  Browse courses
                </Link>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="border border-[#e9eaf0] bg-[#f5f7fa] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c94a3]">
                  Enrolled
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#1d2026]">
                  {enrollments.length}
                </p>
                <p className="mt-2 text-sm leading-7 text-[#6e7485]">
                  Active learning paths in your account.
                </p>
              </div>
              <div className="border border-[#e9eaf0] bg-[#f5f7fa] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c94a3]">
                  In Progress
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#1d2026]">
                  {activeCourses.length}
                </p>
                <p className="mt-2 text-sm leading-7 text-[#6e7485]">
                  Courses with lessons still left to finish.
                </p>
              </div>
              <div className="border border-[#e9eaf0] bg-[#f5f7fa] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c94a3]">
                  Completed
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#1d2026]">
                  {completedCourses.length}
                </p>
                <p className="mt-2 text-sm leading-7 text-[#6e7485]">
                  Courses you can review or certify now.
                </p>
              </div>
              <div className="border border-[#e9eaf0] bg-[#f5f7fa] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c94a3]">
                  Avg Progress
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#1d2026]">
                  {averageProgress}%
                </p>
                <p className="mt-2 text-sm leading-7 text-[#6e7485]">
                  Average completion across your learning queue.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1320px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          {enrollmentsWithProgress.length === 0 ? (
            <div className="border border-dashed border-[#d7dae0] bg-white px-8 py-14 text-center">
              <div className="mx-auto flex size-14 items-center justify-center bg-[#fff2e5] text-[#ff6636]">
                <BookOpen className="size-6" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-[#1d2026]">
                No enrolled courses yet
              </h2>
              <p className="mt-3 text-sm leading-7 text-[#6e7485]">
                Browse the live catalog, pick a learning path, and your
                progress dashboard will start here.
              </p>
              <Link
                href="/courses"
                className="mt-6 inline-flex items-center justify-center bg-[#ff6636] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#e95a2b]"
              >
                Browse courses
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {enrollmentsWithProgress.map(
                ({
                  enrollment,
                  actualProgress,
                  totalLessons,
                  completedLessons,
                }) => {
                  const course = enrollment.course;
                  const imageUrl = course.imageUrl
                    ? getS3PublicUrl(course.imageUrl)
                    : null;
                  const sortedLessons = course.lessons
                    .slice()
                    .sort((a, b) => a.order - b.order);
                  const firstLesson = sortedLessons[0];
                  const hasReview = Boolean(userReviews[course.id]);

                  return (
                    <article
                      key={enrollment.id}
                      className="group overflow-hidden border border-[#e9eaf0] bg-white transition hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(18,24,40,0.08)]"
                    >
                      <div className="relative h-56 overflow-hidden border-b border-[#e9eaf0] bg-[#1d2026]">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={course.title}
                            fill
                            sizes="(max-width: 1279px) 100vw, 33vw"
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-[linear-gradient(135deg,#ff8f6a_0%,#ff6636_45%,#1d2026_100%)]" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1d2026] via-[#1d2026]/25 to-transparent" />
                        <div className="absolute left-0 right-0 top-0 flex items-start justify-between gap-3 p-4">
                          <span className="bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1d2026]">
                            {course.category}
                          </span>
                          <button
                            type="button"
                            onClick={() => setConfirmUnenroll(enrollment.id)}
                            disabled={unenrollingId === enrollment.id}
                            className="inline-flex size-10 items-center justify-center border border-white/15 bg-white/10 text-white backdrop-blur transition hover:border-[#ff6636] hover:bg-[#ff6636]"
                            aria-label="Unenroll from course"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="border border-white/15 bg-white/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] backdrop-blur">
                              {course.level}
                            </span>
                            <span className="border border-white/15 bg-white/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] backdrop-blur">
                              {actualProgress === 100 ? "Completed" : "In Progress"}
                            </span>
                          </div>
                          <h2 className="mt-4 text-2xl font-semibold leading-tight tracking-[-0.03em]">
                            {course.title}
                          </h2>
                        </div>
                      </div>

                      <div className="space-y-5 p-5">
                        <p className="line-clamp-3 text-sm leading-7 text-[#6e7485]">
                          {course.description}
                        </p>

                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-2 bg-[#fff2e5] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ff6636]">
                            <Tag className="size-3.5" />
                            {course.category}
                          </span>
                          <span className="inline-flex items-center gap-2 border border-[#e9eaf0] bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4e5566]">
                            <GraduationCap className="size-3.5 text-[#ff6636]" />
                            {course.level}
                          </span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="border border-[#e9eaf0] bg-[#f5f7fa] px-4 py-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c94a3]">
                              Lessons
                            </p>
                            <p className="mt-2 text-base font-semibold text-[#1d2026]">
                              {totalLessons}
                            </p>
                          </div>
                          <div className="border border-[#e9eaf0] bg-[#f5f7fa] px-4 py-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c94a3]">
                              Duration
                            </p>
                            <p className="mt-2 text-base font-semibold text-[#1d2026]">
                              {formatDuration(course.durationMinutes)}
                            </p>
                          </div>
                          <div className="border border-[#e9eaf0] bg-[#f5f7fa] px-4 py-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c94a3]">
                              Progress
                            </p>
                            <p className="mt-2 text-base font-semibold text-[#1d2026]">
                              {actualProgress}%
                            </p>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[#6e7485]">
                              {completedLessons}/{totalLessons} lessons completed
                            </span>
                            <span className="font-semibold text-[#1d2026]">
                              {actualProgress}%
                            </span>
                          </div>
                          <Progress
                            value={actualProgress}
                            className="mt-3 h-2 bg-[#e9eaf0]"
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-[#6e7485]">
                          <span className="inline-flex items-center gap-2">
                            <BookOpen className="size-4 text-[#ff6636]" />
                            {course.lessons.length} lessons
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <Clock3 className="size-4 text-[#ff6636]" />
                            {formatDuration(course.durationMinutes)}
                          </span>
                        </div>

                        <p className="text-sm font-medium text-[#4e5566]">
                          By {course.instructor.name}
                        </p>

                        {actualProgress === 100 ? (
                          <div className="grid gap-3">
                            <Link
                              href={`/certificates/${enrollment.id}`}
                              className="inline-flex items-center justify-center bg-[#1d2026] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#111318]"
                            >
                              <Award className="mr-2 size-4" />
                              View certificate
                            </Link>
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenReview(course.id, course.title)
                              }
                              className="inline-flex items-center justify-center border border-[#d7dae0] bg-white px-5 py-3 text-sm font-semibold text-[#1d2026] transition hover:border-[#ff6636] hover:bg-[#fffaf6] hover:text-[#ff6636]"
                            >
                              <Star
                                className={`mr-2 size-4 ${
                                  hasReview
                                    ? "fill-[#fd8e1f] text-[#fd8e1f]"
                                    : "text-[#ff6636]"
                                }`}
                              />
                              {hasReview ? "Update review" : "Write review"}
                            </button>
                          </div>
                        ) : firstLesson ? (
                          <Link
                            href={`/courses/${course.slug}/lessons/${firstLesson.id}`}
                            className="inline-flex items-center justify-center bg-[#ff6636] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#e95a2b]"
                          >
                            <Sparkles className="mr-2 size-4" />
                            Continue learning
                          </Link>
                        ) : (
                          <div className="inline-flex items-center justify-center border border-dashed border-[#d7dae0] bg-[#f5f7fa] px-5 py-3 text-sm font-semibold text-[#8c94a3]">
                            No lessons available
                          </div>
                        )}
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          )}
        </section>
      </main>

      <MarketingPublicFooter />

      <AlertDialog
        open={Boolean(confirmUnenroll)}
        onOpenChange={(open) => !open && setConfirmUnenroll(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unenroll from this course?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the course from your learning dashboard and clears
              your saved progress for it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                confirmUnenroll && handleUnenroll(confirmUnenroll)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Unenroll
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewCourse?.existingRating
                ? "Update your review"
                : "Write a review"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-[#4e5566]">
                {reviewCourse?.title}
              </p>
              <div className="mt-3">
                <StarRating
                  rating={reviewRating}
                  size="lg"
                  interactive
                  onChange={setReviewRating}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1d2026]">
                Comment
              </label>
              <Textarea
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
                placeholder="Share what this course did well and where it helped most."
                rows={5}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setReviewDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmitReview}
                disabled={submittingReview}
              >
                {submittingReview ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving
                  </>
                ) : reviewCourse?.existingRating ? (
                  "Update review"
                ) : (
                  "Submit review"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
