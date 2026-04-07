import "server-only";

import { GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { getS3Client } from "@/lib/S3Clinet";
import { getSupabaseStorageEnv } from "@/lib/env";
import { getS3KeyFromUrl } from "@/lib/s3-utils";

function resolveStorageKey(keyOrUrl: string): string | null {
  if (!keyOrUrl || keyOrUrl.startsWith("data:")) {
    return null;
  }

  return getS3KeyFromUrl(keyOrUrl);
}

export async function getStorageImage(keyOrUrl: string) {
  const key = resolveStorageKey(keyOrUrl);

  if (!key) {
    return null;
  }

  const storageEnv = getSupabaseStorageEnv();
  const signedUrl = await getSignedUrl(
    getS3Client(),
    new GetObjectCommand({
      Bucket: storageEnv.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET,
      Key: key,
    }),
    { expiresIn: 3600 },
  );

  const response = await fetch(signedUrl, { cache: "no-store" });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(
      `Failed to fetch storage image: ${response.status}${details ? ` - ${details}` : ""}`,
    );
  }

  const bytes = new Uint8Array(await response.arrayBuffer());

  return {
    key,
    bytes,
    contentType: response.headers.get("content-type") || "image/jpeg",
    contentLength: response.headers.get("content-length") || undefined,
    eTag: response.headers.get("etag") || undefined,
    lastModified: response.headers.get("last-modified") || undefined,
  };
}

export async function headStorageImage(keyOrUrl: string) {
  const key = resolveStorageKey(keyOrUrl);

  if (!key) {
    return null;
  }

  const storageEnv = getSupabaseStorageEnv();
  const signedUrl = await getSignedUrl(
    getS3Client(),
    new HeadObjectCommand({
      Bucket: storageEnv.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET,
      Key: key,
    }),
    { expiresIn: 3600 },
  );

  const response = await fetch(signedUrl, {
    method: "HEAD",
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(
      `Failed to fetch storage image metadata: ${response.status}${details ? ` - ${details}` : ""}`,
    );
  }

  return {
    key,
    contentType: response.headers.get("content-type") || "image/jpeg",
    contentLength: response.headers.get("content-length") || undefined,
    eTag: response.headers.get("etag") || undefined,
    lastModified: response.headers.get("last-modified") || undefined,
  };
}
