import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const olderThanDays = parseInt(
      url.searchParams.get("olderThanDays") || "30"
    );

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await prisma.notification.deleteMany({
      where: {
        userId: session.user.id,
        createdAt: {
          lt: cutoffDate,
        },
        read: true,
      },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `Deleted ${result.count} old notifications`,
    });
  } catch (error) {
    console.error("Failed to clear notifications:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "Failed to clear notifications",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
