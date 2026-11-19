"use client";

import { useEffect, useMemo, useRef, useState, use } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { Lesson, Module } from "@/types/course";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { LessonEditor } from "@/components/editor/LessonEditor";
import { QuizBuilderModal } from "@/components/admin/quiz-builder-modal";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RichTextRenderer } from "@/components/editor/RichTextRenderer";

import {
  ArrowLeft,
  Video,
  Award,
  Plus,
  Edit2,
  Trash2,
  MoreVertical,
  GripVertical,
  RotateCcw,
  Eye,
  PencilLine,
  FolderTree,
  ArrowDownAZ,
  Loader2,
  Layers,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  normalizeCoursePhases,
  resolveCoursePhaseId,
  type CoursePhase,
} from "@/lib/course-phases";

interface LessonsPageProps {
  params: Promise<{ courseId: string }>;
}

const LESSON_TEMPLATE = JSON.stringify({
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 1 },
      content: [{ type: "text", text: "Lesson Title" }],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "What you'll learn" }],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "" }],
            },
          ],
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Content" }],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "Write your lesson content here..." }],
    },
  ],
});

export default function LessonsPage({ params }: LessonsPageProps) {
  const { courseId } = use(params);

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [phases, setPhases] = useState<CoursePhase[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [isBulkAssignDialogOpen, setIsBulkAssignDialogOpen] = useState(false);
  const [isBulkPhaseDialogOpen, setIsBulkPhaseDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteModuleDialogOpen, setIsDeleteModuleDialogOpen] =
    useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [quizLesson, setQuizLesson] = useState<{ id: string; title: string } | null>(null);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [changingModuleLessonId, setChangingModuleLessonId] = useState<
    string | null
  >(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [bulkAssignModuleId, setBulkAssignModuleId] = useState<string>("");
  const [bulkAssignPhaseId, setBulkAssignPhaseId] = useState<string>("none");
  const [syncQuickModulePhase, setSyncQuickModulePhase] = useState(true);
  const [syncBulkModulePhase, setSyncBulkModulePhase] = useState(true);
  const [selectedLessons, setSelectedLessons] = useState<Set<string>>(
    new Set(),
  );
  const [lessonToDelete, setLessonToDelete] = useState<string | null>(null);
  const [moduleToDelete, setModuleToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModuleSaving, setIsModuleSaving] = useState(false);
  const [isCourseSaving, setIsCourseSaving] = useState(false);
  const [isArrangingByModule, setIsArrangingByModule] = useState(false);
  const [isArrangingModulesByPhase, setIsArrangingModulesByPhase] = useState(false);
  const [updatingPhaseModuleId, setUpdatingPhaseModuleId] = useState<string | null>(null);
  const [modulePhaseFilter, setModulePhaseFilter] = useState<string>("all");
  const [groupModulesByPhase, setGroupModulesByPhase] = useState(false);
  const [lessonPhaseFilter, setLessonPhaseFilter] = useState<string>("all");
  const [lessonModuleFilter, setLessonModuleFilter] = useState<string>("all");
  const [showUnassignedHeader, setShowUnassignedHeader] = useState(true);
  const [showAdvancedLessonFields, setShowAdvancedLessonFields] =
    useState(false);
  const [draggingModuleId, setDraggingModuleId] = useState<string | null>(null);
  const [draggingLessonId, setDraggingLessonId] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const moduleFormCardRef = useRef<HTMLDivElement | null>(null);
  const moduleTitleInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  const [formData, setFormData] = useState({
    title: "",
    order: 1,
    content: "",
    isFree: false,
    moduleId: "",
    phaseId: "none",
    videoUrl: "",
    durationMinutes: "",
  });

  const [moduleForm, setModuleForm] = useState({
    title: "",
    order: 1,
    description: "",
    phaseId: "none",
  });

  const dialogTitle = useMemo(
    () => (editingId ? "Edit Lesson" : "Create Lesson"),
    [editingId],
  );

  const focusTitleInput = () => {
    window.requestAnimationFrame(() => {
      titleInputRef.current?.focus();
    });
  };

  const moduleNameMap = useMemo(() => {
    return modules.reduce<Record<string, string>>((acc, moduleItem) => {
      acc[moduleItem.id] = moduleItem.title;
      return acc;
    }, {});
  }, [modules]);

  const moduleMap = useMemo(() => {
    return modules.reduce<Record<string, Module>>((acc, moduleItem) => {
      acc[moduleItem.id] = moduleItem;
      return acc;
    }, {});
  }, [modules]);

  const moduleLessonCountMap = useMemo(() => {
    return lessons.reduce<Record<string, number>>((acc, lesson) => {
      if (lesson.moduleId) {
        acc[lesson.moduleId] = (acc[lesson.moduleId] ?? 0) + 1;
      }
      return acc;
    }, {});
  }, [lessons]);

  const phaseNameMap = useMemo(() => {
    return phases.reduce<Record<string, string>>((acc, phaseItem) => {
      acc[phaseItem.id] = phaseItem.title;
      return acc;
    }, {});
  }, [phases]);

  const phaseOrderMap = useMemo(() => {
    return phases.reduce<Record<string, number>>((acc, phaseItem, index) => {
      acc[phaseItem.id] = index;
      return acc;
    }, {});
  }, [phases]);

  const getPhaseName = (phaseId?: string | null) => {
    const resolvedId = resolveCoursePhaseId(phaseId, phases);
    return resolvedId ? (phaseNameMap[resolvedId] ?? null) : null;
  };

  const getPhaseIdValue = (phaseId?: string | null) => {
    return resolveCoursePhaseId(phaseId, phases) ?? "none";
  };

  const getEffectiveLessonPhase = (lesson: Lesson): {
    phaseId: string | null;
    phaseName: string | null;
    inherited: boolean;
  } => {
    const explicitId = resolveCoursePhaseId(lesson.phaseId, phases);
    if (explicitId) {
      return {
        phaseId: explicitId,
        phaseName: phaseNameMap[explicitId] ?? null,
        inherited: false,
      };
    }

    if (lesson.moduleId && moduleMap[lesson.moduleId]) {
      const modPhaseId = resolveCoursePhaseId(moduleMap[lesson.moduleId].phaseId, phases);
      if (modPhaseId) {
        return {
          phaseId: modPhaseId,
          phaseName: phaseNameMap[modPhaseId] ?? null,
          inherited: true,
        };
      }
    }

    return { phaseId: null, phaseName: null, inherited: false };
  };

  const sortedModules = useMemo(
    () => modules.slice().sort((a, b) => a.order - b.order),
    [modules],
  );

  const filteredModules = useMemo(() => {
    return sortedModules.filter((moduleItem) => {
      if (modulePhaseFilter === "all") return true;
      const resolvedId = resolveCoursePhaseId(moduleItem.phaseId, phases);
      if (modulePhaseFilter === "unassigned") return !resolvedId;
      return resolvedId === modulePhaseFilter;
    });
  }, [sortedModules, modulePhaseFilter, phases]);

  const sortedLessons = useMemo(
    () => lessons.slice().sort((a, b) => a.order - b.order),
    [lessons],
  );

  const filteredLessons = useMemo(() => {
    return sortedLessons.filter((lesson) => {
      if (lessonModuleFilter === "unassigned" && lesson.moduleId) {
        return false;
      }
      if (
        lessonModuleFilter !== "all" &&
        lessonModuleFilter !== "unassigned" &&
        lesson.moduleId !== lessonModuleFilter
      ) {
        return false;
      }

      if (lessonPhaseFilter !== "all") {
        const effectivePhaseId =
          resolveCoursePhaseId(lesson.phaseId, phases) ??
          (lesson.moduleId && moduleMap[lesson.moduleId]
            ? resolveCoursePhaseId(moduleMap[lesson.moduleId].phaseId, phases)
            : null);
        if (lessonPhaseFilter === "unassigned") {
          return !effectivePhaseId;
        }
        return effectivePhaseId === lessonPhaseFilter;
      }

      return true;
    });
  }, [sortedLessons, lessonModuleFilter, lessonPhaseFilter, phases, moduleMap]);

  const allFilteredSelected =
    filteredLessons.length > 0 &&
    filteredLessons.every((l) => selectedLessons.has(l.id));

  const moveItem = <T extends { id: string }>(
    items: T[],
    fromId: string,
    toId: string,
  ) => {
    const copy = items.slice();
    const fromIndex = copy.findIndex((item) => item.id === fromId);
    const toIndex = copy.findIndex((item) => item.id === toId);

    if (fromIndex === -1 || toIndex === -1) return copy;

    const [moved] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, moved);
    return copy;
  };

  const persistModuleOrder = async (updatedModules: Module[]) => {
    const updates = updatedModules.map((moduleItem, index) => ({
      id: moduleItem.id,
      order: index + 1,
    }));

    setModules(
      updatedModules.map((moduleItem, index) => ({
        ...moduleItem,
        order: index + 1,
      })),
    );

    try {
      const responses = await Promise.all(
        updates.map((update) =>
          fetch(`/api/admin/modules/${update.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order: update.order }),
          }),
        ),
      );

      if (responses.some((response) => !response.ok)) {
        throw new Error("Failed to reorder modules");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to reorder modules");
    }
  };

  const persistLessonOrder = async (updatedLessons: Lesson[]) => {
    const updates = updatedLessons.map((lesson, index) => ({
      id: lesson.id,
      order: index + 1,
    }));

    setLessons(
      updatedLessons.map((lesson, index) => ({
        ...lesson,
        order: index + 1,
      })),
    );

    try {
      const responses = await Promise.all(
        updates.map((update) =>
          fetch(`/api/admin/lessons/${update.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order: update.order }),
          }),
        ),
      );

      if (responses.some((response) => !response.ok)) {
        throw new Error("Failed to reorder lessons");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to reorder lessons");
    }
  };

  const handleToggleUnassignedHeader = async (checked: boolean) => {
    setShowUnassignedHeader(checked);
    setIsCourseSaving(true);

    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showUnassignedHeader: checked }),
      });

      if (!response.ok) throw new Error("Failed to update course settings");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update course settings");
    } finally {
      setIsCourseSaving(false);
    }
  };

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const response = await fetch(`/api/admin/lessons?courseId=${courseId}`);
        if (!response.ok) throw new Error("Failed to load lessons");
        const data = await response.json();
        setLessons(data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load lessons");
      }
    };

    const fetchModules = async () => {
      try {
        const response = await fetch(`/api/admin/modules?courseId=${courseId}`);
        if (!response.ok) throw new Error("Failed to load modules");
        const data = await response.json();
        setModules(data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load modules");
      }
    };

    const fetchCourse = async () => {
      try {
        const response = await fetch(`/api/admin/courses/${courseId}`);
        if (!response.ok) throw new Error("Failed to load course settings");
        const data = await response.json();
        setShowUnassignedHeader(data.showUnassignedHeader ?? true);
        setPhases(normalizeCoursePhases(data.phases));
      } catch (error) {
        console.error(error);
        toast.error("Failed to load course settings");
      }
    };

    Promise.all([fetchLessons(), fetchModules(), fetchCourse()]).finally(() => {
      setIsLoading(false);
    });
  }, [courseId]);

  useEffect(() => {
    if (!moduleForm.title) {
      setModuleForm((prev) => ({ ...prev, order: modules.length + 1 }));
    }
  }, [modules.length, moduleForm.title]);

  useEffect(() => {
    if (!isDialogOpen) return;

    const timeoutId = window.setTimeout(() => {
      focusTitleInput();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isDialogOpen, editingId]);

  const openQuizDialog = (lesson: Lesson) => {
    setQuizLesson({ id: lesson.id, title: lesson.title });
    setQuizModalOpen(true);
  };

  const openCreate = () => {
    setEditingId(null);
    setShowAdvancedLessonFields(false);
    setFormData({
      title: "",
      order: lessons.length + 1,
      content: LESSON_TEMPLATE,
      isFree: false,
      moduleId: "",
      phaseId: "none",
      videoUrl: "",
      durationMinutes: "",
    });
    setActiveTab("edit");
    setIsDialogOpen(true);
  };

  const openEdit = (lesson: Lesson) => {
    setEditingId(lesson.id);
    setShowAdvancedLessonFields(true);
    setFormData({
      title: lesson.title,
      order: lesson.order,
      content: lesson.content,
      isFree: lesson.isFree || false,
      moduleId: lesson.moduleId || "",
      phaseId: getPhaseIdValue(lesson.phaseId),
      videoUrl: lesson.videoUrl || "",
      durationMinutes: lesson.durationSeconds ? String(Math.round(lesson.durationSeconds / 60)) : "",
    });
    setActiveTab("edit");
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      order: lessons.length + 1,
      content: LESSON_TEMPLATE,
      isFree: false,
      moduleId: "",
      phaseId: "none",
      videoUrl: "",
      durationMinutes: "",
    });
    setActiveTab("edit");
    toast.success("Reset", { description: "Template restored." });
  };

  const handleCreateModule = async () => {
    if (!moduleForm.title.trim()) {
      toast.error("Validation Error", {
        description: "Please enter a module title",
      });
      return;
    }

    setIsModuleSaving(true);

    try {
      if (editingModuleId) {
        // Update existing module
        const response = await fetch(`/api/admin/modules/${editingModuleId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: moduleForm.title,
            order: moduleForm.order,
            description: moduleForm.description,
            phaseId: moduleForm.phaseId === "none" ? null : moduleForm.phaseId,
          }),
        });

        if (!response.ok) throw new Error("Failed to update module");

        const updatedModule = await response.json();
        setModules((prev) =>
          prev
            .map((m) => (m.id === editingModuleId ? updatedModule : m))
            .sort((a, b) => a.order - b.order),
        );
        setModuleForm({
          title: "",
          order: modules.length + 1,
          description: "",
          phaseId: "none",
        });
        setEditingModuleId(null);
        toast.success("Module updated", {
          description: `${updatedModule.title} has been updated.`,
        });
      } else {
        // Create new module
        const response = await fetch("/api/admin/modules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId,
            title: moduleForm.title,
            order: moduleForm.order,
            description: moduleForm.description,
            phaseId: moduleForm.phaseId === "none" ? null : moduleForm.phaseId,
          }),
        });

        if (!response.ok) throw new Error("Failed to create module");

        const newModule = await response.json();
        setModules((prev) =>
          [...prev, newModule].sort((a, b) => a.order - b.order),
        );
        setModuleForm({
          title: "",
          order: modules.length + 2,
          description: "",
          phaseId: "none",
        });
        toast.success("Module created", {
          description: `${newModule.title} has been added.`,
        });
      }
    } catch (error) {
      toast.error(
        editingModuleId ? "Failed to update module" : "Failed to create module",
        {
          description: error instanceof Error ? error.message : "Unknown error",
        },
      );
    } finally {
      setIsModuleSaving(false);
    }
  };

  const handleEditModule = (moduleItem: Module) => {
    setEditingModuleId(moduleItem.id);
    setModuleForm({
      title: moduleItem.title,
      order: moduleItem.order,
      description: moduleItem.description || "",
      phaseId: getPhaseIdValue(moduleItem.phaseId),
    });

    moduleFormCardRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    window.requestAnimationFrame(() => {
      moduleTitleInputRef.current?.focus();
    });
  };

  const handleQuickModulePhaseChange = async (
    moduleId: string,
    nextPhaseValue: string,
  ) => {
    setUpdatingPhaseModuleId(moduleId);

    try {
      const response = await fetch(`/api/admin/modules/${moduleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phaseId: nextPhaseValue === "none" ? null : nextPhaseValue,
        }),
      });

      if (!response.ok) throw new Error("Failed to update module phase");

      const updatedModule = await response.json();
      setModules((prev) =>
        prev.map((m) => (m.id === moduleId ? updatedModule : m)),
      );

      const nextPhaseName =
        nextPhaseValue === "none"
          ? "Unassigned"
          : phaseNameMap[nextPhaseValue] || "Selected phase";

      toast.success("Module phase updated", {
        description: `${updatedModule.title} → ${nextPhaseName}`,
      });
    } catch (error) {
      toast.error("Failed to update module phase", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setUpdatingPhaseModuleId(null);
    }
  };

  const handleArrangeModulesByPhase = async () => {
    if (modules.length <= 1 || phases.length === 0) {
      toast.info("Nothing to arrange", {
        description: "Add phases and multiple modules to sort by phase.",
      });
      return;
    }

    setIsArrangingModulesByPhase(true);

    try {
      const arranged = modules.slice().sort((a, b) => {
        const aPhaseId = resolveCoursePhaseId(a.phaseId, phases);
        const bPhaseId = resolveCoursePhaseId(b.phaseId, phases);
        const aPhaseRank = aPhaseId ? (phaseOrderMap[aPhaseId] ?? 9999) : 9999;
        const bPhaseRank = bPhaseId ? (phaseOrderMap[bPhaseId] ?? 9999) : 9999;

        if (aPhaseRank !== bPhaseRank) {
          return aPhaseRank - bPhaseRank;
        }

        if (a.order !== b.order) {
          return a.order - b.order;
        }

        return a.title.localeCompare(b.title);
      });

      await persistModuleOrder(arranged);
      toast.success("Modules arranged", {
        description: "Modules are now ordered by phase.",
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to arrange modules by phase");
    } finally {
      setIsArrangingModulesByPhase(false);
    }
  };

  const handleCancelEditModule = () => {
    setEditingModuleId(null);
    setModuleForm({
      title: "",
      order: modules.length + 1,
      description: "",
      phaseId: "none",
    });
  };

  const openDeleteModuleDialog = (moduleId: string) => {
    setModuleToDelete(moduleId);
    setIsDeleteModuleDialogOpen(true);
  };

  const handleDeleteModule = async () => {
    if (!moduleToDelete) return;

    const moduleItem = modules.find((m) => m.id === moduleToDelete);
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/modules/${moduleToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete module");

      setModules((prev) => prev.filter((m) => m.id !== moduleToDelete));
      setLessons((prev) =>
        prev.map((lesson) =>
          lesson.moduleId === moduleToDelete
            ? { ...lesson, moduleId: null }
            : lesson,
        ),
      );

      toast.success("Module deleted", {
        description: moduleItem ? `${moduleItem.title} removed.` : undefined,
      });

      setIsDeleteModuleDialogOpen(false);
      setModuleToDelete(null);
    } catch (error) {
      toast.error("Failed to delete module", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const openChangeModule = (lessonId: string) => {
    const lesson = lessons.find((l) => l.id === lessonId);
    setChangingModuleLessonId(lessonId);
    setSelectedModuleId(lesson?.moduleId || "unassigned");
    setSyncQuickModulePhase(true);
    setIsModuleDialogOpen(true);
  };

  const handleChangeModule = async () => {
    if (!changingModuleLessonId) return;

    setIsSaving(true);

    try {
      const targetModulePhaseId =
        selectedModuleId !== "unassigned"
          ? resolveCoursePhaseId(moduleMap[selectedModuleId]?.phaseId, phases)
          : null;

      const response = await fetch(
        `/api/admin/lessons/${changingModuleLessonId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            moduleId:
              selectedModuleId === "unassigned" ? null : selectedModuleId,
            ...(syncQuickModulePhase && targetModulePhaseId
              ? { phaseId: targetModulePhaseId }
              : {}),
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to update lesson module");

      const updated = await response.json();
      setLessons((prev) =>
        prev.map((l) => (l.id === changingModuleLessonId ? updated : l)),
      );

      const moduleName =
        selectedModuleId === "unassigned"
          ? "Unassigned"
          : moduleNameMap[selectedModuleId] || "Unknown";

      toast.success("Module updated", {
        description: `Lesson moved to ${moduleName}`,
      });

      setIsModuleDialogOpen(false);
      setChangingModuleLessonId(null);
    } catch (error) {
      toast.error("Failed to update module", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const openBulkAssignDialog = () => {
    setBulkAssignModuleId("unassigned");
    setSyncBulkModulePhase(true);
    setIsBulkAssignDialogOpen(true);
  };

  const handleBulkAssignModule = async () => {
    if (selectedLessons.size === 0) return;

    setIsSaving(true);

    try {
      const targetModulePhaseId =
        bulkAssignModuleId !== "unassigned"
          ? resolveCoursePhaseId(moduleMap[bulkAssignModuleId]?.phaseId, phases)
          : null;

      const updatePromises = Array.from(selectedLessons).map((id) =>
        fetch(`/api/admin/lessons/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            moduleId:
              bulkAssignModuleId === "unassigned" ? null : bulkAssignModuleId,
            ...(syncBulkModulePhase && targetModulePhaseId
              ? { phaseId: targetModulePhaseId }
              : {}),
          }),
        }),
      );

      const results = await Promise.all(updatePromises);
      const failedUpdates = results.filter((r) => !r.ok);

      if (failedUpdates.length > 0) {
        throw new Error(`Failed to update ${failedUpdates.length} lesson(s)`);
      }

      // Update lessons state
      const updatedLessonsData = await Promise.all(
        results.map((r) => r.json()),
      );

      setLessons((prev) =>
        prev.map((lesson) => {
          const updated = updatedLessonsData.find((u) => u.id === lesson.id);
          return updated || lesson;
        }),
      );

      const moduleName =
        bulkAssignModuleId === "unassigned"
          ? "Unassigned"
          : moduleNameMap[bulkAssignModuleId] || "Unknown";

      toast.success("Lessons updated", {
        description: `${selectedLessons.size} lesson(s) moved to ${moduleName}`,
      });

      setSelectedLessons(new Set());
      setIsBulkAssignDialogOpen(false);
    } catch (error) {
      toast.error("Failed to update lessons", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const openBulkPhaseDialog = () => {
    setBulkAssignPhaseId("none");
    setIsBulkPhaseDialogOpen(true);
  };

  const handleBulkAssignPhase = async () => {
    if (selectedLessons.size === 0) return;

    setIsSaving(true);

    try {
      const nextPhaseId =
        bulkAssignPhaseId === "none" ? null : bulkAssignPhaseId;
      const updatePromises = Array.from(selectedLessons).map((id) =>
        fetch(`/api/admin/lessons/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phaseId: nextPhaseId }),
        }),
      );

      const results = await Promise.all(updatePromises);
      const failedUpdates = results.filter((r) => !r.ok);

      if (failedUpdates.length > 0) {
        throw new Error(`Failed to update ${failedUpdates.length} lesson(s)`);
      }

      const updatedLessonsData = await Promise.all(
        results.map((r) => r.json()),
      );

      setLessons((prev) =>
        prev.map((lesson) => {
          const updated = updatedLessonsData.find((u) => u.id === lesson.id);
          return updated || lesson;
        }),
      );

      const phaseName =
        bulkAssignPhaseId === "none"
          ? "Unassigned"
          : phaseNameMap[bulkAssignPhaseId] || "Unknown";

      toast.success("Lessons updated", {
        description: `${selectedLessons.size} lesson(s) assigned to ${phaseName}`,
      });

      setSelectedLessons(new Set());
      setIsBulkPhaseDialogOpen(false);
    } catch (error) {
      toast.error("Failed to update lesson phases", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveLesson = async (keepOpen: boolean = false) => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Validation Error", {
        description: "Please fill in all required fields",
      });
      return;
    }

    setIsSaving(true);

    try {
      if (editingId) {
        const response = await fetch(`/api/admin/lessons/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title,
            order: formData.order,
            content: formData.content,
            isFree: formData.isFree,
            moduleId: formData.moduleId || null,
            phaseId: formData.phaseId === "none" ? null : formData.phaseId,
            videoUrl: formData.videoUrl ? formData.videoUrl.trim() : null,
            durationSeconds: formData.durationMinutes ? parseInt(formData.durationMinutes, 10) * 60 : null,
          }),
        });

        if (!response.ok) throw new Error("Failed to update lesson");

        const updated = await response.json();
        setLessons((prev) =>
          prev.map((l) => (l.id === editingId ? updated : l)),
        );

        toast.success("Lesson updated", {
          description: `${formData.title} has been updated.`,
        });

        setIsDialogOpen(false);
        setFormData({
          title: "",
          order: 1,
          content: "",
          isFree: false,
          moduleId: "",
          phaseId: "none",
          videoUrl: "",
          durationMinutes: "",
        });
      } else {
        const response = await fetch("/api/admin/lessons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId,
            title: formData.title,
            order: formData.order,
            content: formData.content,
            isFree: formData.isFree,
            moduleId: formData.moduleId || null,
            phaseId: formData.phaseId === "none" ? null : formData.phaseId,
            videoUrl: formData.videoUrl ? formData.videoUrl.trim() : null,
            durationSeconds: formData.durationMinutes ? parseInt(formData.durationMinutes, 10) * 60 : null,
          }),
        });

        if (!response.ok) throw new Error("Failed to create lesson");

        const newLesson = await response.json();
        setLessons((prev) =>
          [...prev, newLesson].sort((a, b) => a.order - b.order),
        );

        if (keepOpen) {
          const nextOrder =
            Math.max(
              ...lessons.map((lesson) => lesson.order),
              newLesson.order,
            ) + 1;

          const selectedModuleId = formData.moduleId;

          setFormData({
            title: "",
            order: nextOrder,
            content: LESSON_TEMPLATE,
            isFree: false,
            moduleId: selectedModuleId,
            phaseId: formData.phaseId,
            videoUrl: "",
            durationMinutes: "",
          });
          setShowAdvancedLessonFields(false);
          setActiveTab("edit");
          focusTitleInput();

          toast.success("Lesson created", {
            description: "Saved. Add the next lesson now.",
          });
        } else {
          toast.success("Lesson created", {
            description: `${formData.title} has been added.`,
          });

          setIsDialogOpen(false);
          setFormData({
            title: "",
            order: 1,
            content: "",
            isFree: false,
            moduleId: "",
            phaseId: "none",
            videoUrl: "",
            durationMinutes: "",
          });
        }
      }
    } catch (error) {
      toast.error("Failed to save lesson", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteDialog = (id: string) => {
    setLessonToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteLesson = async () => {
    if (!lessonToDelete) return;

    const lesson = lessons.find((l) => l.id === lessonToDelete);
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/lessons/${lessonToDelete}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete lesson");

      setLessons((prev) => prev.filter((l) => l.id !== lessonToDelete));
      setSelectedLessons((prev) => {
        const newSet = new Set(prev);
        newSet.delete(lessonToDelete);
        return newSet;
      });

      toast.success("Lesson deleted", {
        description: lesson ? `${lesson.title} has been removed.` : undefined,
      });

      setIsDeleteDialogOpen(false);
      setLessonToDelete(null);
    } catch (error) {
      toast.error("Failed to delete lesson", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLessons.size === 0) return;

    setIsDeleting(true);

    try {
      const deletePromises = Array.from(selectedLessons).map((id) =>
        fetch(`/api/admin/lessons/${id}`, { method: "DELETE" }),
      );

      const results = await Promise.all(deletePromises);
      const failedDeletes = results.filter((r) => !r.ok);

      if (failedDeletes.length > 0) {
        throw new Error(`Failed to delete ${failedDeletes.length} lesson(s)`);
      }

      setLessons((prev) => prev.filter((l) => !selectedLessons.has(l.id)));

      toast.success("Lessons deleted", {
        description: `${selectedLessons.size} lesson(s) have been removed.`,
      });

      setSelectedLessons(new Set());
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to delete lessons", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleArrangeLessonsByModule = async () => {
    if (lessons.length <= 1) {
      toast.info("Nothing to arrange", {
        description: "Add more lessons to use module-based arrangement.",
      });
      return;
    }

    setIsArrangingByModule(true);

    try {
      const phaseSortedModules = modules.slice().sort((a, b) => {
        if (phases.length > 0) {
          const aPhaseId = resolveCoursePhaseId(a.phaseId, phases);
          const bPhaseId = resolveCoursePhaseId(b.phaseId, phases);
          const aPhaseRank = aPhaseId ? (phaseOrderMap[aPhaseId] ?? 9999) : 9999;
          const bPhaseRank = bPhaseId ? (phaseOrderMap[bPhaseId] ?? 9999) : 9999;
          if (aPhaseRank !== bPhaseRank) {
            return aPhaseRank - bPhaseRank;
          }
        }
        return a.order - b.order;
      });

      const moduleRank = phaseSortedModules.reduce<Record<string, number>>(
        (acc, moduleItem, index) => {
          acc[moduleItem.id] = index;
          return acc;
        },
        {},
      );

      const arranged = lessons.slice().sort((a, b) => {
        if (phases.length > 0) {
          const aEffectivePhase = getEffectiveLessonPhase(a).phaseId;
          const bEffectivePhase = getEffectiveLessonPhase(b).phaseId;
          const aPhaseRank = aEffectivePhase
            ? (phaseOrderMap[aEffectivePhase] ?? 9999)
            : 9999;
          const bPhaseRank = bEffectivePhase
            ? (phaseOrderMap[bEffectivePhase] ?? 9999)
            : 9999;
          if (aPhaseRank !== bPhaseRank) {
            return aPhaseRank - bPhaseRank;
          }
        }

        const aRank = a.moduleId ? (moduleRank[a.moduleId] ?? 9999) : 9999;
        const bRank = b.moduleId ? (moduleRank[b.moduleId] ?? 9999) : 9999;

        if (aRank !== bRank) {
          return aRank - bRank;
        }

        if (a.order !== b.order) {
          return a.order - b.order;
        }

        return a.title.localeCompare(b.title);
      });

      await persistLessonOrder(arranged);
      toast.success("Lessons arranged", {
        description:
          phases.length > 0
            ? "Lessons are now ordered by phase, module, and lesson order."
            : "Lessons are now ordered by module and lesson order.",
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to arrange lessons by module");
    } finally {
      setIsArrangingByModule(false);
    }
  };

  const toggleSelectLesson = (id: string) => {
    setSelectedLessons((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedLessons((prev) => {
        const next = new Set(prev);
        for (const l of filteredLessons) {
          next.delete(l.id);
        }
        return next;
      });
    } else {
      setSelectedLessons((prev) => {
        const next = new Set(prev);
        for (const l of filteredLessons) {
          next.add(l.id);
        }
        return next;
      });
    }
  };

  const openBulkDeleteDialog = () => {
    setLessonToDelete(null);
    setIsDeleteDialogOpen(true);
  };

  const handleLessonDialogKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    const isSaveShortcut =
      (event.ctrlKey || event.metaKey) && event.key === "Enter";

    if (!isSaveShortcut || isSaving || editingId) {
      return;
    }

    event.preventDefault();
    void handleSaveLesson(true);
  };

  const renderModuleRow = (moduleItem: Module) => {
    const phaseName = getPhaseName(moduleItem.phaseId);
    const lessonCount = moduleLessonCountMap[moduleItem.id] ?? 0;

    return (
      <div
        key={moduleItem.id}
        className={cn(
          "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border p-4 transition-all cursor-grab active:cursor-grabbing",
          editingModuleId === moduleItem.id
            ? "bg-[#ff6636]/5 border-[#ff6636]"
            : "bg-background hover:bg-muted/15 border-border/60",
        )}
        draggable
        onDragStart={() => setDraggingModuleId(moduleItem.id)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={async () => {
          if (!draggingModuleId) return;
          if (draggingModuleId === moduleItem.id) return;

          const reordered = moveItem(
            sortedModules,
            draggingModuleId,
            moduleItem.id,
          );

          await persistModuleOrder(reordered);
          setDraggingModuleId(null);
        }}
        onDragEnd={() => setDraggingModuleId(null)}
      >
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <GripVertical className="size-4 text-muted-foreground/60 mt-0.5 shrink-0" />
          <span className="text-[10px] font-black uppercase text-muted-foreground w-8 mt-0.5 shrink-0">
            m-{moduleItem.order}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-foreground">
                {moduleItem.title}
              </span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase border tracking-wider shrink-0",
                  phaseName
                    ? "bg-[#ff6636]/10 text-[#ff6636] border-[#ff6636]/25"
                    : "bg-muted text-muted-foreground border-border/40",
                )}
              >
                {phaseName || "Unassigned"}
              </span>
              <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-muted/60 text-muted-foreground border border-border/40 shrink-0">
                {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}
              </span>
            </div>
            {moduleItem.description ? (
              <p className="text-[10px] font-semibold text-muted-foreground/80 mt-0.5">
                {moduleItem.description}
              </p>
            ) : null}
          </div>
        </div>
        <div
          className="flex items-center gap-2 shrink-0 flex-wrap justify-end"
          onClick={(e) => e.stopPropagation()}
        >
          {phases.length > 0 && (
            <Select
              value={getPhaseIdValue(moduleItem.phaseId)}
              onValueChange={(value) =>
                handleQuickModulePhaseChange(moduleItem.id, value)
              }
              disabled={updatingPhaseModuleId === moduleItem.id}
            >
              <SelectTrigger
                aria-label={`Change phase for ${moduleItem.title}`}
                className="h-7 min-w-[135px] max-w-[200px] rounded-lg border-border bg-card px-2.5 text-[10px] font-bold text-foreground focus-visible:ring-0"
              >
                <SelectValue placeholder="Phase" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="none" className="text-xs font-semibold">
                  Unassigned
                </SelectItem>
                {phases.map((phase) => (
                  <SelectItem
                    key={phase.id}
                    value={phase.id}
                    className="text-xs font-semibold"
                  >
                    {phase.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <button
            onClick={() => handleEditModule(moduleItem)}
            className="rounded-lg border border-border bg-card px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground hover:text-[#ff6636] transition-colors"
          >
            Edit
          </button>
          <button
            className="rounded-lg border border-border bg-card px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-500 hover:bg-red-500/10 transition-colors"
            onClick={() => openDeleteModuleDialog(moduleItem.id)}
          >
            Delete
          </button>
        </div>
      </div>
    );
  };

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Curriculum builder"
        title="Course Lessons"
        description="Create rich, engaging lessons, structure them into modules, and tune the learning flow."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/courses">
              <Button
                variant="outline"
                className="gap-2"
                aria-label="Back to courses"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to courses
              </Button>
            </Link>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Lesson
            </Button>
          </div>
        }
      />


      {/* Modules Authoring */}
      <Card
        ref={moduleFormCardRef}
        className="scroll-mt-6 rounded-2xl border border-border bg-card shadow-sm overflow-hidden mt-6"
      >
        <CardHeader className="border-b border-border/50 px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0">
          <CardTitle className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
            <FolderTree className="size-4.5 text-[#ff6636]" />
            Syllabus Modules ({modules.length})
          </CardTitle>
          {phases.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setGroupModulesByPhase((prev) => !prev)}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all h-8",
                  groupModulesByPhase
                    ? "border-[#ff6636] bg-[#ff6636]/10 text-[#ff6636]"
                    : "border-border bg-background text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636]",
                )}
              >
                <Layers className="size-3.5" />
                Group by Phase
              </button>
              <button
                type="button"
                onClick={handleArrangeModulesByPhase}
                disabled={
                  isLoading ||
                  isModuleSaving ||
                  isArrangingModulesByPhase ||
                  modules.length <= 1
                }
                className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] transition-all h-8 disabled:opacity-60"
              >
                <ArrowDownAZ className="size-3.5" />
                {isArrangingModulesByPhase ? "Arranging..." : "Arrange by Phase"}
              </button>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-5 space-y-1.5">
              <Label htmlFor="module-title" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Module Title
              </Label>
              <Input
                ref={moduleTitleInputRef}
                id="module-title"
                placeholder="e.g., Fundamentals of API Design"
                value={moduleForm.title}
                onChange={(e) =>
                  setModuleForm({ ...moduleForm, title: e.target.value })
                }
                className="h-10 rounded-xl border-border text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/80 bg-background"
              />
            </div>

            <div className="col-span-12 lg:col-span-4 space-y-1.5">
              <Label htmlFor="module-phase" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Phase Assignment
              </Label>
              <Select
                value={moduleForm.phaseId || "none"}
                onValueChange={(value) =>
                  setModuleForm({
                    ...moduleForm,
                    phaseId: value === "none" ? "none" : value,
                  })
                }
              >
                <SelectTrigger
                  id="module-phase"
                  className="h-10 rounded-xl border-border bg-background text-xs font-semibold focus-visible:ring-0 focus-visible:border-border/80"
                >
                  <SelectValue placeholder="Choose a phase" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="none" className="text-xs font-semibold">Unassigned</SelectItem>
                  {phases.map((phase) => (
                    <SelectItem
                      key={phase.id}
                      value={phase.id}
                      className="text-xs font-semibold"
                    >
                      {phase.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-12 lg:col-span-3 space-y-1.5">
              <Label htmlFor="module-order" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Display Order
              </Label>
              <Input
                id="module-order"
                type="number"
                min="1"
                value={moduleForm.order}
                onChange={(e) =>
                  setModuleForm({
                    ...moduleForm,
                    order: Number.isFinite(parseInt(e.target.value))
                      ? parseInt(e.target.value)
                      : 1,
                  })
                }
                className="h-10 rounded-xl border-border text-xs font-semibold focus-visible:ring-0 focus-visible:border-border/80 bg-background"
              />
            </div>

            <div className="col-span-12 space-y-1.5">
              <Label htmlFor="module-description" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Module Description (Optional)
              </Label>
              <Textarea
                id="module-description"
                placeholder="A brief summary detailing the key learning outcomes of this module block..."
                value={moduleForm.description}
                onChange={(e) =>
                  setModuleForm({
                    ...moduleForm,
                    description: e.target.value,
                  })
                }
                className="min-h-[80px] rounded-xl border-border text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/80 bg-background"
              />
            </div>

            <div className="col-span-12 flex items-center justify-end gap-2">
              {editingModuleId && (
                <Button
                  type="button"
                  onClick={handleCancelEditModule}
                  variant="outline"
                  className="h-10 px-5 rounded-xl text-xs font-bold"
                >
                  Cancel
                </Button>
              )}
              <button
                type="button"
                onClick={handleCreateModule}
                disabled={isModuleSaving}
                className="h-10 px-6 rounded-xl text-xs font-bold bg-[#ff6636] hover:bg-[#e95a2b] text-white transition-colors"
              >
                {isModuleSaving
                  ? "Saving..."
                  : editingModuleId
                    ? "Update Module"
                    : "Add Module"}
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-muted/10 border border-border/40 rounded-xl px-3.5 py-2.5">
            <Checkbox
              id="show-unassigned-header"
              checked={showUnassignedHeader}
              onCheckedChange={(checked) =>
                handleToggleUnassignedHeader(Boolean(checked))
              }
              disabled={isCourseSaving}
            />
            <Label
              htmlFor="show-unassigned-header"
              className="text-xs font-bold text-muted-foreground cursor-pointer select-none"
            >
              Show &ldquo;No module&rdquo; header for unassigned lessons in student view
            </Label>
          </div>

          {modules.length > 0 && phases.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {[
                {
                  key: "all",
                  label: "All",
                  count: modules.length,
                },
                ...phases.map((phase) => ({
                  key: phase.id,
                  label: phase.title,
                  count: modules.filter(
                    (m) => resolveCoursePhaseId(m.phaseId, phases) === phase.id,
                  ).length,
                })),
                {
                  key: "unassigned",
                  label: "Unassigned",
                  count: modules.filter(
                    (m) => !resolveCoursePhaseId(m.phaseId, phases),
                  ).length,
                },
              ].map((pill) => (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => setModulePhaseFilter(pill.key)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors",
                    modulePhaseFilter === pill.key
                      ? "bg-[#ff6636] text-white border-[#ff6636]"
                      : "bg-background text-muted-foreground border-border hover:border-[#ff6636]/40 hover:text-foreground",
                  )}
                >
                  {pill.label} ({pill.count})
                </button>
              ))}
            </div>
          )}

          {modules.length > 0 ? (
            filteredModules.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 py-8 text-center">
                <p className="text-xs font-semibold text-muted-foreground">
                  No modules match the selected phase filter.
                </p>
                <button
                  type="button"
                  onClick={() => setModulePhaseFilter("all")}
                  className="rounded-lg border border-border bg-background px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636]"
                >
                  Show All Modules
                </button>
              </div>
            ) : groupModulesByPhase && phases.length > 0 ? (
              <div className="space-y-5 mt-4">
                {phases.map((phase, index) => {
                  const phaseGroupModules = filteredModules.filter(
                    (m) => resolveCoursePhaseId(m.phaseId, phases) === phase.id,
                  );
                  if (phaseGroupModules.length === 0) return null;

                  return (
                    <div key={phase.id} className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <span className="flex size-5 items-center justify-center rounded-md bg-[#ff6636]/15 text-[10px] font-extrabold text-[#ff6636]">
                            {index + 1}
                          </span>
                          <span className="text-xs font-extrabold text-foreground">
                            {phase.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {phaseGroupModules.length}{" "}
                          {phaseGroupModules.length === 1 ? "module" : "modules"}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {phaseGroupModules.map(renderModuleRow)}
                      </div>
                    </div>
                  );
                })}

                {(() => {
                  const unassignedGroupModules = filteredModules.filter(
                    (m) => !resolveCoursePhaseId(m.phaseId, phases),
                  );
                  if (unassignedGroupModules.length === 0) return null;

                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-extrabold text-muted-foreground">
                          Unassigned Phase
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {unassignedGroupModules.length}{" "}
                          {unassignedGroupModules.length === 1
                            ? "module"
                            : "modules"}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {unassignedGroupModules.map(renderModuleRow)}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="space-y-2 mt-4">
                {filteredModules.map(renderModuleRow)}
              </div>
            )
          ) : (
            <p className="text-xs font-semibold text-muted-foreground/80 py-4 text-center">
              No modules built yet. Add a module block to structure your learning tracks.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Lessons Table Card */}
      <Card className="mt-6 border-none shadow-none bg-transparent">
        <CardHeader className="px-6 py-4 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
            <PencilLine className="size-4.5 text-[#ff6636]" />
            Lesson Units ({lessons.length})
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleArrangeLessonsByModule}
              disabled={isLoading || isSaving || isArrangingByModule}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] transition-all h-9 disabled:opacity-60"
            >
              <ArrowDownAZ className="size-3.5" />
              {isArrangingByModule
                ? "Arranging..."
                : phases.length > 0
                  ? "Arrange by Phase & Module"
                  : "Arrange by Module"}
            </button>

            {selectedLessons.size > 0 && (
              <>
                <button
                  onClick={openBulkAssignDialog}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] transition-all h-9"
                >
                  <FolderTree className="size-3.5" />
                  Assign Module ({selectedLessons.size})
                </button>
                {phases.length > 0 && (
                  <button
                    onClick={openBulkPhaseDialog}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] transition-all h-9"
                  >
                    <Layers className="size-3.5" />
                    Assign Phase ({selectedLessons.size})
                  </button>
                )}
                <button
                  onClick={openBulkDeleteDialog}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all h-9 shadow-md shadow-red-500/10"
                >
                  <Trash2 className="size-3.5" />
                  Delete ({selectedLessons.size})
                </button>
              </>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {!isLoading &&
            lessons.length > 0 &&
            (phases.length > 0 || modules.length > 0) && (
              <div className="px-6 py-3 border-y border-border/50 bg-muted/5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {phases.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        {
                          key: "all",
                          label: "All",
                          count: lessons.length,
                        },
                        ...phases.map((phase) => ({
                          key: phase.id,
                          label: phase.title,
                          count: lessons.filter(
                            (l) => getEffectiveLessonPhase(l).phaseId === phase.id,
                          ).length,
                        })),
                        {
                          key: "unassigned",
                          label: "Unassigned",
                          count: lessons.filter(
                            (l) => !getEffectiveLessonPhase(l).phaseId,
                          ).length,
                        },
                      ].map((pill) => (
                        <button
                          key={pill.key}
                          type="button"
                          onClick={() => setLessonPhaseFilter(pill.key)}
                          className={cn(
                            "rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors",
                            lessonPhaseFilter === pill.key
                              ? "bg-[#ff6636] text-white border-[#ff6636]"
                              : "bg-background text-muted-foreground border-border hover:border-[#ff6636]/40 hover:text-foreground",
                          )}
                        >
                          {pill.label} ({pill.count})
                        </button>
                      ))}
                    </div>
                  )}

                  {modules.length > 0 && (
                    <Select
                      value={lessonModuleFilter}
                      onValueChange={setLessonModuleFilter}
                    >
                      <SelectTrigger
                        aria-label="Filter lessons by module"
                        className="h-8 min-w-[175px] max-w-[260px] rounded-xl border-border bg-background px-3 text-[11px] font-semibold focus-visible:ring-0"
                      >
                        <SelectValue placeholder="All Modules" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all" className="text-xs font-semibold">
                          All Modules
                        </SelectItem>
                        <SelectItem
                          value="unassigned"
                          className="text-xs font-semibold"
                        >
                          Unassigned
                        </SelectItem>
                        {sortedModules.map((moduleItem) => {
                          const pName = getPhaseName(moduleItem.phaseId);
                          return (
                            <SelectItem
                              key={moduleItem.id}
                              value={moduleItem.id}
                              className="text-xs font-semibold"
                            >
                              {moduleItem.title} {pName ? `(${pName})` : ""}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {(lessonPhaseFilter !== "all" || lessonModuleFilter !== "all") && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      Showing {filteredLessons.length} of {lessons.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setLessonPhaseFilter("all");
                        setLessonModuleFilter("all");
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] transition-colors"
                    >
                      <X className="size-3" />
                      Clear
                    </button>
                  </div>
                )}
              </div>
            )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-14">
              <Loader2 className="size-6 text-[#ff6636] animate-spin mb-2" />
              <p className="text-xs font-bold text-muted-foreground/80">Loading curriculum units...</p>
            </div>
          ) : lessons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14">
              <p className="text-xs font-semibold text-muted-foreground/80 mb-4">No lessons added to this course yet.</p>
              <button
                onClick={openCreate}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors"
              >
                <Plus className="size-4" />
                Create First Lesson
              </button>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/10 [&_tr]:border-none">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="w-12 px-6 py-3">
                    <Checkbox
                      checked={allFilteredSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all lessons"
                    />
                  </TableHead>
                  <TableHead className="w-10 px-2 py-3" />
                  <TableHead className="w-12 text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3">#</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3">Unit Title</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3">Module Block</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3">Phase</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-6 py-3 text-right" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredLessons.length === 0 ? (
                  <TableRow className="hover:bg-transparent border-none">
                    <TableCell colSpan={7} className="px-6 py-10 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <p className="text-xs font-semibold text-muted-foreground">
                          No lessons match the active filters.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setLessonPhaseFilter("all");
                            setLessonModuleFilter("all");
                          }}
                          className="rounded-lg border border-border bg-card px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636]"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLessons.map((lesson) => {
                    const effectivePhase = getEffectiveLessonPhase(lesson);

                    return (
                      <TableRow
                        key={lesson.id}
                        draggable
                        onDragStart={() => setDraggingLessonId(lesson.id)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={async () => {
                          if (!draggingLessonId) return;
                          if (draggingLessonId === lesson.id) return;

                          const reordered = moveItem(
                            sortedLessons,
                            draggingLessonId,
                            lesson.id,
                          );

                          await persistLessonOrder(reordered);
                          setDraggingLessonId(null);
                        }}
                        onDragEnd={() => setDraggingLessonId(null)}
                        className="hover:bg-muted/10 border-none cursor-grab active:cursor-grabbing"
                      >
                        <TableCell className="px-6 py-4">
                          <Checkbox
                            checked={selectedLessons.has(lesson.id)}
                            onCheckedChange={() => toggleSelectLesson(lesson.id)}
                            aria-label={`Select ${lesson.title}`}
                          />
                        </TableCell>

                        <TableCell className="px-2 py-4">
                          <GripVertical className="size-4 text-muted-foreground/60" />
                        </TableCell>

                        <TableCell className="px-4 py-4 text-xs font-bold text-foreground">
                          {lesson.order}
                        </TableCell>

                        <TableCell className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-foreground">{lesson.title}</span>
                            <span className="text-[10px] font-semibold text-muted-foreground/75 mt-0.5">
                              {lesson.content?.length?.toLocaleString() || 0} characters
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-4">
                          <span className="rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase bg-muted text-muted-foreground border border-border/40">
                            {lesson.moduleId
                              ? moduleNameMap[lesson.moduleId] || "Unknown"
                              : "Unassigned"}
                          </span>
                        </TableCell>

                        <TableCell className="px-4 py-4">
                          {effectivePhase.phaseName && !effectivePhase.inherited ? (
                            <span className="rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase border tracking-wider bg-[#ff6636]/10 text-[#ff6636] border-[#ff6636]/25">
                              {effectivePhase.phaseName}
                            </span>
                          ) : effectivePhase.phaseName && effectivePhase.inherited ? (
                            <span
                              title="Inherited from assigned module"
                              className="rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase border border-dashed tracking-wider bg-[#ff6636]/5 text-[#ff6636]/80 border-[#ff6636]/30"
                            >
                              {effectivePhase.phaseName} (via module)
                            </span>
                          ) : (
                            <span className="rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase border tracking-wider bg-muted text-muted-foreground border-border/40">
                              Unassigned
                            </span>
                          )}
                        </TableCell>

                      <TableCell className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              aria-label="Actions"
                              className="size-8 rounded-xl border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors ml-auto"
                            >
                              <MoreVertical className="size-4" />
                            </button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end" className="rounded-xl border-border bg-popover">
                            <DropdownMenuLabel className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground px-3.5 py-2">Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-border" />

                            <DropdownMenuItem onClick={() => openEdit(lesson)} className="text-xs font-semibold px-3.5 py-2 cursor-pointer gap-2">
                              <Edit2 className="size-3.5" />
                              Edit Unit
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => openQuizDialog(lesson)}
                              className="text-xs font-semibold px-3.5 py-2 cursor-pointer gap-2"
                            >
                              <Award className="size-3.5 text-[#ff6636]" />
                              {lesson.quiz ? "Edit Knowledge Quiz" : "Add Knowledge Quiz"}
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => openChangeModule(lesson.id)}
                              className="text-xs font-semibold px-3.5 py-2 cursor-pointer gap-2"
                            >
                              <FolderTree className="size-3.5" />
                              Change Module
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="bg-border" />

                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(lesson.id)}
                              className="text-xs font-bold text-red-500 focus:bg-red-500/10 focus:text-red-500 px-3.5 py-2 cursor-pointer gap-2"
                            >
                              <Trash2 className="size-3.5" />
                              Delete Unit
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Lesson Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className="flex h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-[1600px] flex-col gap-0 overflow-hidden rounded-2xl border-border bg-card p-0 text-foreground shadow-2xl sm:h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-2rem)] sm:w-[calc(100vw-2.5rem)] lg:w-[calc(100vw-3rem)]"
          onKeyDownCapture={handleLessonDialogKeyDown}
        >
          {/* IMPORTANT: make the dialog a full-height flex column */}
          <div className="flex min-h-0 flex-1 flex-col">
            {/* Header */}
            <div className="shrink-0 border-b border-border/50 bg-muted/10 px-4 py-3.5 pr-12 sm:px-6 sm:py-4 sm:pr-14 lg:px-8">
              <DialogHeader className="space-y-1">
                <DialogTitle className="text-base font-extrabold text-foreground">{dialogTitle}</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Create engaging syllabus units with our rich text editor featuring panels, callouts, and code frames.
                </DialogDescription>
              </DialogHeader>
            </div>

            {/* Body (scroll region) */}
            <div className="min-h-0 flex-1 overflow-y-auto bg-card px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
              <div className="space-y-4">
                {/* Top fields */}
                <div className="grid grid-cols-12 gap-4">
                  {/* Title */}
                  <div className="col-span-12 lg:col-span-7 space-y-1.5">
                    <Label htmlFor="lesson-title" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Lesson Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      ref={titleInputRef}
                      id="lesson-title"
                      placeholder="e.g., Building a Navbar (Step by Step)"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="h-10 rounded-xl border-border bg-background text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/80"
                    />
                  </div>

                  {/* Module */}
                  <div className="col-span-12 lg:col-span-5 space-y-1.5">
                    <Label htmlFor="lesson-module" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Module Assignment
                    </Label>
                    <Select
                      value={formData.moduleId || "unassigned"}
                      onValueChange={(value) => {
                        const nextModuleId = value === "unassigned" ? "" : value;
                        const modulePhaseId =
                          nextModuleId && moduleMap[nextModuleId]
                            ? getPhaseIdValue(moduleMap[nextModuleId].phaseId)
                            : "none";
                        setFormData((prev) => ({
                          ...prev,
                          moduleId: nextModuleId,
                          phaseId:
                            prev.phaseId === "none" && modulePhaseId !== "none"
                              ? modulePhaseId
                              : prev.phaseId,
                        }));
                      }}
                    >
                      <SelectTrigger
                        id="lesson-module"
                        className="h-10 w-full rounded-xl border-border bg-background text-xs font-semibold focus-visible:ring-0 focus-visible:border-border/80"
                      >
                        <SelectValue placeholder="Choose a module" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="unassigned" className="text-xs font-semibold">Unassigned</SelectItem>
                        {modules
                          .slice()
                          .sort((a, b) => a.order - b.order)
                          .map((moduleItem) => {
                            const pName = getPhaseName(moduleItem.phaseId);
                            return (
                              <SelectItem
                                key={moduleItem.id}
                                value={moduleItem.id}
                                className="text-xs font-semibold"
                              >
                                {moduleItem.title} {pName ? `(${pName})` : ""}
                              </SelectItem>
                            );
                          })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* YouTube Video URL & Duration & Phase */}
                  <div className="col-span-12 sm:col-span-8 lg:col-span-5 space-y-1.5">
                    <Label htmlFor="lesson-video" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Video className="size-3 text-red-500" /> YouTube Video Source
                    </Label>
                    <Input
                      id="lesson-video"
                      placeholder="https://www.youtube.com/watch?v=... or Video ID"
                      value={formData.videoUrl}
                      onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                      className="h-10 rounded-xl border-border bg-background text-xs font-semibold focus-visible:ring-0 focus-visible:border-border/80"
                    />
                  </div>
                  <div className="col-span-12 sm:col-span-4 lg:col-span-2 space-y-1.5">
                    <Label htmlFor="lesson-duration" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Duration (Mins)
                    </Label>
                    <Input
                      id="lesson-duration"
                      type="number"
                      placeholder="e.g. 15"
                      value={formData.durationMinutes}
                      onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                      className="h-10 rounded-xl border-border bg-background text-xs font-semibold focus-visible:ring-0 focus-visible:border-border/80"
                    />
                  </div>

                  {/* Phase */}
                  <div className="col-span-12 lg:col-span-5 space-y-1.5">
                    <Label htmlFor="lesson-phase" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Phase Assignment
                    </Label>
                    <Select
                      value={formData.phaseId || "none"}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          phaseId: value === "none" ? "none" : value,
                        })
                      }
                    >
                      <SelectTrigger
                        id="lesson-phase"
                        className="h-10 w-full rounded-xl border-border bg-background text-xs font-semibold focus-visible:ring-0 focus-visible:border-border/80"
                      >
                        <SelectValue placeholder="Choose a phase" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="none" className="text-xs font-semibold">Unassigned</SelectItem>
                        {phases.map((phase) => (
                          <SelectItem
                            key={phase.id}
                            value={phase.id}
                            className="text-xs font-semibold"
                          >
                            {phase.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Free Lesson Checkbox */}
                  <div className="col-span-12 lg:col-span-7 flex items-center space-x-2.5 rounded-xl border border-border/40 bg-muted/10 px-4 py-3">
                    <Checkbox
                      id="is-free"
                      checked={formData.isFree}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isFree: checked as boolean })
                      }
                    />
                    <Label
                      htmlFor="is-free"
                      className="text-xs font-bold text-muted-foreground cursor-pointer select-none"
                    >
                      Make this a free preview lesson (accessible to all visitors without enrollment)
                    </Label>
                  </div>

                  {/* Advanced Options Toggle */}
                  <div className="col-span-12 lg:col-span-5 flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/15 px-4 py-2.5">
                    <div>
                      <p className="text-xs font-bold text-foreground">Advanced Options</p>
                      <p className="text-[10px] font-semibold text-muted-foreground">
                        Configure order indices or clear syllabus blueprints.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setShowAdvancedLessonFields((current) => !current)
                      }
                      className="shrink-0 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground hover:text-[#ff6636] transition-colors"
                    >
                      {showAdvancedLessonFields ? "Hide Options" : "Show Options"}
                    </button>
                  </div>

                  {showAdvancedLessonFields ? (
                    <div className="col-span-12 grid grid-cols-12 gap-3">
                      <div className="col-span-12 md:col-span-6 lg:col-span-4 space-y-1.5">
                        <Label htmlFor="lesson-order" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Order Index <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="lesson-order"
                          type="number"
                          min="1"
                          value={formData.order}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              order: Number.isFinite(parseInt(e.target.value))
                                ? parseInt(e.target.value)
                                : 1,
                            })
                          }
                          className="h-10 rounded-xl border-border bg-background text-xs font-semibold placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/80"
                        />
                      </div>

                      <div className="col-span-12 md:col-span-6 lg:col-span-3 flex items-end">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 w-full gap-2 rounded-xl text-xs font-bold"
                          onClick={resetForm}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Reset Blueprint
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Editor / Preview */}
                <div className="min-h-0 pt-1">
                  <Tabs
                    value={activeTab}
                    onValueChange={(v) => setActiveTab(v as "edit" | "preview")}
                    className="flex min-h-0 flex-col"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <TabsList className="h-10 rounded-xl bg-muted/20 border border-border/40 p-1">
                        <TabsTrigger value="edit" className="px-4 gap-1.5 rounded-lg text-xs font-bold data-[state=active]:bg-[#ff6636] data-[state=active]:text-white">
                          <PencilLine className="h-3.5 w-3.5" />
                          Edit Code
                        </TabsTrigger>
                        <TabsTrigger value="preview" className="px-4 gap-1.5 rounded-lg text-xs font-bold data-[state=active]:bg-[#ff6636] data-[state=active]:text-white">
                          <Eye className="h-3.5 w-3.5" />
                          Live Preview
                        </TabsTrigger>
                      </TabsList>

                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 sm:text-right">
                        Live preview (same renderer students will see)
                      </div>
                    </div>

                    <TabsContent value="edit" className="mt-4">
                      <div className="flex flex-col gap-3">
                        <Label htmlFor="lesson-content" className="text-sm">
                          Content <span className="text-destructive">*</span>
                        </Label>

                        <div className="h-[62dvh] min-h-[460px] max-h-[960px]">
                          <LessonEditor
                            value={formData.content}
                            onChange={(content) =>
                              setFormData({
                                ...formData,
                                content,
                              })
                            }
                          />
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Create rich content with info panels, callouts,
                          expandable sections, and code blocks. Use the Insert
                          menu for special elements.
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value="preview" className="mt-4">
                      <div className="h-[62dvh] min-h-[460px] max-h-[960px] overflow-hidden rounded-xl border bg-muted/10">
                        <div className="h-full overflow-y-auto p-6">
                          {formData.content ? (
                            (() => {
                              try {
                                const content = JSON.parse(formData.content);
                                return <RichTextRenderer content={content} />;
                              } catch {
                                return (
                                  <p className="text-muted-foreground italic">
                                    Invalid content format
                                  </p>
                                );
                              }
                            })()
                          ) : (
                            <p className="text-muted-foreground italic">
                              Start editing to see preview...
                            </p>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>

            {/* Footer (always visible) */}
            <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-border/50 bg-muted/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5 lg:px-8">
              <Button
                variant="outline"
                className="w-full sm:w-auto rounded-xl h-10 text-xs font-bold"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>

              <div className="flex w-full items-center gap-2 sm:w-auto">
                <Button
                  className="w-full sm:w-auto rounded-xl h-10 text-xs font-bold bg-[#ff6636] hover:bg-[#e95a2b] text-white shadow-md shadow-[#ff6636]/10"
                  onClick={() => handleSaveLesson(false)}
                  disabled={isSaving}
                >
                  {isSaving
                    ? "Saving..."
                    : editingId
                      ? "Update Unit"
                      : "Create Lesson"}
                </Button>
                {!editingId ? (
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto rounded-xl h-10 text-xs font-bold border-border hover:border-[#ff6636]/40 hover:text-[#ff6636]"
                    onClick={() => handleSaveLesson(true)}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Create & Add Another"}
                  </Button>
                ) : null}
              </div>
            </div>
            {!editingId ? (
              <div className="shrink-0 border-t border-border/50 bg-card px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/80 sm:px-6 lg:px-8">
                Tip: Press Ctrl+Enter (or Cmd+Enter) to save blueprint and continue adding.
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Module Change Dialog */}
      <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-border bg-card text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-foreground">Change Module</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Assign this lesson unit to a different module.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5 py-2">
            <Label htmlFor="quick-module-select" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Syllabus Module</Label>
            <Select
              value={selectedModuleId}
              onValueChange={setSelectedModuleId}
            >
              <SelectTrigger id="quick-module-select" className="h-10 rounded-xl border-border text-xs font-semibold bg-background">
                <SelectValue placeholder="Choose a module" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="unassigned" className="text-xs font-semibold">Unassigned</SelectItem>
                {modules
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((moduleItem) => {
                    const pName = getPhaseName(moduleItem.phaseId);
                    return (
                      <SelectItem key={moduleItem.id} value={moduleItem.id} className="text-xs font-semibold">
                        {moduleItem.title} {pName ? `(${pName})` : ""}
                      </SelectItem>
                    );
                  })}
              </SelectContent>
            </Select>
          </div>

          {phases.length > 0 &&
            selectedModuleId !== "unassigned" &&
            getPhaseName(moduleMap[selectedModuleId]?.phaseId) && (
              <div className="flex items-center space-x-2 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5">
                <Checkbox
                  id="sync-quick-module-phase"
                  checked={syncQuickModulePhase}
                  onCheckedChange={(checked) =>
                    setSyncQuickModulePhase(Boolean(checked))
                  }
                />
                <Label
                  htmlFor="sync-quick-module-phase"
                  className="text-xs font-semibold text-foreground cursor-pointer select-none"
                >
                  Also sync lesson phase to &ldquo;
                  {getPhaseName(moduleMap[selectedModuleId]?.phaseId)}&rdquo;
                </Label>
              </div>
            )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsModuleDialogOpen(false)}
              className="rounded-xl h-10 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleChangeModule} 
              disabled={isSaving}
              className="rounded-xl h-10 text-xs font-bold bg-[#ff6636] hover:bg-[#e95a2b] text-white"
            >
              {isSaving ? "Updating..." : "Update"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-border bg-card text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-foreground">
              {lessonToDelete
                ? "Delete Lesson Unit?"
                : `Delete ${selectedLessons.size} Lesson Units?`}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {lessonToDelete
                ? "Are you sure you want to delete this lesson? This action cannot be undone."
                : `Are you sure you want to delete ${selectedLessons.size} selected lesson(s)? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
              className="rounded-xl h-10 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={lessonToDelete ? handleDeleteLesson : handleBulkDelete}
              disabled={isDeleting}
              className="rounded-xl h-10 text-xs font-bold bg-red-500 hover:bg-red-600 text-white border-none"
            >
              {isDeleting ? "Deleting..." : "Permanently Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Module Confirmation Dialog */}
      <Dialog
        open={isDeleteModuleDialogOpen}
        onOpenChange={setIsDeleteModuleDialogOpen}
      >
        <DialogContent className="sm:max-w-md rounded-2xl border-border bg-card text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-foreground">Delete Module Block?</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to delete this module? All lessons in this
              module will be left unassigned. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModuleDialogOpen(false)}
              disabled={isDeleting}
              className="rounded-xl h-10 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteModule}
              disabled={isDeleting}
              className="rounded-xl h-10 text-xs font-bold bg-red-500 hover:bg-red-600 text-white border-none"
            >
              {isDeleting ? "Deleting..." : "Permanently Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Assign to Module Dialog */}
      <Dialog
        open={isBulkAssignDialogOpen}
        onOpenChange={setIsBulkAssignDialogOpen}
      >
        <DialogContent className="sm:max-w-md rounded-2xl border-border bg-card text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-foreground">Assign to Module</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Assign {selectedLessons.size} selected lesson(s) to a syllabus module.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5 py-2">
            <Label htmlFor="bulk-module-select" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Syllabus Module</Label>
            <Select
              value={bulkAssignModuleId}
              onValueChange={setBulkAssignModuleId}
            >
              <SelectTrigger id="bulk-module-select" className="h-10 rounded-xl border-border text-xs font-semibold bg-background">
                <SelectValue placeholder="Choose a module" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="unassigned" className="text-xs font-semibold">Unassigned</SelectItem>
                {modules
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((moduleItem) => {
                    const pName = getPhaseName(moduleItem.phaseId);
                    return (
                      <SelectItem key={moduleItem.id} value={moduleItem.id} className="text-xs font-semibold">
                        {moduleItem.title} {pName ? `(${pName})` : ""}
                      </SelectItem>
                    );
                  })}
              </SelectContent>
            </Select>
          </div>

          {phases.length > 0 &&
            bulkAssignModuleId !== "unassigned" &&
            getPhaseName(moduleMap[bulkAssignModuleId]?.phaseId) && (
              <div className="flex items-center space-x-2 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5">
                <Checkbox
                  id="sync-bulk-module-phase"
                  checked={syncBulkModulePhase}
                  onCheckedChange={(checked) =>
                    setSyncBulkModulePhase(Boolean(checked))
                  }
                />
                <Label
                  htmlFor="sync-bulk-module-phase"
                  className="text-xs font-semibold text-foreground cursor-pointer select-none"
                >
                  Also sync lesson phase to &ldquo;
                  {getPhaseName(moduleMap[bulkAssignModuleId]?.phaseId)}&rdquo;
                </Label>
              </div>
            )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsBulkAssignDialogOpen(false)}
              disabled={isSaving}
              className="rounded-xl h-10 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleBulkAssignModule} 
              disabled={isSaving}
              className="rounded-xl h-10 text-xs font-bold bg-[#ff6636] hover:bg-[#e95a2b] text-white"
            >
              {isSaving ? "Assigning..." : "Assign"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Assign to Phase Dialog */}
      <Dialog
        open={isBulkPhaseDialogOpen}
        onOpenChange={setIsBulkPhaseDialogOpen}
      >
        <DialogContent className="sm:max-w-md rounded-2xl border-border bg-card text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-foreground">Assign to Phase</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Assign {selectedLessons.size} selected lesson(s) to a course phase.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5 py-2">
            <Label htmlFor="bulk-phase-select" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Course Phase</Label>
            <Select
              value={bulkAssignPhaseId}
              onValueChange={setBulkAssignPhaseId}
            >
              <SelectTrigger id="bulk-phase-select" className="h-10 rounded-xl border-border text-xs font-semibold bg-background">
                <SelectValue placeholder="Choose a phase" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="none" className="text-xs font-semibold">Unassigned</SelectItem>
                {phases.map((phase) => (
                  <SelectItem key={phase.id} value={phase.id} className="text-xs font-semibold">
                    {phase.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsBulkPhaseDialogOpen(false)}
              disabled={isSaving}
              className="rounded-xl h-10 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkAssignPhase}
              disabled={isSaving}
              className="rounded-xl h-10 text-xs font-bold bg-[#ff6636] hover:bg-[#e95a2b] text-white"
            >
              {isSaving ? "Assigning..." : "Assign Phase"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
          {/* Knowledge Check Quiz Builder Modal */}
      {quizLesson && (
        <QuizBuilderModal
          isOpen={quizModalOpen}
          onClose={() => {
            setQuizModalOpen(false);
            setQuizLesson(null);
          }}
          lessonId={quizLesson.id}
          lessonTitle={quizLesson.title}
          onQuizSaved={async () => {
            const res = await fetch(`/api/admin/lessons?courseId=${courseId}`);
            if (res.ok) {
              const data = await res.json();
              setLessons(data);
            }
          }}
        />
      )}
    </AdminPage>
  );
}
