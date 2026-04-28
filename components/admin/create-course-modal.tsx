"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Loader2 } from "lucide-react";
import { Course, CreateCourseModalProps } from "@/types/course";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "FRONTEND", label: "Frontend" },
  { value: "BACKEND", label: "Backend" },
  { value: "FULL_STACK", label: "Full Stack" },
  { value: "PYTHON", label: "Python" },
  { value: "JAVASCRIPT", label: "JavaScript" },
  { value: "TYPESCRIPT", label: "TypeScript" },
  { value: "CSHARP", label: "C#" },
  { value: "DOT_NET", label: ".NET" },
  { value: "ASP_NET", label: "ASP.NET" },
];

const DIFFICULTY_LEVELS = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
  { value: "EXPERT", label: "Expert" },
];

export function CreateCourseModal({ onCourseCreated }: CreateCourseModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    level: "",
    instructor: "",
    price: "",
    imageUrl: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get current user from session
      const sessionResponse = await fetch("/api/auth/session");
      const session = await sessionResponse.json();

      if (!session?.user?.id) {
        throw new Error("User not authenticated");
      }

      const courseData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        level: formData.level,
        price: parseFloat(formData.price) || 0,
        imageUrl: formData.imageUrl || null,
        tags: [],
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
        throw new Error("Failed to create course");
      }

      const createdCourse = await response.json();
      onCourseCreated?.(createdCourse);
      setOpen(false);
      setFormData({
        title: "",
        description: "",
        category: "",
        level: "",
        instructor: "",
        price: "",
        imageUrl: "",
      });
    } catch (error) {
      console.error("Failed to create course:", error);
      toast.error("Failed to create course. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    formData.title &&
    formData.description &&
    formData.category &&
    formData.level &&
    formData.instructor;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Course
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full  max-h-[90vh] h-[90vh] p-0 gap-0 flex flex-col">
        <div className="w-full h-full flex flex-col bg-background rounded-lg overflow-hidden">
          <DialogHeader className="shrink-0 border-b px-6 py-4">
            <DialogTitle>Create New Coding Course</DialogTitle>
            <DialogDescription>
              Add a new text-based coding course to your platform. Focus on
              comprehensive written content and code examples.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="space-y-4 p-6 max-w-7xl mx-auto w-full">
              {/* Basic Information - Grid Layout */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">
                      Course Title *
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="e.g., Advanced Python for Data Scientists"
                      value={formData.title}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="description"
                      className="text-sm font-medium"
                    >
                      Description *
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Provide a detailed description of what students will learn..."
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-sm font-medium">
                        Category *
                      </Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) =>
                          handleSelectChange("category", value)
                        }
                      >
                        <SelectTrigger id="category" className="h-10">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="level" className="text-sm font-medium">
                        Difficulty Level *
                      </Label>
                      <Select
                        value={formData.level}
                        onValueChange={(value) =>
                          handleSelectChange("level", value)
                        }
                      >
                        <SelectTrigger id="level" className="h-10">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          {DIFFICULTY_LEVELS.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="instructor"
                        className="text-sm font-medium"
                      >
                        Instructor *
                      </Label>
                      <Input
                        id="instructor"
                        name="instructor"
                        placeholder="e.g., Dr. Jane Smith"
                        value={formData.instructor}
                        onChange={handleChange}
                        required
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-sm font-medium">
                        Price (USD)
                      </Label>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        placeholder="99.99"
                        value={formData.price}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="h-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="imageUrl" className="text-sm font-medium">
                      Course Image URL
                    </Label>
                    <Input
                      id="imageUrl"
                      name="imageUrl"
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={formData.imageUrl}
                      onChange={handleChange}
                      className="h-10"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 py-4 px-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  className="h-10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!isFormValid || loading}
                  className="min-w-[140px] h-10"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Course"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
