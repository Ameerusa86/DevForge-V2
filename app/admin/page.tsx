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
        throw new Error("Failed to fetch core dashboard data");
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
        activeCourses: courses.filter((course) => course.status === "PUBLISHED")
          .length,
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
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <div className="w-full sm:w-auto">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-full sm:w-42.5">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              className="w-full gap-2 sm:w-auto"
              onClick={() => fetchDashboardData(true)}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              className="w-full gap-2 sm:w-auto"
              onClick={exportDashboardReport}
            >
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        }
      />

      {lastUpdated ? (
        <p className="text-xs text-muted-foreground">
          Updated {lastUpdated.toLocaleTimeString()} for{" "}
          {periodLabel.toLowerCase()}
        </p>
      ) : null}

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
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Courses Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Enrollments</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCourses.length > 0 ? (
                    topCourses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">
                          {course.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src="" />
                              <AvatarFallback className="text-xs">
                                {course.instructor
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{course.instructor}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {course.enrollments.toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          ${course.revenue.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="default" className="bg-green-500">
                            {course.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground"
                      >
                        {isLoading
                          ? "Loading top courses..."
                          : "No courses found"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <RecentActivity />
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {insights.averageRating.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Based on {insights.totalReviews.toLocaleString()} reviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Course Completions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {insights.completionsInPeriod.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-2">{periodLabel}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Support Tickets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">
              {insights.supportTicketsTotal}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {insights.supportTicketsResolved} resolved,{" "}
              {insights.supportTicketsPending} pending
            </p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${resolvedTicketsRatio}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminPage>
  );
}
