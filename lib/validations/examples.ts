import {
  CreateCourseSchema,
  UpdateCourseSchema,
  CreateLessonSchema,
  CreateEnrollmentSchema,
  UpdateEnrollmentProgressSchema,
  CourseFilterSchema,
  PaginationSchema,
} from "./schema";

/**
 * USAGE EXAMPLES
 *
 * These Zod schemas provide runtime validation for your data.
 * Use them in API routes, forms, and anywhere you need to validate input.
 */

// ============================================
// EXAMPLE 1: Validate Course Creation
// ============================================

// Example: API Route Handler
export async function createCourseHandler(req: Request) {
  try {
    const body = await req.json();

    // Validate incoming data
    const validatedData = CreateCourseSchema.parse(body);

    // If validation passes, use the validated data
    // validatedData is now type-safe and validated
    // await prisma.course.create({ data: validatedData });

    return { success: true, data: validatedData };
  } catch (error) {
    // Zod throws ZodError with detailed error messages
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
  }
}

// ============================================
// EXAMPLE 2: Safe Parsing (no exceptions)
// ============================================

export function validateCourseData(data: unknown) {
  // Use safeParse to avoid exceptions
  const result = CreateCourseSchema.safeParse(data);

  if (!result.success) {
    // Handle validation errors
    console.error("Validation failed:", result.error.issues);
    return null;
  }

  // Data is valid and type-safe
  return result.data;
}

// ============================================
// EXAMPLE 3: Form Validation (React)
// ============================================

export function validateCourseForm(formData: FormData) {
  const data = {
    slug: formData.get("slug"),
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    level: formData.get("level") || "BEGINNER",
    price: Number(formData.get("price")) || 0,
    durationMinutes: Number(formData.get("durationMinutes")) || null,
    imageUrl: formData.get("imageUrl") || null,

    instructorId: formData.get("instructorId"),
  };

  return CreateCourseSchema.safeParse(data);
}

// ============================================
// EXAMPLE 4: Partial Updates
// ============================================

export function validateCourseUpdate(courseId: string, updates: unknown) {
  // UpdateCourseSchema allows partial updates
  const result = UpdateCourseSchema.safeParse({
    id: courseId,
    ...(typeof updates === "object" && updates !== null ? updates : {}),
  });

  if (!result.success) {
    return {
      valid: false,
      errors: result.error.flatten().fieldErrors,
    };
  }

  return {
    valid: true,
    data: result.data,
  };
}

// ============================================
// EXAMPLE 5: Query Parameter Validation
// ============================================

export function validateCourseFilters(searchParams: URLSearchParams) {
  const filters = {
    category: searchParams.get("category"),
    level: searchParams.get("level"),
    status: searchParams.get("status"),
    minPrice: searchParams.get("minPrice")
      ? Number(searchParams.get("minPrice"))
      : undefined,
    maxPrice: searchParams.get("maxPrice")
      ? Number(searchParams.get("maxPrice"))
      : undefined,
    search: searchParams.get("search"),
    instructorId: searchParams.get("instructorId"),
  };

  return CourseFilterSchema.safeParse(filters);
}

// ============================================
// EXAMPLE 6: Pagination with Validation
// ============================================

export function validatePagination(params: unknown) {
  const result = PaginationSchema.safeParse(params);

  // Returns validated pagination with defaults applied
  return result.success ? result.data : PaginationSchema.parse({});
}

// ============================================
// EXAMPLE 7: Lesson Creation with Order
// ============================================

export function validateNewLesson(courseId: string, lessonData: unknown) {
  const data = {
    courseId,
    ...(typeof lessonData === "object" && lessonData !== null
      ? lessonData
      : {}),
  };

  const result = CreateLessonSchema.safeParse(data);

  if (!result.success) {
    // Get user-friendly error messages
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    return { success: false, errors };
  }

  return { success: true, data: result.data };
}

// ============================================
// EXAMPLE 8: Enrollment Progress Update
// ============================================

export function validateProgressUpdate(enrollmentId: string, progress: number) {
  const result = UpdateEnrollmentProgressSchema.safeParse({
    id: enrollmentId,
    progress,
  });

  if (!result.success) {
    // Returns specific error like "Progress cannot exceed 100%"
    return {
      valid: false,
      error: result.error.issues[0]?.message || "Invalid progress value",
    };
  }

  return {
    valid: true,
    data: result.data,
  };
}

// ============================================
// EXAMPLE 9: Type Inference
// ============================================

// Zod schemas automatically infer TypeScript types
import type { CreateCourse, Course, Lesson } from "./schema";

export function createCourse(data: CreateCourse): Course {
  // data is fully typed based on the schema
  // Course return type is also inferred
  return {
    id: "generated-uuid",
    ...data,
    tags: data.tags || [],
    price: data.price || 0,
    status: data.status || "DRAFT",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// ============================================
// EXAMPLE 10: Custom Error Messages
// ============================================

export function getValidationErrors(error: unknown) {
  if (error instanceof Error && "errors" in error) {
    const zodError = error as {
      errors: Array<{ path: string[]; message: string }>;
    };

    return zodError.errors.reduce(
      (acc, err) => {
        const field = err.path.join(".");
        acc[field] = err.message;
        return acc;
      },
      {} as Record<string, string>,
    );
  }

  return {};
}
