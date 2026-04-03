"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  showValue = false,
  interactive = false,
  onRatingChange,
  className,
}: StarRatingProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const handleStarClick = (value: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(value);
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: maxRating }, (_, i) => i + 1).map((value) => {
        const isFilled = value <= Math.round(rating);
        const isPartial = !isFilled && value - 1 < rating && rating < value;

        return (
          <button
            key={value}
            type="button"
            onClick={() => handleStarClick(value)}
            disabled={!interactive}
            className={cn(
              "relative transition-all",
              interactive && "cursor-pointer hover:scale-110",
              !interactive && "cursor-default"
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                isFilled
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-muted text-muted-foreground"
              )}
            />
            {isPartial && (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{
                  width: `${(rating - (value - 1)) * 100}%`,
                }}
              >
                <Star
                  className={cn(
                    sizeClasses[size],
                    "fill-yellow-400 text-yellow-400"
                  )}
                />
              </div>
            )}
          </button>
        );
      })}
      {showValue && (
        <span className="ml-1 text-sm font-medium text-muted-foreground">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
