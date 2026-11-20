"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Code2,
  ExternalLink,
  FolderCode,
  GitBranch,
  ListChecks,
  Plus,
  X,
} from "lucide-react";

export interface ProjectMetadataState {
  demoUrl: string;
  starterRepoUrl: string;
  githubUrl: string;
  techStack: string[];
  prerequisites: string;
  deliverables: string[];
}

interface ProjectMetadataFieldsProps {
  value: ProjectMetadataState;
  onChange: (next: ProjectMetadataState) => void;
}

export function ProjectMetadataFields({
  value,
  onChange,
}: ProjectMetadataFieldsProps) {
  const [techInput, setTechInput] = useState("");
  const [deliverableInput, setDeliverableInput] = useState("");

  const addTech = () => {
    const trimmed = techInput.trim();
    if (
      trimmed &&
      !value.techStack.some((t) => t.toLowerCase() === trimmed.toLowerCase())
    ) {
      onChange({ ...value, techStack: [...value.techStack, trimmed] });
      setTechInput("");
    }
  };

  const removeTech = (idx: number) => {
    onChange({
      ...value,
      techStack: value.techStack.filter((_, i) => i !== idx),
    });
  };

  const addDeliverable = () => {
    const trimmed = deliverableInput.trim();
    if (trimmed && !value.deliverables.includes(trimmed)) {
      onChange({ ...value, deliverables: [...value.deliverables, trimmed] });
      setDeliverableInput("");
    }
  };

  const removeDeliverable = (idx: number) => {
    onChange({
      ...value,
      deliverables: value.deliverables.filter((_, i) => i !== idx),
    });
  };

  return (
    <Card className="rounded-2xl border border-violet-500/25 bg-card shadow-sm overflow-hidden">
      <CardHeader className="border-b border-border/50 px-6 py-4 flex flex-row items-center justify-between gap-2 bg-violet-500/5">
        <div className="flex items-center gap-2">
          <FolderCode className="size-4 text-violet-500" />
          <CardTitle className="text-sm font-extrabold text-foreground">
            Project Tutorial Blueprint &amp; Resources
          </CardTitle>
        </div>
        <span className="rounded-full bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
          Project Metadata
        </span>
      </CardHeader>

      <CardContent className="p-6 space-y-5">
        {/* Live Demo URL */}
        <div className="space-y-1.5">
          <Label
            htmlFor="demoUrl"
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
          >
            <ExternalLink className="size-3 text-emerald-500" />
            Live Demo URL (Always Public)
          </Label>
          <Input
            id="demoUrl"
            type="url"
            placeholder="https://demo.devforge.dev/saas-starter"
            value={value.demoUrl}
            onChange={(e) => onChange({ ...value, demoUrl: e.target.value })}
            className="h-10 rounded-xl border-border text-xs font-semibold"
          />
        </div>

        {/* Starter & Final Repo URLs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="starterRepoUrl"
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              <GitBranch className="size-3 text-violet-500" />
              Starter Repo URL
            </Label>
            <Input
              id="starterRepoUrl"
              type="url"
              placeholder="https://github.com/org/project-starter"
              value={value.starterRepoUrl}
              onChange={(e) =>
                onChange({ ...value, starterRepoUrl: e.target.value })
              }
              className="h-10 rounded-xl border-border text-xs font-semibold"
            />
            <p className="text-[10px] text-muted-foreground font-medium">
              Public on free projects; gated behind enrollment on paid projects.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="githubUrl"
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              <FolderCode className="size-3 text-[#ff6636]" />
              Final Reference Repo URL
            </Label>
            <Input
              id="githubUrl"
              type="url"
              placeholder="https://github.com/org/project-final"
              value={value.githubUrl}
              onChange={(e) =>
                onChange({ ...value, githubUrl: e.target.value })
              }
              className="h-10 rounded-xl border-border text-xs font-semibold"
            />
            <p className="text-[10px] text-muted-foreground font-medium">
              Completed codebase for learners to compare against.
            </p>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="space-y-2 pt-2 border-t border-border/50">
          <Label
            htmlFor="techStack"
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
          >
            <Code2 className="size-3 text-[#ff6636]" />
            Tech Stack (Filterable on /projects &amp; shown on Project Certificates)
          </Label>
          <div className="flex gap-2">
            <Input
              id="techStack"
              placeholder="e.g. Next.js, PostgreSQL, Prisma, Tailwind CSS"
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTech();
                }
              }}
              className="h-10 rounded-xl border-border text-xs font-semibold"
            />
            <button
              type="button"
              onClick={addTech}
              className="flex h-10 items-center justify-center gap-1 rounded-xl border border-border bg-card px-4 text-xs font-bold uppercase tracking-wider text-foreground hover:border-violet-500/40 hover:text-violet-500 transition-all"
            >
              <Plus className="size-3.5" /> Add
            </button>
          </div>
          {value.techStack.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {value.techStack.map((tech, index) => (
                <Badge
                  key={tech}
                  variant="secondary"
                  onClick={() => removeTech(index)}
                  title="Remove technology"
                  className="cursor-pointer gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                >
                  {tech}
                  <X className="size-3" />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Deliverables */}
        <div className="space-y-2 pt-2 border-t border-border/50">
          <Label
            htmlFor="deliverables"
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
          >
            <ListChecks className="size-3 text-emerald-500" />
            Key Deliverables (What learners will build &amp; ship)
          </Label>
          <div className="flex gap-2">
            <Input
              id="deliverables"
              placeholder="e.g. Deploy a multi-tenant REST API with role-based auth"
              value={deliverableInput}
              onChange={(e) => setDeliverableInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addDeliverable();
                }
              }}
              className="h-10 rounded-xl border-border text-xs font-semibold"
            />
            <button
              type="button"
              onClick={addDeliverable}
              className="flex h-10 items-center justify-center gap-1 rounded-xl border border-border bg-card px-4 text-xs font-bold uppercase tracking-wider text-foreground hover:border-emerald-500/40 hover:text-emerald-600 transition-all"
            >
              <Plus className="size-3.5" /> Add
            </button>
          </div>
          {value.deliverables.length > 0 && (
            <ul className="space-y-1.5 pt-1">
              {value.deliverables.map((item, idx) => (
                <li
                  key={`${item}-${idx}`}
                  className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/25 px-3 py-2 text-xs font-semibold text-foreground"
                >
                  <span className="truncate">{item}</span>
                  <button
                    type="button"
                    onClick={() => removeDeliverable(idx)}
                    className="text-muted-foreground hover:text-rose-500 shrink-0"
                    title="Remove deliverable"
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Prerequisites */}
        <div className="space-y-1.5 pt-2 border-t border-border/50">
          <Label
            htmlFor="prerequisites"
            className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
          >
            Prerequisites (Optional)
          </Label>
          <Textarea
            id="prerequisites"
            placeholder="e.g. Comfortable with TypeScript, basic React hooks, and Git workflows."
            value={value.prerequisites}
            onChange={(e) =>
              onChange({ ...value, prerequisites: e.target.value })
            }
            rows={2}
            className="min-h-16 rounded-xl border-border text-xs font-semibold"
          />
        </div>
      </CardContent>
    </Card>
  );
}
