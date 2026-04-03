export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  category:
    | "FRONTEND"
    | "BACKEND"
    | "FULL_STACK"
    | "PYTHON"
    | "JAVASCRIPT"
    | "TYPESCRIPT"
    | "CSHARP"
    | "DOT_NET"
    | "ASP_NET";
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  tags: string[];
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
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  order: number;
  description?: string | null;
  lessons?: Lesson[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCourseModalProps {
  onCourseCreated?: (course: Course) => void;
}
