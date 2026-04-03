"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { toast } from "sonner";

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
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load analytics</p>
        <Button onClick={fetchAnalytics} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Monitor platform performance and user engagement
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +{data.period.recentUsers} in last {period} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Enrollments
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalEnrollments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +{data.period.recentEnrollments} in last {period} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion Rate
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.completionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Course completion average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.overview.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              From all enrollments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Published Courses
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.publishedCourses}</div>
            <p className="text-xs text-muted-foreground mt-1">
              out of {data.overview.totalCourses} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Rating
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overview.averageRating.toFixed(1)} ★
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {data.overview.totalReviews} reviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Revenue Per User
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${data.overview.totalUsers > 0 
                ? (data.overview.totalRevenue / data.overview.totalUsers).toFixed(2)
                : "0.00"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per registered user
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Courses & Category Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Courses */}
        <Card>
          <CardHeader>
            <CardTitle>Top Courses</CardTitle>
            <p className="text-sm text-muted-foreground">
              Most popular courses by enrollments
            </p>
          </CardHeader>
          <CardContent>
            {data.topCourses.length > 0 ? (
              <div className="space-y-3">
                {data.topCourses.slice(0, 10).map((course, index) => (
                  <div key={course.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">
                        {index + 1}
                      </div>
                      <Link
                        href={`/courses/${course.slug}`}
                        className="font-medium hover:underline truncate"
                      >
                        {course.title}
                      </Link>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge variant="secondary">
                        {course.enrollments} enrolled
                      </Badge>
                      <Badge variant="outline">
                        {course.reviews} reviews
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No courses available
              </p>
            )}
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Course Categories</CardTitle>
            <p className="text-sm text-muted-foreground">
              Distribution of courses by category
            </p>
          </CardHeader>
          <CardContent>
            {data.categoryDistribution.length > 0 ? (
              <div className="space-y-3">
                {data.categoryDistribution.map((category) => (
                  <div key={category.category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium capitalize">
                        {category.category.replace(/_/g, " ")}
                      </span>
                      <span className="text-muted-foreground">
                        {category.count} courses
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{
                          width: `${(category.count / data.overview.totalCourses) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No categories available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enrollment Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Enrollment Trend</CardTitle>
          <p className="text-sm text-muted-foreground">
            Daily enrollments over the last 7 days
          </p>
        </CardHeader>
        <CardContent>
          {data.enrollmentTrend.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-end gap-2 h-48">
                {data.enrollmentTrend.map((day) => {
                  const maxCount = Math.max(...data.enrollmentTrend.map(d => d.count), 1);
                  const heightPercent = (day.count / maxCount) * 100;
                  
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full bg-primary/20 rounded-t relative group">
                        <div
                          className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
                          style={{ height: `${Math.max(heightPercent, 5)}%`, minHeight: "4px" }}
                        />
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover border rounded px-2 py-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {day.count} enrollments
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No enrollment data available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
