import "server-only";

import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function requireAdmin(): Promise<
  { userId: string; error?: never } | { userId?: never; error: NextResponse }
> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || user.role !== "ADMIN") {
    return {
      error: NextResponse.json(
        { error: "Forbidden: Admin privileges required" },
        { status: 403 },
      ),
    };
  }

  return { userId: session.user.id };
}
