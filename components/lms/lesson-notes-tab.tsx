"use client";

import { useState, useEffect } from "react";
import { Download, Trash2, Eye, Edit3, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function LessonNotesTab({
  lessonId,
  lessonTitle,
}: {
  lessonId: string;
  lessonTitle: string;
}) {
  const storageKey = `devforge:notes:${lessonId}`;
  const [notes, setNotes] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Sync state when lessonId changes
  useEffect(() => {
    let initialSaved = "";
    try {
      initialSaved = localStorage.getItem(storageKey) || "";
    } catch {
      // storage unavailable
    }
    // Update notes using queueMicrotask or callback to avoid synchronous cascading render warning
    const timer = setTimeout(() => {
      setNotes(initialSaved);
      if (initialSaved) {
        setLastSaved(new Date());
      } else {
        setLastSaved(null);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [storageKey]);

  // Save to local storage
  const handleNoteChange = (text: string) => {
    setNotes(text);
    try {
      localStorage.setItem(storageKey, text);
      setLastSaved(new Date());
    } catch {
      // ignore
    }
  };

  const handleDownload = () => {
    if (!notes.trim()) {
      toast.error("Notes are empty.");
      return;
    }
    const blob = new Blob(
      [`# Notes for: ${lessonTitle}\n\n${notes}\n\n_Exported from DevForge on ${new Date().toLocaleDateString()}_`],
      { type: "text/markdown;charset=utf-8;" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notes-${lessonTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Notes downloaded as Markdown.");
  };

  const handleClear = () => {
    if (confirm("Are you sure you want to clear your notes for this lesson?")) {
      setNotes("");
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
      setLastSaved(null);
      toast.success("Notes cleared.");
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Header Tools */}
      <div className="flex items-center justify-between border-b border-border pb-2.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
          <FileText className="size-3.5 text-[#ff6636]" />
          <span>Private Notes</span>
          {lastSaved && (
            <span className="text-[10px] text-muted-foreground/70 font-normal">
              (Saved {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPreview(!isPreview)}
            className="h-7 px-2 text-xs rounded-lg font-medium"
          >
            {isPreview ? <Edit3 className="size-3 mr-1" /> : <Eye className="size-3 mr-1" />}
            {isPreview ? "Edit" : "Preview"}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            disabled={!notes.trim()}
            title="Download Notes (.md)"
            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <Download className="size-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            disabled={!notes.trim()}
            title="Clear Notes"
            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Body Area */}
      <div className="flex-1 min-h-[260px] flex flex-col">
        {isPreview ? (
          <div className="flex-1 rounded-xl border border-border bg-muted/20 p-3 text-xs leading-relaxed text-foreground/90 overflow-y-auto whitespace-pre-wrap font-sans">
            {notes.trim() || <span className="text-muted-foreground italic">No notes written yet.</span>}
          </div>
        ) : (
          <Textarea
            value={notes}
            onChange={(e) => handleNoteChange(e.target.value)}
            placeholder="Write key code syntax, concepts, or questions for this lesson (auto-saved in your browser)..."
            className="flex-1 min-h-[260px] resize-none rounded-xl border-border bg-card p-3 text-xs font-mono leading-relaxed placeholder:font-sans placeholder:text-muted-foreground focus:border-[#ff6636]/50 focus:outline-none"
          />
        )}
      </div>

      <div className="text-[10px] text-muted-foreground/80 font-medium">
        💡 Notes are stored safely in your browser and will persist across sessions.
      </div>
    </div>
  );
}
