export interface CourseCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  courseCount?: number;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
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
