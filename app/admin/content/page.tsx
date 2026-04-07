"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertCircle,
  BookOpen,
  Edit,
  FileText,
  Loader2,
  MoreVertical,
  Search,
  Star,
  TrendingUp,
} from "lucide-react";

type ContentLesson = {
  id: string;
  title: string;
  order: number;
  isFree: boolean;
  wordCount: number;
  contentLength: number;
  isEmpty: boolean;
  createdAt: string;
  updatedAt: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  courseStatus: string;
  moduleId: string | null;
  moduleTitle: string | null;
};

type ContentStats = {
  total: number;
  free: number;
  paid: number;
  empty: number;
  recentlyUpdated: number;
  avgWordCount: number;
};

type ContentFilter = "all" | "free" | "paid" | "empty";

export default function ContentPage() {
  const [lessons, setLessons] = useState<ContentLesson[]>([]);
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<ContentFilter>("all");
  const [courseFilter, setCourseFilter] = useState<string>("all");

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await fetch("/api/admin/content");
      if (!response.ok) throw new Error("Failed to fetch content");
      const data = (await response.json()) as {
        lessons: ContentLesson[];
        stats: ContentStats;
      };
      setLessons(data.lessons);
      setStats(data.stats);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load content library");
    } finally {
      setLoading(false);
    }
  };

  const uniqueCourses = Array.from(
    new Map(lessons.map((l) => [l.courseId, l.courseTitle])).entries(),
  ).sort((a, b) => a[1].localeCompare(b[1]));

  const filtered = lessons.filter((lesson) => {
    const matchesSearch =
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lesson.moduleTitle ?? "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (courseFilter !== "all" && lesson.courseId !== courseFilter)
      return false;

    if (filter === "free") return lesson.isFree;
    if (filter === "paid") return !lesson.isFree;
    if (filter === "empty") return lesson.isEmpty;
    return true;
  });

  const getWordCountTone = (count: number) => {
    if (count >= 300) return "text-emerald-600";
    if (count >= 100) return "text-amber-600";
    return "text-rose-600";
  };

  const getFreshnessLabel = (updatedAt: string) => {
    const days = Math.floor(
      (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24),
    );
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days <= 7) return `${days}d ago`;
    if (days <= 30) return `${days}d ago`;
    return new Date(updatedAt).toLocaleDateString();
  };

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Content management"
        title="Content Library"
        description="Review all lessons across every course — track word counts, free access, and empty content."
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Total Lessons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                (stats?.total ?? 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg. {stats?.avgWordCount ?? 0} words
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Star className="h-4 w-4" />
              Free Lessons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                (stats?.free ?? 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats && stats.total > 0
                ? `${((stats.free / stats.total) * 100).toFixed(0)}% of total`
                : "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Empty Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                (stats?.empty ?? 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Lessons with &lt;50 characters
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Updated This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                (stats?.recentlyUpdated ?? 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by lesson title, course, or module..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {uniqueCourses.length > 1 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="shrink-0">
                    {courseFilter === "all"
                      ? "All Courses"
                      : (uniqueCourses.find(
                          ([id]) => id === courseFilter,
                        )?.[1] ?? "Course")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="max-h-64 overflow-y-auto"
                >
                  <DropdownMenuItem onClick={() => setCourseFilter("all")}>
                    All Courses
                  </DropdownMenuItem>
                  {uniqueCourses.map(([id, title]) => (
                    <DropdownMenuItem
                      key={id}
                      onClick={() => setCourseFilter(id)}
                    >
                      {title}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "All"],
                ["free", "Free"],
                ["paid", "Paid"],
                ["empty", "Empty content"],
              ] as Array<[ContentFilter, string]>
            ).map(([value, label]) => (
              <Button
                key={value}
                size="sm"
                variant={filter === value ? "default" : "outline"}
                onClick={() => setFilter(value)}
              >
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Lessons
            {!loading && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({filtered.length}
                {filtered.length !== lessons.length
                  ? ` of ${lessons.length}`
                  : ""}
                )
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading content...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No lessons match your filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lesson</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Access</TableHead>
                    <TableHead>Words</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((lesson) => (
                    <TableRow key={lesson.id}>
                      <TableCell className="font-medium max-w-xs">
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 shrink-0 text-muted-foreground">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="line-clamp-1">{lesson.title}</p>
                            {lesson.isEmpty && (
                              <p className="text-xs text-rose-600 mt-0.5">
                                Empty content
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Link
                          href={`/admin/courses/${lesson.courseId}/lessons`}
                          className="text-sm hover:underline text-muted-foreground"
                        >
                          {lesson.courseTitle}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          <Badge
                            variant={
                              lesson.courseStatus === "PUBLISHED"
                                ? "default"
                                : "secondary"
                            }
                            className="text-[10px] px-1.5 py-0"
                          >
                            {lesson.courseStatus}
                          </Badge>
                        </p>
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        {lesson.moduleTitle ?? (
                          <span className="italic text-xs">Unassigned</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge variant={lesson.isFree ? "default" : "outline"}>
                          {lesson.isFree ? "Free" : "Paid"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <span
                          className={`font-medium text-sm ${getWordCountTone(lesson.wordCount)}`}
                        >
                          {lesson.wordCount.toLocaleString()}
                        </span>
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {getFreshnessLabel(lesson.updatedAt)}
                      </TableCell>

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/admin/courses/${lesson.courseId}/lessons`}
                                className="flex items-center gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                Edit in Lesson Manager
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/courses/${lesson.courseSlug}`}
                                className="flex items-center gap-2"
                              >
                                <BookOpen className="h-4 w-4" />
                                View Course
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminPage>
  );
}
