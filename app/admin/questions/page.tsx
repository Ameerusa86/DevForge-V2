"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2,
  Loader2,
  MessageCircleQuestion,
  Search,
  Trash2,
} from "lucide-react";

import {
  AdminPage,
  AdminPageHeader,
  AdminPanel,
} from "@/components/admin/admin-page";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

type AdminQuestion = {
  id: string;
  title: string;
  body: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  lesson: {
    id: string;
    title: string;
    order: number;
    course: {
      id: string;
      title: string;
      slug: string;
    };
  };
  answers: Array<{
    id: string;
    body: string;
    isAccepted: boolean;
    createdAt: string;
    user: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    };
  }>;
};

type QuestionsPayload = {
  questions?: AdminQuestion[];
  stats?: {
    totalQuestions: number;
    totalAnswers: number;
    unanswered: number;
    answered: number;
  };
};

export default function AdminQuestionsPage() {
  const { data: session, isPending } = authClient.useSession();

  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [pendingDelete, setPendingDelete] = useState<{
    type: "question" | "answer";
    id: string;
  } | null>(null);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/questions", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load Q&A moderation data");
      }

      const data: QuestionsPayload = await response.json();
      setQuestions(data.questions || []);
    } catch (error) {
      console.error("Failed to load admin questions:", error);
      toast.error("Failed to load Q&A moderation.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session?.user?.id) {
      if (!isPending) {
        setLoading(false);
      }
      return;
    }

    void loadQuestions();
  }, [isPending, session?.user?.id]);

  const courseOptions = useMemo(
    () =>
      Array.from(
        new Map(
          questions.map((question) => [
            question.lesson.course.id,
            question.lesson.course.title,
          ]),
        ).entries(),
      )
        .map(([id, title]) => ({ id, title }))
        .sort((a, b) => a.title.localeCompare(b.title)),
    [questions],
  );

  const filteredQuestions = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();

    return questions.filter((question) => {
      if (
        courseFilter !== "all" &&
        question.lesson.course.id !== courseFilter
      ) {
        return false;
      }

      if (!normalized) {
        return true;
      }

      return (
        question.title.toLowerCase().includes(normalized) ||
        (question.body || "").toLowerCase().includes(normalized) ||
        question.user.name.toLowerCase().includes(normalized) ||
        question.user.email.toLowerCase().includes(normalized) ||
        question.lesson.title.toLowerCase().includes(normalized) ||
        question.lesson.course.title.toLowerCase().includes(normalized) ||
        question.answers.some(
          (answer) =>
            answer.body.toLowerCase().includes(normalized) ||
            answer.user.name.toLowerCase().includes(normalized),
        )
      );
    });
  }, [courseFilter, questions, searchQuery]);

  const stats = useMemo(() => {
    const totalQuestions = questions.length;
    const totalAnswers = questions.reduce(
      (sum, question) => sum + question.answers.length,
      0,
    );
    const unanswered = questions.filter(
      (question) => question.answers.length === 0,
    ).length;
    const answered = totalQuestions - unanswered;

    return {
      totalQuestions,
      totalAnswers,
      unanswered,
      answered,
    };
  }, [questions]);

  const handleDeleteQuestion = async (questionId: string) => {
    setActionId(questionId);
    try {
      const response = await fetch(`/api/admin/questions/${questionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete question");
      }

      setQuestions((prev) =>
        prev.filter((question) => question.id !== questionId),
      );
      toast.success("Question deleted.");
    } catch (error) {
      console.error("Failed to delete question:", error);
      toast.error("Failed to delete question.");
    } finally {
      setActionId(null);
    }
  };

  const handleDeleteAnswer = async (answerId: string) => {
    setActionId(answerId);
    try {
      const response = await fetch(`/api/admin/questions/answers/${answerId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete answer");
      }

      setQuestions((prev) =>
        prev.map((question) => ({
          ...question,
          answers: question.answers.filter((answer) => answer.id !== answerId),
        })),
      );
      toast.success("Answer deleted.");
    } catch (error) {
      console.error("Failed to delete answer:", error);
      toast.error("Failed to delete answer.");
    } finally {
      setActionId(null);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete || actionId) return;

    if (pendingDelete.type === "question") {
      await handleDeleteQuestion(pendingDelete.id);
    } else {
      await handleDeleteAnswer(pendingDelete.id);
    }

    setPendingDelete(null);
  };

  const handleToggleAccepted = async (
    answerId: string,
    nextAccepted: boolean,
  ) => {
    setActionId(answerId);
    try {
      const response = await fetch(`/api/admin/questions/answers/${answerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAccepted: nextAccepted }),
      });

      if (!response.ok) {
        throw new Error("Failed to update answer");
      }

      setQuestions((prev) =>
        prev.map((question) => ({
          ...question,
          answers: question.answers.map((answer) => {
            if (answer.id === answerId) {
              return { ...answer, isAccepted: nextAccepted };
            }

            return nextAccepted ? { ...answer, isAccepted: false } : answer;
          }),
        })),
      );

      toast.success(
        nextAccepted ? "Answer marked accepted." : "Accepted answer removed.",
      );
    } catch (error) {
      console.error("Failed to update accepted answer:", error);
      toast.error("Failed to update answer status.");
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading Q&A moderation...
      </div>
    );
  }

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Community moderation"
        title="Q&A"
        description="Review lesson questions, moderate answers, and mark the best response so learners find trusted solutions faster."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Questions
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-foreground">
            {stats.totalQuestions}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Answers
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-foreground">
            {stats.totalAnswers}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Answered
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-foreground">
            {stats.answered}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Unanswered
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-foreground">
            {stats.unanswered}
          </p>
        </div>
      </div>

      <AdminPanel
        title="Questions Feed"
        description="Filter and moderate learner Q&A across all lessons."
      >
        <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by question, learner, lesson, course, or answer..."
              className="pl-10"
            />
          </div>

          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All courses</SelectItem>
              {courseOptions.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {filteredQuestions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
              No questions found for the current filters.
            </div>
          ) : (
            filteredQuestions.map((question) => (
              <article
                key={question.id}
                className="rounded-lg border border-border bg-card p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        {question.lesson.course.title}
                      </Badge>
                      <Badge variant="secondary">
                        Lesson {question.lesson.order}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Asked{" "}
                        {formatDistanceToNow(new Date(question.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-foreground">
                      {question.title}
                    </h3>
                    {question.body ? (
                      <p className="text-sm leading-6 text-muted-foreground">
                        {question.body}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      By {question.user.name} ({question.user.email})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/courses/${question.lesson.course.slug}/lessons/${question.lesson.id}`}
                      target="_blank"
                      className="inline-flex h-9 items-center justify-center rounded-md border border-border px-3 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
                    >
                      Open lesson
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={actionId === question.id}
                      onClick={() =>
                        setPendingDelete({ type: "question", id: question.id })
                      }
                    >
                      {actionId === question.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="mt-4 rounded-md border border-border/70 bg-muted/20 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
                    <MessageCircleQuestion className="h-4 w-4 text-primary" />
                    {question.answers.length} answer
                    {question.answers.length === 1 ? "" : "s"}
                  </div>

                  <div className="space-y-3">
                    {question.answers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No answers yet.
                      </p>
                    ) : (
                      question.answers.map((answer) => (
                        <div
                          key={answer.id}
                          className="rounded-md border border-border bg-card p-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                {answer.isAccepted ? (
                                  <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                    Accepted
                                  </Badge>
                                ) : null}
                                <span className="text-xs text-muted-foreground">
                                  {answer.user.name} ({answer.user.email})
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(
                                    new Date(answer.createdAt),
                                    {
                                      addSuffix: true,
                                    },
                                  )}
                                </span>
                              </div>

                              <p className="text-sm leading-6 text-foreground/90">
                                {answer.body}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant={
                                  answer.isAccepted ? "outline" : "default"
                                }
                                size="sm"
                                disabled={actionId === answer.id}
                                onClick={() =>
                                  void handleToggleAccepted(
                                    answer.id,
                                    !answer.isAccepted,
                                  )
                                }
                              >
                                {actionId === answer.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : answer.isAccepted ? (
                                  "Unaccept"
                                ) : (
                                  "Accept"
                                )}
                              </Button>

                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={actionId === answer.id}
                                onClick={() =>
                                  setPendingDelete({
                                    type: "answer",
                                    id: answer.id,
                                  })
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </AdminPanel>

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null);
          }
        }}
      >
        <AlertDialogContent className="border border-[#2a3b61] bg-[#16223d] text-white shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {pendingDelete?.type === "question"
                ? "Delete question?"
                : "Delete answer?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#c7cfdf]">
              {pendingDelete?.type === "question"
                ? "This will remove the question and all of its answers. This action cannot be undone."
                : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#ff6636]/70 bg-transparent text-white hover:bg-[#ff6636]/15 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#ff4d4f] text-white hover:bg-[#ea4042]"
              onClick={confirmDelete}
              disabled={Boolean(actionId)}
            >
              {actionId ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPage>
  );
}
