import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const plans = await prisma.pricingPlan.findMany({
      where: { isActive: true },
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
