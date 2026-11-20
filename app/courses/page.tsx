"use client";

import { CatalogBrowser } from "@/components/lms/catalog-browser";

export const dynamic = "force-dynamic";

export default function CoursesPage() {
  return <CatalogBrowser contentType="COURSE" />;
}
