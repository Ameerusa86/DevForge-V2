import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

// PATCH /api/admin/reviews/[reviewId] - Edit any review
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ reviewId: string }> },
) {
  try {
    const currentUser = await ensureAdmin();

    if (!currentUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { reviewId } = await context.params;
    const body = await request.json();
    const { rating, comment } = body as {
      rating?: number;
      comment?: string | null;
    };

    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 },
      );
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating,
        comment: typeof comment === "string" ? comment.trim() || null : null,
      },
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
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/reviews/[reviewId] - Delete any review
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ reviewId: string }> },
) {
  try {
    const currentUser = await ensureAdmin();

    if (!currentUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { reviewId } = await context.params;

    await prisma.review.delete({
      where: { id: reviewId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 },
    );
  }
}
