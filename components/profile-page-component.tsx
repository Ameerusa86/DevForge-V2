"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import {
  Bell,
  BookOpen,
  Loader2,
  Save,
  Shield,
  Star,
  Upload,
  UserRound,
  Sparkles,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { LearnerShell } from "@/components/lms/learner-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type TabKey = "profile" | "history" | "reviews" | "settings";

interface ProfileResponse {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    createdAt: string;
    mustChangePassword?: boolean;
  };
  stats: {
    totalEnrollments: number;
    completedCourses: number;
    totalReviews: number;
    averageProgress: number;
  };
  enrollments: Array<{
    id: string;
    progress: number;
    createdAt: string;
    lastAccessedAt?: string | null;
    course: {
      title: string;
      slug: string;
    };
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    course: {
      title: string;
      slug: string;
    };
  }>;
}

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "profile", label: "Profile Details" },
  { key: "history", label: "Learning History" },
  { key: "reviews", label: "My Reviews" },
  { key: "settings", label: "Preferences" },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ProfilePageComponent() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    image: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const shouldRedirectToLogin = !isPending && !session?.user;

  useEffect(() => {
    if (shouldRedirectToLogin) {
      router.replace("/login");
    }
  }, [router, shouldRedirectToLogin]);

  useEffect(() => {
    if (!session?.user) return;

    const fetchProfile = async () => {
      setLoadingProfile(true);
      try {
        const response = await fetch("/api/profile", { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to load profile");

        const data: ProfileResponse = await response.json();
        setProfileData(data);
        setFormData({
          name: data.user.name || "",
          email: data.user.email || "",
          image: data.user.image || "",
        });
      } catch (error) {
        console.error("Profile load error", error);
        toast.error("Failed to load profile data.");
      } finally {
        setLoadingProfile(false);
      }
    };

    void fetchProfile();
  }, [session?.user]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleUpdateProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.name.trim()) {
      return toast.error("Full name is required.");
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          image: formData.image || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || "Failed to update profile");
      }

      setProfileData((previous) =>
        previous
          ? {
              ...previous,
              user: {
                ...previous.user,
                name: formData.name.trim(),
                image: formData.image || null,
              },
            }
          : previous
      );

      toast.success("Profile saved successfully.");
    } catch (error) {
      console.error("Profile update error", error);
      toast.error("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Select an image file.");
    if (file.size > 5 * 1024 * 1024) {
      return toast.error("Image must be less than 5MB.");
    }

    setIsUploadingAvatar(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("isImage", "true");

      const uploadResponse = await fetch("/api/S3/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || "Failed to upload image");
      }

      const { publicUrl } = await uploadResponse.json();

      setFormData((previous) => ({ ...previous, image: publicUrl }));
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name, image: publicUrl }),
      });
      setProfileData((previous) =>
        previous
          ? { ...previous, user: { ...previous.user, image: publicUrl } }
          : previous,
      );
      toast.success("Avatar updated successfully.");
    } catch (error) {
      console.error("Avatar upload error", error);
      toast.error("Failed to upload avatar.");
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (shouldRedirectToLogin || isPending || loadingProfile || !profileData) {
    return (
      <LearnerShell pageTitle="Profile & Settings" pageDescription="Loading account settings...">
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-[#ff6636]" />
        </div>
      </LearnerShell>
    );
  }

  return (
    <LearnerShell
      pageTitle="Profile & Settings"
      pageDescription="Manage your developer profile, learning history, and security"
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 space-y-8">
        
        {/* ── 1. Hero Overview & Stats Strip ────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/40 p-6 sm:p-8 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-center">
            
            {/* Left: Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ff6636]/30 bg-[#ff6636]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#ff6636]">
                  <UserRound className="size-3.5" /> Learner Profile
                </span>
                <span className="rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
                  Member since {format(new Date(profileData.user.createdAt), "MMM yyyy")}
                </span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  {profileData.user.name}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">
                  {profileData.user.email}
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-1">
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground">
                  <BookOpen className="size-3.5 text-[#ff6636]" />
                  {profileData.stats.totalEnrollments} Enrolled Path{profileData.stats.totalEnrollments !== 1 && "s"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground">
                  <Sparkles className="size-3.5 text-emerald-500" />
                  {profileData.stats.completedCourses} Completed
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground">
                  <Star className="size-3.5 text-amber-500" />
                  {profileData.stats.totalReviews} Reviews
                </span>
              </div>
            </div>

            {/* Right: Avatar Card */}
            <div className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4 shadow-2xs">
              <Avatar className="size-16 border border-border/80 shrink-0">
                <AvatarImage src={formData.image || undefined} className="object-cover" />
                <AvatarFallback className="bg-[#ff6636]/10 text-xl font-bold text-[#ff6636]">
                  {getInitials(profileData.user.name || "U")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Average Completion
                </p>
                <p className="text-2xl font-extrabold text-[#ff6636] mt-0.5">
                  {profileData.stats.averageProgress}%
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-medium truncate">
                  Across all active modules
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* ── 2. Tabs Switcher ─────────────────────────────────────────────────── */}
        <div className="space-y-6">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border w-fit">
            {tabs.map((tab) => {
              const isActive = tab.key === activeTab;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all",
                    isActive
                      ? "bg-card text-[#ff6636] shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ── Tab 1: Profile Details ─────────────────────────────────────────── */}
          {activeTab === "profile" && (
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6">
              <div className="border-b border-border pb-4">
                <h3 className="text-base font-bold text-foreground">Personal Information</h3>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  Update your public name and display avatar
                </p>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-2xl">
                {/* Avatar Row */}
                <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-muted/20 p-4">
                  <Avatar className="size-14 border border-border">
                    <AvatarImage src={formData.image || undefined} className="object-cover" />
                    <AvatarFallback className="bg-[#ff6636]/10 text-base font-bold text-[#ff6636]">
                      {getInitials(profileData.user.name || "U")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground">Profile Picture</p>
                    <p className="text-[10px] text-muted-foreground">PNG, JPG or WEBP up to 5MB.</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={isUploadingAvatar}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="rounded-xl text-xs font-bold shrink-0"
                  >
                    {isUploadingAvatar ? (
                      <><Loader2 className="size-3.5 animate-spin mr-1.5" /> Uploading</>
                    ) : (
                      <><Upload className="size-3.5 mr-1.5" /> Change Photo</>
                    )}
                  </Button>
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Full Name</label>
                  <input
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your full name"
                    required
                    className="h-10 w-full rounded-xl border border-border bg-background px-3.5 text-xs font-medium text-foreground focus:border-[#ff6636]/60 focus:outline-none focus:ring-1 focus:ring-[#ff6636]/20"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Email Address</label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="h-10 w-full rounded-xl border border-border/80 bg-muted/40 px-3.5 text-xs font-medium text-muted-foreground cursor-not-allowed"
                  />
                </div>

                {/* Submit */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] text-white text-xs font-bold px-5 py-2 shadow-xs"
                  >
                    {isSaving ? (
                      <><Loader2 className="mr-1.5 size-3.5 animate-spin" /> Saving</>
                    ) : (
                      <><Save className="mr-1.5 size-3.5" /> Save Changes</>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* ── Tab 2: Learning History ───────────────────────────────────────── */}
          {activeTab === "history" && (
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6">
              <div className="border-b border-border pb-4">
                <h3 className="text-base font-bold text-foreground">Learning History</h3>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  Timeline of your course progression and completions
                </p>
              </div>

              {profileData.enrollments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-10 text-center space-y-2">
                  <BookOpen className="size-8 text-muted-foreground/50 mx-auto" />
                  <p className="text-xs font-bold text-foreground">No enrolled courses yet</p>
                  <p className="text-xs text-muted-foreground">Start a course from the catalog to build your history.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {profileData.enrollments.map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="rounded-xl border border-border bg-muted/20 p-4 space-y-3 hover:border-[#ff6636]/30 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <Link
                            href={`/courses/${enrollment.course.slug}`}
                            className="text-xs font-bold text-foreground hover:text-[#ff6636] transition-colors"
                          >
                            {enrollment.course.title}
                          </Link>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Enrolled {formatDistanceToNow(new Date(enrollment.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                            enrollment.progress === 100
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-[#ff6636]/10 text-[#ff6636]"
                          )}
                        >
                          {enrollment.progress === 100 ? "✓ Completed" : `${enrollment.progress}% In Progress`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Tab 3: My Reviews ─────────────────────────────────────────────── */}
          {activeTab === "reviews" && (
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6">
              <div className="border-b border-border pb-4">
                <h3 className="text-base font-bold text-foreground">Course Reviews & Feedback</h3>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  Reviews you have submitted for completed courses
                </p>
              </div>

              {profileData.reviews.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-10 text-center space-y-2">
                  <Star className="size-8 text-muted-foreground/50 mx-auto" />
                  <p className="text-xs font-bold text-foreground">No reviews submitted yet</p>
                  <p className="text-xs text-muted-foreground">Complete a course to leave feedback and ratings.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {profileData.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="rounded-xl border border-border bg-muted/20 p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <Link
                          href={`/courses/${review.course.slug}`}
                          className="text-xs font-bold text-foreground hover:text-[#ff6636] transition-colors"
                        >
                          {review.course.title}
                        </Link>
                        <StarRating rating={review.rating} size="sm" />
                      </div>
                      <p className="text-xs text-muted-foreground font-medium leading-relaxed bg-card/60 p-3 rounded-lg border border-border/50">
                        {review.comment || "Rated without written comment."}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Tab 4: Preferences & Security ─────────────────────────────────── */}
          {activeTab === "settings" && (
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center gap-3 border-b border-border pb-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-[#ff6636]/10 text-[#ff6636]">
                    <Bell className="size-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Notifications</h4>
                    <p className="text-[10px] text-muted-foreground">Alerts and updates</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  System notifications are active. Email digests and Discord integrations are currently configured automatically.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center gap-3 border-b border-border pb-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
                    <Shield className="size-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Security</h4>
                    <p className="text-[10px] text-muted-foreground">Password & Sessions</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Password changes and session tokens are protected by Better Auth encrypted credentials.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>
    </LearnerShell>
  );
}
