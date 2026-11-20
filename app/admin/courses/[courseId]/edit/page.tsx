"use client";

import { use } from "react";
import { CatalogEditForm } from "@/components/admin/catalog-edit-form";

export default function EditCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  return <CatalogEditForm itemId={courseId} defaultContentType="COURSE" />;
}
