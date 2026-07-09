"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpen,
  Braces,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Code2,
  Database,
  Globe,
  Layers3,
  MonitorPlay,
  Quote,
  Search,
  Sparkles,
  Star,
  Terminal,
  Users,
  Zap,
  Calendar,
  Play,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";

import {
  MarketingPublicFooter,
  MarketingPublicHeader,
} from "@/components/marketing/public-chrome";
import { getProxiedImageUrl } from "@/lib/s3-utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HomeCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  level: string;
  price: number;
  imageUrl?: string | null;
  instructor: string;
  lessons: number;
  enrollments: number;
  publishedAt?: string | null;
  rating: number;
  totalReviews: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCompactNumber(n: number) {
  return new Intl.NumberFormat("en-US", {
    notation: n >= 1000 ? "compact" : "standard",
    maximumFractionDigits: n >= 1000 ? 1 : 0,
  }).format(n);
}

function formatPrice(price: number) {
  return price > 0 ? `$${price.toFixed(2)}` : "Free";
}

// ─── Category config ──────────────────────────────────────────────────────────

const CAT: Record<
  string,
  { label: string; icon: typeof Code2; color: string; bg: string }
> = {
  FRONTEND: {
    label: "Frontend",
    icon: MonitorPlay,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  BACKEND: {
    label: "Backend",
    icon: Database,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  FULL_STACK: {
    label: "Full Stack",
    icon: Layers3,
    color: "text-[#ff6636]",
    bg: "bg-[#ff6636]/10",
  },
  PYTHON: {
    label: "Python",
    icon: Code2,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  JAVASCRIPT: {
    label: "JavaScript",
    icon: Braces,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
  TYPESCRIPT: {
    label: "TypeScript",
    icon: Braces,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  CSHARP: {
    label: "C#",
    icon: Code2,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  DOT_NET: {
    label: ".NET",
    icon: Globe,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
  },
  ASP_NET: {
    label: "ASP.NET",
    icon: Globe,
    color: "text-teal-500",
    bg: "bg-teal-500/10",
  },
};

function getCat(category: string) {
  return CAT[category] ?? CAT.FULL_STACK;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-muted/60 ${className ?? ""}`}
    />
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-10 py-20">
      <div className="mx-auto max-w-[1320px] px-4 space-y-8">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-6 w-1/2" />
        <div className="flex gap-4">
          <Skeleton className="h-12 w-40" />
          <Skeleton className="h-12 w-40" />
        </div>
      </div>
      <div className="mx-auto max-w-[1320px] px-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <div className="mx-auto max-w-[1320px] px-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    </div>
  );
}

// ─── Course Card ──────────────────────────────────────────────────────────────

function CourseCard({ course }: { course: HomeCourse }) {
  const cat = getCat(course.category);
  const Icon = cat.icon;
  const imageUrl = course.imageUrl ? getProxiedImageUrl(course.imageUrl) : null;

  return (
    <article className="group flex flex-col h-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/40 hover:border-[#ff6636]/40">
      {/* Thumbnail */}
      <Link
        href={`/courses/${course.slug}`}
        className="relative block aspect-video overflow-hidden bg-muted/40"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={course.title}
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#ff8f6a] via-[#ff6636] to-[#1d2026]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm bg-black/50 border border-white/10 text-white`}
          >
            <Icon className="size-3" />
            {cat.label}
          </span>
        </div>

        {/* Price badge */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold backdrop-blur-sm bg-black/50 border border-white/10 text-white">
            {formatPrice(course.price)}
          </span>
        </div>

        {/* Play button on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex size-12 items-center justify-center rounded-full bg-white/90 text-[#ff6636] shadow-lg">
            <Play className="size-5 ml-0.5" fill="currentColor" />
          </div>
        </div>
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        {/* Instructor */}
        <div className="flex items-center gap-2 mb-2.5">
          <div
            className={`size-5 rounded-full ${cat.bg} ${cat.color} flex items-center justify-center font-bold text-[9px] shrink-0`}
          >
            {course.instructor.charAt(0).toUpperCase()}
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground truncate">
            {course.instructor}
          </span>
        </div>

        {/* Title */}
        <Link href={`/courses/${course.slug}`} className="flex-1 block">
          <h3 className="text-sm font-bold leading-snug text-foreground line-clamp-2 group-hover:text-[#ff6636] transition-colors duration-200">
            {course.title}
          </h3>
        </Link>

        {/* Stars */}
        <div className="flex items-center gap-1.5 mt-2.5">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="size-3 fill-[#fd8e1f] text-[#fd8e1f]" />
            ))}
          </div>
          <span className="text-[11px] font-bold text-foreground">
            {course.rating.toFixed(1)}
          </span>
          <span className="text-[11px] text-muted-foreground">
            ({course.totalReviews})
          </span>
        </div>

        {/* Footer: price + buy */}
        <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-border/50">
          <span className="text-base font-extrabold text-foreground">
            {formatPrice(course.price)}
          </span>
          <Link
            href={`/courses/${course.slug}`}
            className="rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-2 transition-colors duration-200"
          >
            Enroll Now
          </Link>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-4 mt-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
          <span className="flex items-center gap-1">
            <BookOpen className="size-3" />
            {course.lessons} lessons
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-3" />
            {formatCompactNumber(course.enrollments)}
          </span>
        </div>
      </div>
    </article>
  );
}

// ─── Horizontal Course Card (for Top Rated paths) ─────────────────────────────

// ─── Compact Course Card (for Most Popular section) ─────────────────────────

function CourseCardCompact({ course }: { course: HomeCourse }) {
  const cat = getCat(course.category);
  const Icon = cat.icon;
  const imageUrl = course.imageUrl ? getProxiedImageUrl(course.imageUrl) : null;

  return (
    <article className="group flex flex-col h-full overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:shadow-black/10 dark:hover:shadow-black/30 hover:border-[#ff6636]/40">
      {/* Thumbnail */}
      <Link
        href={`/courses/${course.slug}`}
        className="relative block aspect-[3/2] overflow-hidden bg-muted/40"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={course.title}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 25vw, 20vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#ff8f6a] via-[#ff6636] to-[#1d2026]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {/* Category pill */}
        <div className="absolute top-2 left-2">
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide backdrop-blur-sm bg-black/55 border border-white/10 text-white">
            <Icon className="size-2.5" />
            {cat.label}
          </span>
        </div>
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col p-3">
        {/* Instructor */}
        <span className="text-[10px] font-semibold text-muted-foreground truncate">
          {course.instructor}
        </span>

        {/* Title */}
        <Link href={`/courses/${course.slug}`} className="flex-1 block mt-1">
          <h3 className="text-xs font-bold leading-snug text-foreground line-clamp-2 group-hover:text-[#ff6636] transition-colors duration-200">
            {course.title}
          </h3>
        </Link>

        {/* Stars + price row */}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/40">
          <div className="flex items-center gap-1">
            <Star className="size-2.5 fill-[#fd8e1f] text-[#fd8e1f]" />
            <span className="text-[10px] font-bold text-foreground">
              {course.rating.toFixed(1)}
            </span>
            <span className="text-[10px] text-muted-foreground">
              ({course.totalReviews})
            </span>
          </div>
          <span className="text-xs font-extrabold text-foreground">
            {formatPrice(course.price)}
          </span>
        </div>
      </div>
    </article>
  );
}

function CourseCardHorizontal({ course }: { course: HomeCourse }) {
  const cat = getCat(course.category);
  const imageUrl = course.imageUrl ? getProxiedImageUrl(course.imageUrl) : null;

  return (
    <article className="group flex gap-4 rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:border-[#ff6636]/40 hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/30 hover:-translate-y-0.5">
      {/* Thumbnail */}
      <Link
        href={`/courses/${course.slug}`}
        className="relative w-28 shrink-0 overflow-hidden rounded-xl bg-muted/40 aspect-video"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={course.title}
            fill
            unoptimized
            sizes="112px"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#ff8f6a] to-[#1d2026]" />
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div>
          <div
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${cat.bg} ${cat.color} mb-1.5`}
          >
            {cat.label}
          </div>
          <Link href={`/courses/${course.slug}`}>
            <h3 className="text-sm font-bold leading-snug text-foreground line-clamp-2 group-hover:text-[#ff6636] transition-colors duration-200">
              {course.title}
            </h3>
          </Link>
          <p className="mt-1 text-[11px] text-muted-foreground font-semibold truncate">
            {course.instructor}
          </p>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            <Star className="size-3 fill-[#fd8e1f] text-[#fd8e1f]" />
            <span className="text-[11px] font-bold text-foreground">
              {course.rating.toFixed(1)}
            </span>
            <span className="text-[10px] text-muted-foreground">
              ({course.totalReviews})
            </span>
          </div>
          <span className="text-sm font-extrabold text-foreground">
            {formatPrice(course.price)}
          </span>
        </div>
      </div>
    </article>
  );
}

// ─── Section Heading ─────────────────────────────────────────────────────────

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  href,
  hrefLabel = "View All",
  center = false,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  href?: string;
  hrefLabel?: string;
  center?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-2 ${center ? "items-center text-center" : ""} mb-10`}
    >
      <span className="inline-block text-[10px] font-bold uppercase tracking-[0.18em] text-[#ff6636]">
        {eyebrow}
      </span>
      <div
        className={`flex flex-wrap items-end gap-4 ${center ? "justify-center" : "justify-between"}`}
      >
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1.5 text-sm text-muted-foreground font-semibold max-w-xl">
              {subtitle}
            </p>
          )}
        </div>
        {href && !center && (
          <Link
            href={href}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] px-5 py-2.5 text-xs font-bold text-white transition-colors duration-200 shrink-0"
          >
            {hrefLabel} <ArrowRight className="size-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MarketingHomePage() {
  const [courses, setCourses] = useState<HomeCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch("/api/courses", { cache: "no-store" });
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.json();
        setCourses(data ?? []);
      } catch (err) {
        console.error("Homepage courses fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    void fetchCourses();
  }, []);

  // ── derived data ───────────────────────────────────────────────────────────
  const totalEnrollments = courses.reduce((s, c) => s + c.enrollments, 0);
  const uniqueInstructors = new Set(courses.map((c) => c.instructor)).size;
  const totalReviews = courses.reduce((s, c) => s + c.totalReviews, 0);
  const avgRating =
    totalReviews > 0
      ? courses.reduce((s, c) => s + c.rating * c.totalReviews, 0) /
        totalReviews
      : 0;

  const popularCourses = [...courses]
    .sort((a, b) => b.enrollments - a.enrollments || b.rating - a.rating)
    .slice(0, 6);

  const topRatedCourses = [...courses]
    .sort((a, b) => b.rating - a.rating || b.totalReviews - a.totalReviews)
    .slice(0, 6);

  const recentCourses = [...courses]
    .sort((a, b) => {
      const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return db - da;
    })
    .slice(0, 3);

  const categoryCounts = Object.entries(
    courses.reduce<Record<string, number>>((acc, c) => {
      acc[c.category] = (acc[c.category] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  const instructorList = Array.from(new Set(courses.map((c) => c.instructor)))
    .slice(0, 4)
    .map((name, i) => {
      const roles = [
        "Senior Architect",
        "Frontend Lead",
        "Database Engineer",
        "DevOps Expert",
      ];
      const studentsArr = [12400, 8900, 15400, 6200];
      const reviewsArr = [412, 198, 563, 114];
      const colors = [
        "bg-violet-500/10 text-violet-500",
        "bg-blue-500/10 text-blue-500",
        "bg-emerald-500/10 text-emerald-500",
        "bg-[#ff6636]/10 text-[#ff6636]",
      ];
      return {
        name,
        role: roles[i % roles.length]!,
        students: studentsArr[i % studentsArr.length]!,
        reviews: reviewsArr[i % reviewsArr.length]!,
        color: colors[i % colors.length]!,
      };
    });

  // ── static data ────────────────────────────────────────────────────────────
  const browseCategoryItems = [
    {
      name: "Frontend Development",
      icon: MonitorPlay,
      count: 18,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
    {
      name: "Backend & APIs",
      icon: Database,
      count: 22,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      name: "Full Stack",
      icon: Layers3,
      count: 15,
      color: "text-[#ff6636]",
      bg: "bg-[#ff6636]/10",
    },
    {
      name: "Python",
      icon: Code2,
      count: 28,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      name: "JavaScript / TS",
      icon: Braces,
      count: 31,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
    },
    {
      name: "DevOps & Cloud",
      icon: Terminal,
      count: 12,
      color: "text-teal-500",
      bg: "bg-teal-500/10",
    },
    {
      name: "C# & .NET",
      icon: Globe,
      count: 10,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
    {
      name: "Data & Analytics",
      icon: TrendingUp,
      count: 9,
      color: "text-pink-500",
      bg: "bg-pink-500/10",
    },
  ];

  const testimonials = [
    {
      quote:
        "DevForge gave me the clearest path to landing my first dev role. The source code walkthroughs are second to none.",
      name: "Sarah Mitchell",
      role: "Junior Frontend Developer",
    },
    {
      quote:
        "Incredible platform. The project-based approach means I actually build things, not just watch videos.",
      name: "James Okonkwo",
      role: "Full Stack Engineer",
    },
    {
      quote:
        "I went from zero to deploying a production .NET API in 6 weeks. The instructor quality is exceptional.",
      name: "Priya Sharma",
      role: "Backend Developer",
    },
  ];

  const [testimonialIdx, setTestimonialIdx] = useState(0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MarketingPublicHeader activePath="/" />
        <PageSkeleton />
        <MarketingPublicFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingPublicHeader activePath="/" />

      <main>
        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 1 — HERO
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden border-b border-border/40 bg-[#fff9f7] dark:bg-[#111318]">
          {/* Decorative blobs */}
          <div className="pointer-events-none absolute -top-40 -right-40 size-150 rounded-full bg-[#ff6636]/5 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 -left-40 size-125 rounded-full bg-violet-500/5 blur-3xl" />

          <div className="relative mx-auto max-w-full px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <div className="grid items-center gap-12 lg:grid-cols-[1fr_560px]">
              {/* Left */}
              <div className="space-y-7">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#ff6636]/30 bg-[#ff6636]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-[#ff6636]">
                  <Sparkles className="size-3.5" /> #1 Platform for Developers
                </span>

                <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-[3.75rem]">
                  Engaging &amp; Accessible
                  <br />
                  <span className="bg-gradient-to-r from-[#ff6636] to-[#ff9f60] bg-clip-text text-transparent">
                    Online Courses
                  </span>{" "}
                  For All
                </h1>

                <p className="max-w-[520px] text-base sm:text-lg leading-relaxed text-muted-foreground">
                  Pick a track, learn from vetted engineers, and ship
                  production-ready projects — all in one place.
                </p>

                {/* Search bar */}
                <div className="relative flex max-w-lg items-center rounded-2xl border border-border bg-card p-1.5 shadow-sm focus-within:border-[#ff6636]/60 focus-within:ring-2 focus-within:ring-[#ff6636]/10 transition-all duration-200">
                  <Search className="ml-3 size-4 shrink-0 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search courses, e.g. React, C#, Python…"
                    className="flex-1 bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
                  />
                  <Link
                    href={`/courses${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ""}`}
                    className="rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] px-4 py-2.5 text-xs font-bold text-white transition-colors duration-200"
                  >
                    Search
                  </Link>
                </div>

                {/* Trust row */}
                <div className="flex flex-wrap items-center gap-5 text-xs font-semibold text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="size-4 text-emerald-500" />
                    {courses.length} published courses
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="size-4 text-violet-500" />
                    {formatCompactNumber(totalEnrollments)} learners
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Star className="size-4 fill-[#fd8e1f] text-[#fd8e1f]" />
                    {avgRating > 0 ? avgRating.toFixed(1) : "5.0"} avg rating
                  </span>
                </div>
              </div>

              {/* Right — hero image */}
              <div className="relative mx-auto w-full max-w-880px">
                <div className="relative aspect-4/5 w-full overflow-hidden rounded-4xl border-4 border-card shadow-2xl shadow-black/20 group">
                  <Image
                    src="/images/homeHeroIMG.png"
                    alt="DevForge learning hero"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 880px"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    style={{ objectPosition: "center 20%" }}
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
                </div>

                {/* Floating badge */}
                <div className="absolute -left-6 -bottom-5 hidden sm:flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-xl">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[#ff6636]/10 text-[#ff6636]">
                    <Award className="size-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground">
                      Active Learners
                    </p>
                    <p className="text-sm font-extrabold text-foreground">
                      {formatCompactNumber(totalEnrollments)}+
                    </p>
                  </div>
                </div>

                <div className="absolute -right-6 top-10 hidden sm:flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-xl">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                    <BookOpen className="size-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground">
                      Courses
                    </p>
                    <p className="text-sm font-extrabold text-foreground">
                      {courses.length}+
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats strip */}
            <div className="mt-14 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                {
                  label: "Online Courses",
                  value: `${courses.length}+`,
                  icon: BookOpen,
                  color: "text-[#ff6636]",
                  bg: "bg-[#ff6636]/10",
                },
                {
                  label: "Expert Tutors",
                  value: `${uniqueInstructors}+`,
                  icon: Users,
                  color: "text-violet-500",
                  bg: "bg-violet-500/10",
                },
                {
                  label: "Countries",
                  value: "150+",
                  icon: Globe,
                  color: "text-blue-500",
                  bg: "bg-blue-500/10",
                },
                {
                  label: "Active Learners",
                  value: `${formatCompactNumber(totalEnrollments)}+`,
                  icon: Zap,
                  color: "text-emerald-500",
                  bg: "bg-emerald-500/10",
                },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div
                      className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}
                    >
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <p className="text-lg font-extrabold text-foreground">
                        {stat.value}
                      </p>
                      <p className="text-xs font-semibold text-muted-foreground">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 2 — BROWSE LIVE CATEGORIES
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 lg:py-20 bg-background border-b border-border/40">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Explore by Topic"
              title="Browse Live Categories"
              subtitle="Pick your focus area and dive into curated courses from real engineers."
              href="/courses"
              hrefLabel="View All Courses"
            />

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              {browseCategoryItems.map((cat) => {
                const Icon = cat.icon;
                /* how many courses in this category from live data? */
                const liveCount = categoryCounts.find(
                  ([key]) =>
                    getCat(key).label.toLowerCase() ===
                    cat.name.toLowerCase().split(" ")[0],
                )?.[1];

                return (
                  <Link
                    key={cat.name}
                    href="/courses"
                    className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:border-[#ff6636]/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20"
                  >
                    <div
                      className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${cat.bg} ${cat.color} transition-transform duration-300 group-hover:scale-110`}
                    >
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground group-hover:text-[#ff6636] transition-colors duration-200">
                        {cat.name}
                      </h3>
                      <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                        {liveCount ?? cat.count} courses
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 3 — MOST POPULAR RIGHT NOW
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 lg:py-20 bg-muted/20 dark:bg-[#13151b] border-b border-border/40">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Trending Now"
              title="Most Popular Right Now"
              subtitle="The courses learners are enrolling in most — battle-tested and instructor-approved."
              href="/courses"
              hrefLabel="See All Popular"
            />

            {popularCourses.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {popularCourses.map((course) => (
                  <CourseCardCompact key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
                <BookOpen className="size-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm font-semibold text-muted-foreground">
                  No courses yet. Check back soon!
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 4 — MASTER YOUR SKILLS (PROMO BLOCK)
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 lg:py-20 bg-background border-b border-border/40">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              {/* Text side */}
              <div className="space-y-7">
                <div className="space-y-3">
                  <span className="inline-block text-[10px] font-bold uppercase tracking-[0.18em] text-[#ff6636]">
                    Why DevForge
                  </span>
                  <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                    Master the skills to
                    <br />
                    drive your career forward
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground font-semibold leading-relaxed max-w-md">
                    Real-world projects, lifetime access, and step-by-step
                    blueprints that actually get you hired.
                  </p>
                </div>

                <div className="space-y-5">
                  {[
                    {
                      icon: CheckCircle2,
                      color: "text-[#ff6636]",
                      title: "Stay Motivated",
                      desc: "Automatic progress tracking synced across all your devices, any time.",
                    },
                    {
                      icon: CheckCircle2,
                      color: "text-blue-500",
                      title: "Work at Your Own Pace",
                      desc: "Lifetime source code access and downloadable resources — no expiry.",
                    },
                    {
                      icon: CheckCircle2,
                      color: "text-emerald-500",
                      title: "Learn From Industry Experts",
                      desc: "All content is written and maintained by senior engineers in their fields.",
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="flex gap-4">
                        <Icon
                          className={`size-5 shrink-0 mt-0.5 ${item.color}`}
                        />
                        <div>
                          <h4 className="text-sm font-bold text-foreground">
                            {item.title}
                          </h4>
                          <p className="mt-0.5 text-xs font-semibold text-muted-foreground leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/courses"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] px-6 py-3 text-sm font-bold text-white transition-colors duration-200"
                  >
                    Start Learning <ArrowRight className="size-4" />
                  </Link>
                  <Link
                    href="/my-courses"
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-card hover:bg-muted/40 px-6 py-3 text-sm font-bold text-foreground transition-colors duration-200"
                  >
                    My Learning
                  </Link>
                </div>
              </div>

              {/* Image side */}
              <div className="relative mx-auto w-full max-w-[460px]">
                <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border bg-muted/40 shadow-2xl group">
                  <Image
                    src="/images/HeroImg.jpg"
                    alt="DevForge learning"
                    fill
                    unoptimized
                    sizes="460px"
                    className="object-cover opacity-80 transition-transform duration-700 group-hover:scale-[1.03]"
                    style={{ objectPosition: "center 35%" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
                    <span className="inline-flex items-center rounded-full bg-[#ff6636] px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider">
                      Interactive Blueprint
                    </span>
                    <h4 className="text-base font-extrabold leading-snug">
                      Ready to level up? Start with our dynamic learning
                      roadmaps today.
                    </h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 5 — TOP RATED LEARNING PATHS
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 lg:py-20 bg-muted/20 dark:bg-[#13151b] border-b border-border/40">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Highest Rated"
              title="Top Rated Learning Paths"
              subtitle="Curated by learner ratings and review count — the most impactful courses on the platform."
              href="/courses"
              hrefLabel="All Courses"
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topRatedCourses.map((course) => (
                <CourseCardHorizontal key={course.id} course={course} />
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 6 — FEATURED INSTRUCTORS
        ═══════════════════════════════════════════════════════════════════ */}
        {instructorList.length > 0 && (
          <section className="py-16 lg:py-20 bg-background border-b border-border/40">
            <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
              <SectionHeading
                eyebrow="Meet the Educators"
                title="Featured Instructors"
                subtitle="Real engineers sharing battle-tested knowledge from the field."
                center
              />

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {instructorList.map((instructor, i) => (
                  <article
                    key={i}
                    className="group flex flex-col items-center rounded-2xl border border-border bg-card p-6 text-center transition-all duration-300 hover:border-[#ff6636]/40 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div
                      className={`relative size-20 rounded-full border-2 border-border mb-4 flex items-center justify-center font-extrabold text-xl ${instructor.color}`}
                    >
                      {instructor.name.substring(0, 2).toUpperCase()}
                    </div>
                    <h4 className="text-sm font-bold text-foreground group-hover:text-[#ff6636] transition-colors duration-200">
                      {instructor.name}
                    </h4>
                    <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {instructor.role}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className="size-3 fill-[#fd8e1f] text-[#fd8e1f]"
                        />
                      ))}
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wide border-t border-border/50 pt-4 w-full justify-center">
                      <span>
                        {formatCompactNumber(instructor.students)} learners
                      </span>
                      <span>{instructor.reviews} reviews</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 7 — COMPANY LOGOS
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="border-b border-border/40 bg-muted/30 py-10">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 text-center space-y-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
              Trusted by learners from 500+ leading companies worldwide
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 opacity-50">
              {[
                "Google",
                "Netflix",
                "Microsoft",
                "Stripe",
                "Dropbox",
                "Slack",
              ].map((name) => (
                <span
                  key={name}
                  className="text-sm font-black tracking-widest text-muted-foreground"
                >
                  {name.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 8 — TESTIMONIALS
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 lg:py-24 bg-[#0d0f14] border-b border-white/5">
          <div className="mx-auto max-w-[860px] px-4 sm:px-6 lg:px-8 text-center">
            <span className="inline-block text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff6636] mb-6">
              What Learners Say
            </span>

            <Quote className="size-14 mx-auto text-[#ff6636]/20 fill-[#ff6636]/10 mb-6" />

            <blockquote className="text-lg sm:text-2xl font-semibold leading-relaxed text-gray-200 min-h-[6rem]">
              &ldquo;{testimonials[testimonialIdx]!.quote}&rdquo;
            </blockquote>

            <div className="flex flex-col items-center mt-8 gap-2">
              <div className="size-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-sm font-bold text-white">
                {testimonials[testimonialIdx]!.name.substring(
                  0,
                  2,
                ).toUpperCase()}
              </div>
              <p className="text-sm font-bold text-white">
                {testimonials[testimonialIdx]!.name}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                {testimonials[testimonialIdx]!.role}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={() =>
                  setTestimonialIdx(
                    (i) => (i - 1 + testimonials.length) % testimonials.length,
                  )
                }
                className="size-10 rounded-full border border-white/10 hover:bg-white/5 flex items-center justify-center text-white transition-colors duration-200"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="size-5" />
              </button>
              <div className="flex gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setTestimonialIdx(i)}
                    className={`size-2 rounded-full transition-all duration-200 ${i === testimonialIdx ? "bg-[#ff6636] w-5" : "bg-white/20"}`}
                    aria-label={`Testimonial ${i + 1}`}
                  />
                ))}
              </div>
              <button
                onClick={() =>
                  setTestimonialIdx((i) => (i + 1) % testimonials.length)
                }
                className="size-10 rounded-full border border-white/10 hover:bg-white/5 flex items-center justify-center text-white transition-colors duration-200"
                aria-label="Next testimonial"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 9 — CTA BANNERS (Instructor + Corporate)
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 lg:py-20 bg-background border-b border-border/40">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Become an instructor */}
              <div className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent p-8 flex flex-col gap-6 hover:border-violet-500/40 transition-all duration-300">
                <div className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-violet-500/10 blur-3xl" />
                <div className="relative space-y-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-violet-400">
                    Join Our Team
                  </span>
                  <h3 className="text-xl font-extrabold text-foreground">
                    Become an Instructor
                  </h3>
                  <p className="text-xs font-semibold text-muted-foreground leading-relaxed max-w-sm">
                    Share your expertise with thousands of active learners. Earn
                    revenue on every enrollment with zero upfront cost.
                  </p>
                </div>
                <Link
                  href="/contact"
                  className="relative self-start inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 px-6 py-3 text-xs font-bold text-white transition-colors duration-200"
                >
                  Apply as Instructor <ArrowRight className="size-3.5" />
                </Link>
              </div>

              {/* DevForge for teams */}
              <div className="relative overflow-hidden rounded-3xl border border-[#ff6636]/20 bg-gradient-to-br from-[#ff6636]/10 via-[#ff6636]/5 to-transparent p-8 flex flex-col gap-6 hover:border-[#ff6636]/40 transition-all duration-300">
                <div className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-[#ff6636]/10 blur-3xl" />
                <div className="relative space-y-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#ff6636]">
                    Corporate Solutions
                  </span>
                  <h3 className="text-xl font-extrabold text-foreground">
                    DevForge for Teams
                  </h3>
                  <p className="text-xs font-semibold text-muted-foreground leading-relaxed max-w-sm">
                    Custom learning paths, team dashboards, and verified
                    completions to track and grow engineering capacity.
                  </p>
                </div>
                <Link
                  href="/pricing"
                  className="relative self-start inline-flex items-center gap-2 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] px-6 py-3 text-xs font-bold text-white transition-colors duration-200"
                >
                  Explore Pathways <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 10 — LATEST BLOG POSTS
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 lg:py-20 bg-muted/20 dark:bg-[#13151b]">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Latest Insights"
              title="From the DevForge Blog"
              subtitle="Tips, tutorials, and industry trends from our engineering team."
              center
            />

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  date: "June 24, 2026",
                  tag: "Career",
                  title:
                    "How to Find the Right Learning Path for Your Engineering Goals",
                  desc: "Discover strategies to streamline your software engineering track and pick modules that fit your timeline.",
                  readTime: "5 min read",
                },
                {
                  date: "June 05, 2026",
                  tag: "Productivity",
                  title:
                    "Unlocking Your Potential: Study Systems That Actually Work",
                  desc: "Set actionable checkpoints, manage your study timeline, and build a verified portfolio in parallel.",
                  readTime: "4 min read",
                },
                {
                  date: "May 18, 2026",
                  tag: "Tech",
                  title: "Top 10 Web Development Trends Shaping 2026",
                  desc: "A survey of modern systems, APIs, responsive grids, and design patterns dominating the industry.",
                  readTime: "6 min read",
                },
              ].map((post) => (
                <article
                  key={post.title}
                  className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-[#ff6636]/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-[#ff6636]/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#ff6636]">
                        {post.tag}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-foreground leading-snug group-hover:text-[#ff6636] transition-colors duration-200 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-xs font-semibold text-muted-foreground leading-relaxed line-clamp-3">
                      {post.desc}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold">
                      <Calendar className="size-3" />
                      <span>{post.date}</span>
                      <span className="mx-1">·</span>
                      <Clock3 className="size-3" />
                      <span>{post.readTime}</span>
                    </div>
                    <Link
                      href="/courses"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#ff6636] hover:text-[#e95a2b] transition-colors duration-200"
                    >
                      Read <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <MarketingPublicFooter />
    </div>
  );
}
