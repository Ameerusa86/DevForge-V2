import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendContactFormEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get or create contact settings
    let settings = await prisma.contactSettings.findFirst();

    if (!settings) {
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

// POST /api/contact - Handle contact form submissions
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    // 1. Determine destination email for receiving contact requests
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true, email: true },
    });

    const contactSettings = await prisma.contactSettings.findFirst();
    const destinationEmail =
      process.env.ADMIN_EMAIL ||
      adminUser?.email ||
      contactSettings?.email ||
      "support@devforge.com";

    // 2. Send email via Resend
    let emailResult = { success: false };
    try {
      emailResult = await sendContactFormEmail(destinationEmail, {
        name,
        email,
        subject: subject || "General Inquiry",
        message,
      });
    } catch (err) {
      console.warn("Failed to dispatch contact email via Resend:", err);
    }

    // 3. Create in-app admin notifications
    const allAdmins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    if (allAdmins.length > 0) {
      try {
        await prisma.notification.createMany({
          data: allAdmins.map((admin) => ({
            userId: admin.id,
            type: "MESSAGE_RECEIVED",
            title: `Contact Form: ${name}`,
            message: `${subject || "New inquiry"}: "${message.slice(0, 100)}..."`,
            actionUrl: "/admin/messages",
          })),
        });
      } catch (err) {
        console.warn("Failed to create admin notification:", err);
      }
    }

    // 4. If the sender matches an existing user, record into their conversation
    const senderUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (senderUser) {
      try {
        let conversation = await prisma.conversation.findFirst({
          where: { userId: senderUser.id },
        });

        if (!conversation) {
          conversation = await prisma.conversation.create({
            data: {
              userId: senderUser.id,
              subject: subject || "Contact Form Inquiry",
            },
          });
        }

        await prisma.directMessage.create({
          data: {
            conversationId: conversation.id,
            senderId: senderUser.id,
            senderRole: "STUDENT",
            text: `[Subject: ${subject || "Inquiry"}]\n${message}`,
            read: false,
          },
        });

        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { lastMessageAt: new Date() },
        });
      } catch (err) {
        console.warn("Failed to log message to conversation history:", err);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Message received successfully. We will be in touch shortly.",
      emailDispatched: emailResult.success,
    });
  } catch (error) {
    console.error("Error processing contact form:", error);
    return NextResponse.json(
      { error: "Failed to submit contact request" },
      { status: 500 }
    );
  }
}
