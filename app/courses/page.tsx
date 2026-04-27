"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Compass,
  Filter,
  Layers3,
  MonitorPlay,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Users,
  X,
} from "lucide-react";

import {
  MarketingPublicFooter,
  MarketingPublicHeader,
} from "@/components/marketing/public-chrome";
import { CourseCard } from "@/components/lms/course-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { getProxiedImageUrl } from "@/lib/s3-utils";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface CourseListItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  level: string;
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

type PriceFilter = "free" | "paid";
type TypeFilter = "online";

const SORT_OPTIONS = [
  { value: "newly-published", label: "Newest arrivals" },
  { value: "popular", label: "Most popular" },
  { value: "price-low", label: "Price: low to high" },
  { value: "price-high", label: "Price: high to low" },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number]["value"];

const SORT_LABELS: Record<SortOption, string> = {
  "newly-published": "Newest arrivals",
  popular: "Most popular",
  "price-low": "Price: low to high",
  "price-high": "Price: high to low",
};

function isSortOption(value: string | null): value is SortOption {
  return SORT_OPTIONS.some((option) => option.value === value);
}

function formatPrice(price: number) {
  return price > 0 ? `$${price.toFixed(2)}` : "Free";
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);
}

function normalizeLevel(level?: string) {
  switch (level?.toLowerCase()) {
    case "beginner":
      return "Beginner" as const;
    case "intermediate":
      return "Intermediate" as const;
    case "advanced":
      return "Advanced" as const;
    default:
      return undefined;
  }
}

type SummaryTileProps = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
};

function SummaryTile({ label, value, detail, icon: Icon }: SummaryTileProps) {
  return (
    <div className="border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-foreground">
            {value}
          </p>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            {detail}
          </p>
        </div>
        <span className="flex size-12 items-center justify-center bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
      </div>
    </div>
  );
}

type FilterOptionButtonProps = {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
};

function FilterOptionButton({
  label,
  count,
  active,
  onClick,
}: FilterOptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex w-full items-center justify-between border px-4 py-3 text-left transition-colors",
        active
          ? "border-primary/70 bg-primary/15 text-foreground"
          : "border-border bg-card text-foreground/90 hover:border-primary/60 hover:bg-muted/60 hover:text-foreground",
      )}
    >
      <span className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-5 items-center justify-center border",
            active ? "border-primary bg-primary" : "border-border bg-muted/60",
          )}
        >
          <span
            className={cn("size-2", active ? "bg-white" : "bg-transparent")}
          />
        </span>
        <span className="text-sm font-medium">{label}</span>
      </span>

      {typeof count === "number" ? (
        <span
          className={cn(
            "px-2 py-1 text-xs font-semibold",
            active
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

type ActiveFilterChipProps = {
  label: string;
  onRemove: () => void;
  icon?: LucideIcon;
};

function ActiveFilterChip({
  label,
  onRemove,
  icon: Icon,
}: ActiveFilterChipProps) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-2 border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
    >
      {Icon ? <Icon className="size-3.5 text-primary" /> : null}
      <span>{label}</span>
      <span className="flex size-5 items-center justify-center bg-primary/15 text-primary">
        <X className="size-3.5" />
      </span>
    </button>
  );
}

function CoursesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const [selectedPrices, setSelectedPrices] = useState<PriceFilter[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<TypeFilter[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newly-published");
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const hasMountedFiltersRef = useRef(false);

  const itemsPerPage = 9;

  useEffect(() => {
    if (isInitialized) return;

    const prices =
      searchParams
        .get("prices")
        ?.split(",")
        .filter(
          (value): value is PriceFilter => value === "free" || value === "paid",
        ) ?? [];
    const types =
      searchParams
        .get("types")
        ?.split(",")
        .filter((value): value is TypeFilter => value === "online") ?? [];
    const categories =
      searchParams.get("categories")?.split(",").filter(Boolean) ?? [];
    const tags = searchParams.get("tags")?.split(",").filter(Boolean) ?? [];
    const search = searchParams.get("search") || "";
    const sortParam = searchParams.get("sort");
    const sort = isSortOption(sortParam) ? sortParam : "newly-published";
    const page = Number.parseInt(searchParams.get("page") || "1", 10);

    if (prices.length) setSelectedPrices(prices);
    if (types.length) setSelectedTypes(types);
    if (categories.length) setSelectedCategories(categories);
    if (tags.length) setSelectedTags(tags);
    if (search) setSearchQuery(search);
    setSortBy(sort);
    if (Number.isFinite(page) && page > 0) setCurrentPage(page);

    setIsInitialized(true);
  }, [isInitialized, searchParams]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch("/api/courses", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load courses");
        const data = await res.json();
        setCourses(data || []);
      } catch (error) {
        console.error("Failed to load courses", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!isInitialized) return;

    const params = new URLSearchParams();

    if (selectedPrices.length) params.set("prices", selectedPrices.join(","));
    if (selectedTypes.length) params.set("types", selectedTypes.join(","));
    if (selectedCategories.length) {
      params.set("categories", selectedCategories.join(","));
    }
    if (selectedTags.length) params.set("tags", selectedTags.join(","));
    if (debouncedSearchQuery) params.set("search", debouncedSearchQuery);
    if (sortBy !== "newly-published") params.set("sort", sortBy);
    if (currentPage > 1) params.set("page", currentPage.toString());

    const queryString = params.toString();
    router.replace(`/courses${queryString ? `?${queryString}` : ""}`, {
      scroll: false,
    });
  }, [
    currentPage,
    debouncedSearchQuery,
    isInitialized,
    router,
    selectedCategories,
    selectedPrices,
    selectedTags,
    selectedTypes,
    sortBy,
  ]);

  const publishedCourses = useMemo(
    () => courses.filter((course) => course.status === "PUBLISHED"),
    [courses],
  );

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const course of publishedCourses) {
      if (!course.category) continue;
      map.set(course.category, (map.get(course.category) || 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [publishedCourses]);

  const tagCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const course of publishedCourses) {
      const tag = course.level || "General";
      map.set(tag, (map.get(tag) || 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [publishedCourses]);

  const freeCount = useMemo(
    () => publishedCourses.filter((course) => course.price <= 0).length,
    [publishedCourses],
  );

  const paidCount = useMemo(
    () => publishedCourses.filter((course) => course.price > 0).length,
    [publishedCourses],
  );

  const totalEnrollments = useMemo(
    () => publishedCourses.reduce((sum, course) => sum + course.enrollments, 0),
    [publishedCourses],
  );

  const totalReviews = useMemo(
    () =>
      publishedCourses.reduce((sum, course) => sum + course.totalReviews, 0),
    [publishedCourses],
  );

  const averageRating = useMemo(() => {
    if (!totalReviews) return 0;
    const weightedRatings = publishedCourses.reduce(
      (sum, course) => sum + course.rating * course.totalReviews,
      0,
    );
    return weightedRatings / totalReviews;
  }, [publishedCourses, totalReviews]);

  const filteredAndSortedCourses = useMemo(() => {
    let filtered = [...publishedCourses];

    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(query) ||
          course.description.toLowerCase().includes(query) ||
          course.instructor.toLowerCase().includes(query) ||
          course.category.toLowerCase().includes(query),
      );
    }

    if (selectedPrices.length > 0) {
      filtered = filtered.filter((course) => {
        if (course.price <= 0 && selectedPrices.includes("free")) return true;
        if (course.price > 0 && selectedPrices.includes("paid")) return true;
        return false;
      });
    }

    if (selectedTypes.length > 0) {
      filtered = filtered.filter(() => selectedTypes.includes("online"));
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((course) =>
        selectedCategories.includes(course.category),
      );
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter((course) =>
        selectedTags.includes(course.level),
      );
    }

    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "popular":
        filtered.sort((a, b) => b.enrollments - a.enrollments);
        break;
      case "newly-published":
      default:
        filtered.sort(
          (a, b) =>
            new Date(b.publishedAt || "").getTime() -
            new Date(a.publishedAt || "").getTime(),
        );
        break;
    }

    return filtered;
  }, [
    debouncedSearchQuery,
    publishedCourses,
    selectedCategories,
    selectedPrices,
    selectedTags,
    selectedTypes,
    sortBy,
  ]);

  const totalPages = Math.ceil(filteredAndSortedCourses.length / itemsPerPage);

  const paginatedCourses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedCourses.slice(start, start + itemsPerPage);
  }, [currentPage, filteredAndSortedCourses]);

  useEffect(() => {
    if (!hasMountedFiltersRef.current) {
      hasMountedFiltersRef.current = true;
      return;
    }

    setCurrentPage(1);
  }, [
    debouncedSearchQuery,
    selectedCategories,
    selectedPrices,
    selectedTags,
    selectedTypes,
    sortBy,
  ]);

  useEffect(() => {
    if (totalPages === 0) return;
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const togglePrice = (price: PriceFilter) => {
    setSelectedPrices((prev) =>
      prev.includes(price)
        ? prev.filter((item) => item !== price)
        : [...prev, price],
    );
  };

  const toggleType = (type: TypeFilter) => {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((item) => item !== type)
        : [...prev, type],
    );
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category],
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
    );
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedPrices([]);
    setSelectedTypes([]);
    setSelectedCategories([]);
    setSelectedTags([]);
    setSortBy("newly-published");
    setMobileFiltersOpen(false);
  };

  const hasActiveFilters =
    debouncedSearchQuery.trim() !== "" ||
    selectedPrices.length > 0 ||
    selectedTypes.length > 0 ||
    selectedCategories.length > 0 ||
    selectedTags.length > 0;

  const activeFilterCount = [
    debouncedSearchQuery ? 1 : 0,
    selectedPrices.length,
    selectedTypes.length,
    selectedCategories.length,
    selectedTags.length,
  ].reduce((sum, value) => sum + value, 0);

  const from = filteredAndSortedCourses.length
    ? (currentPage - 1) * itemsPerPage + 1
    : 0;
  const to = Math.min(
    currentPage * itemsPerPage,
    filteredAndSortedCourses.length,
  );

  const topCategories = categoryCounts.slice(0, 4);
  const courseGridClassName = "grid gap-6 md:grid-cols-2 2xl:grid-cols-3";
  const currentSortLabel = SORT_LABELS[sortBy];

  const FiltersContent = () => (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Price
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            Choose between complimentary and premium learning paths.
          </p>
        </div>
        <div className="grid gap-2">
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
      </section>

      <section className="space-y-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Delivery
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            Every DevForge course is available online and self-paced.
          </p>
        </div>
        <FilterOptionButton
          label="Online"
          count={publishedCourses.length}
          active={selectedTypes.includes("online")}
          onClick={() => toggleType("online")}
        />
      </section>

      {categoryCounts.length > 0 ? (
        <section className="space-y-3">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Categories
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              Narrow the catalog by discipline and focus area.
            </p>
          </div>
          <div className="grid gap-2">
            {categoryCounts.map(([category, count]) => (
              <FilterOptionButton
                key={category}
                label={category}
                count={count}
                active={selectedCategories.includes(category)}
                onClick={() => toggleCategory(category)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {tagCounts.length > 0 ? (
        <section className="space-y-3">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Levels
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              Match your next course to your current depth.
            </p>
          </div>
          <div className="grid gap-2">
            {tagCounts.map(([tag, count]) => (
              <FilterOptionButton
                key={tag}
                label={tag}
                count={count}
                active={selectedTags.includes(tag)}
                onClick={() => toggleTag(tag)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {hasActiveFilters ? (
        <Button
          variant="outline"
          onClick={clearAllFilters}
          className="h-11 w-full rounded-none border-border bg-card text-foreground hover:border-primary hover:bg-muted"
        >
          Reset all filters
        </Button>
      ) : null}
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <MarketingPublicHeader activePath="/courses" />

      <main className="flex-1">
        <div className="page-shell-full py-10 sm:py-12">
          <section className="border border-border bg-card p-6 sm:p-8 lg:p-10">
            <div>
              <div className="grid gap-8 xl:grid-cols-[minmax(0,1.05fr)_26rem]">
                <div className="max-w-4xl">
                  <span className="inline-flex items-center gap-2 bg-primary/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                    <Sparkles className="size-3.5" />
                    Course Catalog
                  </span>

                  <h1 className="mt-6 max-w-4xl text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[3.5rem] lg:text-[4.25rem]">
                    Professional learning paths with a clearer sense of
                    direction.
                  </h1>

                  <p className="mt-5 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
                    Browse structured courses, compare disciplines at a glance,
                    and narrow the catalog fast without losing the sense of what
                    each program is for.
                  </p>

                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    <div className="border border-border bg-muted p-4">
                      <Compass className="size-5 text-primary" />
                      <p className="mt-3 text-sm font-semibold text-foreground">
                        Curated direction
                      </p>
                      <p className="mt-1 text-sm leading-7 text-muted-foreground">
                        Focus the list by topic, level, and cost without losing
                        momentum.
                      </p>
                    </div>

                    <div className="border border-border bg-muted p-4">
                      <Layers3 className="size-5 text-primary" />
                      <p className="mt-3 text-sm font-semibold text-foreground">
                        Clear structure
                      </p>
                      <p className="mt-1 text-sm leading-7 text-muted-foreground">
                        Every card surfaces duration, lessons, and learning
                        depth before you commit.
                      </p>
                    </div>

                    <div className="border border-border bg-muted p-4">
                      <MonitorPlay className="size-5 text-primary" />
                      <p className="mt-3 text-sm font-semibold text-foreground">
                        Online by default
                      </p>
                      <p className="mt-1 text-sm leading-7 text-muted-foreground">
                        Designed for remote learning and paced so you can ship
                        alongside the material.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                  <SummaryTile
                    label="Published"
                    value={publishedCourses.length.toString()}
                    detail="Active courses in the live catalog."
                    icon={BookOpen}
                  />
                  <SummaryTile
                    label="Learners"
                    value={formatCompactNumber(totalEnrollments)}
                    detail="Enrollments across the published catalog."
                    icon={Users}
                  />
                  <SummaryTile
                    label="Disciplines"
                    value={categoryCounts.length.toString()}
                    detail="Distinct categories available to explore."
                    icon={Layers3}
                  />
                  <SummaryTile
                    label="Rating"
                    value={totalReviews ? averageRating.toFixed(1) : "New"}
                    detail={
                      totalReviews
                        ? `${formatCompactNumber(totalReviews)} learner reviews across the catalog.`
                        : "Reviews will appear as learners complete more courses."
                    }
                    icon={Star}
                  />
                </div>
              </div>

              <div className="mt-8 border border-border bg-card p-5 sm:p-6">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Search the catalog
                    </label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search by title, instructor, or topic"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        className="h-14 rounded-none !border-2 !border-border !bg-card pl-11 pr-11 text-sm font-medium !text-foreground shadow-none placeholder:font-normal placeholder:text-muted-foreground hover:!border-ring/60 focus-visible:!border-primary focus-visible:ring-[4px] focus-visible:ring-primary/12"
                      />
                      {searchQuery ? (
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                          aria-label="Clear search"
                        >
                          <X className="size-4" />
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Sort by
                    </label>
                    <Select
                      value={sortBy}
                      onValueChange={(value) => {
                        if (isSortOption(value)) setSortBy(value);
                      }}
                    >
                      <SelectTrigger className="h-14 rounded-none border-2 border-border bg-card px-4 text-sm font-medium text-foreground shadow-none hover:border-ring/60 focus:border-primary focus:ring-[4px] focus:ring-primary/12 focus-visible:border-primary focus-visible:ring-[4px] focus-visible:ring-primary/12">
                        <SelectValue placeholder="Newest arrivals" />
                      </SelectTrigger>
                      <SelectContent
                        align="end"
                        className="min-w-56 rounded-none border-border bg-popover shadow-[0_18px_40px_rgba(18,24,40,0.14)]"
                      >
                        {SORT_OPTIONS.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                            className="rounded-none px-3 py-2 text-sm font-medium text-popover-foreground focus:bg-primary/10 focus:text-foreground"
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 bg-primary/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                      Popular tracks
                    </span>
                    {topCategories.length > 0 ? (
                      topCategories.map(([category, count]) => (
                        <span
                          key={category}
                          className="inline-flex items-center gap-2 border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground"
                        >
                          <span>{category}</span>
                          <span className="bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                            {count}
                          </span>
                        </span>
                      ))
                    ) : (
                      <span className="inline-flex items-center border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
                        Categories will appear once courses are published.
                      </span>
                    )}
                  </div>

                  <div className="lg:hidden">
                    <Sheet
                      open={mobileFiltersOpen}
                      onOpenChange={setMobileFiltersOpen}
                    >
                      <SheetTrigger asChild>
                        <Button className="h-11 rounded-none bg-foreground px-4 text-background hover:bg-foreground/90">
                          <SlidersHorizontal className="mr-2 size-4" />
                          Filters
                          {activeFilterCount > 0 ? (
                            <span className="ml-2 inline-flex min-w-5 items-center justify-center bg-background/20 px-1.5 py-0.5 text-xs font-semibold">
                              {activeFilterCount}
                            </span>
                          ) : null}
                        </Button>
                      </SheetTrigger>
                      <SheetContent
                        side="left"
                        className="w-[min(24rem,100vw)] overflow-y-auto border-border bg-background"
                      >
                        <SheetHeader>
                          <SheetTitle>Filter courses</SheetTitle>
                          <SheetDescription>
                            Refine the catalog by price, category, and level.
                          </SheetDescription>
                        </SheetHeader>
                        <div className="mt-6">
                          <FiltersContent />
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-10 grid gap-8 lg:grid-cols-[18rem_minmax(0,1fr)]">
            <aside className="hidden lg:block">
              <div className="sticky top-24 border border-border bg-card">
                <div className="border-b border-border px-5 py-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Refine catalog
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                    Filter by fit
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    Tighten the list by cost, discipline, and depth.
                  </p>
                </div>
                <div className="p-5">
                  <FiltersContent />
                </div>
              </div>
            </aside>

            <section className="space-y-6">
              <div className="border border-border bg-card p-5 sm:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Catalog results
                    </p>
                    <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-foreground">
                      {loading
                        ? "Loading the latest courses"
                        : `Showing ${from}-${to} of ${filteredAndSortedCourses.length}`}
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      {hasActiveFilters
                        ? `Refined by your current search and selections. Sorted by ${currentSortLabel.toLowerCase()}.`
                        : `All published courses, sorted by ${currentSortLabel.toLowerCase()}.`}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="border border-border bg-muted px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Current sort
                      </p>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {currentSortLabel}
                      </p>
                    </div>

                    <div className="border border-border bg-muted px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Page
                      </p>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {Math.min(currentPage, Math.max(totalPages, 1))} of{" "}
                        {Math.max(totalPages, 1)}
                      </p>
                    </div>
                  </div>
                </div>

                {hasActiveFilters ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {debouncedSearchQuery ? (
                      <ActiveFilterChip
                        label={debouncedSearchQuery}
                        onRemove={() => setSearchQuery("")}
                        icon={Search}
                      />
                    ) : null}

                    {selectedPrices.map((price) => (
                      <ActiveFilterChip
                        key={price}
                        label={price}
                        onRemove={() => togglePrice(price)}
                      />
                    ))}

                    {selectedTypes.map((type) => (
                      <ActiveFilterChip
                        key={type}
                        label={type}
                        onRemove={() => toggleType(type)}
                      />
                    ))}

                    {selectedCategories.map((category) => (
                      <ActiveFilterChip
                        key={category}
                        label={category}
                        onRemove={() => toggleCategory(category)}
                      />
                    ))}

                    {selectedTags.map((tag) => (
                      <ActiveFilterChip
                        key={tag}
                        label={tag}
                        onRemove={() => toggleTag(tag)}
                      />
                    ))}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="h-9 rounded-none border border-border bg-card px-4 text-sm text-foreground/75 hover:border-primary hover:bg-muted hover:text-foreground"
                    >
                      Clear all
                    </Button>
                  </div>
                ) : null}
              </div>

              {loading ? (
                <div className={courseGridClassName}>
                  {Array.from({ length: 9 }).map((_, index) => (
                    <div
                      key={index}
                      className="overflow-hidden border border-border bg-card"
                    >
                      <Skeleton className="aspect-[16/10] w-full rounded-none" />
                      <div className="space-y-4 p-5">
                        <Skeleton className="h-3 w-24 rounded-none" />
                        <Skeleton className="h-10 w-4/5 rounded-none" />
                        <Skeleton className="h-4 w-full rounded-none" />
                        <Skeleton className="h-4 w-3/4 rounded-none" />
                        <div className="flex flex-wrap gap-2">
                          <Skeleton className="h-8 w-24 rounded-none" />
                          <Skeleton className="h-8 w-28 rounded-none" />
                          <Skeleton className="h-8 w-32 rounded-none" />
                        </div>
                        <div className="border border-border p-3">
                          <Skeleton className="h-3 w-20 rounded-none" />
                          <Skeleton className="mt-3 h-8 w-28 rounded-none" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredAndSortedCourses.length === 0 ? (
                <div className="flex min-h-[28rem] flex-col items-center justify-center border border-dashed border-border bg-card px-8 py-12 text-center">
                  {hasActiveFilters ? (
                    <>
                      <div className="flex size-16 items-center justify-center bg-primary/10 text-primary">
                        <Filter className="size-8" />
                      </div>
                      <h3 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                        No courses match this combination
                      </h3>
                      <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
                        Try loosening a filter, broadening the search, or reset
                        everything to return to the full catalog.
                      </p>
                      <Button
                        onClick={clearAllFilters}
                        className="mt-6 h-11 rounded-none bg-[#ff6636] px-5 text-white hover:bg-[#e95a2b]"
                      >
                        Reset filters
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex size-16 items-center justify-center bg-primary/10 text-primary">
                        <BookOpen className="size-8" />
                      </div>
                      <h3 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                        The catalog is still taking shape
                      </h3>
                      <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
                        New courses will appear here as they are published.
                        Reach out if you need a custom path or want to know what
                        is coming next.
                      </p>
                      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                        <Button
                          asChild
                          className="h-11 rounded-none bg-[#ff6636] px-5 text-white hover:bg-[#e95a2b]"
                        >
                          <Link href="/contact">Contact Us</Link>
                        </Button>
                        <Button
                          variant="outline"
                          asChild
                          className="h-11 rounded-none border-border bg-card px-5 text-foreground hover:bg-muted"
                        >
                          <Link href="/">Go Home</Link>
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <div className={courseGridClassName}>
                    {paginatedCourses.map((course) => (
                      <CourseCard
                        key={course.id}
                        href={`/courses/${course.slug}`}
                        title={course.title}
                        description={course.description}
                        imageUrl={
                          course.imageUrl
                            ? getProxiedImageUrl(course.imageUrl)
                            : undefined
                        }
                        level={normalizeLevel(course.level)}
                        lessonsCount={course.lessons}
                        tags={[course.category, course.instructor].filter(
                          Boolean,
                        )}
                        priceLabel={formatPrice(course.price)}
                        cta="View Course"
                        rating={course.rating}
                        reviewsCount={course.totalReviews}
                      />
                    ))}
                  </div>

                  {totalPages > 1 ? (
                    <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-10 rounded-none border border-[#e9eaf0] bg-white text-[#4e5566] hover:bg-[#f5f7fa] disabled:opacity-40"
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="size-4" />
                      </Button>

                      {Array.from({ length: totalPages }).map((_, index) => {
                        const pageNumber = index + 1;
                        const isActive = pageNumber === currentPage;

                        return (
                          <Button
                            key={pageNumber}
                            variant="ghost"
                            className={cn(
                              "h-10 min-w-10 rounded-none border px-3 text-sm font-medium",
                              isActive
                                ? "border-primary bg-primary text-primary-foreground hover:bg-primary"
                                : "border-border bg-card text-foreground/75 hover:bg-muted",
                            )}
                            onClick={() => setCurrentPage(pageNumber)}
                          >
                            {pageNumber}
                          </Button>
                        );
                      })}

                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-10 rounded-none border border-border bg-card text-foreground/75 hover:bg-muted disabled:opacity-40"
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(totalPages, prev + 1),
                          )
                        }
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  ) : null}
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

export default function CoursesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <MarketingPublicHeader activePath="/courses" />
          <div className="mx-auto max-w-[1320px] px-4 py-12 sm:px-6 lg:px-8">
            <Skeleton className="h-96 w-full rounded-none" />
          </div>
          <MarketingPublicFooter />
        </div>
      }
    >
      <CoursesPageContent />
    </Suspense>
  );
}
