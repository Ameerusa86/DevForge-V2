import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "better-auth/crypto";

// POST /api/admin/users/[userId]/reset-password - Set a new temp password
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const currentUser = session?.user?.id
      ? await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { role: true },
        })
      : null;

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId } = await params;
    const body = (await request.json()) as { tempPassword?: string };
    const tempPassword = body?.tempPassword ?? "";

    if (tempPassword.length < 8) {
      return NextResponse.json(
        { error: "Temporary password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user?.email) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const hashedPassword = await hashPassword(tempPassword);

    const account = await prisma.account.findFirst({
      where: {
        userId,
        providerId: "credential",
      },
      select: { id: true },
    });

    await prisma.$transaction([
      account
        ? prisma.account.update({
            where: { id: account.id },
            data: { password: hashedPassword },
          })
        : prisma.account.create({
            data: {
              id: crypto.randomUUID(),
              accountId: user.email,
              providerId: "credential",
              userId,
              password: hashedPassword,
            },
          }),
      prisma.user.update({
        where: { id: userId },
        data: { mustChangePassword: true },
      }),
      prisma.session.deleteMany({ where: { userId } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 },
    );
  }
}
