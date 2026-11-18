"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarCheck2,
  Check,
  CheckCircle2,
  Clock3,
  Compass,
  Copy,
  ExternalLink,
  Info,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  LearnerPageShell,
  LearnerWorkspaceNav,
} from "@/components/lms/learner-workspace-nav";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import {
  formatCourseLevel,
  formatDuration,
  formatShortDate,
  getCategoryMeta,
  getLevelBadgeClass,
} from "@/lib/learner-ui";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EarnedCertificate {
  enrollmentId: string;
  certificateId: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  courseCategory: string;
  courseLevel: string;
  courseImageUrl: string | null;
  durationMinutes: number | null;
  totalLessons: number;
  instructorName: string;
  userName: string;
  completedAt: string;
  enrolledAt: string;
}

interface InProgressCredential {
  enrollmentId: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  courseCategory: string;
  courseLevel: string;
  courseImageUrl: string | null;
  durationMinutes: number | null;
  instructorName: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  remainingLessons: number;
}

interface CertificatesResponse {
  certificatesEnabled: boolean;
  user: {
    id: string;
    name: string;
    email: string;
  };
  earned: EarnedCertificate[];
  inProgress: InProgressCredential[];
}

// ─── API Helper ───────────────────────────────────────────────────────────────

async function fetchCertificatesData(): Promise<CertificatesResponse> {
  const response = await fetch("/api/certificates", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to fetch certificates");
  }
  return response.json();
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function CertificatesPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const [data, setData] = useState<CertificatesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const shouldRedirectToLogin = !isPending && !session?.user;

  useEffect(() => {
    if (shouldRedirectToLogin) {
      router.replace("/login");
    }
  }, [router, shouldRedirectToLogin]);

  useEffect(() => {
    if (!session?.user?.id) return;

    const load = async () => {
      setLoading(true);
      try {
        const result = await fetchCertificatesData();
        setData(result);
      } catch (error) {
        console.error("Failed to load certificates:", error);
        toast.error("Failed to load certificates.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [session?.user?.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const result = await fetchCertificatesData();
      setData(result);
      toast.success("Certificates updated.");
    } catch {
      toast.error("Failed to refresh certificates.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleCopyCertificateLink = async (cert: EarnedCertificate) => {
    const shareUrl = `${window.location.origin}/certificates/${cert.enrollmentId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedId(cert.enrollmentId);
      toast.success(`Certificate link copied (${cert.certificateId})`);
      setTimeout(() => {
        setCopiedId((current) =>
          current === cert.enrollmentId ? null : current,
        );
      }, 2200);
    } catch {
      toast.error("Unable to copy link to clipboard.");
    }
  };

  const categories = useMemo(() => {
    if (!data) return [];
    const allCats = [
      ...data.earned.map((c) => c.courseCategory),
      ...data.inProgress.map((c) => c.courseCategory),
    ].filter(Boolean);
    return Array.from(new Set(allCats));
  }, [data]);

  const filteredEarned = useMemo(() => {
    if (!data) return [];
    return data.earned.filter((cert) => {
      if (
        selectedCategory !== "ALL" &&
        cert.courseCategory !== selectedCategory
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          cert.courseTitle.toLowerCase().includes(q) ||
          cert.certificateId.toLowerCase().includes(q) ||
          cert.instructorName.toLowerCase().includes(q) ||
          cert.courseCategory.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data, selectedCategory, searchQuery]);

  const filteredInProgress = useMemo(() => {
    if (!data) return [];
    return data.inProgress.filter((item) => {
      if (
        selectedCategory !== "ALL" &&
        item.courseCategory !== selectedCategory
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.courseTitle.toLowerCase().includes(q) ||
          item.instructorName.toLowerCase().includes(q) ||
          item.courseCategory.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data, selectedCategory, searchQuery]);

  const totalCertifiedMinutes = useMemo(() => {
    if (!data) return 0;
    return data.earned.reduce(
      (sum, cert) => sum + (cert.durationMinutes ?? 0),
      0,
    );
  }, [data]);

  const closestMilestone = useMemo(() => {
    if (!data) return 0;
    if (data.inProgress.length > 0) {
      return Math.max(...data.inProgress.map((item) => item.progress));
    }
    return data.earned.length > 0 ? 100 : 0;
  }, [data]);

  if (shouldRedirectToLogin || isPending || loading) {
    return (
      <LearnerPageShell activePath="/certificates">
        <section className="border-b border-border/40 bg-[#fff9f7] dark:bg-[#111318] py-10 lg:py-14">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 space-y-8">
            <Skeleton className="h-11 w-full max-w-xl rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-6 w-40 rounded-full" />
              <Skeleton className="h-11 w-96 rounded-xl" />
              <Skeleton className="h-5 w-2/3 max-w-xl rounded-lg" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))}
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-2xl" />
            ))}
          </div>
        </section>
      </LearnerPageShell>
    );
  }

  return (
    <LearnerPageShell activePath="/certificates">
      {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border/40 bg-[#fff9f7] dark:bg-[#111318] py-10 lg:py-14">
        <div className="pointer-events-none absolute -top-40 right-0 size-[500px] rounded-full bg-[#ff6636]/5 blur-3xl" />

        <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 relative space-y-8">
          <LearnerWorkspaceNav activePath="/certificates" />

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#ff6636]/30 bg-[#ff6636]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-[#ff6636]">
                <Award className="size-3.5" /> Verified Credentials
              </span>
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]">
                Earned{" "}
                <span className="bg-gradient-to-r from-[#ff6636] to-[#ff9f60] bg-clip-text text-transparent">
                  Certificates
                </span>
              </h1>
              <p className="text-sm sm:text-base font-semibold leading-relaxed text-muted-foreground">
                Complete 100% of any DevForge course to unlock an official
                certificate issued in your name, ready to download as PDF or
                share.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] disabled:opacity-60 transition-all"
              >
                <RefreshCw
                  className={cn("size-3.5", refreshing && "animate-spin")}
                />
                {refreshing ? "Refreshing…" : "Refresh"}
              </button>

              <Link
                href="/my-courses"
                className="inline-flex items-center gap-2 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-md shadow-[#ff6636]/20 transition-colors"
              >
                <BookOpen className="size-4" /> My Courses
              </Link>
            </div>
          </div>

          {/* Stats Strip */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Earned Certificates",
                value: (data?.earned.length ?? 0).toString(),
                icon: Award,
                color: "text-[#ff6636]",
                bg: "bg-[#ff6636]/10",
                desc: "Verified course completions",
              },
              {
                label: "In Progress",
                value: (data?.inProgress.length ?? 0).toString(),
                icon: Clock3,
                color: "text-violet-500",
                bg: "bg-violet-500/10",
                desc: "Courses toward next certificate",
              },
              {
                label: "Certified Study",
                value: formatDuration(totalCertifiedMinutes),
                icon: ShieldCheck,
                color: "text-emerald-500",
                bg: "bg-emerald-500/10",
                desc: "Across completed tracks",
              },
              {
                label: "Closest Milestone",
                value: `${closestMilestone}%`,
                icon: Sparkles,
                color: "text-amber-500",
                bg: "bg-amber-500/10",
                desc:
                  data && data.inProgress.length > 0
                    ? "Nearest completion progress"
                    : "All enrolled tracks done",
              },
            ].map((stat) => {
              const SIcon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-2xs"
                >
                  <div
                    className={cn(
                      "flex size-12 shrink-0 items-center justify-center rounded-2xl",
                      stat.bg,
                      stat.color,
                    )}
                  >
                    <SIcon className="size-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold tracking-tight text-foreground">
                      {stat.value}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-[10px] font-semibold text-muted-foreground/80 mt-0.5">
                      {stat.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Filter Bar ──────────────────────────────────────────────────────── */}
      {(data?.earned.length || data?.inProgress.length) ? (
        <div className="border-b border-border/40 bg-card py-4">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by course title, certificate ID, or instructor..."
                className="h-10 w-full rounded-xl border border-border bg-background pl-10 pr-9 text-xs font-medium text-foreground placeholder:text-muted-foreground/70 focus:border-[#ff6636]/60 focus:outline-none focus:ring-2 focus:ring-[#ff6636]/10"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {categories.length > 1 && (
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="h-10 w-full sm:w-48 rounded-xl border-border bg-background text-xs font-semibold">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border bg-popover">
                  <SelectItem value="ALL" className="text-xs font-semibold">
                    All Categories
                  </SelectItem>
                  {categories.map((cat) => (
                    <SelectItem
                      key={cat}
                      value={cat}
                      className="text-xs font-semibold"
                    >
                      {getCategoryMeta(cat).label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      ) : null}

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 py-10 lg:py-12 space-y-12">
        {data && !data.certificatesEnabled && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-semibold text-foreground">
            <Info className="size-4 text-amber-500 shrink-0 mt-0.5" />
            <p>
              Certificate issuance is currently paused in platform settings, but
              your completed course achievements remain saved below.
            </p>
          </div>
        )}

        {/* 1. Earned Certificates */}
        <div className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#ff6636]">
                Achievements
              </p>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
                Your Credentials ({filteredEarned.length})
              </h2>
            </div>
            <p className="text-xs font-semibold text-muted-foreground">
              Issued to{" "}
              <span className="text-foreground font-bold">
                {data?.user.name}
              </span>
            </p>
          </div>

          {filteredEarned.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card px-8 py-14 text-center space-y-4">
              <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-[#ff6636]/10 text-[#ff6636]">
                <Award className="size-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-extrabold text-foreground">
                  {data?.earned.length
                    ? "No certificates match your filter"
                    : "No certificates earned yet"}
                </h3>
                <p className="mx-auto max-w-md text-sm font-semibold text-muted-foreground leading-relaxed">
                  {data?.earned.length
                    ? "Try clearing your search or category filter to view your credentials."
                    : data?.inProgress.length
                      ? "Finish all lessons in any of your active courses below to unlock your first verified DevForge certificate."
                      : "Enroll in a course from our catalog and complete every lesson to earn your first certificate."}
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3 pt-1">
                {data?.earned.length ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("ALL");
                    }}
                    className="rounded-xl text-xs font-bold"
                  >
                    Clear Filters
                  </Button>
                ) : (
                  <Link
                    href={data?.inProgress.length ? "/my-courses" : "/courses"}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white transition-colors"
                  >
                    {data?.inProgress.length ? (
                      <>
                        <Play className="size-3.5 fill-current" /> Continue
                        Learning
                      </>
                    ) : (
                      <>
                        <Compass className="size-4" /> Browse Courses
                      </>
                    )}
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredEarned.map((cert) => {
                const cat = getCategoryMeta(cert.courseCategory);
                const CatIcon = cat.icon;
                const isCopied = copiedId === cert.enrollmentId;

                return (
                  <article
                    key={cert.enrollmentId}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#ff6636]/50 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/40"
                  >
                    {/* Miniature Certificate Header Crest */}
                    <div className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-[#fff7f3] via-card to-[#fff2ea] dark:from-[#1d2026] dark:via-card dark:to-[#241b17] p-6">
                      <div className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-[#ff6636]/10 blur-2xl" />
                      <div className="relative flex items-start justify-between gap-3">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-[#ff6636] text-white shadow-md shadow-[#ff6636]/25">
                          <Award className="size-6" />
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="size-3" /> Verified
                        </span>
                      </div>

                      <div className="relative mt-5 space-y-1">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#ff6636]">
                          Certificate of Completion
                        </p>
                        <h3 className="text-lg font-extrabold leading-snug text-foreground line-clamp-2 group-hover:text-[#ff6636] transition-colors">
                          {cert.courseTitle}
                        </h3>
                      </div>
                    </div>

                    {/* Metadata Body */}
                    <div className="flex flex-1 flex-col p-5 space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase",
                            cat.theme.badge,
                          )}
                        >
                          <CatIcon className="size-3" />
                          {cat.label}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase",
                            getLevelBadgeClass(cert.courseLevel),
                          )}
                        >
                          {formatCourseLevel(cert.courseLevel)}
                        </span>
                      </div>

                      <div className="space-y-2 rounded-xl border border-border/60 bg-muted/25 p-3.5 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-muted-foreground">
                            Certificate ID
                          </span>
                          <span className="font-mono font-bold text-foreground">
                            {cert.certificateId}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-muted-foreground">
                            Instructor
                          </span>
                          <span className="font-bold text-foreground truncate">
                            {cert.instructorName}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-muted-foreground flex items-center gap-1">
                            <CalendarCheck2 className="size-3.5 text-[#ff6636]" />{" "}
                            Issued
                          </span>
                          <span className="font-bold text-foreground">
                            {formatShortDate(cert.completedAt)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-muted-foreground">
                            Curriculum
                          </span>
                          <span className="font-bold text-foreground">
                            {cert.totalLessons} lessons ·{" "}
                            {formatDuration(cert.durationMinutes)}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-auto grid grid-cols-[1fr_auto] gap-2 pt-1">
                        <Link
                          href={`/certificates/${cert.enrollmentId}`}
                          className="flex items-center justify-center gap-2 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] py-2.5 px-4 text-xs font-extrabold uppercase tracking-wider text-white transition-colors"
                        >
                          <ExternalLink className="size-3.5" /> View &amp;
                          Download
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleCopyCertificateLink(cert)}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-bold text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] transition-colors"
                          title="Copy shareable link"
                        >
                          {isCopied ? (
                            <Check className="size-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                          <span>{isCopied ? "Copied" : "Share"}</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Unlock Next Certificate (In-Progress Courses) */}
        {filteredInProgress.length > 0 && (
          <div className="space-y-6 pt-4 border-t border-border/60">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">
                  In Progress
                </p>
                <h2 className="mt-1 text-xl font-extrabold tracking-tight text-foreground">
                  Unlock Next Certificate ({filteredInProgress.length})
                </h2>
              </div>
              <Link
                href="/my-courses"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#ff6636] hover:underline"
              >
                Open My Courses <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredInProgress.map((item) => {
                const cat = getCategoryMeta(item.courseCategory);
                return (
                  <div
                    key={item.enrollmentId}
                    className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 space-y-4 hover:border-[#ff6636]/40 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase",
                            cat.theme.badge,
                          )}
                        >
                          {cat.label}
                        </span>
                        <span className="text-xs font-extrabold text-[#ff6636]">
                          {item.progress}%
                        </span>
                      </div>
                      <Link
                        href={`/courses/${item.courseSlug}`}
                        className="block text-sm font-bold text-foreground hover:text-[#ff6636] transition-colors line-clamp-2"
                      >
                        {item.courseTitle}
                      </Link>
                      <p className="text-xs font-medium text-muted-foreground">
                        By {item.instructorName}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Progress
                        value={item.progress}
                        className="h-2 rounded-full"
                      />
                      <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                        <span>
                          {item.completedLessons}/{item.totalLessons} lessons
                          done
                        </span>
                        <span>
                          {item.remainingLessons}{" "}
                          {item.remainingLessons === 1 ? "lesson" : "lessons"}{" "}
                          left
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/courses/${item.courseSlug}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 hover:bg-[#ff6636] hover:text-white hover:border-[#ff6636] py-2.5 text-xs font-bold text-foreground transition-all"
                    >
                      <Play className="size-3.5 fill-current" /> Continue to
                      Earn Certificate
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </LearnerPageShell>
  );
}
