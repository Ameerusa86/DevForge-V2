/**
 * Constructs a public URL for an S3/Tigris object
 * @param keyOrUrl - Either just the S3 key or a full URL
 * @returns Full public URL to access the object
 */
export function getS3PublicUrl(keyOrUrl: string): string {
  if (!keyOrUrl) return "";

  // If it's a data URL (base64), return as-is for preview
  if (keyOrUrl.startsWith("data:")) {
    return keyOrUrl;
  }

  // If it's already a full HTTP(S) URL, try to normalize bucket URLs so
  // expiring presigned links still render. Otherwise return as-is for external URLs.
  if (keyOrUrl.startsWith("http://") || keyOrUrl.startsWith("https://")) {
    try {
      const url = new URL(keyOrUrl);
      const bucketName =
        process.env.NEXT_PUBLIC_AWS_BUCKET_NAME || "learnhub-lms";

      if (url.hostname.includes(bucketName)) {
        const key = url.pathname.replace(/^\//, "");
        return `https://${bucketName}.t3.storage.dev/${key}`;
      }
    } catch (_err) {
      // fall through
    }
    return keyOrUrl;
  }

  // Otherwise construct the Tigris URL from the key
  const bucketName = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME || "learnhub-lms";
  // Use bucket subdomain style: https://<bucket>.t3.storage.dev/<key>
  return `https://${bucketName}.t3.storage.dev/${keyOrUrl}`;
}

/**
 * Get a proxied image URL through Next.js to avoid CORS issues
 * @param keyOrUrl - Either just the S3 key or a full URL
 * @returns URL that serves the image through /api/images/proxy/[key]
 */
export function getProxiedImageUrl(keyOrUrl: string): string {
  if (!keyOrUrl) return "";

  // If it's a data URL, return as-is
  if (keyOrUrl.startsWith("data:")) {
    return keyOrUrl;
  }

  // If it's already a proxied URL, return as-is
  if (keyOrUrl.includes("/api/images/proxy")) {
    return keyOrUrl;
  }

  // Extract just the key if it's a full URL
  let key = keyOrUrl;
  if (keyOrUrl.startsWith("http://") || keyOrUrl.startsWith("https://")) {
    const extractedKey = getS3KeyFromUrl(keyOrUrl);
    if (extractedKey) {
      key = extractedKey;
    } else {
      // For external URLs, return as-is
      return keyOrUrl;
    }
  }

  // Return proxied URL with encoded key as path parameter
  return `/api/images/proxy/${encodeURIComponent(key)}`;
}

/**
 * Extract the object key from a Tigris/S3 URL. Returns the input if it already
 * looks like a key. Returns null for data URLs or external URLs.
 */
export function getS3KeyFromUrl(keyOrUrl: string): string | null {
  if (!keyOrUrl || keyOrUrl.startsWith("data:")) {
    return null;
  }

  // If the caller already passed a bare key, use it as-is.
  if (!keyOrUrl.startsWith("http://") && !keyOrUrl.startsWith("https://")) {
    return keyOrUrl;
  }

  try {
    const url = new URL(keyOrUrl);
    const bucketName =
      process.env.NEXT_PUBLIC_AWS_BUCKET_NAME || "learnhub-lms";

    // Only treat URLs that point at our bucket as deletable; ignore external images
    // to avoid accidental deletes.
    if (!url.hostname.includes(bucketName)) {
      return null;
    }

    const key = url.pathname.replace(/^\//, "");
    return key || null;
  } catch (_error) {
    return null;
  }
}
