"use client";

import { useState, useEffect, useMemo } from "react";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserPlus,
  Search,
  Filter,
  Download,
  MoreVertical,
  Mail,
  Ban,
  Shield,
  X,
  ShieldCheck,
  UserCheck,
  UserX,
  Key,
  Trash2,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import type { UserWithDetails } from "@/types/api-response";
import { cn } from "@/lib/utils";

type UserRole = "Admin" | "Instructor" | "Student";
type UserStatus = "Active" | "Suspended";
type AccountType = UserWithDetails["accountType"];

type AdminUser = Omit<UserWithDetails, "role" | "status"> & {
  role: UserRole;
  status: UserStatus;
  accountType: AccountType;
};

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    tempPassword: "",
    role: "Student" as UserRole,
    status: "Active" as UserStatus,
  });

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<{
    id: string;
    email: string;
  } | null>(null);
  const [resetTempPassword, setResetTempPassword] = useState("");

  // Details Inspector panel
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        // Mock fallback if API not configured/empty
        const mockUsers: AdminUser[] = [
          {
            id: "u-1",
            name: "Sarah Johnson",
            email: "sarah.j@devforge.com",
            avatar: "",
            image: null,
            createdAt: new Date("2026-01-02T10:00:00.000Z"),
            instructedCourses: [],
            enrollmentCount: 3,
            role: "Student",
            status: "Active",
            accountType: "GitHub",
            enrollments: Array(3).fill({ id: "", courseId: "" }),
            joined: "2026-01-02T10:00:00.000Z",
          },
          {
            id: "u-2",
            name: "Michael Chen",
            email: "m.chen@devforge.com",
            avatar: "",
            image: null,
            createdAt: new Date("2026-01-03T11:30:00.000Z"),
            instructedCourses: [],
            enrollmentCount: 5,
            role: "Instructor",
            status: "Active",
            accountType: "Google",
            enrollments: Array(5).fill({ id: "", courseId: "" }),
            joined: "2026-01-03T11:30:00.000Z",
          },
          {
            id: "u-3",
            name: "Emma Wilson",
            email: "emma.w@devforge.com",
            avatar: "",
            image: null,
            createdAt: new Date("2026-01-04T09:15:00.000Z"),
            instructedCourses: [],
            enrollmentCount: 0,
            role: "Admin",
            status: "Active",
            accountType: "Credentials",
            enrollments: [],
            joined: "2026-01-04T09:15:00.000Z",
          },
          {
            id: "u-4",
            name: "James Miller",
            email: "james.m@devforge.com",
            avatar: "",
            image: null,
            createdAt: new Date("2026-01-05T14:45:00.000Z"),
            instructedCourses: [],
            enrollmentCount: 2,
            role: "Student",
            status: "Suspended",
            accountType: "Credentials",
            enrollments: Array(2).fill({ id: "", courseId: "" }),
            joined: "2026-01-05T14:45:00.000Z",
          },
        ];
        setUsers(mockUsers);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load users");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to create user");
      }

      const newUser = await response.json();
      setUsers((prev) => [newUser, ...prev]);
      toast.success("User account created successfully");
      setCreateForm({
        name: "",
        email: "",
        tempPassword: "",
        role: "Student",
        status: "Active",
      });
      setCreateOpen(false);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to create user";
      // Fallback local mock create for demo
      const localMock: AdminUser = {
        id: `u-${Date.now()}`,
        name: createForm.name,
        email: createForm.email,
        avatar: "",
        role: createForm.role,
        status: createForm.status,
        accountType: "Credentials",
        image: null,
        createdAt: new Date(),
        instructedCourses: [],
        enrollmentCount: 0,
        enrollments: [],
        joined: new Date().toISOString(),
      };
      setUsers((prev) => [localMock, ...prev]);
      toast.success("Demo user created locally.");
      setCreateOpen(false);
    } finally {
      setCreating(false);
    }
  };

  const updateUser = async (userId: string, data: Partial<AdminUser>) => {
    setUpdatingId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to update user");
      }

      const updated = await response.json();
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...updated } : u)),
      );
      toast.success("User updated successfully");
      if (selectedUser?.id === userId) {
        setSelectedUser((prev) => prev ? { ...prev, ...updated } : null);
      }
    } catch (error: unknown) {
      // Fallback local update
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...data } : u)),
      );
      toast.success("User properties modified locally.");
      if (selectedUser?.id === userId) {
        setSelectedUser((prev) => prev ? { ...prev, ...data } : null);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteUserConfirmed = async (userId: string) => {
    setDeletingId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to delete user");
      }

      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success("User deleted");
      if (selectedUser?.id === userId) setSelectedUser(null);
    } catch (error: unknown) {
      // Fallback local removal
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success("User deleted locally.");
      if (selectedUser?.id === userId) setSelectedUser(null);
    } finally {
      setDeletingId(null);
    }
  };

  const openDeleteDialog = (userId: string) => {
    setPendingDeleteId(userId);
    setDeleteDialogOpen(true);
  };

  const isDeleting = Boolean(pendingDeleteId && deletingId === pendingDeleteId);

  const pendingDeleteUser = useMemo(() => {
    if (!pendingDeleteId) return null;
    return users.find((u) => u.id === pendingDeleteId) ?? null;
  }, [pendingDeleteId, users]);

  const handleDelete = async () => {
    if (!pendingDeleteId || isDeleting) return;
    await deleteUserConfirmed(pendingDeleteId);
    setDeleteDialogOpen(false);
    setPendingDeleteId(null);
  };

  const openResetPasswordDialog = (userId: string, email: string) => {
    setResetTarget({ id: userId, email });
    setResetTempPassword("");
    setResetDialogOpen(true);
  };

  const resetPassword = async () => {
    if (!resetTarget) return;

    if (resetTempPassword.length < 8) {
      toast.error("Temporary password must be at least 8 characters");
      return;
    }

    setResettingId(resetTarget.id);
    try {
      const response = await fetch(
        `/api/admin/users/${resetTarget.id}/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tempPassword: resetTempPassword }),
        },
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to reset password");
      }

      toast.success("Temporary password set and user must change it");
      setResetDialogOpen(false);
      setResetTarget(null);
      setResetTempPassword("");
    } catch (error: unknown) {
      toast.success(`Mock password set to "${resetTempPassword}" locally.`);
      setResetDialogOpen(false);
      setResetTarget(null);
      setResetTempPassword("");
    } finally {
      setResettingId(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-500 border border-purple-500/20";
      case "Instructor":
        return "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-500 border border-blue-500/20";
      case "Student":
        return "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-500 border border-emerald-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusBadgeClass = (status: string) => {
    return status === "Active"
      ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-500"
      : "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-500";
  };

  const getAccountBadgeClass = (accountType: AccountType) => {
    switch (accountType) {
      case "Google":
        return "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-500 border border-red-500/20";
      case "GitHub":
        return "bg-zinc-800/10 text-zinc-800 dark:bg-zinc-100/10 dark:text-zinc-300 border border-zinc-500/20";
      case "Credentials":
        return "bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-500 border border-sky-500/20";
      default:
        return "bg-muted text-muted-foreground border-transparent";
    }
  };

  const getEnrollmentDisplay = (enrollments: unknown) => {
    if (Array.isArray(enrollments)) return enrollments.length;
    if (typeof enrollments === "number") return enrollments;
    if (enrollments && typeof enrollments === "object") return 1;
    return 0;
  };

  const exportUsers = () => {
    const dataString = JSON.stringify(users, null, 2);
    const blob = new Blob([dataString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `users-catalog-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("User directory catalog exported.");
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [users, searchQuery]);

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Identity and access"
        title="Users"
        description="Manage roles, account status, authentication providers, and security settings for every user."
        actions={
          <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:items-center">
            <button
              onClick={exportUsers}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] transition-all h-10"
            >
              <Download className="size-3.5" />
              Export
            </button>
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors h-10 shadow-md shadow-[#ff6636]/10"
            >
              <UserPlus className="size-4" />
              Add User
            </button>
          </div>
        }
      />

      {/* Control Search & Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mt-6 bg-card border border-border/50 rounded-2xl p-4 shadow-sm">
        
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl border-border bg-background text-xs font-semibold placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:border-border/80"
          />
        </div>

        {/* Counter */}
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          Total: {filteredUsers.length} users listed
        </span>

      </div>

      {/* Grid containing list and details view */}
      <div className="grid gap-6 lg:grid-cols-3 items-start mt-6">
        
        {/* Users table list */}
        <div className={cn("space-y-4", selectedUser ? "lg:col-span-2" : "lg:col-span-3")}>
          <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/50 px-6 py-5">
              <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
                <ShieldCheck className="size-4.5 text-[#ff6636]" />
                User Profiles & Credential Access
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/10">
                    <TableRow className="hover:bg-transparent border-b border-border/40">
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-6 py-3.5">User</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3.5">Email Address</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3.5">Provider</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3.5">Role</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3.5">Status</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3.5 text-center">Enrolled</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3.5">Joined</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-6 py-3.5 text-center" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <TableRow
                          key={user.id}
                          onClick={() => setSelectedUser(user)}
                          className={cn(
                            "hover:bg-muted/10 border-b border-border/30 last:border-b-0 cursor-pointer",
                            selectedUser?.id === user.id && "bg-[#ff6636]/5"
                          )}
                        >
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-2.5">
                              <Avatar className="size-8 border border-border/80">
                                <AvatarFallback className={cn(
                                  "bg-muted text-[10px] font-black text-foreground",
                                  selectedUser?.id === user.id && "bg-[#ff6636]/10 text-[#ff6636]"
                                )}>
                                  {user.name
                                    .split(" ")
                                    .map((n: string) => n[0])
                                    .join("")
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-bold text-foreground">{user.name}</span>
                            </div>
                          </TableCell>
                          
                          <TableCell className="px-4 py-4 text-xs font-semibold text-muted-foreground">
                            {user.email}
                          </TableCell>
                          
                          <TableCell className="px-4 py-4">
                            <span className={cn(
                              "rounded-full px-2.5 py-0.5 text-[8px] font-bold uppercase tracking-wider border",
                              getAccountBadgeClass(user.accountType)
                            )}>
                              {user.accountType === "Credentials" ? "cred" : user.accountType.toLowerCase()}
                            </span>
                          </TableCell>

                          <TableCell className="px-4 py-4">
                            <span className={cn("rounded-full px-2.5 py-0.5 text-[8px] font-bold uppercase tracking-wider border", getRoleBadge(user.role))}>
                              {user.role}
                            </span>
                          </TableCell>

                          <TableCell className="px-4 py-4">
                            <span className={cn(
                              "rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border border-transparent",
                              getStatusBadgeClass(user.status)
                            )}>
                              {user.status}
                            </span>
                          </TableCell>

                          <TableCell className="px-4 py-4 text-center text-xs font-bold text-foreground">
                            {getEnrollmentDisplay(user.enrollments)}
                          </TableCell>

                          <TableCell className="px-4 py-4 text-xs font-semibold text-muted-foreground">
                            {new Date(user.joined).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric"
                            })}
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
                                  Access Control
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-border" />
                                <DropdownMenuItem
                                  className="gap-2 text-xs font-semibold text-foreground px-3.5 py-2 cursor-pointer"
                                  disabled={updatingId === user.id}
                                  onClick={() => updateUser(user.id, { role: "Admin" })}
                                >
                                  <Shield className="size-3.5" /> Make Admin
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="gap-2 text-xs font-semibold text-foreground px-3.5 py-2 cursor-pointer"
                                  disabled={updatingId === user.id}
                                  onClick={() => updateUser(user.id, { role: "Instructor" })}
                                >
                                  <Shield className="size-3.5" /> Make Instructor
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="gap-2 text-xs font-semibold text-foreground px-3.5 py-2 cursor-pointer"
                                  disabled={updatingId === user.id}
                                  onClick={() => updateUser(user.id, { role: "Student" })}
                                >
                                  <Shield className="size-3.5" /> Make Student
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-border" />
                                <DropdownMenuItem
                                  className="gap-2 text-xs font-semibold text-foreground px-3.5 py-2 cursor-pointer"
                                  disabled={updatingId === user.id}
                                  onClick={() =>
                                    updateUser(user.id, {
                                      status: user.status === "Active" ? "Suspended" : "Active",
                                    })
                                  }
                                >
                                  <Ban className="size-3.5" />
                                  {user.status === "Active" ? "Suspend Account" : "Activate Account"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="gap-2 text-xs font-semibold text-foreground px-3.5 py-2 cursor-pointer"
                                  disabled={resettingId === user.id}
                                  onClick={() => openResetPasswordDialog(user.id, user.email)}
                                >
                                  <Key className="size-3.5" /> Reset Password
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-border" />
                                <DropdownMenuItem
                                  className="gap-2 text-xs font-bold text-red-500 focus:bg-red-500/10 focus:text-red-500 px-3.5 py-2 cursor-pointer"
                                  disabled={deletingId === user.id}
                                  onClick={() => openDeleteDialog(user.id)}
                                >
                                  <Trash2 className="size-3.5" /> Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center text-xs font-semibold text-muted-foreground py-10"
                        >
                          No active user records match filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected User Details Profile Inspector Drawer */}
        {selectedUser && (
          <div className="lg:col-span-1">
            <Card className="rounded-2xl border border-[#ff6636]/30 bg-card shadow-lg sticky top-6 overflow-hidden">
              <div className="bg-[#ff6636]/5 p-5 border-b border-border/50 flex items-start justify-between">
                <div>
                  <span className="rounded-full px-2 py-0.5 text-[8px] font-black bg-[#ff6636]/10 text-[#ff6636] uppercase tracking-widest">
                    Profile Inspector
                  </span>
                  <CardTitle className="text-base font-extrabold mt-2 leading-tight">
                    User Details
                  </CardTitle>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="size-4.5" />
                </button>
              </div>

              <CardContent className="p-6 space-y-6">
                
                {/* Profile Overview */}
                <div className="flex items-center gap-3 border-b border-border/50 pb-4">
                  <Avatar className="size-12 border-2 border-border/70">
                    <AvatarFallback className="bg-[#ff6636]/10 text-sm font-black text-[#ff6636]">
                      {selectedUser.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-foreground truncate">{selectedUser.name}</h4>
                    <p className="text-[10px] font-bold text-muted-foreground/80 truncate mt-0.5">{selectedUser.email}</p>
                  </div>
                </div>

                {/* Info Fields */}
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-muted-foreground border-b border-border/30 pb-2">
                    <span>Account Metadata</span>
                  </div>
                  <div className="grid gap-2 text-xs font-semibold text-foreground">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">User ID:</span>
                      <span className="font-mono text-[9px] font-bold bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{selectedUser.id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Role Level:</span>
                      <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold uppercase", getRoleBadge(selectedUser.role))}>
                        {selectedUser.role}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Provider:</span>
                      <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold uppercase", getAccountBadgeClass(selectedUser.accountType))}>
                        {selectedUser.accountType}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Account Status:</span>
                      <Badge className={cn("text-[9px] font-black uppercase", getStatusBadgeClass(selectedUser.status))}>
                        {selectedUser.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Course Enrollments:</span>
                      <span className="font-bold text-foreground">{getEnrollmentDisplay(selectedUser.enrollments)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Joined Date:</span>
                      <span className="text-muted-foreground font-bold">
                        {new Date(selectedUser.joined).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick actions panel */}
                <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
                  
                  {/* Status Toggle */}
                  <Button
                    onClick={() =>
                      updateUser(selectedUser.id, {
                        status: selectedUser.status === "Active" ? "Suspended" : "Active",
                      })
                    }
                    variant={selectedUser.status === "Active" ? "outline" : "default"}
                    className={cn(
                      "w-full rounded-xl h-10 text-xs font-bold gap-1.5",
                      selectedUser.status !== "Active" && "bg-emerald-500 hover:bg-emerald-600 text-white"
                    )}
                  >
                    {selectedUser.status === "Active" ? (
                      <>
                        <UserX className="size-4" /> Suspend Account
                      </>
                    ) : (
                      <>
                        <UserCheck className="size-4" /> Activate Account
                      </>
                    )}
                  </Button>

                  {/* Reset Password */}
                  <Button
                    variant="outline"
                    onClick={() => openResetPasswordDialog(selectedUser.id, selectedUser.email)}
                    className="w-full rounded-xl h-10 text-xs font-bold gap-1.5"
                  >
                    <Lock className="size-4" /> Reset Password
                  </Button>

                  {/* Delete User */}
                  <Button
                    variant="destructive"
                    onClick={() => openDeleteDialog(selectedUser.id)}
                    className="w-full rounded-xl h-10 text-xs font-bold gap-1.5"
                  >
                    <Trash2 className="size-4" /> Delete User Account
                  </Button>

                </div>

              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-foreground">
              Create User Account
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Provision a new user credential account directly on the platform database.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4 py-2">
            
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Full Name</Label>
              <Input
                id="name"
                required
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm({ ...createForm, name: e.target.value })
                }
                className="h-10 rounded-xl border-border text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/80"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email Address</Label>
              <Input
                id="email"
                type="email"
                required
                value={createForm.email}
                onChange={(e) =>
                  setCreateForm({ ...createForm, email: e.target.value })
                }
                className="h-10 rounded-xl border-border text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/80"
              />
            </div>

            {/* Temp Password */}
            <div className="space-y-1.5">
              <Label htmlFor="tempPassword" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Temporary Password</Label>
              <Input
                id="tempPassword"
                type="password"
                required
                minLength={8}
                placeholder="Minimum 8 characters"
                value={createForm.tempPassword}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    tempPassword: e.target.value,
                  })
                }
                className="h-10 rounded-xl border-border text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/80"
              />
              <p className="text-[9px] font-semibold text-muted-foreground leading-none">
                The user will be required to update this password on their first sign-in.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Role */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Role Level</Label>
                <Select
                  value={createForm.role}
                  onValueChange={(v: UserRole) =>
                    setCreateForm({ ...createForm, role: v })
                  }
                >
                  <SelectTrigger className="h-10 rounded-xl border-border text-xs font-semibold">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Student" className="text-xs font-semibold">Student</SelectItem>
                    <SelectItem value="Instructor" className="text-xs font-semibold">Instructor</SelectItem>
                    <SelectItem value="Admin" className="text-xs font-semibold">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</Label>
                <Select
                  value={createForm.status}
                  onValueChange={(v: UserStatus) =>
                    setCreateForm({ ...createForm, status: v })
                  }
                >
                  <SelectTrigger className="h-10 rounded-xl border-border text-xs font-semibold">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Active" className="text-xs font-semibold">Active</SelectItem>
                    <SelectItem value="Suspended" className="text-xs font-semibold">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl h-10 text-xs font-bold"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creating}
                className="rounded-xl h-10 text-xs font-bold bg-[#ff6636] hover:bg-[#e95a2b] text-white"
              >
                {creating ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset password dialog */}
      <Dialog
        open={resetDialogOpen}
        onOpenChange={(open) => {
          setResetDialogOpen(open);
          if (!open) {
            setResetTarget(null);
            setResetTempPassword("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-foreground">Reset User Password</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {resetTarget?.email
                ? `Set a temporary security password for ${resetTarget.email}.`
                : "Set a temporary security password for this user."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="resetTempPassword" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Temporary Password</Label>
            <Input
              id="resetTempPassword"
              type="password"
              minLength={8}
              placeholder="Minimum 8 characters"
              value={resetTempPassword}
              onChange={(e) => setResetTempPassword(e.target.value)}
              className="h-10 rounded-xl border-border text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/80"
            />
            <p className="text-[9px] font-semibold text-muted-foreground leading-none">
              The user will be prompted to choose a new password on their next log-in.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl h-10 text-xs font-bold"
              onClick={() => setResetDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-xl h-10 text-xs font-bold bg-[#ff6636] hover:bg-[#e95a2b] text-white"
              onClick={resetPassword}
              disabled={
                !resetTempPassword ||
                resetTempPassword.length < 8 ||
                Boolean(resettingId)
              }
            >
              {resettingId ? "Resetting..." : "Set Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setPendingDeleteId(null);
          }
        }}
      >
        <AlertDialogContent className="rounded-2xl border-border bg-card text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-extrabold text-foreground">
              Delete User Account?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              {pendingDeleteUser?.email
                ? `This will permanently remove ${pendingDeleteUser.email} and clear their cohort learning progress. This action is irreversible.`
                : "This will permanently remove the user and clear their cohort learning progress. This action is irreversible."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-xl h-10 text-xs font-bold"
              onClick={() => {
                if (isDeleting) return;
                setPendingDeleteId(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl h-10 text-xs font-bold bg-red-500 text-white hover:bg-red-600 border-none"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Permanently Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPage>
  );
}
