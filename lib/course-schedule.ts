import "server-only";

import { prisma } from "@/lib/db";
import { logCourseAuditEventSafe } from "@/lib/course-audit";

type CourseScheduleRow = {
  courseId: string;
  publishAt: string | null;
  unpublishAt: string | null;
  updatedAt: string;
};

let scheduleTableReady = false;

async function ensureCourseScheduleTable() {
  if (scheduleTableReady) return;

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "course_schedule" (
      "course_id" TEXT PRIMARY KEY,
      "publish_at" TIMESTAMPTZ,
      "unpublish_at" TIMESTAMPTZ,
      "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "course_schedule_publish_at_idx"
      ON "course_schedule" ("publish_at")
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "course_schedule_unpublish_at_idx"
      ON "course_schedule" ("unpublish_at")
  `);

  scheduleTableReady = true;
}

export async function setCourseSchedule(
  courseId: string,
  publishAt: Date | null,
  unpublishAt: Date | null,
) {
  await ensureCourseScheduleTable();

  await prisma.$executeRaw`
    INSERT INTO "course_schedule" ("course_id", "publish_at", "unpublish_at", "updated_at")
    VALUES (${courseId}, ${publishAt}, ${unpublishAt}, NOW())
    ON CONFLICT ("course_id")
    DO UPDATE SET
      "publish_at" = EXCLUDED."publish_at",
      "unpublish_at" = EXCLUDED."unpublish_at",
      "updated_at" = NOW()
  `;
}

export async function getCourseSchedules(courseIds?: string[]) {
  await ensureCourseScheduleTable();

  if (courseIds && courseIds.length > 0) {
    const rows = await prisma.$queryRaw<
      Array<{
        course_id: string;
        publish_at: Date | null;
        unpublish_at: Date | null;
        updated_at: Date;
      }>
    >`
      SELECT "course_id", "publish_at", "unpublish_at", "updated_at"
      FROM "course_schedule"
      WHERE "course_id" = ANY(${courseIds})
    `;

    return rows.map((row) => ({
      courseId: row.course_id,
      publishAt: row.publish_at ? row.publish_at.toISOString() : null,
      unpublishAt: row.unpublish_at ? row.unpublish_at.toISOString() : null,
      updatedAt: row.updated_at.toISOString(),
    })) as CourseScheduleRow[];
  }

  const rows = await prisma.$queryRaw<
    Array<{
      course_id: string;
      publish_at: Date | null;
      unpublish_at: Date | null;
      updated_at: Date;
    }>
  >`
    SELECT "course_id", "publish_at", "unpublish_at", "updated_at"
    FROM "course_schedule"
  `;

  return rows.map((row) => ({
    courseId: row.course_id,
    publishAt: row.publish_at ? row.publish_at.toISOString() : null,
    unpublishAt: row.unpublish_at ? row.unpublish_at.toISOString() : null,
    updatedAt: row.updated_at.toISOString(),
  })) as CourseScheduleRow[];
}

export async function getCourseScheduleById(courseId: string) {
  await ensureCourseScheduleTable();

  const rows = await prisma.$queryRaw<
    Array<{
      course_id: string;
      publish_at: Date | null;
      unpublish_at: Date | null;
      updated_at: Date;
    }>
  >`
    SELECT "course_id", "publish_at", "unpublish_at", "updated_at"
    FROM "course_schedule"
    WHERE "course_id" = ${courseId}
    LIMIT 1
  `;

  if (rows.length === 0) return null;

  return {
    courseId: rows[0].course_id,
    publishAt: rows[0].publish_at ? rows[0].publish_at.toISOString() : null,
    unpublishAt: rows[0].unpublish_at
      ? rows[0].unpublish_at.toISOString()
      : null,
    updatedAt: rows[0].updated_at.toISOString(),
  } as CourseScheduleRow;
}

export async function applyDueCourseSchedules() {
  await ensureCourseScheduleTable();

  const now = new Date();

  const duePublishes = await prisma.$queryRaw<
    Array<{
      id: string;
      title: string;
      slug: string;
      status: string;
    }>
  >`
    SELECT c."id", c."title", c."slug", c."status"
    FROM "course" c
    JOIN "course_schedule" s ON s."course_id" = c."id"
    WHERE s."publish_at" IS NOT NULL
      AND s."publish_at" <= ${now}
      AND c."status" <> 'PUBLISHED'
  `;

  for (const course of duePublishes) {
    await prisma.course.update({
      where: { id: course.id },
      data: {
        status: "PUBLISHED",
        publishedAt: now,
      },
    });

    await logCourseAuditEventSafe({
      courseId: course.id,
      title: "Course auto-published",
      description: "Scheduled publish time reached.",
      type: "course",
      actionUrl: `/courses/${course.slug}`,
      occurredAt: now,
    });
  }

  const dueUnpublishes = await prisma.$queryRaw<
    Array<{
      id: string;
      title: string;
      slug: string;
      status: string;
    }>
  >`
    SELECT c."id", c."title", c."slug", c."status"
    FROM "course" c
    JOIN "course_schedule" s ON s."course_id" = c."id"
    WHERE s."unpublish_at" IS NOT NULL
      AND s."unpublish_at" <= ${now}
      AND c."status" = 'PUBLISHED'
  `;

  for (const course of dueUnpublishes) {
    await prisma.course.update({
      where: { id: course.id },
      data: {
        status: "ARCHIVED",
      },
    });

    await logCourseAuditEventSafe({
      courseId: course.id,
      title: "Course auto-unpublished",
      description: "Scheduled unpublish time reached.",
      type: "course",
      actionUrl: `/admin/courses/${course.id}/edit`,
      occurredAt: now,
    });
  }
}
