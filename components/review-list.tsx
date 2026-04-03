"use client";

import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/ui/star-rating";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
}

interface ReviewListProps {
  courseId: string;
  refreshTrigger?: number;
}

export function ReviewList({ courseId, refreshTrigger }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(`/api/reviews?courseId=${courseId}`);
        if (!res.ok) throw new Error("Failed to fetch reviews");
        const data = await res.json();
        setReviews(data.reviews);
        setAverageRating(data.averageRating);
        setTotalReviews(data.totalReviews);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [courseId, refreshTrigger]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full rounded-none" />
        <Skeleton className="h-36 w-full rounded-none" />
        <Skeleton className="h-36 w-full rounded-none" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border border-[#e9eaf0] bg-white p-6 sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[auto_minmax(0,1fr)] xl:items-center">
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex min-w-[120px] flex-col items-center justify-center bg-[#1d2026] px-6 py-5 text-white">
              <div className="text-4xl font-semibold tracking-[-0.04em]">
                {totalReviews > 0 ? averageRating.toFixed(1) : "0.0"}
              </div>
              <div className="mt-3">
                <StarRating rating={averageRating} size="md" />
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c94a3]">
                Student sentiment
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[#1d2026]">
                {totalReviews === 0
                  ? "No reviews yet"
                  : `${totalReviews} learner ${totalReviews === 1 ? "review" : "reviews"}`}
              </h3>
              <p className="mt-3 max-w-[460px] text-sm leading-7 text-[#6e7485]">
                Ratings and comments from students who have already worked
                through this course.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = reviews.filter((review) => review.rating === stars).length;
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

              return (
                <div key={stars} className="flex items-center gap-3 text-sm">
                  <span className="w-12 font-medium text-[#4e5566]">
                    {stars} star
                  </span>
                  <div className="h-2 flex-1 overflow-hidden bg-[#e9eaf0]">
                    <div
                      className="h-full bg-[#ff6636]"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-[#8c94a3]">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="border border-dashed border-[#d7dae0] bg-white px-8 py-12 text-center">
          <div className="mx-auto flex size-14 items-center justify-center bg-[#fff2e5] text-[#ff6636]">
            <MessageSquare className="size-6" />
          </div>
          <h3 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-[#1d2026]">
            Be the first to review this course
          </h3>
          <p className="mt-3 text-sm leading-7 text-[#6e7485]">
            Once learners leave feedback, it will appear here with rating
            distribution and written notes.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="border border-[#e9eaf0] bg-white p-5 sm:p-6"
            >
              <div className="flex gap-4">
                <Avatar className="size-12 border border-[#e9eaf0]">
                  <AvatarImage src={review.user.image || undefined} />
                  <AvatarFallback className="bg-[#fff2e5] font-semibold text-[#ff6636]">
                    {review.user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-base font-semibold text-[#1d2026]">
                        {review.user.name}
                      </p>
                      <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-[#8c94a3]">
                        {formatDistanceToNow(new Date(review.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>

                    <StarRating rating={review.rating} size="sm" />
                  </div>

                  {review.comment ? (
                    <p className="mt-4 text-sm leading-7 text-[#4e5566]">
                      {review.comment}
                    </p>
                  ) : (
                    <p className="mt-4 text-sm leading-7 text-[#8c94a3]">
                      Left a rating without a written comment.
                    </p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
