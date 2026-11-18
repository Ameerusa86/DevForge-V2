import {
  DEFAULT_CATEGORIES,
  getCategoryColorTheme,
  getCategoryIcon,
  type ColorTheme,
} from "@/lib/categories";
import type { LucideIcon } from "lucide-react";

export interface CategoryMeta {
  label: string;
  icon: LucideIcon;
  theme: ColorTheme;
}

const DEFAULT_CATEGORY_BY_KEY = new Map(
  DEFAULT_CATEGORIES.flatMap((cat) => [
    [cat.slug.toUpperCase(), cat],
    [cat.name.toUpperCase(), cat],
  ]),
);

/** Resolve human-readable label, icon, and color theme for a course category. */
export function getCategoryMeta(category?: string | null): CategoryMeta {
  const raw = (category || "").trim();
  const upper = raw.toUpperCase();
  const match = DEFAULT_CATEGORY_BY_KEY.get(upper);

  if (match) {
    return {
      label: match.name,
      icon: getCategoryIcon(match.icon),
      theme: getCategoryColorTheme(match.color),
    };
  }

  const label = raw
    ? raw
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
    : "General";

  return {
    label,
    icon: getCategoryIcon(null),
    theme: getCategoryColorTheme("orange"),
  };
}

/** Format course duration in minutes into a concise human-readable label. */
export function formatDuration(minutes?: number | null): string {
  if (!minutes || minutes <= 0) return "Self-paced";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

/** Format CourseLevel enum strings consistently across learner views. */
export function formatCourseLevel(level?: string | null): string {
  if (!level) return "All Levels";
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
}

const LEVEL_BADGE_CLASSES: Record<string, string> = {
  BEGINNER:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  INTERMEDIATE:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
  ADVANCED:
    "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
  EXPERT:
    "bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20",
};

/** Return badge classes for a course difficulty level. */
export function getLevelBadgeClass(level?: string | null): string {
  const key = (level || "").toUpperCase();
  return (
    LEVEL_BADGE_CLASSES[key] ??
    "bg-muted text-muted-foreground border border-border"
  );
}

/** Return badge label and styling for enrollment completion percentage. */
export function getProgressState(progress: number): {
  label: string;
  className: string;
} {
  if (progress >= 100) {
    return {
      label: "Completed",
      className:
        "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25",
    };
  }
  if (progress > 0) {
    return {
      label: "In Progress",
      className: "bg-[#ff6636]/12 text-[#ff6636] border border-[#ff6636]/25",
    };
  }
  return {
    label: "Not Started",
    className: "bg-muted text-muted-foreground border border-border",
  };
}

/** Extract up to 2 uppercase initials from a user's display name. */
export function getInitials(name?: string | null): string {
  const trimmed = (name || "U").trim();
  if (!trimmed) return "U";
  return trimmed
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Format a date string into a concise readable label. */
export function formatShortDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
