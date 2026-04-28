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

// DELETE /api/admin/questions/[questionId] - Delete a lesson question and its answers
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ questionId: string }> },
) {
  try {
    const currentUser = await ensureAdmin();

    if (!currentUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { questionId } = await context.params;

    await prisma.lessonQuestion.delete({
      where: { id: questionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting admin question:", error);
    return NextResponse.json(
      { error: "Failed to delete question" },
      { status: 500 },
    );
  }
}
