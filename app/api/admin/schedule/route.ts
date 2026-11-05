import "server-only";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/schedule - List all live sessions with registered attendees
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await prisma.liveSession.findMany({
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        registrations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { registeredAt: "desc" },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Error fetching live schedule:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedule" },
      { status: 500 }
    );
  }
}

// POST /api/admin/schedule - Create new live session
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      scheduledAt,
      durationMinutes,
      category,
      maxAttendees,
      streamUrl,
    } = body;

    if (!title || !scheduledAt) {
      return NextResponse.json(
        { error: "Title and scheduledAt date are required" },
        { status: 400 }
      );
    }

    const newSession = await prisma.liveSession.create({
      data: {
        title,
        description: description || null,
        instructorId: session.user.id,
        scheduledAt: new Date(scheduledAt),
        durationMinutes: durationMinutes ? parseInt(String(durationMinutes), 10) : 60,
        category: category || "workshop",
        maxAttendees: maxAttendees ? parseInt(String(maxAttendees), 10) : 100,
        streamUrl: streamUrl || null,
      },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        registrations: true,
      },
    });

    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    console.error("Error creating live session:", error);
    return NextResponse.json(
      { error: "Failed to create live session" },
      { status: 500 }
    );
  }
}
