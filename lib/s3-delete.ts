import "server-only";

import { DeleteObjectCommand } from "@aws-sdk/client-s3";

import { getAwsEnv } from "./env";
import { getS3Client } from "./S3Clinet";
import { getS3KeyFromUrl } from "./s3-utils";

/**
 * Deletes an object from the configured S3/Tigris bucket. Returns true when a
 * delete was attempted against our bucket; false when the provided value is not
 * a bucket key/URL or when deletion fails.
 */
export async function deleteS3Object(keyOrUrl: string): Promise<boolean> {
  const key = getS3KeyFromUrl(keyOrUrl);
  if (!key) return false;

  try {
    const awsEnv = getAwsEnv();
    const command = new DeleteObjectCommand({
      Bucket: awsEnv.NEXT_PUBLIC_AWS_BUCKET_NAME,
      Key: key,
    });

    await getS3Client().send(command);
    return true;
  } catch (error) {
    console.error("Failed to delete S3 object", { key, error });
    return false;
  }
}
