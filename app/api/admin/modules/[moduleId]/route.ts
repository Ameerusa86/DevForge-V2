import "server-only";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// PATCH /api/admin/modules/[moduleId] - update a module
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> },
) {
  try {
    const { moduleId } = await params;
    const body = await request.json();
    const { title, order, description } = body;

    const moduleItem = await prisma.module.update({
      where: { id: moduleId },
      data: {
        ...(title && { title }),
        ...(order !== undefined && { order: Number(order) }),
        ...(description !== undefined && { description: description || null }),
      },
    });

    return NextResponse.json(moduleItem);
  } catch (error) {
    console.error("Error updating module:", error);
    return NextResponse.json(
      { error: "Failed to update module" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/modules/[moduleId] - delete a module
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> },
) {
  try {
    const { moduleId } = await params;
    await prisma.module.delete({
      where: { id: moduleId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting module:", error);
    return NextResponse.json(
      { error: "Failed to delete module" },
      { status: 500 },
    );
  }
}
