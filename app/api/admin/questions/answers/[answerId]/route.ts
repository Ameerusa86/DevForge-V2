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

// PATCH /api/admin/questions/answers/[answerId] - Toggle accepted state for an answer
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ answerId: string }> },
) {
  try {
    const currentUser = await ensureAdmin();

    if (!currentUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { answerId } = await context.params;
    const body = (await request.json()) as { isAccepted?: boolean };
    const isAccepted = body.isAccepted === true;

    const answer = await prisma.lessonAnswer.findUnique({
      where: { id: answerId },
      select: { id: true, questionId: true },
    });

    if (!answer) {
      return NextResponse.json({ error: "Answer not found" }, { status: 404 });
    }

    if (isAccepted) {
      await prisma.$transaction([
        prisma.lessonAnswer.updateMany({
          where: { questionId: answer.questionId },
          data: { isAccepted: false },
        }),
        prisma.lessonAnswer.update({
          where: { id: answerId },
          data: { isAccepted: true },
        }),
      ]);
    } else {
      await prisma.lessonAnswer.update({
        where: { id: answerId },
        data: { isAccepted: false },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating answer acceptance:", error);
    return NextResponse.json(
      { error: "Failed to update answer" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/questions/answers/[answerId] - Delete an answer
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ answerId: string }> },
) {
  try {
    const currentUser = await ensureAdmin();

    if (!currentUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { answerId } = await context.params;

    await prisma.lessonAnswer.delete({
      where: { id: answerId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting answer:", error);
    return NextResponse.json(
      { error: "Failed to delete answer" },
      { status: 500 },
    );
  }
}
