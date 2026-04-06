"use client";

import { useEffect, useState } from "react";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import { StatsCard } from "@/components/admin/stats-card";
import { RecentActivity } from "@/components/admin/recent-activity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  Download,
  Calendar,
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

export default function AdminDashboard() {
  interface CourseApiData {
    id: string;
    title: string;
    instructor: string;
    enrollments: number;
    revenue: number;
    price: string | number;
    status: string;
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
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeCourses: 0,
    totalRevenue: 0,
    completionRate: 0,
  });

  const fetchDashboardData = async () => {
    try {
      // Fetch courses to get top performing ones
      const coursesResponse = await fetch("/api/admin/courses");
      if (coursesResponse.ok) {
        const courses: CourseApiData[] = await coursesResponse.json();

        // Sort by enrollments and get top 5
        const sorted = courses
          .sort((a, b) => b.enrollments - a.enrollments)
          .slice(0, 5);

        setTopCourses(
          sorted.map((course) => ({
            id: course.id,
            name: course.title,
            instructor: course.instructor,
            enrollments: course.enrollments,
            revenue: course.revenue,
            status: course.status === "PUBLISHED" ? "active" : "draft",
          })),
        );

        // Calculate stats
        const totalRevenue = courses.reduce((sum: number, course) => {
          const courseRevenue = course.enrollments * Number(course.price);
          return sum + courseRevenue;
        }, 0);

        setStats((prev) => ({
          ...prev,
          activeCourses: courses.filter((c) => c.status === "PUBLISHED").length,
          totalRevenue: totalRevenue,
        }));
      }

      // Fetch users
      const usersResponse = await fetch("/api/admin/users");
      if (usersResponse.ok) {
        const users = await usersResponse.json();
        setStats((prev) => ({
          ...prev,
          totalUsers: users.length,
        }));
      }

      // Fetch enrollments for completion rate
      const enrollmentsResponse = await fetch("/api/admin/enrollments");
      if (enrollmentsResponse.ok) {
        const enrollments: { progress: number }[] =
          await enrollmentsResponse.json();
        const completionRate =
          enrollments.length > 0
            ? Math.round(
                (enrollments.filter((e) => e.progress === 100).length /
                  enrollments.length) *
                  100,
              )
            : 0;
        setStats((prev) => ({
          ...prev,
          completionRate: completionRate,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Operations overview"
        title="Dashboard"
        description="Welcome back. Track platform growth, revenue, completions, and top-performing courses from one place."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              Last 30 days
            </Button>
            <Button className="gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        }
      />

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          trend={{ value: 12.5, isPositive: true }}
          description="from last month"
        />
        <StatsCard
          title="Active Courses"
          value={stats.activeCourses.toString()}
          icon={BookOpen}
          trend={{ value: 8.2, isPositive: true }}
          description="from last month"
        />
        <StatsCard
          title="Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          trend={{ value: 23.1, isPositive: true }}
          description="from last month"
        />
        <StatsCard
          title="Completion Rate"
          value={`${stats.completionRate}%`}
          icon={TrendingUp}
          trend={{ value: 5.3, isPositive: true }}
          description="from last month"
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
                  {topCourses.map((course) => (
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
                        {course.revenue}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-green-500">
                          {course.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
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
            <div className="text-3xl font-bold">4.8</div>
            <p className="text-xs text-muted-foreground mt-2">
              Based on 8,234 reviews
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
            <div className="text-3xl font-bold">3,482</div>
            <p className="text-xs text-muted-foreground mt-2">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Support Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">23</div>
            <p className="text-xs text-muted-foreground mt-2">
              15 resolved, 8 pending
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminPage>
  );
}
