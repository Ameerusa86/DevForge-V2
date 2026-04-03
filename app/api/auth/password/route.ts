import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST /api/auth/password - Update password for logged-in user
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current and new password are required" },
        { status: 400 },
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        providerId: "credential",
      },
      select: {
        id: true,
        password: true,
      },
    });

    if (!account?.password) {
      return NextResponse.json(
        { error: "No credentials account found" },
        { status: 400 },
      );
    }

    const matches = await verifyPassword({
      hash: account.password,
      password: currentPassword,
    });
    if (!matches) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 },
      );
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.account.update({
        where: { id: account.id },
        data: { password: hashedPassword },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: { mustChangePassword: false },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating password:", error);
    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 },
    );
  }
}
