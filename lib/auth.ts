import "server-only";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";
import { getAuthEnv } from "./env";

const normalizeUrl = (value: string) => value.trim().replace(/\/+$/, "");

const resolveAuthBaseUrl = () => {
  const explicitServerUrl = process.env.BETTER_AUTH_URL?.trim();
  const explicitClientUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL?.trim();
  const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const vercelDeploymentUrl = process.env.VERCEL_URL?.trim();

  if (process.env.VERCEL === "1") {
    if (process.env.VERCEL_ENV === "production" && vercelProductionUrl) {
      return normalizeUrl(`https://${vercelProductionUrl}`);
    }

    if (explicitServerUrl) {
      return normalizeUrl(explicitServerUrl);
    }

    if (explicitClientUrl) {
      return normalizeUrl(explicitClientUrl);
    }

    if (vercelDeploymentUrl) {
      return normalizeUrl(`https://${vercelDeploymentUrl}`);
    }
  }

  return normalizeUrl(
    explicitServerUrl || explicitClientUrl || getAuthEnv().BETTER_AUTH_URL,
  );
};

type AuthInstance = ReturnType<typeof betterAuth>;

let authInstance: AuthInstance | undefined;

function bindMethod<T extends object>(target: T, value: unknown) {
  return typeof value === "function" ? value.bind(target) : value;
}

export function getAuth() {
  if (authInstance) {
    return authInstance;
  }

  const authEnv = getAuthEnv();
  const authBaseURL = resolveAuthBaseUrl();
  const trustedOrigins = Array.from(
    new Set(
      [
        authBaseURL,
        process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
        process.env.BETTER_AUTH_URL,
        process.env.VERCEL_PROJECT_PRODUCTION_URL
          ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
          : undefined,
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
        "http://localhost:3000",
      ]
        .filter((value): value is string => Boolean(value))
        .map(normalizeUrl),
    ),
  );

  const socialProviders: NonNullable<
    Parameters<typeof betterAuth>[0]["socialProviders"]
  > = {};

  if (
    authEnv.AUTH_GITHUB_CLIENT_ID &&
    authEnv.AUTH_GITHUB_CLIENT_SECRET
  ) {
    socialProviders.github = {
      clientId: authEnv.AUTH_GITHUB_CLIENT_ID,
      clientSecret: authEnv.AUTH_GITHUB_CLIENT_SECRET,
      redirectURI: `${authBaseURL}/api/auth/callback/github`,
    };
  }

  if (
    authEnv.AUTH_GOOGLE_CLIENT_ID &&
    authEnv.AUTH_GOOGLE_CLIENT_SECRET
  ) {
    socialProviders.google = {
      clientId: authEnv.AUTH_GOOGLE_CLIENT_ID,
      clientSecret: authEnv.AUTH_GOOGLE_CLIENT_SECRET,
      redirectURI: `${authBaseURL}/api/auth/callback/google`,
    };
  }

  authInstance = betterAuth({
    secret: authEnv.BETTER_AUTH_SECRET,
    baseURL: authBaseURL,
    trustedOrigins,
    database: prismaAdapter(prisma, {
      provider: "postgresql", // or "mysql", "postgresql", ...etc
    }),
    emailAndPassword: { enabled: true },
    session: {
      expiresIn: 30 * 24 * 60 * 60, // 30 days
    },
    advanced: {
      useSecureCookies: process.env.NODE_ENV === "production",
      crossSubDomainCookies: {
        enabled: false,
      },
    },
    databaseHooks: {
      session: {
        create: {
          before: async (session) => {
            const userId = (session as { userId?: string }).userId;
            if (!userId) return;

            const user = await prisma.user.findUnique({
              where: { id: userId },
              select: { status: true, email: true, name: true },
            });

            if (user?.status === "SUSPENDED") {
              // Optional: notify admins of blocked login attempt
              const admins = await prisma.user.findMany({
                where: { role: "ADMIN" },
                select: { id: true },
              });
              if (admins.length > 0) {
                await prisma.notification.createMany({
                  data: admins.map((a) => ({
                    userId: a.id,
                    type: "ADMIN_ALERT",
                    title: "Suspended user login attempt",
                    message: `${user.name || "A user"} (${
                      user.email || userId
                    }) attempted to sign in but is suspended.`,
                    actionUrl: "/admin/users",
                  })),
                });
              }

              throw new APIError("FORBIDDEN", {
                message:
                  "YOUR_ACCOUNT_IS_SUSPENDED_PLEASE_CONTACT_AN_ADMINISTRATOR",
              });
            }
          },
        },
      },
    },
    socialProviders,
  });

  return authInstance;
}

export const auth = new Proxy({} as AuthInstance, {
  get(_target, prop, receiver) {
    return bindMethod(getAuth(), Reflect.get(getAuth(), prop, receiver));
  },
});
