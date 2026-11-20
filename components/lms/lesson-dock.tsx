"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  FileText,
  Keyboard,
  LayoutDashboard,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { LessonQA } from "@/components/lms/lesson-qa";
import { LessonNotesTab } from "@/components/lms/lesson-notes-tab";
import { cn } from "@/lib/utils";

interface LessonDockProps {
  lessonId: string;
  lessonTitle: string;
  courseSlug?: string;
  courseTitle?: string;
  basePath?: string;
  isEnrolled: boolean;
}

export function LessonDock({
  lessonId,
  lessonTitle,
  courseSlug,
  courseTitle,
  basePath = "/courses",
  isEnrolled,
}: LessonDockProps) {
  const [activeTab, setActiveTab] = useState<"qa" | "notes" | "guide">("qa");

  return (
    <div className="flex flex-col h-full bg-card border-l border-border select-none">
      {/* Dock Tabs Header */}
      <div className="border-b border-border p-2.5 bg-muted/25">
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted/70 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("qa")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-all",
              activeTab === "qa"
                ? "bg-card text-[#ff6636] shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <MessageSquare className="size-3.5" />
            <span>Q&amp;A</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("notes")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-all",
              activeTab === "notes"
                ? "bg-card text-[#ff6636] shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <FileText className="size-3.5" />
            <span>Notes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("guide")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-all",
              activeTab === "guide"
                ? "bg-card text-[#ff6636] shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Sparkles className="size-3.5" />
            <span>Guide</span>
          </button>
        </div>
      </div>

      {/* Dock Body */}
      <div className="flex-1 overflow-y-auto p-4 select-text">
        {activeTab === "qa" && (
          <div className="space-y-4">
            <div className="border-b border-border pb-2.5">
              <h3 className="text-xs font-extrabold text-foreground">
                Lesson Q&amp;A
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Ask questions or share solutions for this lesson
              </p>
            </div>
            <LessonQA lessonId={lessonId} isEnrolled={isEnrolled} />
          </div>
        )}

        {activeTab === "notes" && (
          <LessonNotesTab lessonId={lessonId} lessonTitle={lessonTitle} />
        )}

        {activeTab === "guide" && (
          <div className="space-y-4">
            <div className="border-b border-border pb-2.5">
              <h3 className="text-xs font-extrabold text-foreground">
                Study &amp; Navigation Guide
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {courseTitle || "Classroom shortcuts and quick links"}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-muted/20 p-3.5 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-extrabold text-[#ff6636]">
                <Keyboard className="size-3.5" />
                <span>Keyboard Shortcuts</span>
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Next lesson</span>
                  <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] font-bold text-foreground">
                    Shift + N
                  </kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span>Previous lesson</span>
                  <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] font-bold text-foreground">
                    Shift + P
                  </kbd>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-muted/20 p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3.5" />
                <span>Completion Tip</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Complete every lesson and quiz in the syllabus to unlock your
                verified DevForge certificate automatically.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              {courseSlug && (
                <Link
                  href={`${basePath}/${courseSlug}`}
                  className="flex items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-bold text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] transition-colors"
                >
                  <BookOpen className="size-3.5 text-[#ff6636]" />
                  <span>
                    {basePath === "/projects"
                      ? "Project Overview & Reviews"
                      : "Course Syllabus & Reviews"}
                  </span>
                </Link>
              )}
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-bold text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] transition-colors"
              >
                <LayoutDashboard className="size-3.5 text-[#ff6636]" />
                <span>Learner Dashboard</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
