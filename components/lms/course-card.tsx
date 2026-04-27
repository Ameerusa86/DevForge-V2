import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Star } from "lucide-react";

type CourseCardProps = {
  href: string;
  title: string;
  description?: string;
  imageUrl?: string;
  level?: "Beginner" | "Intermediate" | "Advanced";
  lessonsCount?: number;
  tags?: string[];
  progress?: number;
  priceLabel?: string;
  cta?: string;
  rating?: number;
  reviewsCount?: number;
};

const levelToneMap = {
  Beginner:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Intermediate:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  Advanced:
    "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
} as const;

export function CourseCard({
  href,
  title,
  description,
  imageUrl,
  level,
  lessonsCount,
  tags = [],
  progress,
  priceLabel,
  cta = "View Course",
  rating,
  reviewsCount,
}: CourseCardProps) {
  const topic = tags[0];
  const instructor = tags[1];
  const hasReviews =
    typeof rating === "number" && typeof reviewsCount === "number";
  const hasProgress = typeof progress === "number";
  const levelTone = level
    ? levelToneMap[level]
    : "bg-muted text-muted-foreground";

  return (
    <article className="group flex h-full flex-col overflow-hidden border border-border bg-card transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(0,0,0,0.12)]">
      <Link href={href} className="block">
        <div className="relative aspect-video overflow-hidden border-b border-border bg-[#1d2026]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 384px"
              className="object-contain transition duration-500 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#fff2e5_0%,#ffeee8_52%,#ebebff_100%)]" />
          )}

          <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-3">
            <div className="flex max-w-[70%] flex-wrap gap-2">
              {topic ? (
                <span className="inline-flex bg-card px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-foreground/75">
                  {topic}
                </span>
              ) : null}
              {level ? (
                <span
                  className={`inline-flex px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${levelTone}`}
                >
                  {level}
                </span>
              ) : null}
            </div>

            <div className="bg-card px-2 py-1 text-xs font-semibold text-foreground">
              {hasProgress ? `${progress}% complete` : priceLabel || "Free"}
            </div>
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {instructor ? `By ${instructor}` : "DevForge course"}
        </p>

        <Link href={href} className="mt-3 block">
          <h3 className="text-[1.35rem] font-semibold leading-[1.2] tracking-[-0.02em] text-foreground transition group-hover:text-primary">
            {title}
          </h3>
        </Link>

        {description ? (
          <p className="mt-3 line-clamp-3 text-sm leading-7 text-muted-foreground">
            {description}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-2 border border-border bg-muted px-3 py-1.5 font-medium text-foreground/75">
            <BookOpen className="size-3.5 text-[#ff6636]" />
            {lessonsCount ? `${lessonsCount} lessons` : "Structured course"}
          </span>
          {hasReviews ? (
            <span className="inline-flex items-center gap-2 border border-border bg-muted px-3 py-1.5 font-medium text-foreground/75">
              <Star className="size-3.5 fill-[#fd8e1f] text-[#fd8e1f]" />
              {rating.toFixed(1)} · {reviewsCount} reviews
            </span>
          ) : null}
        </div>

        {hasProgress ? (
          <div className="mt-5 border border-border bg-muted px-4 py-3">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Progress</span>
              <span className="text-foreground">{progress}% complete</span>
            </div>
            <div className="mt-3 h-2 w-full bg-border">
              <div
                className="h-full bg-[#ff6636]"
                style={{ width: `${Math.max(0, Math.min(progress, 100))}%` }}
              />
            </div>
          </div>
        ) : null}

        <div className="mt-auto pt-5">
          <div className="flex items-end justify-between gap-4 border border-border bg-muted p-4">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {hasProgress
                  ? "Progress"
                  : hasReviews
                    ? "Course rating"
                    : "Enrollment"}
              </p>
              <div className="mt-1 flex flex-wrap items-end gap-2">
                {hasProgress ? (
                  <span className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
                    {progress}%
                  </span>
                ) : hasReviews ? (
                  <>
                    <span className="inline-flex items-center gap-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                      <Star className="size-5 fill-[#fd8e1f] text-[#fd8e1f]" />
                      {rating.toFixed(1)}
                    </span>
                    <span className="pb-1 text-xs font-medium text-muted-foreground">
                      from {reviewsCount} reviews
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
                      {priceLabel || "Free"}
                    </span>
                    {level ? (
                      <span className="pb-1 text-xs font-medium text-muted-foreground">
                        {level}
                      </span>
                    ) : null}
                  </>
                )}
              </div>
            </div>

            <Link
              href={href}
              className="inline-flex items-center gap-2 bg-[#ff6636] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#e95a2b]"
            >
              {hasProgress ? "Continue" : cta}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
