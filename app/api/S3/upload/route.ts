import "server-only";
import { env } from "@/lib/env";
import { getErrorMessage } from "@/lib/utils";
import { S3 } from "@/lib/S3Clinet";
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

    // Prefix the filename with a UUID to avoid collisions when names repeat.
    const uniqueKey = `${uuidv4()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: env.NEXT_PUBLIC_AWS_BUCKET_NAME,
      Key: uniqueKey,
      ContentType: contentType,
      // Make uploaded objects publicly readable so previews work without bucket-wide ACL changes.
      ACL: "public-read",
    });

    const preSignedUrl = await getSignedUrl(S3, command, {
      expiresIn: 3600,
    });

    // Use virtual-hosted URL style (path-style is deprecated for new buckets on Tigris).
    const publicUrl = `https://${env.NEXT_PUBLIC_AWS_BUCKET_NAME}.t3.storage.dev/${uniqueKey}`;
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
      { status: 500 }
    );
  }
}
