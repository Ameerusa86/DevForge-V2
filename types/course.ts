import type { CategoryScope, ContentType } from "@/lib/content-type";

export type { CategoryScope, ContentType };

export interface CourseCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  scope: CategoryScope;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  courseCount?: number;
  projectCount?: number;
  totalCount?: number;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  contentType: ContentType;
  category: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  tags: string[];
  phases?: { id: string; title: string; description?: string }[] | null;
  demoUrl?: string | null;
  starterRepoUrl?: string | null;
  githubUrl?: string | null;
  techStack?: string[];
  prerequisites?: string | null;
  deliverables?: string[];
  price: number;
  durationMinutes?: number;
  imageUrl?: string;
  showUnassignedHeader?: boolean;

  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  instructorId: string;
  userId?: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  moduleId?: string | null;
  title: string;
  order: number;
  content: string;
  isFree?: boolean;
  videoUrl?: string | null;
  durationSeconds?: number | null;
  phaseId?: string | null;
  quiz?: {
    id: string;
    title: string;
    passingScore?: number;
    questions?: unknown[];
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  order: number;
  description?: string | null;
  phaseId?: string | null;
  lessons?: Lesson[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCourseModalProps {
  onCourseCreated?: (course: Course) => void;
}
