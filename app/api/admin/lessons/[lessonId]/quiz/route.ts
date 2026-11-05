import "server-only";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// POST /api/admin/lessons/[lessonId]/quiz - Upsert quiz with questions and options
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lessonId } = await params;
    const body = await request.json();
    const { title, description, passingScore, questions } = body;

    if (!title || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: "Title and questions array are required" },
        { status: 400 }
      );
    }

    // Upsert Quiz
    const existingQuiz = await prisma.quiz.findUnique({
      where: { lessonId },
    });

    if (existingQuiz) {
      // Delete existing questions to cleanly re-create
      await prisma.quizQuestion.deleteMany({
        where: { quizId: existingQuiz.id },
      });

      const updated = await prisma.quiz.update({
        where: { id: existingQuiz.id },
        data: {
          title,
          description: description || null,
          passingScore: passingScore ? parseInt(String(passingScore), 10) : 70,
          questions: {
            create: questions.map((q: any, qIdx: number) => ({
              question: q.question,
              order: q.order ?? qIdx,
              explanation: q.explanation || null,
              options: {
                create: (q.options || []).map((opt: any, optIdx: number) => ({
                  text: opt.text,
                  isCorrect: Boolean(opt.isCorrect),
                  order: opt.order ?? optIdx,
                })),
              },
            })),
          },
        },
        include: {
          questions: {
            include: {
              options: true,
            },
          },
        },
      });

      return NextResponse.json(updated);
    }

    const created = await prisma.quiz.create({
      data: {
        lessonId,
        title,
        description: description || null,
        passingScore: passingScore ? parseInt(String(passingScore), 10) : 70,
        questions: {
          create: questions.map((q: any, qIdx: number) => ({
            question: q.question,
            order: q.order ?? qIdx,
            explanation: q.explanation || null,
            options: {
              create: (q.options || []).map((opt: any, optIdx: number) => ({
                text: opt.text,
                isCorrect: Boolean(opt.isCorrect),
                order: opt.order ?? optIdx,
              })),
            },
          })),
        },
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error upserting quiz:", error);
    return NextResponse.json(
      { error: "Failed to save quiz" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/lessons/[lessonId]/quiz - Delete quiz
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lessonId } = await params;
    await prisma.quiz.deleteMany({
      where: { lessonId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    return NextResponse.json(
      { error: "Failed to delete quiz" },
      { status: 500 }
    );
  }
}
