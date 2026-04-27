import "server-only";

import { NextResponse } from "next/server";
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

// GET /api/admin/reviews - Get all reviews with moderation metadata
export async function GET() {
  try {
    const currentUser = await ensureAdmin();

    if (!currentUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [reviews, flaggedNotifications] = await Promise.all([
      prisma.review.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              category: true,
              level: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.notification.findMany({
        where: {
          type: "ADMIN_ALERT",
          message: {
            startsWith: FLAG_MARKER_PREFIX,
          },
        },
        select: {
          message: true,
        },
      }),
    ]);

    const flaggedReviewIds = new Set(
      flaggedNotifications
        .map((notification) => notification.message.split("::")[1])
        .filter(Boolean),
    );

    return NextResponse.json({
      reviews: reviews.map((review) => ({
        ...review,
        flagged: flaggedReviewIds.has(review.id),
      })),
      stats: {
        total: reviews.length,
        flagged: reviews.filter((review) => flaggedReviewIds.has(review.id))
          .length,
      },
    });
  } catch (error) {
    console.error("Error fetching admin reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 },
    );
  }
}
