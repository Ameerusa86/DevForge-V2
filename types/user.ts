import { Course } from "./course";
import { Enrollment } from "./course";

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  createdAt: Date;
  enrollments: Enrollment[];
  instructedCourses: Course[];
}
