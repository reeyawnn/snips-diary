"use client";

import { FormEvent, useState } from "react";

import { Sidebar } from "@/components/layout/Sidebar";
import type { Language, Snippet } from "@/types";

type DashboardShellProps = {
  snippets: Snippet[];
};

type SnippetEditorDraft = {
  title: string;
  language: Language;
  description: string;
  code: string;
};

const languageOptions: { label: string; value: Language }[] = [
  { label: "JavaScript", value: "javascript" },
  { label: "TypeScript", value: "typescript" },
  { label: "Python", value: "python" },
  { label: "Java", value: "java" },
  { label: "C#", value: "csharp" },
  { label: "C++", value: "cpp" },
  { label: "Go", value: "go" },
  { label: "Rust", value: "rust" },
  { label: "Ruby", value: "ruby" },
  { label: "PHP", value: "php" },
  { label: "Swift", value: "swift" },
  { label: "Kotlin", value: "kotlin" },
  { label: "SQL", value: "sql" },
  { label: "HTML", value: "html" },
  { label: "CSS", value: "css" },
  { label: "Shell", value: "shell" },
  { label: "Markdown", value: "markdown" },
  { label: "Text", value: "text" },
];

function createEditorDraft(snippet: Snippet): SnippetEditorDraft {
  return {
    title: snippet.title,
    language: snippet.language,
    description: snippet.description ?? "",
    code: snippet.code,
  };
}

export function DashboardShell({ snippets }: DashboardShellProps) {
  const [localSnippets, setLocalSnippets] = useState<Snippet[]>(snippets);
  const [selectedSnippetId, setSelectedSnippetId] = useState<string | null>(
    null,
  );
  const [editorDraft, setEditorDraft] =
    useState<SnippetEditorDraft | null>(null);

  const selectedSnippet =
    localSnippets.find((snippet) => snippet.id === selectedSnippetId) ?? null;

  function handleSelectSnippet(snippet: Snippet) {
    setSelectedSnippetId(snippet.id);
    setEditorDraft(createEditorDraft(snippet));
  }

  function handleSaveSnippet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedSnippet || !editorDraft) {
      return;
    }

    setLocalSnippets((currentSnippets) =>
      currentSnippets.map((snippet) =>
        snippet.id === selectedSnippet.id
          ? {
              ...snippet,
              title: editorDraft.title,
              language: editorDraft.language,
              description: editorDraft.description,
              code: editorDraft.code,
              updatedAt: new Date().toISOString(),
            }
          : snippet,
      ),
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-100 text-neutral-950">
      <Sidebar
        snippets={localSnippets}
        selectedSnippetId={selectedSnippetId ?? undefined}
        onSelectSnippet={handleSelectSnippet}
      />

      <main className="min-w-0 flex-1 overflow-y-auto bg-white">
        {selectedSnippet && editorDraft ? (
          <form className="flex min-h-full flex-col" onSubmit={handleSaveSnippet}>
            <header className="border-b border-neutral-200 px-8 py-5">
              <div className="flex items-start justify-between gap-6">
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <label className="sr-only" htmlFor="snippet-title">
                    Snippet title
                  </label>
                  <input
                    id="snippet-title"
                    value={editorDraft.title}
                    onChange={(event) =>
                      setEditorDraft((currentDraft) =>
                        currentDraft
                          ? { ...currentDraft, title: event.target.value }
                          : currentDraft,
                      )
                    }
                    className="w-full border-none bg-transparent p-0 text-2xl font-semibold tracking-tight text-neutral-950 outline-none placeholder:text-neutral-300"
                    placeholder="Untitled snippet"
                  />

                  <div className="flex items-center gap-3">
                    <label
                      className="text-xs font-medium uppercase tracking-wide text-neutral-400"
                      htmlFor="snippet-language"
                    >
                      Language
                    </label>
                    <select
                      id="snippet-language"
                      value={editorDraft.language}
                      onChange={(event) =>
                        setEditorDraft((currentDraft) =>
                          currentDraft
                            ? {
                                ...currentDraft,
                                language: event.target.value as Language,
                              }
                            : currentDraft,
                        )
                      }
                      className="h-8 rounded-md border border-neutral-200 bg-neutral-50 px-2.5 text-sm font-medium text-neutral-700 outline-none transition-colors focus:border-neutral-300 focus:ring-2 focus:ring-neutral-200"
                    >
                      {languageOptions.map((language) => (
                        <option key={language.value} value={language.value}>
                          {language.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-neutral-950 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-300 focus:ring-offset-2"
                >
                  Save
                </button>
              </div>
            </header>

            <div className="flex flex-1 flex-col">
              <section className="border-b border-neutral-200 px-8 py-6">
                <label
                  className="text-xs font-medium uppercase tracking-wide text-neutral-400"
                  htmlFor="snippet-notes"
                >
                  Notes
                </label>
                <textarea
                  id="snippet-notes"
                  value={editorDraft.description}
                  onChange={(event) =>
                    setEditorDraft((currentDraft) =>
                      currentDraft
                        ? {
                            ...currentDraft,
                            description: event.target.value,
                          }
                        : currentDraft,
                    )
                  }
                  className="mt-3 min-h-28 w-full resize-y rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm leading-6 text-neutral-700 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-300 focus:bg-white focus:ring-2 focus:ring-neutral-200"
                  placeholder="Add implementation notes, edge cases, or reminders."
                />
              </section>

              <section className="flex min-h-0 flex-1 flex-col px-8 py-6">
                <div className="mb-3 flex items-center justify-between border-b border-neutral-200 pb-3">
                  <label
                    className="text-xs font-medium uppercase tracking-wide text-neutral-400"
                    htmlFor="snippet-code"
                  >
                    Code
                  </label>
                  <span className="text-xs text-neutral-400">
                    Plain textarea
                  </span>
                </div>
                <textarea
                  id="snippet-code"
                  value={editorDraft.code}
                  onChange={(event) =>
                    setEditorDraft((currentDraft) =>
                      currentDraft
                        ? { ...currentDraft, code: event.target.value }
                        : currentDraft,
                    )
                  }
                  spellCheck={false}
                  className="min-h-96 flex-1 resize-none overflow-auto rounded-lg border border-neutral-200 bg-neutral-50 p-5 font-mono text-sm leading-6 text-neutral-800 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-300 focus:bg-white focus:ring-2 focus:ring-neutral-200"
                  placeholder="Write or paste a code snippet."
                />
              </section>
            </div>
          </form>
        ) : (
          <div className="flex min-h-full items-center justify-center bg-neutral-50 px-8">
            <p className="max-w-sm text-center text-sm text-neutral-500">
              Select a snippet or create a new one.
            </p>
          </div>
        )}
      </main>

      <aside className="flex h-screen w-[360px] shrink-0 flex-col border-l border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-6 py-5">
          <h2 className="text-sm font-semibold text-neutral-950">Context</h2>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {selectedSnippet ? (
            <div className="divide-y divide-neutral-200">
              <section className="px-6 py-5">
                <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                  Notes
                </h3>
                <p className="mt-3 text-sm leading-6 text-neutral-600">
                  {editorDraft?.description || "No notes added yet."}
                </p>
              </section>

              <section className="px-6 py-5">
                <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                  Tags
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedSnippet.tags.length > 0 ? (
                    selectedSnippet.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-500"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-neutral-500">No tags yet.</p>
                  )}
                </div>
              </section>

              <section className="px-6 py-5">
                <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                  Test Cases
                </h3>
                <p className="mt-3 text-sm text-neutral-500">
                  Test case management will appear here.
                </p>
              </section>

              <section className="px-6 py-5">
                <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                  Run History
                </h3>
                <p className="mt-3 text-sm text-neutral-500">
                  Execution results will appear here.
                </p>
              </section>
            </div>
          ) : (
            <div className="px-6 py-5">
              <p className="text-sm leading-6 text-neutral-500">
                Select a snippet to see notes, tags, test cases, and run
                history.
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
