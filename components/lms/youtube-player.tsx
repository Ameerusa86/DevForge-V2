"use client";

import { useState } from "react";
import { getYouTubeEmbedUrl, extractYouTubeId } from "@/lib/youtube";
import { ExternalLink, Video } from "lucide-react";
import { cn } from "@/lib/utils";

interface YouTubePlayerProps {
  urlOrId: string;
  title?: string;
  className?: string;
}

export function YouTubePlayer({ urlOrId, title = "Lesson Video", className }: YouTubePlayerProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const embedUrl = getYouTubeEmbedUrl(urlOrId);
  const videoId = extractYouTubeId(urlOrId);

  if (!embedUrl || !videoId) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center text-xs text-destructive">
        <Video className="mb-2 size-8 opacity-60" />
        <p className="font-semibold">Invalid YouTube Video Source</p>
        <p className="text-muted-foreground mt-1 text-[11px]">
          Please check the YouTube URL in the course settings.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full overflow-hidden rounded-2xl border border-border/60 bg-[#0d0f12] shadow-2xl shadow-black/40", className)}>
      {/* Video Header bar */}
      <div className="flex items-center justify-between border-b border-white/5 bg-[#121418] px-4 py-2 text-xs">
        <div className="flex items-center gap-2 font-medium text-foreground/90">
          <span className="flex size-2 rounded-full bg-red-500 animate-pulse" />
          <span className="truncate max-w-[280px] sm:max-w-md font-semibold text-foreground/80">
            {title}
          </span>
        </div>
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-[#ff6636] transition-colors"
        >
          <span>Watch on YouTube</span>
          <ExternalLink className="size-3" />
        </a>
      </div>

      {/* Responsive Aspect Ratio Container */}
      <div className="relative aspect-video w-full bg-black">
        {!isLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
            <div className="size-8 rounded-full border-2 border-[#ff6636] border-t-transparent animate-spin mb-2" />
            <span className="text-[11px] text-muted-foreground font-medium">Loading video stream...</span>
          </div>
        )}
        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onLoad={() => setIsLoaded(true)}
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    </div>
  );
}
