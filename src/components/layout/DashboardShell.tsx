"use client";

import { useState } from "react";

import { Sidebar } from "@/components/layout/Sidebar";
import type { Snippet } from "@/types";

type DashboardShellProps = {
  snippets: Snippet[];
};

export function DashboardShell({ snippets }: DashboardShellProps) {
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-100 text-neutral-950">
      <Sidebar
        snippets={snippets}
        selectedSnippetId={selectedSnippet?.id}
        onSelectSnippet={setSelectedSnippet}
      />

      <main className="min-w-0 flex-1 overflow-y-auto bg-white">
        {selectedSnippet ? (
          <article className="flex min-h-full flex-col">
            <header className="border-b border-neutral-200 px-8 py-6">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">
                  {selectedSnippet.title}
                </h2>
                <span className="rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-500">
                  {selectedSnippet.language}
                </span>
              </div>
            </header>

            <div className="flex flex-1 flex-col">
              <section className="border-b border-neutral-200 px-8 py-6">
                <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                  Description
                </h3>
                <p className="mt-3 max-w-4xl text-sm leading-6 text-neutral-600">
                  {selectedSnippet.description || "No description added yet."}
                </p>
              </section>

              <section className="flex min-h-0 flex-1 flex-col px-8 py-6">
                <div className="mb-3 flex items-center justify-between border-b border-neutral-200 pb-3">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                    Code
                  </h3>
                  <span className="text-xs text-neutral-400">
                    Read-only preview
                  </span>
                </div>
                <pre className="min-h-96 flex-1 overflow-auto rounded-lg border border-neutral-200 bg-neutral-50 p-5 font-mono text-sm leading-6 text-neutral-800">
                  <code>{selectedSnippet.code}</code>
                </pre>
              </section>
            </div>
          </article>
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
                  {selectedSnippet.description || "No notes added yet."}
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
