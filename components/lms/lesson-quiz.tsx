"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, RotateCcw, Award } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface QuizOptionData {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface QuizQuestionData {
  id: string;
  question: string;
  explanation?: string | null;
  options: QuizOptionData[];
}

export interface QuizData {
  id: string;
  title: string;
  description?: string | null;
  passingScore: number;
  questions: QuizQuestionData[];
}

interface LessonQuizProps {
  quiz: QuizData;
  lessonId: string;
  isCompleted?: boolean;
  onQuizPassed?: () => void;
}

export function LessonQuiz({ quiz, lessonId, isCompleted, onQuizPassed }: LessonQuizProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    results: Record<string, { correct: boolean; correctOptionId?: string; explanation?: string }>;
  } | null>(null);

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    const unanswered = quiz.questions.filter((q) => !selectedAnswers[q.id]);
    if (unanswered.length > 0) {
      toast.error(`Please answer all ${quiz.questions.length} questions before submitting.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/lessons/${lessonId}/quiz/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: selectedAnswers }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to submit quiz");
      }

      const data = await res.json();
      setResult(data);
      setSubmitted(true);

      if (data.passed) {
        toast.success(`Quiz passed with ${data.score}%! Great work.`);
        if (onQuizPassed) onQuizPassed();
      } else {
        toast.error(`Score: ${data.score}%. Passing threshold is ${quiz.passingScore}%. Try again!`);
      }
    } catch (err: unknown) {
      console.error("Quiz submission error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to grade quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setSubmitted(false);
    setResult(null);
  };

  return (
    <div className="mt-12 rounded-3xl border border-border/80 bg-card/60 p-6 sm:p-8 space-y-6 shadow-sm">
      {/* Quiz Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-md bg-[#ff6636]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#ff6636] mb-1.5">
            <Award className="size-3.5" /> Knowledge Check
          </div>
          <h3 className="text-xl font-extrabold text-foreground tracking-tight">{quiz.title}</h3>
          {quiz.description && (
            <p className="text-xs text-muted-foreground mt-1">{quiz.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase px-3 py-1 rounded-full bg-muted text-muted-foreground border border-border">
            Pass: {quiz.passingScore}%
          </span>
          <span className="text-[11px] font-bold uppercase px-3 py-1 rounded-full bg-muted text-muted-foreground border border-border">
            {quiz.questions.length} {quiz.questions.length === 1 ? "Question" : "Questions"}
          </span>
        </div>
      </div>

      {/* Result Banner */}
      {submitted && result && (
        <div
          className={cn(
            "rounded-2xl p-5 border flex items-center justify-between gap-4 transition-all",
            result.passed
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
          )}
        >
          <div className="flex items-center gap-3">
            {result.passed ? (
              <CheckCircle2 className="size-6 shrink-0" />
            ) : (
              <XCircle className="size-6 shrink-0" />
            )}
            <div>
              <p className="font-extrabold text-sm sm:text-base">
                {result.passed ? "Passed Knowledge Check! 🎉" : "Threshold Not Met"}
              </p>
              <p className="text-xs opacity-90">
                You scored <span className="font-bold">{result.score}%</span> (Passing score: {quiz.passingScore}%)
              </p>
            </div>
          </div>

          {!result.passed && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRetry}
              className="rounded-xl font-bold text-xs gap-1.5"
            >
              <RotateCcw className="size-3.5" /> Retry
            </Button>
          )}
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-6">
        {quiz.questions.map((question, qIdx) => {
          const qResult = result?.results?.[question.id];
          return (
            <div
              key={question.id}
              className={cn(
                "rounded-2xl border p-5 transition-all space-y-4",
                submitted && qResult
                  ? qResult.correct
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-red-500/30 bg-red-500/5"
                  : "border-border/60 bg-muted/15"
              )}
            >
              <div className="flex items-start gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-[#ff6636]/15 text-[#ff6636] text-xs font-bold font-mono">
                  {qIdx + 1}
                </span>
                <p className="text-sm font-bold text-foreground leading-snug">
                  {question.question}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-2 pl-9">
                {question.options.map((option) => {
                  const isSelected = selectedAnswers[question.id] === option.id;
                  const isCorrectAnswer = submitted && qResult?.correctOptionId === option.id;
                  const isWrongSelected = submitted && isSelected && !qResult?.correct;

                  return (
                    <button
                      type="button"
                      key={option.id}
                      disabled={submitted}
                      onClick={() => handleSelectOption(question.id, option.id)}
                      className={cn(
                        "w-full text-left rounded-xl px-4 py-3 text-xs font-medium transition-all flex items-center justify-between border",
                        isSelected && !submitted && "border-[#ff6636] bg-[#ff6636]/10 text-foreground font-semibold shadow-2xs",
                        !isSelected && !submitted && "border-border/60 bg-background hover:border-border hover:bg-muted/40 text-muted-foreground hover:text-foreground",
                        isCorrectAnswer && "border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold",
                        isWrongSelected && "border-red-500 bg-red-500/15 text-red-600 dark:text-red-400 line-through"
                      )}
                    >
                      <span>{option.text}</span>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {isCorrectAnswer && <CheckCircle2 className="size-4 text-emerald-500" />}
                        {isWrongSelected && <XCircle className="size-4 text-red-500" />}
                      </div>
                    </button>
                  );
                })}

                {/* Explanation */}
                {submitted && question.explanation && (
                  <div className="mt-3 rounded-xl bg-muted/50 p-3 text-[11px] text-muted-foreground border border-border/40">
                    <span className="font-bold text-foreground">Explanation: </span>
                    {question.explanation}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      {!submitted && (
        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] text-white font-bold text-xs px-6 py-2.5 shadow-md shadow-[#ff6636]/20"
          >
            {submitting ? "Grading..." : "Submit Answers"}
          </Button>
        </div>
      )}
    </div>
  );
}
