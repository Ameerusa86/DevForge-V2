import "server-only";
import { getSupabaseStorageEnv } from "@/lib/env";
import { getErrorMessage } from "@/lib/utils";
import { getS3Client } from "@/lib/S3Clinet";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import z from "zod";
import { NextResponse } from "next/server";

export const fileUploadSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  contentType: z.string().min(1, "Content type is required"),
  isImage: z.boolean(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = fileUploadSchema.safeParse(body);

    if (!validation.success) {
      return new Response(JSON.stringify(validation.error), { status: 400 });
    }

    const { fileName, contentType } = validation.data;
    const storageEnv = getSupabaseStorageEnv();

    // Prefix the filename with a UUID to avoid collisions when names repeat.
    const uniqueKey = `${uuidv4()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: storageEnv.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET,
      Key: uniqueKey,
      ContentType: contentType,
    });

    const preSignedUrl = await getSignedUrl(getS3Client(), command, {
      expiresIn: 3600,
    });

    const publicUrl = `${storageEnv.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, "")}/storage/v1/object/public/${storageEnv.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET}/${uniqueKey}`;
    const response = {
      url: preSignedUrl,
      key: uniqueKey,
      publicUrl,
    };
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error during file upload:", error);
    const errorMessage = getErrorMessage(error);
    return NextResponse.json(
      { error: "File upload failed", details: errorMessage },
      { status: 500 },
    );
  }
}
