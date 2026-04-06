import { NextRequest, NextResponse } from "next/server";
import { getS3PublicUrl } from "@/lib/s3-utils";

/**
 * Image proxy endpoint to serve course images through Next.js server
 * This avoids CORS issues when loading images from Supabase Storage
 * Route: /api/images/proxy/[key]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  try {
    const { key } = await params;
    const imageKey = decodeURIComponent(key);

    if (!imageKey) {
      return NextResponse.json(
        { error: "Missing image key parameter" },
        { status: 400 },
      );
    }

    // Get the public S3 URL
    const s3Url = getS3PublicUrl(imageKey);

    // Fetch the image from Supabase Storage
    const imageResponse = await fetch(s3Url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      // Cache for 7 days
      cache: "force-cache",
    });

    if (!imageResponse.ok) {
      console.error("Failed to fetch image from S3:", {
        status: imageResponse.status,
        key: imageKey,
        url: s3Url,
      });
      return NextResponse.json(
        { error: "Failed to load image" },
        { status: 404 },
      );
    }

    const buffer = await imageResponse.arrayBuffer();
    const contentType =
      imageResponse.headers.get("content-type") || "image/jpeg";

    // Return the image with proper cache headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=604800, immutable", // 7 days
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      },
    });
  } catch (error) {
    console.error("Image proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  try {
    const { key } = await params;
    const imageKey = decodeURIComponent(key);

    if (!imageKey) {
      return NextResponse.json(
        { error: "Missing image key parameter" },
        { status: 400 },
      );
    }

    const s3Url = getS3PublicUrl(imageKey);
    const imageResponse = await fetch(s3Url, {
      method: "HEAD",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const contentType =
      imageResponse.headers.get("content-type") || "image/jpeg";

    return new NextResponse(null, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=604800, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Image proxy HEAD error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
