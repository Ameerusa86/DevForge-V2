"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Filter,
  Download,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Copy,
  Plus,
  Users,
  BookOpen,
} from "lucide-react";

export default function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
          prev.map((c) => (c.id === courseId ? updated : c))
        );
      }
    } catch (error) {
      console.error("Failed to update course status:", error);
    } finally {
      setUpdatingId(null);
    }
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
    try {
      const course = courses.find((c) => c.id === courseId);
      if (!course) return;

      const response = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...course,
          title: `${course.title} (Copy)`,
          slug: `${course.slug}-copy-${Date.now()}`,
          status: "DRAFT",
        }),
      });

      if (response.ok) {
        toast.success("Course duplicated successfully");
        fetchCourses();
      } else {
        toast.error("Failed to duplicate course");
      }
    } catch (error) {
      console.error("Failed to duplicate course:", error);
      toast.error("Failed to duplicate course");
    }
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Courses</h1>
            <p className="text-muted-foreground mt-1">
              Manage all courses and their content
            </p>
          </div>
          <Link href="/admin/courses/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Course
            </Button>
          </Link>
        </div>

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
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
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
                            >
                              <Copy className="h-4 w-4" />
                              Duplicate
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
      </div>

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
