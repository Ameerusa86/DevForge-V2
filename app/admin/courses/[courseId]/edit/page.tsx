"use client";

import { useState, useEffect, use } from "react";
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
import { ArrowLeft } from "lucide-react";
import { useFileUpload } from "@/hooks/use-file-upload";
import { ImageUpload } from "@/components/admin/image-upload";
import { FileUpload } from "@/components/admin/file-upload";
import { CoursePreview } from "@/components/admin/course-preview";
import { generateSlug } from "@/lib/slug";
import { toast } from "sonner";

interface EditCoursePageProps {
  params: Promise<{
    courseId: string;
  }>;
}

export default function EditCoursePage({ params }: EditCoursePageProps) {
  const { courseId } = use(params);
  const router = useRouter();

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
  const [isFetching, setIsFetching] = useState(true);

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

  // Fetch existing course data
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await fetch(`/api/admin/courses/${courseId}`);
        if (!response.ok) throw new Error("Failed to fetch course");

        const course = await response.json();

        setTitle(course.title);
        setSlug(course.slug);
        setDescription(course.description);
        setCategory(course.category);
        setLevel(course.level);
        setTags(course.tags || []);
        setPrice(course.price?.toString() || "");
        setDurationMinutes(course.durationMinutes?.toString() || "");
        setImageUrl(course.imageUrl || "");
        setStatus(course.status || "DRAFT");
      } catch (error) {
        console.error("Error fetching course:", error);
        toast.error("Failed to load course data");
      } finally {
        setIsFetching(false);
      }
    };

    fetchCourse();
  }, [courseId]);

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

    toast.info("Image staged. It will upload when you save the course.", {
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
      let finalImageUrl = imageUrl?.trim();

      // Upload new image if selected
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
        slug,
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
      };

      // Call API to update course
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(courseData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || errorData.details || "Failed to update course",
        );
      }

      const updatedCourse = await response.json();
      console.log("Course updated:", updatedCourse);

      toast.success("Course updated successfully!", {
        description: `${title} has been updated.`,
      });

      // Redirect to courses page after a short delay
      setTimeout(() => {
        router.push("/admin/courses");
      }, 1000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Failed to update course:", errorMessage);
      toast.error("Failed to update course", {
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
        eyebrow="Catalog authoring"
        title="Edit Course"
        description="Update course details, revise supporting assets, and adjust publishing metadata."
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
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    placeholder="course-slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    URL: /courses/{slug || "course-slug"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the course"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
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
                      Leave 0 for free courses
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

            {/* Media */}
            <Card>
              <CardHeader>
                <CardTitle>Course Image</CardTitle>
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
              <Link href="/admin/courses">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={isLoading || isUploading}
                className="gap-2"
              >
                {isLoading ? "Updating..." : "Update Course"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AdminPage>
  );
}
