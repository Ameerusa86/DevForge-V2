"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Send,
  MessageCircle,
  MessageSquare,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { getInitials } from "@/lib/learner-ui";
import { getProxiedImageUrl } from "@/lib/s3-utils";

interface QuestionUser {
  id: string;
  name: string;
  image: string | null;
}

interface Answer {
  id: string;
  body: string;
  isAccepted: boolean;
  createdAt: string;
  user: QuestionUser;
}

interface Question {
  id: string;
  title: string;
  body: string | null;
  createdAt: string;
  user: QuestionUser;
  answers: Answer[];
}

interface LessonQAProps {
  lessonId: string;
  isEnrolled: boolean;
}

export function LessonQA({ lessonId, isEnrolled }: LessonQAProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expandedAnswer, setExpandedAnswer] = useState<string | null>(null);
  const [answerBodies, setAnswerBodies] = useState<Record<string, string>>({});
  const [newQuestion, setNewQuestion] = useState("");
  const [newQuestionBody, setNewQuestionBody] = useState("");
  const { data: session } = authClient.useSession();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/lessons/${lessonId}/questions`, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        setQuestions(data);
      } catch (error) {
        console.error("Failed to load questions:", error);
        toast.error("Failed to load lesson Q&A");
      } finally {
        setLoading(false);
      }
    };

    void fetchQuestions();
  }, [lessonId]);

  const handlePostQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) {
      toast.error("Please enter a question");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/lessons/${lessonId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newQuestion.trim(),
          body: newQuestionBody.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to post");
      }

      const newQ = await response.json();
      setQuestions((prev) => [newQ, ...prev]);
      setNewQuestion("");
      setNewQuestionBody("");
      toast.success("Question posted!");
    } catch (error) {
      console.error("Failed to post question:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to post question",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostAnswer = async (questionId: string, e: React.FormEvent) => {
    e.preventDefault();
    const body = answerBodies[questionId]?.trim();
    if (!body) {
      toast.error("Please enter an answer");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/lessons/${lessonId}/questions/${questionId}/answers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to post");
      }

      const newAnswer = await response.json();
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId
            ? { ...q, answers: [...q.answers, newAnswer] }
            : q,
        ),
      );
      setAnswerBodies((prev) => ({ ...prev, [questionId]: "" }));
      setExpandedAnswer(null);
      toast.success("Reply posted!");
    } catch (error) {
      console.error("Failed to post answer:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to post answer",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-xs font-semibold text-muted-foreground">
        <Loader2 className="size-4 animate-spin text-[#ff6636]" />
        <span>Loading Q&amp;A…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4 text-[#ff6636]" />
          <span className="text-xs font-extrabold text-foreground">
            {questions.length} Question{questions.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* New Question Form */}
      {isEnrolled && session?.user ? (
        <form
          onSubmit={handlePostQuestion}
          className="space-y-3 rounded-2xl border border-border bg-muted/20 p-3.5"
        >
          <Input
            placeholder="Ask a question about this lesson…"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            disabled={submitting}
            className="h-9 rounded-xl border-border bg-background text-xs font-medium"
          />
          <Textarea
            placeholder="Add context or code details (optional)…"
            value={newQuestionBody}
            onChange={(e) => setNewQuestionBody(e.target.value)}
            disabled={submitting}
            className="rounded-xl border-border bg-background text-xs font-medium resize-none"
            rows={2}
          />
          <Button
            type="submit"
            size="sm"
            disabled={submitting || !newQuestion.trim()}
            className="w-full gap-1.5 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] text-white text-xs font-bold"
          >
            <Send className="size-3.5" />
            {submitting ? "Posting…" : "Post Question"}
          </Button>
        </form>
      ) : (
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-3.5 text-xs">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="font-medium text-foreground/90 leading-relaxed">
            Enroll in this course to ask questions and reply to learners.
          </p>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-3">
        {questions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center space-y-2">
            <MessageCircle className="mx-auto size-7 text-muted-foreground/50" />
            <p className="text-xs font-semibold text-muted-foreground">
              No questions yet. Be the first to start a discussion!
            </p>
          </div>
        ) : (
          questions.map((question) => {
            const qAvatar = question.user.image
              ? getProxiedImageUrl(question.user.image)
              : undefined;

            return (
              <div
                key={question.id}
                className="space-y-3 rounded-2xl border border-border bg-background p-4"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar className="size-7 shrink-0 border border-border">
                    <AvatarImage src={qAvatar} alt={question.user.name} />
                    <AvatarFallback className="bg-[#ff6636]/10 text-[10px] font-bold text-[#ff6636]">
                      {getInitials(question.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground truncate">
                      {question.user.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(question.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-foreground leading-snug">
                    {question.title}
                  </h4>
                  {question.body && (
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {question.body}
                    </p>
                  )}
                </div>

                {/* Answers */}
                <div className="space-y-2.5 border-t border-border/60 pt-3">
                  <p className="text-[11px] font-bold text-muted-foreground">
                    {question.answers.length} repl
                    {question.answers.length === 1 ? "y" : "ies"}
                  </p>

                  {question.answers.map((answer) => {
                    const aAvatar = answer.user.image
                      ? getProxiedImageUrl(answer.user.image)
                      : undefined;

                    return (
                      <div
                        key={answer.id}
                        className="space-y-1.5 rounded-xl border border-border/60 bg-muted/25 p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar className="size-5 shrink-0">
                              <AvatarImage
                                src={aAvatar}
                                alt={answer.user.name}
                              />
                              <AvatarFallback className="bg-[#ff6636]/10 text-[9px] font-bold text-[#ff6636]">
                                {getInitials(answer.user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-[11px] font-bold text-foreground truncate">
                              {answer.user.name}
                            </span>
                          </div>
                          {answer.isAccepted && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="size-2.5" /> Accepted
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-foreground/90 leading-relaxed">
                          {answer.body}
                        </p>
                      </div>
                    );
                  })}

                  {isEnrolled && session?.user ? (
                    expandedAnswer === question.id ? (
                      <form
                        onSubmit={(e) => handlePostAnswer(question.id, e)}
                        className="space-y-2 pt-1"
                      >
                        <Textarea
                          placeholder="Write your reply…"
                          value={answerBodies[question.id] || ""}
                          onChange={(e) =>
                            setAnswerBodies((prev) => ({
                              ...prev,
                              [question.id]: e.target.value,
                            }))
                          }
                          disabled={submitting}
                          className="rounded-xl border-border bg-background text-xs resize-none"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            size="sm"
                            disabled={
                              submitting || !answerBodies[question.id]?.trim()
                            }
                            className="rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] text-white text-xs font-bold gap-1.5"
                          >
                            <Send className="size-3" /> Reply
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setExpandedAnswer(null)}
                            disabled={submitting}
                            className="rounded-xl text-xs font-bold"
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setExpandedAnswer(question.id)}
                        className="text-xs font-bold text-[#ff6636] hover:underline"
                      >
                        Reply to question
                      </button>
                    )
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
