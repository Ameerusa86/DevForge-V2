/**
 * Extracts a YouTube Video ID from various URL formats or returns the ID if already clean.
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - Raw 11-character video ID
 */
export function extractYouTubeId(urlOrId?: string | null): string | null {
  if (!urlOrId || typeof urlOrId !== "string") return null;

  const trimmed = urlOrId.trim();
  if (!trimmed) return null;

  // Direct 11-char ID check (standard YouTube video ID)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);

    // youtu.be/VIDEO_ID
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.slice(1).split("/")[0];
      return id && id.length === 11 ? id : null;
    }

    // youtube.com/watch?v=VIDEO_ID
    if (parsed.searchParams.has("v")) {
      const v = parsed.searchParams.get("v");
      return v && v.length === 11 ? v : null;
    }

    // youtube.com/embed/VIDEO_ID or youtube.com/shorts/VIDEO_ID
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    const embedIndex = pathParts.findIndex((p) => p === "embed" || p === "shorts");
    if (embedIndex !== -1 && pathParts[embedIndex + 1]) {
      const id = pathParts[embedIndex + 1];
      return id.length === 11 ? id : null;
    }
  } catch {
    // Regex fallback
    const match = trimmed.match(
      /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Returns a standardized YouTube embed URL with optimal player options.
 */
export function getYouTubeEmbedUrl(urlOrId?: string | null): string | null {
  const id = extractYouTubeId(urlOrId);
  if (!id) return null;
  return `https://www.youtube-nocookie.com/embed/${id}?modestbranding=1&rel=0&playsinline=1`;
}
