import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const FLAG_MARKER_PREFIX = "FLAG_REVIEW::";

async function ensureAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  const currentUser = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, role: true },
      })
    : null;

  if (!currentUser || currentUser.role !== "ADMIN") {
    return null;
  }

  return currentUser;
}

// POST /api/admin/reviews/[reviewId]/flag - Toggle moderation flag
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ reviewId: string }> },
) {
  try {
    const currentUser = await ensureAdmin();

    if (!currentUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { reviewId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const flagged = body?.flagged !== false;

    const marker = `${FLAG_MARKER_PREFIX}${reviewId}`;

    if (flagged) {
      const existingFlag = await prisma.notification.findFirst({
        where: {
          type: "ADMIN_ALERT",
          message: marker,
        },
        select: { id: true },
      });

      if (!existingFlag) {
        await prisma.notification.create({
          data: {
            userId: currentUser.id,
            type: "ADMIN_ALERT",
            title: "Review flagged",
            message: marker,
            actionUrl: `/admin/reviews?reviewId=${reviewId}`,
          },
        });
      }

      return NextResponse.json({ success: true, flagged: true });
    }

    await prisma.notification.deleteMany({
      where: {
        type: "ADMIN_ALERT",
        message: marker,
      },
    });

    return NextResponse.json({ success: true, flagged: false });
  } catch (error) {
    console.error("Error toggling review flag:", error);
    return NextResponse.json(
      { error: "Failed to update flag state" },
      { status: 500 },
    );
  }
}
