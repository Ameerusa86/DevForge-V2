import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// CREATE new feature
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (currentUser?.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { planId, text, included, order } = body;

    if (!planId || !text) {
      return NextResponse.json(
        { success: false, error: "Plan ID and text are required" },
        { status: 400 },
      );
    }

    const feature = await prisma.pricingFeature.create({
      data: {
        planId,
        text,
        included: included !== undefined ? included : true,
        order: order || 0,
      },
    });

    return NextResponse.json({
      success: true,
      data: feature,
    });
  } catch (error) {
    console.error("Error creating pricing feature:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to create pricing feature";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}

// UPDATE feature
export async function PUT(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (currentUser?.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { id, text, included, order } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Feature ID is required" },
        { status: 400 },
      );
    }

    const updateData: {
      text?: string;
      included?: boolean;
      order?: number;
    } = {};

    if (text !== undefined) updateData.text = text;
    if (included !== undefined) updateData.included = included;
    if (order !== undefined) updateData.order = order;

    const feature = await prisma.pricingFeature.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: feature,
    });
  } catch (error) {
    console.error("Error updating pricing feature:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to update pricing feature";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}

// DELETE feature
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (currentUser?.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Feature ID is required" },
        { status: 400 },
      );
    }

    await prisma.pricingFeature.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Feature deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting pricing feature:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to delete pricing feature";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}
