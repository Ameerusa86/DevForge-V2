"use client";

import { CatalogBrowser } from "@/components/lms/catalog-browser";

export const dynamic = "force-dynamic";

export default function ProjectsPage() {
  return <CatalogBrowser contentType="PROJECT_TUTORIAL" />;
}
