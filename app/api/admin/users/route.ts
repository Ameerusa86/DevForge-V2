import "server-only";
import { prisma } from "@/lib/db";
import { hashPassword } from "better-auth/crypto";
import { UserWithDetails } from "@/types/api-response";
import { Prisma, UserRole, UserStatus } from "@/lib/generated/prisma/client";
import type { UserGetPayload, UserSelect } from "@/lib/generated/prisma/models";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const userSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
  role: true,
  status: true,
  createdAt: true,
  accounts: {
    select: {
      providerId: true,
      password: true,
    },
  },
  enrollments: {
    select: {
      id: true,
      courseId: true,
    },
  },
  instructedCourses: {
    select: {
      id: true,
      title: true,
    },
  },
} satisfies UserSelect;

type DbUser = UserGetPayload<{ select: typeof userSelect }>;

const normalizeRole = (role?: string): UserRole => {
  const value = role?.toUpperCase();
  if (value === "ADMIN" || value === "INSTRUCTOR" || value === "STUDENT") {
    return value;
  }
  return "STUDENT";
};

const normalizeStatus = (status?: string): UserStatus => {
  const value = status?.toUpperCase();
  if (value === "ACTIVE" || value === "SUSPENDED") {
    return value;
  }
  return "ACTIVE";
};

const toClientUser = (user: DbUser): UserWithDetails => {
  const accounts =
    (
      user as unknown as {
        accounts?: Array<{
          providerId?: string | null;
          password?: string | null;
        }>;
      }
    ).accounts ?? [];

  const providers = accounts
    .map((a) => (a.providerId || "").toLowerCase())
    .filter(Boolean);

  const accountType: UserWithDetails["accountType"] = (() => {
    if (providers.includes("google")) return "Google";
    if (providers.includes("github")) return "GitHub";

    const hasPassword = accounts.some(
      (a) => typeof a.password === "string" && a.password.length > 0,
    );
    if (hasPassword) return "Credentials";

    if (accounts.length === 0) return "None";
    return "Unknown";
  })();

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    createdAt: user.createdAt,
    enrollments: user.enrollments,
    instructedCourses: user.instructedCourses,
    accountType,
    role:
      user.role === "ADMIN"
        ? "Admin"
        : user.role === "INSTRUCTOR"
          ? "Instructor"
          : "Student",
    status: user.status === "SUSPENDED" ? "Suspended" : "Active",
    enrollmentCount: user.enrollments?.length ?? 0,
    joined: user.createdAt?.toISOString?.().split("T")[0] ?? "",
    avatar: user.image || "",
  };
};

// GET /api/admin/users - Get all users
export async function GET() {
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

    const users = await prisma.user.findMany({
      select: userSelect,
      orderBy: {
        createdAt: "desc",
      },
    });

    const usersWithDetails = users.map(toClientUser);

    return NextResponse.json(usersWithDetails);
  } catch (error: unknown) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

// POST /api/admin/users - Create a user
export async function POST(request: NextRequest) {
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

    const body: unknown = await request.json();
    const { name, email, role, status, image, tempPassword } = (body ??
      {}) as Record<string, unknown>;

    if (typeof name !== "string" || typeof email !== "string") {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 },
      );
    }

    if (typeof tempPassword !== "string" || tempPassword.length < 8) {
      return NextResponse.json(
        { error: "Temporary password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const hashedPassword = await hashPassword(tempPassword);

    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        name,
        email,
        image: typeof image === "string" ? image : "",
        role: normalizeRole(typeof role === "string" ? role : undefined),
        status: normalizeStatus(
          typeof status === "string" ? status : undefined,
        ),
        mustChangePassword: true,
        accounts: {
          create: {
            id: crypto.randomUUID(),
            accountId: email,
            providerId: "credential",
            password: hashedPassword,
          },
        },
      },
      select: userSelect,
    });

    return NextResponse.json(toClientUser(user), { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating user:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 },
    );
  }
}
