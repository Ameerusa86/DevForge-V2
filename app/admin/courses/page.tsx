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
  updatedAt: string;
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

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.slug.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    return matchesAttentionFilter(course, activeAttentionFilter);
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
                    <TableHead>Rating</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.map((course) => (
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
                        {course.rating > 0 ? (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{course.rating}</span>
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
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </AdminPage>

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
