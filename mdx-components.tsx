import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="text-2xl font-bold text-foreground mt-8 mb-3 first:mt-0">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-lg font-semibold text-foreground mt-6 mb-2">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-base font-semibold text-foreground mt-4 mb-1">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="text-[15px] text-foreground leading-relaxed mb-4">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-outside pl-5 mb-4 space-y-1 text-[15px] text-foreground">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-outside pl-5 mb-4 space-y-1 text-[15px] text-foreground">
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    strong: ({ children }) => (
      <strong className="font-semibold text-foreground">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="px-1.5 py-0.5 rounded bg-muted text-[13px] font-mono text-foreground">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="bg-muted rounded-xl p-4 mb-4 overflow-x-auto text-[13px] font-mono text-foreground">
        {children}
      </pre>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary pl-4 mb-4 text-muted-foreground italic">
        {children}
      </blockquote>
    ),
    hr: () => <hr className="border-border my-6" />,
    table: ({ children }) => (
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-[14px] border-collapse">{children}</table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="border-b border-border">{children}</thead>
    ),
    th: ({ children }) => (
      <th className="text-left font-semibold text-foreground py-2 pr-4">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="text-foreground py-2 pr-4 border-b border-border/50">
        {children}
      </td>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-primary underline underline-offset-2 hover:text-primary/80"
      >
        {children}
      </a>
    ),
    ...components,
  };
}
