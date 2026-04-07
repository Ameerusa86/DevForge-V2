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
import { ArrowLeft, ImageIcon, Loader2, X } from "lucide-react";

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
      toast.success("Course created", {
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
    DRAFT: "Not visible to students.",
    PUBLISHED: "Visible and enrollable by students.",
    ARCHIVED: "Hidden, no new enrollments.",
  };

  const previewImageUrl =
    imagePreview ??
    (imageUrl && !imageUrl.startsWith("data:")
      ? getProxiedImageUrl(imageUrl)
      : null);

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Catalog authoring"
        title="Create Course"
        description="Configure metadata and upload a cover image, then add lessons once the course is created."
        actions={
          <Link href="/admin/courses">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to courses
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sticky sidebar preview */}
        <div className="lg:col-span-1">
          <CoursePreview
            title={title}
            category={category}
            level={level}
            price={price}
            instructor=""
            imageUrl={previewImageUrl ?? ""}
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-6">
          {/* Basic details */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Course Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g. Complete React Developer Course"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  disabled
                  className="bg-muted text-muted-foreground font-mono text-sm"
                />
                {slug && (
                  <p className="text-xs text-muted-foreground">
                    /courses/{slug}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="What will students learn? What are the prerequisites?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FRONTEND">Frontend</SelectItem>
                      <SelectItem value="BACKEND">Backend</SelectItem>
                      <SelectItem value="FULL_STACK">Full Stack</SelectItem>
                      <SelectItem value="PYTHON">Python</SelectItem>
                      <SelectItem value="JAVASCRIPT">JavaScript</SelectItem>
                      <SelectItem value="TYPESCRIPT">TypeScript</SelectItem>
                      <SelectItem value="CSHARP">C#</SelectItem>
                      <SelectItem value="DOT_NET">.NET</SelectItem>
                      <SelectItem value="ASP_NET">ASP.NET</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">Level *</Label>
                  <Select value={level} onValueChange={setLevel} required>
                    <SelectTrigger id="level">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BEGINNER">Beginner</SelectItem>
                      <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                      <SelectItem value="ADVANCED">Advanced</SelectItem>
                      <SelectItem value="EXPERT">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    placeholder="e.g. react, hooks, typescript"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddTag}
                  >
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer gap-1"
                        onClick={() => handleRemoveTag(index)}
                      >
                        {tag}
                        <X className="h-3 w-3" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pricing & settings */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (USD)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
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
                      className="pl-7"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Leave 0 for a free course.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="e.g. 120"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
                {status && (
                  <p className="text-xs text-muted-foreground">
                    {statusDescriptions[status]}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Course Image */}
          <Card>
            <CardHeader>
              <CardTitle>Course Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Drop zone */}
              <div
                role="button"
                tabIndex={0}
                className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
                  isDraggingOver
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50"
                }`}
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
                  <img
                    src={previewImageUrl}
                    alt="Course image preview"
                    className="max-h-56 w-full rounded-lg object-contain"
                  />
                ) : (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Drop an image here, or click to browse
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        PNG, JPG, WEBP up to 10 MB
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

              {/* URL fallback */}
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Or paste an image URL</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  placeholder="https://example.com/cover.jpg"
                  value={
                    imageUrl && !imageUrl.startsWith("data:") ? imageUrl : ""
                  }
                  onChange={(e) => {
                    setImagePreview(null);
                    setImageUrl(e.target.value);
                  }}
                />
              </div>

              {(imagePreview ||
                (imageUrl && !imageUrl.startsWith("data:"))) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                  Remove image
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Link href="/admin/courses">
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                isUploading ||
                !title ||
                !description ||
                !category ||
                !level
              }
              className="gap-2"
            >
              {(isSubmitting || isUploading) && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {isSubmitting ? "Creating..." : "Create Course"}
            </Button>
          </div>
        </form>
      </div>
    </AdminPage>
  );
}
