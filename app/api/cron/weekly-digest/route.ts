import "server-only";
import { prisma } from "@/lib/db";
import { sendWeeklyDigestEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");

    const users = await prisma.user.findMany({
      where: {
        status: "ACTIVE",
        ...(targetUserId ? { id: targetUserId } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        enrollments: {
          take: 5,
          include: {
            course: {
              select: {
                title: true,
              },
            },
          },
        },
      },
      take: targetUserId ? 1 : 50,
    });

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const results = [];

    for (const user of users) {
      if (!user.email || user.enrollments.length === 0) continue;

      // Completed lessons in the last 7 days
      const completedRecent = await prisma.lessonProgress.count({
        where: {
          userId: user.id,
          completed: true,
          updatedAt: { gte: oneWeekAgo },
        },
      });

      // Calculate approximate streak (active consecutive days completed)
      const recentProgressDates = await prisma.lessonProgress.findMany({
        where: {
          userId: user.id,
          completed: true,
        },
        select: {
          updatedAt: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 30,
      });

      const uniqueDays = new Set(
        recentProgressDates.map((p) => p.updatedAt.toISOString().slice(0, 10))
      );
      const streakDays = Math.min(uniqueDays.size, 7);

      const activeCourses = user.enrollments.map((e) => ({
        title: e.course.title,
        progress: e.progress,
      }));

      const emailResult = await sendWeeklyDigestEmail(
        { email: user.email, name: user.name },
        {
          completedLessons: completedRecent,
          streakDays: Math.max(streakDays, 1),
          activeCourses,
        }
      );

      results.push({
        userId: user.id,
        email: user.email,
        success: emailResult.success,
      });
    }

    return NextResponse.json({
      message: `Weekly digest processed for ${results.length} users.`,
      results,
    });
  } catch (error) {
    console.error("Error sending weekly digests:", error);
    return NextResponse.json(
      { error: "Failed to process weekly digests" },
      { status: 500 }
    );
  }
}
