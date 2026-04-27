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
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

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
  enrollmentId?: string;
}

export function LessonQA({
  lessonId,
  isEnrolled,
  enrollmentId,
}: LessonQAProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expandedAnswer, setExpandedAnswer] = useState<string | null>(null);
  const [answerBodies, setAnswerBodies] = useState<Record<string, string>>({});
  const [newQuestion, setNewQuestion] = useState("");
  const [newQuestionBody, setNewQuestionBody] = useState("");
  const { data: session } = authClient.useSession();

  // Fetch questions
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/lessons/${lessonId}/questions`);
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        setQuestions(data);
      } catch (error) {
        console.error("Failed to load questions:", error);
        toast.error("Failed to load Q&A");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
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
          title: newQuestion,
          body: newQuestionBody || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to post");
      }

      const newQ = await response.json();
      setQuestions([newQ, ...questions]);
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
      setQuestions(
        questions.map((q) =>
          q.id === questionId
            ? { ...q, answers: [...q.answers, newAnswer] }
            : q,
        ),
      );
      setAnswerBodies({ ...answerBodies, [questionId]: "" });
      setExpandedAnswer(null);
      toast.success("Answer posted!");
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
      <div className="flex items-center justify-center space-x-2 py-8 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        <span>Loading Q&A...</span>
      </div>
    );
  }

  return (
    <section className="space-y-8 border-t border-border pt-8">
      {/* Q&A Header */}
      <div>
        <div className="flex items-center gap-3">
          <MessageSquare className="size-6 text-primary" />
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-foreground">
            Questions & Answers
          </h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {questions.length} question{questions.length !== 1 ? "s" : ""} from
          learners
        </p>
      </div>

      {/* New Question Form (Only for Enrolled) */}
      {isEnrolled && session?.user ? (
        <form
          onSubmit={handlePostQuestion}
          className="space-y-4 rounded-lg border border-border bg-card p-6"
        >
          <div>
            <label className="text-sm font-medium text-foreground">
              Ask a question about this lesson
            </label>
            <Input
              placeholder="What would you like to know?"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              disabled={submitting}
              className="mt-2 border-border bg-background text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">
              Additional details (optional)
            </label>
            <Textarea
              placeholder="Share more context about your question..."
              value={newQuestionBody}
              onChange={(e) => setNewQuestionBody(e.target.value)}
              disabled={submitting}
              className="mt-2 border-border bg-background text-foreground placeholder:text-muted-foreground"
              rows={3}
            />
          </div>
          <Button
            type="submit"
            disabled={submitting || !newQuestion.trim()}
            className="gap-2 rounded-none bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Send className="size-4" />
            {submitting ? "Posting..." : "Post question"}
          </Button>
        </form>
      ) : null}

      {/* Questions List */}
      <div className="space-y-6">
        {questions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
            <MessageCircle className="mx-auto mb-3 size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No questions yet. Be the first to ask!
            </p>
          </div>
        ) : (
          questions.map((question) => (
            <div
              key={question.id}
              className="space-y-4 rounded-lg border border-border bg-card p-6"
            >
              {/* Question Header */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar className="mt-1 size-8 shrink-0">
                    <AvatarImage
                      src={question.user.image || ""}
                      alt={question.user.name}
                    />
                    <AvatarFallback className="text-xs">
                      {question.user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground/75">
                      {question.user.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(question.createdAt).toLocaleDateString()}{" "}
                      {new Date(question.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-foreground">
                  {question.title}
                </h3>
                {question.body && (
                  <p className="text-sm leading-7 text-muted-foreground">
                    {question.body}
                  </p>
                )}
              </div>

              {/* Answers Section */}
              <div className="space-y-4 border-t border-border/30 pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">
                    {question.answers.length} answer
                    {question.answers.length !== 1 ? "s" : ""}
                  </p>
                </div>

                {/* Answers List */}
                {question.answers.length > 0 && (
                  <div className="space-y-3">
                    {question.answers.map((answer) => (
                      <div
                        key={answer.id}
                        className="space-y-2 rounded border border-border/50 bg-muted/30 p-4"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Avatar className="size-6 shrink-0">
                              <AvatarImage
                                src={answer.user.image || ""}
                                alt={answer.user.name}
                              />
                              <AvatarFallback className="text-xs">
                                {answer.user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-foreground/75">
                                {answer.user.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(
                                  answer.createdAt,
                                ).toLocaleDateString()}{" "}
                                {new Date(answer.createdAt).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </p>
                            </div>
                          </div>
                          {answer.isAccepted && (
                            <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                              Accepted
                            </span>
                          )}
                        </div>
                        <p className="text-sm leading-7 text-foreground">
                          {answer.body}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Answer Form (Only for Enrolled) */}
                {isEnrolled && session?.user ? (
                  expandedAnswer === question.id ? (
                    <form
                      onSubmit={(e) => handlePostAnswer(question.id, e)}
                      className="space-y-3 rounded border border-border/50 bg-muted/20 p-4"
                    >
                      <Textarea
                        placeholder="Share your answer..."
                        value={answerBodies[question.id] || ""}
                        onChange={(e) =>
                          setAnswerBodies({
                            ...answerBodies,
                            [question.id]: e.target.value,
                          })
                        }
                        disabled={submitting}
                        className="border-border bg-background text-foreground placeholder:text-muted-foreground"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          size="sm"
                          disabled={
                            submitting || !answerBodies[question.id]?.trim()
                          }
                          className="gap-2 rounded-none bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <Send className="size-3" />
                          Post answer
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setExpandedAnswer(null)}
                          disabled={submitting}
                          className="rounded-none border-border"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setExpandedAnswer(question.id)}
                      className="text-sm font-medium text-primary transition hover:text-primary/80"
                    >
                      Add an answer
                    </button>
                  )
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Not Enrolled Notice */}
      {!isEnrolled && (
        <div className="flex items-start gap-3 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-yellow-600 dark:text-yellow-500" />
          <p className="text-yellow-900 dark:text-yellow-200">
            Enroll in this course to ask questions and share answers with other
            learners.
          </p>
        </div>
      )}
    </section>
  );
}
