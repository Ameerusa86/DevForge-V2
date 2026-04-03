import { z } from "zod";

// Enums matching Prisma schema
export const CourseLevelSchema = z.enum([
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "EXPERT",
]);

export const CourseStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const CourseCategorySchema = z.enum([
  "FRONTEND",
  "BACKEND",
  "FULL_STACK",
  "PYTHON",
  "JAVASCRIPT",
  "TYPESCRIPT",
  "CSHARP",
  "DOT_NET",
  "ASP_NET",
]);

// User schemas
export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  emailVerified: z.boolean().default(false),
  image: z.string().url().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateUserSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  emailVerified: z.boolean().default(false).optional(),
  image: z.string().url("Invalid image URL").nullable().optional(),
});

export const UpdateUserSchema = CreateUserSchema.partial().omit({ id: true });

// Course schemas
export const CourseSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  category: CourseCategorySchema,
  level: CourseLevelSchema.default("BEGINNER"),
  tags: z.array(z.string()).default([]),
  price: z.number().min(0).default(0),
  durationMinutes: z.number().int().positive().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  status: CourseStatusSchema.default("DRAFT"),
  publishedAt: z.date().nullable().optional(),
  instructorId: z.string(),
  userId: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateCourseSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: CourseCategorySchema,
  level: CourseLevelSchema.default("BEGINNER"),
  tags: z.array(z.string()).default([]).optional(),
  price: z.number().min(0, "Price must be positive").default(0).optional(),
  durationMinutes: z
    .number()
    .int()
    .positive("Duration must be positive")
    .nullable()
    .optional(),
  imageUrl: z.string().url("Invalid image URL").nullable().optional(),
  status: CourseStatusSchema.default("DRAFT").optional(),
  instructorId: z.string().min(1, "Instructor ID is required"),
  userId: z.string().nullable().optional(),
});

export const UpdateCourseSchema = CreateCourseSchema.partial().extend({
  id: z.string().uuid(),
});

export const PublishCourseSchema = z.object({
  id: z.string().uuid(),
  status: z.literal("PUBLISHED"),
  publishedAt: z.date().optional(),
});

// Enrollment schemas
export const EnrollmentSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  courseId: z.string().uuid(),
  progress: z.number().int().min(0).max(100).default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateEnrollmentSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  courseId: z.string().uuid("Invalid course ID"),
  progress: z.number().int().min(0).max(100).default(0).optional(),
});

export const UpdateEnrollmentProgressSchema = z.object({
  id: z.string().uuid(),
  progress: z.number().int().min(0).max(100, "Progress cannot exceed 100%"),
});

// Lesson schemas
export const LessonSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  title: z.string().min(1),
  order: z.number().int().positive(),
  content: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateLessonSchema = z.object({
  courseId: z.string().uuid("Invalid course ID"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  order: z.number().int().positive("Order must be a positive number"),
  content: z.string().min(1, "Content is required"),
});

export const UpdateLessonSchema = CreateLessonSchema.partial().extend({
  id: z.string().uuid(),
});

export const ReorderLessonsSchema = z.object({
  courseId: z.string().uuid(),
  lessons: z.array(
    z.object({
      id: z.string().uuid(),
      order: z.number().int().positive(),
    }),
  ),
});

// Session schemas (for auth)
export const SessionSchema = z.object({
  id: z.string(),
  expiresAt: z.date(),
  token: z.string(),
  userId: z.string(),
  ipAddress: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Account schemas (for auth)
export const AccountSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  providerId: z.string(),
  userId: z.string(),
  accessToken: z.string().nullable().optional(),
  refreshToken: z.string().nullable().optional(),
  idToken: z.string().nullable().optional(),
  accessTokenExpiresAt: z.date().nullable().optional(),
  refreshTokenExpiresAt: z.date().nullable().optional(),
  scope: z.string().nullable().optional(),
  password: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Verification schemas
export const VerificationSchema = z.object({
  id: z.string(),
  identifier: z.string(),
  value: z.string(),
  expiresAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Query/Filter schemas
export const CourseFilterSchema = z.object({
  category: CourseCategorySchema.optional(),
  level: CourseLevelSchema.optional(),
  status: CourseStatusSchema.optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  search: z.string().optional(),
  instructorId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Type exports
export type CourseLevel = z.infer<typeof CourseLevelSchema>;
export type CourseStatus = z.infer<typeof CourseStatusSchema>;
export type CourseCategory = z.infer<typeof CourseCategorySchema>;
export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type Course = z.infer<typeof CourseSchema>;
export type CreateCourse = z.infer<typeof CreateCourseSchema>;
export type UpdateCourse = z.infer<typeof UpdateCourseSchema>;
export type PublishCourse = z.infer<typeof PublishCourseSchema>;
export type Enrollment = z.infer<typeof EnrollmentSchema>;
export type CreateEnrollment = z.infer<typeof CreateEnrollmentSchema>;
export type UpdateEnrollmentProgress = z.infer<
  typeof UpdateEnrollmentProgressSchema
>;
export type Lesson = z.infer<typeof LessonSchema>;
export type CreateLesson = z.infer<typeof CreateLessonSchema>;
export type UpdateLesson = z.infer<typeof UpdateLessonSchema>;
export type ReorderLessons = z.infer<typeof ReorderLessonsSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type Account = z.infer<typeof AccountSchema>;
export type Verification = z.infer<typeof VerificationSchema>;
export type CourseFilter = z.infer<typeof CourseFilterSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
