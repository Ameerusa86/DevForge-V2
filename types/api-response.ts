import { Course } from "./course";

export interface CourseWithStats
  extends Omit<
    Course,
    | "Instructor"
    | "Enrollments"
    | "Lessons"
    | "CreatedAt"
    | "UpdatedAt"
    | "Price"
    | "PublishedAt"
  > {
  instructor: string;
  enrollments: number;
  lessons: number;
  rating: number;
  revenue: string;
  createdAt: string;
  updatedAt: string;
  price: number;
  publishedAt: string | undefined;
}

export interface UserWithDetails {
  id: string;
  name: string;
  email: string;
  image: string | null;
  createdAt: Date;
  enrollments: Array<{ id: string; courseId: string }>;
  instructedCourses: Array<{ id: string; title: string }>;
  role: "Admin" | "Instructor" | "Student";
  status: "Active" | "Suspended";
  accountType: "Google" | "GitHub" | "Credentials" | "None" | "Unknown";
  enrollmentCount: number;
  joined: string;
  avatar: string;
}
