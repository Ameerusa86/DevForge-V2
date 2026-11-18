"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Award,
  Check,
  CheckCircle2,
  Download,
  Loader2,
  Printer,
  Share2,
  ShieldCheck,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";

import {
  LearnerPageShell,
  LearnerWorkspaceNav,
} from "@/components/lms/learner-workspace-nav";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDuration } from "@/lib/learner-ui";

interface CertificateData {
  enrollmentId: string;
  courseSlug?: string;
  courseTitle: string;
  courseCategory?: string;
  courseLevel?: string;
  durationMinutes?: number | null;
  totalLessons?: number;
  userName: string;
  completedAt: string;
  instructorName: string;
  certificateId: string;
}

export default function CertificateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const enrollmentId = params?.enrollmentId as string;

  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const res = await fetch(`/api/certificates/${enrollmentId}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const errorMsg = errorData?.error || `HTTP ${res.status}`;

          if (res.status === 401) {
            router.replace("/login");
            return;
          }
          if (res.status === 404) {
            toast.error("Certificate not found");
            router.push("/certificates");
            return;
          }
          if (res.status === 400) {
            toast.error("Course must be 100% complete to generate certificate");
            router.push("/my-courses");
            return;
          }
          if (res.status === 403) {
            toast.error("Not authorized to view this certificate");
            router.push("/certificates");
            return;
          }
          throw new Error(errorMsg);
        }
        const data = await res.json();
        setCertificate(data);
      } catch (error) {
        console.error("Error fetching certificate:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        toast.error(`Failed to load certificate: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    if (enrollmentId) {
      void fetchCertificate();
    }
  }, [enrollmentId, router]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const certificateElement = document.getElementById("certificate-content");
      if (!certificateElement) throw new Error("Certificate element not found");

      const canvas = await html2canvas(certificateElement, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
      });

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 0, 297, 210);
      const safeFilename = (certificate?.courseTitle || "devforge")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      pdf.save(`${safeFilename}-certificate.pdf`);

      toast.success("Certificate downloaded successfully!");
    } catch (error) {
      console.error("Error downloading certificate:", error);
      toast.error("Failed to download PDF certificate.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!certificate) return;
    const shareUrl = window.location.href;
    const shareTitle = `${certificate.courseTitle} — DevForge Certificate`;
    const shareText = `I earned a DevForge Certificate of Completion for "${certificate.courseTitle}" (${certificate.certificateId})!`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Certificate verification link copied!");
      setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("Failed to copy link.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <LearnerPageShell activePath="/certificates">
        <section className="border-b border-border/40 bg-[#fff9f7] dark:bg-[#111318] py-10">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 space-y-6">
            <Skeleton className="h-11 w-full max-w-xl rounded-2xl" />
            <Skeleton className="h-10 w-72 rounded-xl" />
          </div>
        </section>
        <section className="mx-auto max-w-5xl px-4 py-10">
          <Skeleton className="h-[460px] w-full rounded-3xl" />
        </section>
      </LearnerPageShell>
    );
  }

  if (!certificate) {
    return (
      <LearnerPageShell activePath="/certificates">
        <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center space-y-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-[#ff6636]/10 text-[#ff6636]">
            <Award className="size-7" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground">
            Certificate not found
          </h1>
          <p className="text-sm font-semibold text-muted-foreground">
            This credential may not exist or belongs to another account.
          </p>
          <Button
            onClick={() => router.push("/certificates")}
            className="rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] text-white font-bold"
          >
            Back to Certificates
          </Button>
        </div>
      </LearnerPageShell>
    );
  }

  const formattedDate = new Date(certificate.completedAt).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  return (
    <LearnerPageShell activePath="/certificates">
      {/* ── Hero Header ─────────────────────────────────────────────────────── */}
      <section className="print:hidden relative overflow-hidden border-b border-border/40 bg-[#fff9f7] dark:bg-[#111318] py-8 lg:py-12">
        <div className="pointer-events-none absolute -top-40 right-0 size-[460px] rounded-full bg-[#ff6636]/5 blur-3xl" />

        <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 relative space-y-6">
          <LearnerWorkspaceNav activePath="/certificates" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  href="/certificates"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] transition-colors"
                >
                  <ArrowLeft className="size-3.5" /> All Certificates
                </Link>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="size-3.5" /> {certificate.certificateId}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
                Certificate of{" "}
                <span className="bg-gradient-to-r from-[#ff6636] to-[#ff9f60] bg-clip-text text-transparent">
                  Completion
                </span>
              </h1>
              <p className="text-sm font-semibold text-muted-foreground">
                Awarded to{" "}
                <span className="text-foreground font-bold">
                  {certificate.userName}
                </span>{" "}
                for completing{" "}
                <span className="text-foreground font-bold">
                  {certificate.courseTitle}
                </span>
                .
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                className="rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] text-white font-bold text-xs px-5 h-10 gap-2 shadow-md shadow-[#ff6636]/20"
              >
                {isDownloading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                {isDownloading ? "Generating PDF…" : "Download PDF"}
              </Button>
              <Button
                variant="outline"
                onClick={handlePrint}
                className="rounded-xl border-border bg-card font-bold text-xs px-4 h-10 gap-2"
              >
                <Printer className="size-4" />
                Print
              </Button>
              <Button
                variant="outline"
                onClick={handleShare}
                className="rounded-xl border-border bg-card font-bold text-xs px-4 h-10 gap-2"
              >
                {copied ? (
                  <Check className="size-4 text-emerald-500" />
                ) : (
                  <Share2 className="size-4" />
                )}
                {copied ? "Copied" : "Share"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Certificate Canvas ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1120px] px-4 sm:px-6 lg:px-8 py-10 lg:py-14 space-y-8">
        <div className="rounded-3xl border border-border bg-card p-2 sm:p-3 shadow-xl">
          {/*
            Override Tailwind v4 oklch CSS vars inside #certificate-content with hex
            so html2canvas v1.4.1 renders without oklch color parsing errors.
          */}
          <div
            id="certificate-content"
            style={
              {
                backgroundColor: "#ffffff",
                color: "#1d2026",
                borderColor: "#f0e2da",
                "--background": "#ffffff",
                "--foreground": "#1d2026",
                "--card": "#ffffff",
                "--card-foreground": "#1d2026",
                "--border": "#e9eaf0",
                "--ring": "#ff6636",
                "--primary": "#ff6636",
                "--muted-foreground": "#6e7485",
              } as React.CSSProperties
            }
            className="relative overflow-hidden rounded-2xl border-2 p-8 sm:p-12 md:p-16 text-center"
          >
            {/* Inner ornamental frame */}
            <div
              className="pointer-events-none absolute inset-3 sm:inset-5 rounded-xl border"
              style={{ borderColor: "#f6d5c6" }}
            />
            <div
              className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full"
              style={{ backgroundColor: "rgba(255, 102, 54, 0.08)" }}
            />
            <div
              className="pointer-events-none absolute -bottom-24 -left-24 size-72 rounded-full"
              style={{ backgroundColor: "rgba(86, 79, 253, 0.06)" }}
            />

            <div className="relative z-10 space-y-8">
              {/* Top Brand & Seal */}
              <div className="flex flex-col items-center space-y-3">
                <div
                  className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.22em]"
                  style={{
                    backgroundColor: "#fff1eb",
                    color: "#ff6636",
                    border: "1px solid #ffd5c2",
                  }}
                >
                  <Award className="size-4" style={{ color: "#ff6636" }} />
                  DevForge Academy
                </div>
                <p
                  className="text-xs font-bold uppercase tracking-[0.28em]"
                  style={{ color: "#6e7485" }}
                >
                  Certificate of Completion
                </p>
                <div
                  className="h-1 w-20 rounded-full"
                  style={{ backgroundColor: "#ff6636" }}
                />
              </div>

              {/* Recipient & Course */}
              <div className="space-y-5">
                <p
                  className="text-sm font-medium"
                  style={{ color: "#6e7485" }}
                >
                  This certifies that
                </p>
                <h2
                  className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight"
                  style={{ color: "#1d2026" }}
                >
                  {certificate.userName}
                </h2>

                <p
                  className="text-sm font-medium pt-2"
                  style={{ color: "#6e7485" }}
                >
                  has successfully completed all lessons and requirements of
                </p>

                <p
                  className="text-xl sm:text-2xl md:text-3xl font-extrabold leading-snug max-w-2xl mx-auto"
                  style={{ color: "#ff6636" }}
                >
                  {certificate.courseTitle}
                </p>

                {(certificate.totalLessons || certificate.durationMinutes) && (
                  <p
                    className="text-xs font-semibold"
                    style={{ color: "#6e7485" }}
                  >
                    {certificate.totalLessons
                      ? `${certificate.totalLessons} Lessons Completed`
                      : ""}
                    {certificate.totalLessons && certificate.durationMinutes
                      ? " · "
                      : ""}
                    {certificate.durationMinutes
                      ? `${formatDuration(certificate.durationMinutes)} Curriculum`
                      : ""}
                  </p>
                )}
              </div>

              {/* Footer Signatures & Metadata */}
              <div
                className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 mt-8 border-t text-center"
                style={{ borderColor: "#e9eaf0" }}
              >
                <div className="space-y-1">
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: "#8c94a3" }}
                  >
                    Instructor
                  </p>
                  <p
                    className="text-sm font-extrabold"
                    style={{ color: "#1d2026" }}
                  >
                    {certificate.instructorName}
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <div
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold"
                    style={{
                      backgroundColor: "#ecfdf5",
                      color: "#059669",
                      border: "1px solid #a7f3d0",
                    }}
                  >
                    <CheckCircle2 className="size-3.5" /> Verified Credential
                  </div>
                </div>

                <div className="space-y-1">
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: "#8c94a3" }}
                  >
                    Date Issued
                  </p>
                  <p
                    className="text-sm font-extrabold"
                    style={{ color: "#1d2026" }}
                  >
                    {formattedDate}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <p
                  className="text-[11px] font-mono font-semibold"
                  style={{ color: "#8c94a3" }}
                >
                  Credential ID: {certificate.certificateId}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Footer Card */}
        <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border bg-card p-6">
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-foreground">
              Credential Verification
            </h3>
            <p className="text-xs font-medium text-muted-foreground leading-relaxed max-w-2xl">
              This certificate verifies 100% completion of{" "}
              <span className="font-bold text-foreground">
                {certificate.courseTitle}
              </span>{" "}
              and is permanently recorded on your DevForge learning profile.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 shrink-0">
            {certificate.courseSlug && (
              <Link
                href={`/courses/${certificate.courseSlug}`}
                className="inline-flex items-center rounded-xl border border-border bg-background px-4 py-2 text-xs font-bold text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] transition-colors"
              >
                View Course
              </Link>
            )}
            <Link
              href="/my-courses"
              className="inline-flex items-center rounded-xl bg-muted px-4 py-2 text-xs font-bold text-foreground hover:bg-muted/80 transition-colors"
            >
              My Courses
            </Link>
          </div>
        </div>
      </section>
    </LearnerPageShell>
  );
}
