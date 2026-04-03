"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
} from "lucide-react";
import { toast } from "sonner";
import type { UserWithDetails } from "@/types/api-response";

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

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load users");
    }
  };

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
      toast.success("User created");
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
      toast.error(message);
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
      toast.success("User updated");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to update user";
      toast.error(message);
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
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to delete user";
      toast.error(message);
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

  const resetPassword = async (userId: string, email: string) => {
    const tempPassword = prompt(
      `Enter a new temporary password for ${email} (min 8 chars):`,
    );
    if (!tempPassword) return;
    if (tempPassword.length < 8) {
      toast.error("Temporary password must be at least 8 characters");
      return;
    }

    setResettingId(userId);
    try {
      const response = await fetch(
        `/api/admin/users/${userId}/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tempPassword }),
        },
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to reset password");
      }

      toast.success("Temporary password set and user must change it");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to reset password";
      toast.error(message);
    } finally {
      setResettingId(null);
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, string> = {
      Admin: "bg-purple-500",
      Instructor: "bg-blue-500",
      Student: "bg-green-500",
    };
    return variants[role] || "default";
  };

  const getStatusBadge = (status: string) => {
    return status === "Active" ? "default" : "destructive";
  };

  const getAccountBadgeProps = (accountType: AccountType) => {
    if (accountType === "None" || accountType === "Unknown") {
      return { variant: "secondary" as const };
    }

    const classNameMap: Record<
      Exclude<AccountType, "None" | "Unknown">,
      string
    > = {
      Google: "border-transparent bg-red-500 text-white",
      GitHub: "border-transparent bg-gray-800 text-white",
      Credentials: "border-transparent bg-sky-600 text-white",
    };

    return { className: classNameMap[accountType] };
  };

  const getEnrollmentDisplay = (enrollments: unknown) => {
    if (Array.isArray(enrollments)) return enrollments.length;
    if (typeof enrollments === "number") return enrollments;
    if (enrollments && typeof enrollments === "object") return 1;
    return 0;
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground mt-1">
            Manage all users and their permissions
          </p>
        </div>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enrollments</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>
                          {user.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Badge {...getAccountBadgeProps(user.accountType)}>
                      {user.accountType === "Credentials"
                        ? "username/password"
                        : user.accountType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleBadge(user.role)}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadge(user.status)}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getEnrollmentDisplay(user.enrollments)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.joined).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
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
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2"
                          disabled={updatingId === user.id}
                          onClick={() => updateUser(user.id, { role: "Admin" })}
                        >
                          <Shield className="h-4 w-4" />
                          Make Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2"
                          disabled={updatingId === user.id}
                          onClick={() =>
                            updateUser(user.id, { role: "Instructor" })
                          }
                        >
                          <Shield className="h-4 w-4" />
                          Make Instructor
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2"
                          disabled={updatingId === user.id}
                          onClick={() =>
                            updateUser(user.id, { role: "Student" })
                          }
                        >
                          <Shield className="h-4 w-4" />
                          Make Student
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2"
                          disabled={updatingId === user.id}
                          onClick={() =>
                            updateUser(user.id, {
                              status:
                                user.status === "Active"
                                  ? "Suspended"
                                  : "Active",
                            })
                          }
                        >
                          <Ban className="h-4 w-4" />
                          {user.status === "Active"
                            ? "Suspend User"
                            : "Activate User"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2"
                          disabled={resettingId === user.id}
                          onClick={() => resetPassword(user.id, user.email)}
                        >
                          <Shield className="h-4 w-4" />
                          Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 text-destructive"
                          disabled={deletingId === user.id}
                          onClick={() => openDeleteDialog(user.id)}
                        >
                          <Ban className="h-4 w-4" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
            <DialogDescription>Provision a new user account.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                required
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm({ ...createForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={createForm.email}
                onChange={(e) =>
                  setCreateForm({ ...createForm, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tempPassword">Temporary Password</Label>
              <Input
                id="tempPassword"
                type="password"
                required
                minLength={8}
                placeholder="Set a temporary password"
                value={createForm.tempPassword}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    tempPassword: e.target.value,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                The user must change this password after first login.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={createForm.role}
                  onValueChange={(v: UserRole) =>
                    setCreateForm({ ...createForm, role: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="Instructor">Instructor</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={createForm.status}
                  onValueChange={(v: UserStatus) =>
                    setCreateForm({ ...createForm, status: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-4 sm:gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setPendingDeleteId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeleteUser?.email
                ? `This will permanently remove ${pendingDeleteUser.email} and their related data. This action cannot be undone.`
                : "This will permanently remove the user and their related data. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                if (isDeleting) return;
                setPendingDeleteId(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
