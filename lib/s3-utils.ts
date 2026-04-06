/**
 * Constructs a public URL for an S3-compatible object in Supabase Storage.
 * @param keyOrUrl - Either just the S3 key or a full URL
 * @returns Full public URL to access the object
 */
export function getS3PublicUrl(keyOrUrl: string): string {
  if (!keyOrUrl) return "";

  // If it's a data URL (base64), return as-is for preview
  if (keyOrUrl.startsWith("data:")) {
    return keyOrUrl;
  }

  const publicBase = getSupabasePublicBaseUrl();

  // If it's already a full HTTP(S) URL, normalize our own storage URLs so
  // expiring signed links still render. Otherwise return as-is for external URLs.
  if (keyOrUrl.startsWith("http://") || keyOrUrl.startsWith("https://")) {
    try {
      const key = getS3KeyFromUrl(keyOrUrl);
      if (key && publicBase) {
        return `${publicBase}/${key}`;
      }
    } catch (_err) {
      // fall through
    }
    return keyOrUrl;
  }

  // Otherwise construct the Supabase public object URL from the key.
  return publicBase ? `${publicBase}/${keyOrUrl}` : keyOrUrl;
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
 * Extract the object key from a Supabase Storage/S3 URL. Returns the input if it already
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
    const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET;
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;

    if (!bucketName || !supabaseUrl) {
      return null;
    }

    const normalizedSupabaseHost = new URL(supabaseUrl).hostname;
    if (url.hostname !== normalizedSupabaseHost) {
      return null;
    }

    const publicPrefix = `/storage/v1/object/public/${bucketName}/`;
    const signedPrefix = `/storage/v1/object/sign/${bucketName}/`;

    if (url.pathname.startsWith(publicPrefix)) {
      const key = url.pathname.slice(publicPrefix.length);
      return key || null;
    }

    if (url.pathname.startsWith(signedPrefix)) {
      const key = url.pathname.slice(signedPrefix.length);
      return key || null;
    }

    return null;
  } catch (_error) {
    return null;
  }
}

function getSupabasePublicBaseUrl(): string {
  const projectUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET;

  if (!projectUrl || !bucketName) return "";

  const base = projectUrl.replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/${bucketName}`;
}
