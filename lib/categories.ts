import {
  BookOpen,
  MonitorPlay,
  Database,
  Layers3,
  Code2,
  Terminal,
  Globe,
  Braces,
  Smartphone,
  Shield,
  Cpu,
  Sparkles,
  Server,
  Cloud,
  Zap,
  Rocket,
  Wrench,
  Binary,
  Compass,
  Palette,
  Briefcase,
  Workflow,
  Laptop,
  Flame,
  Atom,
  Boxes,
  type LucideIcon,
} from "lucide-react";

export interface DefaultCategorySeed {
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  order: number;
}

export const DEFAULT_CATEGORIES: DefaultCategorySeed[] = [
  {
    name: "Frontend",
    slug: "FRONTEND",
    description:
      "Modern client-side engineering, responsive UI, design systems, and web apps.",
    icon: "MonitorPlay",
    color: "violet",
    order: 0,
  },
  {
    name: "Backend",
    slug: "BACKEND",
    description:
      "Server architectures, distributed systems, REST/GraphQL APIs, and microservices.",
    icon: "Database",
    color: "blue",
    order: 1,
  },
  {
    name: "Full Stack",
    slug: "FULL_STACK",
    description:
      "End-to-end full stack development connecting robust databases to reactive frontends.",
    icon: "Layers3",
    color: "orange",
    order: 2,
  },
  {
    name: "Python",
    slug: "PYTHON",
    description:
      "Data structures, automation, scientific computing, AI pipelines, and web frameworks.",
    icon: "Code2",
    color: "emerald",
    order: 3,
  },
  {
    name: "PowerShell",
    slug: "POWERSHELL",
    description:
      "Automation, cloud infrastructure scripting, DevOps pipelines, and systems management.",
    icon: "Terminal",
    color: "sky",
    order: 4,
  },
  {
    name: "JavaScript",
    slug: "JAVASCRIPT",
    description:
      "Core JavaScript semantics, ESNext features, asynchronous patterns, and browser runtimes.",
    icon: "Braces",
    color: "yellow",
    order: 5,
  },
  {
    name: "TypeScript",
    slug: "TYPESCRIPT",
    description:
      "Type safety, advanced generics, compiler options, and large-scale application design.",
    icon: "Braces",
    color: "cyan",
    order: 6,
  },
  {
    name: "C#",
    slug: "CSHARP",
    description:
      "Object-oriented programming, modern C# language features, LINQ, and enterprise systems.",
    icon: "Code2",
    color: "purple",
    order: 7,
  },
  {
    name: ".NET",
    slug: "DOT_NET",
    description:
      "Cross-platform .NET runtime, Entity Framework Core, performance tuning, and CLR internals.",
    icon: "Globe",
    color: "indigo",
    order: 8,
  },
  {
    name: "ASP.NET",
    slug: "ASP_NET",
    description:
      "High-throughput web APIs, Razor pages, Blazor, SignalR, and microservices with ASP.NET Core.",
    icon: "Globe",
    color: "teal",
    order: 9,
  },
];

export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  MonitorPlay,
  Database,
  Layers3,
  Code2,
  Terminal,
  Globe,
  Braces,
  Smartphone,
  Shield,
  Cpu,
  Sparkles,
  Server,
  Cloud,
  Zap,
  Rocket,
  Wrench,
  Binary,
  Compass,
  Palette,
  Briefcase,
  Workflow,
  Laptop,
  Flame,
  Atom,
  Boxes,
  BookOpen,
};

export const AVAILABLE_ICONS = [
  { name: "MonitorPlay", label: "Monitor / Display", icon: MonitorPlay },
  { name: "Database", label: "Database / Storage", icon: Database },
  { name: "Layers3", label: "Layers / Full Stack", icon: Layers3 },
  { name: "Code2", label: "Code / Syntax", icon: Code2 },
  { name: "Terminal", label: "Terminal / CLI", icon: Terminal },
  { name: "Globe", label: "Globe / Web", icon: Globe },
  { name: "Braces", label: "Braces / JS / TS", icon: Braces },
  { name: "Cloud", label: "Cloud / DevOps", icon: Cloud },
  { name: "Server", label: "Server / Infrastructure", icon: Server },
  { name: "Smartphone", label: "Mobile / Apps", icon: Smartphone },
  { name: "Shield", label: "Security / Auth", icon: Shield },
  { name: "Cpu", label: "Hardware / Low-level", icon: Cpu },
  { name: "Zap", label: "Lightning / Performance", icon: Zap },
  { name: "Rocket", label: "Rocket / Launch", icon: Rocket },
  { name: "Wrench", label: "Tools / Utility", icon: Wrench },
  { name: "Binary", label: "Binary / Algorithms", icon: Binary },
  { name: "Palette", label: "Design / UI / UX", icon: Palette },
  { name: "Briefcase", label: "Career / Business", icon: Briefcase },
  { name: "Workflow", label: "Workflows / Architecture", icon: Workflow },
  { name: "Laptop", label: "Computing / General", icon: Laptop },
  { name: "Flame", label: "Hot / Trending", icon: Flame },
  { name: "Atom", label: "Framework / React", icon: Atom },
  { name: "Boxes", label: "Packages / Modular", icon: Boxes },
  { name: "Sparkles", label: "AI / GenAI / Smart", icon: Sparkles },
  { name: "BookOpen", label: "General Course", icon: BookOpen },
];

export interface ColorTheme {
  id: string;
  name: string;
  text: string;
  bg: string;
  border: string;
  badge: string;
  dot: string;
}

export const CATEGORY_COLORS: Record<string, ColorTheme> = {
  orange: {
    id: "orange",
    name: "Brand Orange",
    text: "text-[#ff6636]",
    bg: "bg-[#ff6636]/10",
    border: "border-[#ff6636]/30",
    badge: "bg-[#ff6636]/10 text-[#ff6636] border-[#ff6636]/20",
    dot: "bg-[#ff6636]",
  },
  violet: {
    id: "violet",
    name: "Violet",
    text: "text-violet-500",
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    badge: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    dot: "bg-violet-500",
  },
  blue: {
    id: "blue",
    name: "Blue",
    text: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    dot: "bg-blue-500",
  },
  emerald: {
    id: "emerald",
    name: "Emerald",
    text: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  sky: {
    id: "sky",
    name: "Sky",
    text: "text-sky-500",
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
    badge: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    dot: "bg-sky-500",
  },
  cyan: {
    id: "cyan",
    name: "Cyan",
    text: "text-cyan-500",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    badge: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
    dot: "bg-cyan-500",
  },
  purple: {
    id: "purple",
    name: "Purple",
    text: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    badge: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    dot: "bg-purple-500",
  },
  indigo: {
    id: "indigo",
    name: "Indigo",
    text: "text-indigo-500",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/30",
    badge: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    dot: "bg-indigo-500",
  },
  teal: {
    id: "teal",
    name: "Teal",
    text: "text-teal-500",
    bg: "bg-teal-500/10",
    border: "border-teal-500/30",
    badge: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
    dot: "bg-teal-500",
  },
  yellow: {
    id: "yellow",
    name: "Yellow / Amber",
    text: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    dot: "bg-amber-500",
  },
  rose: {
    id: "rose",
    name: "Rose / Red",
    text: "text-rose-500",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    dot: "bg-rose-500",
  },
  slate: {
    id: "slate",
    name: "Slate / Gray",
    text: "text-slate-500",
    bg: "bg-slate-500/10",
    border: "border-slate-500/30",
    badge: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    dot: "bg-slate-500",
  },
};

export function getCategoryColorTheme(colorKey?: string | null): ColorTheme {
  if (!colorKey) return CATEGORY_COLORS.orange;
  const normalized = colorKey.toLowerCase().trim();
  if (CATEGORY_COLORS[normalized]) {
    return CATEGORY_COLORS[normalized];
  }
  // Try matching substring or hex
  for (const [key, theme] of Object.entries(CATEGORY_COLORS)) {
    if (normalized.includes(key) || theme.text.includes(normalized)) {
      return theme;
    }
  }
  return CATEGORY_COLORS.orange;
}

export function getCategoryIcon(iconName?: string | null): LucideIcon {
  if (!iconName) return BookOpen;
  return CATEGORY_ICON_MAP[iconName] || BookOpen;
}

export function generateCategorySlug(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
