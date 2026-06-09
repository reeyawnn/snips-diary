import type { Language, Snippet } from "@/types";

type SidebarProps = {
  snippets: Snippet[];
};

const languageLabels: Record<Language, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  java: "Java",
  csharp: "C#",
  cpp: "C++",
  go: "Go",
  rust: "Rust",
  ruby: "Ruby",
  php: "PHP",
  swift: "Swift",
  kotlin: "Kotlin",
  sql: "SQL",
  html: "HTML",
  css: "CSS",
  shell: "Shell",
  markdown: "Markdown",
  text: "Text",
};

function formatUpdatedDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function Sidebar({ snippets }: SidebarProps) {
  return (
    <aside className="flex h-screen w-80 shrink-0 flex-col border-r border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 px-6 py-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">
            Snips Diary
          </h1>
          <button
            type="button"
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-neutral-950 px-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-300 focus:ring-offset-2"
          >
            + New
          </button>
        </div>
      </div>

      <nav aria-label="Snippets" className="min-h-0 flex-1 overflow-y-auto p-4">
        <ul className="space-y-3">
          {snippets.map((snippet) => (
            <li key={snippet.id}>
              <button
                type="button"
                className="w-full rounded-lg border border-transparent p-3 text-left transition-colors hover:border-neutral-200 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-300"
              >
                <span className="block truncate text-sm font-medium text-neutral-950">
                  {snippet.title}
                </span>
                <span className="mt-2 flex items-center justify-between gap-3">
                  <span className="rounded-md bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-500">
                    {languageLabels[snippet.language]}
                  </span>
                  <span className="shrink-0 text-xs text-neutral-400">
                    {formatUpdatedDate(snippet.updatedAt)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
