import "server-only";

import { S3Client } from "@aws-sdk/client-s3";
import { getAwsEnv } from "./env";

let s3Client: S3Client | undefined;

export function getS3Client() {
  if (s3Client) {
    return s3Client;
  }

  const awsEnv = getAwsEnv();

  s3Client = new S3Client({
    region: awsEnv.AWS_REGION === "auto" ? "us-east-1" : awsEnv.AWS_REGION,
    endpoint: awsEnv.AWS_ENDPOINT_URL_S3,
    forcePathStyle: true, // Tigris works reliably with path-style
    credentials: {
      accessKeyId: awsEnv.AWS_ACCESS_KEY_ID,
      secretAccessKey: awsEnv.AWS_SECRET_ACCESS_KEY,
    },
  });

  // Tigris/S3-compatible endpoints can reject flexible checksums; remove the middleware to avoid
  // adding checksum query params (e.g., x-amz-sdk-checksum-algorithm) that lead to 403.
  s3Client.middlewareStack.remove("flexibleChecksumsMiddleware");

  return s3Client;
}
