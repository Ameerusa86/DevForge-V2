"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  Bell,
  BookOpen,
  Calendar,
  Loader2,
  Mail,
  Save,
  Shield,
  Star,
  Upload,
  UserRound,
  Trash2,
  Sparkles,
  Lock,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";
import {
  MarketingPublicFooter,
  MarketingPublicHeader,
} from "@/components/marketing/public-chrome";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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

function ProfileShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <MarketingPublicHeader activePath="/profile" showSearch={false} />
      {children}
      <MarketingPublicFooter />
    </div>
  );
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
        console.error("Failed to fetch profile", error);
        toast.error("Failed to load profile data.");
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [session?.user]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleUpdateProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          image: formData.image,
        }),
      });

      if (!response.ok) throw new Error("Failed to update profile");

      const updatedUser = await response.json();
      setProfileData((previous) =>
        previous
          ? {
              ...previous,
              user: {
                ...previous.user,
                name: updatedUser.name,
                image: updatedUser.image,
              },
            }
          : previous,
      );
      setFormData((previous) => ({
        ...previous,
        name: updatedUser.name,
        image: updatedUser.image || "",
      }));
      toast.success("Profile updated successfully.");
    } catch (error) {
      console.error("Failed to update profile", error);
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
      <ProfileShell>
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-[#ff6636]" />
        </div>
      </ProfileShell>
    );
  }

  return (
    <ProfileShell>
      <main>
        {/* ── Hero section ─────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-border/40 bg-[#fff9f7] dark:bg-[#111318] py-10 lg:py-14">
          <div className="pointer-events-none absolute -top-40 right-0 size-[500px] rounded-full bg-[#ff6636]/5 blur-3xl" />
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 relative">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition hover:text-[#ff6636]"
            >
              <ArrowLeft className="size-3.5" /> Back to home
            </Link>

            <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_400px] items-start">
              
              {/* Left Column: Heading and info chips */}
              <div className="space-y-4">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#ff6636]/30 bg-[#ff6636]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-[#ff6636]">
                  <UserRound className="size-3.5" /> Account Profile
                </span>
                <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
                  Manage your learning record.
                </h1>
                <p className="text-sm font-semibold text-muted-foreground leading-relaxed max-w-lg">
                  Keep details current, review active courses, track completed programs, and configure account notifications in one place.
                </p>

                <div className="pt-2 flex flex-wrap gap-2.5">
                  <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-bold text-foreground">
                    <UserRound className="size-3.5 text-[#ff6636]" />
                    {profileData.user.name}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-bold text-foreground">
                    <Mail className="size-3.5 text-violet-500" />
                    {profileData.user.email}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-bold text-foreground">
                    <Calendar className="size-3.5 text-emerald-500" />
                    Joined {format(new Date(profileData.user.createdAt), "MMM yyyy")}
                  </span>
                </div>
              </div>

              {/* Right Column: Snapshot Box */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex items-center gap-4">
                <Avatar className="size-16 border border-border/80 shrink-0">
                  <AvatarImage src={formData.image || undefined} className="object-cover" />
                  <AvatarFallback className="bg-[#ff6636]/10 text-xl font-bold text-[#ff6636]">
                    {getInitials(profileData.user.name || "U")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    Learning Snapshot
                  </p>
                  <h3 className="text-base font-bold text-foreground truncate mt-1">
                    {profileData.user.name}
                  </h3>
                  <p className="text-xs font-semibold text-muted-foreground leading-relaxed mt-1.5">
                    {profileData.stats.totalEnrollments} active path{profileData.stats.totalEnrollments !== 1 && "s"} and {profileData.stats.completedCourses} completed course{profileData.stats.completedCourses !== 1 && "s"}.
                  </p>
                </div>
              </div>

            </div>

            {/* Stat Cards Strip */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Enrollments", value: profileData.stats.totalEnrollments, icon: BookOpen, color: "text-[#ff6636]", bg: "bg-[#ff6636]/10" },
                { label: "Completed", value: profileData.stats.completedCourses, icon: Save, color: "text-violet-500", bg: "bg-violet-500/10" },
                { label: "Avg Progress", value: `${profileData.stats.averageProgress}%`, icon: Sparkles, color: "text-amber-500", bg: "bg-amber-500/10" },
                { label: "Reviews", value: profileData.stats.totalReviews, icon: Star, color: "text-emerald-500", bg: "bg-emerald-500/10" },
              ].map((stat) => {
                const SIcon = stat.icon;
                return (
                  <div key={stat.label} className="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4">
                    <div className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${stat.bg} ${stat.color}`}>
                      <SIcon className="size-4.5" />
                    </div>
                    <div>
                      <p className="text-2xl font-extrabold tracking-tight text-foreground">{stat.value}</p>
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Tab Switcher ─────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
          
          <div className="border-b border-border/50 pb-2 mb-8">
            <div className="flex flex-wrap gap-1 bg-muted/30 p-1.5 rounded-2xl border border-border/40 w-fit">
              {tabs.map((tab) => {
                const isActive = tab.key === activeTab;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "px-4.5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-200",
                      isActive
                        ? "bg-[#ff6636] text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Tab Contents ─────────────────────────────────────────────────── */}
          <div className="mt-4">
            
            {/* profile Tab */}
            {activeTab === "profile" && (
              <div className="grid gap-8 lg:grid-cols-[1fr_360px] items-start">
                
                {/* Edit Form */}
                <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                  <div className="border-b border-border/50 pb-5 mb-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      Edit details
                    </p>
                    <h2 className="text-lg font-extrabold text-foreground mt-0.5">
                      Profile Information
                    </h2>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    
                    {/* Avatar Upload */}
                    <div className="grid gap-4 sm:grid-cols-[160px_1fr] items-start">
                      <div>
                        <p className="text-xs font-bold text-foreground">Profile Avatar</p>
                        <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">PNG or JPG, up to 5MB.</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-4.5 rounded-xl border border-border bg-muted/10 p-4">
                        <Avatar className="size-16 border border-border">
                          <AvatarImage src={formData.image || undefined} className="object-cover" />
                          <AvatarFallback className="bg-[#ff6636]/10 text-base font-bold text-[#ff6636]">
                            {getInitials(profileData.user.name || "U")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-foreground">Identify your account</p>
                          <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">Used across reviews and dashboards.</p>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarUpload}
                          disabled={isUploadingAvatar}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingAvatar}
                          className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] transition-all disabled:opacity-60 shrink-0"
                        >
                          {isUploadingAvatar ? (
                            <><Loader2 className="size-3 animate-spin" /> Uploading</>
                          ) : (
                            <><Upload className="size-3" /> Change Avatar</>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Full Name */}
                    <div className="grid gap-4 sm:grid-cols-[160px_1fr] items-start">
                      <div>
                        <p className="text-xs font-bold text-foreground">Full Name</p>
                        <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">Used on completion certificates.</p>
                      </div>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Your full name"
                        required
                        className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground focus:border-[#ff6636]/60 focus:outline-none focus:ring-2 focus:ring-[#ff6636]/10 transition-all"
                      />
                    </div>

                    {/* Email */}
                    <div className="grid gap-4 sm:grid-cols-[160px_1fr] items-start">
                      <div>
                        <p className="text-xs font-bold text-foreground">Email Address</p>
                        <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">Cannot be updated from this page.</p>
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        disabled
                        className="h-11 w-full rounded-xl border border-border/80 bg-muted/30 px-4 text-sm font-medium text-muted-foreground cursor-not-allowed"
                      />
                    </div>

                    {/* Save Buttons */}
                    <div className="flex gap-2.5 pt-4 border-t border-border/50 sm:justify-end">
                      <Button
                        type="submit"
                        disabled={isSaving}
                        className="rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] font-bold text-white px-5 py-2.5 text-xs uppercase tracking-wider"
                      >
                        {isSaving ? (
                          <><Loader2 className="mr-2 size-3.5 animate-spin" /> Saving</>
                        ) : (
                          <><Save className="mr-2 size-3.5" /> Save Changes</>
                        )}
                      </Button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            name: profileData.user.name,
                            email: profileData.user.email,
                            image: profileData.user.image || "",
                          })
                        }
                        className="rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-muted"
                      >
                        Reset
                      </button>
                    </div>

                  </form>
                </div>

                {/* Right side stats card */}
                <div className="space-y-6">
                  {/* Progress widget */}
                  <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Learning progress</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold tracking-tight text-foreground">
                        {profileData.stats.averageProgress}%
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">average progress</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-[#ff6636] rounded-full"
                        style={{ width: `${profileData.stats.averageProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Summary lists */}
                  <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Account summary</p>
                    <div className="space-y-3.5 text-xs font-semibold text-muted-foreground">
                      <div className="flex items-center justify-between border-b border-border/50 pb-3">
                        <span>Member since</span>
                        <span className="text-foreground font-bold">{format(new Date(profileData.user.createdAt), "MMMM yyyy")}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-border/50 pb-3">
                        <span>Reviews written</span>
                        <span className="text-foreground font-bold">{profileData.stats.totalReviews}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Account status</span>
                        <span className="rounded-full bg-[#ff6636]/10 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-[#ff6636]">Active</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* history Tab */}
            {activeTab === "history" && (
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                <div className="mb-6 border-b border-border/50 pb-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Progress log</p>
                  <h2 className="text-lg font-extrabold text-foreground mt-0.5">Learning History</h2>
                </div>

                <div className="space-y-4">
                  {profileData.enrollments.length === 0 ? (
                    <div className="flex min-h-[14rem] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/10 px-6 py-8 text-center">
                      <BookOpen className="size-10 text-[#ff6636] mb-3" />
                      <p className="text-xs font-bold text-foreground">No history log yet</p>
                      <p className="text-xs font-semibold text-muted-foreground mt-1">Enrolled courses will track progress timelines here.</p>
                    </div>
                  ) : (
                    profileData.enrollments.map((enrollment) => (
                      <div
                        key={enrollment.id}
                        className="rounded-xl border border-border bg-muted/20 p-5 space-y-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="min-w-0">
                            <Link
                              href={`/courses/${enrollment.course.slug}`}
                              className="text-sm font-bold text-foreground hover:text-[#ff6636] transition-colors"
                            >
                              {enrollment.course.title}
                            </Link>
                            <p className="text-[10px] font-semibold text-muted-foreground mt-1.5">
                              Enrolled {formatDistanceToNow(new Date(enrollment.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          <span className={cn(
                            "rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                            enrollment.progress === 100
                              ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-500"
                              : "bg-[#ff6636]/10 text-[#ff6636]"
                          )}>
                            {enrollment.progress === 100 ? "Completed" : "In Progress"}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-semibold">
                            <span className="text-muted-foreground">Path completion progress</span>
                            <span className="text-foreground">{enrollment.progress}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-700",
                                enrollment.progress === 100 ? "bg-emerald-500" : "bg-[#ff6636]"
                              )}
                              style={{ width: `${enrollment.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* reviews Tab */}
            {activeTab === "reviews" && (
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                <div className="mb-6 border-b border-border/50 pb-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Feedback log</p>
                  <h2 className="text-lg font-extrabold text-foreground mt-0.5">My Reviews</h2>
                </div>

                <div className="space-y-4">
                  {profileData.reviews.length === 0 ? (
                    <div className="flex min-h-[14rem] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/10 px-6 py-8 text-center">
                      <Star className="size-10 text-[#ff6636] mb-3" />
                      <p className="text-xs font-bold text-foreground">No reviews yet</p>
                      <p className="text-xs font-semibold text-muted-foreground mt-1">Review feedback on completed courses will appear here.</p>
                    </div>
                  ) : (
                    profileData.reviews.map((review) => (
                      <div
                        key={review.id}
                        className="rounded-xl border border-border bg-muted/20 p-5 space-y-3.5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="min-w-0 space-y-1">
                            <Link
                              href={`/courses/${review.course.slug}`}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground hover:text-[#ff6636] transition-colors"
                            >
                              <BookOpen className="size-3.5 text-[#ff6636]" />
                              {review.course.title}
                            </Link>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                              {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          <StarRating rating={review.rating} size="sm" />
                        </div>
                        <p className="text-xs font-semibold text-muted-foreground leading-relaxed bg-card border border-border/40 p-3 rounded-lg">
                          {review.comment || "Left a rating without a comment."}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* settings Tab */}
            {activeTab === "settings" && (
              <div className="grid gap-6 sm:grid-cols-2">
                
                {/* Notifications settings */}
                <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                  <div className="flex items-center gap-3 border-b border-border/50 pb-4">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-[#ff6636]/10 text-[#ff6636]">
                      <Bell className="size-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Preferences</p>
                      <h2 className="text-sm font-extrabold text-foreground mt-0.5">Notification Alerts</h2>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                    Custom email summaries, newsletter content, and course alerts are pending integration.
                  </p>
                  <div className="rounded-xl border border-border bg-muted/15 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-foreground">Course updates</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Get notices when lessons update.</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-muted-foreground border border-border/50">
                      <Lock className="size-2.5" /> Locked
                    </span>
                  </div>
                </div>

                {/* Security settings */}
                <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                  <div className="flex items-center gap-3 border-b border-border/50 pb-4">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
                      <Shield className="size-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Security</p>
                      <h2 className="text-sm font-extrabold text-foreground mt-0.5">Account Credentials</h2>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                    Password rotation and multi-factor authorization settings are handled via secure client gateways.
                  </p>
                  <div className="space-y-2">
                    <div className="rounded-xl border border-border bg-muted/15 p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-foreground">Change password</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Reset your login password credentials.</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-muted-foreground border border-border/50">
                        <Lock className="size-2.5" /> Locked
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>

        </section>
      </main>
    </ProfileShell>
  );
}
