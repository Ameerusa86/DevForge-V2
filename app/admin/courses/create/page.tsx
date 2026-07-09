"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import { CoursePreview } from "@/components/admin/course-preview";
import { Badge } from "@/components/ui/badge";
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
import { useFileUpload } from "@/hooks/use-file-upload";
import { generateSlug } from "@/lib/slug";
import { getProxiedImageUrl } from "@/lib/s3-utils";
import { ArrowLeft, ImageIcon, Loader2, X, Plus, Sparkles, DollarSign, Clock, HelpCircle, Layers3 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CreateCoursePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [price, setPrice] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);

  const {
    uploadedImage,
    handleImageUpload,
    removeImage,
    handleS3Upload,
    isUploading,
  } = useFileUpload();

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setSlug(generateSlug(value));
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    handleImageUpload(file, (dataUrl) => {
      setImagePreview(dataUrl);
      setImageUrl(dataUrl);
    });
  };

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageFile(file);
  };

  const handleRemoveImage = () => {
    setImageUrl("");
    setImagePreview(null);
    removeImage();
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const sessionResponse = await fetch("/api/auth/get-session");
      if (!sessionResponse.ok) {
        throw new Error("Failed to get session");
      }

      const session = await sessionResponse.json();
      if (!session?.user?.id) {
        throw new Error("You must be signed in to create a course");
      }

      let finalImageUrl = imageUrl?.trim() || null;

      if (uploadedImage && finalImageUrl?.startsWith("data:")) {
        toast.loading("Uploading course image...", { id: "img-upload" });
        try {
          const { key, publicUrl } = await handleS3Upload(uploadedImage, true);
          finalImageUrl = publicUrl || key;
          toast.success("Image uploaded", { id: "img-upload" });
        } catch (uploadError) {
          toast.error(
            "Image upload failed — course will be saved without an image",
            {
              id: "img-upload",
            },
          );
          finalImageUrl = null;
        }
      }

      const response = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          level,
          tags,
          status,
          price: parseFloat(price) || 0,
          durationMinutes: durationMinutes
            ? parseInt(durationMinutes)
            : undefined,
          imageUrl: finalImageUrl,
          instructorId: session.user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || errorData.details || "Failed to create course",
        );
      }

      const created = await response.json();
      toast.success("Course created successfully", {
        description: `${created.title} is ready.`,
      });
      router.push(`/admin/courses/${created.id}/lessons`);
    } catch (error) {
      toast.error("Failed to create course", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusDescriptions: Record<string, string> = {
    DRAFT: "Not visible to students in search or browse catalog lists.",
    PUBLISHED: "Immediately visible and enrollable by registered students.",
    ARCHIVED: "Hidden from catalog lists; existing enrollments remain active.",
  };

  const previewImageUrl =
    imagePreview ??
    (imageUrl && !imageUrl.startsWith("data:")
      ? getProxiedImageUrl(imageUrl)
      : null);

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Catalog Authoring"
        title="Create Course"
        description="Configure syllabus metadata and upload a cover image, then add lessons once the blueprint is established."
        actions={
          <Link href="/admin/courses">
            <button className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] transition-all h-10">
              <ArrowLeft className="size-4" />
              Back to courses
            </button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 mt-6 items-start">
        
        {/* Course Card Preview Sticky Sidebar */}
        <div className="lg:col-span-1 lg:sticky lg:top-24">
          <div className="space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 pl-1">
              Live Card Preview
            </span>
            <CoursePreview
              title={title}
              category={category}
              level={level}
              price={price}
              instructor=""
              imageUrl={previewImageUrl ?? ""}
            />
          </div>
        </div>

        {/* Course input form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-6">
          
          {/* Card 1: Basic Information */}
          <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/50 px-6 py-4 flex flex-row items-center gap-2">
              <Sparkles className="size-4 text-[#ff6636]" />
              <CardTitle className="text-sm font-extrabold text-foreground">Basic Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              
              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Course Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g. Masterclass: Advanced Web Assembly & Go"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  autoFocus
                  required
                  className="h-10 rounded-xl border-border text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/80"
                />
              </div>

              {/* URL Slug Preview */}
              <div className="space-y-1.5">
                <Label htmlFor="slug" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">URL Slug (Auto Generated)</Label>
                <Input
                  id="slug"
                  value={slug}
                  disabled
                  className="h-10 rounded-xl border-border bg-muted/50 text-xs font-mono font-bold text-muted-foreground/85"
                />
                {slug && (
                  <p className="text-[10px] font-bold text-[#ff6636]/80 pl-1 uppercase tracking-wider">
                    Target Route: /courses/{slug}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Course Syllabus Summary *</Label>
                <Textarea
                  id="description"
                  placeholder="Tell learners what modules, projects, and skills will be covered in this track..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  className="min-h-24 rounded-xl border-border text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/80"
                />
              </div>

              {/* Category and Level dropdowns */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Category */}
                <div className="space-y-1.5">
                  <Label htmlFor="category" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category *</Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger id="category" className="h-10 rounded-xl border-border text-xs font-semibold">
                      <SelectValue placeholder="Select course category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="FRONTEND" className="text-xs font-semibold">Frontend</SelectItem>
                      <SelectItem value="BACKEND" className="text-xs font-semibold">Backend</SelectItem>
                      <SelectItem value="FULL_STACK" className="text-xs font-semibold">Full Stack</SelectItem>
                      <SelectItem value="PYTHON" className="text-xs font-semibold">Python</SelectItem>
                      <SelectItem value="POWERSHELL" className="text-xs font-semibold">PowerShell</SelectItem>
                      <SelectItem value="JAVASCRIPT" className="text-xs font-semibold">JavaScript</SelectItem>
                      <SelectItem value="TYPESCRIPT" className="text-xs font-semibold">TypeScript</SelectItem>
                      <SelectItem value="CSHARP" className="text-xs font-semibold">C#</SelectItem>
                      <SelectItem value="DOT_NET" className="text-xs font-semibold">.NET</SelectItem>
                      <SelectItem value="ASP_NET" className="text-xs font-semibold">ASP.NET</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Level */}
                <div className="space-y-1.5">
                  <Label htmlFor="level" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Experience Level *</Label>
                  <Select value={level} onValueChange={setLevel} required>
                    <SelectTrigger id="level" className="h-10 rounded-xl border-border text-xs font-semibold">
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="BEGINNER" className="text-xs font-semibold">Beginner</SelectItem>
                      <SelectItem value="INTERMEDIATE" className="text-xs font-semibold">Intermediate</SelectItem>
                      <SelectItem value="ADVANCED" className="text-xs font-semibold">Advanced</SelectItem>
                      <SelectItem value="EXPERT" className="text-xs font-semibold">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

              </div>

              {/* Course Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Syllabus Tags</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    placeholder="Press enter to add tag, e.g. webassembly, go"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="h-10 rounded-xl border-border text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/80"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="flex h-10 items-center justify-center rounded-xl border border-border bg-card px-4 text-xs font-bold uppercase tracking-wider text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] transition-all"
                  >
                    Add
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer gap-1.5 rounded-lg px-2.5 py-1 text-[9px] font-bold bg-[#ff6636]/10 text-[#ff6636] border-none hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                        onClick={() => handleRemoveTag(index)}
                        title="Remove Tag"
                      >
                        {tag.toLowerCase()}
                        <X className="size-3" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

            </CardContent>
          </Card>

          {/* Card 2: Pricing and settings */}
          <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/50 px-6 py-4 flex flex-row items-center gap-2">
              <DollarSign className="size-4 text-[#ff6636]" />
              <CardTitle className="text-sm font-extrabold text-foreground">Pricing & Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              
              <div className="grid grid-cols-2 gap-4">
                
                {/* Price */}
                <div className="space-y-1.5">
                  <Label htmlFor="price" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Price (USD)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 text-xs font-bold">
                      $
                    </span>
                    <Input
                      id="price"
                      type="number"
                      placeholder="0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      step="0.01"
                      min="0"
                      className="pl-7 h-10 rounded-xl border-border text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/80"
                    />
                  </div>
                  <p className="text-[9px] font-semibold text-muted-foreground leading-none">
                    Leave 0 or blank for a free course preview.
                  </p>
                </div>

                {/* Duration */}
                <div className="space-y-1.5">
                  <Label htmlFor="duration" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Duration (Minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="e.g. 120"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    min="0"
                    className="h-10 rounded-xl border-border text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/80"
                  />
                </div>

              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Catalog Visibility Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status" className="h-10 rounded-xl border-border text-xs font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="DRAFT" className="text-xs font-semibold">Draft</SelectItem>
                    <SelectItem value="PUBLISHED" className="text-xs font-semibold">Published</SelectItem>
                    <SelectItem value="ARCHIVED" className="text-xs font-semibold">Archived</SelectItem>
                  </SelectContent>
                </Select>
                {status && (
                  <p className="text-[10px] font-bold text-[#ff6636]/90 uppercase tracking-wide">
                    {statusDescriptions[status]}
                  </p>
                )}
              </div>

            </CardContent>
          </Card>

          {/* Card 3: Course Cover Image */}
          <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/50 px-6 py-4 flex flex-row items-center gap-2">
              <ImageIcon className="size-4 text-[#ff6636]" />
              <CardTitle className="text-sm font-extrabold text-foreground">Course Cover Image</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              
              {/* Drag drop zone */}
              <div
                role="button"
                tabIndex={0}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer select-none",
                  isDraggingOver
                    ? "border-[#ff6636] bg-[#ff6636]/5"
                    : "border-border hover:border-[#ff6636]/60 bg-muted/10 hover:bg-muted/20"
                )}
                onClick={() => imageInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    imageInputRef.current?.click();
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingOver(true);
                }}
                onDragLeave={() => setIsDraggingOver(false)}
                onDrop={handleImageDrop}
              >
                {previewImageUrl ? (
                  <div className="relative w-full max-h-56 overflow-hidden rounded-xl border border-border">
                    <img
                      src={previewImageUrl}
                      alt="Course image preview"
                      className="max-h-56 w-full object-contain"
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex size-11 items-center justify-center rounded-xl bg-[#ff6636]/10 text-[#ff6636]">
                      <ImageIcon className="size-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-foreground">
                        Drop an image here, or click to browse files
                      </p>
                      <p className="text-[10px] font-semibold text-muted-foreground">
                        PNG, JPG, WEBP formats supported up to 10 MB.
                      </p>
                    </div>
                  </>
                )}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageFile(file);
                  }}
                />
              </div>

              {/* Paste URL */}
              <div className="space-y-1.5">
                <Label htmlFor="imageUrl" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Or Paste an Image URL</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  placeholder="https://example.com/course-cover.jpg"
                  value={
                    imageUrl && !imageUrl.startsWith("data:") ? imageUrl : ""
                  }
                  onChange={(e) => {
                    setImagePreview(null);
                    setImageUrl(e.target.value);
                  }}
                  className="h-10 rounded-xl border-border text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/80"
                />
              </div>

              {(imagePreview || (imageUrl && !imageUrl.startsWith("data:"))) && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-rose-500 hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                >
                  <X className="size-4" />
                  Remove Cover Image
                </button>
              )}

            </CardContent>
          </Card>

          {/* Form actions triggers */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <Link href="/admin/courses">
              <button
                type="button"
                disabled={isSubmitting}
                className="flex h-10 items-center justify-center rounded-xl border border-border bg-card px-5 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-muted/50 transition-all"
              >
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              disabled={
                isSubmitting ||
                isUploading ||
                !title ||
                !description ||
                !category ||
                !level
              }
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] px-6 text-xs font-bold uppercase tracking-wider text-white transition-colors shadow-md shadow-[#ff6636]/10 disabled:opacity-60"
            >
              {(isSubmitting || isUploading) && (
                <Loader2 className="size-3.5 animate-spin" />
              )}
              {isSubmitting ? "Creating Blueprint..." : "Create Course"}
            </button>
          </div>

        </form>

      </div>
    </AdminPage>
  );
}
