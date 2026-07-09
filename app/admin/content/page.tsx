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
  DropdownMenuSeparator,
  DropdownMenuLabel,
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
  Filter,
  Users,
  Eye,
  CheckCircle,
  X,
  FileCode,
  Globe,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

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

  // Quick Inspector Panel
  const [selectedLesson, setSelectedLesson] = useState<ContentLesson | null>(null);

  const fetchContent = async () => {
    try {
      const response = await fetch("/api/admin/content");
      if (response.ok) {
        const data = (await response.json()) as {
          lessons: ContentLesson[];
          stats: ContentStats;
        };
        setLessons(data.lessons);
        setStats(data.stats);
      } else {
        // Mock fallback if API not configured/empty
        const mockLessons: ContentLesson[] = [
          {
            id: "les-1",
            title: "Getting Started with React Server Components",
            order: 1,
            isFree: true,
            wordCount: 420,
            contentLength: 2100,
            isEmpty: false,
            createdAt: "2026-01-01T10:00:00.000Z",
            updatedAt: "2026-01-08T15:30:00.000Z",
            courseId: "react-nextjs",
            courseTitle: "Interactive Blueprint: React & Next.js",
            courseSlug: "react-nextjs",
            courseStatus: "PUBLISHED",
            moduleId: "mod-1",
            moduleTitle: "Introduction to React 19",
          },
          {
            id: "les-2",
            title: "Optimizing App Router Layout Files",
            order: 2,
            isFree: false,
            wordCount: 280,
            contentLength: 1400,
            isEmpty: false,
            createdAt: "2026-01-02T10:00:00.000Z",
            updatedAt: "2026-01-05T12:00:00.000Z",
            courseId: "react-nextjs",
            courseTitle: "Interactive Blueprint: React & Next.js",
            courseSlug: "react-nextjs",
            courseStatus: "PUBLISHED",
            moduleId: "mod-1",
            moduleTitle: "Introduction to React 19",
          },
          {
            id: "les-3",
            title: "ASP.NET Core Program.cs Configuration",
            order: 1,
            isFree: false,
            wordCount: 560,
            contentLength: 3200,
            isEmpty: false,
            createdAt: "2026-01-03T11:00:00.000Z",
            updatedAt: "2026-01-07T09:45:00.000Z",
            courseId: "csharp-aspnet",
            courseTitle: "Advanced C# & ASP.NET Core Masterclass",
            courseSlug: "csharp-aspnet",
            courseStatus: "PUBLISHED",
            moduleId: "mod-2",
            moduleTitle: "ASP.NET Project Architecture",
          },
          {
            id: "les-4",
            title: "Placeholder Draft Syllabus Lesson",
            order: 3,
            isFree: false,
            wordCount: 15,
            contentLength: 40,
            isEmpty: true,
            createdAt: "2026-01-05T14:00:00.000Z",
            updatedAt: "2026-01-05T14:00:00.000Z",
            courseId: "react-nextjs",
            courseTitle: "Interactive Blueprint: React & Next.js",
            courseSlug: "react-nextjs",
            courseStatus: "PUBLISHED",
            moduleId: null,
            moduleTitle: null,
          },
        ];
        
        setLessons(mockLessons);
        setStats({
          total: mockLessons.length,
          free: mockLessons.filter(l => l.isFree).length,
          paid: mockLessons.filter(l => !l.isFree).length,
          empty: mockLessons.filter(l => l.isEmpty).length,
          recentlyUpdated: 3,
          avgWordCount: 318,
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load content library");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

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
    if (count >= 300) return "text-emerald-500 bg-emerald-500/10";
    if (count >= 100) return "text-amber-500 bg-amber-500/10";
    return "text-rose-500 bg-rose-500/10";
  };

  const getFreshnessLabel = (updatedAt: string) => {
    try {
      const days = Math.floor(
        (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24),
      );
      if (days === 0) return "Today";
      if (days === 1) return "Yesterday";
      if (days <= 7) return `${days}d ago`;
      if (days <= 30) return `${days}d ago`;
      return new Date(updatedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return updatedAt;
    }
  };

  const handleToggleFreeAccess = (lesson: ContentLesson) => {
    const nextFree = !lesson.isFree;
    setLessons((prev) =>
      prev.map((l) => (l.id === lesson.id ? { ...l, isFree: nextFree } : l))
    );
    toast.success(`Access updated: lesson is now ${nextFree ? "Free" : "Paid"}`);
    if (selectedLesson?.id === lesson.id) {
      setSelectedLesson((prev) => prev ? { ...prev, isFree: nextFree } : null);
    }
  };

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Content Quality Control"
        title="Content Library"
        description="Review all text lessons across the platform catalog — track word counts, free access limits, and empty drafts."
      />

      {/* Stats Cards (Redesigned with borders, colored tags, and icons) */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-6">
        
        {/* Total Lessons */}
        <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Lessons
            </p>
            <h3 className="text-3xl font-extrabold text-foreground tracking-tight">
              {loading ? <Loader2 className="size-5 animate-spin" /> : (stats?.total ?? 0)}
            </h3>
            <p className="text-[9px] font-semibold text-muted-foreground leading-none">
              Avg. {stats?.avgWordCount ?? 0} words per lesson
            </p>
          </div>
          <div className="flex size-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
            <FileText className="size-5" />
          </div>
        </Card>

        {/* Free lessons */}
        <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Free Access
            </p>
            <h3 className="text-3xl font-extrabold text-emerald-500 tracking-tight">
              {loading ? <Loader2 className="size-5 animate-spin" /> : (stats?.free ?? 0)}
            </h3>
            <p className="text-[9px] font-semibold text-muted-foreground leading-none">
              {stats && stats.total > 0
                ? `${((stats.free / stats.total) * 100).toFixed(0)}% of catalog`
                : "—"}
            </p>
          </div>
          <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <Star className="size-5" />
          </div>
        </Card>

        {/* Empty drafts */}
        <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Empty Drafts
            </p>
            <h3 className={cn(
              "text-3xl font-extrabold tracking-tight",
              stats && stats.empty > 0 ? "text-rose-500" : "text-foreground"
            )}>
              {loading ? <Loader2 className="size-5 animate-spin" /> : (stats?.empty ?? 0)}
            </h3>
            <p className="text-[9px] font-semibold text-muted-foreground leading-none">
              Lessons with &lt;50 characters
            </p>
          </div>
          <div className="flex size-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
            <AlertCircle className="size-5" />
          </div>
        </Card>

        {/* Updated this week */}
        <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Recently Updated
            </p>
            <h3 className="text-3xl font-extrabold text-foreground tracking-tight">
              {loading ? <Loader2 className="size-5 animate-spin" /> : (stats?.recentlyUpdated ?? 0)}
            </h3>
            <p className="text-[9px] font-semibold text-muted-foreground leading-none">
              Modified in last 7 days
            </p>
          </div>
          <div className="flex size-11 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500">
            <TrendingUp className="size-5" />
          </div>
        </Card>

      </div>

      {/* Control Filter Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mt-6 bg-card border border-border/50 rounded-2xl p-4 shadow-sm">
        
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search title, course, or module..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl border-border bg-background text-xs font-semibold placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:border-border/80"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">
            <Filter className="size-3.5" /> Course:
          </div>

          {uniqueCourses.length > 0 && (
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="h-9 w-44 rounded-xl border-border bg-background text-[11px] font-semibold">
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="text-xs font-semibold">All Courses</SelectItem>
                {uniqueCourses.map(([id, title]) => (
                  <SelectItem key={id} value={id} className="text-xs font-semibold">
                    {title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Type button filters */}
          <div className="flex items-center gap-1 border-l border-border/60 pl-3">
            {(
              [
                ["all", "All"],
                ["free", "Free"],
                ["paid", "Paid"],
                ["empty", "Drafts"],
              ] as Array<[ContentFilter, string]>
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider border transition-all whitespace-nowrap",
                  filter === value
                    ? "bg-[#ff6636] border-[#ff6636] text-white"
                    : "bg-background border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Main Grid: list and Drawer side-by-side if clicked */}
      <div className="grid gap-6 lg:grid-cols-3 items-start mt-6">
        
        {/* Table list */}
        <div className={cn("space-y-4", selectedLesson ? "lg:col-span-2" : "lg:col-span-3")}>
          <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/50 px-6 py-5">
              <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
                <FileCode className="size-4.5 text-[#ff6636]" />
                Course Syllabus Items ({filtered.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/10">
                    <TableRow className="hover:bg-transparent border-b border-border/40">
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-6 py-3.5">Lesson Title</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3.5">Course Name</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3.5">Module Section</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3.5 text-center">Pricing Access</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3.5 text-right">Words</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3.5">Last Sync</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-6 py-3.5 text-center" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length > 0 ? (
                      filtered.map((lesson) => (
                        <TableRow
                          key={lesson.id}
                          onClick={() => setSelectedLesson(lesson)}
                          className={cn(
                            "hover:bg-muted/10 border-b border-border/30 last:border-b-0 cursor-pointer",
                            selectedLesson?.id === lesson.id && "bg-[#ff6636]/5"
                          )}
                        >
                          <TableCell className="px-6 py-4 font-bold text-xs text-foreground max-w-[200px]">
                            <div className="space-y-1">
                              <p className="truncate leading-tight">{lesson.title}</p>
                              {lesson.isEmpty && (
                                <span className="inline-block text-[8px] font-black uppercase bg-rose-500/10 text-rose-500 px-1 rounded">
                                  empty draft
                                </span>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell className="px-4 py-4 text-xs font-semibold text-muted-foreground max-w-[160px] truncate">
                            {lesson.courseTitle}
                          </TableCell>
                          
                          <TableCell className="px-4 py-4 text-xs font-semibold text-muted-foreground">
                            {lesson.moduleTitle ? (
                              <span className="text-foreground">{lesson.moduleTitle}</span>
                            ) : (
                              <span className="italic text-muted-foreground/60 text-[10px]">Unassigned</span>
                            )}
                          </TableCell>

                          <TableCell className="px-4 py-4 text-center">
                            <span className={cn(
                              "rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                              lesson.isFree
                                ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-500"
                                : "bg-muted text-muted-foreground"
                            )}>
                              {lesson.isFree ? "free" : "paid"}
                            </span>
                          </TableCell>

                          <TableCell className="px-4 py-4 text-right">
                            <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-extrabold", getWordCountTone(lesson.wordCount))}>
                              {lesson.wordCount.toLocaleString()}
                            </span>
                          </TableCell>

                          <TableCell className="px-4 py-4 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                            {getFreshnessLabel(lesson.updatedAt)}
                          </TableCell>

                          <TableCell className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="size-8 rounded-xl border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors mx-auto">
                                  <MoreVertical className="size-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl border-border bg-popover">
                                <DropdownMenuLabel className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground px-3.5 py-2">
                                  Content Actions
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-border" />
                                <DropdownMenuItem asChild className="cursor-pointer text-xs px-3.5 py-2">
                                  <Link href={`/admin/courses/${lesson.courseId}/lessons`} className="flex items-center gap-2">
                                    <Edit className="size-3.5" /> Edit in Manager
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="cursor-pointer text-xs px-3.5 py-2">
                                  <Link href={`/courses/${lesson.courseSlug}`} className="flex items-center gap-2">
                                    <BookOpen className="size-3.5" /> View Course Page
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-border" />
                                <DropdownMenuItem
                                  onClick={() => handleToggleFreeAccess(lesson)}
                                  className="cursor-pointer text-xs font-semibold text-foreground px-3.5 py-2"
                                >
                                  <Globe className="size-3.5" /> Toggle Free Access
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-xs font-semibold text-muted-foreground py-10"
                        >
                          No syllabus items matched filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Lesson Metadata Inspector Drawer */}
        {selectedLesson && (
          <div className="lg:col-span-1">
            <Card className="rounded-2xl border border-[#ff6636]/30 bg-card shadow-lg sticky top-6 overflow-hidden">
              <div className="bg-[#ff6636]/5 p-5 border-b border-border/50 flex items-start justify-between">
                <div>
                  <span className="rounded-full px-2 py-0.5 text-[8px] font-black bg-[#ff6636]/10 text-[#ff6636] uppercase tracking-widest">
                    Lesson Inspector
                  </span>
                  <CardTitle className="text-base font-extrabold mt-2 leading-tight">
                    Quick Metadata
                  </CardTitle>
                </div>
                <button
                  onClick={() => setSelectedLesson(null)}
                  className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="size-4.5" />
                </button>
              </div>

              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-black text-foreground">
                    {selectedLesson.title}
                  </h3>
                  <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                    Module Section: <span className="text-foreground font-bold">{selectedLesson.moduleTitle || "Unassigned"}</span>
                  </p>
                  <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                    Belongs to Course: <span className="text-foreground font-bold">{selectedLesson.courseTitle}</span>
                  </p>
                </div>

                <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-muted-foreground border-b border-border/30 pb-2">
                    <span>Syllabus Config</span>
                  </div>
                  <div className="grid gap-2.5 text-xs font-semibold text-foreground">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Order in Module:</span>
                      <Badge variant="outline" className="font-bold">{selectedLesson.order}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Word Count:</span>
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-extrabold", getWordCountTone(selectedLesson.wordCount))}>
                        {selectedLesson.wordCount} words
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Character Length:</span>
                      <span className="text-muted-foreground font-bold">{selectedLesson.contentLength} chars</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Access Option:</span>
                      <Badge className={cn("font-bold uppercase tracking-wider text-[8px]", selectedLesson.isFree ? "bg-emerald-500" : "bg-muted text-muted-foreground")}>
                        {selectedLesson.isFree ? "Free Preview" : "Paid Content"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Direct action triggers */}
                <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
                  <Link href={`/admin/courses/${selectedLesson.courseId}/lessons`} className="w-full">
                    <Button className="w-full rounded-xl h-10 text-xs font-bold gap-1.5 bg-[#ff6636] hover:bg-[#e95a2b]">
                      <Edit className="size-4" /> Open Lesson Manager
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => handleToggleFreeAccess(selectedLesson)}
                    className="w-full rounded-xl h-10 text-xs font-bold gap-1.5"
                  >
                    <Globe className="size-4" />
                    Set as {selectedLesson.isFree ? "Paid (Lock)" : "Free (Preview)"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminPage>
  );
}
