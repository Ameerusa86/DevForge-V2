import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

// GET /api/admin/suspended-users - Get all suspended users (for admin quick access)
export async function GET() {
  try {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");

    // Check if user is admin
    if (userId) {
      const admin = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (admin?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    const suspendedUsers = await prisma.user.findMany({
      where: {
        status: "SUSPENDED",
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json(suspendedUsers);
  } catch (error) {
    console.error("Error fetching suspended users:", error);
    return NextResponse.json(
      { error: "Failed to fetch suspended users" },
      { status: 500 },
    );
  }
}

// POST /api/admin/suspended-users - Quickly activate a user by email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, action } = body;

    if (!email || !action) {
      return NextResponse.json(
        { error: "Email and action are required" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, status: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (action === "activate") {
      await prisma.user.update({
        where: { email },
        data: { status: "ACTIVE" },
      });

      return NextResponse.json({
        success: true,
        message: `User ${user.name} has been activated`,
      });
    } else if (action === "suspend") {
      await prisma.user.update({
        where: { email },
        data: { status: "SUSPENDED" },
      });

      return NextResponse.json({
        success: true,
        message: `User ${user.name} has been suspended`,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating user status:", error);
    return NextResponse.json(
      { error: "Failed to update user status" },
      { status: 500 },
    );
  }
}
