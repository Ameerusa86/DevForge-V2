import "server-only";

import { S3Client } from "@aws-sdk/client-s3";
import { getSupabaseStorageEnv } from "./env";

let s3Client: S3Client | undefined;

export function getS3Client() {
  if (s3Client) {
    return s3Client;
  }

  const storageEnv = getSupabaseStorageEnv();

  s3Client = new S3Client({
    region: storageEnv.SUPABASE_S3_REGION,
    endpoint: storageEnv.SUPABASE_S3_ENDPOINT,
    // Supabase's S3-compatible endpoint expects path-style requests.
    forcePathStyle: true,
    credentials: {
      accessKeyId: storageEnv.SUPABASE_S3_ACCESS_KEY_ID,
      secretAccessKey: storageEnv.SUPABASE_S3_SECRET_ACCESS_KEY,
    },
  });

  // Some S3-compatible endpoints can reject flexible checksums; remove the middleware to avoid
  // adding checksum query params (e.g., x-amz-sdk-checksum-algorithm) that lead to 403.
  s3Client.middlewareStack.remove("flexibleChecksumsMiddleware");

  return s3Client;
}
