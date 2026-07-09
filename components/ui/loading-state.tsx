"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  className?: string;
}

// ─── Custom Professional Unique Spinner ─────────────────────────────────────
// Uses a combination of pulsing keyframes and circular dash arrays to create a premium Forge loader
export function DevForgeSpinner({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizeClasses = {
    sm: "size-8",
    md: "size-14",
    lg: "size-20",
  };

  const strokeWidths = {
    sm: 2.5,
    md: 3,
    lg: 4,
  };

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Background soft glowing pulse */}
      <div className={cn(
        "absolute rounded-full bg-[#ff6636]/10 dark:bg-[#ff6636]/5 animate-ping duration-[2500ms]",
        size === "sm" ? "size-6" : size === "md" ? "size-12" : "size-16"
      )} />

      {/* Main Spinner SVG */}
      <svg
        className={cn("animate-spin text-[#ff6636]", sizeClasses[size])}
        viewBox="0 0 50 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Track circle (semi-transparent) */}
        <circle
          className="opacity-15"
          cx="25"
          cy="25"
          r="20"
          stroke="currentColor"
          strokeWidth={strokeWidths[size]}
        />
        
        {/* Spinning indicator ring */}
        <circle
          cx="25"
          cy="25"
          r="20"
          stroke="currentColor"
          strokeWidth={strokeWidths[size]}
          strokeLinecap="round"
          strokeDasharray="80, 150"
          strokeDashoffset="0"
        />
      </svg>

      {/* Center core pulse element */}
      <div className={cn(
        "absolute rounded-full bg-[#ff6636] animate-pulse",
        size === "sm" ? "size-2" : size === "md" ? "size-3.5" : "size-5"
      )} />
    </div>
  );
}

// ─── Standard Loading State ──────────────────────────────────────────────────

export function LoadingState({ message = "Loading content…", className }: LoadingStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center space-y-4", className)}>
      <DevForgeSpinner size="md" />
      {message && (
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}

// ─── Inline Button Loading ───────────────────────────────────────────────────

export function InlineLoading({ message, className }: LoadingStateProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Loader2 className="size-3.5 animate-spin text-[#ff6636]" />
      {message && <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{message}</span>}
    </div>
  );
}

// ─── Card Loading Skeleton ───────────────────────────────────────────────────

export function CardLoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden rounded-2xl border-border bg-card">
          <CardContent className="p-6">
            <div className="space-y-3.5">
              <Skeleton className="h-4 w-3/4 rounded-full" />
              <Skeleton className="h-4 w-1/2 rounded-full" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Course Card Loading Skeleton ────────────────────────────────────────────

export function CourseCardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden rounded-2xl border-border bg-card">
          <Skeleton className="aspect-video w-full rounded-none" />
          <CardContent className="p-5 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-24 rounded-full" />
              <Skeleton className="h-5 w-5/6 rounded-lg" />
            </div>
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-3 w-4/5 rounded-full" />
            <div className="flex justify-between pt-3 border-t border-border/50">
              <Skeleton className="h-4 w-20 rounded-full" />
              <Skeleton className="h-8 w-16 rounded-xl" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Table Loading Skeleton ──────────────────────────────────────────────────

export function TableLoadingSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-10 flex-1 rounded-xl" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Full Page Loading ───────────────────────────────────────────────────────

export function FullPageLoading({ message = "Loading platform…" }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground transition-colors duration-300">
      <div className="text-center space-y-5 p-6 max-w-sm">
        <DevForgeSpinner size="lg" className="mx-auto" />
        {message && (
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff6636] animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
