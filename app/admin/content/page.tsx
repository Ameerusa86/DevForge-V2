"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { JSONContent } from "@tiptap/react";
import { toast } from "sonner";
import {
  AlertCircle,
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Code2,
  Download,
  Edit,
  Eye,
  FileCheck2,
  FileCode,
  FileText,
  Filter,
  Globe,
  HelpCircle,
  Layers,
  Loader2,
  Lock,
  MessageCircleQuestion,
  MoreVertical,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Star,
  Video,
  VideoOff,
  X,
} from "lucide-react";

import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import { RichTextRenderer } from "@/components/editor/RichTextRenderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  ContentLesson,
  ContentQaIssue,
  ContentStats,
  CourseContentSummary,
} from "@/lib/content-audit";
import { cn } from "@/lib/utils";
import { extractYouTubeId, getYouTubeEmbedUrl } from "@/lib/youtube";

type ContentFilter =
  | "all"
  | "needs_attention"
  | "empty"
  | "thin"
  | "unassigned"
  | "no_video"
  | "no_quiz"
  | "unanswered_qa"
  | "free"
  | "paid";

type CourseStatusFilter = "all" | "PUBLISHED" | "DRAFT" | "ARCHIVED";

type SortMode =
  | "updated_desc"
  | "words_asc"
  | "words_desc"
  | "issues_desc"
  | "qa_desc"
  | "course_order";

interface FullLessonDetail {
  id: string;
  content: string;
  videoUrl: string | null;
  durationSeconds: number | null;
}

const QA_ISSUE_LABELS: Record<
  ContentQaIssue,
  { label: string; tone: string }
> = {
  template_only: {
    label: "Template Only",
    tone: "bg-rose-500/15 text-rose-500 border-rose-500/20",
  },
  empty_draft: {
    label: "Empty Draft",
    tone: "bg-rose-500/15 text-rose-500 border-rose-500/20",
  },
  thin_content: {
    label: "Thin (<80w)",
    tone: "bg-amber-500/15 text-amber-500 border-amber-500/20",
  },
  unassigned_module: {
    label: "No Module",
    tone: "bg-amber-500/15 text-amber-500 border-amber-500/20",
  },
  missing_phase: {
    label: "No Phase",
    tone: "bg-amber-500/15 text-amber-500 border-amber-500/20",
  },
  missing_video: {
    label: "No Video",
    tone: "bg-muted text-muted-foreground border-border",
  },
  missing_duration: {
    label: "No Duration",
    tone: "bg-muted text-muted-foreground border-border",
  },
  missing_quiz: {
    label: "No Quiz",
    tone: "bg-muted text-muted-foreground border-border",
  },
  unanswered_qa: {
    label: "Open Q&A",
    tone: "bg-sky-500/15 text-sky-500 border-sky-500/20",
  },
};

function getCourseStatusTone(status: ContentLesson["courseStatus"]) {
  if (status === "PUBLISHED") {
    return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  }
  if (status === "DRAFT") {
    return "bg-amber-500/10 text-amber-500 border-amber-500/20";
  }
  return "bg-muted text-muted-foreground border-border";
}

function getWordCountTone(count: number, codeBlocks: number) {
  if (count >= 300 || (count >= 120 && codeBlocks > 0)) {
    return "text-emerald-500 bg-emerald-500/10";
  }
  if (count >= 80 || codeBlocks > 0) {
    return "text-amber-500 bg-amber-500/10";
  }
  return "text-rose-500 bg-rose-500/10";
}

function getFreshnessLabel(updatedAt: string) {
  const days = Math.floor(
    (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days <= 30) return `${days}d ago`;
  return new Date(updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function csvCell(value: string | number | boolean | null | undefined) {
  const str = value == null ? "" : String(value);
  return `"${str.replace(/"/g, '""')}"`;
}

export default function ContentPage() {
  const [lessons, setLessons] = useState<ContentLesson[]>([]);
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [courseSummaries, setCourseSummaries] = useState<
    CourseContentSummary[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Main navigation tabs & filters
  const [workspaceTab, setWorkspaceTab] = useState<"audit" | "courses">(
    "audit",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<ContentFilter>("all");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [courseStatusFilter, setCourseStatusFilter] =
    useState<CourseStatusFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("updated_desc");

  // Selection & bulk mutations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);
  const [togglingLessonIds, setTogglingLessonIds] = useState<Set<string>>(
    new Set(),
  );

  // Inspector drawer
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [inspectorTab, setInspectorTab] = useState<"overview" | "preview">(
    "overview",
  );
  const [lessonDetailCache, setLessonDetailCache] = useState<
    Record<string, FullLessonDetail>
  >({});
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);

  // Quick edit fields in inspector
  const [quickVideoUrl, setQuickVideoUrl] = useState("");
  const [quickDurationMinutes, setQuickDurationMinutes] = useState("");
  const [quickSaving, setQuickSaving] = useState(false);

  const selectedLesson = useMemo(
    () => lessons.find((l) => l.id === selectedLessonId) ?? null,
    [lessons, selectedLessonId],
  );

  const fetchContent = useCallback(async (opts?: { silent?: boolean }) => {
    const isSilent = opts?.silent ?? false;
    if (isSilent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setLoadError(null);

    try {
      const response = await fetch("/api/admin/content", {
        cache: "no-store",
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error || "Failed to load content library");
      }

      const data = (await response.json()) as {
        lessons: ContentLesson[];
        stats: ContentStats;
        courseSummaries: CourseContentSummary[];
      };

      setLessons(data.lessons);
      setStats(data.stats);
      setCourseSummaries(data.courseSummaries ?? []);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load content";
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchContent();
  }, [fetchContent]);

  // Sync inspector quick-edit inputs whenever selected lesson changes
  useEffect(() => {
    if (!selectedLesson) return;
    setQuickVideoUrl(selectedLesson.videoUrl ?? "");
    setQuickDurationMinutes(
      selectedLesson.durationSeconds
        ? String(Math.round(selectedLesson.durationSeconds / 60))
        : "",
    );
  }, [selectedLesson]);

  // Lazy-load full TipTap content when preview tab is opened
  useEffect(() => {
    if (
      inspectorTab !== "preview" ||
      !selectedLessonId ||
      lessonDetailCache[selectedLessonId]
    ) {
      return;
    }

    let cancelled = false;
    setDetailLoadingId(selectedLessonId);

    fetch(`/api/admin/lessons/${selectedLessonId}`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load lesson preview");
        return (await res.json()) as FullLessonDetail;
      })
      .then((detail) => {
        if (!cancelled) {
          setLessonDetailCache((prev) => ({
            ...prev,
            [selectedLessonId]: detail,
          }));
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error(error);
          toast.error("Could not load full lesson content preview");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDetailLoadingId(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [inspectorTab, selectedLessonId, lessonDetailCache]);

  const uniqueCourses = useMemo(
    () =>
      Array.from(
        new Map(lessons.map((l) => [l.courseId, l.courseTitle])).entries(),
      ).sort((a, b) => a[1].localeCompare(b[1])),
    [lessons],
  );

  // Base search + course + status matches (used to compute live filter badge counts)
  const baseMatchedLessons = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return lessons.filter((lesson) => {
      if (q) {
        const matchesQuery =
          lesson.title.toLowerCase().includes(q) ||
          lesson.courseTitle.toLowerCase().includes(q) ||
          (lesson.moduleTitle ?? "").toLowerCase().includes(q) ||
          lesson.excerpt.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      if (courseFilter !== "all" && lesson.courseId !== courseFilter) {
        return false;
      }

      if (
        courseStatusFilter !== "all" &&
        lesson.courseStatus !== courseStatusFilter
      ) {
        return false;
      }

      return true;
    });
  }, [lessons, searchQuery, courseFilter, courseStatusFilter]);

  const filterCounts = useMemo(
    () => ({
      all: baseMatchedLessons.length,
      needs_attention: baseMatchedLessons.filter((l) => l.needsAttention)
        .length,
      empty: baseMatchedLessons.filter((l) => l.isEmpty).length,
      thin: baseMatchedLessons.filter((l) => l.isThin).length,
      unassigned: baseMatchedLessons.filter((l) => !l.moduleId).length,
      no_video: baseMatchedLessons.filter((l) => !l.hasVideo).length,
      no_quiz: baseMatchedLessons.filter((l) => !l.hasQuiz).length,
      unanswered_qa: baseMatchedLessons.filter(
        (l) => l.unansweredQuestionCount > 0,
      ).length,
      free: baseMatchedLessons.filter((l) => l.isFree).length,
      paid: baseMatchedLessons.filter((l) => !l.isFree).length,
    }),
    [baseMatchedLessons],
  );

  const filtered = useMemo(() => {
    const list = baseMatchedLessons.filter((lesson) => {
      switch (filter) {
        case "needs_attention":
          return lesson.needsAttention;
        case "empty":
          return lesson.isEmpty;
        case "thin":
          return lesson.isThin;
        case "unassigned":
          return !lesson.moduleId;
        case "no_video":
          return !lesson.hasVideo;
        case "no_quiz":
          return !lesson.hasQuiz;
        case "unanswered_qa":
          return lesson.unansweredQuestionCount > 0;
        case "free":
          return lesson.isFree;
        case "paid":
          return !lesson.isFree;
        default:
          return true;
      }
    });

    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sortMode) {
        case "words_asc":
          return a.wordCount - b.wordCount;
        case "words_desc":
          return b.wordCount - a.wordCount;
        case "issues_desc":
          return (
            Number(b.needsAttention) - Number(a.needsAttention) ||
            b.qaIssues.length - a.qaIssues.length ||
            a.wordCount - b.wordCount
          );
        case "qa_desc":
          return (
            b.unansweredQuestionCount - a.unansweredQuestionCount ||
            b.questionCount - a.questionCount
          );
        case "course_order":
          return (
            a.courseTitle.localeCompare(b.courseTitle) || a.order - b.order
          );
        case "updated_desc":
        default:
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
      }
    });

    return sorted;
  }, [baseMatchedLessons, filter, sortMode]);

  const filteredCourseSummaries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...courseSummaries]
      .filter((course) => {
        if (
          courseStatusFilter !== "all" &&
          course.courseStatus !== courseStatusFilter
        ) {
          return false;
        }
        if (q) {
          return (
            course.courseTitle.toLowerCase().includes(q) ||
            course.instructorName.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        // Prioritize published courses with lower readiness scores
        if (
          a.courseStatus === "PUBLISHED" &&
          b.courseStatus !== "PUBLISHED"
        ) {
          return -1;
        }
        if (
          b.courseStatus === "PUBLISHED" &&
          a.courseStatus !== "PUBLISHED"
        ) {
          return 1;
        }
        return a.readinessScore - b.readinessScore;
      });
  }, [courseSummaries, courseStatusFilter, searchQuery]);

  const visibleSelectedIds = useMemo(
    () => filtered.filter((l) => selectedIds.has(l.id)).map((l) => l.id),
    [filtered, selectedIds],
  );

  const allFilteredSelected =
    filtered.length > 0 && visibleSelectedIds.length === filtered.length;

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        for (const item of filtered) next.delete(item.id);
      } else {
        for (const item of filtered) next.add(item.id);
      }
      return next;
    });
  };

  const toggleSelectOne = (lessonId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(lessonId)) {
        next.delete(lessonId);
      } else {
        next.add(lessonId);
      }
      return next;
    });
  };

  const handleToggleFreeAccess = async (lesson: ContentLesson) => {
    const nextFree = !lesson.isFree;
    setTogglingLessonIds((prev) => new Set(prev).add(lesson.id));

    try {
      const response = await fetch(`/api/admin/lessons/${lesson.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFree: nextFree }),
      });

      if (!response.ok) {
        throw new Error("Failed to update lesson access");
      }

      toast.success(
        `Access persisted: "${lesson.title}" is now ${nextFree ? "Free Preview" : "Paid"}`,
      );
      await fetchContent({ silent: true });
    } catch (error) {
      console.error(error);
      toast.error("Could not persist access change");
    } finally {
      setTogglingLessonIds((prev) => {
        const next = new Set(prev);
        next.delete(lesson.id);
        return next;
      });
    }
  };

  const handleBulkFreeAccess = async (isFree: boolean) => {
    if (visibleSelectedIds.length === 0) return;

    setBulkSaving(true);
    try {
      const response = await fetch("/api/admin/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonIds: visibleSelectedIds, isFree }),
      });

      if (!response.ok) {
        throw new Error("Failed to update selected lessons");
      }

      const data = (await response.json()) as { updatedCount: number };
      toast.success(
        `Updated ${data.updatedCount} lesson${data.updatedCount === 1 ? "" : "s"} to ${isFree ? "Free Preview" : "Paid"}`,
      );
      setSelectedIds(new Set());
      await fetchContent({ silent: true });
    } catch (error) {
      console.error(error);
      toast.error("Bulk access update failed");
    } finally {
      setBulkSaving(false);
    }
  };

  const handleSaveQuickMetadata = async () => {
    if (!selectedLesson) return;

    const trimmedVideo = quickVideoUrl.trim();
    const parsedMinutes = quickDurationMinutes.trim()
      ? Number(quickDurationMinutes.trim())
      : null;

    if (
      parsedMinutes !== null &&
      (!Number.isFinite(parsedMinutes) || parsedMinutes < 0)
    ) {
      toast.error("Duration must be a valid positive number of minutes");
      return;
    }

    setQuickSaving(true);
    try {
      const response = await fetch(`/api/admin/lessons/${selectedLesson.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: trimmedVideo || null,
          durationSeconds:
            parsedMinutes !== null ? Math.round(parsedMinutes * 60) : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save lesson metadata");
      }

      // Invalidate cached preview detail for this lesson
      setLessonDetailCache((prev) => {
        const next = { ...prev };
        delete next[selectedLesson.id];
        return next;
      });

      toast.success("Lesson video & duration saved");
      await fetchContent({ silent: true });
    } catch (error) {
      console.error(error);
      toast.error("Failed to save lesson metadata");
    } finally {
      setQuickSaving(false);
    }
  };

  const handleExportCsv = () => {
    if (filtered.length === 0) {
      toast.error("No lessons in current view to export");
      return;
    }

    const headers = [
      "Lesson Title",
      "Course",
      "Course Status",
      "Module",
      "Phase",
      "Order",
      "Access",
      "Words",
      "Code Blocks",
      "Has Video",
      "Duration (Mins)",
      "Quiz Questions",
      "Completions",
      "Open Q&A",
      "QA Issues",
      "Updated At",
    ];

    const rows = filtered.map((l) => [
      csvCell(l.title),
      csvCell(l.courseTitle),
      csvCell(l.courseStatus),
      csvCell(l.moduleTitle ?? "Unassigned"),
      csvCell(l.phaseTitle ?? (l.courseHasPhases ? "Unassigned" : "N/A")),
      csvCell(l.order),
      csvCell(l.isFree ? "Free" : "Paid"),
      csvCell(l.wordCount),
      csvCell(l.codeBlockCount),
      csvCell(l.hasVideo ? "Yes" : "No"),
      csvCell(l.durationSeconds ? Math.round(l.durationSeconds / 60) : 0),
      csvCell(l.quizQuestionCount),
      csvCell(l.completionCount),
      csvCell(l.unansweredQuestionCount),
      csvCell(
        l.qaIssues.map((issue) => QA_ISSUE_LABELS[issue].label).join("; ") ||
          "Ready",
      ),
      csvCell(l.updatedAt),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `devforge-content-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} lessons to CSV`);
  };

  const quickMetaDirty = useMemo(() => {
    if (!selectedLesson) return false;
    const currentMinutes = selectedLesson.durationSeconds
      ? String(Math.round(selectedLesson.durationSeconds / 60))
      : "";
    return (
      quickVideoUrl.trim() !== (selectedLesson.videoUrl ?? "") ||
      quickDurationMinutes.trim() !== currentMinutes
    );
  }, [selectedLesson, quickVideoUrl, quickDurationMinutes]);

  const parsedPreviewDoc = useMemo<JSONContent | null>(() => {
    if (!selectedLessonId) return null;
    const raw = lessonDetailCache[selectedLessonId]?.content;
    if (!raw) return null;
    try {
      return JSON.parse(raw) as JSONContent;
    } catch {
      return null;
    }
  }, [selectedLessonId, lessonDetailCache]);

  const videoCoveragePercent =
    stats && stats.total > 0
      ? Math.round(((stats.total - stats.missingVideo) / stats.total) * 100)
      : 0;
  const quizCoveragePercent =
    stats && stats.total > 0
      ? Math.round(((stats.total - stats.missingQuiz) / stats.total) * 100)
      : 0;

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Content QA & Audit"
        title="Content Library"
        description="Audit every lesson across your courses — catch empty or template drafts, missing videos and quizzes, manage free previews, and jump straight into editing."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              onClick={() => void fetchContent({ silent: true })}
              disabled={loading || refreshing}
              className="h-10 rounded-xl border-border bg-card text-xs font-bold gap-2"
            >
              <RefreshCw
                className={cn("size-3.5", refreshing && "animate-spin")}
              />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={handleExportCsv}
              disabled={loading || filtered.length === 0}
              className="h-10 rounded-xl border-border bg-card text-xs font-bold gap-2"
            >
              <Download className="size-3.5" />
              Export Audit CSV
            </Button>
          </div>
        }
      />

      {/* Actionable KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card
          onClick={() => {
            setWorkspaceTab("audit");
            setFilter("all");
          }}
          className="cursor-pointer rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-[#ff6636]/40 flex items-center justify-between"
        >
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Lessons
            </p>
            <h3 className="text-3xl font-extrabold text-foreground tracking-tight">
              {loading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                (stats?.total ?? 0)
              )}
            </h3>
            <p className="text-[10px] font-semibold text-muted-foreground">
              Avg {stats?.avgWordCount ?? 0} words ·{" "}
              {stats?.totalCodeBlocks ?? 0} code blocks
            </p>
          </div>
          <div className="flex size-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
            <FileText className="size-5" />
          </div>
        </Card>

        <Card
          onClick={() => {
            setWorkspaceTab("audit");
            setFilter("needs_attention");
          }}
          className="cursor-pointer rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-rose-500/40 flex items-center justify-between"
        >
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Needs QA Attention
            </p>
            <h3
              className={cn(
                "text-3xl font-extrabold tracking-tight",
                stats && stats.needsAttention > 0
                  ? "text-rose-500"
                  : "text-emerald-500",
              )}
            >
              {loading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                (stats?.needsAttention ?? 0)
              )}
            </h3>
            <p className="text-[10px] font-semibold text-muted-foreground">
              {stats?.publishedNeedsAttention ?? 0} in published courses ·{" "}
              {stats?.empty ?? 0} empty
            </p>
          </div>
          <div className="flex size-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
            <AlertTriangle className="size-5" />
          </div>
        </Card>

        <Card
          onClick={() => {
            setWorkspaceTab("audit");
            setFilter("free");
          }}
          className="cursor-pointer rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-emerald-500/40 flex items-center justify-between"
        >
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Free Previews
            </p>
            <h3 className="text-3xl font-extrabold text-emerald-500 tracking-tight">
              {loading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                (stats?.free ?? 0)
              )}
            </h3>
            <p className="text-[10px] font-semibold text-muted-foreground">
              {stats && stats.total > 0
                ? `${Math.round((stats.free / stats.total) * 100)}% of catalog · ${stats.paid} paid`
                : "—"}
            </p>
          </div>
          <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <Star className="size-5" />
          </div>
        </Card>

        <Card
          onClick={() => {
            setWorkspaceTab("audit");
            setFilter(
              stats && stats.unansweredQuestions > 0
                ? "unanswered_qa"
                : "no_video",
            );
          }}
          className="cursor-pointer rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-sky-500/40 flex items-center justify-between"
        >
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Media & Quiz Coverage
            </p>
            <h3 className="text-3xl font-extrabold text-foreground tracking-tight">
              {loading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                `${videoCoveragePercent}%`
              )}
            </h3>
            <p className="text-[10px] font-semibold text-muted-foreground">
              {quizCoveragePercent}% have quizzes ·{" "}
              {stats?.unansweredQuestions ?? 0} open Q&amp;A
            </p>
          </div>
          <div className="flex size-11 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500">
            <Video className="size-5" />
          </div>
        </Card>
      </div>

      {loadError ? (
        <Card className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="size-5 text-rose-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-foreground">
                  Could not load content audit data
                </p>
                <p className="text-xs text-muted-foreground">{loadError}</p>
              </div>
            </div>
            <Button
              onClick={() => void fetchContent()}
              variant="outline"
              className="rounded-xl text-xs font-bold"
            >
              Retry
            </Button>
          </div>
        </Card>
      ) : null}

      {/* Main Workspace Tabs */}
      <Tabs
        value={workspaceTab}
        onValueChange={(value) => setWorkspaceTab(value as "audit" | "courses")}
        className="space-y-5"
      >
        <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <TabsList className="h-10 rounded-xl border border-border/50 bg-muted/20 p-1 w-fit">
              <TabsTrigger
                value="audit"
                className="rounded-lg px-4 text-xs font-bold gap-1.5 data-[state=active]:bg-[#ff6636] data-[state=active]:text-white"
              >
                <FileCheck2 className="size-3.5" />
                Lesson Audit ({filtered.length})
              </TabsTrigger>
              <TabsTrigger
                value="courses"
                className="rounded-lg px-4 text-xs font-bold gap-1.5 data-[state=active]:bg-[#ff6636] data-[state=active]:text-white"
              >
                <Layers className="size-3.5" />
                Course Readiness ({filteredCourseSummaries.length})
              </TabsTrigger>
            </TabsList>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search lesson, course, excerpt..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 rounded-xl border-border bg-background text-xs font-semibold placeholder:text-muted-foreground/70 focus-visible:ring-0"
                />
              </div>

              {/* Course Status Filter */}
              <Select
                value={courseStatusFilter}
                onValueChange={(value) =>
                  setCourseStatusFilter(value as CourseStatusFilter)
                }
              >
                <SelectTrigger className="h-9 w-36 rounded-xl border-border bg-background text-[11px] font-semibold">
                  <SelectValue placeholder="Course Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="text-xs font-semibold">
                    All Statuses
                  </SelectItem>
                  <SelectItem
                    value="PUBLISHED"
                    className="text-xs font-semibold"
                  >
                    Published
                  </SelectItem>
                  <SelectItem value="DRAFT" className="text-xs font-semibold">
                    Draft
                  </SelectItem>
                  <SelectItem
                    value="ARCHIVED"
                    className="text-xs font-semibold"
                  >
                    Archived
                  </SelectItem>
                </SelectContent>
              </Select>

              {workspaceTab === "audit" && uniqueCourses.length > 0 ? (
                <>
                  <Select value={courseFilter} onValueChange={setCourseFilter}>
                    <SelectTrigger className="h-9 w-48 rounded-xl border-border bg-background text-[11px] font-semibold">
                      <SelectValue placeholder="All Courses" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all" className="text-xs font-semibold">
                        All Courses
                      </SelectItem>
                      {uniqueCourses.map(([id, title]) => (
                        <SelectItem
                          key={id}
                          value={id}
                          className="text-xs font-semibold"
                        >
                          {title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={sortMode}
                    onValueChange={(v) => setSortMode(v as SortMode)}
                  >
                    <SelectTrigger className="h-9 w-44 rounded-xl border-border bg-background text-[11px] font-semibold">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem
                        value="updated_desc"
                        className="text-xs font-semibold"
                      >
                        Recently Updated
                      </SelectItem>
                      <SelectItem
                        value="issues_desc"
                        className="text-xs font-semibold"
                      >
                        Most QA Issues
                      </SelectItem>
                      <SelectItem
                        value="words_asc"
                        className="text-xs font-semibold"
                      >
                        Lowest Word Count
                      </SelectItem>
                      <SelectItem
                        value="words_desc"
                        className="text-xs font-semibold"
                      >
                        Highest Word Count
                      </SelectItem>
                      <SelectItem
                        value="qa_desc"
                        className="text-xs font-semibold"
                      >
                        Most Open Q&amp;A
                      </SelectItem>
                      <SelectItem
                        value="course_order"
                        className="text-xs font-semibold"
                      >
                        Course &amp; Order
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </>
              ) : null}
            </div>
          </div>

          {/* QA Filter Pills (in Lesson Audit tab) */}
          {workspaceTab === "audit" ? (
            <div className="flex flex-wrap items-center gap-1.5 border-t border-border/40 pt-3">
              <span className="mr-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <Filter className="size-3" /> QA Filter:
              </span>
              {(
                [
                  ["all", "All", filterCounts.all],
                  [
                    "needs_attention",
                    "Needs Attention",
                    filterCounts.needs_attention,
                  ],
                  ["empty", "Empty / Template", filterCounts.empty],
                  ["thin", "Thin (<80w)", filterCounts.thin],
                  ["unassigned", "No Module", filterCounts.unassigned],
                  ["no_video", "No Video", filterCounts.no_video],
                  ["no_quiz", "No Quiz", filterCounts.no_quiz],
                  [
                    "unanswered_qa",
                    "Open Q&A",
                    filterCounts.unanswered_qa,
                  ],
                  ["free", "Free", filterCounts.free],
                  ["paid", "Paid", filterCounts.paid],
                ] as Array<[ContentFilter, string, number]>
              ).map(([value, label, count]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider transition-all whitespace-nowrap",
                    filter === value
                      ? "bg-[#ff6636] border-[#ff6636] text-white"
                      : "bg-background border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span>{label}</span>
                  <span
                    className={cn(
                      "rounded-md px-1 py-0.2 text-[9px]",
                      filter === value
                        ? "bg-white/20 text-white"
                        : "bg-muted text-foreground/80",
                    )}
                  >
                    {count}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Tab 1: Lesson Audit Table + Inspector */}
        <TabsContent value="audit" className="mt-0 space-y-4">
          {visibleSelectedIds.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#ff6636]/30 bg-[#ff6636]/5 px-4 py-3">
              <div className="text-xs font-bold text-foreground">
                {visibleSelectedIds.length} lesson
                {visibleSelectedIds.length === 1 ? "" : "s"} selected
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => void handleBulkFreeAccess(true)}
                  disabled={bulkSaving}
                  className="h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5"
                >
                  {bulkSaving ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Globe className="size-3.5" />
                  )}
                  Set Free Preview
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void handleBulkFreeAccess(false)}
                  disabled={bulkSaving}
                  className="h-8 rounded-xl text-xs font-bold gap-1.5"
                >
                  <Lock className="size-3.5" />
                  Set Paid
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedIds(new Set())}
                  className="h-8 rounded-xl text-xs font-bold"
                >
                  Clear
                </Button>
              </div>
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-12 items-start">
            {/* Table */}
            <div
              className={cn(
                selectedLesson
                  ? "lg:col-span-7 xl:col-span-8"
                  : "lg:col-span-12",
              )}
            >
              <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <CardHeader className="border-b border-border/50 px-6 py-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
                    <FileCode className="size-4.5 text-[#ff6636]" />
                    Lesson QA Ledger ({filtered.length})
                  </CardTitle>
                  {courseFilter !== "all" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCourseFilter("all")}
                      className="h-7 rounded-lg text-[11px] font-bold text-[#ff6636]"
                    >
                      Show All Courses
                    </Button>
                  ) : null}
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/10">
                        <TableRow className="hover:bg-transparent border-b border-border/40">
                          <TableHead className="w-10 px-4 py-3.5">
                            <Checkbox
                              checked={allFilteredSelected}
                              onCheckedChange={toggleSelectAll}
                              aria-label="Select all filtered lessons"
                            />
                          </TableHead>
                          <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-3.5">
                            Lesson &amp; QA Signals
                          </TableHead>
                          <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-3.5">
                            Course / Module
                          </TableHead>
                          <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-3.5">
                            Content &amp; Assets
                          </TableHead>
                          <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-3.5 text-center">
                            Access
                          </TableHead>
                          <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-3.5">
                            Updated
                          </TableHead>
                          <TableHead className="px-4 py-3.5 text-center" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              className="py-14 text-center text-xs font-semibold text-muted-foreground"
                            >
                              <Loader2 className="size-5 animate-spin mx-auto mb-2 text-[#ff6636]" />
                              Auditing lessons across courses...
                            </TableCell>
                          </TableRow>
                        ) : filtered.length > 0 ? (
                          filtered.map((lesson) => {
                            const isToggling = togglingLessonIds.has(
                              lesson.id,
                            );
                            const structuralIssues = lesson.qaIssues.filter(
                              (issue) =>
                                issue === "template_only" ||
                                issue === "empty_draft" ||
                                issue === "thin_content" ||
                                issue === "unassigned_module" ||
                                issue === "missing_phase",
                            );

                            return (
                              <TableRow
                                key={lesson.id}
                                onClick={() => setSelectedLessonId(lesson.id)}
                                className={cn(
                                  "hover:bg-muted/15 border-b border-border/30 last:border-b-0 cursor-pointer",
                                  selectedLessonId === lesson.id &&
                                    "bg-[#ff6636]/5",
                                )}
                              >
                                <TableCell
                                  className="px-4 py-3.5"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Checkbox
                                    checked={selectedIds.has(lesson.id)}
                                    onCheckedChange={() =>
                                      toggleSelectOne(lesson.id)
                                    }
                                    aria-label={`Select ${lesson.title}`}
                                  />
                                </TableCell>

                                <TableCell className="px-3 py-3.5 max-w-[260px]">
                                  <div className="space-y-1.5">
                                    <div className="flex items-center gap-1.5">
                                      <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-extrabold text-muted-foreground">
                                        #{lesson.order}
                                      </span>
                                      <p className="truncate font-bold text-xs text-foreground">
                                        {lesson.title}
                                      </p>
                                    </div>
                                    {structuralIssues.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {structuralIssues.map((issue) => (
                                          <span
                                            key={issue}
                                            className={cn(
                                              "inline-flex items-center rounded border px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wide",
                                              QA_ISSUE_LABELS[issue].tone,
                                            )}
                                          >
                                            {QA_ISSUE_LABELS[issue].label}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="truncate text-[11px] text-muted-foreground">
                                        {lesson.excerpt || "Ready"}
                                      </p>
                                    )}
                                  </div>
                                </TableCell>

                                <TableCell className="px-3 py-3.5 max-w-[200px]">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className={cn(
                                          "rounded border px-1.5 py-0.2 text-[8px] font-extrabold uppercase tracking-wider shrink-0",
                                          getCourseStatusTone(
                                            lesson.courseStatus,
                                          ),
                                        )}
                                      >
                                        {lesson.courseStatus}
                                      </span>
                                      <p className="truncate text-xs font-bold text-foreground">
                                        {lesson.courseTitle}
                                      </p>
                                    </div>
                                    <p className="truncate text-[11px] font-medium text-muted-foreground">
                                      {lesson.moduleTitle ?? (
                                        <span className="italic text-amber-500">
                                          Unassigned module
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </TableCell>

                                <TableCell className="px-3 py-3.5">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span
                                      className={cn(
                                        "px-2 py-0.5 rounded-md text-[10px] font-extrabold",
                                        getWordCountTone(
                                          lesson.wordCount,
                                          lesson.codeBlockCount,
                                        ),
                                      )}
                                    >
                                      {lesson.wordCount.toLocaleString()}w
                                    </span>
                                    {lesson.codeBlockCount > 0 ? (
                                      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-foreground">
                                        <Code2 className="size-3 text-[#ff6636]" />
                                        {lesson.codeBlockCount}
                                      </span>
                                    ) : null}
                                    {lesson.hasVideo ? (
                                      <span
                                        title="Video attached"
                                        className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-bold text-sky-500"
                                      >
                                        <Video className="size-3" />
                                        {lesson.durationSeconds
                                          ? `${Math.round(lesson.durationSeconds / 60)}m`
                                          : "Vid"}
                                      </span>
                                    ) : (
                                      <span
                                        title="No video"
                                        className="inline-flex items-center rounded-md bg-muted/60 p-1 text-muted-foreground/60"
                                      >
                                        <VideoOff className="size-3" />
                                      </span>
                                    )}
                                    {lesson.hasQuiz ? (
                                      <span
                                        title={`${lesson.quizQuestionCount} quiz questions`}
                                        className="inline-flex items-center gap-1 rounded-md bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-bold text-violet-500"
                                      >
                                        <Award className="size-3" />
                                        {lesson.quizQuestionCount}q
                                      </span>
                                    ) : null}
                                    {lesson.unansweredQuestionCount > 0 ? (
                                      <span
                                        title={`${lesson.unansweredQuestionCount} unanswered student questions`}
                                        className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-500"
                                      >
                                        <HelpCircle className="size-3" />
                                        {lesson.unansweredQuestionCount}
                                      </span>
                                    ) : null}
                                  </div>
                                </TableCell>

                                <TableCell
                                  className="px-3 py-3.5 text-center"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    disabled={isToggling}
                                    onClick={() =>
                                      void handleToggleFreeAccess(lesson)
                                    }
                                    title="Click to toggle Free Preview / Paid"
                                    className={cn(
                                      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider transition-all hover:opacity-80 disabled:opacity-50",
                                      lesson.isFree
                                        ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/25"
                                        : "bg-muted text-muted-foreground border border-border",
                                    )}
                                  >
                                    {isToggling ? (
                                      <Loader2 className="size-2.5 animate-spin" />
                                    ) : lesson.isFree ? (
                                      "free"
                                    ) : (
                                      "paid"
                                    )}
                                  </button>
                                </TableCell>

                                <TableCell className="px-3 py-3.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                                  {getFreshnessLabel(lesson.updatedAt)}
                                </TableCell>

                                <TableCell
                                  className="px-4 py-3.5 text-center"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        type="button"
                                        className="size-8 rounded-xl border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors mx-auto"
                                      >
                                        <MoreVertical className="size-4" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="end"
                                      className="rounded-xl border-border bg-popover"
                                    >
                                      <DropdownMenuLabel className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground px-3.5 py-2">
                                        Content Actions
                                      </DropdownMenuLabel>
                                      <DropdownMenuSeparator className="bg-border" />
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedLessonId(lesson.id);
                                          setInspectorTab("preview");
                                        }}
                                        className="cursor-pointer text-xs px-3.5 py-2 gap-2"
                                      >
                                        <Eye className="size-3.5" /> Live
                                        Preview
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        asChild
                                        className="cursor-pointer text-xs px-3.5 py-2"
                                      >
                                        <Link
                                          href={`/admin/courses/${lesson.courseId}/lessons?editLessonId=${lesson.id}`}
                                          className="flex items-center gap-2"
                                        >
                                          <Edit className="size-3.5" /> Edit
                                          Lesson
                                        </Link>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        asChild
                                        className="cursor-pointer text-xs px-3.5 py-2"
                                      >
                                        <Link
                                          href={`/admin/courses/${lesson.courseId}/lessons?quizLessonId=${lesson.id}`}
                                          className="flex items-center gap-2"
                                        >
                                          <Award className="size-3.5" />{" "}
                                          {lesson.hasQuiz
                                            ? "Manage Quiz"
                                            : "Add Quiz"}
                                        </Link>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        asChild
                                        className="cursor-pointer text-xs px-3.5 py-2"
                                      >
                                        <Link
                                          href={`/courses/${lesson.courseSlug}`}
                                          className="flex items-center gap-2"
                                        >
                                          <BookOpen className="size-3.5" /> View
                                          Course Page
                                        </Link>
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator className="bg-border" />
                                      <DropdownMenuItem
                                        onClick={() =>
                                          void handleToggleFreeAccess(lesson)
                                        }
                                        className="cursor-pointer text-xs font-semibold text-foreground px-3.5 py-2 gap-2"
                                      >
                                        <Globe className="size-3.5" /> Set as{" "}
                                        {lesson.isFree ? "Paid" : "Free"}
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              className="text-center text-xs font-semibold text-muted-foreground py-12"
                            >
                              No lessons matched the selected QA filters.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upgraded Inspector & Live Preview Panel */}
            {selectedLesson ? (
              <div className="lg:col-span-5 xl:col-span-4">
                <Card className="rounded-2xl border border-[#ff6636]/30 bg-card shadow-lg sticky top-6 overflow-hidden">
                  <div className="bg-[#ff6636]/5 p-5 border-b border-border/50 flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full px-2 py-0.5 text-[8px] font-black bg-[#ff6636]/10 text-[#ff6636] uppercase tracking-widest">
                          Lesson Inspector
                        </span>
                        <span
                          className={cn(
                            "rounded border px-1.5 py-0.2 text-[8px] font-extrabold uppercase tracking-wider",
                            getCourseStatusTone(selectedLesson.courseStatus),
                          )}
                        >
                          {selectedLesson.courseStatus}
                        </span>
                      </div>
                      <CardTitle className="text-base font-extrabold leading-snug text-foreground">
                        {selectedLesson.title}
                      </CardTitle>
                      <p className="text-xs font-semibold text-muted-foreground truncate">
                        {selectedLesson.courseTitle}
                        {selectedLesson.moduleTitle
                          ? ` · ${selectedLesson.moduleTitle}`
                          : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedLessonId(null)}
                      className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    >
                      <X className="size-4.5" />
                    </button>
                  </div>

                  <Tabs
                    value={inspectorTab}
                    onValueChange={(v) =>
                      setInspectorTab(v as "overview" | "preview")
                    }
                  >
                    <div className="border-b border-border/40 px-5 pt-3">
                      <TabsList className="h-9 w-full rounded-xl bg-muted/20 p-1">
                        <TabsTrigger
                          value="overview"
                          className="flex-1 rounded-lg text-xs font-bold gap-1.5 data-[state=active]:bg-[#ff6636] data-[state=active]:text-white"
                        >
                          <Sparkles className="size-3.5" />
                          Audit &amp; Quick Edit
                        </TabsTrigger>
                        <TabsTrigger
                          value="preview"
                          className="flex-1 rounded-lg text-xs font-bold gap-1.5 data-[state=active]:bg-[#ff6636] data-[state=active]:text-white"
                        >
                          <Eye className="size-3.5" />
                          Live Preview
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="overview" className="m-0">
                      <CardContent className="p-5 space-y-5">
                        {/* QA Checklist */}
                        <div className="rounded-xl border border-border/60 bg-muted/15 p-4 space-y-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Readiness Checklist
                          </p>
                          {[
                            {
                              label: selectedLesson.hasOnlyTemplateText
                                ? "Contains placeholder template text"
                                : selectedLesson.isEmpty
                                  ? "Content is empty"
                                  : selectedLesson.isThin
                                    ? `Thin prose (${selectedLesson.proseWordCount} words)`
                                    : `${selectedLesson.wordCount.toLocaleString()} words (${selectedLesson.estimatedReadMinutes} min read)`,
                              ok:
                                !selectedLesson.isEmpty &&
                                !selectedLesson.isThin,
                              warn: selectedLesson.isThin,
                            },
                            {
                              label: selectedLesson.moduleTitle
                                ? `Module: ${selectedLesson.moduleTitle}`
                                : "Not assigned to any module",
                              ok: Boolean(selectedLesson.moduleTitle),
                            },
                            ...(selectedLesson.courseHasPhases
                              ? [
                                  {
                                    label: selectedLesson.phaseTitle
                                      ? `Phase: ${selectedLesson.phaseTitle}`
                                      : "Missing course phase assignment",
                                    ok: Boolean(selectedLesson.phaseTitle),
                                  },
                                ]
                              : []),
                            {
                              label: selectedLesson.hasVideo
                                ? `Video linked${selectedLesson.durationSeconds ? ` (${Math.round(selectedLesson.durationSeconds / 60)}m)` : ""}`
                                : "No YouTube video attached",
                              ok: selectedLesson.hasVideo,
                              soft: true,
                            },
                            {
                              label: selectedLesson.hasQuiz
                                ? `Quiz attached (${selectedLesson.quizQuestionCount} questions)`
                                : "No knowledge check quiz",
                              ok: selectedLesson.hasQuiz,
                              soft: true,
                            },
                          ].map((check) => (
                            <div
                              key={check.label}
                              className="flex items-center gap-2 text-xs font-semibold"
                            >
                              {check.ok ? (
                                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                              ) : check.warn || check.soft ? (
                                <AlertCircle
                                  className={cn(
                                    "size-4 shrink-0",
                                    check.warn
                                      ? "text-amber-500"
                                      : "text-muted-foreground",
                                  )}
                                />
                              ) : (
                                <AlertTriangle className="size-4 text-rose-500 shrink-0" />
                              )}
                              <span
                                className={cn(
                                  "truncate",
                                  check.ok
                                    ? "text-foreground"
                                    : check.soft
                                      ? "text-muted-foreground"
                                      : "text-rose-500",
                                )}
                              >
                                {check.label}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="rounded-xl border border-border/50 bg-background p-2.5 text-center">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                              Code Blocks
                            </p>
                            <p className="text-sm font-extrabold text-foreground mt-0.5">
                              {selectedLesson.codeBlockCount}
                            </p>
                          </div>
                          <div className="rounded-xl border border-border/50 bg-background p-2.5 text-center">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                              Completions
                            </p>
                            <p className="text-sm font-extrabold text-foreground mt-0.5">
                              {selectedLesson.completionCount}
                            </p>
                          </div>
                          <div className="rounded-xl border border-border/50 bg-background p-2.5 text-center">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                              Open Q&amp;A
                            </p>
                            <p
                              className={cn(
                                "text-sm font-extrabold mt-0.5",
                                selectedLesson.unansweredQuestionCount > 0
                                  ? "text-amber-500"
                                  : "text-foreground",
                              )}
                            >
                              {selectedLesson.unansweredQuestionCount}
                            </p>
                          </div>
                        </div>

                        {/* Inline Quick Edit */}
                        <div className="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              Quick Metadata Edit
                            </p>
                            <button
                              type="button"
                              disabled={togglingLessonIds.has(
                                selectedLesson.id,
                              )}
                              onClick={() =>
                                void handleToggleFreeAccess(selectedLesson)
                              }
                              className={cn(
                                "rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider transition-all",
                                selectedLesson.isFree
                                  ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                                  : "bg-muted text-muted-foreground border border-border",
                              )}
                            >
                              {selectedLesson.isFree
                                ? "Free Preview"
                                : "Paid Content"}
                            </button>
                          </div>

                          <div className="space-y-1.5">
                            <Label
                              htmlFor="inspector-video-url"
                              className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1"
                            >
                              <Video className="size-3 text-red-500" />
                              YouTube URL or Video ID
                            </Label>
                            <Input
                              id="inspector-video-url"
                              value={quickVideoUrl}
                              onChange={(e) => setQuickVideoUrl(e.target.value)}
                              placeholder="https://www.youtube.com/watch?v=..."
                              className="h-9 rounded-xl border-border bg-background text-xs font-semibold"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label
                              htmlFor="inspector-duration"
                              className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1"
                            >
                              <Clock className="size-3 text-[#ff6636]" />
                              Duration (Minutes)
                            </Label>
                            <Input
                              id="inspector-duration"
                              type="number"
                              min={0}
                              value={quickDurationMinutes}
                              onChange={(e) =>
                                setQuickDurationMinutes(e.target.value)
                              }
                              placeholder="e.g. 15"
                              className="h-9 rounded-xl border-border bg-background text-xs font-semibold"
                            />
                          </div>

                          <Button
                            type="button"
                            size="sm"
                            onClick={() => void handleSaveQuickMetadata()}
                            disabled={!quickMetaDirty || quickSaving}
                            className="w-full h-9 rounded-xl text-xs font-bold gap-1.5"
                          >
                            {quickSaving ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Save className="size-3.5" />
                            )}
                            Save Video &amp; Duration
                          </Button>
                        </div>

                        {/* Deep-link Action Buttons */}
                        <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
                          <Link
                            href={`/admin/courses/${selectedLesson.courseId}/lessons?editLessonId=${selectedLesson.id}`}
                            className="w-full"
                          >
                            <Button className="w-full rounded-xl h-10 text-xs font-bold gap-1.5 bg-[#ff6636] hover:bg-[#e95a2b] text-white">
                              <Edit className="size-4" /> Edit Content in Studio
                            </Button>
                          </Link>

                          <div className="grid grid-cols-2 gap-2">
                            <Link
                              href={`/admin/courses/${selectedLesson.courseId}/lessons?quizLessonId=${selectedLesson.id}`}
                            >
                              <Button
                                variant="outline"
                                className="w-full rounded-xl h-9 text-xs font-bold gap-1.5"
                              >
                                <Award className="size-3.5" />
                                {selectedLesson.hasQuiz ? "Quiz" : "Add Quiz"}
                              </Button>
                            </Link>
                            <Link href={`/courses/${selectedLesson.courseSlug}`}>
                              <Button
                                variant="outline"
                                className="w-full rounded-xl h-9 text-xs font-bold gap-1.5"
                              >
                                <BookOpen className="size-3.5" /> Course Page
                              </Button>
                            </Link>
                          </div>

                          {selectedLesson.unansweredQuestionCount > 0 ? (
                            <Link href="/admin/questions">
                              <Button
                                variant="outline"
                                className="w-full rounded-xl h-9 text-xs font-bold gap-1.5 border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                              >
                                <MessageCircleQuestion className="size-3.5" />
                                Answer {selectedLesson.unansweredQuestionCount}{" "}
                                Open Question
                                {selectedLesson.unansweredQuestionCount === 1
                                  ? ""
                                  : "s"}
                              </Button>
                            </Link>
                          ) : null}
                        </div>
                      </CardContent>
                    </TabsContent>

                    <TabsContent value="preview" className="m-0">
                      <CardContent className="p-5 space-y-4">
                        {detailLoadingId === selectedLesson.id ? (
                          <div className="py-12 text-center text-xs font-semibold text-muted-foreground">
                            <Loader2 className="size-5 animate-spin mx-auto mb-2 text-[#ff6636]" />
                            Loading rendered preview...
                          </div>
                        ) : (
                          <>
                            {selectedLesson.videoUrl &&
                            extractYouTubeId(selectedLesson.videoUrl) ? (
                              <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
                                <iframe
                                  src={
                                    getYouTubeEmbedUrl(
                                      selectedLesson.videoUrl,
                                    ) ?? undefined
                                  }
                                  title={selectedLesson.title}
                                  className="h-full w-full"
                                  allowFullScreen
                                />
                              </div>
                            ) : null}

                            <div className="max-h-[460px] overflow-y-auto rounded-xl border border-border/60 bg-background p-4">
                              {parsedPreviewDoc ? (
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                  <RichTextRenderer content={parsedPreviewDoc} />
                                </div>
                              ) : lessonDetailCache[selectedLesson.id]
                                  ?.content ? (
                                <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
                                  {selectedLesson.excerpt ||
                                    lessonDetailCache[selectedLesson.id].content}
                                </p>
                              ) : (
                                <p className="text-xs italic text-muted-foreground">
                                  No content available to preview.
                                </p>
                              )}
                            </div>

                            <Link
                              href={`/admin/courses/${selectedLesson.courseId}/lessons?editLessonId=${selectedLesson.id}`}
                              className="block"
                            >
                              <Button className="w-full rounded-xl h-10 text-xs font-bold gap-1.5 bg-[#ff6636] hover:bg-[#e95a2b] text-white">
                                <Edit className="size-4" /> Edit This Lesson
                              </Button>
                            </Link>
                          </>
                        )}
                      </CardContent>
                    </TabsContent>
                  </Tabs>
                </Card>
              </div>
            ) : null}
          </div>
        </TabsContent>

        {/* Tab 2: Course Readiness Matrix */}
        <TabsContent value="courses" className="mt-0">
          <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/50 px-6 py-4">
              <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
                <Layers className="size-4.5 text-[#ff6636]" />
                Course Content Readiness ({filteredCourseSummaries.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/10">
                    <TableRow className="hover:bg-transparent border-b border-border/40">
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-6 py-3.5">
                        Course
                      </TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3.5 text-center">
                        Lessons
                      </TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3.5">
                        Content Readiness
                      </TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3.5 text-center">
                        Empty / Thin
                      </TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3.5 text-center">
                        No Module
                      </TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3.5 text-center">
                        No Video
                      </TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3.5 text-center">
                        No Quiz
                      </TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3.5 text-right">
                        Avg Words
                      </TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-6 py-3.5 text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="py-12 text-center text-xs font-semibold text-muted-foreground"
                        >
                          <Loader2 className="size-5 animate-spin mx-auto mb-2 text-[#ff6636]" />
                          Calculating course readiness...
                        </TableCell>
                      </TableRow>
                    ) : filteredCourseSummaries.length > 0 ? (
                      filteredCourseSummaries.map((course) => (
                        <TableRow
                          key={course.courseId}
                          className="hover:bg-muted/10 border-b border-border/30 last:border-b-0"
                        >
                          <TableCell className="px-6 py-4 max-w-[260px]">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    "rounded border px-1.5 py-0.2 text-[8px] font-extrabold uppercase tracking-wider shrink-0",
                                    getCourseStatusTone(course.courseStatus),
                                  )}
                                >
                                  {course.courseStatus}
                                </span>
                                <p className="truncate text-xs font-bold text-foreground">
                                  {course.courseTitle}
                                </p>
                              </div>
                              <p className="text-[11px] text-muted-foreground">
                                {course.instructorName} · {course.freeCount} free
                                {course.unansweredQaCount > 0
                                  ? ` · ${course.unansweredQaCount} open Q&A`
                                  : ""}
                              </p>
                            </div>
                          </TableCell>

                          <TableCell className="px-4 py-4 text-center">
                            {course.totalLessons === 0 ? (
                              <span className="rounded-md bg-rose-500/15 px-2 py-0.5 text-[10px] font-extrabold text-rose-500">
                                0 lessons
                              </span>
                            ) : (
                              <span className="text-xs font-extrabold text-foreground">
                                {course.totalLessons}
                              </span>
                            )}
                          </TableCell>

                          <TableCell className="px-4 py-4 min-w-[170px]">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-bold">
                                <span className="text-muted-foreground">
                                  {course.readyLessons}/{course.totalLessons}{" "}
                                  ready
                                </span>
                                <span
                                  className={cn(
                                    course.readinessScore >= 85
                                      ? "text-emerald-500"
                                      : course.readinessScore >= 50
                                        ? "text-amber-500"
                                        : "text-rose-500",
                                  )}
                                >
                                  {course.readinessScore}%
                                </span>
                              </div>
                              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all",
                                    course.readinessScore >= 85
                                      ? "bg-emerald-500"
                                      : course.readinessScore >= 50
                                        ? "bg-amber-500"
                                        : "bg-rose-500",
                                  )}
                                  style={{
                                    width: `${course.readinessScore}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="px-4 py-4 text-center">
                            <span
                              className={cn(
                                "rounded-md px-2 py-0.5 text-[10px] font-extrabold",
                                course.emptyCount + course.thinCount > 0
                                  ? "bg-rose-500/10 text-rose-500"
                                  : "bg-emerald-500/10 text-emerald-500",
                              )}
                            >
                              {course.emptyCount} / {course.thinCount}
                            </span>
                          </TableCell>

                          <TableCell className="px-4 py-4 text-center">
                            <span
                              className={cn(
                                "text-xs font-bold",
                                course.unassignedCount > 0
                                  ? "text-amber-500"
                                  : "text-muted-foreground",
                              )}
                            >
                              {course.unassignedCount}
                            </span>
                          </TableCell>

                          <TableCell className="px-4 py-4 text-center text-xs font-semibold text-muted-foreground">
                            {course.missingVideoCount}
                          </TableCell>

                          <TableCell className="px-4 py-4 text-center text-xs font-semibold text-muted-foreground">
                            {course.noQuizCount}
                          </TableCell>

                          <TableCell className="px-4 py-4 text-right text-xs font-bold text-foreground">
                            {course.avgWords.toLocaleString()}
                          </TableCell>

                          <TableCell className="px-6 py-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setCourseFilter(course.courseId);
                                  setFilter("all");
                                  setWorkspaceTab("audit");
                                }}
                                className="h-8 rounded-xl text-[11px] font-bold"
                              >
                                Audit Lessons
                              </Button>
                              <Link
                                href={`/admin/courses/${course.courseId}/lessons`}
                              >
                                <Button
                                  size="sm"
                                  className="h-8 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] text-white text-[11px] font-bold"
                                >
                                  Curriculum
                                </Button>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="py-12 text-center text-xs font-semibold text-muted-foreground"
                        >
                          No courses matched the selected filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminPage>
  );
}
