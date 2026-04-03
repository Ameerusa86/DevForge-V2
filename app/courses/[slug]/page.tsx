import "server-only";

import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import {
  CourseDetailClient,
  type CourseDetail,
} from "@/components/lms/course-detail-client";

export const dynamic = "force-dynamic";

async function getCourseBySlug(slug: string): Promise<CourseDetail | null> {
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      instructor: {
        select: {
          name: true,
        },
      },
      lessons: {
        select: {
          id: true,
          title: true,
          order: true,
          isFree: true,
          moduleId: true,
        },
        orderBy: { order: "asc" },
      },
      modules: {
        select: {
          id: true,
          title: true,
          order: true,
          description: true,
          lessons: {
            select: {
              id: true,
              title: true,
              order: true,
              isFree: true,
              moduleId: true,
            },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
      enrollments: true,
    },
  });

  if (!course || course.status !== "PUBLISHED") {
    return null;
  }

  return {
    ...course,
    instructor: course.instructor.name,
    lessons: course.lessons,
    modules: course.modules,
    showUnassignedHeader: course.showUnassignedHeader,
    enrollments: course.enrollments.length,
    price: Number(course.price),
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  const course = await getCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  return <CourseDetailClient course={course} />;
}
