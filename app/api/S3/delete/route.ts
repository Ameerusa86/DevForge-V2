import "server-only";

import { NextResponse } from "next/server";
import z from "zod";

import { deleteS3Object } from "@/lib/s3-delete";
import { getErrorMessage } from "@/lib/utils";

const deletePayloadSchema = z
  .object({
    key: z.string().optional(),
    url: z.string().url().optional(),
  })
  .refine((payload) => payload.key || payload.url, {
    message: "Provide either `key` or `url`.",
    path: ["key"],
  });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = deletePayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const target = parsed.data.key || parsed.data.url || "";
    const deleted = await deleteS3Object(target);

    if (!deleted) {
      return NextResponse.json(
        { error: "No deletable object found for provided key/url" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = getErrorMessage(error);
    return NextResponse.json(
      { error: "Failed to delete file", details: message },
      { status: 500 }
    );
  }
}
