"use client";

import { ReactNodeViewRenderer } from "@tiptap/react";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { Node, mergeAttributes } from "@tiptap/core";
import {
  CodeBlockWithCopy,
  RegularCodeBlockWithCopy,
} from "./CodeBlockWithCopy";
import { tiptapExtensions } from "./tiptap-extensions";

const lowlight = createLowlight(common);

// Custom Code Block with Copy Button (for renderer only)
const CodeBlockWithCopyButton = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(RegularCodeBlockWithCopy);
  },
}).configure({ lowlight });

// Custom Code Block with Filename and Copy Button (for renderer only)
const CodeBlockWithFilenameCopy = Node.create({
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
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-language"),
        renderHTML: (attributes: Record<string, unknown>) => {
          if (!attributes.language) return {};
          return {
            "data-language": attributes.language,
          };
        },
      },
      filename: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-filename"),
        renderHTML: (attributes: Record<string, unknown>) => {
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
    ];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-code-block-filename": "",
      }),
      ["pre", ["code", 0]],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockWithCopy);
  },
});

// Export renderer extensions (replaces regular code blocks with copy button versions)
export const tiptapRendererExtensions = [
  ...tiptapExtensions.filter(
    (ext) =>
      ext.name !== "codeBlock" &&
      ext.name !== "codeBlockLowlight" &&
      ext.name !== "codeBlockWithFilename",
  ),
  CodeBlockWithCopyButton,
  CodeBlockWithFilenameCopy,
];
