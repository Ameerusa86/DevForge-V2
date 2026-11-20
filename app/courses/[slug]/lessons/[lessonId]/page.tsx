import "server-only";

import { notFound, redirect } from "next/navigation";

import { getLessonPageData } from "@/lib/lesson-page-data";
import { getLessonHref } from "@/lib/content-type";
import { LessonDetailClient } from "@/components/lms/lesson-detail-client";

export const dynamic = "force-dynamic";

export default async function CourseLessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}) {
  const { slug, lessonId } = await params;

  if (!slug || !lessonId) {
    notFound();
  }

  const pageData = await getLessonPageData(slug, lessonId, "COURSE");

  if (!pageData) {
    notFound();
  }

  if (pageData.mismatch) {
    redirect(
      getLessonHref(
        pageData.actualContentType,
        pageData.slug,
        pageData.lessonId,
      ),
    );
  }

  return (
    <LessonDetailClient
      course={pageData.course}
      currentLesson={pageData.currentLesson}
      initialEnrollmentId={pageData.enrollmentId}
      initialProgressData={pageData.progressData}
    />
  );
}
