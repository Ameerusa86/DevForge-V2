"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StarRating } from "@/components/ui/star-rating";
import { toast } from "sonner";

interface ReviewFormProps {
  courseId: string;
  courseTitle: string;
  existingReview?: {
    rating: number;
    comment: string | null;
  };
  onReviewSubmitted?: () => void;
}

export function ReviewForm({
  courseId,
  courseTitle,
  existingReview,
  onReviewSubmitted,
}: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          rating,
          comment: comment.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit review");
      }

      toast.success(
        existingReview
          ? "Review updated successfully!"
          : "Review submitted successfully!"
      );

      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to submit review"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {existingReview ? "Update Your Review" : "Write a Review"}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{courseTitle}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Rating</label>
            <StarRating
              rating={rating}
              interactive
              onRatingChange={setRating}
              size="lg"
              showValue
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Your Review (Optional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this course..."
              rows={5}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">
              {comment.length}/1000 characters
            </p>
          </div>

          <Button type="submit" disabled={submitting || rating === 0}>
            {submitting
              ? "Submitting..."
              : existingReview
              ? "Update Review"
              : "Submit Review"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
