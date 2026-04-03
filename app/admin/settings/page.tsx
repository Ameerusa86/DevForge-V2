"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Save,
  Bell,
  Shield,
  Palette,
  Globe,
  Mail,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";

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

export default function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      console.error("Error fetching settings:", err);
      setError("Failed to load settings");
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error("Failed to save settings");

      toast.success("Settings saved successfully!");
    } catch (err) {
      console.error("Error saving settings:", err);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!settings) return;

    setTestingEmail(true);
    try {
      const res = await fetch("/api/admin/settings/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings.email),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to send test email");

      toast.success(data.message || "Test email sent successfully!");
    } catch (err) {
      console.error("Error testing email:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to send test email"
      );
    } finally {
      setTestingEmail(false);
    }
  };

  const updateSetting = (
    section: keyof PlatformSettings,
    key: string,
    value: unknown
  ) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [key]: value,
      },
    });
  };

  if (loading) {
    return <LoadingState message="Loading settings..." />;
  }

  if (error || !settings) {
    return (
      <ErrorState
        type="server"
        message={error || "Failed to load settings"}
        onRetry={fetchSettings}
      />
    );
  }
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your platform settings and preferences
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={handleSaveSettings}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="gap-2">
            <Globe className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Information</CardTitle>
              <CardDescription>
                Update your platform&rsquo;s basic information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platform-name">Platform Name</Label>
                <Input
                  id="platform-name"
                  value={settings.general.platformName}
                  onChange={(e) =>
                    updateSetting("general", "platformName", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="platform-description">Description</Label>
                <Textarea
                  id="platform-description"
                  value={settings.general.platformDescription}
                  onChange={(e) =>
                    updateSetting(
                      "general",
                      "platformDescription",
                      e.target.value
                    )
                  }
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-email">Support Email</Label>
                <Input
                  id="support-email"
                  type="email"
                  value={settings.general.supportEmail}
                  onChange={(e) =>
                    updateSetting("general", "supportEmail", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={settings.general.timezone}
                  onValueChange={(value) =>
                    updateSetting("general", "timezone", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utc">UTC</SelectItem>
                    <SelectItem value="est">Eastern Time</SelectItem>
                    <SelectItem value="pst">Pacific Time</SelectItem>
                    <SelectItem value="cet">Central European Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform Features</CardTitle>
              <CardDescription>
                Enable or disable platform features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>User Registration</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow new users to register
                  </p>
                </div>
                <Switch
                  checked={settings.features.userRegistration}
                  onCheckedChange={(checked) =>
                    updateSetting("features", "userRegistration", checked)
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Course Reviews</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable course rating and reviews
                  </p>
                </div>
                <Switch
                  checked={settings.features.courseReviews}
                  onCheckedChange={(checked) =>
                    updateSetting("features", "courseReviews", checked)
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Discussion Forums</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable community discussions
                  </p>
                </div>
                <Switch
                  checked={settings.features.discussionForums}
                  onCheckedChange={(checked) =>
                    updateSetting("features", "discussionForums", checked)
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Certificates</Label>
                  <p className="text-sm text-muted-foreground">
                    Issue certificates upon course completion
                  </p>
                </div>
                <Switch
                  checked={settings.features.certificates}
                  onCheckedChange={(checked) =>
                    updateSetting("features", "certificates", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Configure email notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New User Registration</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when a new user registers
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.newUserRegistration}
                  onCheckedChange={(checked) =>
                    updateSetting(
                      "notifications",
                      "newUserRegistration",
                      checked
                    )
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Course Purchases</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when a course is purchased
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.coursePurchases}
                  onCheckedChange={(checked) =>
                    updateSetting("notifications", "coursePurchases", checked)
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>System Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Critical system notifications
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.systemAlerts}
                  onCheckedChange={(checked) =>
                    updateSetting("notifications", "systemAlerts", checked)
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Reports</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive weekly analytics reports
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.weeklyReports}
                  onCheckedChange={(checked) =>
                    updateSetting("notifications", "weeklyReports", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Options</CardTitle>
              <CardDescription>
                Manage security and authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Require 2FA for admin accounts
                  </p>
                </div>
                <Switch
                  checked={settings.security.twoFactorAuth}
                  onCheckedChange={(checked) =>
                    updateSetting("security", "twoFactorAuth", checked)
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Password Requirements</Label>
                  <p className="text-sm text-muted-foreground">
                    Enforce strong password policy
                  </p>
                </div>
                <Switch
                  checked={settings.security.passwordRequirements}
                  onCheckedChange={(checked) =>
                    updateSetting("security", "passwordRequirements", checked)
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Session Timeout</Label>
                  <p className="text-sm text-muted-foreground">
                    Auto logout after inactivity
                  </p>
                </div>
                <Switch
                  checked={settings.security.sessionTimeout}
                  onCheckedChange={(checked) =>
                    updateSetting("security", "sessionTimeout", checked)
                  }
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="session-duration">
                  Session Duration (minutes)
                </Label>
                <Input
                  id="session-duration"
                  type="number"
                  value={settings.security.sessionDuration}
                  onChange={(e) =>
                    updateSetting(
                      "security",
                      "sessionDuration",
                      parseInt(e.target.value) || 30
                    )
                  }
                  min="5"
                  max="120"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme Settings</CardTitle>
              <CardDescription>
                Customize the look and feel of your platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-theme">Default Theme</Label>
                <Select
                  value={settings.appearance.defaultTheme}
                  onValueChange={(value) =>
                    updateSetting("appearance", "defaultTheme", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary-color"
                    type="color"
                    value={settings.appearance.primaryColor}
                    onChange={(e) =>
                      updateSetting(
                        "appearance",
                        "primaryColor",
                        e.target.value
                      )
                    }
                    className="w-20"
                  />
                  <Input
                    value={settings.appearance.primaryColor}
                    onChange={(e) =>
                      updateSetting(
                        "appearance",
                        "primaryColor",
                        e.target.value
                      )
                    }
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Custom Branding</Label>
                  <p className="text-sm text-muted-foreground">
                    Show custom logo and branding
                  </p>
                </div>
                <Switch
                  checked={settings.appearance.customBranding}
                  onCheckedChange={(checked) =>
                    updateSetting("appearance", "customBranding", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>
                Configure SMTP settings for email delivery
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="smtp-host">SMTP Host</Label>
                <Input
                  id="smtp-host"
                  placeholder="smtp.example.com"
                  value={settings.email.smtpHost}
                  onChange={(e) =>
                    updateSetting("email", "smtpHost", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-port">SMTP Port</Label>
                <Input
                  id="smtp-port"
                  type="number"
                  placeholder="587"
                  value={settings.email.smtpPort}
                  onChange={(e) =>
                    updateSetting(
                      "email",
                      "smtpPort",
                      parseInt(e.target.value) || 587
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-username">Username</Label>
                <Input
                  id="smtp-username"
                  type="email"
                  value={settings.email.smtpUsername}
                  onChange={(e) =>
                    updateSetting("email", "smtpUsername", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-password">Password</Label>
                <Input
                  id="smtp-password"
                  type="password"
                  value={settings.email.smtpPassword}
                  onChange={(e) =>
                    updateSetting("email", "smtpPassword", e.target.value)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Use TLS/SSL</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable secure connection
                  </p>
                </div>
                <Switch
                  checked={settings.email.useTLS}
                  onCheckedChange={(checked) =>
                    updateSetting("email", "useTLS", checked)
                  }
                />
              </div>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleTestEmail}
                disabled={testingEmail}
              >
                {testingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    Test Email Configuration
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
