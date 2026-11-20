import "server-only";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatDistanceToNow } from "date-fns";

export async function GET() {
  try {
    const [recentUsers, recentEnrollments, recentCourses] = await Promise.all([
      prisma.user.findMany({
        select: { id: true, name: true, email: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.enrollment.findMany({
        select: {
          id: true,
          createdAt: true,
          progress: true,
          user: { select: { name: true } },
          course: { select: { title: true, contentType: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.course.findMany({
        where: { status: "PUBLISHED" },
        select: {
          id: true,
          title: true,
          contentType: true,
          publishedAt: true,
          createdAt: true,
        },
        orderBy: { publishedAt: "desc" },
        take: 10,
      }),
    ]);

    type ActivityType = "user" | "course" | "enrollment";
    type ActivityItem = {
      id: string;
      title: string;
      description: string;
      time: string;
      rawTime: Date;
      type: ActivityType;
    };

    const activities: ActivityItem[] = [];

    for (const u of recentUsers) {
      activities.push({
        id: `user-${u.id}`,
        title: "New user registration",
        description: `${u.name || u.email} joined the platform`,
        time: formatDistanceToNow(new Date(u.createdAt), { addSuffix: true }),
        rawTime: new Date(u.createdAt),
        type: "user",
      });
    }

    for (const e of recentEnrollments) {
      const itemLabel =
        e.course.contentType === "PROJECT_TUTORIAL"
          ? "Project tutorial"
          : "Course";
      if (e.progress === 100) {
        activities.push({
          id: `enroll-complete-${e.id}`,
          title: `${itemLabel} completed`,
          description: `${e.user.name || "A student"} completed "${e.course.title}"`,
          time: formatDistanceToNow(new Date(e.createdAt), { addSuffix: true }),
          rawTime: new Date(e.createdAt),
          type: "enrollment",
        });
      } else {
        activities.push({
          id: `enroll-${e.id}`,
          title: "New enrollment",
          description: `${e.user.name || "A student"} enrolled in "${e.course.title}"`,
          time: formatDistanceToNow(new Date(e.createdAt), { addSuffix: true }),
          rawTime: new Date(e.createdAt),
          type: "enrollment",
        });
      }
    }

    for (const c of recentCourses) {
      const ts = c.publishedAt ?? c.createdAt;
      const itemLabel =
        c.contentType === "PROJECT_TUTORIAL" ? "Project tutorial" : "Course";
      activities.push({
        id: `course-${c.id}`,
        title: `${itemLabel} published`,
        description: `"${c.title}" is now live`,
        time: formatDistanceToNow(new Date(ts), { addSuffix: true }),
        rawTime: new Date(ts),
        type: "course",
      });
    }

    activities.sort((a, b) => b.rawTime.getTime() - a.rawTime.getTime());
    const result = activities
      .slice(0, 20)
      .map(({ rawTime: _r, ...rest }) => rest);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 },
    );
  }
}
