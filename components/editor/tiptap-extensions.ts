import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { FontFamily } from "@tiptap/extension-font-family";
import {
  Table,
  TableRow,
  TableHeader,
  TableCell,
} from "@tiptap/extension-table";

import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { Node, mergeAttributes } from "@tiptap/core";

const lowlight = createLowlight(common);

// Custom Info Panel Extension (like Confluence's Info/Note/Warning panels)
export const InfoPanel = Node.create({
  name: "infoPanel",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      type: {
        default: "info",
        parseHTML: (element: HTMLElement) => element.getAttribute("data-type"),
        renderHTML: (attributes: Record<string, unknown>) => {
          return {
            "data-type": attributes.type,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-info-panel]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const type = HTMLAttributes["data-type"] || "info";
    const colors = {
      info: "bg-blue-50/80 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-100",
      success:
        "bg-green-50/80 dark:bg-green-950/50 border-green-300 dark:border-green-800 text-green-900 dark:text-green-100",
      warning:
        "bg-amber-50/80 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-100",
      error:
        "bg-red-50/80 dark:bg-red-950/50 border-red-300 dark:border-red-800 text-red-900 dark:text-red-100",
      note: "bg-purple-50/80 dark:bg-purple-950/50 border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-100",
    };

    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-info-panel": "",
        class: `rounded-xl border-l-4 px-5 py-4 my-6 shadow-sm backdrop-blur-sm ${colors[type as keyof typeof colors] || colors.info}`,
      }),
      0,
    ];
  },
});

// Custom Expand/Collapse Section (like Confluence's Expand macro)
export const ExpandSection = Node.create({
  name: "expandSection",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      title: {
        default: "Click to expand...",
        parseHTML: (element: HTMLElement) => element.getAttribute("data-title"),
        renderHTML: (attributes: Record<string, unknown>) => {
          return {
            "data-title": attributes.title,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "details[data-expand-section]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "details",
      mergeAttributes(HTMLAttributes, {
        "data-expand-section": "",
        class:
          "my-6 rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm shadow-sm",
      }),
      [
        "summary",
        {
          class:
            "cursor-pointer px-5 py-3 font-medium hover:bg-muted/50 rounded-t-xl transition-colors",
        },
        HTMLAttributes["data-title"] || "Click to expand...",
      ],
      ["div", { class: "px-5 py-4 border-t border-border/30" }, 0],
    ];
  },
});

// Custom Code Block with file name support (like Confluence)
export const CodeBlockWithFilename = Node.create({
  name: "codeBlockWithFilename",
  group: "block",
  content: "text*",
  marks: "",
  code: true,
  defining: true,

  addAttributes() {
    return {
      language: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-language"),
        renderHTML: (attributes) => {
          if (!attributes.language) return {};
          return {
            "data-language": attributes.language,
          };
        },
      },
      filename: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-filename"),
        renderHTML: (attributes) => {
          if (!attributes.filename) return {};
          return {
            "data-filename": attributes.filename,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-code-block-filename]",
      },
      {
        tag: "pre",
        preserveWhitespace: "full",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-code-block-filename": "",
        class: "my-6",
      }),
      HTMLAttributes.filename && [
        "div",
        {
          class:
            "bg-muted/80 backdrop-blur-sm px-5 py-2.5 text-sm font-mono text-muted-foreground border border-b-0 rounded-t-xl shadow-sm",
        },
        HTMLAttributes.filename,
      ],
      [
        "pre",
        mergeAttributes(
          {
            class: `${HTMLAttributes.filename ? "rounded-t-none" : "rounded-xl"} border border-border/40 shadow-sm`,
          },
          { "data-language": HTMLAttributes.language },
        ),
        ["code", 0],
      ],
    ];
  },
});

// Custom Callout Box
export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      emoji: {
        default: "💡",
        parseHTML: (element: HTMLElement) => element.getAttribute("data-emoji"),
        renderHTML: (attributes: Record<string, unknown>) => {
          return {
            "data-emoji": attributes.emoji,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-callout]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-callout": "",
        class:
          "flex gap-4 rounded-xl bg-muted/30 backdrop-blur-sm px-5 py-4 my-6 border border-border/40 shadow-sm",
      }),
      [
        "span",
        { class: "text-2xl select-none shrink-0 mt-0.5" },
        HTMLAttributes["data-emoji"] || "💡",
      ],
      ["div", { class: "flex-1 text-foreground/90" }, 0],
    ];
  },
});

export const tiptapExtensions = [
  StarterKit.configure({
    codeBlock: false,
    heading: {
      levels: [1, 2, 3, 4, 5, 6],
      HTMLAttributes: {
        class: "heading",
      },
    },
  }),
  Underline,
  Subscript,
  Superscript,
  TextStyle,
  Color,
  FontFamily,
  Highlight.configure({ multicolor: true }),
  Link.configure({
    autolink: true,
    linkOnPaste: true,
    openOnClick: false,
    HTMLAttributes: {
      class: "text-primary underline underline-offset-2 hover:text-primary/80",
    },
  }),
  Image.configure({
    inline: false,
    allowBase64: true,
    HTMLAttributes: {
      class: "rounded-lg border my-4 max-w-full h-auto",
    },
  }),
  Placeholder.configure({
    placeholder: "Start writing your lesson content... Type '/' for commands",
  }),
  TaskList.configure({
    HTMLAttributes: {
      class: "not-prose",
    },
  }),
  TaskItem.configure({
    nested: true,
    HTMLAttributes: {
      class: "flex items-start gap-2",
    },
  }),

  TextAlign.configure({ types: ["heading", "paragraph"] }),

  Table.configure({
    resizable: true,
    HTMLAttributes: {
      class: "border-collapse table-auto w-full my-4",
    },
  }),
  TableRow.configure({
    HTMLAttributes: {
      class: "border",
    },
  }),
  TableHeader.configure({
    HTMLAttributes: {
      class: "border bg-muted font-semibold p-2 text-left",
    },
  }),
  TableCell.configure({
    HTMLAttributes: {
      class: "border p-2",
    },
  }),

  CodeBlockLowlight.configure({
    lowlight,
    HTMLAttributes: {
      class:
        "rounded-lg bg-muted/80 dark:bg-muted text-foreground p-4 my-4 overflow-x-auto font-mono text-sm border",
    },
    languageClassPrefix: "language-",
  }),

  // Custom Confluence-like extensions
  InfoPanel,
  ExpandSection,
  CodeBlockWithFilename,
  Callout,
];
