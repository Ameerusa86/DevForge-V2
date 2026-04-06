import "server-only";

import { DeleteObjectCommand } from "@aws-sdk/client-s3";

import { getSupabaseStorageEnv } from "./env";
import { getS3Client } from "./S3Clinet";
import { getS3KeyFromUrl } from "./s3-utils";

/**
 * Deletes an object from the configured Supabase storage bucket. Returns true when a
 * delete was attempted against our bucket; false when the provided value is not
 * a bucket key/URL or when deletion fails.
 */
export async function deleteS3Object(keyOrUrl: string): Promise<boolean> {
  const key = getS3KeyFromUrl(keyOrUrl);
  if (!key) return false;

  try {
    const storageEnv = getSupabaseStorageEnv();
    const command = new DeleteObjectCommand({
      Bucket: storageEnv.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET,
      Key: key,
    });

    await getS3Client().send(command);
    return true;
  } catch (error) {
    console.error("Failed to delete S3 object", { key, error });
    return false;
  }
}
