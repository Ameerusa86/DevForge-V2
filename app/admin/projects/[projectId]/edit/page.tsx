"use client";

import { use } from "react";
import { CatalogEditForm } from "@/components/admin/catalog-edit-form";

export default function EditProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  return (
    <CatalogEditForm
      itemId={projectId}
      defaultContentType="PROJECT_TUTORIAL"
    />
  );
}
