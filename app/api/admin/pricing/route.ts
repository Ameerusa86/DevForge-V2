import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET all pricing plans
export async function GET() {
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

    const plans = await prisma.pricingPlan.findMany({
      include: {
        features: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error("Error fetching pricing plans:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch pricing plans" },
      { status: 500 },
    );
  }
}

// CREATE new pricing plan
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
    const {
      name,
      description,
      price,
      billingPeriod,
      currency,
      isPopular,
      isActive,
      order,
      buttonText,
      buttonLink,
    } = body;

    console.log("Creating pricing plan with data:", {
      name,
      description,
      price,
      billingPeriod,
      currency,
      isPopular,
      isActive,
      order,
      buttonText,
      buttonLink,
    });

    if (!name || price === undefined || !billingPeriod) {
      return NextResponse.json(
        {
          success: false,
          error: "Name, price, and billing period are required",
        },
        { status: 400 },
      );
    }

    const plan = await prisma.pricingPlan.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        billingPeriod,
        currency: currency || "USD",
        isPopular: isPopular || false,
        isActive: isActive !== undefined ? isActive : true,
        order: order || 0,
        buttonText: buttonText || "Get Started",
        buttonLink,
      },
      include: {
        features: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error("Error creating pricing plan:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create pricing plan";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}

// UPDATE pricing plan
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
    const {
      id,
      name,
      description,
      price,
      billingPeriod,
      currency,
      isPopular,
      isActive,
      order,
      buttonText,
      buttonLink,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Plan ID is required" },
        { status: 400 },
      );
    }

    const updateData: {
      name?: string;
      description?: string | null;
      price?: number;
      billingPeriod?: string;
      currency?: string;
      isPopular?: boolean;
      isActive?: boolean;
      order?: number;
      buttonText?: string;
      buttonLink?: string | null;
    } = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (billingPeriod !== undefined) updateData.billingPeriod = billingPeriod;
    if (currency !== undefined) updateData.currency = currency;
    if (isPopular !== undefined) updateData.isPopular = isPopular;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (order !== undefined) updateData.order = order;
    if (buttonText !== undefined) updateData.buttonText = buttonText;
    if (buttonLink !== undefined) updateData.buttonLink = buttonLink;

    const plan = await prisma.pricingPlan.update({
      where: { id },
      data: updateData,
      include: {
        features: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error("Error updating pricing plan:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update pricing plan";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}

// DELETE pricing plan
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
        { success: false, error: "Plan ID is required" },
        { status: 400 },
      );
    }

    await prisma.pricingPlan.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Pricing plan deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting pricing plan:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete pricing plan";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}
