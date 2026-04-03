import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      console.warn("No valid session for notifications request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const unreadOnly = url.searchParams.get("unreadOnly") === "true";

    console.log(
      `Fetching notifications for user ${session.user.id}, limit: ${limit}, unreadOnly: ${unreadOnly}`
    );

    const whereClause: { userId: string; read?: boolean } = { userId: session.user.id };
    if (unreadOnly) {
      whereClause.read = false;
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        read: false,
      },
    });

    console.log(
      `Found ${notifications.length} notifications, ${unreadCount} unread`
    );

    return NextResponse.json({
      notifications,
      unreadCount,
      total: await prisma.notification.count({
        where: { userId: session.user.id },
      }),
    });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "Failed to fetch notifications",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Mark notification as read
export async function PATCH(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { notificationId, markAllAsRead } = body;

    if (markAllAsRead) {
      await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          read: false,
        },
        data: { read: true },
      });

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
      });
    }

    if (notificationId) {
      const notification = await prisma.notification.update({
        where: { id: notificationId },
        data: { read: true },
      });

      return NextResponse.json(notification);
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Failed to update notification:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "Failed to update notification",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

// Create notification (admin only)
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, title, message, type, actionUrl } = body;

    const notification = await prisma.notification.create({
      data: {
        userId: userId || session.user.id,
        title,
        message,
        type: type || "INFO",
        actionUrl: actionUrl || null,
      },
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error("Failed to create notification:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "Failed to create notification",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
