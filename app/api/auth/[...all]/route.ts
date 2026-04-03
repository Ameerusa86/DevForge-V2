import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";
import "server-only";

const handler = toNextJsHandler(auth);

type AuthErrorLike = {
  code?: string;
  message?: string;
};

const isSuspended = (code?: string, message?: string) =>
  code === "FORBIDDEN" ||
  code === "YOUR_ACCOUNT_IS_SUSPENDED_PLEASE_CONTACT_AN_ADMINISTRATOR" ||
  (message || "").toLowerCase().includes("suspended");

export async function POST(request: NextRequest) {
  try {
    return await handler.POST(request);
  } catch (error: unknown) {
    const err = error as AuthErrorLike;
    if (isSuspended(err.code, err.message)) {
      return NextResponse.redirect(
        new URL(
          `/auth-error?error=FORBIDDEN&message=${encodeURIComponent(
            "Your account is suspended. Please contact an administrator.",
          )}`,
          request.url,
        ),
      );
    }
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    if (url.pathname.endsWith("/api/auth/error")) {
      const error = url.searchParams.get("error") || "UNKNOWN";
      const message = url.searchParams.get("message") || "";

      if (isSuspended(error, message)) {
        return NextResponse.redirect(new URL("/suspended", request.url));
      }

      return NextResponse.redirect(
        new URL(
          `/auth-error?error=${encodeURIComponent(error)}&message=${encodeURIComponent(message)}`,
          request.url,
        ),
      );
    }

    const response = await handler.GET(request);

    const isCallback = request.url.includes("/api/auth/callback/");
    const location = response.headers.get("location");

    // Successful OAuth callback commonly returns a redirect (302/307) with no body.
    // Do NOT treat this as an error even if content-type is application/json.
    if (isCallback && location && !location.includes("/api/auth/error")) {
      return response;
    }

    if (isCallback) {
      console.error("Auth callback response", {
        status: response.status,
        location,
        contentType: response.headers.get("content-type"),
      });
    }
    if (location && location.includes("/api/auth/error")) {
      const redirectUrl = new URL(location, request.url);
      const error = redirectUrl.searchParams.get("error") || "UNKNOWN";
      const message = redirectUrl.searchParams.get("message") || "";

      console.error("Auth error redirect", {
        location,
        error,
        message,
      });

      if (isSuspended(error, message)) {
        return NextResponse.redirect(new URL("/suspended", request.url));
      }

      return NextResponse.redirect(
        new URL(
          `/auth-error?error=${encodeURIComponent(error)}&message=${encodeURIComponent(message)}`,
          request.url,
        ),
      );
    }

    const contentType = response.headers.get("content-type") || "";
    if (isCallback && !location && contentType.includes("application/json")) {
      try {
        const data = (await response.clone().json()) as {
          code?: string;
          message?: string;
        };
        const code = (data?.code || "").toString();
        const message = (data?.message || "").toString();

        console.error("Auth callback JSON error", { code, message, data });

        if (isSuspended(code, message)) {
          return NextResponse.redirect(new URL("/suspended", request.url));
        }

        return NextResponse.redirect(
          new URL(
            `/auth-error?error=${encodeURIComponent(code || "UNKNOWN")}&message=${encodeURIComponent(message || "Authentication failed")}`,
            request.url,
          ),
        );
      } catch {
        // If Better Auth returns an empty body here, treat it as a generic failure.
        return NextResponse.redirect(new URL("/auth-error", request.url));
      }
    }

    return response;
  } catch (error: unknown) {
    console.error("Auth GET error:", error);

    const err = error as AuthErrorLike;
    if (isSuspended(err.code, err.message)) {
      return NextResponse.redirect(new URL("/suspended", request.url));
    }

    if (request.url.includes("/callback/")) {
      return NextResponse.redirect(
        new URL(
          `/auth-error?error=${encodeURIComponent(err.code || "UNKNOWN")}&message=${encodeURIComponent(err.message || "Authentication failed")}`,
          request.url,
        ),
      );
    }

    throw error;
  }
}
