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
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
      <Link href={href} className="block relative">
        <div className="relative aspect-video overflow-hidden bg-[#16181d]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 384px"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#fff2e5_0%,#ffeee8_52%,#ebebff_100%)]" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Floating pill badges with glassmorphism */}
          <div className="absolute inset-x-3.5 top-3.5 flex items-center justify-between gap-3">
            <div className="flex max-w-[70%] flex-wrap gap-2">
              {topic ? (
                <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] backdrop-blur-md bg-[#16181d]/75 border border-white/10 text-foreground">
                  {topic}
                </span>
              ) : null}
              {level ? (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] backdrop-blur-md border border-white/10 ${levelTone}`}
                >
                  {level}
                </span>
              ) : null}
            </div>

            <div className="rounded-full bg-[#16181d]/85 border border-white/10 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
              {hasProgress ? `${progress}% complete` : priceLabel || "Free"}
            </div>
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#ff6636]">
          {instructor ? `By ${instructor}` : "DevForge Course"}
        </p>

        <Link href={href} className="mt-2.5 block flex-grow">
          <h3 className="text-lg font-bold leading-tight tracking-tight text-foreground transition-colors duration-200 group-hover:text-[#ff6636]">
            {title}
          </h3>
        </Link>

        {description ? (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 border border-border bg-muted px-3 py-1.5 rounded-lg">
            <BookOpen className="size-4 text-[#ff6636]" />
            {lessonsCount ? `${lessonsCount} lessons` : "Structured course"}
          </span>
          {hasReviews ? (
            <span className="inline-flex items-center gap-1.5 border border-border bg-muted px-3 py-1.5 rounded-lg">
              <Star className="size-4 fill-[#fd8e1f] text-[#fd8e1f]" />
              {rating.toFixed(1)} · {reviewsCount} reviews
            </span>
          ) : null}
        </div>

        {hasProgress ? (
          <div className="mt-4 border border-border bg-muted px-4 py-3 rounded-lg">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>Progress</span>
              <span className="text-foreground">{progress}% complete</span>
            </div>
            <div className="mt-3.5 h-2 w-full bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-[#ff6636] rounded-full transition-all duration-300"
                style={{ width: `${Math.max(0, Math.min(progress, 100))}%` }}
              />
            </div>
          </div>
        ) : null}

        <div className="mt-auto pt-5">
          <div className="flex items-center justify-between gap-4 border border-border bg-muted p-3.5 rounded-xl">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                {hasProgress
                  ? "Progress"
                  : hasReviews
                    ? "Course rating"
                    : "Enrollment"}
              </p>
              <div className="mt-1 flex flex-wrap items-end gap-2">
                {hasProgress ? (
                  <span className="text-xl font-bold tracking-tight text-foreground">
                    {progress}%
                  </span>
                ) : hasReviews ? (
                  <>
                    <span className="inline-flex items-center gap-1 text-xl font-bold tracking-tight text-foreground">
                      <Star className="size-4.5 fill-[#fd8e1f] text-[#fd8e1f]" />
                      {rating.toFixed(1)}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-xl font-bold tracking-tight text-foreground">
                      {priceLabel || "Free"}
                    </span>
                  </>
                )}
              </div>
            </div>

            <Link
              href={href}
              className="inline-flex items-center gap-1.5 bg-[#ff6636] px-4.5 py-2.5 rounded-lg text-sm font-bold text-white transition-colors duration-200 hover:bg-[#e95a2b]"
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
