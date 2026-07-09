"use client";

import { useEffect, useState } from "react";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import { StatsCard } from "@/components/admin/stats-card";
import { RecentActivity } from "@/components/admin/recent-activity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  Download,
  RefreshCw,
  Award,
  Star,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const periodOptions = [
    { value: "7", label: "Last 7 days" },
    { value: "30", label: "Last 30 days" },
    { value: "90", label: "Last 90 days" },
  ];

  interface CourseApiData {
    id: string;
    title: string;
    instructor: string;
    enrollments: number;
    price: string | number;
    status: string;
  }

  interface EnrollmentApiData {
    id: string;
    progress: number;
    createdAt: string;
  }

  interface AdminAnalyticsData {
    overview: {
      completionRate: number;
      averageRating: number;
      totalReviews: number;
      totalRevenue: number;
    };
    period: {
      recentEnrollments: number;
      recentUsers: number;
    };
  }

  interface AdminStatusData {
    success: boolean;
    data?: {
      incidents: Array<{
        id: string;
        status: "INVESTIGATING" | "IDENTIFIED" | "MONITORING" | "RESOLVED";
      }>;
    };
  }

  interface TopCourse {
    id: string;
    name: string;
    instructor: string;
    enrollments: number;
    revenue: number;
    status: string;
  }

  const [topCourses, setTopCourses] = useState<TopCourse[]>([]);
  const [period, setPeriod] = useState("30");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeCourses: 0,
    totalRevenue: 0,
    completionRate: 0,
    recentUsers: 0,
    recentEnrollments: 0,
  });

  const [insights, setInsights] = useState({
    averageRating: 0,
    totalReviews: 0,
    completionsInPeriod: 0,
    supportTicketsTotal: 0,
    supportTicketsResolved: 0,
    supportTicketsPending: 0,
  });

  const resolvedTicketsRatio =
    insights.supportTicketsTotal > 0
      ? (insights.supportTicketsResolved / insights.supportTicketsTotal) * 100
      : 0;

  const periodLabel =
    periodOptions.find((option) => option.value === period)?.label ||
    "Last 30 days";

  const exportDashboardReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      period,
      periodLabel,
      stats,
      insights,
      topCourses,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `admin-dashboard-${period}d-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success("Dashboard report exported");
  };

  const fetchDashboardData = async (manualRefresh = false) => {
    if (manualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const [
        coursesResponse,
        usersResponse,
        enrollmentsResponse,
        analyticsResponse,
        statusResponse,
      ] = await Promise.all([
        fetch("/api/admin/courses"),
        fetch("/api/admin/users"),
        fetch("/api/admin/enrollments"),
        fetch(`/api/admin/analytics?period=${period}`),
        fetch("/api/admin/status"),
      ]);

      if (!coursesResponse.ok || !usersResponse.ok || !enrollmentsResponse.ok) {
        throw new Error("Failed to fetch core data");
      }

      const courses: CourseApiData[] = await coursesResponse.json();
      const users: unknown[] = await usersResponse.json();
      const enrollments: EnrollmentApiData[] = await enrollmentsResponse.json();

      const periodStartDate = new Date();
      periodStartDate.setDate(periodStartDate.getDate() - Number(period));

      const sorted = courses
        .sort((a, b) => b.enrollments - a.enrollments)
        .slice(0, 5);

      setTopCourses(
        sorted.map((course) => ({
          id: course.id,
          name: course.title,
          instructor: course.instructor,
          enrollments: course.enrollments,
          revenue: Number(course.price) * course.enrollments,
          status: course.status === "PUBLISHED" ? "active" : "draft",
        })),
      );

      const fallbackTotalRevenue = courses.reduce((sum, course) => {
        return sum + course.enrollments * Number(course.price);
      }, 0);

      const completionRate =
        enrollments.length > 0
          ? Math.round(
              (enrollments.filter((enrollment) => enrollment.progress === 100)
                .length /
                enrollments.length) *
                100,
            )
          : 0;

      const completionsInPeriod = enrollments.filter(
        (enrollment) =>
          enrollment.progress === 100 &&
          new Date(enrollment.createdAt) >= periodStartDate,
      ).length;

      setStats((prev) => ({
        ...prev,
        totalUsers: users.length,
        activeCourses: courses.filter((course) => course.status === "PUBLISHED").length,
        totalRevenue: fallbackTotalRevenue,
        completionRate,
      }));

      setInsights((prev) => ({
        ...prev,
        completionsInPeriod,
      }));

      if (analyticsResponse.ok) {
        const analytics: AdminAnalyticsData = await analyticsResponse.json();

        setStats((prev) => ({
          ...prev,
          totalRevenue: Math.round(analytics.overview.totalRevenue),
          completionRate: analytics.overview.completionRate,
          recentUsers: analytics.period.recentUsers,
          recentEnrollments: analytics.period.recentEnrollments,
        }));

        setInsights((prev) => ({
          ...prev,
          averageRating: analytics.overview.averageRating,
          totalReviews: analytics.overview.totalReviews,
        }));
      }

      if (statusResponse.ok) {
        const statusPayload: AdminStatusData = await statusResponse.json();
        const incidents = statusPayload.data?.incidents || [];
        const supportTicketsResolved = incidents.filter(
          (incident) => incident.status === "RESOLVED",
        ).length;

        setInsights((prev) => ({
          ...prev,
          supportTicketsTotal: incidents.length,
          supportTicketsResolved,
          supportTicketsPending: incidents.length - supportTicketsResolved,
        }));
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Operations overview"
        title="Dashboard"
        description="Welcome back. Track platform growth, revenue, completions, and top-performing courses from one place."
        actions={
          <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:items-center">
            <div className="w-full sm:w-auto">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-full sm:w-44 rounded-xl border-border bg-card font-semibold text-xs h-10 shadow-sm focus:ring-0">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {periodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-xs font-semibold">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={isRefreshing}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] disabled:opacity-60 transition-all h-10"
            >
              <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
              Refresh
            </button>

            <button
              onClick={exportDashboardReport}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors h-10 shadow-md shadow-[#ff6636]/10"
            >
              <Download className="size-3.5" />
              Export Report
            </button>
          </div>
        }
      />

      {lastUpdated && (
        <div className="flex items-center gap-2 mb-6">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Updated {lastUpdated.toLocaleTimeString()} for {periodLabel.toLowerCase()}
          </p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          description={`+${stats.recentUsers.toLocaleString()} new in selected period`}
        />
        <StatsCard
          title="Active Courses"
          value={stats.activeCourses.toString()}
          icon={BookOpen}
          description="currently published"
        />
        <StatsCard
          title="Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          description={periodLabel}
        />
        <StatsCard
          title="Completion Rate"
          value={`${stats.completionRate}%`}
          icon={TrendingUp}
          description={`+${stats.recentEnrollments.toLocaleString()} enrollments in selected period`}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3 mt-6 items-start">
        
        {/* Top Courses Table */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/50 px-6 py-5">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-[#ff6636]/10 text-[#ff6636]">
                  <Award className="size-5" />
                </div>
                <CardTitle className="text-base font-extrabold text-foreground">
                  Top Performing Courses
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow className="hover:bg-transparent border-b border-border/40">
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-6">Course</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4">Instructor</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 text-right">Enrollments</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 text-right">Revenue</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-6 text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCourses.length > 0 ? (
                    topCourses.map((course) => (
                      <TableRow key={course.id} className="hover:bg-muted/10 border-b border-border/30 last:border-b-0">
                        <TableCell className="font-bold text-xs text-foreground px-6 py-4.5 max-w-[200px] truncate">
                          {course.name}
                        </TableCell>
                        <TableCell className="px-4 py-4.5">
                          <div className="flex items-center gap-2">
                            <Avatar className="size-6 border border-border/80">
                              <AvatarFallback className="bg-[#ff6636]/10 text-[9px] font-bold text-[#ff6636]">
                                {course.instructor
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-semibold text-muted-foreground truncate max-w-[120px]">{course.instructor}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4.5 text-right font-semibold text-xs text-foreground">
                          {course.enrollments.toLocaleString()}
                        </TableCell>
                        <TableCell className="px-4 py-4.5 text-right font-extrabold text-xs text-[#ff6636]">
                          ${course.revenue.toLocaleString()}
                        </TableCell>
                        <TableCell className="px-6 py-4.5 text-center">
                          <span className={cn(
                            "rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                            course.status === "active"
                              ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-500"
                              : "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-500"
                          )}>
                            {course.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-xs font-semibold text-muted-foreground py-10"
                      >
                        {isLoading
                          ? "Loading top courses data…"
                          : "No top-performing courses found."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Column */}
        <div className="lg:col-span-1">
          <RecentActivity />
        </div>

      </div>

      {/* Additional Stats Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
        
        {/* Average Rating */}
        <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="border-b border-border/50 pb-3 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Average Rating
            </p>
            <Star className="size-4 fill-amber-500 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight text-foreground">
              {insights.averageRating.toFixed(1)}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              stars average
            </span>
          </div>
          <p className="text-[10px] font-semibold text-muted-foreground leading-none">
            Calculated across {insights.totalReviews.toLocaleString()} reviews.
          </p>
        </Card>

        {/* Completions */}
        <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="border-b border-border/50 pb-3 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Course Completions
            </p>
            <CheckCircle className="size-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight text-foreground">
              {insights.completionsInPeriod.toLocaleString()}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              graduated
            </span>
          </div>
          <p className="text-[10px] font-semibold text-muted-foreground leading-none">
            Recorded in the {periodLabel.toLowerCase()}.
          </p>
        </Card>

        {/* Support Tickets */}
        <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="border-b border-border/50 pb-3 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Support Incidents
            </p>
            <HelpCircle className="size-4 text-violet-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight text-foreground">
              {insights.supportTicketsTotal}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              incidents logged
            </span>
          </div>
          
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground">
              <span>{insights.supportTicketsResolved} resolved</span>
              <span>{insights.supportTicketsPending} pending</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${resolvedTicketsRatio}%` }}
              />
            </div>
          </div>
        </Card>

      </div>
    </AdminPage>
  );
}
