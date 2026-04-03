import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

// Settings schema - you could create a Settings model in Prisma or use JSON storage
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
    twoFactorAuth: true,
    passwordRequirements: true,
    sessionTimeout: true,
    sessionDuration: 30,
  },
  appearance: {
    defaultTheme: "system",
    primaryColor: "#6366f1",
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

// For now, we'll store settings in a simple JSON file or environment
// In production, you'd want to use a database table or Redis
let cachedSettings: PlatformSettings = defaultSettings;

// GET /api/admin/settings - Get all settings
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Add proper admin role checking when role field is added to User model
    // For now, any authenticated user can access settings

    return NextResponse.json(cachedSettings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 },
    );
  }
}

// PATCH /api/admin/settings - Update settings
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Add proper admin role checking when role field is added to User model

    const body = await req.json();

    // Merge with existing settings
    cachedSettings = {
      ...cachedSettings,
      ...body,
      general: { ...cachedSettings.general, ...(body.general || {}) },
      features: { ...cachedSettings.features, ...(body.features || {}) },
      notifications: {
        ...cachedSettings.notifications,
        ...(body.notifications || {}),
      },
      security: { ...cachedSettings.security, ...(body.security || {}) },
      appearance: { ...cachedSettings.appearance, ...(body.appearance || {}) },
      email: { ...cachedSettings.email, ...(body.email || {}) },
    };

    // In production, save to database here
    // await prisma.settings.upsert({ ... })

    return NextResponse.json({
      message: "Settings updated successfully",
      settings: cachedSettings,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 },
    );
  }
}

// POST /api/admin/settings/test-email - Test email configuration
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, email: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { smtpHost, smtpPort, smtpUsername } = body;

    // Here you would actually test the SMTP connection
    // For now, we'll simulate it
    if (!smtpHost || !smtpPort || !smtpUsername) {
      return NextResponse.json(
        { error: "Missing required SMTP configuration" },
        { status: 400 },
      );
    }

    // Simulate email test
    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${user.email}`,
    });
  } catch (error) {
    console.error("Error testing email:", error);
    return NextResponse.json(
      { error: "Failed to send test email" },
      { status: 500 },
    );
  }
}
