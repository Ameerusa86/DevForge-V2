import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Get or create contact settings
    let settings = await prisma.contactSettings.findFirst();

    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.contactSettings.create({
        data: {},
      });
    }

    // Get active FAQs ordered by order field
    const faqs = await prisma.contactFaq.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      select: {
        id: true,
        question: true,
        answer: true,
        order: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        settings,
        faqs,
      },
    });
  } catch (error) {
    console.error("Error fetching contact data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch contact data" },
      { status: 500 },
    );
  }
}
