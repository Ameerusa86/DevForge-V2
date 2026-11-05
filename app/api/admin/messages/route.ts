import "server-only";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/messages - Fetch all conversations with student info and unread counts
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    // Add unread count for each conversation
    const mapped = await Promise.all(
      conversations.map(async (c) => {
        const unreadCount = await prisma.directMessage.count({
          where: {
            conversationId: c.id,
            read: false,
            senderRole: "STUDENT",
          },
        });

        const lastMsg = c.messages[0];

        return {
          id: c.id,
          user: c.user.name || "Student",
          email: c.user.email,
          lastMessage: lastMsg?.text || "No messages yet",
          time: lastMsg ? new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
          unread: unreadCount,
          active: true,
          avatarFallback: (c.user.name || "ST")
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
        };
      })
    );

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
