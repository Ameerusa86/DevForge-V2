"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Download,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Copy,
  Plus,
  Users,
  BookOpen,
  Loader2,
  CheckSquare,
  CalendarDays,
  Clock3,
} from "lucide-react";

type AdminCourse = {
  id: string;
  slug: string;
  title: string;
  instructor: string;
  category: string;
  level: string;
  status: string;
  price: number;
  lessons: number;
  modules: number;
  enrollments: number;
  rating: number;
  imageUrl?: string | null;
  createdAt: string;
  publishedAt?: string | null;
  updatedAt: string;
  schedule?: {
    courseId: string;
    publishAt: string | null;
    unpublishAt: string | null;
    updatedAt: string;
  } | null;
};

type CoursePreviewDetails = {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  level: string;
  status: string;
  price: number;
  imageUrl?: string | null;
  tags: string[];
  durationMinutes?: number | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  instructor: {
    id: string;
    name: string;
    email: string;
  };
  lessons: Array<{ id: string }>;
  enrollments: Array<{ id: string }>;
};

type CourseAuditEvent = {
  id: string;
  title: string;
  description: string;
  occurredAt: string;
  type: "course" | "module" | "lesson" | "enrollment" | "review";
  actionUrl?: string | null;
};

type AttentionFilter =
  | "all"
  | "no-image"
  | "no-lessons"
  | "no-modules"
  | "no-enrollments"
  | "unrated";

type BulkUpdatePayload = {
  status?: "PUBLISHED" | "DRAFT" | "ARCHIVED";
  category?:
    | "FRONTEND"
    | "BACKEND"
    | "FULL_STACK"
    | "PYTHON"
    | "JAVASCRIPT"
    | "TYPESCRIPT"
    | "CSHARP"
    | "DOT_NET"
    | "ASP_NET";
};

type BulkActionSnapshot = {
  id: string;
  status: "PUBLISHED" | "DRAFT" | "ARCHIVED";
  category:
    | "FRONTEND"
    | "BACKEND"
    | "FULL_STACK"
    | "PYTHON"
    | "JAVASCRIPT"
    | "TYPESCRIPT"
    | "CSHARP"
    | "DOT_NET"
    | "ASP_NET";
};

type PendingBulkAction = {
  label: string;
  payload: BulkUpdatePayload;
};

type SortMode = "newest" | "oldest" | "stale-first" | "health-low";

type InstructorWorkload = {
  instructor: string;
  courses: number;
  published: number;
  draft: number;
  enrollments: number;
};

export default function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(
    new Set(),
  );
  const [activeAttentionFilter, setActiveAttentionFilter] =
    useState<AttentionFilter>("all");
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [isUndoingBulk, setIsUndoingBulk] = useState(false);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [pendingBulkAction, setPendingBulkAction] =
    useState<PendingBulkAction | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewCourseId, setPreviewCourseId] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewCourse, setPreviewCourse] =
    useState<CoursePreviewDetails | null>(null);
  const [previewAudit, setPreviewAudit] = useState<CourseAuditEvent[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleCourse, setScheduleCourse] = useState<AdminCourse | null>(
    null,
  );
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [publishAtInput, setPublishAtInput] = useState("");
  const [unpublishAtInput, setUnpublishAtInput] = useState("");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/admin/courses");
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (courseId: string) => {
    setPendingDeleteId(courseId);
    setDeleteDialogOpen(true);
  };

  const handleUpdateStatus = async (courseId: string, newStatus: string) => {
    setUpdatingId(courseId);
    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          publishedAt:
            newStatus === "PUBLISHED" ? new Date().toISOString() : null,
        }),
      });
      if (response.ok) {
        const updated = await response.json();
        setCourses((prev) =>
          prev.map((c) => (c.id === courseId ? updated : c)),
        );
      }
    } catch (error) {
      console.error("Failed to update course status:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const matchesAttentionFilter = (
    course: AdminCourse,
    filter: AttentionFilter,
  ) => {
    if (filter === "all") return true;
    if (filter === "no-image") return !course.imageUrl;
    if (filter === "no-lessons") return course.lessons === 0;
    if (filter === "no-modules") return course.modules === 0;
    if (filter === "no-enrollments") return course.enrollments === 0;
    if (filter === "unrated") return course.rating <= 0;
    return true;
  };

  const calculateHealthScore = (course: AdminCourse) => {
    const statusScore =
      course.status === "PUBLISHED" ? 30 : course.status === "DRAFT" ? 16 : 8;
    const contentScore = Math.min(
      25,
      course.lessons * 2 + course.modules * 1.5,
    );
    const mediaScore = course.imageUrl ? 10 : 0;
    const tractionScore = Math.min(20, course.enrollments * 2);
    const qualityScore = Math.min(15, (course.rating / 5) * 15);

    return Math.round(
      statusScore + contentScore + mediaScore + tractionScore + qualityScore,
    );
  };

  const getHealthTone = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-600";
    return "text-rose-600";
  };

  const getFreshness = (updatedAt: string) => {
    const updated = new Date(updatedAt).getTime();
    const days = Math.max(
      0,
      Math.floor((Date.now() - updated) / (1000 * 60 * 60 * 24)),
    );

    if (days <= 7) {
      return {
        label: "Fresh",
        sublabel: `${days}d`,
        className: "text-emerald-600",
      };
    }

    if (days <= 30) {
      return {
        label: "Aging",
        sublabel: `${days}d`,
        className: "text-amber-600",
      };
    }

    return { label: "Stale", sublabel: `${days}d`, className: "text-rose-600" };
  };

  const toDateTimeLocalValue = (isoValue: string | null | undefined) => {
    if (!isoValue) return "";
    const date = new Date(isoValue);
    const tzOffsetMs = date.getTimezoneOffset() * 60 * 1000;
    const localDate = new Date(date.getTime() - tzOffsetMs);
    return localDate.toISOString().slice(0, 16);
  };

  const openScheduleDialog = async (course: AdminCourse) => {
    setScheduleDialogOpen(true);
    setScheduleCourse(course);
    setScheduleLoading(true);
    setPublishAtInput(toDateTimeLocalValue(course.schedule?.publishAt));
    setUnpublishAtInput(toDateTimeLocalValue(course.schedule?.unpublishAt));

    try {
      const response = await fetch(`/api/admin/courses/${course.id}/schedule`);
      if (!response.ok) {
        throw new Error("Failed to fetch schedule");
      }

      const data = (await response.json()) as {
        schedule: {
          publishAt: string | null;
          unpublishAt: string | null;
        } | null;
      };

      setPublishAtInput(toDateTimeLocalValue(data.schedule?.publishAt));
      setUnpublishAtInput(toDateTimeLocalValue(data.schedule?.unpublishAt));
    } catch (error) {
      console.error("Failed to load schedule:", error);
      toast.error("Failed to load schedule");
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleSaveSchedule = async () => {
    if (!scheduleCourse) return;

    setSavingSchedule(true);
    try {
      const publishAt = publishAtInput
        ? new Date(publishAtInput).toISOString()
        : null;
      const unpublishAt = unpublishAtInput
        ? new Date(unpublishAtInput).toISOString()
        : null;

      if (
        publishAt &&
        unpublishAt &&
        new Date(unpublishAt) <= new Date(publishAt)
      ) {
        toast.error("Unpublish time must be after publish time");
        return;
      }

      const response = await fetch(
        `/api/admin/courses/${scheduleCourse.id}/schedule`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publishAt, unpublishAt }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to save schedule");
      }

      toast.success("Schedule updated");
      setScheduleDialogOpen(false);
      setScheduleCourse(null);
      await fetchCourses();
    } catch (error) {
      console.error("Failed to save schedule:", error);
      toast.error("Failed to update schedule");
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleToggleSelectCourse = (courseId: string) => {
    setSelectedCourseIds((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      return next;
    });
  };

  const handleToggleSelectAllVisible = (courseIds: string[]) => {
    const allSelected =
      courseIds.length > 0 &&
      courseIds.every((courseId) => selectedCourseIds.has(courseId));

    setSelectedCourseIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        courseIds.forEach((id) => next.delete(id));
      } else {
        courseIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const openPreviewDrawer = async (courseId: string) => {
    setPreviewOpen(true);
    setPreviewCourseId(courseId);
    setPreviewLoading(true);
    setPreviewCourse(null);
    setPreviewAudit([]);

    try {
      const [detailsResponse, auditResponse] = await Promise.all([
        fetch(`/api/admin/courses/${courseId}`),
        fetch(`/api/admin/courses/${courseId}/audit`),
      ]);

      if (!detailsResponse.ok) {
        throw new Error("Failed to load course preview");
      }

      const details = (await detailsResponse.json()) as CoursePreviewDetails;
      setPreviewCourse(details);

      if (auditResponse.ok) {
        const auditData = (await auditResponse.json()) as {
          events: CourseAuditEvent[];
        };
        setPreviewAudit(auditData.events || []);
      }
    } catch (error) {
      console.error("Failed to load course preview drawer:", error);
      toast.error("Failed to load course preview");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleUndoBulkUpdate = async (snapshots: BulkActionSnapshot[]) => {
    if (snapshots.length === 0) return;

    setIsUndoingBulk(true);
    try {
      const responses = await Promise.all(
        snapshots.map((snapshot) =>
          fetch(`/api/admin/courses/${snapshot.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: snapshot.status,
              category: snapshot.category,
              publishedAt:
                snapshot.status === "PUBLISHED"
                  ? new Date().toISOString()
                  : null,
            }),
          }),
        ),
      );

      if (responses.some((response) => !response.ok)) {
        throw new Error("Failed to undo bulk changes");
      }

      toast.success("Bulk changes undone", {
        description: `${snapshots.length} course(s) restored.`,
      });
      await fetchCourses();
    } catch (error) {
      console.error("Failed to undo bulk update:", error);
      toast.error("Failed to undo bulk changes");
    } finally {
      setIsUndoingBulk(false);
    }
  };

  const handleBulkUpdate = async (
    payload: BulkUpdatePayload,
    actionLabel: string,
  ) => {
    if (selectedCourseIds.size === 0) return;

    const snapshots: BulkActionSnapshot[] = courses
      .filter((course) => selectedCourseIds.has(course.id))
      .map((course) => ({
        id: course.id,
        status: course.status as BulkActionSnapshot["status"],
        category: course.category as BulkActionSnapshot["category"],
      }));

    setIsBulkUpdating(true);
    try {
      const response = await fetch("/api/admin/courses/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseIds: Array.from(selectedCourseIds),
          ...payload,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to apply bulk update");
      }

      toast.success("Bulk update applied", {
        description: `${selectedCourseIds.size} course(s) updated via ${actionLabel}.`,
        action: {
          label: "Undo",
          onClick: () => {
            void handleUndoBulkUpdate(snapshots);
          },
        },
      });
      setSelectedCourseIds(new Set());
      await fetchCourses();
    } catch (error) {
      console.error("Failed bulk update:", error);
      toast.error("Failed to apply bulk update");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const openBulkActionConfirm = (payload: BulkUpdatePayload, label: string) => {
    if (selectedCourseIds.size === 0) return;

    setPendingBulkAction({ payload, label });
    setBulkConfirmOpen(true);
  };

  const confirmBulkAction = async () => {
    if (!pendingBulkAction) return;

    await handleBulkUpdate(pendingBulkAction.payload, pendingBulkAction.label);
    setBulkConfirmOpen(false);
    setPendingBulkAction(null);
  };

  const handleExportFilteredCourses = () => {
    if (filteredCourses.length === 0) {
      toast.info("No courses to export");
      return;
    }

    const escapeCsv = (value: string | number) =>
      `"${String(value).replaceAll('"', '""')}"`;

    const headers = [
      "Title",
      "Slug",
      "Instructor",
      "Category",
      "Level",
      "Status",
      "Price",
      "Lessons",
      "Modules",
      "Enrollments",
      "Rating",
      "Updated At",
    ];

    const rows = filteredCourses.map((course) =>
      [
        course.title,
        course.slug,
        course.instructor,
        course.category,
        course.level,
        course.status,
        course.price,
        course.lessons,
        course.modules,
        course.enrollments,
        course.rating,
        course.updatedAt,
      ]
        .map((value) => escapeCsv(value))
        .join(","),
    );

    const metadataRows = [
      ["Exported At", new Date().toISOString()],
      ["Attention Filter", activeAttentionFilter],
      ["Search Query", searchQuery || "(none)"],
      ["Row Count", String(filteredCourses.length)],
    ].map(([key, value]) => [escapeCsv(key), escapeCsv(value)].join(","));

    const csv = [...metadataRows, "", headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filterSuffix =
      activeAttentionFilter === "all" ? "all" : activeAttentionFilter;

    link.href = url;
    link.download = `courses-${filterSuffix}-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    toast.success("Export complete", {
      description: `${filteredCourses.length} course(s) exported.`,
    });
  };

  const handleDelete = async () => {
    if (!pendingDeleteId) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/courses/${pendingDeleteId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setCourses((prev) => prev.filter((c) => c.id !== pendingDeleteId));
        setDeleteDialogOpen(false);
        setPendingDeleteId(null);
        toast.success("Course deleted successfully");
      } else {
        toast.error("Failed to delete course");
      }
    } catch (error) {
      console.error("Failed to delete course:", error);
      toast.error("Failed to delete course");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async (courseId: string) => {
    setDuplicatingId(courseId);
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          includeCurriculum: true,
        }),
      });

      if (response.ok) {
        toast.success("Course duplicated successfully");
        await fetchCourses();
      } else {
        toast.error("Failed to duplicate course");
      }
    } catch (error) {
      console.error("Failed to duplicate course:", error);
      toast.error("Failed to duplicate course");
    } finally {
      setDuplicatingId(null);
    }
  };

  const filteredCourses = courses
    .filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.slug.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      return matchesAttentionFilter(course, activeAttentionFilter);
    })
    .sort((a, b) => {
      if (sortMode === "newest") {
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      }

      if (sortMode === "oldest") {
        return (
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        );
      }

      if (sortMode === "stale-first") {
        return (
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        );
      }

      return calculateHealthScore(a) - calculateHealthScore(b);
    });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      PUBLISHED: "default",
      DRAFT: "secondary",
      ARCHIVED: "outline",
    };
    return variants[status] || "default";
  };

  const stats = {
    total: courses.length,
    published: courses.filter((c) => c.status === "PUBLISHED").length,
    draft: courses.filter((c) => c.status === "DRAFT").length,
    avgRating: (
      courses
        .filter((c) => c.rating > 0)
        .reduce((sum, c) => sum + c.rating, 0) /
      courses.filter((c) => c.rating > 0).length
    ).toFixed(1),
  };

  const instructorWorkloads: InstructorWorkload[] = Object.values(
    courses.reduce<Record<string, InstructorWorkload>>((acc, course) => {
      if (!acc[course.instructor]) {
        acc[course.instructor] = {
          instructor: course.instructor,
          courses: 0,
          published: 0,
          draft: 0,
          enrollments: 0,
        };
      }

      acc[course.instructor].courses += 1;
      acc[course.instructor].enrollments += course.enrollments;

      if (course.status === "PUBLISHED") {
        acc[course.instructor].published += 1;
      }
      if (course.status === "DRAFT") {
        acc[course.instructor].draft += 1;
      }

      return acc;
    }, {}),
  ).sort((a, b) => b.courses - a.courses || b.enrollments - a.enrollments);

  const attentionCounts: Record<AttentionFilter, number> = {
    all: courses.length,
    "no-image": courses.filter((c) => !c.imageUrl).length,
    "no-lessons": courses.filter((c) => c.lessons === 0).length,
    "no-modules": courses.filter((c) => c.modules === 0).length,
    "no-enrollments": courses.filter((c) => c.enrollments === 0).length,
    unrated: courses.filter((c) => c.rating <= 0).length,
  };

  const visibleCourseIds = filteredCourses.map((course) => course.id);
  const allVisibleSelected =
    visibleCourseIds.length > 0 &&
    visibleCourseIds.every((courseId) => selectedCourseIds.has(courseId));

  return (
    <>
      <AdminPage>
        <AdminPageHeader
          eyebrow="Catalog control"
          title="Courses"
          description="Manage publishing, duplication, lesson access, and lifecycle changes across the catalog."
          actions={
            <Link href="/admin/courses/create">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Course
              </Button>
            </Link>
          }
        />

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.published} published
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Published
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.published}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {((stats.published / stats.total) * 100).toFixed(0)}% of total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                In Draft
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.draft}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {((stats.draft / stats.total) * 100).toFixed(0)}% of total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg. Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.avgRating}</div>
              <p className="text-xs text-muted-foreground mt-1">
                From {courses.filter((c) => c.rating > 0).length} rated courses
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search courses by title, slug, or instructor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleExportFilteredCourses}
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Sort</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Sort courses</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortMode("newest")}>
                    Newest updated
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortMode("oldest")}>
                    Oldest updated
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortMode("stale-first")}>
                    Stale first
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortMode("health-low")}>
                    Lowest health first
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(
                [
                  ["all", "All"],
                  ["no-image", "No Image"],
                  ["no-lessons", "No Lessons"],
                  ["no-modules", "No Modules"],
                  ["no-enrollments", "No Enrollments"],
                  ["unrated", "Unrated"],
                ] as Array<[AttentionFilter, string]>
              ).map(([value, label]) => (
                <Button
                  key={value}
                  variant={
                    activeAttentionFilter === value ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setActiveAttentionFilter(value)}
                  className="gap-2"
                >
                  {label}
                  <Badge variant="secondary" className="ml-1">
                    {attentionCounts[value]}
                  </Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {selectedCourseIds.size > 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <CheckSquare className="h-4 w-4" />
                  <span>{selectedCourseIds.size} course(s) selected</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      openBulkActionConfirm({ status: "PUBLISHED" }, "publish")
                    }
                    disabled={isBulkUpdating || isUndoingBulk}
                  >
                    Publish
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      openBulkActionConfirm(
                        { status: "DRAFT" },
                        "move to draft",
                      )
                    }
                    disabled={isBulkUpdating || isUndoingBulk}
                  >
                    Move to Draft
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      openBulkActionConfirm({ status: "ARCHIVED" }, "archive")
                    }
                    disabled={isBulkUpdating || isUndoingBulk}
                  >
                    Archive
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isBulkUpdating}
                      >
                        Set Category
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Apply Category</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {[
                        "FRONTEND",
                        "BACKEND",
                        "FULL_STACK",
                        "PYTHON",
                        "JAVASCRIPT",
                        "TYPESCRIPT",
                        "CSHARP",
                        "DOT_NET",
                        "ASP_NET",
                      ].map((category) => (
                        <DropdownMenuItem
                          key={category}
                          onClick={() =>
                            openBulkActionConfirm(
                              {
                                category:
                                  category as BulkUpdatePayload["category"],
                              },
                              `set category to ${category}`,
                            )
                          }
                        >
                          {category}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedCourseIds(new Set())}
                    disabled={isBulkUpdating}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Instructor Workload</CardTitle>
          </CardHeader>
          <CardContent>
            {instructorWorkloads.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No instructor workload data yet.
              </p>
            ) : (
              <div className="space-y-2">
                {instructorWorkloads.slice(0, 6).map((item) => (
                  <div
                    key={item.instructor}
                    className="flex flex-col gap-2 rounded-md border p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">{item.instructor}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.courses} course(s), {item.enrollments} total
                        enrollments
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="default">
                        Published {item.published}
                      </Badge>
                      <Badge variant="secondary">Draft {item.draft}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Courses Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Courses ({filteredCourses.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allVisibleSelected}
                        onCheckedChange={() =>
                          handleToggleSelectAllVisible(visibleCourseIds)
                        }
                        aria-label="Select all visible courses"
                      />
                    </TableHead>
                    <TableHead>Course Title</TableHead>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-center">Lessons</TableHead>
                    <TableHead className="text-center">Enrollments</TableHead>
                    <TableHead>Health</TableHead>
                    <TableHead>Freshness</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.map((course) => {
                    const healthScore = calculateHealthScore(course);
                    const freshness = getFreshness(course.updatedAt);

                    return (
                      <TableRow key={course.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedCourseIds.has(course.id)}
                            onCheckedChange={() =>
                              handleToggleSelectCourse(course.id)
                            }
                            aria-label={`Select ${course.title}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium max-w-xs">
                          <div>
                            <p>{course.title}</p>
                            <p className="text-xs text-muted-foreground">
                              /{course.slug}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {course.instructor}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{course.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{course.level}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadge(course.status)}>
                            {course.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {course.price > 0 ? `$${course.price}` : "Free"}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            {course.lessons}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {course.enrollments}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-semibold ${getHealthTone(healthScore)}`}
                            >
                              {healthScore}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              /100
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span
                              className={`text-sm font-medium ${freshness.className}`}
                            >
                              {freshness.label}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {freshness.sublabel}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {course.schedule?.publishAt ||
                          course.schedule?.unpublishAt ? (
                            <div className="text-xs text-muted-foreground space-y-1">
                              {course.schedule.publishAt ? (
                                <p>
                                  Publish:{" "}
                                  {new Date(
                                    course.schedule.publishAt,
                                  ).toLocaleString()}
                                </p>
                              ) : null}
                              {course.schedule.unpublishAt ? (
                                <p>
                                  Unpublish:{" "}
                                  {new Date(
                                    course.schedule.unpublishAt,
                                  ).toLocaleString()}
                                </p>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              No schedule
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {course.rating > 0 ? (
                            <div className="flex items-center gap-1">
                              <span className="font-medium">
                                {course.rating}
                              </span>
                              <span className="text-yellow-500">★</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="gap-2"
                                onClick={() => openPreviewDrawer(course.id)}
                              >
                                <Eye className="h-4 w-4" />
                                Quick Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/courses/${course.slug}`}
                                  className="gap-2 flex"
                                >
                                  <Eye className="h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/admin/courses/${course.id}/edit`}
                                  className="gap-2 flex"
                                >
                                  <Edit className="h-4 w-4" />
                                  Edit Course
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/admin/courses/${course.id}/lessons`}
                                  className="gap-2 flex"
                                >
                                  <BookOpen className="h-4 w-4" />
                                  Manage Lessons
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/admin/enrollments?courseId=${course.id}`}
                                  className="gap-2 flex"
                                >
                                  <Users className="h-4 w-4" />
                                  View Enrollments
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="gap-2"
                                onClick={() => openScheduleDialog(course)}
                              >
                                <CalendarDays className="h-4 w-4" />
                                Set Schedule
                              </DropdownMenuItem>
                              <DropdownMenuLabel className="text-xs">
                                Change Status
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                className="gap-2"
                                onClick={() =>
                                  handleUpdateStatus(course.id, "PUBLISHED")
                                }
                                disabled={
                                  updatingId === course.id ||
                                  course.status === "PUBLISHED"
                                }
                              >
                                Publish
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2"
                                onClick={() =>
                                  handleUpdateStatus(course.id, "DRAFT")
                                }
                                disabled={
                                  updatingId === course.id ||
                                  course.status === "DRAFT"
                                }
                              >
                                Move to Draft
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2"
                                onClick={() =>
                                  handleUpdateStatus(course.id, "ARCHIVED")
                                }
                                disabled={
                                  updatingId === course.id ||
                                  course.status === "ARCHIVED"
                                }
                              >
                                Archive
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="gap-2"
                                onClick={() => handleDuplicate(course.id)}
                                disabled={duplicatingId === course.id}
                              >
                                {duplicatingId === course.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                                Duplicate with Lessons
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2 text-destructive"
                                onClick={() => openDeleteDialog(course.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete Course
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </AdminPage>

      <Sheet
        open={previewOpen}
        onOpenChange={(open) => {
          setPreviewOpen(open);
          if (!open) {
            setPreviewCourseId(null);
            setPreviewCourse(null);
            setPreviewAudit([]);
          }
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-[620px]">
          <SheetHeader>
            <SheetTitle>Course Preview</SheetTitle>
            <SheetDescription>
              Quick summary and audit timeline for the selected course.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {previewLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading preview...
              </div>
            ) : previewCourse ? (
              <div className="space-y-6">
                <div className="rounded-lg border p-4">
                  <h3 className="text-base font-semibold">
                    {previewCourse.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    /{previewCourse.slug}
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {previewCourse.description}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Status:</span>{" "}
                      <span className="font-medium">
                        {previewCourse.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Category:</span>{" "}
                      <span className="font-medium">
                        {previewCourse.category}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Lessons:</span>{" "}
                      <span className="font-medium">
                        {previewCourse.lessons.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Enrollments:
                      </span>{" "}
                      <span className="font-medium">
                        {previewCourse.enrollments.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Price:</span>{" "}
                      <span className="font-medium">
                        {previewCourse.price > 0
                          ? `$${previewCourse.price}`
                          : "Free"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Level:</span>{" "}
                      <span className="font-medium">{previewCourse.level}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {previewCourse.tags.length > 0 ? (
                      previewCourse.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        No tags
                      </span>
                    )}
                  </div>

                  <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                    <p className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Created:{" "}
                      {new Date(previewCourse.createdAt).toLocaleString()}
                    </p>
                    <p className="flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      Updated:{" "}
                      {new Date(previewCourse.updatedAt).toLocaleString()}
                    </p>
                    {previewCourse.publishedAt ? (
                      <p className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        Published:{" "}
                        {new Date(previewCourse.publishedAt).toLocaleString()}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 text-sm font-semibold">Audit Timeline</h4>
                  {previewAudit.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No audit events available.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {previewAudit.map((event) => (
                        <div key={event.id} className="rounded-md border p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">{event.title}</p>
                            <Badge variant="outline" className="uppercase">
                              {event.type}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {event.description}
                          </p>
                          {event.actionUrl ? (
                            <Link
                              href={event.actionUrl}
                              className="mt-2 inline-flex text-xs font-medium text-[#ff6636] hover:underline"
                            >
                              Open related item
                            </Link>
                          ) : null}
                          <p className="mt-2 text-xs text-muted-foreground">
                            {new Date(event.occurredAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a course to preview.
              </p>
            )}
          </div>

          <div className="border-t p-4">
            <div className="flex justify-end gap-2">
              {previewCourseId ? (
                <Link href={`/admin/courses/${previewCourseId}/edit`}>
                  <Button variant="outline" size="sm">
                    Edit Course
                  </Button>
                </Link>
              ) : null}
              <Button size="sm" onClick={() => setPreviewOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog
        open={scheduleDialogOpen}
        onOpenChange={(open) => {
          setScheduleDialogOpen(open);
          if (!open) {
            setScheduleCourse(null);
            setPublishAtInput("");
            setUnpublishAtInput("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Course</DialogTitle>
            <DialogDescription>
              Set timed publish and unpublish dates for{" "}
              {scheduleCourse?.title || "this course"}.
            </DialogDescription>
          </DialogHeader>

          {scheduleLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading schedule...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="publish-at">Publish at</Label>
                <Input
                  id="publish-at"
                  type="datetime-local"
                  value={publishAtInput}
                  onChange={(e) => setPublishAtInput(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unpublish-at">Unpublish at</Label>
                <Input
                  id="unpublish-at"
                  type="datetime-local"
                  value={unpublishAtInput}
                  onChange={(e) => setUnpublishAtInput(e.target.value)}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Leave either field empty to remove that schedule.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setScheduleDialogOpen(false)}
              disabled={savingSchedule}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSchedule}
              disabled={scheduleLoading || savingSchedule || !scheduleCourse}
            >
              {savingSchedule ? "Saving..." : "Save Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={bulkConfirmOpen}
        onOpenChange={(open) => {
          setBulkConfirmOpen(open);
          if (!open) {
            setPendingBulkAction(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm bulk action?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingBulkAction
                ? `Apply ${pendingBulkAction.label} to ${selectedCourseIds.size} selected course(s)?`
                : "Apply this bulk action to selected courses?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkAction}
              disabled={isBulkUpdating || isUndoingBulk}
            >
              {isBulkUpdating ? "Applying..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setPendingDeleteId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete course?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the course and its associated image from storage.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                if (isDeleting) return;
                setPendingDeleteId(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
