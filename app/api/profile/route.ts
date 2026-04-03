import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

// GET /api/profile - Get user profile with stats
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        enrollments: {
          include: {
            course: {
              select: {
                title: true,
                slug: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        reviews: {
          include: {
            course: {
              select: {
                title: true,
                slug: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate stats
    const totalEnrollments = user.enrollments.length;
    const completedCourses = user.enrollments.filter(
      (e) => e.progress === 100,
    ).length;
    const totalReviews = user.reviews.length;
    const averageProgress =
      totalEnrollments > 0
        ? user.enrollments.reduce((sum, e) => sum + e.progress, 0) /
          totalEnrollments
        : 0;

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        createdAt: user.createdAt,
        mustChangePassword: user.mustChangePassword,
      },
      stats: {
        totalEnrollments,
        completedCourses,
        totalReviews,
        averageProgress: Math.round(averageProgress),
      },
      enrollments: user.enrollments,
      reviews: user.reviews,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}

// PATCH /api/profile - Update user profile
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, image } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name.trim(),
        ...(image && { image }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
