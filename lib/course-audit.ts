import "server-only";

import { prisma } from "@/lib/db";

export type CourseAuditEventRecord = {
  id: string;
  courseId: string;
  title: string;
  description: string;
  type: "course" | "module" | "lesson" | "enrollment" | "review";
  actionUrl: string | null;
  occurredAt: string;
};

type CourseAuditEventInput = {
  courseId: string;
  title: string;
  description: string;
  type: "course" | "module" | "lesson" | "enrollment" | "review";
  actionUrl?: string | null;
  occurredAt?: Date;
};

let auditTableReady = false;

async function ensureAuditTable() {
  if (auditTableReady) return;

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "course_audit_event" (
      "id" TEXT PRIMARY KEY,
      "course_id" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "action_url" TEXT,
      "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "course_audit_event_course_id_occurred_at_idx"
      ON "course_audit_event" ("course_id", "occurred_at" DESC)
  `);

  auditTableReady = true;
}

export async function logCourseAuditEvent(input: CourseAuditEventInput) {
  await ensureAuditTable();

  await prisma.$executeRaw`
    INSERT INTO "course_audit_event" (
      "id",
      "course_id",
      "title",
      "description",
      "type",
      "action_url",
      "occurred_at"
    )
    VALUES (
      ${crypto.randomUUID()},
      ${input.courseId},
      ${input.title},
      ${input.description},
      ${input.type},
      ${input.actionUrl ?? null},
      ${input.occurredAt ?? new Date()}
    )
  `;
}

export async function logCourseAuditEventSafe(input: CourseAuditEventInput) {
  try {
    await logCourseAuditEvent(input);
  } catch (error) {
    console.warn("Failed to persist course audit event:", error);
  }
}

export async function getCourseAuditEvents(courseId: string, limit = 80) {
  await ensureAuditTable();

  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      course_id: string;
      title: string;
      description: string;
      type: string;
      action_url: string | null;
      occurred_at: Date;
    }>
  >`
    SELECT
      "id",
      "course_id",
      "title",
      "description",
      "type",
      "action_url",
      "occurred_at"
    FROM "course_audit_event"
    WHERE "course_id" = ${courseId}
    ORDER BY "occurred_at" DESC
    LIMIT ${limit}
  `;

  return rows.map((row) => ({
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    description: row.description,
    type: (row.type || "course") as CourseAuditEventRecord["type"],
    actionUrl: row.action_url,
    occurredAt: row.occurred_at.toISOString(),
  }));
}
