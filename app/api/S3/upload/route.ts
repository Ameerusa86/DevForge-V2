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
  isImage: z.boolean().optional().default(false),
});

export async function POST(req: Request) {
  try {
    const contentTypeHeader = req.headers.get("content-type") || "";

    // 1. Handle multipart/form-data (direct server-side upload)
    if (contentTypeHeader.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { error: "No file provided in form data" },
          { status: 400 },
        );
      }

      const fileName = file.name;
      const fileType = file.type;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const storageEnv = getSupabaseStorageEnv();
      const uniqueKey = `${uuidv4()}-${fileName}`;

      const command = new PutObjectCommand({
        Bucket: storageEnv.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET,
        Key: uniqueKey,
        ContentType: fileType,
        Body: buffer,
      });

      await getS3Client().send(command);

      const publicUrl = `${storageEnv.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, "")}/storage/v1/object/public/${storageEnv.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET}/${uniqueKey}`;

      return NextResponse.json({
        url: publicUrl,
        preSignedUrl: publicUrl,
        key: uniqueKey,
        publicUrl,
      }, { status: 200 });
    }

    // 2. Handle application/json (presigned URL generation)
    const body = await req.json();
    const validation = fileUploadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(validation.error.format(), { status: 400 });
    }

    const { fileName, contentType } = validation.data;
    const storageEnv = getSupabaseStorageEnv();
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

    return NextResponse.json({
      url: preSignedUrl,
      preSignedUrl: preSignedUrl, // Keep both for backward compatibility
      key: uniqueKey,
      publicUrl,
    }, { status: 200 });
  } catch (error) {
    console.error("Error during file upload:", error);
    const errorMessage = getErrorMessage(error);
    return NextResponse.json(
      { error: "File upload failed", details: errorMessage },
      { status: 500 },
    );
  }
}
