import "server-only";

import { notFound, redirect } from "next/navigation";

import { getPublishedCatalogItemBySlug } from "@/lib/catalog-service";
import { getItemHref } from "@/lib/content-type";
import { CourseDetailClient } from "@/components/lms/course-detail-client";

export const dynamic = "force-dynamic";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  const result = await getPublishedCatalogItemBySlug(slug, "COURSE");

  if (!result) {
    notFound();
  }

  if (result.mismatch) {
    redirect(getItemHref(result.actualContentType, result.slug));
  }

  return <CourseDetailClient course={result.data} />;
}
