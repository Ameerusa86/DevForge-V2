import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Create new FAQ
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const currentUser = session?.user?.id
      ? await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { role: true },
        })
      : null;

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { question, answer, order, isActive } = body;

    if (!question || !answer) {
      return NextResponse.json(
        { success: false, error: "Question and answer are required" },
        { status: 400 },
      );
    }

    const faq = await prisma.contactFaq.create({
      data: {
        question,
        answer,
        order: order ?? 0,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({
      success: true,
      data: faq,
    });
  } catch (error) {
    console.error("Error creating FAQ:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create FAQ" },
      { status: 500 },
    );
  }
}

// Update existing FAQ
export async function PUT(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const currentUser = session?.user?.id
      ? await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { role: true },
        })
      : null;

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { id, question, answer, order, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "FAQ ID is required" },
        { status: 400 },
      );
    }

    const faq = await prisma.contactFaq.update({
      where: { id },
      data: {
        question,
        answer,
        order,
        isActive,
      },
    });

    return NextResponse.json({
      success: true,
      data: faq,
    });
  } catch (error) {
    console.error("Error updating FAQ:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update FAQ" },
      { status: 500 },
    );
  }
}

// Delete FAQ
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const currentUser = session?.user?.id
      ? await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { role: true },
        })
      : null;

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "FAQ ID is required" },
        { status: 400 },
      );
    }

    await prisma.contactFaq.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "FAQ deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting FAQ:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete FAQ" },
      { status: 500 },
    );
  }
}
