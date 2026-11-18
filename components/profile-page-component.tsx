"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { format, formatDistanceToNow } from "date-fns";
import {
  Award,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Laptop,
  Loader2,
  Mail,
  Moon,
  Pencil,
  Play,
  RotateCcw,
  Save,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import {
  LearnerPageShell,
  LearnerWorkspaceNav,
} from "@/components/lms/learner-workspace-nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/ui/star-rating";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import {
  formatCourseLevel,
  formatDuration,
  getCategoryMeta,
  getInitials,
  getLevelBadgeClass,
} from "@/lib/learner-ui";
import { getProxiedImageUrl } from "@/lib/s3-utils";
import { cn } from "@/lib/utils";

type TabKey = "profile" | "history" | "reviews" | "security";

interface ProfileEnrollment {
  id: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  createdAt: string;
  updatedAt?: string;
  course: {
    id: string;
    title: string;
    slug: string;
    category: string;
    level: string;
    imageUrl: string | null;
    durationMinutes: number | null;
    instructor: { name: string };
  };
}

interface ProfileReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  course: {
    id: string;
    title: string;
    slug: string;
  };
}

interface ProfileResponse {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    role: string;
    image: string | null;
    createdAt: string;
    mustChangePassword?: boolean;
    hasCredentialAccount: boolean;
  };
  stats: {
    totalEnrollments: number;
    completedCourses: number;
    totalReviews: number;
    totalLessonsCompleted: number;
    averageProgress: number;
  };
  enrollments: ProfileEnrollment[];
  reviews: ProfileReview[];
}

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "profile", label: "Profile Details" },
  { key: "history", label: "Learning History" },
  { key: "reviews", label: "My Reviews" },
  { key: "security", label: "Security & Preferences" },
];

export function ProfilePageComponent() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { data: session, isPending, refetch: refetchSession } =
    authClient.useSession();

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

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Review edit modal state
  const [editingReview, setEditingReview] = useState<ProfileReview | null>(
    null,
  );
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState("");
  const [isSavingReview, setIsSavingReview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const shouldRedirectToLogin = !isPending && !session?.user;

  useEffect(() => {
    if (shouldRedirectToLogin) {
      router.replace("/login");
    }
  }, [router, shouldRedirectToLogin]);

  useEffect(() => {
    if (!session?.user?.id) return;

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
  }, [session?.user?.id]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleUpdateProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Full name is required.");
      return;
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
        throw new Error(
          errorData.error || errorData.details || "Failed to update profile",
        );
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
          : previous,
      );

      await refetchSession();
      toast.success("Profile saved successfully.");
    } catch (error) {
      console.error("Profile update error", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB.");
      return;
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
        throw new Error(
          errorData.error || errorData.details || "Failed to upload image",
        );
      }

      const { publicUrl } = await uploadResponse.json();
      const targetName =
        formData.name.trim() || profileData?.user.name || "Learner";

      const patchResponse = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: targetName, image: publicUrl }),
      });

      if (!patchResponse.ok) {
        throw new Error("Failed to save avatar to profile");
      }

      setFormData((previous) => ({ ...previous, image: publicUrl }));
      setProfileData((previous) =>
        previous
          ? { ...previous, user: { ...previous.user, image: publicUrl } }
          : previous,
      );
      await refetchSession();
      toast.success("Avatar updated successfully.");
    } catch (error) {
      console.error("Avatar upload error", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload avatar.",
      );
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    if (!profileData) return;
    setIsUploadingAvatar(true);
    try {
      const targetName =
        formData.name.trim() || profileData.user.name || "Learner";
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: targetName, image: null }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove avatar");
      }

      setFormData((previous) => ({ ...previous, image: "" }));
      setProfileData((previous) =>
        previous
          ? { ...previous, user: { ...previous.user, image: null } }
          : previous,
      );
      await refetchSession();
      toast.success("Avatar removed.");
    } catch {
      toast.error("Failed to remove avatar.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault();

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const response = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Failed to update password");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update password.",
      );
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleOpenEditReview = (review: ProfileReview) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditComment(review.comment ?? "");
  };

  const handleSaveEditedReview = async () => {
    if (!editingReview || editRating === 0) {
      toast.error("Please select a rating.");
      return;
    }
    setIsSavingReview(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: editingReview.course.id,
          rating: editRating,
          comment: editComment.trim() || null,
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update review");
      }
      const updated = await response.json();
      setProfileData((prev) =>
        prev
          ? {
              ...prev,
              reviews: prev.reviews.map((r) =>
                r.id === editingReview.id
                  ? {
                      ...r,
                      rating: updated.rating,
                      comment: updated.comment,
                    }
                  : r,
              ),
            }
          : prev,
      );
      toast.success("Review updated!");
      setEditingReview(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update review.",
      );
    } finally {
      setIsSavingReview(false);
    }
  };

  if (shouldRedirectToLogin || isPending || loadingProfile || !profileData) {
    return (
      <LearnerPageShell activePath="/profile">
        <section className="border-b border-border/40 bg-[#fff9f7] dark:bg-[#111318] py-10 lg:py-14">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 space-y-8">
            <Skeleton className="h-11 w-full max-w-xl rounded-2xl" />
            <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
              <div className="space-y-4">
                <Skeleton className="h-6 w-36 rounded-full" />
                <Skeleton className="h-11 w-80 rounded-xl" />
                <Skeleton className="h-5 w-96 rounded-lg" />
              </div>
              <Skeleton className="h-32 rounded-2xl" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))}
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 py-10">
          <Skeleton className="h-96 rounded-2xl" />
        </section>
      </LearnerPageShell>
    );
  }

  const proxiedAvatarUrl = formData.image
    ? getProxiedImageUrl(formData.image)
    : undefined;

  return (
    <LearnerPageShell activePath="/profile">
      {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border/40 bg-[#fff9f7] dark:bg-[#111318] py-10 lg:py-14">
        <div className="pointer-events-none absolute -top-40 right-0 size-[500px] rounded-full bg-[#ff6636]/5 blur-3xl" />

        <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 relative space-y-8">
          <LearnerWorkspaceNav activePath="/profile" />

          <div className="grid gap-8 lg:grid-cols-[1fr_390px] items-center">
            {/* Left: Identity & Badges */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#ff6636]/30 bg-[#ff6636]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-[#ff6636]">
                  <UserRound className="size-3.5" /> Account Profile
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-bold uppercase tracking-wider text-foreground">
                  {profileData.user.role}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
                  <Calendar className="size-3.5 text-[#ff6636]" /> Joined{" "}
                  {format(new Date(profileData.user.createdAt), "MMM yyyy")}
                </span>
              </div>

              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]">
                Manage your{" "}
                <span className="bg-gradient-to-r from-[#ff6636] to-[#ff9f60] bg-clip-text text-transparent">
                  learning identity
                </span>
              </h1>

              <p className="max-w-xl text-sm sm:text-base font-semibold leading-relaxed text-muted-foreground">
                Keep your display name and photo updated for certificates,
                inspect your learning history, manage reviews, and update
                security preferences.
              </p>

              <div className="flex flex-wrap gap-2.5 pt-1">
                <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-1.5 text-xs font-bold text-foreground">
                  <Mail className="size-3.5 text-[#ff6636]" />
                  {profileData.user.email}
                </span>
                {profileData.user.emailVerified && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-3.5" /> Verified Email
                  </span>
                )}
              </div>
            </div>

            {/* Right: Snapshot Avatar Card */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="size-16 border border-border/80 shrink-0">
                  <AvatarImage
                    src={proxiedAvatarUrl}
                    alt={profileData.user.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-[#ff6636]/10 text-xl font-extrabold text-[#ff6636]">
                    {getInitials(profileData.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    Learning Snapshot
                  </p>
                  <h2 className="text-base font-extrabold text-foreground truncate mt-0.5">
                    {profileData.user.name}
                  </h2>
                  <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                    {profileData.stats.averageProgress}% average progress across{" "}
                    {profileData.stats.totalEnrollments} path
                    {profileData.stats.totalEnrollments === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-muted-foreground">
                    Overall Completion
                  </span>
                  <span className="text-[#ff6636]">
                    {profileData.stats.averageProgress}%
                  </span>
                </div>
                <Progress
                  value={profileData.stats.averageProgress}
                  className="h-2 rounded-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/certificates"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] py-2 px-3 text-xs font-bold text-white transition-colors"
                >
                  <Award className="size-3.5" /> Certificates
                </Link>
                <Link
                  href="/my-courses"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/40 hover:border-[#ff6636]/40 hover:text-[#ff6636] py-2 px-3 text-xs font-bold text-foreground transition-colors"
                >
                  <BookOpen className="size-3.5" /> My Courses
                </Link>
              </div>
            </div>
          </div>

          {/* Stats Strip */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Enrolled Courses",
                value: profileData.stats.totalEnrollments.toString(),
                icon: BookOpen,
                color: "text-[#ff6636]",
                bg: "bg-[#ff6636]/10",
                desc: "Active and finished tracks",
              },
              {
                label: "Completed Courses",
                value: profileData.stats.completedCourses.toString(),
                icon: Award,
                color: "text-emerald-500",
                bg: "bg-emerald-500/10",
                desc: "Certificates unlocked",
              },
              {
                label: "Lessons Completed",
                value: profileData.stats.totalLessonsCompleted.toString(),
                icon: Sparkles,
                color: "text-violet-500",
                bg: "bg-violet-500/10",
                desc: "Recorded completions",
              },
              {
                label: "Course Reviews",
                value: profileData.stats.totalReviews.toString(),
                icon: Star,
                color: "text-amber-500",
                bg: "bg-amber-500/10",
                desc: "Feedback shared",
              },
            ].map((stat) => {
              const SIcon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-2xs"
                >
                  <div
                    className={cn(
                      "flex size-12 shrink-0 items-center justify-center rounded-2xl",
                      stat.bg,
                      stat.color,
                    )}
                  >
                    <SIcon className="size-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold tracking-tight text-foreground">
                      {stat.value}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-[10px] font-semibold text-muted-foreground/80 mt-0.5">
                      {stat.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Tab Bar ─────────────────────────────────────────────────────────── */}
      <div className="border-b border-border/40 bg-card py-4">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-muted/50 p-1 w-fit">
            {tabs.map((tab) => {
              const isActive = tab.key === activeTab;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "rounded-lg px-4 py-2 text-xs font-bold transition-all",
                    isActive
                      ? "bg-[#ff6636] text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Tab Panels ──────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
        {/* Tab 1: Profile Details */}
        {activeTab === "profile" && (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px] items-start">
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-border/60 pb-5">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#ff6636]">
                  Edit Details
                </p>
                <h2 className="text-lg font-extrabold text-foreground mt-0.5">
                  Personal Information
                </h2>
                <p className="text-xs font-semibold text-muted-foreground mt-1">
                  Your full name appears on completion certificates and
                  community discussions.
                </p>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                {/* Avatar Upload */}
                <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-muted/20 p-4">
                  <Avatar className="size-16 border border-border shrink-0">
                    <AvatarImage
                      src={proxiedAvatarUrl}
                      alt={profileData.user.name}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-[#ff6636]/10 text-lg font-extrabold text-[#ff6636]">
                      {getInitials(profileData.user.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground">
                      Profile Picture
                    </p>
                    <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                      PNG, JPG, or WEBP up to 5MB.
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={isUploadingAvatar}
                  />

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="rounded-xl text-xs font-bold"
                    >
                      {isUploadingAvatar ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin mr-1.5" />
                          Uploading…
                        </>
                      ) : (
                        <>
                          <Upload className="size-3.5 mr-1.5" />
                          Change Photo
                        </>
                      )}
                    </Button>

                    {formData.image && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveAvatar}
                        disabled={isUploadingAvatar}
                        className="rounded-xl text-xs font-bold text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3.5 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>

                {/* Full Name */}
                <div className="grid gap-2 sm:grid-cols-[170px_1fr] sm:items-start">
                  <div>
                    <label
                      htmlFor="name"
                      className="text-xs font-bold text-foreground"
                    >
                      Full Name
                    </label>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Printed on certificates.
                    </p>
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your full name"
                    required
                    className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground focus:border-[#ff6636]/60 focus:outline-none focus:ring-2 focus:ring-[#ff6636]/10"
                  />
                </div>

                {/* Email */}
                <div className="grid gap-2 sm:grid-cols-[170px_1fr] sm:items-start">
                  <div>
                    <label
                      htmlFor="email"
                      className="text-xs font-bold text-foreground"
                    >
                      Email Address
                    </label>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Managed by your account.
                    </p>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="h-11 w-full rounded-xl border border-border/80 bg-muted/40 px-4 text-sm font-medium text-muted-foreground cursor-not-allowed"
                  />
                </div>

                {/* Submit & Reset */}
                <div className="flex flex-wrap justify-end gap-2.5 pt-4 border-t border-border/60">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setFormData({
                        name: profileData.user.name,
                        email: profileData.user.email,
                        image: profileData.user.image || "",
                      })
                    }
                    className="rounded-xl text-xs font-bold"
                  >
                    <RotateCcw className="size-3.5 mr-1.5" /> Reset
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] text-white text-xs font-extrabold uppercase tracking-wider px-5 shadow-md shadow-[#ff6636]/15"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <Save className="mr-1.5 size-3.5" /> Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>

            {/* Right Column: Account Summary */}
            <aside className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground border-b border-border/60 pb-3">
                  Account Details
                </p>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-muted-foreground">
                      Role
                    </span>
                    <span className="font-bold text-foreground">
                      {profileData.user.role}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-muted-foreground">
                      Authentication
                    </span>
                    <span className="font-bold text-foreground">
                      {profileData.user.hasCredentialAccount
                        ? "Email & Password"
                        : "Social OAuth"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-muted-foreground">
                      Member Since
                    </span>
                    <span className="font-bold text-foreground">
                      {format(
                        new Date(profileData.user.createdAt),
                        "MMM d, yyyy",
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {profileData.user.role === "ADMIN" && (
                <div className="rounded-2xl border border-[#ff6636]/30 bg-[#ff6636]/5 p-6 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#ff6636]">
                    <ShieldCheck className="size-4" /> Administrator Access
                  </div>
                  <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                    Your account has Admin Studio privileges to manage courses,
                    enrollments, and platform settings.
                  </p>
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] px-4 py-2 text-xs font-bold text-white transition-colors"
                  >
                    Open Admin Studio
                  </Link>
                </div>
              )}
            </aside>
          </div>
        )}

        {/* Tab 2: Learning History */}
        {activeTab === "history" && (
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border/60 pb-5">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#ff6636]">
                  Timeline
                </p>
                <h2 className="text-lg font-extrabold text-foreground mt-0.5">
                  Learning History ({profileData.enrollments.length})
                </h2>
                <p className="text-xs font-semibold text-muted-foreground mt-1">
                  Detailed progression across every course you&apos;ve enrolled
                  in.
                </p>
              </div>
              <Link
                href="/my-courses"
                className="text-xs font-bold text-[#ff6636] hover:underline"
              >
                Open My Courses →
              </Link>
            </div>

            {profileData.enrollments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center space-y-3">
                <BookOpen className="size-9 text-muted-foreground/50 mx-auto" />
                <p className="text-sm font-bold text-foreground">
                  No enrolled courses yet
                </p>
                <p className="text-xs font-medium text-muted-foreground max-w-sm mx-auto">
                  Start a course from the catalog to build your learning
                  history.
                </p>
                <Link
                  href="/courses"
                  className="inline-flex items-center rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] px-5 py-2 text-xs font-bold text-white transition-colors"
                >
                  Browse Courses
                </Link>
              </div>
            ) : (
              <div className="space-y-3.5">
                {profileData.enrollments.map((enrollment) => {
                  const isComplete = enrollment.progress >= 100;
                  const cat = getCategoryMeta(enrollment.course.category);

                  return (
                    <div
                      key={enrollment.id}
                      className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-border bg-muted/20 p-4 sm:p-5 hover:border-[#ff6636]/40 transition-colors"
                    >
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase",
                              cat.theme.badge,
                            )}
                          >
                            {cat.label}
                          </span>
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase",
                              getLevelBadgeClass(enrollment.course.level),
                            )}
                          >
                            {formatCourseLevel(enrollment.course.level)}
                          </span>
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase",
                              isComplete
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-[#ff6636]/10 text-[#ff6636]",
                            )}
                          >
                            {isComplete
                              ? "Completed"
                              : `${enrollment.progress}% In Progress`}
                          </span>
                        </div>

                        <Link
                          href={`/courses/${enrollment.course.slug}`}
                          className="block text-sm font-extrabold text-foreground hover:text-[#ff6636] transition-colors"
                        >
                          {enrollment.course.title}
                        </Link>

                        <p className="text-xs font-medium text-muted-foreground">
                          By {enrollment.course.instructor.name} ·{" "}
                          {enrollment.completedLessons}/
                          {enrollment.totalLessons} lessons ·{" "}
                          {formatDuration(enrollment.course.durationMinutes)} ·
                          Enrolled{" "}
                          {formatDistanceToNow(new Date(enrollment.createdAt), {
                            addSuffix: true,
                          })}
                        </p>

                        <Progress
                          value={enrollment.progress}
                          className="h-1.5 max-w-md rounded-full"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {isComplete ? (
                          <Link
                            href={`/certificates/${enrollment.id}`}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2 text-xs font-bold text-background hover:bg-foreground/90 transition-colors"
                          >
                            <Award className="size-3.5" /> View Certificate
                          </Link>
                        ) : (
                          <Link
                            href={`/courses/${enrollment.course.slug}`}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] px-4 py-2 text-xs font-bold text-white transition-colors"
                          >
                            <Play className="size-3.5 fill-current" /> Continue
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: My Reviews */}
        {activeTab === "reviews" && (
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-border/60 pb-5">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#ff6636]">
                Feedback
              </p>
              <h2 className="text-lg font-extrabold text-foreground mt-0.5">
                Course Reviews ({profileData.reviews.length})
              </h2>
              <p className="text-xs font-semibold text-muted-foreground mt-1">
                Reviews you have submitted for completed courses.
              </p>
            </div>

            {profileData.reviews.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center space-y-3">
                <Star className="size-9 text-muted-foreground/50 mx-auto" />
                <p className="text-sm font-bold text-foreground">
                  No reviews submitted yet
                </p>
                <p className="text-xs font-medium text-muted-foreground max-w-sm mx-auto">
                  Complete a course and share your feedback from My Courses or
                  the course page.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {profileData.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="flex flex-col justify-between rounded-2xl border border-border bg-muted/20 p-5 space-y-3 hover:border-[#ff6636]/40 transition-colors"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={`/courses/${review.course.slug}`}
                            className="text-sm font-extrabold text-foreground hover:text-[#ff6636] transition-colors line-clamp-1"
                          >
                            {review.course.title}
                          </Link>
                          <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">
                            Submitted{" "}
                            {formatDistanceToNow(new Date(review.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        <StarRating rating={review.rating} size="sm" />
                      </div>

                      <p className="rounded-xl border border-border/60 bg-card p-3.5 text-xs font-medium leading-relaxed text-muted-foreground">
                        {review.comment || "Rated without a written comment."}
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditReview(review)}
                        className="rounded-xl text-xs font-bold gap-1.5"
                      >
                        <Pencil className="size-3" /> Edit Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Security & Preferences */}
        {activeTab === "security" && (
          <div className="grid gap-8 lg:grid-cols-2 items-start">
            {/* Password Card */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-border/60 pb-5">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-[#ff6636]/10 text-[#ff6636]">
                  <KeyRound className="size-5" />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#ff6636]">
                    Account Security
                  </p>
                  <h2 className="text-base font-extrabold text-foreground">
                    Update Password
                  </h2>
                </div>
              </div>

              {profileData.user.hasCredentialAccount ? (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="currentPassword"
                      className="text-xs font-bold text-foreground"
                    >
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        placeholder="Enter current password"
                        className="h-10 w-full rounded-xl border border-border bg-background px-3.5 pr-10 text-sm font-medium text-foreground focus:border-[#ff6636]/60 focus:outline-none focus:ring-2 focus:ring-[#ff6636]/10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword((prev) => !prev)}
                        aria-label="Toggle current password visibility"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="newPassword"
                      className="text-xs font-bold text-foreground"
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                        placeholder="At least 8 characters"
                        className="h-10 w-full rounded-xl border border-border bg-background px-3.5 pr-10 text-sm font-medium text-foreground focus:border-[#ff6636]/60 focus:outline-none focus:ring-2 focus:ring-[#ff6636]/10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        aria-label="Toggle new password visibility"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="confirmPassword"
                      className="text-xs font-bold text-foreground"
                    >
                      Confirm New Password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="Re-enter new password"
                      className="h-10 w-full rounded-xl border border-border bg-background px-3.5 text-sm font-medium text-foreground focus:border-[#ff6636]/60 focus:outline-none focus:ring-2 focus:ring-[#ff6636]/10"
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isUpdatingPassword}
                      className="rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] text-white text-xs font-extrabold uppercase tracking-wider px-5"
                    >
                      {isUpdatingPassword ? (
                        <>
                          <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                          Updating…
                        </>
                      ) : (
                        <>
                          <Shield className="mr-1.5 size-3.5" /> Update Password
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="rounded-2xl border border-border bg-muted/30 p-5 space-y-2">
                  <p className="text-xs font-bold text-foreground">
                    Managed via Social Sign-In
                  </p>
                  <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                    Your account uses an external OAuth provider (such as Google
                    or GitHub), so passwords are managed directly by your
                    identity provider.
                  </p>
                </div>
              )}
            </div>

            {/* Appearance & Notifications Card */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-5">
                <div className="flex items-center gap-3 border-b border-border/60 pb-5">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-500">
                    <Sun className="size-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground">
                      Appearance
                    </p>
                    <h2 className="text-base font-extrabold text-foreground">
                      Theme Preference
                    </h2>
                  </div>
                </div>

                <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                  Choose how DevForge looks across all pages, lesson readers,
                  and workspace cards.
                </p>

                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { value: "light", label: "Light", icon: Sun },
                    { value: "dark", label: "Dark", icon: Moon },
                    { value: "system", label: "System", icon: Laptop },
                  ].map((option) => {
                    const Icon = option.icon;
                    const active = theme === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setTheme(option.value)}
                        className={cn(
                          "flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-xs font-bold transition-all",
                          active
                            ? "border-[#ff6636] bg-[#ff6636]/10 text-[#ff6636]"
                            : "border-border bg-muted/20 text-muted-foreground hover:border-[#ff6636]/40 hover:text-foreground",
                        )}
                      >
                        <Icon className="size-5" />
                        <span>{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                    <Bell className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-foreground">
                      Notifications Center
                    </p>
                    <p className="text-[11px] font-medium text-muted-foreground">
                      Review enrollments, course updates, and alerts.
                    </p>
                  </div>
                </div>
                <Link
                  href="/notifications"
                  className="shrink-0 rounded-xl border border-border bg-background px-4 py-2 text-xs font-bold text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] transition-colors"
                >
                  Open
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Edit Review Dialog */}
      <Dialog
        open={Boolean(editingReview)}
        onOpenChange={(open) => !open && setEditingReview(null)}
      >
        <DialogContent className="sm:max-w-md rounded-2xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold">
              Edit Your Review
            </DialogTitle>
            <DialogDescription className="text-xs font-semibold text-muted-foreground">
              {editingReview?.course.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-bold text-foreground block mb-2">
                Rating
              </label>
              <StarRating
                rating={editRating}
                onRatingChange={setEditRating}
                interactive
                size="lg"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground">
                Comment (optional)
              </label>
              <Textarea
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                rows={4}
                maxLength={1000}
                className="mt-1.5 text-xs rounded-xl border-border resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setEditingReview(null)}
              className="rounded-xl text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEditedReview}
              disabled={isSavingReview || editRating === 0}
              className="rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] text-white text-xs font-bold"
            >
              {isSavingReview && (
                <Loader2 className="size-3.5 animate-spin mr-1.5" />
              )}
              Save Review
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </LearnerPageShell>
  );
}
