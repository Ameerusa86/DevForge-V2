export type ContentType = "COURSE" | "PROJECT_TUTORIAL";
export type CategoryScope = "BOTH" | "COURSE" | "PROJECT_TUTORIAL";
export type ContentTypeFilter = "ALL" | ContentType;

export function isContentType(value: unknown): value is ContentType {
  return value === "COURSE" || value === "PROJECT_TUTORIAL";
}

export function normalizeContentType(
  value: unknown,
  fallback: ContentType = "COURSE",
): ContentType {
  if (typeof value === "string") {
    const upper = value.trim().toUpperCase();
    if (upper === "PROJECT_TUTORIAL" || upper === "PROJECT" || upper === "PROJECTS") {
      return "PROJECT_TUTORIAL";
    }
    if (upper === "COURSE" || upper === "COURSES") {
      return "COURSE";
    }
  }
  return fallback;
}

export function normalizeContentTypeFilter(
  value: unknown,
  fallback: ContentTypeFilter = "ALL",
): ContentTypeFilter {
  if (typeof value === "string") {
    const upper = value.trim().toUpperCase();
    if (upper === "ALL") return "ALL";
    if (upper === "PROJECT_TUTORIAL" || upper === "PROJECT" || upper === "PROJECTS") {
      return "PROJECT_TUTORIAL";
    }
    if (upper === "COURSE" || upper === "COURSES") {
      return "COURSE";
    }
  }
  return fallback;
}

export function normalizeCategoryScope(
  value: unknown,
  fallback: CategoryScope = "BOTH",
): CategoryScope {
  if (typeof value === "string") {
    const upper = value.trim().toUpperCase();
    if (upper === "BOTH") return "BOTH";
    if (upper === "COURSE" || upper === "COURSES") return "COURSE";
    if (upper === "PROJECT_TUTORIAL" || upper === "PROJECT" || upper === "PROJECTS") {
      return "PROJECT_TUTORIAL";
    }
  }
  return fallback;
}

export function isProjectTutorial(type?: string | null): boolean {
  return type === "PROJECT_TUTORIAL";
}

export function getCatalogBasePath(type?: string | null): "/courses" | "/projects" {
  return isProjectTutorial(type) ? "/projects" : "/courses";
}

export function getAdminBasePath(
  type?: string | null,
): "/admin/courses" | "/admin/projects" {
  return isProjectTutorial(type) ? "/admin/projects" : "/admin/courses";
}

export function getAdminApiBasePath(
  type?: string | null,
): "/api/admin/courses" | "/api/admin/projects" {
  return isProjectTutorial(type) ? "/api/admin/projects" : "/api/admin/courses";
}

export function getPublicApiBasePath(
  type?: string | null,
): "/api/courses" | "/api/projects" {
  return isProjectTutorial(type) ? "/api/projects" : "/api/courses";
}

export function getItemHref(type: string | null | undefined, slug: string): string {
  return `${getCatalogBasePath(type)}/${slug}`;
}

export function getLessonHref(
  type: string | null | undefined,
  slug: string,
  lessonId: string,
): string {
  return `${getCatalogBasePath(type)}/${slug}/lessons/${lessonId}`;
}

export function getAdminEditHref(
  type: string | null | undefined,
  id: string,
): string {
  return `${getAdminBasePath(type)}/${id}/edit`;
}

export function getAdminLessonsHref(
  type: string | null | undefined,
  id: string,
): string {
  return `${getAdminBasePath(type)}/${id}/lessons`;
}

export function getCertificateCode(
  type: string | null | undefined,
  enrollmentId: string,
  completedAt: Date | string,
): string {
  const prefix = isProjectTutorial(type) ? "PROJ" : "CERT";
  const year = new Date(completedAt).getFullYear();
  return `${prefix}-${enrollmentId.substring(0, 8).toUpperCase()}-${year}`;
}

export function getContentTypeMeta(type?: string | null) {
  if (isProjectTutorial(type)) {
    return {
      contentType: "PROJECT_TUTORIAL" as const,
      navLabel: "Projects",
      singular: "Project Tutorial",
      plural: "Project Tutorials",
      shortBadge: "Project",
      basePath: "/projects" as const,
      adminBasePath: "/admin/projects" as const,
      apiBasePath: "/api/projects" as const,
      adminApiBasePath: "/api/admin/projects" as const,
      enrollCta: "Start Project",
      certificateHeading: "Certificate of Project Completion",
    };
  }
  return {
    contentType: "COURSE" as const,
    navLabel: "Courses",
    singular: "Course",
    plural: "Courses",
    shortBadge: "Course",
    basePath: "/courses" as const,
    adminBasePath: "/admin/courses" as const,
    apiBasePath: "/api/courses" as const,
    adminApiBasePath: "/api/admin/courses" as const,
    enrollCta: "Enroll",
    certificateHeading: "Certificate of Completion",
  };
}

export function getCategoryScopeLabel(scope?: string | null): string {
  switch (scope) {
    case "COURSE":
      return "Courses Only";
    case "PROJECT_TUTORIAL":
      return "Projects Only";
    default:
      return "Both";
  }
}

export interface ProjectRepoAccessResult {
  starterRepoUrl: string | null;
  githubUrl: string | null;
  hasStarterRepo: boolean;
  hasGithubRepo: boolean;
  repoAccessLocked: boolean;
}

/**
 * Enforces server-side repo link gating for Project Tutorials:
 * - Free projects (price <= 0): starter & final repo URLs are public.
 * - Paid projects (price > 0): starter & final repo URLs require enrollment or admin/instructor access.
 */
export function resolveProjectRepoAccess(params: {
  price: number;
  starterRepoUrl?: string | null;
  githubUrl?: string | null;
  isEnrolled: boolean;
  isPrivileged: boolean;
}): ProjectRepoAccessResult {
  const rawStarter = params.starterRepoUrl?.trim() || null;
  const rawGithub = params.githubUrl?.trim() || null;
  const hasStarterRepo = Boolean(rawStarter);
  const hasGithubRepo = Boolean(rawGithub);
  const isPaid = params.price > 0;
  const canViewRepos = !isPaid || params.isEnrolled || params.isPrivileged;
  const repoAccessLocked =
    isPaid && !canViewRepos && (hasStarterRepo || hasGithubRepo);

  return {
    starterRepoUrl: canViewRepos ? rawStarter : null,
    githubUrl: canViewRepos ? rawGithub : null,
    hasStarterRepo,
    hasGithubRepo,
    repoAccessLocked,
  };
}
