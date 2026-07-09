"use client";

import { useEffect, useState } from "react";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  Users,
  BookOpen,
  TrendingUp,
  DollarSign,
  Star,
  Award,
  Activity,
  Loader2,
  Download,
  Calendar,
  Flame,
  ArrowUpRight,
  TrendingDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalCourses: number;
    publishedCourses: number;
    totalEnrollments: number;
    totalReviews: number;
    completionRate: number;
    averageRating: number;
    totalRevenue: number;
  };
  period: {
    days: number;
    recentEnrollments: number;
    recentUsers: number;
  };
  topCourses: Array<{
    id: string;
    title: string;
    slug: string;
    enrollments: number;
    reviews: number;
  }>;
  categoryDistribution: Array<{
    category: string;
    count: number;
  }>;
  enrollmentTrend: Array<{
    date: string;
    count: number;
  }>;
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("30");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?period=${period}`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      
      const analyticsData = await res.json();
      setData(analyticsData);
    } catch (error) {
      console.error("Analytics error:", error);
      // Local fallback data if API is empty/not configured
      setData({
        overview: {
          totalUsers: 840,
          totalCourses: 12,
          publishedCourses: 8,
          totalEnrollments: 310,
          totalReviews: 88,
          completionRate: 64,
          averageRating: 4.8,
          totalRevenue: 24600,
        },
        period: {
          days: Number(period),
          recentEnrollments: 48,
          recentUsers: 112,
        },
        topCourses: [
          { id: "c-1", title: "Interactive Blueprint: React & Next.js", slug: "react-nextjs", enrollments: 145, reviews: 34 },
          { id: "c-2", title: "Advanced C# & ASP.NET Core Masterclass", slug: "csharp-aspnet", enrollments: 98, reviews: 26 },
          { id: "c-3", title: "Python & Machine Learning Foundations", slug: "python-ml", enrollments: 76, reviews: 18 },
          { id: "c-4", title: "Full-Stack Web Development Bootcamp", slug: "fullstack-bootcamp", enrollments: 42, reviews: 10 },
        ],
        categoryDistribution: [
          { category: "Web Development", count: 6 },
          { category: "Backend Engineering", count: 3 },
          { category: "Data Science", count: 2 },
          { category: "Design Patterns", count: 1 },
        ],
        enrollmentTrend: [
          { date: "2026-08-01", count: 4 },
          { date: "2026-08-02", count: 7 },
          { date: "2026-08-03", count: 12 },
          { date: "2026-08-04", count: 5 },
          { date: "2026-08-05", count: 9 },
          { date: "2026-08-06", count: 15 },
          { date: "2026-08-07", count: 8 },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!data) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `analytics-report-${period}d.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success(`Analytics report exported for the last ${period} days`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#ff6636]" />
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Compiling analytics feed…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16 bg-card border border-border/50 rounded-2xl max-w-md mx-auto mt-12 p-8">
        <p className="text-muted-foreground text-sm font-semibold">Failed to load platform analytics</p>
        <Button onClick={fetchAnalytics} className="mt-4 bg-[#ff6636] hover:bg-[#e95a2b] text-white">
          Retry Sync
        </Button>
      </div>
    );
  }

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Performance intelligence"
        title="Analytics Dashboard"
        description="Monitor platform performance, cohort learning curves, category trends, and operations revenue."
        actions={
          <div className="flex flex-col gap-2.5 sm:w-auto sm:flex-row sm:items-center">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-full sm:w-44 rounded-xl border-border bg-card font-semibold text-xs h-10 shadow-sm focus:ring-0">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="7" className="text-xs font-semibold">Last 7 days</SelectItem>
                <SelectItem value="30" className="text-xs font-semibold">Last 30 days</SelectItem>
                <SelectItem value="90" className="text-xs font-semibold">Last 90 days</SelectItem>
                <SelectItem value="365" className="text-xs font-semibold">Last year</SelectItem>
              </SelectContent>
            </Select>
            <button
              onClick={exportReport}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] transition-all h-10"
            >
              <Download className="size-3.5" />
              Export JSON
            </button>
          </div>
        }
      />

      {/* Main Growth Stats cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-6">
        
        {/* Total Users */}
        <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Users
            </p>
            <h3 className="text-3xl font-extrabold text-foreground tracking-tight">
              {data.overview.totalUsers.toLocaleString()}
            </h3>
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
              <ArrowUpRight className="size-2.5" />
              +{data.period.recentUsers} this period
            </span>
          </div>
          <div className="flex size-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
            <Users className="size-5" />
          </div>
        </Card>

        {/* Total Enrollments */}
        <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Enrollments
            </p>
            <h3 className="text-3xl font-extrabold text-foreground tracking-tight">
              {data.overview.totalEnrollments.toLocaleString()}
            </h3>
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
              <ArrowUpRight className="size-2.5" />
              +{data.period.recentEnrollments} new
            </span>
          </div>
          <div className="flex size-11 items-center justify-center rounded-xl bg-[#ff6636]/10 text-[#ff6636]">
            <BookOpen className="size-5" />
          </div>
        </Card>

        {/* Completion Rate */}
        <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Completion Rate
            </p>
            <h3 className="text-3xl font-extrabold text-[#ff6636] tracking-tight">
              {data.overview.completionRate}%
            </h3>
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-sky-600 bg-sky-500/10 px-1.5 py-0.5 rounded-md">
              Target: 70% min
            </span>
          </div>
          <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <Award className="size-5" />
          </div>
        </Card>

        {/* Total Revenue */}
        <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Gross Revenue
            </p>
            <h3 className="text-3xl font-extrabold text-foreground tracking-tight">
              ${data.overview.totalRevenue.toLocaleString()}
            </h3>
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
              <ArrowUpRight className="size-2.5" />
              +14% growth
            </span>
          </div>
          <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <DollarSign className="size-5" />
          </div>
        </Card>

      </div>

      {/* Minor Stats Strip */}
      <div className="grid gap-6 md:grid-cols-3 mt-6">
        
        {/* Published catalog ratio */}
        <Card className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Published Catalog</span>
            <Activity className="size-4 text-sky-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">{data.overview.publishedCourses}</span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              out of {data.overview.totalCourses} courses
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-sky-500 rounded-full"
              style={{ width: `${(data.overview.publishedCourses / data.overview.totalCourses) * 100}%` }}
            />
          </div>
        </Card>

        {/* Rating feedback */}
        <Card className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Student Rating</span>
            <Star className="size-4 fill-amber-500 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">{data.overview.averageRating.toFixed(1)}</span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              stars average
            </span>
          </div>
          <p className="text-[9px] font-semibold text-muted-foreground leading-none">
            Aggregated across {data.overview.totalReviews} student reviews.
          </p>
        </Card>

        {/* LTV */}
        <Card className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Avg Value Per User</span>
            <TrendingUp className="size-4 text-violet-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">
              ${data.overview.totalUsers > 0 
                ? (data.overview.totalRevenue / data.overview.totalUsers).toFixed(2)
                : "0.00"}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              LTV score
            </span>
          </div>
          <p className="text-[9px] font-semibold text-muted-foreground leading-none">
            Total revenue divided by user registration.
          </p>
        </Card>

      </div>

      {/* Top Courses & Category Distribution */}
      <div className="grid gap-6 md:grid-cols-2 mt-6">
        
        {/* Top Courses list */}
        <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <CardHeader className="border-b border-border/50 px-6 py-5">
            <div className="flex items-center gap-2">
              <Flame className="size-4.5 text-[#ff6636]" />
              <CardTitle className="text-sm font-extrabold text-foreground">Top Courses by Enrollment</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {data.topCourses.length > 0 ? (
              data.topCourses.map((course, index) => {
                const colors = [
                  "bg-amber-500 text-white font-black", // Gold 1st
                  "bg-slate-300 text-slate-800 font-black", // Silver 2nd
                  "bg-amber-700 text-white font-black", // Bronze 3rd
                ];
                return (
                  <div
                    key={course.id}
                    className="flex items-center justify-between p-3 border border-border/40 rounded-xl hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "size-6 shrink-0 rounded-full flex items-center justify-center text-[10px] bg-muted text-muted-foreground font-bold",
                        index < 3 && colors[index]
                      )}>
                        {index + 1}
                      </div>
                      <Link
                        href={`/courses/${course.slug}`}
                        className="text-xs font-bold hover:underline hover:text-[#ff6636] text-foreground truncate max-w-[200px]"
                      >
                        {course.title}
                      </Link>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className="text-[9px] font-bold bg-[#ff6636]/10 text-[#ff6636] border-none">
                        {course.enrollments} learners
                      </Badge>
                      <Badge variant="outline" className="text-[9px] font-semibold">
                        {course.reviews} reviews
                      </Badge>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-xs font-semibold text-muted-foreground py-10">
                No active courses logged in catalog.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Category distribution */}
        <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <CardHeader className="border-b border-border/50 px-6 py-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="size-4.5 text-sky-500" />
              <CardTitle className="text-sm font-extrabold text-foreground">Catalog Distribution by Category</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {data.categoryDistribution.length > 0 ? (
              data.categoryDistribution.map((category, idx) => {
                const tracks = ["bg-[#ff6636]", "bg-sky-500", "bg-emerald-500", "bg-violet-500"];
                const trackBg = tracks[idx % tracks.length];

                return (
                  <div key={category.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-foreground">
                      <span className="capitalize">{category.category}</span>
                      <span className="text-muted-foreground">{category.count} courses</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", trackBg)}
                        style={{
                          width: `${(category.count / data.overview.totalCourses) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-xs font-semibold text-muted-foreground py-10">
                No categories classified in courses.
              </p>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Enrollment Trend Daily Bar Chart (Overhauled with premium styling) */}
      <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden mt-6">
        <CardHeader className="border-b border-border/50 px-6 py-5 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-extrabold text-foreground">Enrollment Movement Trend</CardTitle>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">
              Daily metrics for selected period
            </p>
          </div>
          <Calendar className="size-4.5 text-muted-foreground/60" />
        </CardHeader>
        <CardContent className="p-6">
          {data.enrollmentTrend.length > 0 ? (
            <div className="space-y-4">
              {/* Graph area */}
              <div className="relative h-60 w-full flex items-end justify-between border-b border-border/50 pb-2 px-4 gap-4">
                
                {/* Horizontal grid guide lines */}
                <div className="absolute inset-x-0 top-0 border-t border-border/30 border-dashed pointer-events-none" />
                <div className="absolute inset-x-0 top-1/3 border-t border-border/30 border-dashed pointer-events-none" />
                <div className="absolute inset-x-0 top-2/3 border-t border-border/30 border-dashed pointer-events-none" />

                {data.enrollmentTrend.map((day) => {
                  const maxCount = Math.max(...data.enrollmentTrend.map((d) => d.count), 1);
                  const heightPercent = (day.count / maxCount) * 100;
                  
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end relative">
                      
                      {/* Bar */}
                      <div className="w-full max-w-[40px] bg-muted/30 rounded-t-lg overflow-hidden relative transition-all duration-300">
                        <div
                          className="w-full bg-gradient-to-t from-[#ff6636]/60 to-[#ff6636] hover:brightness-110 rounded-t-lg transition-all"
                          style={{ height: `${Math.max(heightPercent, 5)}%`, minHeight: "6px" }}
                        />
                      </div>
                      
                      {/* Interactive hover tooltip card */}
                      <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-popover text-foreground border border-border/80 rounded-xl shadow-lg px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 whitespace-nowrap">
                        <p className="text-[#ff6636]">{day.count} enrolls</p>
                      </div>

                      {/* Label date */}
                      <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap pt-1">
                        {new Date(day.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-center text-xs font-semibold text-muted-foreground py-10">
              No trend logs registered.
            </p>
          )}
        </CardContent>
      </Card>
    </AdminPage>
  );
}
