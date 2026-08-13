"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  AdminPage,
  AdminPageHeader,
  AdminMetricCard,
} from "@/components/admin/admin-page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  FolderTree,
  CheckCircle2,
  EyeOff,
  BookOpen,
  MoreVertical,
  Layers,
  ArrowUpDown,
  LayoutGrid,
  List,
  Copy,
  ExternalLink,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import {
  AVAILABLE_ICONS,
  CATEGORY_COLORS,
  getCategoryColorTheme,
  getCategoryIcon,
  generateCategorySlug,
} from "@/lib/categories";
import type { CourseCategory } from "@/types/course";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Create Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "BookOpen",
    color: "orange",
    order: 0,
    isActive: true,
  });

  // Edit Modal state
  const [editingCategory, setEditingCategory] = useState<CourseCategory | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "BookOpen",
    color: "orange",
    order: 0,
    isActive: true,
  });

  // Delete Modal state
  const [deletingCategory, setDeletingCategory] = useState<CourseCategory | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [reassignCategorySlug, setReassignCategorySlug] = useState<string>("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async (showToast = false) => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/admin/categories", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
        if (showToast) toast.success("Categories refreshed");
      } else {
        toast.error(data.error || "Failed to load categories");
      }
    } catch {
      toast.error("Network error fetching categories");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const matchesSearch =
        searchQuery === "" ||
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && cat.isActive) ||
        (filterStatus === "inactive" && !cat.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [categories, searchQuery, filterStatus]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = categories.length;
    const active = categories.filter((c) => c.isActive).length;
    const inactive = total - active;
    const totalCourses = categories.reduce((sum, c) => sum + (c.courseCount || 0), 0);
    return { total, active, inactive, totalCourses };
  }, [categories]);

  // Handle open create modal
  const openCreateModal = () => {
    const maxOrder = categories.reduce((max, c) => Math.max(max, c.order), -1);
    setCreateForm({
      name: "",
      slug: "",
      description: "",
      icon: "Code2",
      color: "orange",
      order: maxOrder + 1,
      isActive: true,
    });
    setIsCreateOpen(true);
  };

  // Handle Create Name Change with Auto-Slug
  const handleCreateNameChange = (name: string) => {
    const autoSlug = generateCategorySlug(name);
    setCreateForm((prev) => ({
      ...prev,
      name,
      slug: prev.slug === "" || prev.slug === generateCategorySlug(prev.name) ? autoSlug : prev.slug,
    }));
  };

  // Submit Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    try {
      setCreateLoading(true);
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`Category "${createForm.name}" created successfully!`);
        setIsCreateOpen(false);
        fetchCategories();
      } else {
        toast.error(data.error || "Failed to create category");
      }
    } catch {
      toast.error("Failed to create category");
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle open edit modal
  const openEditModal = (cat: CourseCategory) => {
    setEditingCategory(cat);
    setEditForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      icon: cat.icon || "BookOpen",
      color: cat.color || "orange",
      order: cat.order,
      isActive: cat.isActive,
    });
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    if (!editForm.name.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }

    try {
      setEditLoading(true);
      const res = await fetch(`/api/admin/categories/${editingCategory.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`Category "${editForm.name}" updated successfully!`);
        setEditingCategory(null);
        fetchCategories();
      } else {
        toast.error(data.error || "Failed to update category");
      }
    } catch {
      toast.error("Failed to update category");
    } finally {
      setEditLoading(false);
    }
  };

  // Quick Toggle Active
  const handleToggleActive = async (cat: CourseCategory) => {
    const updatedStatus = !cat.isActive;
    // Optimistic UI update
    setCategories((prev) =>
      prev.map((c) => (c.id === cat.id ? { ...c, isActive: updatedStatus } : c))
    );

    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: updatedStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          `Category "${cat.name}" is now ${updatedStatus ? "active" : "inactive"}`
        );
      } else {
        // Revert
        setCategories((prev) =>
          prev.map((c) => (c.id === cat.id ? { ...c, isActive: cat.isActive } : c))
        );
        toast.error(data.error || "Failed to update status");
      }
    } catch {
      // Revert
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, isActive: cat.isActive } : c))
      );
      toast.error("Failed to update category status");
    }
  };

  // Open Delete Modal
  const openDeleteModal = (cat: CourseCategory) => {
    setDeletingCategory(cat);
    // Default reassignment candidate (first other active category)
    const otherCats = categories.filter((c) => c.id !== cat.id && c.isActive);
    setReassignCategorySlug(otherCats[0]?.slug || "");
  };

  // Submit Delete
  const handleDeleteSubmit = async () => {
    if (!deletingCategory) return;

    try {
      setDeleteLoading(true);
      const url =
        deletingCategory.courseCount && deletingCategory.courseCount > 0
          ? `/api/admin/categories/${deletingCategory.id}?reassignTo=${encodeURIComponent(reassignCategorySlug)}`
          : `/api/admin/categories/${deletingCategory.id}`;

      const res = await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reassignToSlug: reassignCategorySlug }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(data.message || `Category "${deletingCategory.name}" deleted.`);
        setDeletingCategory(null);
        fetchCategories();
      } else {
        toast.error(data.error || "Failed to delete category");
      }
    } catch {
      toast.error("Failed to delete category");
    } finally {
      setDeleteLoading(false);
    }
  };

  const copySlug = (slug: string) => {
    navigator.clipboard.writeText(slug);
    toast.success(`Copied slug "${slug}" to clipboard`);
  };

  return (
    <AdminPage className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        eyebrow="Catalog Taxonomy"
        title="Course Categories"
        description="Manage the dynamic taxonomy, badges, and learning tracks across the DevForge course catalog."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchCategories(true)}
              disabled={refreshing}
              className="rounded-xl border-border bg-card shadow-xs"
            >
              <RefreshCw className={`mr-2 size-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={openCreateModal}
              className="rounded-xl bg-[#ff6636] font-bold text-white shadow-sm hover:bg-[#fa5522]"
            >
              <Plus className="mr-2 size-4" />
              New Category
            </Button>
          </div>
        }
      />

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard
          title="Total Categories"
          value={metrics.total}
          description="Configured catalog tracks"
          icon={FolderTree}
          tone="primary"
        />
        <AdminMetricCard
          title="Active Categories"
          value={metrics.active}
          description="Available for course tagging"
          icon={CheckCircle2}
          tone="success"
        />
        <AdminMetricCard
          title="Categorized Courses"
          value={metrics.totalCourses}
          description="Total courses assigned"
          icon={BookOpen}
          tone="info"
        />
        <AdminMetricCard
          title="Inactive Tracks"
          value={metrics.inactive}
          description="Draft or hidden categories"
          icon={EyeOff}
          tone="warning"
        />
      </div>

      {/* Controls Bar */}
      <Card className="border-border/60 shadow-xs">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, slug, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-xl border-border bg-background text-xs font-semibold placeholder:text-muted-foreground/60"
              />
            </div>

            {/* Filter Tabs & View Mode */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex rounded-xl border border-border bg-muted/40 p-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setFilterStatus("all")}
                  className={`rounded-lg px-3 py-1.5 transition-all ${
                    filterStatus === "all"
                      ? "bg-card text-foreground shadow-xs font-extrabold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All ({categories.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus("active")}
                  className={`rounded-lg px-3 py-1.5 transition-all ${
                    filterStatus === "active"
                      ? "bg-card text-foreground shadow-xs font-extrabold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Active ({categories.filter((c) => c.isActive).length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus("inactive")}
                  className={`rounded-lg px-3 py-1.5 transition-all ${
                    filterStatus === "inactive"
                      ? "bg-card text-foreground shadow-xs font-extrabold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Inactive ({categories.filter((c) => !c.isActive).length})
                </button>
              </div>

              <div className="flex items-center rounded-xl border border-border bg-muted/40 p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`size-7 rounded-lg ${viewMode === "grid" ? "bg-card shadow-xs text-foreground" : "text-muted-foreground"}`}
                  onClick={() => setViewMode("grid")}
                  title="Grid view"
                >
                  <LayoutGrid className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`size-7 rounded-lg ${viewMode === "table" ? "bg-card shadow-xs text-foreground" : "text-muted-foreground"}`}
                  onClick={() => setViewMode("table")}
                  title="Table view"
                >
                  <List className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/80 bg-card p-12 text-center">
          <RefreshCw className="size-8 animate-spin text-[#ff6636]" />
          <p className="text-sm font-semibold text-muted-foreground">Loading course categories...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/80 bg-card p-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
            <FolderTree className="size-7" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-base font-extrabold text-foreground">No categories found</h3>
            <p className="text-xs text-muted-foreground">
              {searchQuery
                ? `No categories match "${searchQuery}". Try adjusting your search term.`
                : "No categories match the active filter."}
            </p>
          </div>
          {searchQuery && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setFilterStatus("all");
              }}
              className="rounded-xl border-border text-xs font-bold"
            >
              Reset Filters
            </Button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((cat) => {
            const Icon = getCategoryIcon(cat.icon);
            const theme = getCategoryColorTheme(cat.color);

            return (
              <Card
                key={cat.id}
                className={`relative flex flex-col justify-between overflow-hidden border transition-all duration-200 hover:shadow-md ${
                  cat.isActive
                    ? "border-border bg-card"
                    : "border-border/50 bg-muted/20 opacity-80"
                }`}
              >
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    {/* Icon & Name */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex size-10 items-center justify-center rounded-xl ${theme.bg} ${theme.text} border ${theme.border} shrink-0`}
                      >
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-sm font-extrabold text-foreground">
                            {cat.name}
                          </CardTitle>
                          {!cat.isActive && (
                            <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <code className="text-[10px] font-bold font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                            {cat.slug}
                          </code>
                          <button
                            type="button"
                            onClick={() => copySlug(cat.slug)}
                            className="text-muted-foreground/60 hover:text-foreground transition-colors"
                            title="Copy slug"
                          >
                            <Copy className="size-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8 rounded-lg text-muted-foreground hover:text-foreground">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 rounded-xl">
                        <DropdownMenuLabel className="text-xs font-bold">Category Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openEditModal(cat)} className="text-xs font-semibold cursor-pointer">
                          <Edit2 className="mr-2 size-3.5" />
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="text-xs font-semibold cursor-pointer">
                          <Link href={`/admin/courses?category=${encodeURIComponent(cat.slug)}`}>
                            <ExternalLink className="mr-2 size-3.5" />
                            View Courses ({cat.courseCount || 0})
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => openDeleteModal(cat)}
                          className="text-xs font-semibold text-red-600 dark:text-red-400 focus:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="mr-2 size-3.5" />
                          Delete Category
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="p-5 pt-0 space-y-4">
                  {/* Description */}
                  <p className="text-xs text-muted-foreground font-medium line-clamp-2 min-h-8">
                    {cat.description || "No description provided."}
                  </p>

                  {/* Badges preview & Course Count */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${theme.badge}`}>
                        <span className={`size-1.5 rounded-full ${theme.dot}`} />
                        {cat.name}
                      </span>
                    </div>

                    <Link
                      href={`/admin/courses?category=${encodeURIComponent(cat.slug)}`}
                      className="text-xs font-bold text-muted-foreground hover:text-[#ff6636] transition-colors"
                    >
                      <span className="font-extrabold text-foreground">{cat.courseCount || 0}</span> courses
                    </Link>
                  </div>

                  {/* Card Footer with Switch and Order */}
                  <div className="flex items-center justify-between pt-2 text-[11px] text-muted-foreground">
                    <span className="font-semibold">Order: #{cat.order}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {cat.isActive ? "Active" : "Hidden"}
                      </span>
                      <Switch
                        checked={cat.isActive}
                        onCheckedChange={() => handleToggleActive(cat)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <Card className="border-border/60 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  <th className="p-3.5 pl-5">Category</th>
                  <th className="p-3.5">Slug</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5 text-center">Courses</th>
                  <th className="p-3.5 text-center">Order</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 font-semibold">
                {filteredCategories.map((cat) => {
                  const Icon = getCategoryIcon(cat.icon);
                  const theme = getCategoryColorTheme(cat.color);

                  return (
                    <tr
                      key={cat.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-3.5 pl-5">
                        <div className="flex items-center gap-2.5">
                          <div className={`flex size-8 items-center justify-center rounded-lg ${theme.bg} ${theme.text} border ${theme.border} shrink-0`}>
                            <Icon className="size-4" />
                          </div>
                          <div>
                            <span className="font-extrabold text-foreground">{cat.name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-muted-foreground">
                        <span className="bg-muted/70 px-2 py-0.5 rounded border border-border/40">
                          {cat.slug}
                        </span>
                      </td>
                      <td className="p-3.5 text-muted-foreground max-w-xs truncate font-medium">
                        {cat.description || "—"}
                      </td>
                      <td className="p-3.5 text-center font-bold">
                        <Link
                          href={`/admin/courses?category=${encodeURIComponent(cat.slug)}`}
                          className="inline-block px-2 py-0.5 rounded-md bg-muted/60 hover:bg-[#ff6636]/10 hover:text-[#ff6636] transition-colors"
                        >
                          {cat.courseCount || 0}
                        </Link>
                      </td>
                      <td className="p-3.5 text-center text-muted-foreground font-mono">
                        #{cat.order}
                      </td>
                      <td className="p-3.5 text-center">
                        <Switch
                          checked={cat.isActive}
                          onCheckedChange={() => handleToggleActive(cat)}
                        />
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
                            onClick={() => openEditModal(cat)}
                            title="Edit"
                          >
                            <Edit2 className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-500/10"
                            onClick={() => openDeleteModal(cat)}
                            title="Delete"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── CREATE CATEGORY MODAL ── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold">Create New Course Category</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add a new category track to classify courses, organize filters, and power navigation.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="create-name" className="text-xs font-bold text-foreground">
                Category Name *
              </Label>
              <Input
                id="create-name"
                placeholder="e.g. Cloud & DevOps, Mobile Engineering, AI & Machine Learning"
                value={createForm.name}
                onChange={(e) => handleCreateNameChange(e.target.value)}
                required
                className="rounded-xl border-border text-xs font-semibold"
              />
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="create-slug" className="text-xs font-bold text-foreground">
                  Identifier Slug *
                </Label>
                <span className="text-[10px] text-muted-foreground">Stored with course records</span>
              </div>
              <Input
                id="create-slug"
                placeholder="e.g. CLOUD_DEVOPS"
                value={createForm.slug}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, slug: e.target.value.toUpperCase() }))
                }
                required
                className="rounded-xl border-border font-mono text-xs font-bold"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="create-desc" className="text-xs font-bold text-foreground">
                Description (Optional)
              </Label>
              <Textarea
                id="create-desc"
                rows={2}
                placeholder="Brief summary for course search, overview cards, and SEO..."
                value={createForm.description}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                className="rounded-xl border-border text-xs font-medium"
              />
            </div>

            {/* Icon & Color Selection */}
            <div className="grid grid-cols-2 gap-3">
              {/* Icon Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Category Icon</Label>
                <Select
                  value={createForm.icon}
                  onValueChange={(val) => setCreateForm((prev) => ({ ...prev, icon: val }))}
                >
                  <SelectTrigger className="rounded-xl border-border text-xs font-semibold h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-56 rounded-xl">
                    {AVAILABLE_ICONS.map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <SelectItem key={item.name} value={item.name} className="text-xs font-semibold">
                          <div className="flex items-center gap-2">
                            <ItemIcon className="size-3.5" />
                            <span>{item.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Color Theme Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Color Theme</Label>
                <Select
                  value={createForm.color}
                  onValueChange={(val) => setCreateForm((prev) => ({ ...prev, color: val }))}
                >
                  <SelectTrigger className="rounded-xl border-border text-xs font-semibold h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {Object.entries(CATEGORY_COLORS).map(([key, theme]) => (
                      <SelectItem key={key} value={key} className="text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <span className={`size-3 rounded-full ${theme.dot}`} />
                          <span>{theme.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Order & Active Switch */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="create-order" className="text-xs font-bold text-foreground">
                  Sort Order
                </Label>
                <Input
                  id="create-order"
                  type="number"
                  value={createForm.order}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, order: parseInt(e.target.value) || 0 }))
                  }
                  className="rounded-xl border-border text-xs font-semibold"
                />
              </div>

              <div className="flex flex-col justify-end space-y-2 pb-1">
                <Label className="text-xs font-bold text-foreground">Active Visibility</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={createForm.isActive}
                    onCheckedChange={(checked) =>
                      setCreateForm((prev) => ({ ...prev, isActive: checked }))
                    }
                  />
                  <span className="text-xs font-semibold text-muted-foreground">
                    {createForm.isActive ? "Published" : "Hidden"}
                  </span>
                </div>
              </div>
            </div>

            {/* Live Badge Preview */}
            <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 space-y-1.5">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                Badge Live Preview
              </p>
              <div className="flex items-center gap-3">
                {(() => {
                  const PreviewIcon = getCategoryIcon(createForm.icon);
                  const previewTheme = getCategoryColorTheme(createForm.color);
                  return (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold border ${previewTheme.badge}`}
                    >
                      <PreviewIcon className="size-3.5" />
                      {createForm.name || "Preview Name"}
                    </span>
                  );
                })()}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-xl text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createLoading}
                className="rounded-xl bg-[#ff6636] font-bold text-white shadow-sm hover:bg-[#fa5522]"
              >
                {createLoading ? "Creating..." : "Create Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── EDIT CATEGORY MODAL ── */}
      <Dialog
        open={Boolean(editingCategory)}
        onOpenChange={(open) => {
          if (!open) setEditingCategory(null);
        }}
      >
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold">Edit Category: {editingCategory?.name}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Modify category details, visual badge properties, or change ordering.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-name" className="text-xs font-bold text-foreground">
                Category Name *
              </Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                required
                className="rounded-xl border-border text-xs font-semibold"
              />
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-slug" className="text-xs font-bold text-foreground">
                  Identifier Slug *
                </Label>
                <span className="text-[10px] text-amber-500 font-bold">
                  Editing updates linked courses
                </span>
              </div>
              <Input
                id="edit-slug"
                value={editForm.slug}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, slug: e.target.value.toUpperCase() }))
                }
                required
                className="rounded-xl border-border font-mono text-xs font-bold"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-desc" className="text-xs font-bold text-foreground">
                Description (Optional)
              </Label>
              <Textarea
                id="edit-desc"
                rows={2}
                value={editForm.description}
                onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                className="rounded-xl border-border text-xs font-medium"
              />
            </div>

            {/* Icon & Color Selection */}
            <div className="grid grid-cols-2 gap-3">
              {/* Icon Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Category Icon</Label>
                <Select
                  value={editForm.icon}
                  onValueChange={(val) => setEditForm((prev) => ({ ...prev, icon: val }))}
                >
                  <SelectTrigger className="rounded-xl border-border text-xs font-semibold h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-56 rounded-xl">
                    {AVAILABLE_ICONS.map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <SelectItem key={item.name} value={item.name} className="text-xs font-semibold">
                          <div className="flex items-center gap-2">
                            <ItemIcon className="size-3.5" />
                            <span>{item.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Color Theme Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Color Theme</Label>
                <Select
                  value={editForm.color}
                  onValueChange={(val) => setEditForm((prev) => ({ ...prev, color: val }))}
                >
                  <SelectTrigger className="rounded-xl border-border text-xs font-semibold h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {Object.entries(CATEGORY_COLORS).map(([key, theme]) => (
                      <SelectItem key={key} value={key} className="text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <span className={`size-3 rounded-full ${theme.dot}`} />
                          <span>{theme.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Order & Active Switch */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="edit-order" className="text-xs font-bold text-foreground">
                  Sort Order
                </Label>
                <Input
                  id="edit-order"
                  type="number"
                  value={editForm.order}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, order: parseInt(e.target.value) || 0 }))
                  }
                  className="rounded-xl border-border text-xs font-semibold"
                />
              </div>

              <div className="flex flex-col justify-end space-y-2 pb-1">
                <Label className="text-xs font-bold text-foreground">Active Visibility</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editForm.isActive}
                    onCheckedChange={(checked) =>
                      setEditForm((prev) => ({ ...prev, isActive: checked }))
                    }
                  />
                  <span className="text-xs font-semibold text-muted-foreground">
                    {editForm.isActive ? "Published" : "Hidden"}
                  </span>
                </div>
              </div>
            </div>

            {/* Live Badge Preview */}
            <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 space-y-1.5">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                Badge Live Preview
              </p>
              <div className="flex items-center gap-3">
                {(() => {
                  const PreviewIcon = getCategoryIcon(editForm.icon);
                  const previewTheme = getCategoryColorTheme(editForm.color);
                  return (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold border ${previewTheme.badge}`}
                    >
                      <PreviewIcon className="size-3.5" />
                      {editForm.name || "Preview Name"}
                    </span>
                  );
                })()}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingCategory(null)}
                className="rounded-xl text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={editLoading}
                className="rounded-xl bg-[#ff6636] font-bold text-white shadow-sm hover:bg-[#fa5522]"
              >
                {editLoading ? "Saving Changes..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── DELETE CATEGORY MODAL WITH REASSIGNMENT ── */}
      <Dialog
        open={Boolean(deletingCategory)}
        onOpenChange={(open) => {
          if (!open) setDeletingCategory(null);
        }}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="size-5" />
              <DialogTitle className="text-lg font-extrabold text-foreground">
                Delete Category
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Are you sure you want to delete category{" "}
              <strong className="text-foreground font-bold">"{deletingCategory?.name}"</strong>?
            </DialogDescription>
          </DialogHeader>

          {deletingCategory && deletingCategory.courseCount && deletingCategory.courseCount > 0 ? (
            <div className="space-y-3 py-2">
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300 font-semibold space-y-1">
                <p className="font-extrabold">⚠️ Warning: Courses Currently Assigned</p>
                <p>
                  There are <strong className="font-bold">{deletingCategory.courseCount} course(s)</strong> currently categorized under "{deletingCategory.name}".
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reassign-cat" className="text-xs font-bold text-foreground">
                  Reassign courses to: *
                </Label>
                <Select
                  value={reassignCategorySlug}
                  onValueChange={setReassignCategorySlug}
                >
                  <SelectTrigger id="reassign-cat" className="rounded-xl border-border text-xs font-semibold h-10">
                    <SelectValue placeholder="Select target category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {categories
                      .filter((c) => c.id !== deletingCategory.id)
                      .map((cat) => (
                        <SelectItem key={cat.id} value={cat.slug} className="text-xs font-semibold">
                          {cat.name} ({cat.slug})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="py-2 text-xs text-muted-foreground font-medium">
              No courses are assigned to this category. It can be removed immediately.
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingCategory(null)}
              className="rounded-xl text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteSubmit}
              disabled={
                deleteLoading ||
                Boolean(
                  deletingCategory?.courseCount &&
                    deletingCategory.courseCount > 0 &&
                    !reassignCategorySlug
                )
              }
              className="rounded-xl font-bold text-xs shadow-sm"
            >
              {deleteLoading
                ? "Deleting..."
                : deletingCategory?.courseCount && deletingCategory.courseCount > 0
                ? "Reassign & Delete"
                : "Delete Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
