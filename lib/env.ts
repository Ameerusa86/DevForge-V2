import "server-only";
import { z } from "zod";

const authEnvSchema = z
  .object({
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
    AUTH_GITHUB_CLIENT_ID: z.string().min(1).optional(),
    AUTH_GITHUB_CLIENT_SECRET: z.string().min(1).optional(),
    AUTH_GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    AUTH_GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    if (
      Boolean(value.AUTH_GITHUB_CLIENT_ID) !==
      Boolean(value.AUTH_GITHUB_CLIENT_SECRET)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "AUTH_GITHUB_CLIENT_ID and AUTH_GITHUB_CLIENT_SECRET must both be set.",
        path: ["AUTH_GITHUB_CLIENT_ID"],
      });
    }

    if (
      Boolean(value.AUTH_GOOGLE_CLIENT_ID) !==
      Boolean(value.AUTH_GOOGLE_CLIENT_SECRET)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "AUTH_GOOGLE_CLIENT_ID and AUTH_GOOGLE_CLIENT_SECRET must both be set.",
        path: ["AUTH_GOOGLE_CLIENT_ID"],
      });
    }
  });

const awsEnvSchema = z.object({
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_ENDPOINT_URL_S3: z.string().min(1),
  AWS_REGION: z.string().min(1),
  NEXT_PUBLIC_AWS_BUCKET_NAME: z.string().min(1),
});

type AuthEnv = z.infer<typeof authEnvSchema>;
type AwsEnv = z.infer<typeof awsEnvSchema>;

let authEnvCache: AuthEnv | undefined;
let awsEnvCache: AwsEnv | undefined;

function parseEnv<T>(schema: z.ZodSchema<T>, values: Record<string, unknown>, name: string): T {
  const parsed = schema.safeParse(values);

  if (!parsed.success) {
    console.error(`Invalid ${name} environment variables:`, parsed.error.flatten().fieldErrors);
    throw new Error(`Invalid ${name} environment variables`);
  }

  return parsed.data;
}

export function getAuthEnv(): AuthEnv {
  authEnvCache ??= parseEnv(
    authEnvSchema,
    {
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
      AUTH_GITHUB_CLIENT_ID: process.env.AUTH_GITHUB_CLIENT_ID,
      AUTH_GITHUB_CLIENT_SECRET: process.env.AUTH_GITHUB_CLIENT_SECRET,
      AUTH_GOOGLE_CLIENT_ID: process.env.AUTH_GOOGLE_CLIENT_ID,
      AUTH_GOOGLE_CLIENT_SECRET: process.env.AUTH_GOOGLE_CLIENT_SECRET,
    },
    "auth",
  );

  return authEnvCache;
}

export function getAwsEnv(): AwsEnv {
  awsEnvCache ??= parseEnv(
    awsEnvSchema,
    {
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
      AWS_ENDPOINT_URL_S3: process.env.AWS_ENDPOINT_URL_S3,
      AWS_REGION: process.env.AWS_REGION,
      NEXT_PUBLIC_AWS_BUCKET_NAME: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME,
    },
    "aws",
  );

  return awsEnvCache;
}
