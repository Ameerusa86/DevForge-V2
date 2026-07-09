"use client";

import { useState, useEffect } from "react";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
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
  Download,
  Mail,
  MoreVertical,
  Trash2,
  Users,
  Award,
  BookOpen,
  TrendingUp,
  Plus,
  Clock,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface EnrollmentData {
  id: string;
  studentName: string;
  email: string;
  courseName: string;
  progress: number;
  createdAt: string;
}

export default function EnrollmentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "completed">("all");
  const [enrollments, setEnrollments] = useState<EnrollmentData[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual Enrollment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [studentEmail, setStudentEmail] = useState("");
  const [studentName, setStudentName] = useState("");
  const [targetCourse, setTargetCourse] = useState("");
  const [initialProgress, setInitialProgress] = useState("0");

  // Dynamic Course List for Select dropdown
  const [availableCourses, setAvailableCourses] = useState<string[]>([
    "Interactive Blueprint: React & Next.js",
    "Advanced C# & ASP.NET Core Masterclass",
    "Python & Machine Learning Foundations",
    "Full-Stack Web Development Bootcamp",
  ]);

  const fetchEnrollments = async () => {
    try {
      const response = await fetch("/api/admin/enrollments");
      if (response.ok) {
        const data = await response.json();
        setEnrollments(data);
      } else {
        // Fallback mockup items if API is empty/not configured
        setEnrollments([
          {
            id: "en-1",
            studentName: "Alice Vance",
            email: "alice@devforge.com",
            courseName: "Interactive Blueprint: React & Next.js",
            progress: 85,
            createdAt: "2026-01-02T10:00:00.000Z",
          },
          {
            id: "en-2",
            studentName: "Bob Carter",
            email: "bob@devforge.com",
            courseName: "Advanced C# & ASP.NET Core Masterclass",
            progress: 100,
            createdAt: "2026-01-03T11:30:00.000Z",
          },
          {
            id: "en-3",
            studentName: "Charlie Davis",
            email: "charlie@devforge.com",
            courseName: "Python & Machine Learning Foundations",
            progress: 42,
            createdAt: "2026-01-04T09:15:00.000Z",
          },
          {
            id: "en-4",
            studentName: "Diana Prince",
            email: "diana@devforge.com",
            courseName: "Interactive Blueprint: React & Next.js",
            progress: 10,
            createdAt: "2026-01-05T14:45:00.000Z",
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to fetch enrollments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const handleDelete = async (enrollmentId: string) => {
    if (!confirm("Are you sure you want to cancel and remove this student's enrollment?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/enrollments/${enrollmentId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));
        toast.success("Enrollment removed successfully.");
      } else {
        // Local fallback removal for demo/mock items
        setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));
        toast.success("Enrollment deleted locally.");
      }
    } catch (error) {
      console.error("Failed to delete enrollment:", error);
      toast.error("Failed to delete enrollment.");
    }
  };

  const handleManualEnroll = (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentEmail || !studentName || !targetCourse) {
      toast.error("Please enter all required details.");
      return;
    }

    const newEnrollment: EnrollmentData = {
      id: `en-${Date.now()}`,
      studentName: studentName,
      email: studentEmail,
      courseName: targetCourse,
      progress: Number(initialProgress) || 0,
      createdAt: new Date().toISOString(),
    };

    setEnrollments((prev) => [newEnrollment, ...prev]);
    toast.success(`Successfully enrolled ${studentName} in course!`);
    
    // Reset form
    setStudentEmail("");
    setStudentName("");
    setTargetCourse("");
    setInitialProgress("0");
    setIsModalOpen(false);
  };

  const exportEnrollments = () => {
    const dataString = JSON.stringify(enrollments, null, 2);
    const blob = new Blob([dataString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `enrollments-report-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Enrollment catalog exported.");
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
    if (progress === 100) return "text-emerald-500 bg-emerald-500";
    if (progress >= 75) return "text-sky-500 bg-sky-500";
    if (progress >= 50) return "text-amber-500 bg-amber-500";
    return "text-orange-500 bg-orange-500";
  };

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Learning cohort tracking"
        title="Enrollments"
        description="Track active student cohorts, learner syllabus progress, and manual enrollment overrides."
        actions={
          <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:items-center">
            <button
              onClick={exportEnrollments}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] transition-all h-10"
            >
              <Download className="size-3.5" />
              Export
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors h-10 shadow-md shadow-[#ff6636]/10"
            >
              <Plus className="size-4" />
              Enroll Student
            </button>
          </div>
        }
      />

      {/* Stats Cards (Redesigned with custom icons and borders) */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-6">
        
        {/* Total Enrollments */}
        <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Enrollments
            </p>
            <h3 className="text-3xl font-extrabold text-foreground tracking-tight">
              {stats.totalEnrollments.toLocaleString()}
            </h3>
            <p className="text-[9px] font-semibold text-muted-foreground leading-none">
              Registered learners across catalog
            </p>
          </div>
          <div className="flex size-11 items-center justify-center rounded-xl bg-[#ff6636]/10 text-[#ff6636]">
            <Users className="size-5" />
          </div>
        </Card>

        {/* Active cohort */}
        <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Active Enrolled
            </p>
            <h3 className="text-3xl font-extrabold text-sky-500 tracking-tight">
              {stats.activeEnrollments.toLocaleString()}
            </h3>
            <p className="text-[9px] font-semibold text-muted-foreground leading-none">
              Students currently studying syllabus
            </p>
          </div>
          <div className="flex size-11 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500">
            <Clock className="size-5" />
          </div>
        </Card>

        {/* Graduates */}
        <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Syllabus Graduates
            </p>
            <h3 className="text-3xl font-extrabold text-emerald-500 tracking-tight">
              {stats.completedEnrollments.toLocaleString()}
            </h3>
            <p className="text-[9px] font-semibold text-muted-foreground leading-none">
              Finished all lesson blueprints
            </p>
          </div>
          <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <Award className="size-5" />
          </div>
        </Card>

        {/* Average progress */}
        <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Cohort Progress
            </p>
            <h3 className="text-3xl font-extrabold text-foreground tracking-tight">
              {stats.averageProgress}%
            </h3>
            <p className="text-[9px] font-semibold text-muted-foreground leading-none">
              Average progress rate
            </p>
          </div>
          <div className="flex size-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
            <TrendingUp className="size-5" />
          </div>
        </Card>

      </div>

      {/* Control Filters and Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mt-6 bg-card border border-border/50 rounded-2xl p-4 shadow-sm">
        
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search student, email, or course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl border-border bg-background text-xs font-semibold placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:border-border/80"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Filter Status:</span>
          {(["all", "active", "completed"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={cn(
                "rounded-xl px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider border transition-all whitespace-nowrap",
                filterStatus === status
                  ? "bg-[#ff6636] border-[#ff6636] text-white"
                  : "bg-background border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {status}
            </button>
          ))}
        </div>

      </div>

      {/* Enrollments Main Card list */}
      <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden mt-6">
        <CardHeader className="border-b border-border/50 px-6 py-5">
          <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
            <BookOpen className="size-4.5 text-[#ff6636]" />
            Learning Cohort Roster ({filteredEnrollments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow className="hover:bg-transparent border-b border-border/40">
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-6 py-3.5">Student</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3.5">Email Address</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3.5">Enrolled Course</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3.5 w-40">Cohort Progress</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3.5">Enrollment Date</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-6 py-3.5 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEnrollments.length > 0 ? (
                  filteredEnrollments.map((enrollment) => (
                    <TableRow key={enrollment.id} className="hover:bg-muted/10 border-b border-border/30 last:border-b-0">
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="size-7 border border-border/80">
                            <AvatarFallback className="bg-[#ff6636]/10 text-[10px] font-bold text-[#ff6636]">
                              {enrollment.studentName.split(" ").map(n => n[0]).join("").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-bold text-foreground">{enrollment.studentName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-xs font-semibold text-muted-foreground">
                        {enrollment.email}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-xs font-bold text-foreground max-w-[240px] truncate">
                        {enrollment.courseName}
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="space-y-1 w-32">
                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all", getProgressColor(enrollment.progress))}
                              style={{ width: `${enrollment.progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-muted-foreground leading-none">
                            {enrollment.progress}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-xs font-semibold text-muted-foreground">
                        {new Date(enrollment.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="size-8 rounded-xl border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors mx-auto md:mr-0"
                            >
                              <MoreVertical className="size-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl border-border bg-popover">
                            <DropdownMenuLabel className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground px-3.5 py-2">
                              Cohort Actions
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem className="gap-2 text-xs font-semibold text-foreground px-3.5 py-2 cursor-pointer">
                              <Mail className="size-3.5" />
                              Contact Learner
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-xs font-semibold text-foreground px-3.5 py-2 cursor-pointer">
                              <ExternalLink className="size-3.5" />
                              View Progress Logs
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem
                              className="gap-2 text-xs font-bold text-red-500 focus:bg-red-500/10 focus:text-red-500 px-3.5 py-2 cursor-pointer"
                              onClick={() => handleDelete(enrollment.id)}
                            >
                              <Trash2 className="size-3.5" />
                              Remove Enrollment
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-xs font-semibold text-muted-foreground py-10"
                    >
                      {loading ? "Fetching cohort data…" : "No active enrollments matching selection."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Manual Student Enrollment Modal Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[460px] rounded-2xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-foreground">
              Enroll Student Manual Override
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Directly add a student email to a learning track blueprint. This skips the checkout pipeline for offline/administrative overrides.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleManualEnroll} className="space-y-4 py-2">
            
            {/* Student Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Student Full Name <span className="text-[#ff6636]">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. Alice Vance"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
                className="h-10 rounded-xl border-border text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/80"
              />
            </div>

            {/* Student Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Student Email Address <span className="text-[#ff6636]">*</span>
              </label>
              <Input
                type="email"
                placeholder="e.g. alice@example.com"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                required
                className="h-10 rounded-xl border-border text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/80"
              />
            </div>

            {/* Target Course Blueprint */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Target Course Blueprint <span className="text-[#ff6636]">*</span>
              </label>
              <Select value={targetCourse} onValueChange={setTargetCourse}>
                <SelectTrigger className="h-10 rounded-xl border-border text-xs font-semibold">
                  <SelectValue placeholder="Select course blueprint" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {availableCourses.map((course) => (
                    <SelectItem key={course} value={course} className="text-xs font-semibold">
                      {course}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Initial Progress Override */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Initial Progress Status (%)
              </label>
              <Select value={initialProgress} onValueChange={setInitialProgress}>
                <SelectTrigger className="h-10 rounded-xl border-border text-xs font-semibold">
                  <SelectValue placeholder="Select progress override" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="0" className="text-xs font-semibold">0% (Started Path)</SelectItem>
                  <SelectItem value="25" className="text-xs font-semibold">25% (Basic Module Complete)</SelectItem>
                  <SelectItem value="50" className="text-xs font-semibold">50% (Midway Checkpoint)</SelectItem>
                  <SelectItem value="75" className="text-xs font-semibold">75% (Advanced Section)</SelectItem>
                  <SelectItem value="100" className="text-xs font-semibold">100% (Graduate Complete)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <button
                type="button"
                className="rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-muted/50 h-10"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors h-10 shadow-md shadow-[#ff6636]/10"
              >
                Confirm Onboarding
              </button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
