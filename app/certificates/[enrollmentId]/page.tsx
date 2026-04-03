"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { toast } from "sonner";
import { ArrowLeft, Download, Share2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface CertificateData {
  enrollmentId: string;
  courseTitle: string;
  userName: string;
  completedAt: string;
  instructorName: string;
  certificateId: string;
}

export default function CertificatePage() {
  const params = useParams();
  const router = useRouter();
  const enrollmentId = params?.enrollmentId as string;

  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const res = await fetch(`/api/certificates/${enrollmentId}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const errorMsg = errorData?.error || `HTTP ${res.status}`;
          console.error(`Certificate fetch failed: ${errorMsg}`);

          if (res.status === 404) {
            toast.error("Certificate not found");
            router.push("/my-courses");
            return;
          }
          if (res.status === 400) {
            toast.error("Course must be 100% complete to generate certificate");
            router.push(`/courses`);
            return;
          }
          if (res.status === 403) {
            toast.error("Not authorized to view this certificate");
            router.push("/dashboard");
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
      fetchCertificate();
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
      });

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 0, 297, 210);
      pdf.save(
        `${certificate?.courseTitle.replace(/\s+/g, "-")}-certificate.pdf`
      );

      toast.success("Certificate downloaded successfully!");
    } catch (error) {
      console.error("Error downloading certificate:", error);
      toast.error("Failed to download certificate");
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-4xl mx-auto px-4 py-10 space-y-6">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-96 w-full" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
          <p className="text-lg font-semibold">Certificate not found</p>
          <Button onClick={() => router.push("/my-courses")}>
            Back to My Courses
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const completedDate = new Date(certificate.completedAt);
  const formattedDate = completedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 bg-gradient-to-br from-primary/5 via-background to-accent/5 py-10">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => router.push("/my-courses")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">
              Course Completion Certificate
            </h1>
            <div />
          </div>

          {/* Certificate Display */}
          <Card className="shadow-xl overflow-hidden">
            <div
              id="certificate-content"
              className="bg-white p-12 text-center space-y-6 relative overflow-hidden"
            >
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-accent/5 rounded-full -ml-20 -mb-20" />

              <div className="relative z-10">
                {/* Header */}
                <div className="space-y-2 mb-8">
                  <p className="text-sm tracking-widest text-muted-foreground uppercase">
                    Certificate of Completion
                  </p>
                  <div className="h-1 w-16 bg-primary mx-auto rounded-full" />
                </div>

                {/* Main content */}
                <div className="space-y-6">
                  <div>
                    <p className="text-muted-foreground mb-2">
                      This is to certify that
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {certificate.userName}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-muted-foreground">
                      has successfully completed the course
                    </p>
                    <p className="text-2xl font-semibold text-primary">
                      {certificate.courseTitle}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-8 pt-4">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Instructor
                      </p>
                      <p className="text-sm font-semibold">
                        {certificate.instructorName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="text-sm font-semibold">{formattedDate}</p>
                    </div>
                  </div>

                  {/* Certificate ID */}
                  <div className="pt-6 border-t border-muted">
                    <p className="text-xs text-muted-foreground">
                      Certificate ID: {certificate.certificateId}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={handleDownload}
              disabled={isDownloading}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {isDownloading ? "Downloading..." : "Download Certificate"}
            </Button>
            <Button size="lg" variant="outline" className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>

          {/* Info */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                This certificate verifies that you have successfully completed
                all lessons in the {certificate.courseTitle} course. Your
                completion is recorded in your learning profile.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
