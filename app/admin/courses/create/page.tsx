"use client";

import { useState } from "react";
import Link from "next/link";
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
import { ArrowLeft } from "lucide-react";
import { useFileUpload } from "@/hooks/use-file-upload";
import { ImageUpload } from "@/components/admin/image-upload";
import { FileUpload } from "@/components/admin/file-upload";
import { CoursePreview } from "@/components/admin/course-preview";
import { generateSlug } from "@/lib/slug";
import { toast } from "sonner";

export default function CreateCoursePage() {
  // Form state
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
  const [isLoading, setIsLoading] = useState(false);

  // File upload state
  const {
    uploadedImage,
    uploadedFiles,
    handleImageUpload,
    handleFileUpload,
    removeFile,
    removeImage,
    handleS3Upload,
    isUploading,
    uploadError,
  } = useFileUpload();

  // Auto-generate slug from title
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

  const handleImageInputChange = (file: File) => {
    handleImageUpload(file, (dataUrl) => {
      setImageUrl(dataUrl);
    });

    toast.info("Image staged. It will upload when you create the course.", {
      duration: 2500,
    });
  };

  const handleFilesInputChange = (files: FileList) => {
    handleFileUpload(files);
  };

  const handleRemoveFile = (index: number) => {
    removeFile(index);
  };

  const handleRemoveImage = () => {
    setImageUrl("");
    removeImage();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Get current user from session
      const sessionResponse = await fetch("/api/auth/get-session");

      if (!sessionResponse.ok) {
        throw new Error(
          `Auth session failed with status ${sessionResponse.status}`,
        );
      }

      let session;
      try {
        session = await sessionResponse.json();
      } catch (parseError) {
        throw new Error("Invalid session response format");
      }

      if (!session?.user?.id) {
        throw new Error("User not authenticated");
      }

      let finalImageUrl = imageUrl?.trim();

      if (
        uploadedImage &&
        (!finalImageUrl || finalImageUrl.startsWith("data:"))
      ) {
        toast.info("Uploading course image...", { duration: 2400 });
        const { key } = await handleS3Upload(uploadedImage, true);
        finalImageUrl = key;
        setImageUrl(key);
      }

      const courseData = {
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
        imageUrl: finalImageUrl || null,
        instructorId: session.user.id,
      };

      // Call API to create course
      const response = await fetch("/api/admin/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(courseData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || errorData.details || "Failed to create course",
        );
      }

      const createdCourse = await response.json();
      console.log("Course created:", createdCourse);

      toast.success("Course created successfully!", {
        description: `${title} has been created.`,
      });

      // Redirect to courses page after a short delay
      setTimeout(() => {
        window.location.href = "/admin/courses";
      }, 1000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Failed to create course:", errorMessage);
      toast.error("Failed to create course", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Catalog authoring"
        title="Create Course"
        description="Add a new text-based course, configure its metadata, and stage media before publishing."
        actions={
          <Link href="/admin/courses">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to courses
            </Button>
          </Link>
        }
      />

      {/* Main Layout: Preview + Form */}
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
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter course title"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug (auto-generated)</Label>
                  <Input
                    id="slug"
                    placeholder="course-slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    disabled
                    className="bg-muted text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground">
                    https://yoursite.com/courses/{slug}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your course"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={category} onValueChange={setCategory}>
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
                    <Select value={level} onValueChange={setLevel}>
                      <SelectTrigger id="level">
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

                {/* Tags */}
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      id="tags"
                      placeholder="Add a tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => {
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
                          className="cursor-pointer"
                          onClick={() => handleRemoveTag(index)}
                        >
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pricing, Duration & Status */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing, Duration & Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      step="0.01"
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (Minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      placeholder="120"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                      min="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Course Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {status === "DRAFT" &&
                      "Course is in draft mode and not visible to students"}
                    {status === "PUBLISHED" &&
                      "Course is published and visible to students"}
                    {status === "ARCHIVED" &&
                      "Course is archived and not available for new enrollments"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Course Content */}
            <Card>
              <CardHeader>
                <CardTitle>Course Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Image Upload */}
                <div>
                  <Label className="mb-3 block">Course Image</Label>
                  <ImageUpload
                    imageUrl={imageUrl}
                    uploadedImage={uploadedImage}
                    onImageUpload={handleImageInputChange}
                    onImageRemove={handleRemoveImage}
                    onImageUrlChange={setImageUrl}
                  />
                </div>

                {/* MDX/MD File Upload */}
                <div>
                  <Label className="mb-3 block">
                    Course Content Files (JSON, MDX, MD)
                  </Label>
                  <FileUpload
                    uploadedFiles={uploadedFiles}
                    onFileUpload={handleFilesInputChange}
                    onFileRemove={handleRemoveFile}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Link href="/admin/courses" className="flex-1">
                <Button variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={
                  isLoading || !title || !description || !category || !level
                }
                className="flex-1"
              >
                {isLoading ? "Creating..." : "Create Course"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AdminPage>
  );
}
