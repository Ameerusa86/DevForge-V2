"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const EXCLUDED_PATHS = [
  "/login",
  "/register",
  "/suspended",
  "/auth-error",
  "/update-password",
];

export function PasswordChangeGuard() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!pathname || EXCLUDED_PATHS.some((p) => pathname.startsWith(p))) {
      return;
    }

    const check = async () => {
      try {
        const res = await fetch("/api/profile", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.user?.mustChangePassword) {
          router.replace("/update-password");
        }
      } catch {
        // Ignore
      }
    };

    check();
  }, [pathname, router]);

  return null;
}
