"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, CheckCircle2, HelpCircle, Award } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface QuizOption {
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  question: string;
  explanation: string;
  options: QuizOption[];
}

interface QuizBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: string | null;
  lessonTitle: string;
  onQuizSaved?: () => void;
}

export function QuizBuilderModal({
  isOpen,
  onClose,
  lessonId,
  lessonTitle,
  onQuizSaved,
}: QuizBuilderModalProps) {
  const [title, setTitle] = useState("Lesson Knowledge Check");
  const [description, setDescription] = useState("");
  const [passingScore, setPassingScore] = useState(70);
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    {
      question: "",
      explanation: "",
      options: [
        { text: "", isCorrect: true },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load existing quiz if any
  useEffect(() => {
    if (!isOpen || !lessonId) return;

    const fetchExistingQuiz = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/lessons?courseId=`);
        // Or check lesson data
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchExistingQuiz();
  }, [isOpen, lessonId]);

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question: "",
        explanation: "",
        options: [
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
      },
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) {
      toast.error("A quiz must have at least one question.");
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleQuestionTextChange = (idx: number, text: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, question: text } : q))
    );
  };

  const handleExplanationChange = (idx: number, text: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, explanation: text } : q))
    );
  };

  const handleOptionTextChange = (
    qIdx: number,
    optIdx: number,
    text: string
  ) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const newOptions = q.options.map((opt, oIdx) =>
          oIdx === optIdx ? { ...opt, text } : opt
        );
        return { ...q, options: newOptions };
      })
    );
  };

  const handleSetCorrectOption = (qIdx: number, optIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const newOptions = q.options.map((opt, oIdx) => ({
          ...opt,
          isCorrect: oIdx === optIdx,
        }));
        return { ...q, options: newOptions };
      })
    );
  };

  const handleAddOption = (qIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        return {
          ...q,
          options: [...q.options, { text: "", isCorrect: false }],
        };
      })
    );
  };

  const handleRemoveOption = (qIdx: number, optIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        if (q.options.length <= 2) {
          toast.error("A question must have at least 2 options.");
          return q;
        }
        const newOptions = q.options.filter((_, oIdx) => oIdx !== optIdx);
        // Ensure at least one correct option remains
        if (!newOptions.some((o) => o.isCorrect) && newOptions.length > 0) {
          newOptions[0].isCorrect = true;
        }
        return { ...q, options: newOptions };
      })
    );
  };

  const handleSaveQuiz = async () => {
    if (!lessonId) return;

    // Validation
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        toast.error(`Question ${i + 1} cannot be empty.`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].text.trim()) {
          toast.error(`Option ${j + 1} in Question ${i + 1} cannot be empty.`);
          return;
        }
      }
      if (!q.options.some((o) => o.isCorrect)) {
        toast.error(`Question ${i + 1} must have a designated correct answer.`);
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/lessons/${lessonId}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          passingScore,
          questions,
        }),
      });

      if (!res.ok) throw new Error("Failed to save quiz");

      toast.success("Knowledge Check Quiz saved successfully! 🎉");
      if (onQuizSaved) onQuizSaved();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Could not save quiz.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuiz = async () => {
    if (!lessonId) return;
    if (!confirm("Are you sure you want to remove the quiz from this lesson?")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/lessons/${lessonId}/quiz`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete quiz");

      toast.success("Quiz removed from lesson.");
      if (onQuizSaved) onQuizSaved();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove quiz.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col rounded-2xl bg-card border-border p-6 overflow-hidden">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-2 text-[#ff6636]">
            <Award className="size-5" />
            <DialogTitle className="text-xl font-extrabold text-foreground">
              Knowledge Check Quiz Builder
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Lesson: <span className="font-bold text-foreground">{lessonTitle}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-2">
          {/* Quiz metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-muted/20 p-4 rounded-xl border border-border/60">
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Quiz Title
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. React State Mastery Check"
                className="h-9 rounded-xl text-xs font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Passing Score (%)
              </Label>
              <Input
                type="number"
                min={10}
                max={100}
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value) || 70)}
                className="h-9 rounded-xl text-xs font-semibold"
              />
            </div>

            <div className="sm:col-span-3 space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Description / Instructions (Optional)
              </Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Complete this quick test to check your understanding and mark lesson complete."
                className="h-9 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Questions list */}
          <div className="space-y-6">
            {questions.map((question, qIdx) => (
              <div
                key={qIdx}
                className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-2xs"
              >
                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-lg bg-[#ff6636]/15 text-[#ff6636] text-xs font-black">
                      {qIdx + 1}
                    </span>
                    <span className="text-xs font-bold text-foreground">
                      Question {qIdx + 1}
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveQuestion(qIdx)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10 size-8 p-0 rounded-lg"
                    title="Delete Question"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Question Text
                  </Label>
                  <Textarea
                    rows={2}
                    placeholder="e.g. What is the return value of useEffect when cleaning up?"
                    value={question.question}
                    onChange={(e) =>
                      handleQuestionTextChange(qIdx, e.target.value)
                    }
                    className="rounded-xl text-xs"
                  />
                </div>

                {/* Multiple choice options */}
                <div className="space-y-2 pt-1">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span>Answer Options (Click checkmark to select the correct answer)</span>
                  </Label>

                  <div className="space-y-2">
                    {question.options.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSetCorrectOption(qIdx, optIdx)}
                          className={cn(
                            "size-8 rounded-lg flex items-center justify-center shrink-0 border transition-all",
                            opt.isCorrect
                              ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                              : "bg-muted text-muted-foreground/60 border-border hover:border-emerald-500/50"
                          )}
                          title={opt.isCorrect ? "Correct Answer" : "Mark as Correct"}
                        >
                          <CheckCircle2 className="size-4" />
                        </button>

                        <Input
                          value={opt.text}
                          onChange={(e) =>
                            handleOptionTextChange(qIdx, optIdx, e.target.value)
                          }
                          placeholder={`Option ${optIdx + 1}`}
                          className={cn(
                            "h-9 rounded-xl text-xs flex-1",
                            opt.isCorrect && "border-emerald-500/60 bg-emerald-500/5 font-semibold"
                          )}
                        />

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveOption(qIdx, optIdx)}
                          className="size-8 p-0 text-muted-foreground hover:text-red-500 rounded-lg shrink-0"
                          title="Remove option"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddOption(qIdx)}
                    className="rounded-xl text-[11px] font-semibold h-7 gap-1 mt-2 text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="size-3" /> Add Option
                  </Button>
                </div>

                {/* Answer Explanation */}
                <div className="space-y-1.5 pt-2 border-t border-border/40">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Explanation / Learning Note (Shown after answering)
                  </Label>
                  <Input
                    placeholder="e.g. In React 19, cleanup functions run when unmounting or before re-running."
                    value={question.explanation}
                    onChange={(e) =>
                      handleExplanationChange(qIdx, e.target.value)
                    }
                    className="h-8 rounded-xl text-xs"
                  />
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={handleAddQuestion}
              className="w-full rounded-2xl border-dashed border-2 py-4 text-xs font-bold gap-2 text-foreground hover:border-[#ff6636] hover:bg-[#ff6636]/5 transition-all"
            >
              <Plus className="size-4 text-[#ff6636]" /> Add Another Question
            </Button>
          </div>
        </div>

        <DialogFooter className="border-t border-border pt-4 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleDeleteQuiz}
            className="rounded-xl text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10 mr-auto"
          >
            Remove Quiz
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl text-xs"
          >
            Cancel
          </Button>

          <Button
            onClick={handleSaveQuiz}
            disabled={saving}
            className="rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] text-white font-bold text-xs px-5 shadow-sm"
          >
            {saving ? "Saving Quiz..." : "Save Knowledge Check"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
