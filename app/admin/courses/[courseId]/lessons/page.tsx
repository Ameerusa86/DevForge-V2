"use client";

import { use } from "react";
import { CurriculumBuilder } from "@/components/admin/curriculum-builder";

export default function CourseLessonsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  return <CurriculumBuilder courseId={courseId} contentType="COURSE" />;
}
