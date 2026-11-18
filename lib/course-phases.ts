export interface CoursePhase {
  id: string;
  title: string;
  description?: string;
}

export interface PhaseLessonLike {
  id: string;
  order: number;
  moduleId?: string | null;
  phaseId?: string | null;
}

export interface PhaseModuleLike<TLesson extends PhaseLessonLike> {
  id: string;
  title: string;
  order: number;
  description?: string | null;
  phaseId?: string | null;
  lessons: TLesson[];
}

export interface PhaseGroup<
  TLesson extends PhaseLessonLike,
  TModule extends PhaseModuleLike<TLesson>,
> {
  phase: CoursePhase;
  index: number;
  standaloneLessons: TLesson[];
  modules: TModule[];
  lessons: TLesson[];
}

export interface StructuredSyllabus<
  TLesson extends PhaseLessonLike,
  TModule extends PhaseModuleLike<TLesson>,
> {
  phases: CoursePhase[];
  hasPhases: boolean;
  introStandaloneLessons: TLesson[];
  phaseGroups: PhaseGroup<TLesson, TModule>[];
  otherStandaloneLessons: TLesson[];
  otherModules: TModule[];
  orderedLessons: TLesson[];
}

export interface LessonContext<
  TLesson extends PhaseLessonLike,
  TModule extends PhaseModuleLike<TLesson>,
> {
  phase: CoursePhase | null;
  phaseIndex: number;
  module: TModule | null;
  sectionKey: string | null;
}

/**
 * Normalizes raw course.phases JSON (array or JSON string) into typed CoursePhase items.
 */
export function normalizeCoursePhases(rawPhases: unknown): CoursePhase[] {
  let parsed: unknown[] = [];

  if (Array.isArray(rawPhases)) {
    parsed = rawPhases;
  } else if (typeof rawPhases === "string") {
    try {
      const result = JSON.parse(rawPhases);
      if (Array.isArray(result)) {
        parsed = result;
      }
    } catch {
      return [];
    }
  }

  return parsed
    .filter((item): item is Record<string, unknown> =>
      Boolean(item && typeof item === "object")
    )
    .map((phase, index) => ({
      id:
        typeof phase.id === "string" && phase.id.trim()
          ? phase.id.trim()
          : `phase-${index}`,
      title:
        typeof phase.title === "string" && phase.title.trim()
          ? phase.title.trim()
          : `Phase ${index + 1}`,
      description:
        typeof phase.description === "string" && phase.description.trim()
          ? phase.description.trim()
          : undefined,
    }));
}

/**
 * Resolves a stored phaseId (UUID, title, "phase-N", or numeric index) to a normalized phase ID.
 */
export function resolveCoursePhaseId(
  rawPhaseId: string | null | undefined,
  phases: CoursePhase[]
): string | null {
  if (!rawPhaseId || rawPhaseId === "none" || phases.length === 0) {
    return null;
  }

  const trimmed = rawPhaseId.trim();
  if (!trimmed || trimmed === "none") {
    return null;
  }

  const directMatch = phases.find((p) => p.id === trimmed);
  if (directMatch) {
    return directMatch.id;
  }

  const titleMatch = phases.find((p) => p.title === trimmed);
  if (titleMatch) {
    return titleMatch.id;
  }

  if (trimmed.startsWith("phase-")) {
    const idx = Number.parseInt(trimmed.slice("phase-".length), 10);
    if (Number.isInteger(idx) && idx >= 0 && phases[idx]) {
      return phases[idx].id;
    }
  }

  if (/^\d+$/.test(trimmed)) {
    const idx = Number.parseInt(trimmed, 10);
    if (Number.isInteger(idx) && idx >= 0 && phases[idx]) {
      return phases[idx].id;
    }
  }

  return null;
}

/**
 * Groups course modules and lessons by course phases while preserving display and reading order.
 */
export function buildStructuredSyllabus<
  TLesson extends PhaseLessonLike,
  TModule extends PhaseModuleLike<TLesson>,
>(
  lessons: TLesson[],
  modules: TModule[],
  rawPhases: unknown
): StructuredSyllabus<TLesson, TModule> {
  const phases = normalizeCoursePhases(rawPhases);
  const sortedModules = modules
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((moduleItem) => ({
      ...moduleItem,
      lessons: moduleItem.lessons.slice().sort((a, b) => a.order - b.order),
    }));

  const unassignedLessons = lessons
    .filter((lesson) => !lesson.moduleId)
    .slice()
    .sort((a, b) => a.order - b.order);

  if (phases.length === 0) {
    return {
      phases: [],
      hasPhases: false,
      introStandaloneLessons: unassignedLessons,
      phaseGroups: [],
      otherStandaloneLessons: [],
      otherModules: sortedModules,
      orderedLessons: [
        ...unassignedLessons,
        ...sortedModules.flatMap((m) => m.lessons),
      ],
    };
  }

  const phaseGroups: PhaseGroup<TLesson, TModule>[] = phases.map(
    (phase, index) => {
      const standaloneLessons = unassignedLessons.filter(
        (lesson) => resolveCoursePhaseId(lesson.phaseId, phases) === phase.id
      );

      const phaseModules: TModule[] = [];
      for (const moduleItem of sortedModules) {
        const isModuleInPhase =
          resolveCoursePhaseId(moduleItem.phaseId, phases) === phase.id;
        const lessonsInThisPhase = moduleItem.lessons.filter((lesson) => {
          const lessonPhaseId = resolveCoursePhaseId(lesson.phaseId, phases);
          return lessonPhaseId === phase.id || (!lessonPhaseId && isModuleInPhase);
        });

        if (isModuleInPhase || lessonsInThisPhase.length > 0) {
          phaseModules.push({
            ...moduleItem,
            lessons: lessonsInThisPhase,
          });
        }
      }

      return {
        phase,
        index,
        standaloneLessons,
        modules: phaseModules,
        lessons: [
          ...standaloneLessons,
          ...phaseModules.flatMap((m) => m.lessons),
        ],
      };
    }
  );

  const unassignedPhaseLessons = unassignedLessons.filter(
    (lesson) => !resolveCoursePhaseId(lesson.phaseId, phases)
  );

  const otherModules: TModule[] = [];
  for (const moduleItem of sortedModules) {
    const isModuleUnassigned = !resolveCoursePhaseId(moduleItem.phaseId, phases);
    if (!isModuleUnassigned) {
      continue;
    }

    const unassignedModuleLessons = moduleItem.lessons.filter(
      (lesson) => !resolveCoursePhaseId(lesson.phaseId, phases)
    );

    if (unassignedModuleLessons.length > 0 || moduleItem.lessons.length === 0) {
      otherModules.push({
        ...moduleItem,
        lessons: unassignedModuleLessons,
      });
    }
  }

  let minPhaseLessonOrder = Number.POSITIVE_INFINITY;
  for (const group of phaseGroups) {
    for (const lesson of group.lessons) {
      if (lesson.order < minPhaseLessonOrder) {
        minPhaseLessonOrder = lesson.order;
      }
    }
  }

  const introStandaloneLessons = unassignedPhaseLessons.filter(
    (lesson) => lesson.order < minPhaseLessonOrder
  );
  const otherStandaloneLessons = unassignedPhaseLessons.filter(
    (lesson) => lesson.order >= minPhaseLessonOrder
  );

  const orderedLessons = [
    ...introStandaloneLessons,
    ...phaseGroups.flatMap((group) => group.lessons),
    ...otherStandaloneLessons,
    ...otherModules.flatMap((moduleItem) => moduleItem.lessons),
  ];

  return {
    phases,
    hasPhases: true,
    introStandaloneLessons,
    phaseGroups,
    otherStandaloneLessons,
    otherModules,
    orderedLessons,
  };
}

export function getModuleAccordionKey(sectionKey: string, moduleId: string) {
  return `${sectionKey}::${moduleId}`;
}

export const OTHER_SECTION_KEY = "__other_curriculum__";
export const FLAT_SECTION_KEY = "__flat__";

/**
 * Finds the active phase, module, and accordion section key containing a given lesson.
 */
export function findLessonContext<
  TLesson extends PhaseLessonLike,
  TModule extends PhaseModuleLike<TLesson>,
>(
  syllabus: StructuredSyllabus<TLesson, TModule>,
  lessonId: string
): LessonContext<TLesson, TModule> {
  if (!syllabus.hasPhases) {
    for (const moduleItem of syllabus.otherModules) {
      if (moduleItem.lessons.some((l) => l.id === lessonId)) {
        return {
          phase: null,
          phaseIndex: -1,
          module: moduleItem,
          sectionKey: FLAT_SECTION_KEY,
        };
      }
    }
    return {
      phase: null,
      phaseIndex: -1,
      module: null,
      sectionKey: null,
    };
  }

  for (const group of syllabus.phaseGroups) {
    if (group.standaloneLessons.some((l) => l.id === lessonId)) {
      return {
        phase: group.phase,
        phaseIndex: group.index,
        module: null,
        sectionKey: group.phase.id,
      };
    }

    for (const moduleItem of group.modules) {
      if (moduleItem.lessons.some((l) => l.id === lessonId)) {
        return {
          phase: group.phase,
          phaseIndex: group.index,
          module: moduleItem,
          sectionKey: group.phase.id,
        };
      }
    }
  }

  if (syllabus.otherStandaloneLessons.some((l) => l.id === lessonId)) {
    return {
      phase: null,
      phaseIndex: -1,
      module: null,
      sectionKey: OTHER_SECTION_KEY,
    };
  }

  for (const moduleItem of syllabus.otherModules) {
    if (moduleItem.lessons.some((l) => l.id === lessonId)) {
      return {
        phase: null,
        phaseIndex: -1,
        module: moduleItem,
        sectionKey: OTHER_SECTION_KEY,
      };
    }
  }

  return {
    phase: null,
    phaseIndex: -1,
    module: null,
    sectionKey: null,
  };
}
