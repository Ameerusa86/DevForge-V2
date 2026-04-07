import { NextRequest, NextResponse } from "next/server";
import { headStorageImage, getStorageImage } from "@/lib/server-s3-image";

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

    const image = await getStorageImage(imageKey);

    if (!image) {
      return NextResponse.json(
        { error: "Failed to load image" },
        { status: 404 },
      );
    }

    // Return the image with proper cache headers
    return new NextResponse(image.bytes, {
      status: 200,
      headers: {
        "Content-Type": image.contentType,
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

    const image = await headStorageImage(imageKey);

    if (!image) {
      return NextResponse.json(
        { error: "Failed to load image" },
        { status: 404 },
      );
    }

    return new NextResponse(null, {
      status: 200,
      headers: {
        "Content-Type": image.contentType,
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
