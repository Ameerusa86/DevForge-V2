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

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // TODO: Add proper admin role checking when role field is added to User model

    const body = await req.json();
    const { smtpHost, smtpPort, smtpUsername } = body;

    // Validate required fields
    if (!smtpHost || !smtpPort || !smtpUsername) {
      return NextResponse.json(
        { error: "Missing required SMTP configuration" },
        { status: 400 },
      );
    }

    // Here you would actually test the SMTP connection using nodemailer
    // For now, we'll simulate a successful test
    // Example with nodemailer:
    /*
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: useTLS,
      auth: {
        user: smtpUsername,
        pass: smtpPassword,
      },
    });
    await transporter.verify();
    await transporter.sendMail({
      from: smtpUsername,
      to: user.email,
      subject: 'Test Email from DevForge',
      text: 'This is a test email to verify your SMTP configuration.',
    });
    */

    return NextResponse.json({
      success: true,
      message: `Test email would be sent to ${user.email}`,
    });
  } catch (error) {
    console.error("Error testing email:", error);
    return NextResponse.json(
      { error: "Failed to send test email" },
      { status: 500 },
    );
  }
}
