"use client";

import * as React from "react";
import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/core";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";

export function CodeBlockWithCopy({ node }: Pick<NodeViewProps, "node">) {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = async () => {
    const code = node.textContent;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const filename = node.attrs.filename;
  const language = node.attrs.language;

  return (
    <NodeViewWrapper className="relative my-6 group">
      <Button
        onClick={copyToClipboard}
        size="sm"
        variant="ghost"
        className="absolute right-3 top-3 z-10 h-8 px-3 bg-background/80 backdrop-blur-sm border border-border/40 hover:bg-background/90 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 mr-1.5" />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            Copy
          </>
        )}
      </Button>

      {/* Filename Header */}
      {filename && (
        <div className="bg-muted/80 backdrop-blur-sm px-5 py-2.5 text-sm font-mono text-muted-foreground border border-b-0 rounded-t-xl shadow-sm flex items-center justify-between">
          <span>{filename}</span>
          {language && (
            <span className="text-xs opacity-60 uppercase">{language}</span>
          )}
        </div>
      )}

      <pre
        className={`${
          filename ? "rounded-t-none" : "rounded-xl"
        } rounded-b-xl border border-border/40 shadow-sm bg-[#1e1e1e] dark:bg-[#0d0d0d] overflow-hidden`}
      >
        <code className="block p-5 overflow-x-auto text-sm leading-relaxed">
          <NodeViewContent />
        </code>
      </pre>
    </NodeViewWrapper>
  );
}

export function RegularCodeBlockWithCopy({
  node,
}: Pick<NodeViewProps, "node">) {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = async () => {
    const code = node.textContent;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <NodeViewWrapper className="relative my-6 group">
      <Button
        onClick={copyToClipboard}
        size="sm"
        variant="ghost"
        className="absolute right-3 top-3 z-10 h-8 px-3 bg-background/80 backdrop-blur-sm border border-border/40 hover:bg-background/90 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 mr-1.5" />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            Copy
          </>
        )}
      </Button>

      <pre className="rounded-xl border border-border/40 shadow-sm bg-[#1e1e1e] dark:bg-[#0d0d0d] overflow-hidden">
        <code className="block p-5 overflow-x-auto text-sm leading-relaxed">
          <NodeViewContent />
        </code>
      </pre>
    </NodeViewWrapper>
  );
}
