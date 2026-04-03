import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
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

    // Get or create contact settings
    let settings = await prisma.contactSettings.findFirst();

    if (!settings) {
      settings = await prisma.contactSettings.create({
        data: {},
      });
    }

    // Get ALL FAQs (including inactive) for admin view
    const faqs = await prisma.contactFaq.findMany({
      orderBy: { order: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        settings,
        faqs,
      },
    });
  } catch (error) {
    console.error("Error fetching contact settings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch contact settings" },
      { status: 500 },
    );
  }
}

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
    const {
      email,
      phone,
      addressLine1,
      addressLine2,
      addressLine3,
      businessHoursLine1,
      businessHoursLine2,
      responseTime,
      heroTitle,
      heroSubtitle,
    } = body;

    // Get existing settings
    let settings = await prisma.contactSettings.findFirst();

    if (!settings) {
      // Create new settings
      settings = await prisma.contactSettings.create({
        data: {
          email,
          phone,
          addressLine1,
          addressLine2,
          addressLine3,
          businessHoursLine1,
          businessHoursLine2,
          responseTime,
          heroTitle,
          heroSubtitle,
        },
      });
    } else {
      // Update existing settings
      settings = await prisma.contactSettings.update({
        where: { id: settings.id },
        data: {
          email,
          phone,
          addressLine1,
          addressLine2,
          addressLine3,
          businessHoursLine1,
          businessHoursLine2,
          responseTime,
          heroTitle,
          heroSubtitle,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error updating contact settings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update contact settings" },
      { status: 500 },
    );
  }
}
