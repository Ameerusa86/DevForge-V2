import "server-only";

import { NextResponse } from "next/server";
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

// GET /api/admin/questions - Get all lesson questions with answers
export async function GET() {
  try {
    const currentUser = await ensureAdmin();

    if (!currentUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const questions = await prisma.lessonQuestion.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        lesson: {
          select: {
            id: true,
            title: true,
            order: true,
            course: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
        answers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: [{ isAccepted: "desc" }, { createdAt: "desc" }],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalAnswers = questions.reduce(
      (sum, question) => sum + question.answers.length,
      0,
    );

    return NextResponse.json({
      questions,
      stats: {
        totalQuestions: questions.length,
        totalAnswers,
        unanswered: questions.filter(
          (question) => question.answers.length === 0,
        ).length,
        answered: questions.filter((question) => question.answers.length > 0)
          .length,
      },
    });
  } catch (error) {
    console.error("Error fetching admin questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 },
    );
  }
}
