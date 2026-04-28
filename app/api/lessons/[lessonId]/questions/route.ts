import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * GET /api/lessons/[lessonId]/questions
 * Fetch all questions for a lesson with answers and user info
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  try {
    const { lessonId } = await params;

    const questions = await prisma.lessonQuestion.findMany({
      where: { lessonId },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
        answers: {
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
          orderBy: [{ isAccepted: "desc" }, { createdAt: "desc" }],
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(questions, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch questions:", error);

    const message = error instanceof Error ? error.message : "";
    if (
      message.includes("lesson_question") ||
      message.includes("does not exist")
    ) {
      // Graceful fallback if DB migration is not yet applied in this environment.
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/lessons/[lessonId]/questions
 * Create a new question (auth required)
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  try {
    const { lessonId } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, body: questionBody } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Verify lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const question = await prisma.lessonQuestion.create({
      data: {
        lessonId,
        userId: session.user.id,
        title,
        body: questionBody || null,
      },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
        answers: true,
      },
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error("Failed to create question:", error);
    return NextResponse.json(
      { error: "Failed to create question" },
      { status: 500 },
    );
  }
}
