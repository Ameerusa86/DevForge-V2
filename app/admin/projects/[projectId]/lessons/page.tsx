"use client";

import { use } from "react";
import { CurriculumBuilder } from "@/components/admin/curriculum-builder";

export default function ProjectLessonsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  return (
    <CurriculumBuilder courseId={projectId} contentType="PROJECT_TUTORIAL" />
  );
}
