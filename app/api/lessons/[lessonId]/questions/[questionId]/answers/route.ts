import { db } from "@/lib/db";
import { authClient } from "@/lib/auth-client";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * POST /api/lessons/[lessonId]/questions/[questionId]/answers
 * Add an answer to a question (auth required)
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ lessonId: string; questionId: string }> },
) {
  try {
    const { questionId } = await params;
    const session = await authClient.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { body: answerBody } = body;

    if (!answerBody?.trim()) {
      return NextResponse.json(
        { error: "Answer body is required" },
        { status: 400 },
      );
    }

    // Verify question exists
    const question = await db.lessonQuestion.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 },
      );
    }

    const answer = await db.lessonAnswer.create({
      data: {
        questionId,
        userId: session.user.id,
        body: answerBody,
      },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    return NextResponse.json(answer, { status: 201 });
  } catch (error) {
    console.error("Failed to create answer:", error);
    return NextResponse.json(
      { error: "Failed to create answer" },
      { status: 500 },
    );
  }
}
