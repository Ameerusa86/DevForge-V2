import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

// Settings schema
interface PlatformSettings {
  general: {
    platformName: string;
    platformDescription: string;
    supportEmail: string;
    timezone: string;
  };
  features: {
    userRegistration: boolean;
    courseReviews: boolean;
    discussionForums: boolean;
    certificates: boolean;
  };
  notifications: {
    newUserRegistration: boolean;
    coursePurchases: boolean;
    systemAlerts: boolean;
    weeklyReports: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    passwordRequirements: boolean;
    sessionTimeout: boolean;
    sessionDuration: number;
  };
  appearance: {
    defaultTheme: string;
    primaryColor: string;
    customBranding: boolean;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUsername: string;
    smtpPassword: string;
    useTLS: boolean;
  };
}

// Default settings
const defaultSettings: PlatformSettings = {
  general: {
    platformName: "DevForge",
    platformDescription: "Empowering learners worldwide with quality education",
    supportEmail: "support@devforge.com",
    timezone: "utc",
  },
  features: {
    userRegistration: true,
    courseReviews: true,
    discussionForums: true,
    certificates: true,
  },
  notifications: {
    newUserRegistration: true,
    coursePurchases: true,
    systemAlerts: true,
    weeklyReports: false,
  },
  security: {
    twoFactorAuth: false,
    passwordRequirements: true,
    sessionTimeout: true,
    sessionDuration: 30,
  },
  appearance: {
    defaultTheme: "dark",
    primaryColor: "#ff6636",
    customBranding: true,
  },
  email: {
    smtpHost: "",
    smtpPort: 587,
    smtpUsername: "",
    smtpPassword: "",
    useTLS: true,
  },
};

// GET /api/admin/settings - Get all settings (from DB)
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin privileges required" },
        { status: 403 }
      );
    }

    const record = await prisma.platformSetting.findUnique({
      where: { id: "default" },
    });

    if (!record) {
      return NextResponse.json(defaultSettings);
    }

    const dbSettings = record.settings as Record<string, any>;
    const merged: PlatformSettings = {
      general: { ...defaultSettings.general, ...(dbSettings.general || {}) },
      features: { ...defaultSettings.features, ...(dbSettings.features || {}) },
      notifications: { ...defaultSettings.notifications, ...(dbSettings.notifications || {}) },
      security: { ...defaultSettings.security, ...(dbSettings.security || {}) },
      appearance: { ...defaultSettings.appearance, ...(dbSettings.appearance || {}) },
      email: { ...defaultSettings.email, ...(dbSettings.email || {}) },
    };

    return NextResponse.json(merged);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 },
    );
  }
}

// PATCH /api/admin/settings - Update settings (persist to DB)
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin privileges required" },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Fetch existing or fallback to default
    const existingRecord = await prisma.platformSetting.findUnique({
      where: { id: "default" },
    });
    const current = (existingRecord?.settings as Record<string, any>) || defaultSettings;

    const updatedSettings: PlatformSettings = {
      general: { ...current.general, ...(body.general || {}) },
      features: { ...current.features, ...(body.features || {}) },
      notifications: { ...current.notifications, ...(body.notifications || {}) },
      security: { ...current.security, ...(body.security || {}) },
      appearance: { ...current.appearance, ...(body.appearance || {}) },
      email: { ...current.email, ...(body.email || {}) },
    };

    await prisma.platformSetting.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        settings: updatedSettings as any,
      },
      update: {
        settings: updatedSettings as any,
      },
    });

    return NextResponse.json({
      message: "Settings updated successfully",
      settings: updatedSettings,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 },
    );
  }
}
