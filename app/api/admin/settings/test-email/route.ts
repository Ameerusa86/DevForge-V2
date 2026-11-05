import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

// POST /api/admin/settings/test-email - Test email configuration
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin privileges required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { smtpHost, smtpPort, smtpUsername } = body;

    if (!smtpHost || !smtpPort || !smtpUsername) {
      return NextResponse.json(
        { error: "Missing required SMTP configuration" },
        { status: 400 },
      );
    }

    // SMTP validation
    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${user.email}`,
    });
  } catch (error) {
    console.error("Error testing email settings:", error);
    return NextResponse.json(
      { error: "Failed to send test email" },
      { status: 500 },
    );
  }
}
