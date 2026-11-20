import "server-only";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateSlug } from "@/lib/slug";
import { deleteS3Object } from "@/lib/s3-delete";
import { logCourseAuditEventSafe } from "@/lib/course-audit";
import {
  applyDueCourseSchedules,
  getCourseSchedules,
} from "@/lib/course-schedule";
import {
  createNotification,
  notifyCoursePublished,
} from "@/lib/notification-utils";
import { normalizeCoursePhases } from "@/lib/course-phases";
import {
  getAdminEditHref,
  getContentTypeMeta,
  getItemHref,
  normalizeContentType,
  resolveProjectRepoAccess,
  type ContentType,
  type ContentTypeFilter,
} from "@/lib/content-type";
import type { CourseWithStats } from "@/types/api-response";
import type { Prisma } from "@/lib/generated/prisma/client";

function sanitizeStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of input) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(trimmed);
    }
  }
  return result;
}

function sanitizeOptionalString(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function createUniqueCatalogSlug(
  baseTitle: string,
  excludeId?: string,
): Promise<string> {
  const base = generateSlug(baseTitle) || "item";

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const suffix = attempt === 0 ? "" : `-${attempt + 1}`;
    const candidate = `${base}${suffix}`;

    const existing = await prisma.course.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing || (excludeId && existing.id === excludeId)) {
      return candidate;
    }
  }

  return `${base}-${Date.now()}`;
}

/**
 * List published courses or project tutorials for public catalogs.
 */
export async function listPublishedCatalogItems(
  typeFilter: ContentTypeFilter = "COURSE",
) {
  const where: Prisma.CourseWhereInput = {
    status: "PUBLISHED",
    ...(typeFilter !== "ALL" ? { contentType: typeFilter } : {}),
  };

  const items = await prisma.course.findMany({
    where,
    include: {
      instructor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      enrollments: {
        select: { id: true },
      },
      lessons: {
        select: { id: true },
      },
      reviews: {
        select: {
          rating: true,
        },
      },
    },
    orderBy: {
      publishedAt: "desc",
    },
  });

  return items.map((course) => {
    const reviews = course.reviews || [];
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;
    const phases = normalizeCoursePhases(course.phases);

    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      contentType: course.contentType,
      category: course.category,
      level: course.level,
      tags: course.tags || [],
      techStack: course.techStack || [],
      demoUrl: course.demoUrl || null,
      hasStarterRepo: Boolean(course.starterRepoUrl?.trim()),
      hasGithubRepo: Boolean(course.githubUrl?.trim()),
      phaseCount: phases.length,
      price: Number(course.price),
      durationMinutes: course.durationMinutes,
      imageUrl: course.imageUrl,
      instructor: course.instructor.name,
      status: course.status,
      lessons: course.lessons.length,
      enrollments: course.enrollments.length,
      publishedAt: course.publishedAt,
      rating: averageRating,
      totalReviews: reviews.length,
    };
  });
}

/**
 * Fetch a single published catalog item by slug with server-side repo access gating.
 */
export async function getPublishedCatalogItemBySlug(
  slug: string,
  expectedType?: ContentType,
) {
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      instructor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      lessons: {
        select: {
          id: true,
          title: true,
          order: true,
          isFree: true,
          moduleId: true,
          phaseId: true,
        },
        orderBy: { order: "asc" },
      },
      modules: {
        select: {
          id: true,
          title: true,
          order: true,
          description: true,
          phaseId: true,
          lessons: {
            select: {
              id: true,
              title: true,
              order: true,
              isFree: true,
              moduleId: true,
              phaseId: true,
            },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
      enrollments: {
        select: {
          id: true,
          userId: true,
        },
      },
    },
  });

  if (!course || course.status !== "PUBLISHED") {
    return null;
  }

  if (expectedType && course.contentType !== expectedType) {
    return {
      mismatch: true as const,
      actualContentType: course.contentType,
      slug: course.slug,
    };
  }

  // Resolve repo access server-side so paid repo URLs are never leaked to unenrolled clients
  let isEnrolled = false;
  let isPrivileged = false;
  const priceNum = Number(course.price);

  if (
    course.contentType === "PROJECT_TUTORIAL" &&
    priceNum > 0 &&
    (course.starterRepoUrl || course.githubUrl)
  ) {
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      if (session?.user?.id) {
        isEnrolled = course.enrollments.some(
          (enrollment) => enrollment.userId === session.user.id,
        );
        if (!isEnrolled) {
          if (course.instructorId === session.user.id) {
            isPrivileged = true;
          } else {
            const dbUser = await prisma.user.findUnique({
              where: { id: session.user.id },
              select: { role: true },
            });
            isPrivileged = dbUser?.role === "ADMIN";
          }
        }
      }
    } catch {
      // Unauthenticated visitor — keep locked
    }
  }

  const repoAccess = resolveProjectRepoAccess({
    price: priceNum,
    starterRepoUrl: course.starterRepoUrl,
    githubUrl: course.githubUrl,
    isEnrolled,
    isPrivileged,
  });

  return {
    mismatch: false as const,
    data: {
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      contentType: course.contentType,
      category: course.category,
      level: course.level,
      tags: course.tags || [],
      phases: course.phases as
        | { id: string; title: string; description?: string }[]
        | null,
      demoUrl: course.demoUrl || null,
      starterRepoUrl: repoAccess.starterRepoUrl,
      githubUrl: repoAccess.githubUrl,
      hasStarterRepo: repoAccess.hasStarterRepo,
      hasGithubRepo: repoAccess.hasGithubRepo,
      repoAccessLocked: repoAccess.repoAccessLocked,
      techStack: course.techStack || [],
      prerequisites: course.prerequisites || null,
      deliverables: course.deliverables || [],
      price: priceNum,
      durationMinutes: course.durationMinutes,
      imageUrl: course.imageUrl,
      showUnassignedHeader: course.showUnassignedHeader,
      status: course.status,
      publishedAt: course.publishedAt,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      instructorId: course.instructorId,
      instructor: course.instructor.name,
      lessons: course.lessons,
      modules: course.modules,
      enrollments: course.enrollments.length,
    },
  };
}

/**
 * List admin catalog items with derived stats and schedules.
 */
export async function listAdminCatalogItems(
  typeFilter: ContentTypeFilter = "COURSE",
): Promise<CourseWithStats[]> {
  await applyDueCourseSchedules();

  const where: Prisma.CourseWhereInput =
    typeFilter !== "ALL" ? { contentType: typeFilter } : {};

  const courses = await prisma.course.findMany({
    where,
    include: {
      instructor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      enrollments: {
        select: { id: true },
      },
      modules: {
        select: { id: true },
      },
      lessons: {
        select: { id: true },
      },
      reviews: {
        select: {
          rating: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const schedules = await getCourseSchedules(
    courses.map((course) => course.id),
  );
  const scheduleByCourseId = new Map(
    schedules.map((schedule) => [schedule.courseId, schedule]),
  );

  return courses.map((course) => {
    const reviews = course.reviews || [];
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return {
      ...course,
      phases: course.phases as
        | { id: string; title: string; description?: string }[]
        | null,
      instructor: course.instructor.name,
      enrollments: course.enrollments.length,
      modules: course.modules.length,
      lessons: course.lessons.length,
      rating: Number(averageRating.toFixed(1)),
      totalReviews: reviews.length,
      price: Number(course.price),
      revenue: `$${(
        course.enrollments.length * Number(course.price)
      ).toLocaleString()}`,
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
      publishedAt: course.publishedAt?.toISOString(),
      schedule: scheduleByCourseId.get(course.id) || null,
    };
  }) as CourseWithStats[];
}

export interface CreateCatalogInput {
  title: string;
  description: string;
  category: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  price?: number | string;
  durationMinutes?: number | string | null;
  imageUrl?: string | null;
  tags?: string[];
  phases?: unknown;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  instructorId: string;
  contentType?: ContentType;
  demoUrl?: string | null;
  starterRepoUrl?: string | null;
  githubUrl?: string | null;
  techStack?: string[];
  prerequisites?: string | null;
  deliverables?: string[];
}

export async function createAdminCatalogItem(
  input: CreateCatalogInput,
  forcedType?: ContentType,
) {
  const contentType = forcedType ?? normalizeContentType(input.contentType, "COURSE");
  const slug = await createUniqueCatalogSlug(input.title);
  const status = input.status || "DRAFT";
  const parsedDuration =
    input.durationMinutes !== undefined &&
    input.durationMinutes !== null &&
    String(input.durationMinutes).trim() !== ""
      ? parseInt(String(input.durationMinutes), 10)
      : null;

  const course = await prisma.course.create({
    data: {
      title: input.title,
      slug,
      description: input.description,
      contentType,
      category: input.category,
      level: input.level,
      price: parseFloat(String(input.price ?? 0)) || 0,
      durationMinutes: Number.isFinite(parsedDuration) ? parsedDuration : null,
      imageUrl: sanitizeOptionalString(input.imageUrl),
      tags: sanitizeStringArray(input.tags),
      phases: (input.phases as Prisma.InputJsonValue) ?? undefined,
      demoUrl: sanitizeOptionalString(input.demoUrl),
      starterRepoUrl: sanitizeOptionalString(input.starterRepoUrl),
      githubUrl: sanitizeOptionalString(input.githubUrl),
      techStack: sanitizeStringArray(input.techStack),
      prerequisites: sanitizeOptionalString(input.prerequisites),
      deliverables: sanitizeStringArray(input.deliverables),
      status,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
      instructorId: input.instructorId,
    },
    include: {
      instructor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  const meta = getContentTypeMeta(course.contentType);

  if (status === "PUBLISHED") {
    try {
      await notifyCoursePublished(
        input.instructorId,
        input.title,
        course.contentType,
      );
    } catch (notificationError) {
      console.warn(
        "Failed to send publication notification:",
        notificationError,
      );
    }
  }

  await logCourseAuditEventSafe({
    courseId: course.id,
    title: `${meta.singular} created`,
    description: `${course.title} was created as ${course.status}.`,
    type: "course",
    actionUrl: getAdminEditHref(course.contentType, course.id),
  });

  if (course.status === "PUBLISHED") {
    await logCourseAuditEventSafe({
      courseId: course.id,
      title: `${meta.singular} published`,
      description: `${course.title} was published at creation time.`,
      type: "course",
      actionUrl: getItemHref(course.contentType, course.slug),
    });
  }

  return course;
}

export async function getAdminCatalogItemById(id: string) {
  return prisma.course.findUnique({
    where: { id },
    include: {
      instructor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      enrollments: true,
      lessons: true,
      modules: {
        select: {
          id: true,
          title: true,
          phaseId: true,
        },
      },
    },
  });
}

export async function updateAdminCatalogItem(
  courseId: string,
  body: Record<string, unknown>,
) {
  const {
    title,
    slug,
    description,
    contentType,
    category,
    level,
    price,
    durationMinutes,
    imageUrl,
    tags,
    phases,
    demoUrl,
    starterRepoUrl,
    githubUrl,
    techStack,
    prerequisites,
    deliverables,
    status,
    publishedAt,
    showUnassignedHeader,
  } = body;

  const currentCourse = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      status: true,
      title: true,
      contentType: true,
      instructorId: true,
      slug: true,
      enrollments: { select: { userId: true } },
    },
  });

  const nextContentType =
    contentType !== undefined
      ? normalizeContentType(contentType, currentCourse?.contentType ?? "COURSE")
      : undefined;

  const parsedDuration =
    durationMinutes === null || durationMinutes === ""
      ? null
      : durationMinutes !== undefined
        ? parseInt(String(durationMinutes), 10)
        : undefined;

  const updateData: Prisma.CourseUpdateInput = {
    ...(typeof title === "string" && title ? { title } : {}),
    ...(typeof slug === "string" && slug ? { slug } : {}),
    ...(typeof description === "string" && description ? { description } : {}),
    ...(nextContentType ? { contentType: nextContentType } : {}),
    ...(typeof category === "string" && category ? { category } : {}),
    ...(typeof level === "string" && level
      ? { level: level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT" }
      : {}),
    ...(price !== undefined ? { price: parseFloat(String(price)) || 0 } : {}),
    ...(parsedDuration !== undefined
      ? {
          durationMinutes:
            parsedDuration !== null && Number.isFinite(parsedDuration)
              ? parsedDuration
              : null,
        }
      : {}),
    ...(imageUrl !== undefined
      ? { imageUrl: sanitizeOptionalString(imageUrl) }
      : {}),
    ...(Array.isArray(tags) ? { tags: sanitizeStringArray(tags) } : {}),
    ...(phases !== undefined
      ? { phases: phases as Prisma.InputJsonValue }
      : {}),
    ...(demoUrl !== undefined
      ? { demoUrl: sanitizeOptionalString(demoUrl) }
      : {}),
    ...(starterRepoUrl !== undefined
      ? { starterRepoUrl: sanitizeOptionalString(starterRepoUrl) }
      : {}),
    ...(githubUrl !== undefined
      ? { githubUrl: sanitizeOptionalString(githubUrl) }
      : {}),
    ...(Array.isArray(techStack)
      ? { techStack: sanitizeStringArray(techStack) }
      : {}),
    ...(prerequisites !== undefined
      ? { prerequisites: sanitizeOptionalString(prerequisites) }
      : {}),
    ...(Array.isArray(deliverables)
      ? { deliverables: sanitizeStringArray(deliverables) }
      : {}),
    ...(typeof status === "string" && status
      ? { status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED" }
      : {}),
    ...(showUnassignedHeader !== undefined
      ? { showUnassignedHeader: Boolean(showUnassignedHeader) }
      : {}),
    ...(publishedAt !== undefined
      ? { publishedAt: publishedAt ? new Date(String(publishedAt)) : null }
      : {}),
  };

  const course = await prisma.course.update({
    where: { id: courseId },
    data: updateData,
    include: {
      instructor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  const meta = getContentTypeMeta(course.contentType);

  if (status === "PUBLISHED" && currentCourse?.status !== "PUBLISHED") {
    try {
      const courseTitle =
        (typeof title === "string" && title) ||
        currentCourse?.title ||
        `Your ${meta.singular}`;
      const instructorId = course.instructor.id;
      const courseSlug = course.slug || (typeof slug === "string" ? slug : courseId);

      await notifyCoursePublished(instructorId, courseTitle, course.contentType);

      if (currentCourse?.enrollments && currentCourse.enrollments.length > 0) {
        for (const enrollment of currentCourse.enrollments) {
          try {
            await createNotification(enrollment.userId, {
              title: `${meta.singular} Published`,
              message: `"${courseTitle}" is now live and ready to explore!`,
              type: "COURSE_UPDATED",
              actionUrl: getItemHref(course.contentType, courseSlug),
            });
          } catch (err) {
            console.warn(`Failed to notify student ${enrollment.userId}:`, err);
          }
        }
      }
    } catch (notificationError) {
      console.warn("Failed to send notifications:", notificationError);
    }
  }

  const updateFields = [
    title !== undefined ? "title" : null,
    slug !== undefined ? "slug" : null,
    description !== undefined ? "description" : null,
    nextContentType && nextContentType !== currentCourse?.contentType
      ? `type -> ${nextContentType}`
      : null,
    category !== undefined ? "category" : null,
    level !== undefined ? "level" : null,
    price !== undefined ? "price" : null,
    durationMinutes !== undefined ? "duration" : null,
    imageUrl !== undefined ? "image" : null,
    tags !== undefined ? "tags" : null,
    demoUrl !== undefined ? "demo URL" : null,
    starterRepoUrl !== undefined ? "starter repo" : null,
    githubUrl !== undefined ? "GitHub repo" : null,
    techStack !== undefined ? "tech stack" : null,
    prerequisites !== undefined ? "prerequisites" : null,
    deliverables !== undefined ? "deliverables" : null,
    status !== undefined ? "status" : null,
    showUnassignedHeader !== undefined ? "curriculum settings" : null,
  ].filter(Boolean) as string[];

  await logCourseAuditEventSafe({
    courseId,
    title: `${meta.singular} updated`,
    description:
      updateFields.length > 0
        ? `Updated fields: ${updateFields.join(", ")}.`
        : `${meta.singular} metadata updated.`,
    type: "course",
    actionUrl: getAdminEditHref(course.contentType, courseId),
  });

  if (status === "PUBLISHED" && currentCourse?.status !== "PUBLISHED") {
    await logCourseAuditEventSafe({
      courseId,
      title: `${meta.singular} published`,
      description: `${course.title} was published.`,
      type: "course",
      actionUrl: getItemHref(course.contentType, course.slug),
    });
  }

  if (status === "ARCHIVED" && currentCourse?.status !== "ARCHIVED") {
    await logCourseAuditEventSafe({
      courseId,
      title: `${meta.singular} archived`,
      description: `${course.title} was archived.`,
      type: "course",
      actionUrl: getAdminEditHref(course.contentType, courseId),
    });
  }

  return {
    ...course,
    instructor: course.instructor.name,
    price: Number(course.price),
  };
}

export async function deleteAdminCatalogItem(courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { imageUrl: true, title: true, contentType: true },
  });

  if (!course) {
    return null;
  }

  const meta = getContentTypeMeta(course.contentType);

  await prisma.course.delete({ where: { id: courseId } });

  await logCourseAuditEventSafe({
    courseId,
    title: `${meta.singular} deleted`,
    description: `${course.title} was deleted from the catalog.`,
    type: "course",
    actionUrl: null,
  });

  if (course.imageUrl) {
    const deleted = await deleteS3Object(course.imageUrl);
    if (!deleted) {
      console.warn(
        "Item deleted but image could not be removed from storage",
        course.imageUrl,
      );
    }
  }

  return { success: true };
}

export async function duplicateAdminCatalogItem(
  courseId: string,
  includeCurriculum = true,
) {
  const sourceCourse = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        orderBy: { order: "asc" },
      },
      lessons: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!sourceCourse) {
    return null;
  }

  const copiedTitle = `${sourceCourse.title} (Copy)`;
  const copiedSlug = await createUniqueCatalogSlug(copiedTitle);
  const meta = getContentTypeMeta(sourceCourse.contentType);

  const duplicated = await prisma.$transaction(async (tx) => {
    const createdCourse = await tx.course.create({
      data: {
        title: copiedTitle,
        slug: copiedSlug,
        description: sourceCourse.description,
        contentType: sourceCourse.contentType,
        category: sourceCourse.category,
        level: sourceCourse.level,
        tags: sourceCourse.tags,
        phases: (sourceCourse.phases as Prisma.InputJsonValue) ?? undefined,
        demoUrl: sourceCourse.demoUrl,
        starterRepoUrl: sourceCourse.starterRepoUrl,
        githubUrl: sourceCourse.githubUrl,
        techStack: sourceCourse.techStack,
        prerequisites: sourceCourse.prerequisites,
        deliverables: sourceCourse.deliverables,
        price: sourceCourse.price,
        durationMinutes: sourceCourse.durationMinutes,
        imageUrl: sourceCourse.imageUrl,
        showUnassignedHeader: sourceCourse.showUnassignedHeader,
        status: "DRAFT",
        publishedAt: null,
        instructorId: sourceCourse.instructorId,
        userId: sourceCourse.userId,
      },
    });

    if (!includeCurriculum) {
      return createdCourse;
    }

    const moduleIdMap = new Map<string, string>();

    for (const moduleItem of sourceCourse.modules) {
      const newModule = await tx.module.create({
        data: {
          courseId: createdCourse.id,
          title: moduleItem.title,
          order: moduleItem.order,
          description: moduleItem.description,
          phaseId: moduleItem.phaseId,
        },
      });
      moduleIdMap.set(moduleItem.id, newModule.id);
    }

    if (sourceCourse.lessons.length > 0) {
      await tx.lesson.createMany({
        data: sourceCourse.lessons.map((lesson) => ({
          courseId: createdCourse.id,
          moduleId: lesson.moduleId
            ? (moduleIdMap.get(lesson.moduleId) ?? null)
            : null,
          title: lesson.title,
          order: lesson.order,
          content: lesson.content,
          isFree: lesson.isFree,
          videoUrl: lesson.videoUrl,
          durationSeconds: lesson.durationSeconds,
          phaseId: lesson.phaseId,
        })),
      });
    }

    return createdCourse;
  });

  await logCourseAuditEventSafe({
    courseId,
    title: `${meta.singular} duplicated`,
    description: `Created duplicate "${duplicated.title}".`,
    type: "course",
    actionUrl: getAdminEditHref(duplicated.contentType, duplicated.id),
  });

  await logCourseAuditEventSafe({
    courseId: duplicated.id,
    title: `${meta.singular} copy created`,
    description: `This ${meta.singular.toLowerCase()} was duplicated from "${sourceCourse.title}".`,
    type: "course",
    actionUrl: getAdminEditHref(duplicated.contentType, duplicated.id),
  });

  return {
    id: duplicated.id,
    title: duplicated.title,
    slug: duplicated.slug,
    contentType: duplicated.contentType,
  };
}

export async function bulkUpdateAdminCatalog(params: {
  courseIds: string[];
  status?: "PUBLISHED" | "DRAFT" | "ARCHIVED";
  category?: string;
  contentType?: ContentType;
}) {
  const { courseIds, status, category, contentType } = params;

  const updateData: Prisma.CourseUpdateManyMutationInput = {};

  if (status) {
    updateData.status = status;
    updateData.publishedAt = status === "PUBLISHED" ? new Date() : null;
  }

  if (category) {
    updateData.category = category.trim();
  }

  if (contentType) {
    updateData.contentType = contentType;
  }

  const result = await prisma.course.updateMany({
    where: { id: { in: courseIds } },
    data: updateData,
  });

  const updatedCourses = await prisma.course.findMany({
    where: { id: { in: courseIds } },
    select: { id: true, title: true, slug: true, contentType: true },
  });

  const actionParts = [
    status ? `status -> ${status}` : null,
    category ? `category -> ${category}` : null,
    contentType ? `type -> ${contentType}` : null,
  ].filter(Boolean);

  await Promise.all(
    updatedCourses.map((course) =>
      logCourseAuditEventSafe({
        courseId: course.id,
        title: "Bulk update applied",
        description:
          actionParts.length > 0
            ? `Bulk action updated ${actionParts.join(" and ")}.`
            : "Bulk action updated this catalog item.",
        type: "course",
        actionUrl: getAdminEditHref(course.contentType, course.id),
      }),
    ),
  );

  return {
    success: true,
    updatedCount: result.count,
  };
}
