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
  { key: "profile", label: "Profile" },
  { key: "history", label: "Learning History" },
  { key: "reviews", label: "Reviews" },
  { key: "settings", label: "Settings" },
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
    <div className="min-h-screen bg-[#f5f7fa] text-[#1d2026]">
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
      const uploadResponse = await fetch("/api/S3/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
        }),
      });
      if (!uploadResponse.ok) throw new Error("Failed to get upload URL");

      const { preSignedUrl, publicUrl } = await uploadResponse.json();
      const s3Response = await fetch(preSignedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!s3Response.ok) throw new Error("Failed to upload image");

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
          <Loader2 className="size-8 animate-spin text-[#8c94a3]" />
        </div>
      </ProfileShell>
    );
  }

  return (
    <ProfileShell>
      <main>
        <section className="border-b border-[#e9eaf0] bg-white">
          <div className="mx-auto max-w-[1320px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#4e5566] transition hover:text-[#ff6636]"
            >
              <ArrowLeft className="size-4" />
              Back to home
            </Link>

            <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="max-w-[760px]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c94a3]">
                  Account profile
                </p>
                <h1 className="mt-3 text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[3.4rem]">
                  Manage your profile, progress, and learning record.
                </h1>
                <p className="mt-5 max-w-[680px] text-base leading-8 text-[#6e7485]">
                  Keep your account details current, review active courses, and
                  track what you have already completed from one place.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-2 bg-[#fff2e5] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ff6636]">
                    <UserRound className="size-3.5" />
                    {profileData.user.name}
                  </span>
                  <span className="inline-flex items-center gap-2 border border-[#e9eaf0] bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4e5566]">
                    <Mail className="size-3.5 text-[#ff6636]" />
                    {profileData.user.email}
                  </span>
                  <span className="inline-flex items-center gap-2 border border-[#e9eaf0] bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4e5566]">
                    <Calendar className="size-3.5 text-[#ff6636]" />
                    Joined {format(new Date(profileData.user.createdAt), "MMM yyyy")}
                  </span>
                </div>
              </div>

              <div className="border border-[#1d2026] bg-[#1d2026] p-6 text-white">
                <div className="flex items-center gap-4">
                  <Avatar className="size-20 border border-white/10">
                    <AvatarImage src={formData.image || undefined} />
                    <AvatarFallback className="bg-white/10 text-xl font-semibold text-white">
                      {getInitials(profileData.user.name || "U")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d0d3dd]">
                      Profile snapshot
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                      {profileData.user.name}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[#d0d3dd]">
                      {profileData.stats.totalEnrollments} active learning paths and{" "}
                      {profileData.stats.completedCourses} completed courses.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="border border-[#e9eaf0] bg-[#f5f7fa] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c94a3]">Enrollments</p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#1d2026]">{profileData.stats.totalEnrollments}</p>
              </div>
              <div className="border border-[#e9eaf0] bg-[#f5f7fa] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c94a3]">Completed</p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#1d2026]">{profileData.stats.completedCourses}</p>
              </div>
              <div className="border border-[#e9eaf0] bg-[#f5f7fa] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c94a3]">Average Progress</p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#1d2026]">{profileData.stats.averageProgress}%</p>
              </div>
              <div className="border border-[#e9eaf0] bg-[#f5f7fa] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c94a3]">Reviews</p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#1d2026]">{profileData.stats.totalReviews}</p>
              </div>
            </div>

            <div className="mt-8 border border-[#e9eaf0] bg-white p-2">
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => {
                  const isActive = tab.key === activeTab;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-4 py-3 text-sm font-semibold transition ${
                        isActive ? "bg-[#1d2026] text-white" : "text-[#4e5566] hover:bg-[#f5f7fa] hover:text-[#1d2026]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-8">
              {activeTab === "profile" ? (
                <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
                  <div className="border border-[#e9eaf0] bg-white p-6 sm:p-8">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c94a3]">
                      Edit details
                    </p>
                    <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#1d2026]">
                      Profile information
                    </h2>
                    <form onSubmit={handleUpdateProfile} className="mt-8 space-y-6">
                      <div className="grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)]">
                        <div>
                          <p className="text-sm font-semibold text-[#1d2026]">Avatar</p>
                          <p className="mt-2 text-sm leading-7 text-[#6e7485]">PNG or JPG up to 5MB.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-5 border border-[#e9eaf0] bg-[#f5f7fa] p-5">
                          <Avatar className="size-20 border border-[#e9eaf0]">
                            <AvatarImage src={formData.image || undefined} />
                            <AvatarFallback className="bg-white text-xl font-semibold text-[#ff6636]">
                              {getInitials(profileData.user.name || "U")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-[#1d2026]">Keep your account recognizable</p>
                            <p className="mt-2 text-sm leading-7 text-[#6e7485]">This photo is used across your profile and account menus.</p>
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
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingAvatar}
                            className="rounded-none bg-[#1d2026] px-5 py-3 text-sm font-semibold text-white hover:bg-[#111318]"
                          >
                            {isUploadingAvatar ? (
                              <>
                                <Loader2 className="mr-2 size-4 animate-spin" />
                                Uploading
                              </>
                            ) : (
                              <>
                                <Upload className="mr-2 size-4" />
                                Change avatar
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)]">
                        <div>
                          <p className="text-sm font-semibold text-[#1d2026]">Full name</p>
                          <p className="mt-2 text-sm leading-7 text-[#6e7485]">This is shown in your account menus and reviews.</p>
                        </div>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Your full name"
                          required
                          className="h-14 rounded-none border-[#d7dae0] bg-white text-[#1d2026] placeholder:text-[#8c94a3] focus-visible:border-[#ff6636] focus-visible:ring-0"
                        />
                      </div>

                      <div className="grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)]">
                        <div>
                          <p className="text-sm font-semibold text-[#1d2026]">Email address</p>
                          <p className="mt-2 text-sm leading-7 text-[#6e7485]">Email changes are not enabled from the profile page.</p>
                        </div>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          disabled
                          className="h-14 rounded-none border-[#d7dae0] bg-[#f5f7fa] text-[#4e5566]"
                        />
                      </div>

                      <div className="flex flex-wrap gap-3 pt-2">
                        <Button
                          type="submit"
                          disabled={isSaving}
                          className="rounded-none bg-[#ff6636] px-6 py-3 text-sm font-semibold text-white hover:bg-[#e95a2b]"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="mr-2 size-4 animate-spin" />
                              Saving
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 size-4" />
                              Save changes
                            </>
                          )}
                        </Button>
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
                          className="rounded-none border-[#d7dae0] bg-white px-6 py-3 text-sm font-semibold text-[#1d2026] hover:border-[#ff6636] hover:text-[#ff6636]"
                        >
                          Reset
                        </Button>
                      </div>
                    </form>
                  </div>

                  <div className="space-y-6">
                    <div className="border border-[#1d2026] bg-[#1d2026] p-6 text-white">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d0d3dd]">Learning status</p>
                      <div className="mt-4 flex items-end gap-3">
                        <span className="text-[52px] font-semibold leading-none tracking-[-0.05em]">
                          {profileData.stats.averageProgress}%
                        </span>
                        <span className="pb-1 text-sm font-medium text-[#d0d3dd]">average progress</span>
                      </div>
                      <div className="mt-5 h-2 bg-white/10">
                        <div
                          className="h-full bg-[#ff6636]"
                          style={{ width: `${profileData.stats.averageProgress}%` }}
                        />
                      </div>
                    </div>

                    <div className="border border-[#e9eaf0] bg-white p-6">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c94a3]">Account summary</p>
                      <div className="mt-5 space-y-4 text-sm">
                        <div className="flex items-center justify-between gap-4 border-b border-[#e9eaf0] pb-4">
                          <span className="text-[#6e7485]">Member since</span>
                          <span className="font-semibold text-[#1d2026]">{format(new Date(profileData.user.createdAt), "MMMM yyyy")}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 border-b border-[#e9eaf0] pb-4">
                          <span className="text-[#6e7485]">Reviews written</span>
                          <span className="font-semibold text-[#1d2026]">{profileData.stats.totalReviews}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[#6e7485]">Account status</span>
                          <span className="bg-[#fff2e5] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#ff6636]">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {activeTab === "history" ? (
                <div className="border border-[#e9eaf0] bg-white p-6 sm:p-8">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c94a3]">Progress log</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#1d2026]">Learning history</h2>
                  <div className="mt-8 space-y-4">
                    {profileData.enrollments.length === 0 ? (
                      <div className="border border-dashed border-[#d7dae0] bg-[#f5f7fa] px-6 py-12 text-center">
                        <BookOpen className="mx-auto size-10 text-[#ff6636]" />
                        <p className="mt-4 text-sm leading-7 text-[#6e7485]">No active learning history yet.</p>
                      </div>
                    ) : (
                      profileData.enrollments.map((enrollment) => (
                        <article key={enrollment.id} className="border border-[#e9eaf0] bg-[#f5f7fa] p-5">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <Link
                                href={`/courses/${enrollment.course.slug}`}
                                className="text-lg font-semibold text-[#1d2026] transition hover:text-[#ff6636]"
                              >
                                {enrollment.course.title}
                              </Link>
                              <p className="mt-2 text-sm leading-7 text-[#6e7485]">
                                Enrolled {formatDistanceToNow(new Date(enrollment.createdAt), { addSuffix: true })}.
                              </p>
                            </div>
                            <span className={`px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                              enrollment.progress === 100 ? "bg-[#1d2026] text-white" : "bg-[#fff2e5] text-[#ff6636]"
                            }`}>
                              {enrollment.progress === 100 ? "Completed" : "In Progress"}
                            </span>
                          </div>
                          <div className="mt-5">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-[#6e7485]">Progress</span>
                              <span className="font-semibold text-[#1d2026]">{enrollment.progress}%</span>
                            </div>
                            <Progress value={enrollment.progress} className="mt-3 h-2 bg-[#e9eaf0]" />
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              ) : null}

              {activeTab === "reviews" ? (
                <div className="border border-[#e9eaf0] bg-white p-6 sm:p-8">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c94a3]">Feedback</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#1d2026]">Course reviews</h2>
                  <div className="mt-8 space-y-4">
                    {profileData.reviews.length === 0 ? (
                      <div className="border border-dashed border-[#d7dae0] bg-[#f5f7fa] px-6 py-12 text-center">
                        <Star className="mx-auto size-10 text-[#ff6636]" />
                        <p className="mt-4 text-sm leading-7 text-[#6e7485]">No reviews yet.</p>
                      </div>
                    ) : (
                      profileData.reviews.map((review) => (
                        <article key={review.id} className="border border-[#e9eaf0] bg-[#f5f7fa] p-5 sm:p-6">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <Link
                                href={`/courses/${review.course.slug}`}
                                className="inline-flex items-center gap-2 text-base font-semibold text-[#1d2026] transition hover:text-[#ff6636]"
                              >
                                <BookOpen className="size-4 text-[#ff6636]" />
                                {review.course.title}
                              </Link>
                              <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-[#8c94a3]">
                                {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                            <StarRating rating={review.rating} size="sm" />
                          </div>
                          <p className="mt-4 text-sm leading-7 text-[#4e5566]">
                            {review.comment || "Left a rating without a written comment."}
                          </p>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              ) : null}

              {activeTab === "settings" ? (
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="border border-[#e9eaf0] bg-white p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex size-12 items-center justify-center bg-[#fff2e5] text-[#ff6636]">
                        <Bell className="size-5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c94a3]">Notifications</p>
                        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#1d2026]">Notification preferences</h2>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-[#6e7485]">
                      Email notices and course update controls are still pending implementation.
                    </p>
                    <div className="mt-6 border border-[#e9eaf0] bg-[#f5f7fa] px-4 py-4">
                      <p className="text-sm font-semibold text-[#1d2026]">Course updates</p>
                      <p className="mt-1 text-sm text-[#6e7485]">Get notified when lessons or content change.</p>
                    </div>
                  </div>

                  <div className="border border-[#e9eaf0] bg-white p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex size-12 items-center justify-center bg-[#fff2e5] text-[#ff6636]">
                        <Shield className="size-5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c94a3]">Security</p>
                        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#1d2026]">Account security</h2>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-[#6e7485]">
                      Password rotation, two-factor auth, and privacy controls are not exposed here yet.
                    </p>
                    <div className="mt-6 space-y-3">
                      <div className="border border-[#e9eaf0] bg-[#f5f7fa] px-4 py-4">
                        <p className="text-sm font-semibold text-[#1d2026]">Change password</p>
                        <p className="mt-1 text-sm text-[#6e7485]">Update your current login credentials.</p>
                      </div>
                      <div className="border border-[#e9eaf0] bg-[#f5f7fa] px-4 py-4">
                        <p className="text-sm font-semibold text-[#1d2026]">Two-factor authentication</p>
                        <p className="mt-1 text-sm text-[#6e7485]">Add a second verification step to your account.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </ProfileShell>
  );
}
