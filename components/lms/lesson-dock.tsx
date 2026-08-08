"use client";

import { useState } from "react";
import { MessageSquare, FileText, FolderDown, Sparkles, Code2, ExternalLink, CheckCircle2 } from "lucide-react";
import { LessonQA } from "@/components/lms/lesson-qa";
import { LessonNotesTab } from "@/components/lms/lesson-notes-tab";
import { cn } from "@/lib/utils";

interface LessonDockProps {
  lessonId: string;
  lessonTitle: string;
  courseSlug?: string;
  courseTitle?: string;
  isEnrolled: boolean;
  enrollmentId?: string;
}

export function LessonDock({
  lessonId,
  lessonTitle,
  isEnrolled,
  enrollmentId,
}: LessonDockProps) {
  const [activeTab, setActiveTab] = useState<"qa" | "notes" | "resources" | "tips">("qa");

  return (
    <div className="flex flex-col h-full bg-card border-l border-border select-none">
      {/* Dock Tabs Header */}
      <div className="border-b border-border p-2 bg-muted/30">
        <div className="grid grid-cols-4 gap-1 rounded-xl bg-muted/60 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("qa")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-all",
              activeTab === "qa"
                ? "bg-card text-[#ff6636] shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Q&A Discussion"
          >
            <MessageSquare className="size-3.5" />
            <span className="hidden sm:inline">Q&A</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("notes")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-all",
              activeTab === "notes"
                ? "bg-card text-[#ff6636] shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Private Notes"
          >
            <FileText className="size-3.5" />
            <span className="hidden sm:inline">Notes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("resources")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-all",
              activeTab === "resources"
                ? "bg-card text-[#ff6636] shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Files & Resources"
          >
            <FolderDown className="size-3.5" />
            <span className="hidden sm:inline">Files</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tips")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-all",
              activeTab === "tips"
                ? "bg-card text-[#ff6636] shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Study Insights"
          >
            <Sparkles className="size-3.5" />
            <span className="hidden sm:inline">Tips</span>
          </button>
        </div>
      </div>

      {/* Dock Body */}
      <div className="flex-1 overflow-y-auto p-4 select-text">
        {activeTab === "qa" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div>
                <h4 className="text-xs font-bold text-foreground">Community Discussion</h4>
                <p className="text-[10px] text-muted-foreground">Ask questions or help peers for this lesson</p>
              </div>
            </div>
            <LessonQA lessonId={lessonId} isEnrolled={isEnrolled} enrollmentId={enrollmentId} />
          </div>
        )}

        {activeTab === "notes" && (
          <LessonNotesTab lessonId={lessonId} lessonTitle={lessonTitle} />
        )}

        {activeTab === "resources" && (
          <div className="space-y-4">
            <div className="border-b border-border pb-2">
              <h4 className="text-xs font-bold text-foreground">Lesson Resources</h4>
              <p className="text-[10px] text-muted-foreground">Reference links, documentation, and exercise files</p>
            </div>

            <div className="space-y-2.5">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/20 p-3 hover:border-[#ff6636]/40 hover:bg-muted/40 transition-all text-xs font-semibold text-foreground group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-[#ff6636]/10 text-[#ff6636]">
                    <Code2 className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate">Starter Repository</p>
                    <p className="text-[10px] text-muted-foreground truncate">GitHub branch for this module</p>
                  </div>
                </div>
                <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-[#ff6636] shrink-0" />
              </a>

              <a
                href="https://nextjs.org/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/20 p-3 hover:border-[#ff6636]/40 hover:bg-muted/40 transition-all text-xs font-semibold text-foreground group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ExternalLink className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate">Official Documentation</p>
                    <p className="text-[10px] text-muted-foreground truncate">API reference & guides</p>
                  </div>
                </div>
                <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
              </a>
            </div>
          </div>
        )}

        {activeTab === "tips" && (
          <div className="space-y-4">
            <div className="border-b border-border pb-2">
              <h4 className="text-xs font-bold text-foreground">Study & Coding Advice</h4>
              <p className="text-[10px] text-muted-foreground">Maximize your retention while learning</p>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#ff6636]">
                  <Sparkles className="size-3.5" />
                  <span>Interactive Practice</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Type out the code examples manually rather than copying and pasting. Muscle memory improves syntax mastery!
                </p>
              </div>

              <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-3.5" />
                  <span>Completion Checklist</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Mark this lesson complete once you can explain the core architecture concept without looking at the notes.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
