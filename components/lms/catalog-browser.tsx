"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Code2,
  ExternalLink,
  Filter,
  FolderCode,
  Layers3,
  Play,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Users,
  X,
  Zap,
} from "lucide-react";

import {
  MarketingPublicFooter,
  MarketingPublicHeader,
} from "@/components/marketing/public-chrome";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getCategoryColorTheme,
  getCategoryIcon,
} from "@/lib/categories";
import {
  getCatalogBasePath,
  getPublicApiBasePath,
  isProjectTutorial,
  type ContentType,
} from "@/lib/content-type";
import { getProxiedImageUrl } from "@/lib/s3-utils";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CatalogListItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  contentType?: ContentType;
  category: string;
  level: string;
  tags?: string[];
  techStack?: string[];
  demoUrl?: string | null;
  hasStarterRepo?: boolean;
  hasGithubRepo?: boolean;
  phaseCount?: number;
  price: number;
  imageUrl?: string | null;
  instructor: string;
  status: string;
  lessons: number;
  enrollments: number;
  publishedAt?: string;
  rating: number;
  totalReviews: number;
}

interface PublicCategoryMeta {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  color?: string | null;
  scope?: string;
  courseCount?: number;
  projectCount?: number;
}

type PriceFilter = "free" | "paid";
type TypeFilter = "online";

const SORT_OPTIONS = [
  { value: "newly-published", label: "Newest first" },
  { value: "popular", label: "Most popular" },
  { value: "price-low", label: "Price: low → high" },
  { value: "price-high", label: "Price: high → low" },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number]["value"];

const SORT_LABELS: Record<SortOption, string> = {
  "newly-published": "Newest first",
  popular: "Most popular",
  "price-low": "Price: low → high",
  "price-high": "Price: high → low",
};

function isSortOption(v: string | null): v is SortOption {
  return SORT_OPTIONS.some((o) => o.value === v);
}

function formatCategoryFallback(str: string): string {
  if (!str) return "General";
  return str
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatPrice(price: number) {
  return price > 0 ? `$${price.toFixed(2)}` : "Free";
}

function formatCompact(n: number) {
  return new Intl.NumberFormat("en-US", {
    notation: n >= 1000 ? "compact" : "standard",
    maximumFractionDigits: n >= 1000 ? 1 : 0,
  }).format(n);
}

function normalizeLevel(level?: string) {
  switch (level?.toLowerCase()) {
    case "beginner":
      return "Beginner" as const;
    case "intermediate":
      return "Intermediate" as const;
    case "advanced":
      return "Advanced" as const;
    case "expert":
      return "Expert" as const;
    default:
      return undefined;
  }
}

// ─── Catalog Card ─────────────────────────────────────────────────────────────

function CatalogCard({
  item,
  contentType,
  resolveCat,
}: {
  item: CatalogListItem;
  contentType: ContentType;
  resolveCat: (slug: string) => {
    label: string;
    icon: LucideIcon;
    color: string;
    bg: string;
  };
}) {
  const isProject = isProjectTutorial(contentType);
  const basePath = getCatalogBasePath(contentType);
  const href = `${basePath}/${item.slug}`;
  const cat = resolveCat(item.category);
  const Icon = cat.icon;
  const imageUrl = item.imageUrl ? getProxiedImageUrl(item.imageUrl) : null;
  const level = normalizeLevel(item.level);
  const levelColors: Record<string, string> = {
    Beginner: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    Intermediate: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    Advanced: "bg-red-500/10 text-red-600 dark:text-red-400",
    Expert: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  };
  const techStack = item.techStack ?? [];

  return (
    <article className="group flex flex-col h-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/40 hover:border-[#ff6636]/40">
      {/* Thumbnail */}
      <Link
        href={href}
        className="relative block aspect-video overflow-hidden bg-muted/40"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.title}
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br",
              isProject
                ? "from-violet-600 via-[#ff6636] to-[#1d2026]"
                : "from-[#ff8f6a] via-[#ff6636] to-[#1d2026]",
            )}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Top badges */}
        <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm bg-black/55 border border-white/10 text-white">
            <Icon className="size-3" />
            {cat.label}
          </span>
          <span className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold backdrop-blur-sm bg-black/55 border border-white/10 text-white">
            {formatPrice(item.price)}
          </span>
        </div>

        {/* Bottom-left project pills */}
        {isProject && (item.demoUrl || (item.phaseCount ?? 0) > 0) && (
          <div className="absolute inset-x-3 bottom-3 flex items-center gap-1.5">
            {(item.phaseCount ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold backdrop-blur-sm bg-violet-600/85 text-white border border-white/15">
                <Layers3 className="size-3" />
                {item.phaseCount} {item.phaseCount === 1 ? "phase" : "phases"}
              </span>
            )}
            {item.demoUrl && (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold backdrop-blur-sm bg-emerald-600/85 text-white border border-white/15">
                <ExternalLink className="size-2.5" />
                Live Demo
              </span>
            )}
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex size-11 items-center justify-center rounded-full bg-white/90 text-[#ff6636] shadow-lg">
            <Play className="size-4 ml-0.5" fill="currentColor" />
          </div>
        </div>
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        {/* Instructor + Level */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`size-5 rounded-full ${cat.bg} ${cat.color} flex items-center justify-center font-bold text-[9px] shrink-0`}
          >
            {item.instructor.charAt(0).toUpperCase()}
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground truncate">
            {item.instructor}
          </span>
          {level && (
            <span
              className={`ml-auto inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${levelColors[level] ?? ""}`}
            >
              {level}
            </span>
          )}
        </div>

        {/* Title */}
        <Link href={href} className="block">
          <h3 className="text-sm font-bold leading-snug text-foreground line-clamp-2 group-hover:text-[#ff6636] transition-colors duration-200">
            {item.title}
          </h3>
        </Link>

        {/* Description */}
        <p className="mt-2 flex-1 text-xs text-muted-foreground font-semibold line-clamp-2 leading-relaxed">
          {item.description}
        </p>

        {/* Tech stack pills for Project Tutorials */}
        {isProject && techStack.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {techStack.slice(0, 3).map((tech) => (
              <span
                key={tech}
                className="inline-flex items-center rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-bold text-foreground/85"
              >
                {tech}
              </span>
            ))}
            {techStack.length > 3 && (
              <span className="inline-flex items-center rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                +{techStack.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Stars */}
        <div className="flex items-center gap-1.5 mt-3">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className="size-3 fill-[#fd8e1f] text-[#fd8e1f]"
              />
            ))}
          </div>
          <span className="text-[11px] font-bold text-foreground">
            {item.rating.toFixed(1)}
          </span>
          {item.totalReviews > 0 && (
            <span className="text-[11px] text-muted-foreground">
              ({item.totalReviews})
            </span>
          )}
          {item.totalReviews === 0 && (
            <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#fd8e1f]">
              New
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-border/50">
          <div className="flex items-center gap-3 text-[10px] font-semibold text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="size-3" />
              {item.lessons} lessons
            </span>
            <span className="flex items-center gap-1">
              <Users className="size-3" />
              {formatCompact(item.enrollments)}
            </span>
          </div>
          <Link
            href={href}
            className="rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-2 transition-colors duration-200"
          >
            {isProject ? "Start Project" : "Enroll"}
          </Link>
        </div>
      </div>
    </article>
  );
}

// ─── Filter Option Button ────────────────────────────────────────────────────

function FilterOptionButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-sm font-semibold transition-all duration-200",
        active
          ? "border-[#ff6636]/60 bg-[#ff6636]/10 text-foreground"
          : "border-border bg-card text-muted-foreground hover:border-[#ff6636]/40 hover:bg-muted/60 hover:text-foreground",
      )}
    >
      <span className="flex items-center gap-2.5 min-w-0">
        <span
          className={cn(
            "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
            active
              ? "border-[#ff6636] bg-[#ff6636]"
              : "border-border bg-muted/60",
          )}
        >
          {active && <span className="size-2 bg-white rounded-sm" />}
        </span>
        <span className="truncate">{label}</span>
      </span>
      {typeof count === "number" && (
        <span
          className={cn(
            "ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
            active
              ? "bg-[#ff6636] text-white"
              : "bg-muted text-muted-foreground",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Active Filter Chip ──────────────────────────────────────────────────────

function ActiveFilterChip({
  label,
  onRemove,
  icon: Icon,
}: {
  label: string;
  onRemove: () => void;
  icon?: LucideIcon;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-2 rounded-full border border-[#ff6636]/30 bg-[#ff6636]/10 px-3 py-1.5 text-xs font-bold text-foreground hover:border-[#ff6636] hover:bg-[#ff6636]/15 transition-all duration-200"
    >
      {Icon && <Icon className="size-3 text-[#ff6636]" />}
      <span>{label}</span>
      <span className="flex size-4 items-center justify-center rounded-full bg-[#ff6636]/15 text-[#ff6636]">
        <X className="size-2.5" />
      </span>
    </button>
  );
}

// ─── Skeleton Cards ───────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-4/5" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <div className="flex justify-between pt-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────────

function CatalogBrowserInner({ contentType }: { contentType: ContentType }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isProject = isProjectTutorial(contentType);
  const basePath = getCatalogBasePath(contentType);
  const apiUrl = getPublicApiBasePath(contentType);

  const [items, setItems] = useState<CatalogListItem[]>([]);
  const [categoryDirectory, setCategoryDirectory] = useState<
    PublicCategoryMeta[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const [selectedPrices, setSelectedPrices] = useState<PriceFilter[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<TypeFilter[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedTechStack, setSelectedTechStack] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newly-published");
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const hasMountedRef = useRef(false);

  const ITEMS_PER_PAGE = 9;

  // ── Init from URL ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (isInitialized) return;
    const prices =
      searchParams
        .get("prices")
        ?.split(",")
        .filter((v): v is PriceFilter => v === "free" || v === "paid") ?? [];
    const types =
      searchParams
        .get("types")
        ?.split(",")
        .filter((v): v is TypeFilter => v === "online") ?? [];
    const rawCats =
      searchParams.get("categories") || searchParams.get("category") || "";
    const cats = rawCats.split(",").filter(Boolean);
    const tags = searchParams.get("tags")?.split(",").filter(Boolean) ?? [];
    const tech =
      searchParams.get("tech")?.split(",").filter(Boolean) ?? [];
    const search = searchParams.get("search") || "";
    const sortP = searchParams.get("sort");
    const sort = isSortOption(sortP) ? sortP : "newly-published";
    const page = parseInt(searchParams.get("page") || "1", 10);

    if (prices.length) setSelectedPrices(prices);
    if (types.length) setSelectedTypes(types);
    if (cats.length) setSelectedCategories(cats);
    if (tags.length) setSelectedTags(tags);
    if (tech.length) setSelectedTechStack(tech);
    if (search) setSearchQuery(search);
    setSortBy(sort);
    if (Number.isFinite(page) && page > 0) setCurrentPage(page);
    setIsInitialized(true);
  }, [isInitialized, searchParams]);

  // ── Fetch catalog items + scoped categories ───────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [itemsRes, catRes] = await Promise.all([
          fetch(apiUrl, { cache: "no-store" }),
          fetch(`/api/categories?type=${contentType}`, { cache: "no-store" }),
        ]);
        if (itemsRes.ok) {
          setItems((await itemsRes.json()) ?? []);
        }
        if (catRes.ok) {
          const catJson = await catRes.json();
          if (catJson?.success && Array.isArray(catJson.data)) {
            setCategoryDirectory(catJson.data);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [apiUrl, contentType]);

  // ── Debounce search ───────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ── Sync URL ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isInitialized) return;
    const p = new URLSearchParams();
    if (selectedPrices.length) p.set("prices", selectedPrices.join(","));
    if (selectedTypes.length) p.set("types", selectedTypes.join(","));
    if (selectedCategories.length)
      p.set("categories", selectedCategories.join(","));
    if (selectedTags.length) p.set("tags", selectedTags.join(","));
    if (selectedTechStack.length) p.set("tech", selectedTechStack.join(","));
    if (debouncedSearch) p.set("search", debouncedSearch);
    if (sortBy !== "newly-published") p.set("sort", sortBy);
    if (currentPage > 1) p.set("page", currentPage.toString());
    router.replace(`${basePath}${p.toString() ? `?${p}` : ""}`, {
      scroll: false,
    });
  }, [
    basePath,
    currentPage,
    debouncedSearch,
    isInitialized,
    router,
    selectedCategories,
    selectedPrices,
    selectedTags,
    selectedTechStack,
    selectedTypes,
    sortBy,
  ]);

  // ── Category lookup ───────────────────────────────────────────────────────
  const categoryMetaMap = useMemo(() => {
    const map = new Map<string, PublicCategoryMeta>();
    for (const cat of categoryDirectory) {
      map.set(cat.slug, cat);
      map.set(cat.slug.toUpperCase(), cat);
      map.set(cat.name.toUpperCase(), cat);
    }
    return map;
  }, [categoryDirectory]);

  const resolveCat = (category: string) => {
    const upper = (category || "").toUpperCase();
    const match = categoryMetaMap.get(category) || categoryMetaMap.get(upper);
    if (match) {
      const theme = getCategoryColorTheme(match.color);
      return {
        label: match.name,
        icon: getCategoryIcon(match.icon),
        color: theme.text,
        bg: theme.bg,
      };
    }
    return {
      label: formatCategoryFallback(category),
      icon: isProject ? FolderCode : BookOpen,
      color: "text-[#ff6636]",
      bg: "bg-[#ff6636]/10",
    };
  };

  // ── Derived stats ─────────────────────────────────────────────────────────
  const published = useMemo(
    () => items.filter((c) => c.status === "PUBLISHED"),
    [items],
  );
  const totalEnrollments = useMemo(
    () => published.reduce((s, c) => s + c.enrollments, 0),
    [published],
  );
  const totalReviews = useMemo(
    () => published.reduce((s, c) => s + c.totalReviews, 0),
    [published],
  );
  const avgRating = useMemo(() => {
    if (!totalReviews) return 0;
    return (
      published.reduce((s, c) => s + c.rating * c.totalReviews, 0) /
      totalReviews
    );
  }, [published, totalReviews]);

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of published) {
      map.set(c.category, (map.get(c.category) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [published]);

  const tagCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of published) {
      const t = c.level || "General";
      map.set(t, (map.get(t) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [published]);

  const techStackCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of published) {
      for (const tech of c.techStack ?? []) {
        map.set(tech, (map.get(tech) ?? 0) + 1);
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [published]);

  const freeCount = useMemo(
    () => published.filter((c) => c.price <= 0).length,
    [published],
  );
  const paidCount = useMemo(
    () => published.filter((c) => c.price > 0).length,
    [published],
  );

  // ── Filter + sort ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let r = [...published];
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      r = r.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.instructor.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          (c.techStack ?? []).some((t) => t.toLowerCase().includes(q)) ||
          (c.tags ?? []).some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (selectedPrices.length)
      r = r.filter(
        (c) =>
          (c.price <= 0 && selectedPrices.includes("free")) ||
          (c.price > 0 && selectedPrices.includes("paid")),
      );
    if (selectedTypes.length) r = r.filter(() => selectedTypes.includes("online"));
    if (selectedCategories.length) {
      const loweredSelected = selectedCategories.map((s) => s.toLowerCase());
      r = r.filter(
        (c) =>
          selectedCategories.includes(c.category) ||
          loweredSelected.includes(c.category.toLowerCase()) ||
          loweredSelected.includes(resolveCat(c.category).label.toLowerCase()),
      );
    }
    if (selectedTags.length) r = r.filter((c) => selectedTags.includes(c.level));
    if (selectedTechStack.length) {
      r = r.filter((c) =>
        selectedTechStack.every((tech) =>
          (c.techStack ?? []).some(
            (t) => t.toLowerCase() === tech.toLowerCase(),
          ),
        ),
      );
    }
    switch (sortBy) {
      case "price-low":
        r.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        r.sort((a, b) => b.price - a.price);
        break;
      case "popular":
        r.sort((a, b) => b.enrollments - a.enrollments);
        break;
      default:
        r.sort(
          (a, b) =>
            new Date(b.publishedAt ?? "").getTime() -
            new Date(a.publishedAt ?? "").getTime(),
        );
    }
    return r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedSearch,
    published,
    selectedCategories,
    selectedPrices,
    selectedTags,
    selectedTechStack,
    selectedTypes,
    sortBy,
  ]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = useMemo(
    () =>
      filtered.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
      ),
    [currentPage, filtered],
  );

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    setCurrentPage(1);
  }, [
    debouncedSearch,
    selectedCategories,
    selectedPrices,
    selectedTags,
    selectedTechStack,
    selectedTypes,
    sortBy,
  ]);

  useEffect(() => {
    if (totalPages === 0) return;
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const togglePrice = (val: PriceFilter) =>
    setSelectedPrices((p) =>
      p.includes(val) ? p.filter((x) => x !== val) : [...p, val],
    );
  const toggleType = (val: TypeFilter) =>
    setSelectedTypes((p) =>
      p.includes(val) ? p.filter((x) => x !== val) : [...p, val],
    );
  const toggleCategory = (val: string) =>
    setSelectedCategories((p) =>
      p.includes(val) ? p.filter((x) => x !== val) : [...p, val],
    );
  const toggleTag = (val: string) =>
    setSelectedTags((p) =>
      p.includes(val) ? p.filter((x) => x !== val) : [...p, val],
    );
  const toggleTech = (val: string) =>
    setSelectedTechStack((p) =>
      p.includes(val) ? p.filter((x) => x !== val) : [...p, val],
    );

  const clearAll = () => {
    setSearchQuery("");
    setSelectedPrices([]);
    setSelectedTypes([]);
    setSelectedCategories([]);
    setSelectedTags([]);
    setSelectedTechStack([]);
    setSortBy("newly-published");
    setMobileFiltersOpen(false);
  };

  const hasActiveFilters =
    debouncedSearch.trim() !== "" ||
    selectedPrices.length > 0 ||
    selectedTypes.length > 0 ||
    selectedCategories.length > 0 ||
    selectedTags.length > 0 ||
    selectedTechStack.length > 0;

  const activeFilterCount = [
    debouncedSearch ? 1 : 0,
    selectedPrices.length,
    selectedTypes.length,
    selectedCategories.length,
    selectedTags.length,
    selectedTechStack.length,
  ].reduce((s, v) => s + v, 0);

  const from = filtered.length ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0;
  const to = Math.min(currentPage * ITEMS_PER_PAGE, filtered.length);

  const singularLower = isProject ? "project tutorial" : "course";
  const pluralLower = isProject ? "project tutorials" : "courses";

  // ── Sidebar Filter Panel ──────────────────────────────────────────────────
  const FiltersPanel = () => (
    <div className="space-y-7">
      {/* Price */}
      <div className="space-y-3">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-foreground">
          Price
        </p>
        <div className="space-y-2">
          <FilterOptionButton
            label="Free"
            count={freeCount}
            active={selectedPrices.includes("free")}
            onClick={() => togglePrice("free")}
          />
          <FilterOptionButton
            label="Paid"
            count={paidCount}
            active={selectedPrices.includes("paid")}
            onClick={() => togglePrice("paid")}
          />
        </div>
      </div>

      {/* Format */}
      {!isProject && (
        <div className="space-y-3">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-foreground">
            Format
          </p>
          <FilterOptionButton
            label="Online / Self-paced"
            count={published.length}
            active={selectedTypes.includes("online")}
            onClick={() => toggleType("online")}
          />
        </div>
      )}

      {/* Categories */}
      {categoryCounts.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-foreground">
            Category
          </p>
          <div className="space-y-2">
            {categoryCounts.map(([cat, count]) => (
              <FilterOptionButton
                key={cat}
                label={resolveCat(cat).label}
                count={count}
                active={selectedCategories.includes(cat)}
                onClick={() => toggleCategory(cat)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tech Stack (Project Tutorials) */}
      {isProject && techStackCounts.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-foreground">
            Tech Stack
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {techStackCounts.map(([tech, count]) => (
              <FilterOptionButton
                key={tech}
                label={tech}
                count={count}
                active={selectedTechStack.includes(tech)}
                onClick={() => toggleTech(tech)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Levels */}
      {tagCounts.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-foreground">
            Level
          </p>
          <div className="space-y-2">
            {tagCounts.map(([tag, count]) => (
              <FilterOptionButton
                key={tag}
                label={normalizeLevel(tag) || tag}
                count={count}
                active={selectedTags.includes(tag)}
                onClick={() => toggleTag(tag)}
              />
            ))}
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="w-full rounded-xl border border-border bg-card py-2.5 text-sm font-bold text-muted-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] transition-all duration-200"
        >
          Reset all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <MarketingPublicHeader activePath={basePath} />

      <main className="flex-1">
        {/* ── Hero Banner ─────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-border/40 bg-[#fff9f7] dark:bg-[#111318] py-12 lg:py-16">
          <div
            className={cn(
              "pointer-events-none absolute -top-40 right-0 size-[500px] rounded-full blur-3xl",
              isProject ? "bg-violet-500/10" : "bg-[#ff6636]/5",
            )}
          />
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 relative">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="max-w-3xl space-y-5">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#ff6636]/30 bg-[#ff6636]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-[#ff6636]">
                  {isProject ? (
                    <FolderCode className="size-3.5" />
                  ) : (
                    <Sparkles className="size-3.5" />
                  )}
                  {isProject ? "Project Tutorials" : "Course Catalog"}
                </span>
                <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                  {isProject ? (
                    <>
                      Build Production-Ready
                      <br />
                      <span className="bg-gradient-to-r from-[#ff6636] to-[#ff9f60] bg-clip-text text-transparent">
                        Real-World Projects
                      </span>
                    </>
                  ) : (
                    <>
                      Find Your Next
                      <br />
                      <span className="bg-gradient-to-r from-[#ff6636] to-[#ff9f60] bg-clip-text text-transparent">
                        Learning Path
                      </span>
                    </>
                  )}
                </h1>
                <p className="max-w-xl text-base text-muted-foreground font-semibold leading-relaxed">
                  {isProject
                    ? `Follow ${published.length} hands-on project tutorials end-to-end with phased builds, starter repos, live demos, and completion certificates.`
                    : `Browse ${published.length} curated courses by real engineers. Filter by category, level, and price to find exactly what you need.`}
                </p>
              </div>

              {/* Cross-catalog quick link */}
              <div className="shrink-0">
                <Link
                  href={isProject ? "/courses" : "/projects"}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] transition-all"
                >
                  {isProject ? (
                    <>
                      <BookOpen className="size-4 text-[#ff6636]" />
                      Browse Structured Courses
                    </>
                  ) : (
                    <>
                      <FolderCode className="size-4 text-[#ff6636]" />
                      Explore Project Tutorials
                    </>
                  )}
                </Link>
              </div>
            </div>

            {/* Stats strip */}
            <div className="mt-8 flex flex-wrap gap-4">
              {[
                {
                  label: isProject ? "Projects" : "Courses",
                  value: `${published.length}+`,
                  icon: isProject ? FolderCode : BookOpen,
                  color: "text-[#ff6636]",
                  bg: "bg-[#ff6636]/10",
                },
                {
                  label: "Enrollments",
                  value: formatCompact(totalEnrollments),
                  icon: Users,
                  color: "text-violet-500",
                  bg: "bg-violet-500/10",
                },
                {
                  label: "Avg Rating",
                  value: avgRating > 0 ? avgRating.toFixed(1) : "5.0",
                  icon: Star,
                  color: "text-amber-500",
                  bg: "bg-amber-500/10",
                },
                isProject
                  ? {
                      label: "Tech Stacks",
                      value: `${techStackCounts.length}`,
                      icon: Code2,
                      color: "text-emerald-500",
                      bg: "bg-emerald-500/10",
                    }
                  : {
                      label: "Categories",
                      value: `${categoryCounts.length}`,
                      icon: Zap,
                      color: "text-emerald-500",
                      bg: "bg-emerald-500/10",
                    },
              ].map((s) => {
                const SIcon = s.icon;
                return (
                  <div
                    key={s.label}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
                  >
                    <div
                      className={`flex size-9 items-center justify-center rounded-xl ${s.bg} ${s.color} shrink-0`}
                    >
                      <SIcon className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-foreground">
                        {s.value}
                      </p>
                      <p className="text-[10px] font-semibold text-muted-foreground">
                        {s.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Search + Sort Bar ────────────────────────────────────────────── */}
        <div className="border-b border-border/40 bg-card py-4">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={
                    isProject
                      ? "Search project tutorials by title, tech stack, or topic…"
                      : "Search courses by title, instructor, or topic…"
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-background pl-11 pr-11 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:border-[#ff6636]/60 focus:outline-none focus:ring-2 focus:ring-[#ff6636]/10 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>

              {/* Sort */}
              <div className="w-full sm:w-52">
                <Select
                  value={sortBy}
                  onValueChange={(v) => {
                    if (isSortOption(v)) setSortBy(v);
                  }}
                >
                  <SelectTrigger className="h-11 rounded-xl border-border bg-background text-sm font-semibold text-foreground focus:border-[#ff6636]/60 focus:ring-2 focus:ring-[#ff6636]/10">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border bg-popover shadow-xl">
                    {SORT_OPTIONS.map((o) => (
                      <SelectItem
                        key={o.value}
                        value={o.value}
                        className="rounded-lg text-sm font-semibold focus:bg-[#ff6636]/10"
                      >
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mobile filter trigger */}
              <div className="lg:hidden">
                <Sheet
                  open={mobileFiltersOpen}
                  onOpenChange={setMobileFiltersOpen}
                >
                  <SheetTrigger asChild>
                    <Button className="h-11 w-full sm:w-auto rounded-xl bg-foreground text-background hover:bg-foreground/90 font-bold">
                      <SlidersHorizontal className="size-4 mr-2" />
                      Filters
                      {activeFilterCount > 0 && (
                        <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-[#ff6636] px-1.5 text-xs font-bold text-white">
                          {activeFilterCount}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="left"
                    className="w-[min(22rem,100vw)] overflow-y-auto border-border bg-background p-6"
                  >
                    <SheetHeader className="mb-6">
                      <SheetTitle className="text-lg font-extrabold">
                        Filter {isProject ? "Projects" : "Courses"}
                      </SheetTitle>
                      <SheetDescription className="text-sm text-muted-foreground font-semibold">
                        {isProject
                          ? "Refine by price, category, tech stack, and level."
                          : "Refine by price, category, and level."}
                      </SheetDescription>
                    </SheetHeader>
                    <FiltersPanel />
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Active filter chips */}
            {hasActiveFilters && (
              <div className="mt-3 flex flex-wrap gap-2 items-center">
                {debouncedSearch && (
                  <ActiveFilterChip
                    label={`"${debouncedSearch}"`}
                    onRemove={() => setSearchQuery("")}
                    icon={Search}
                  />
                )}
                {selectedPrices.map((p) => (
                  <ActiveFilterChip
                    key={p}
                    label={p}
                    onRemove={() => togglePrice(p)}
                  />
                ))}
                {selectedTypes.map((t) => (
                  <ActiveFilterChip
                    key={t}
                    label={t}
                    onRemove={() => toggleType(t)}
                  />
                ))}
                {selectedCategories.map((c) => (
                  <ActiveFilterChip
                    key={c}
                    label={resolveCat(c).label}
                    onRemove={() => toggleCategory(c)}
                  />
                ))}
                {selectedTechStack.map((tech) => (
                  <ActiveFilterChip
                    key={tech}
                    label={tech}
                    icon={Code2}
                    onRemove={() => toggleTech(tech)}
                  />
                ))}
                {selectedTags.map((t) => (
                  <ActiveFilterChip
                    key={t}
                    label={normalizeLevel(t) || t}
                    onRemove={() => toggleTag(t)}
                  />
                ))}
                <button
                  onClick={clearAll}
                  className="text-xs font-bold text-muted-foreground hover:text-[#ff6636] transition-colors ml-1"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Main Content: Sidebar + Grid ─────────────────────────────────── */}
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 rounded-2xl border border-border bg-card p-5">
                <div className="mb-6 border-b border-border/50 pb-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Filter className="size-4 text-[#ff6636]" />
                    <h2 className="text-sm font-extrabold text-foreground">
                      Filter by
                    </h2>
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Narrow the catalog to your needs.
                  </p>
                </div>
                <FiltersPanel />
              </div>
            </aside>

            {/* Grid */}
            <section className="space-y-6">
              {/* Results header */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Results
                  </p>
                  <h2 className="mt-0.5 text-xl font-extrabold text-foreground">
                    {loading
                      ? `Loading ${pluralLower}…`
                      : filtered.length > 0
                        ? `Showing ${from}–${to} of ${filtered.length} ${filtered.length === 1 ? singularLower : pluralLower}`
                        : `No ${pluralLower} found`}
                  </h2>
                  {!loading && (
                    <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                      {hasActiveFilters
                        ? `Filtered results · sorted by ${SORT_LABELS[sortBy].toLowerCase()}`
                        : `All published ${pluralLower} · sorted by ${SORT_LABELS[sortBy].toLowerCase()}`}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <span className="rounded-xl border border-border bg-card px-3 py-1.5">
                    Page {Math.min(currentPage, Math.max(totalPages, 1))} of{" "}
                    {Math.max(totalPages, 1)}
                  </span>
                </div>
              </div>

              {/* Cards */}
              {loading ? (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <CardSkeleton key={i} />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex min-h-[26rem] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-8 py-16 text-center">
                  {hasActiveFilters ? (
                    <>
                      <div className="flex size-16 items-center justify-center rounded-2xl bg-[#ff6636]/10 text-[#ff6636] mb-5">
                        <Filter className="size-8" />
                      </div>
                      <h3 className="text-xl font-extrabold text-foreground">
                        No {pluralLower} match these filters
                      </h3>
                      <p className="mt-2 max-w-md text-sm text-muted-foreground font-semibold leading-relaxed">
                        Try broadening your search or removing some filters to
                        see more results.
                      </p>
                      <button
                        onClick={clearAll}
                        className="mt-6 rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] px-6 py-2.5 text-sm font-bold text-white transition-colors"
                      >
                        Reset Filters
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex size-16 items-center justify-center rounded-2xl bg-[#ff6636]/10 text-[#ff6636] mb-5">
                        {isProject ? (
                          <FolderCode className="size-8" />
                        ) : (
                          <BookOpen className="size-8" />
                        )}
                      </div>
                      <h3 className="text-xl font-extrabold text-foreground">
                        No {pluralLower} published yet
                      </h3>
                      <p className="mt-2 max-w-md text-sm text-muted-foreground font-semibold leading-relaxed">
                        New {pluralLower} appear here as they are published.
                        Check back soon!
                      </p>
                      <div className="mt-6 flex gap-3">
                        <Link
                          href={isProject ? "/courses" : "/projects"}
                          className="rounded-xl bg-[#ff6636] hover:bg-[#e95a2b] px-6 py-2.5 text-sm font-bold text-white transition-colors"
                        >
                          Browse {isProject ? "Courses" : "Projects"}
                        </Link>
                        <Link
                          href="/"
                          className="rounded-xl border border-border bg-card hover:bg-muted px-6 py-2.5 text-sm font-bold text-foreground transition-colors"
                        >
                          Go Home
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {paginated.map((item) => (
                      <CatalogCard
                        key={item.id}
                        item={item}
                        contentType={contentType}
                        resolveCat={resolveCat}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                        className="flex size-10 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] disabled:opacity-40 transition-all"
                      >
                        <ChevronLeft className="size-4" />
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(
                          (page) =>
                            page === 1 ||
                            page === totalPages ||
                            Math.abs(page - currentPage) <= 1,
                        )
                        .map((page, index, arr) => {
                          const prev = arr[index - 1];
                          const showEllipsis = prev && page - prev > 1;
                          return (
                            <div key={page} className="flex items-center gap-2">
                              {showEllipsis && (
                                <span className="px-2 text-muted-foreground font-bold">
                                  …
                                </span>
                              )}
                              <button
                                onClick={() => setCurrentPage(page)}
                                className={cn(
                                  "flex size-10 items-center justify-center rounded-xl text-sm font-bold transition-all",
                                  page === currentPage
                                    ? "bg-[#ff6636] text-white shadow-md shadow-[#ff6636]/20"
                                    : "border border-border bg-card text-muted-foreground hover:border-[#ff6636]/40 hover:text-foreground",
                                )}
                              >
                                {page}
                              </button>
                            </div>
                          );
                        })}

                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="flex size-10 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:border-[#ff6636]/40 hover:text-[#ff6636] disabled:opacity-40 transition-all"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </main>

      <MarketingPublicFooter />
    </div>
  );
}

export function CatalogBrowser({ contentType }: { contentType: ContentType }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col bg-background">
          <div className="mx-auto max-w-[1320px] px-4 py-20 w-full space-y-6">
            <Skeleton className="h-12 w-72" />
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <CatalogBrowserInner contentType={contentType} />
    </Suspense>
  );
}
