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

const supabaseStorageEnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_S3_ENDPOINT: z.string().url(),
  SUPABASE_S3_REGION: z.string().min(1),
  SUPABASE_S3_ACCESS_KEY_ID: z.string().min(1),
  SUPABASE_S3_SECRET_ACCESS_KEY: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET: z.string().min(1),
});

type AuthEnv = z.infer<typeof authEnvSchema>;
type SupabaseStorageEnv = z.infer<typeof supabaseStorageEnvSchema>;

let authEnvCache: AuthEnv | undefined;
let supabaseStorageEnvCache: SupabaseStorageEnv | undefined;

function parseEnv<T>(
  schema: z.ZodSchema<T>,
  values: Record<string, unknown>,
  name: string,
): T {
  const parsed = schema.safeParse(values);

  if (!parsed.success) {
    console.error(
      `Invalid ${name} environment variables:`,
      parsed.error.flatten().fieldErrors,
    );
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

export function getSupabaseStorageEnv(): SupabaseStorageEnv {
  supabaseStorageEnvCache ??= parseEnv(
    supabaseStorageEnvSchema,
    {
      SUPABASE_URL: process.env.SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_URL:
        process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
      SUPABASE_S3_ENDPOINT:
        process.env.SUPABASE_S3_ENDPOINT &&
        process.env.SUPABASE_S3_ENDPOINT.length > 0
          ? process.env.SUPABASE_S3_ENDPOINT
          : process.env.SUPABASE_URL
            ? `${process.env.SUPABASE_URL.replace(/\/+$/, "")}/storage/v1/s3`
            : undefined,
      SUPABASE_S3_REGION: process.env.SUPABASE_S3_REGION || "us-east-1",
      SUPABASE_S3_ACCESS_KEY_ID: process.env.SUPABASE_S3_ACCESS_KEY_ID,
      SUPABASE_S3_SECRET_ACCESS_KEY: process.env.SUPABASE_S3_SECRET_ACCESS_KEY,
      NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET:
        process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET,
    },
    "supabase storage",
  );

  return supabaseStorageEnvCache;
}
