"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Flag, Loader2, Pencil, Star, Trash2 } from "lucide-react";

import {
  AdminPage,
  AdminPageHeader,
  AdminPanel,
} from "@/components/admin/admin-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";

type AdminCourseOption = {
  id: string;
  title: string;
  category: string;
  level: string;
};

type ModerationReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  flagged: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  course: {
    id: string;
    title: string;
    slug: string;
    category: string;
    level: string;
  };
};

export default function AdminReviewsPage() {
  const { data: session, isPending } = authClient.useSession();

  const [courses, setCourses] = useState<AdminCourseOption[]>([]);
  const [moderationReviews, setModerationReviews] = useState<ModerationReview[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [moderationLoading, setModerationLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionReviewId, setActionReviewId] = useState<string | null>(null);

  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCourseId, setFilterCourseId] = useState("all");
  const [filterRating, setFilterRating] = useState("all");
  const [flaggedFilter, setFlaggedFilter] = useState("all");

  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState("");

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId),
    [courses, selectedCourseId],
  );

  const loadModerationReviews = async () => {
    setModerationLoading(true);

    try {
      const response = await fetch("/api/admin/reviews", { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Failed to load reviews");
      }

      const data: { reviews?: ModerationReview[] } = await response.json();
      setModerationReviews(data.reviews || []);
    } catch (error) {
      console.error("Failed to load moderation reviews:", error);
      toast.error("Failed to load platform reviews.");
    } finally {
      setModerationLoading(false);
    }
  };

  useEffect(() => {
    if (!session?.user?.id) {
      if (!isPending) {
        setLoading(false);
        setModerationLoading(false);
      }
      return;
    }

    const load = async () => {
      try {
        const [coursesResponse, moderationResponse] = await Promise.all([
          fetch("/api/admin/courses", { cache: "no-store" }),
          fetch("/api/admin/reviews", { cache: "no-store" }),
        ]);

        if (!coursesResponse.ok) {
          throw new Error("Failed to load courses");
        }

        if (!moderationResponse.ok) {
          throw new Error("Failed to load moderation reviews");
        }

        const coursesData: Array<{
          id: string;
          title: string;
          category: string;
          level: string;
        }> = await coursesResponse.json();

        const moderationData: { reviews?: ModerationReview[] } =
          await moderationResponse.json();

        setCourses(
          coursesData
            .map((course) => ({
              id: course.id,
              title: course.title,
              category: course.category,
              level: course.level,
            }))
            .sort((a, b) => a.title.localeCompare(b.title)),
        );

        setModerationReviews(moderationData.reviews || []);
      } catch (error) {
        console.error("Failed to load reviews admin page:", error);
        toast.error("Failed to load reviews page data.");
      } finally {
        setLoading(false);
        setModerationLoading(false);
      }
    };

    void load();
  }, [isPending, session?.user?.id]);

  const filteredReviews = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return moderationReviews.filter((review) => {
      if (filterCourseId !== "all" && review.course.id !== filterCourseId) {
        return false;
      }

      if (filterRating !== "all" && review.rating !== Number(filterRating)) {
        return false;
      }

      if (flaggedFilter === "flagged" && !review.flagged) {
        return false;
      }

      if (flaggedFilter === "unflagged" && review.flagged) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const commentText = review.comment || "";

      return (
        review.user.name.toLowerCase().includes(normalizedSearch) ||
        review.user.email.toLowerCase().includes(normalizedSearch) ||
        review.course.title.toLowerCase().includes(normalizedSearch) ||
        commentText.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [moderationReviews, searchQuery, filterCourseId, filterRating, flaggedFilter]);

  const handleSubmitOwnReview = async () => {
    if (!selectedCourseId) {
      toast.error("Select a course first.");
      return;
    }

    if (rating < 1 || rating > 5) {
      toast.error("Choose a rating from 1 to 5 stars.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourseId,
          rating,
          comment: comment.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit review");
      }

      await loadModerationReviews();
      toast.success("Review saved.");
    } catch (error) {
      console.error("Failed to submit review:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to submit review.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    const confirmed = window.confirm(
      "Delete this review? This action cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    setActionReviewId(reviewId);

    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete review");
      }

      setModerationReviews((previous) =>
        previous.filter((review) => review.id !== reviewId),
      );
      if (editingReviewId === reviewId) {
        setEditingReviewId(null);
      }
      toast.success("Review deleted.");
    } catch (error) {
      console.error("Failed to delete review:", error);
      toast.error("Failed to delete review.");
    } finally {
      setActionReviewId(null);
    }
  };

  const handleToggleFlag = async (reviewId: string, flagged: boolean) => {
    setActionReviewId(reviewId);

    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flagged }),
      });

      if (!response.ok) {
        throw new Error("Failed to update flag state");
      }

      setModerationReviews((previous) =>
        previous.map((review) =>
          review.id === reviewId ? { ...review, flagged } : review,
        ),
      );

      toast.success(flagged ? "Review flagged." : "Review unflagged.");
    } catch (error) {
      console.error("Failed to toggle flag:", error);
      toast.error("Failed to update flag state.");
    } finally {
      setActionReviewId(null);
    }
  };

  const handleStartEdit = (review: ModerationReview) => {
    setEditingReviewId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment || "");
  };

  const handleSaveEdit = async (reviewId: string) => {
    if (editRating < 1 || editRating > 5) {
      toast.error("Choose a rating from 1 to 5 stars.");
      return;
    }

    setActionReviewId(reviewId);

    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: editRating,
          comment: editComment.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update review");
      }

      const updated: ModerationReview = await response.json();

      setModerationReviews((previous) =>
        previous.map((review) =>
          review.id === reviewId
            ? { ...review, ...updated, flagged: review.flagged }
            : review,
        ),
      );

      setEditingReviewId(null);
      toast.success("Review updated.");
    } catch (error) {
      console.error("Failed to update review:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update review.",
      );
    } finally {
      setActionReviewId(null);
    }
  };

  const flaggedCount = moderationReviews.filter((review) => review.flagged).length;

  if (loading) {
    return (
      <AdminPage>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AdminPage>
    );
  }

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Community"
        title="Reviews"
        description="Create your own review and moderate all platform feedback from one workspace."
        meta={
          <>
            <Badge variant="outline">Total: {moderationReviews.length}</Badge>
            <Badge variant="outline">Flagged: {flaggedCount}</Badge>
          </>
        }
      />

      <AdminPanel
        title="Leave or update your own review"
        description="Submit a review as your admin account for any course. Submitting again updates your previous review for that course."
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-review-course">Course</Label>
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger id="admin-review-course" className="h-11">
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCourse ? (
                <p className="text-xs text-muted-foreground">
                  {selectedCourse.category} · {selectedCourse.level}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Your rating</Label>
              <StarRating
                rating={rating}
                interactive
                onRatingChange={setRating}
                size="lg"
                showValue
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-review-comment">Comment</Label>
              <Textarea
                id="admin-review-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Write what worked well, what could improve, and who this course is best for."
                rows={5}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground">{comment.length}/1000</p>
            </div>
          </div>

          <div className="flex items-end">
            <Button
              onClick={handleSubmitOwnReview}
              disabled={submitting || !selectedCourseId || rating === 0}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving
                </>
              ) : (
                "Save review"
              )}
            </Button>
          </div>
        </div>
      </AdminPanel>

      <AdminPanel
        title="All platform reviews"
        description="Search and filter every user review, then edit, delete, or flag entries for moderation follow-up."
      >
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by user, course, or comment"
            />

            <Select value={filterCourseId} onValueChange={setFilterCourseId}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterRating} onValueChange={setFilterRating}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ratings</SelectItem>
                <SelectItem value="5">5 stars</SelectItem>
                <SelectItem value="4">4 stars</SelectItem>
                <SelectItem value="3">3 stars</SelectItem>
                <SelectItem value="2">2 stars</SelectItem>
                <SelectItem value="1">1 star</SelectItem>
              </SelectContent>
            </Select>

            <Select value={flaggedFilter} onValueChange={setFlaggedFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Flag state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All states</SelectItem>
                <SelectItem value="flagged">Flagged only</SelectItem>
                <SelectItem value="unflagged">Unflagged only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {moderationLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center text-sm text-muted-foreground">
              No reviews match the current filters.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReviews.map((review) => {
                const isEditing = editingReviewId === review.id;
                const isActing = actionReviewId === review.id;

                return (
                  <article
                    key={review.id}
                    className="rounded-xl border border-border bg-card px-5 py-4"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-base font-semibold text-foreground">
                            {review.course.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {review.user.name} · {review.user.email}
                          </p>
                          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                            Posted {formatDistanceToNow(new Date(review.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <StarRating rating={review.rating} size="sm" />
                          {review.flagged ? (
                            <Badge variant="destructive">Flagged</Badge>
                          ) : (
                            <Badge variant="secondary">Active</Badge>
                          )}
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                          <div className="space-y-2">
                            <Label>Edit rating</Label>
                            <StarRating
                              rating={editRating}
                              interactive
                              onRatingChange={setEditRating}
                              size="md"
                              showValue
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Edit comment</Label>
                            <Textarea
                              value={editComment}
                              onChange={(event) => setEditComment(event.target.value)}
                              rows={4}
                            />
                          </div>
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setEditingReviewId(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              onClick={() => handleSaveEdit(review.id)}
                              disabled={isActing}
                            >
                              {isActing ? (
                                <>
                                  <Loader2 className="mr-2 size-4 animate-spin" />
                                  Saving
                                </>
                              ) : (
                                "Save changes"
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {review.comment ? (
                            <p className="text-sm leading-7 text-muted-foreground">
                              {review.comment}
                            </p>
                          ) : (
                            <p className="text-sm italic text-muted-foreground">
                              No comment provided.
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/courses/${review.course.slug}`}
                              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                            >
                              <Star className="size-4" />
                              View course
                            </Link>

                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleStartEdit(review)}
                            >
                              <Pencil className="mr-2 size-4" />
                              Edit
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleToggleFlag(review.id, !review.flagged)}
                              disabled={isActing}
                            >
                              {isActing ? (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                              ) : (
                                <Flag className="mr-2 size-4" />
                              )}
                              {review.flagged ? "Unflag" : "Flag"}
                            </Button>

                            <Button
                              type="button"
                              variant="destructive"
                              onClick={() => handleDeleteReview(review.id)}
                              disabled={isActing}
                            >
                              {isActing ? (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                              ) : (
                                <Trash2 className="mr-2 size-4" />
                              )}
                              Delete
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </AdminPanel>
    </AdminPage>
  );
}
