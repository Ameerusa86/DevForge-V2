export interface LessonContentAnalysis {
  wordCount: number;
  proseWordCount: number;
  codeBlockCount: number;
  calloutCount: number;
  imageCount: number;
  characterCount: number;
  estimatedReadMinutes: number;
  hasOnlyTemplateText: boolean;
  isEmpty: boolean;
  isThin: boolean;
  excerpt: string;
}

export interface ContentLesson {
  id: string;
  title: string;
  order: number;
  isFree: boolean;
  videoUrl: string | null;
  hasVideo: boolean;
  durationSeconds: number | null;
  wordCount: number;
  proseWordCount: number;
  codeBlockCount: number;
  calloutCount: number;
  imageCount: number;
  contentLength: number;
  estimatedReadMinutes: number;
  hasOnlyTemplateText: boolean;
  isEmpty: boolean;
  isThin: boolean;
  excerpt: string;
  createdAt: string;
  updatedAt: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  courseStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  contentType: "COURSE" | "PROJECT_TUTORIAL";
  courseHasPhases: boolean;
  instructorName: string;
  moduleId: string | null;
  moduleTitle: string | null;
  phaseId: string | null;
  phaseTitle: string | null;
  hasQuiz: boolean;
  quizTitle: string | null;
  quizQuestionCount: number;
  quizSubmissionCount: number;
  questionCount: number;
  unansweredQuestionCount: number;
  completionCount: number;
  qaIssues: ContentQaIssue[];
  needsAttention: boolean;
}

export type ContentQaIssue =
  | "empty_draft"
  | "template_only"
  | "thin_content"
  | "unassigned_module"
  | "missing_phase"
  | "missing_video"
  | "missing_duration"
  | "missing_quiz"
  | "unanswered_qa";

export interface ContentStats {
  total: number;
  publishedLessons: number;
  free: number;
  paid: number;
  empty: number;
  thin: number;
  needsAttention: number;
  publishedNeedsAttention: number;
  missingVideo: number;
  missingDuration: number;
  missingQuiz: number;
  unassignedModule: number;
  unansweredQuestions: number;
  recentlyUpdated: number;
  avgWordCount: number;
  totalCodeBlocks: number;
  totalCompletions: number;
}

export interface CourseContentSummary {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  courseStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  contentType: "COURSE" | "PROJECT_TUTORIAL";
  instructorName: string;
  totalLessons: number;
  readyLessons: number;
  emptyCount: number;
  thinCount: number;
  unassignedCount: number;
  missingVideoCount: number;
  noQuizCount: number;
  freeCount: number;
  unansweredQaCount: number;
  totalWords: number;
  avgWords: number;
  readinessScore: number;
}

type TipTapNode = {
  type?: string;
  text?: string;
  content?: TipTapNode[];
};

const TEMPLATE_SIGNATURES = new Set([
  "lesson title what you'll learn content write your lesson content here...",
  "lesson title what you'll learn content write your lesson content here",
  "write your lesson content here...",
  "write your lesson content here",
]);

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Parses TipTap JSON (with HTML/plain-text fallback) to extract accurate content metrics
 * without inflating word counts from JSON keys or markup tags.
 */
export function analyzeLessonContent(
  rawContent: string | null | undefined,
): LessonContentAnalysis {
  if (!rawContent || !rawContent.trim()) {
    return {
      wordCount: 0,
      proseWordCount: 0,
      codeBlockCount: 0,
      calloutCount: 0,
      imageCount: 0,
      characterCount: 0,
      estimatedReadMinutes: 0,
      hasOnlyTemplateText: false,
      isEmpty: true,
      isThin: false,
      excerpt: "",
    };
  }

  const trimmed = rawContent.trim();
  const proseChunks: string[] = [];
  const codeChunks: string[] = [];
  let codeBlockCount = 0;
  let calloutCount = 0;
  let imageCount = 0;
  let parsedAsTipTap = false;

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const doc = JSON.parse(trimmed) as TipTapNode | TipTapNode[];
      parsedAsTipTap = true;

      const walk = (node: TipTapNode, inCodeBlock: boolean) => {
        if (!node || typeof node !== "object") return;

        const nodeType = node.type ?? "";
        const isCodeNode =
          nodeType === "codeBlock" || nodeType === "codeBlockWithFilename";

        if (isCodeNode) {
          codeBlockCount += 1;
        } else if (
          nodeType === "infoPanel" ||
          nodeType === "callout" ||
          nodeType === "expandSection"
        ) {
          calloutCount += 1;
        } else if (nodeType === "image") {
          imageCount += 1;
        }

        if (typeof node.text === "string" && node.text.trim()) {
          if (inCodeBlock || isCodeNode) {
            codeChunks.push(node.text);
          } else {
            proseChunks.push(node.text);
          }
        }

        if (Array.isArray(node.content)) {
          for (const child of node.content) {
            walk(child, inCodeBlock || isCodeNode);
          }
        }
      };

      if (Array.isArray(doc)) {
        for (const item of doc) walk(item, false);
      } else {
        walk(doc, false);
      }
    } catch {
      parsedAsTipTap = false;
    }
  }

  if (!parsedAsTipTap) {
    const plain = trimmed.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    if (plain) {
      proseChunks.push(plain);
    }
  }

  const proseText = proseChunks.join(" ").replace(/\s+/g, " ").trim();
  const codeText = codeChunks.join(" ").replace(/\s+/g, " ").trim();
  const proseWordCount = countWords(proseText);
  const codeWordCount = countWords(codeText);
  const wordCount = proseWordCount + codeWordCount;
  const characterCount = proseText.length + codeText.length;

  const normalizedProse = normalizeText(proseText);
  const hasOnlyTemplateText =
    parsedAsTipTap &&
    codeBlockCount === 0 &&
    imageCount === 0 &&
    calloutCount === 0 &&
    (normalizedProse.length === 0 || TEMPLATE_SIGNATURES.has(normalizedProse));

  const isEmpty =
    hasOnlyTemplateText ||
    (wordCount < 15 && codeBlockCount === 0 && imageCount === 0);

  const isThin =
    !isEmpty && proseWordCount < 80 && codeBlockCount === 0 && imageCount === 0;

  const estimatedReadMinutes =
    wordCount > 0 ? Math.max(1, Math.ceil(wordCount / 200)) : 0;

  const excerptSource = proseText || codeText;
  const excerpt =
    excerptSource.length > 160
      ? `${excerptSource.slice(0, 157).trimEnd()}...`
      : excerptSource;

  return {
    wordCount,
    proseWordCount,
    codeBlockCount,
    calloutCount,
    imageCount,
    characterCount,
    estimatedReadMinutes,
    hasOnlyTemplateText,
    isEmpty,
    isThin,
    excerpt,
  };
}
