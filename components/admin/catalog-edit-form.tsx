"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, ArrowLeft, FolderPlus } from "lucide-react";
import { useFileUpload } from "@/hooks/use-file-upload";
import { ImageUpload } from "@/components/admin/image-upload";
import { CoursePreview } from "@/components/admin/course-preview";
import {
  ProjectMetadataFields,
  type ProjectMetadataState,
} from "@/components/admin/project-metadata-fields";
import { generateSlug } from "@/lib/slug";
import { getCategoryIcon, getCategoryColorTheme } from "@/lib/categories";
import {
  normalizeCoursePhases,
  resolveCoursePhaseId,
  type CoursePhase,
} from "@/lib/course-phases";
import {
  getAdminApiBasePath,
  getAdminBasePath,
  getCatalogBasePath,
  isProjectTutorial,
  normalizeContentType,
  type ContentType,
} from "@/lib/content-type";
import type { CourseCategory } from "@/types/course";
import { toast } from "sonner";

export function CatalogEditForm({
  itemId,
  defaultContentType,
}: {
  itemId: string;
  defaultContentType: ContentType;
}) {
  const router = useRouter();

  const [contentType, setContentType] =
    useState<ContentType>(defaultContentType);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [phases, setPhases] = useState<CoursePhase[]>([]);
  const [phaseTitleInput, setPhaseTitleInput] = useState("");
  const [phaseDescInput, setPhaseDescInput] = useState("");
  const [projectMeta, setProjectMeta] = useState<ProjectMetadataState>({
    demoUrl: "",
    starterRepoUrl: "",
    githubUrl: "",
    techStack: [],
    prerequisites: "",
    deliverables: [],
  });
  const [courseModules, setCourseModules] = useState<
    { id: string; title: string; phaseId?: string | null }[]
  >([]);
  const [courseLessons, setCourseLessons] = useState<
    { id: string; title: string; moduleId?: string | null; phaseId?: string | null }[]
  >([]);
  const [phaseToRemove, setPhaseToRemove] = useState<{
    index: number;
    phase: CoursePhase;
    moduleCount: number;
    lessonCount: number;
  } | null>(null);
  const [price, setPrice] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const isProject = isProjectTutorial(contentType);
  const adminBasePath = getAdminBasePath(contentType);
  const publicBasePath = getCatalogBasePath(contentType);
  const itemLabel = isProject ? "Project Tutorial" : "Course";

  const {
    uploadedImage,
    handleImageUpload,
    removeImage,
    handleS3Upload,
    isUploading,
  } = useFileUpload();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiBase = getAdminApiBasePath(defaultContentType);
        const [courseRes, catRes] = await Promise.all([
          fetch(`${apiBase}/${itemId}`),
          fetch(`/api/admin/categories`),
        ]);

        if (!courseRes.ok) throw new Error("Failed to fetch item");

        const course = await courseRes.json();
        const catData = await catRes.json();

        if (catData.success && Array.isArray(catData.data)) {
          setCategories(catData.data);
        }

        setContentType(
          normalizeContentType(course.contentType, defaultContentType),
        );
        setTitle(course.title);
        setSlug(course.slug);
        setDescription(course.description);
        setCategory(course.category);
        setLevel(course.level);
        setTags(course.tags || []);
        setPhases(normalizeCoursePhases(course.phases));
        setProjectMeta({
          demoUrl: course.demoUrl || "",
          starterRepoUrl: course.starterRepoUrl || "",
          githubUrl: course.githubUrl || "",
          techStack: Array.isArray(course.techStack) ? course.techStack : [],
          prerequisites: course.prerequisites || "",
          deliverables: Array.isArray(course.deliverables)
            ? course.deliverables
            : [],
        });
        setCourseModules(Array.isArray(course.modules) ? course.modules : []);
        setCourseLessons(Array.isArray(course.lessons) ? course.lessons : []);
        setPrice(course.price?.toString() || "");
        setDurationMinutes(course.durationMinutes?.toString() || "");
        setImageUrl(course.imageUrl || "");
        setStatus(course.status || "DRAFT");
      } catch (error) {
        console.error("Error fetching item data:", error);
        toast.error("Failed to load data");
      } finally {
        setIsFetching(false);
        setLoadingCategories(false);
      }
    };

    fetchData();
  }, [defaultContentType, itemId]);

  const scopedCategories = categories.filter(
    (c) =>
      c.slug === category ||
      c.scope === "BOTH" ||
      c.scope === contentType ||
      !c.scope,
  );

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setSlug(generateSlug(value));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleAddPhase = () => {
    const titleTrimmed = phaseTitleInput.trim();
    const descTrimmed = phaseDescInput.trim();
    if (titleTrimmed) {
      setPhases((prev) => [
        ...prev,
        { id: crypto.randomUUID(), title: titleTrimmed, description: descTrimmed },
      ]);
      setPhaseTitleInput("");
      setPhaseDescInput("");
    }
  };

  const getPhaseUsage = (phaseId: string) => {
    const moduleCount = courseModules.filter(
      (m) => resolveCoursePhaseId(m.phaseId, phases) === phaseId,
    ).length;
    const lessonCount = courseLessons.filter(
      (l) => resolveCoursePhaseId(l.phaseId, phases) === phaseId,
    ).length;
    return { moduleCount, lessonCount };
  };

  const handleRemovePhase = (index: number) => {
    const phase = phases[index];
    if (!phase) return;

    const { moduleCount, lessonCount } = getPhaseUsage(phase.id);
    if (moduleCount > 0 || lessonCount > 0) {
      setPhaseToRemove({ index, phase, moduleCount, lessonCount });
      return;
    }

    setPhases((prev) => prev.filter((_, i) => i !== index));
  };

  const confirmRemovePhase = () => {
    if (!phaseToRemove) return;
    setPhases((prev) => prev.filter((_, i) => i !== phaseToRemove.index));
    setPhaseToRemove(null);
  };

  const handleImageInputChange = (file: File) => {
    handleImageUpload(file, (dataUrl) => {
      setImageUrl(dataUrl);
    });

    toast.info("Image staged. It will upload when you save.", {
      duration: 2500,
    });
  };

  const handleRemoveImage = () => {
    setImageUrl("");
    removeImage();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let finalImageUrl = imageUrl?.trim();

      if (
        uploadedImage &&
        (!finalImageUrl || finalImageUrl.startsWith("data:"))
      ) {
        toast.info("Uploading cover image...", { duration: 2400 });
        const { key, publicUrl: uploadedPublicUrl } = await handleS3Upload(
          uploadedImage,
          true,
        );
        const resolvedUrl = uploadedPublicUrl || key;
        finalImageUrl = resolvedUrl;
        setImageUrl(resolvedUrl);
      }

      const payload = {
        title,
        slug,
        description,
        contentType,
        category,
        level,
        tags,
        phases,
        demoUrl: projectMeta.demoUrl || null,
        starterRepoUrl: projectMeta.starterRepoUrl || null,
        githubUrl: projectMeta.githubUrl || null,
        techStack: projectMeta.techStack,
        prerequisites: projectMeta.prerequisites || null,
        deliverables: projectMeta.deliverables,
        status,
        price: parseFloat(price) || 0,
        durationMinutes: durationMinutes
          ? parseInt(durationMinutes, 10)
          : null,
        imageUrl: finalImageUrl || null,
      };

      const apiBase = getAdminApiBasePath(defaultContentType);
      const response = await fetch(`${apiBase}/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            errorData.details ||
            `Failed to update ${itemLabel.toLowerCase()}`,
        );
      }

      toast.success(`${itemLabel} updated successfully!`, {
        description: `${title} has been updated.`,
      });

      setTimeout(() => {
        router.push(getAdminBasePath(contentType));
      }, 600);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Failed to update item:", errorMessage);
      toast.error(`Failed to update ${itemLabel.toLowerCase()}`, {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <Skeleton className="h-96 lg:col-span-1" />
          <Skeleton className="h-96 lg:col-span-3" />
        </div>
      </div>
    );
  }

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow={isProject ? "Project Studio authoring" : "Catalog authoring"}
        title={`Edit ${itemLabel}`}
        description={`Update ${itemLabel.toLowerCase()} details, revise supporting assets, and adjust publishing metadata.`}
        actions={
          <Link href={adminBasePath}>
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to {isProject ? "projects" : "courses"}
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar Preview */}
        <div className="lg:col-span-1">
          <CoursePreview
            title={title}
            category={category}
            level={level}
            price={price}
            instructor=""
            imageUrl={imageUrl}
          />
        </div>

        {/* Form */}
        <div className="lg:col-span-3 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Content Type Reclassification Switcher */}
                <div className="space-y-2">
                  <Label htmlFor="contentType">Content Type</Label>
                  <Select
                    value={contentType}
                    onValueChange={(val) =>
                      setContentType(val as ContentType)
                    }
                  >
                    <SelectTrigger id="contentType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COURSE">Course</SelectItem>
                      <SelectItem value="PROJECT_TUTORIAL">
                        Project Tutorial
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Switch between Course and Project Tutorial without losing lessons, enrollments, or progress.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">{itemLabel} Title *</Label>
                  <Input
                    id="title"
                    placeholder={`Enter ${itemLabel.toLowerCase()} title`}
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    placeholder="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    URL: {publicBasePath}/{slug || "item-slug"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder={`Brief description of the ${itemLabel.toLowerCase()}`}
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="category">Category *</Label>
                      <Link
                        href="/admin/categories"
                        target="_blank"
                        className="text-[11px] font-bold text-[#ff6636] hover:underline inline-flex items-center gap-0.5"
                      >
                        <FolderPlus className="size-3" /> Manage
                      </Link>
                    </div>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger
                        id="category"
                        className="rounded-xl border-border text-xs font-semibold"
                      >
                        <SelectValue
                          placeholder={
                            loadingCategories
                              ? "Loading categories..."
                              : "Select category"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl max-h-60">
                        {scopedCategories.map((cat) => {
                          const Icon = getCategoryIcon(cat.icon);
                          const theme = getCategoryColorTheme(cat.color);
                          return (
                            <SelectItem
                              key={cat.id}
                              value={cat.slug}
                              className="text-xs font-semibold"
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`flex size-4 items-center justify-center rounded-sm ${theme.bg} ${theme.text}`}
                                >
                                  <Icon className="size-2.5" />
                                </span>
                                <span>{cat.name}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="level">Level *</Label>
                    <Select value={level} onValueChange={setLevel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BEGINNER">Beginner</SelectItem>
                        <SelectItem value="INTERMEDIATE">
                          Intermediate
                        </SelectItem>
                        <SelectItem value="ADVANCED">Advanced</SelectItem>
                        <SelectItem value="EXPERT">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (USD)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave 0 for free access
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="0"
                      placeholder="60"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Project Tutorial Specific Blueprint Card */}
            {isProject && (
              <ProjectMetadataFields
                value={projectMeta}
                onChange={setProjectMeta}
              />
            )}

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddTag}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(index)}
                        className="ml-2 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Phases */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {isProject ? "Project Phases (Optional)" : "Course Phases (Optional)"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Organize modules and lessons into distinct build milestones or stages.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="grid gap-2">
                    <Input
                      placeholder="Phase Title (e.g. Phase 1: Static UI)"
                      value={phaseTitleInput}
                      onChange={(e) => setPhaseTitleInput(e.target.value)}
                    />
                    <Textarea
                      placeholder="Phase Description (Optional)"
                      value={phaseDescInput}
                      onChange={(e) => setPhaseDescInput(e.target.value)}
                      rows={2}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddPhase}
                      disabled={!phaseTitleInput.trim()}
                    >
                      Add Phase
                    </Button>
                  </div>

                  {phases.length > 0 && (
                    <div className="space-y-2 mt-4">
                      {phases.map((phase, index) => {
                        const { moduleCount, lessonCount } = getPhaseUsage(
                          phase.id,
                        );
                        const usageParts: string[] = [];
                        if (moduleCount > 0) {
                          usageParts.push(
                            `${moduleCount} ${moduleCount === 1 ? "module" : "modules"}`,
                          );
                        }
                        if (lessonCount > 0) {
                          usageParts.push(
                            `${lessonCount} ${lessonCount === 1 ? "lesson" : "lessons"}`,
                          );
                        }

                        return (
                          <div
                            key={phase.id}
                            className="flex items-start justify-between gap-2 rounded-xl border border-border p-3 bg-muted/20"
                          >
                            <div>
                              <h4 className="text-sm font-bold text-foreground">
                                {phase.title}
                              </h4>
                              {phase.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {phase.description}
                                </p>
                              )}
                              {usageParts.length > 0 && (
                                <p className="mt-1.5 inline-flex items-center rounded-full border border-border/60 bg-background px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                  {usageParts.join(" · ")} linked
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemovePhase(index)}
                              className="text-muted-foreground hover:text-destructive"
                              title="Remove Phase"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Media */}
            <Card>
              <CardHeader>
                <CardTitle>{itemLabel} Cover Image</CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  imageUrl={imageUrl}
                  uploadedImage={uploadedImage}
                  onImageUpload={handleImageInputChange}
                  onImageRemove={handleRemoveImage}
                  onImageUrlChange={(url) => setImageUrl(url)}
                />
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4 justify-end">
              <Link href={adminBasePath}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={isLoading || isUploading}
                className="gap-2"
              >
                {isLoading ? "Updating..." : `Update ${itemLabel}`}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <Dialog
        open={Boolean(phaseToRemove)}
        onOpenChange={(open) => !open && setPhaseToRemove(null)}
      >
        <DialogContent className="sm:max-w-md rounded-2xl border-border bg-card text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
              <AlertTriangle className="size-4.5 text-amber-500" />
              Remove Linked Phase?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {phaseToRemove ? (
                <>
                  Removing{" "}
                  <span className="font-bold text-foreground">
                    &ldquo;{phaseToRemove.phase.title}&rdquo;
                  </span>{" "}
                  will leave{" "}
                  {[
                    phaseToRemove.moduleCount > 0
                      ? `${phaseToRemove.moduleCount} ${phaseToRemove.moduleCount === 1 ? "module" : "modules"}`
                      : null,
                    phaseToRemove.lessonCount > 0
                      ? `${phaseToRemove.lessonCount} ${phaseToRemove.lessonCount === 1 ? "lesson" : "lessons"}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" and ")}{" "}
                  unassigned once you save.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPhaseToRemove(null)}
              className="rounded-xl h-10 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmRemovePhase}
              className="rounded-xl h-10 text-xs font-bold bg-red-500 hover:bg-red-600 text-white border-none"
            >
              Remove Phase
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
