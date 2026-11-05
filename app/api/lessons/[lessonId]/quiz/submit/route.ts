import "server-only";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required to submit quiz" },
        { status: 401 }
      );
    }

    const { lessonId } = await params;
    const body = await request.json();
    const { answers } = body; // Record<questionId, selectedOptionId>

    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { error: "Answers payload is required" },
        { status: 400 }
      );
    }

    const quiz = await prisma.quiz.findUnique({
      where: { lessonId },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
        lesson: {
          select: {
            id: true,
            courseId: true,
          },
        },
      },
    });

    if (!quiz || quiz.questions.length === 0) {
      return NextResponse.json(
        { error: "Quiz not found for this lesson" },
        { status: 404 }
      );
    }

    let correctCount = 0;
    const results: Record<
      string,
      { correct: boolean; correctOptionId: string; explanation?: string }
    > = {};

    for (const question of quiz.questions) {
      const correctOption = question.options.find((o) => o.isCorrect);
      const selectedOptionId = answers[question.id];
      const isCorrect = Boolean(correctOption && selectedOptionId === correctOption.id);

      if (isCorrect) {
        correctCount += 1;
      }

      results[question.id] = {
        correct: isCorrect,
        correctOptionId: correctOption?.id || "",
        explanation: question.explanation || undefined,
      };
    }

    const totalQuestions = quiz.questions.length;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= quiz.passingScore;

    // Record submission in database
    await prisma.quizSubmission.create({
      data: {
        quizId: quiz.id,
        userId: session.user.id,
        score,
        passed,
        answers,
      },
    });

    // If passed, auto-complete the lesson for enrolled user
    if (passed) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId: quiz.lesson.courseId,
          },
        },
      });

      if (enrollment) {
        await prisma.lessonProgress.upsert({
          where: {
            userId_lessonId: {
              userId: session.user.id,
              lessonId,
            },
          },
          create: {
            userId: session.user.id,
            lessonId,
            completed: true,
            completedAt: new Date(),
          },
          update: {
            completed: true,
            completedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({
      score,
      passed,
      passingScore: quiz.passingScore,
      correctCount,
      totalQuestions,
      results,
    });
  } catch (error) {
    console.error("Error submitting quiz:", error);
    return NextResponse.json(
      { error: "Failed to grade quiz" },
      { status: 500 }
    );
  }
}
