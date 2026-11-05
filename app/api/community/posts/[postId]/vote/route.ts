import "server-only";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// POST /api/community/posts/[postId]/vote - Toggle upvote
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;

    const existingVote = await prisma.communityPostVote.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: session.user.id,
        },
      },
    });

    if (existingVote) {
      // Remove vote
      await prisma.communityPostVote.delete({
        where: { id: existingVote.id },
      });
      const updated = await prisma.communityPost.update({
        where: { id: postId },
        data: { upvotes: { decrement: 1 } },
        select: { upvotes: true },
      });
      return NextResponse.json({ voted: false, upvotes: updated.upvotes });
    } else {
      // Add vote
      await prisma.communityPostVote.create({
        data: {
          postId,
          userId: session.user.id,
        },
      });
      const updated = await prisma.communityPost.update({
        where: { id: postId },
        data: { upvotes: { increment: 1 } },
        select: { upvotes: true },
      });
      return NextResponse.json({ voted: true, upvotes: updated.upvotes });
    }
  } catch (error) {
    console.error("Error toggling vote:", error);
    return NextResponse.json(
      { error: "Failed to toggle upvote" },
      { status: 500 }
    );
  }
}
