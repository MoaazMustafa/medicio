import React, { memo } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

export type MarkdownProps = {
  children: string;
  className?: string;
  components?: Partial<Components>;
};

// Styled via theme tokens instead of @tailwindcss/typography.
const DEFAULT_COMPONENTS: Partial<Components> = {
  h1: ({ children }) => <h1 className="mt-4 mb-2 text-lg font-bold text-text-primary first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="mt-4 mb-2 text-base font-bold text-text-primary first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-3 mb-1.5 text-sm font-bold text-text-primary first:mt-0">{children}</h3>,
  h4: ({ children }) => <h4 className="mt-3 mb-1 text-sm font-semibold text-text-primary first:mt-0">{children}</h4>,
  p: ({ children }) => <p className="mb-2 leading-relaxed last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-text-primary">{children}</strong>,
  a: ({ children, href }) => (
    <a className="font-medium text-primary underline underline-offset-2" href={href} rel="noopener noreferrer" target="_blank">
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-2 border-l-2 border-primary/40 pl-3 text-text-secondary italic last:mb-0">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-");

    return isBlock ? (
      <code className="block overflow-x-auto rounded-xl border border-border-custom bg-background-custom/60 p-3 font-mono text-xs">
        {children}
      </code>
    ) : (
      <code className="rounded-md bg-background-custom/80 px-1.5 py-0.5 font-mono text-[0.85em]">{children}</code>
    );
  },
  hr: () => <hr className="my-3 border-border-custom" />,
  table: ({ children }) => (
    <div className="mb-2 overflow-x-auto last:mb-0">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-border-custom bg-background-custom/50 px-2 py-1.5 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="border border-border-custom px-2 py-1.5">{children}</td>,
};

function MarkdownComponent({ children, className, components }: MarkdownProps) {
  return (
    <div className={cn("text-sm text-text-primary", className)}>
      <ReactMarkdown components={{ ...DEFAULT_COMPONENTS, ...components }} remarkPlugins={[remarkGfm]}>
        {children}
      </ReactMarkdown>
    </div>
  );
}

const Markdown = memo(MarkdownComponent);

Markdown.displayName = "Markdown";

export { Markdown };
