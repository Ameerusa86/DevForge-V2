"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Search,
  Filter,
  MoreVertical,
  Download,
  Mail,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import type { Enrollment } from "@/types/course";

export default function EnrollmentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  type EnrollmentData = Enrollment & {
    studentName: string;
    email: string;
    courseName: string;
  };
  const [enrollments, setEnrollments] = useState<EnrollmentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      const response = await fetch("/api/admin/enrollments");
      if (response.ok) {
        const data = await response.json();
        setEnrollments(data);
      }
    } catch (error) {
      console.error("Failed to fetch enrollments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (enrollmentId: string) => {
    if (!confirm("Are you sure you want to remove this enrollment?")) return;

    try {
      const response = await fetch(`/api/admin/enrollments/${enrollmentId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setEnrollments(enrollments.filter((e) => e.id !== enrollmentId));
      }
    } catch (error) {
      console.error("Failed to delete enrollment:", error);
    }
  };

  const filteredEnrollments = enrollments.filter((e) => {
    const matchesSearch =
      e.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.courseName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "active" && e.progress < 100) ||
      (filterStatus === "completed" && e.progress === 100);

    return matchesSearch && matchesFilter;
  });

  const stats = {
    totalEnrollments: enrollments.length,
    activeEnrollments: enrollments.filter((e) => e.progress < 100).length,
    completedEnrollments: enrollments.filter((e) => e.progress === 100).length,
    averageProgress:
      Math.round(
        enrollments.reduce((sum, e) => sum + e.progress, 0) /
          enrollments.length,
      ) || 0,
  };

  const getProgressColor = (progress: number) => {
    if (progress === 100) return "text-green-600";
    if (progress >= 75) return "text-blue-600";
    if (progress >= 50) return "text-yellow-600";
    return "text-orange-600";
  };

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Learning pipeline"
        title="Enrollments"
        description="Track cohort health, learner progress, and enrollment movement across every active course."
        actions={
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground text-sm mb-1">
                Total Enrollments
              </p>
              <p className="text-3xl font-bold">{stats.totalEnrollments}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground text-sm mb-1">
                Active Enrollments
              </p>
              <p className="text-3xl font-bold text-blue-600">
                {stats.activeEnrollments}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground text-sm mb-1">Completed</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.completedEnrollments}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground text-sm mb-1">Avg Progress</p>
              <p className="text-3xl font-bold">{stats.averageProgress}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by student, email, or course..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          {["all", "active", "completed"].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              onClick={() => setFilterStatus(status)}
              className="capitalize"
            >
              {status === "all" ? "All" : status}
            </Button>
          ))}
        </div>
      </div>

      {/* Enrollments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Students ({filteredEnrollments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead className="w-24">Progress</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEnrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell className="font-medium">
                      {enrollment.studentName}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {enrollment.email}
                    </TableCell>
                    <TableCell>{enrollment.courseName}</TableCell>
                    <TableCell>
                      <div className="w-24 space-y-1">
                        <Progress value={enrollment.progress} className="h-2" />
                        <p
                          className={`text-xs font-medium ${getProgressColor(
                            enrollment.progress,
                          )}`}
                        >
                          {enrollment.progress}%
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(enrollment.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2">
                            <Mail className="h-4 w-4" />
                            Send Message
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="gap-2 text-destructive"
                            onClick={() => handleDelete(enrollment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove Enrollment
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
  );
}
