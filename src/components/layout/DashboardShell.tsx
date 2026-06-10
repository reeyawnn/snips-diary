"use client";

import { FormEvent, useEffect, useState } from "react";
import Editor from "@monaco-editor/react";

import { Sidebar } from "@/components/layout/Sidebar";
import { languageByValue, languages } from "@/lib/languages";
import type { Language, Snippet, TestCase } from "@/types";

type DashboardShellProps = {
  snippets: Snippet[];
};

type SnippetEditorDraft = {
  title: string;
  language: Language;
  description: string;
  code: string;
};

type MockRunResult = {
  id: string;
  testCaseId: string;
  testCaseName: string;
  status: "passed" | "failed";
  expectedOutput: string;
  actualOutput: string;
};

type InitialDashboardState = {
  snippets: Snippet[];
  selectedSnippetId: string | null;
  editorDraft: SnippetEditorDraft | null;
};

const SNIPPETS_STORAGE_KEY = "snips.snippets";
const SELECTED_SNIPPET_STORAGE_KEY = "snips.selectedSnippetId";

function createEditorDraft(snippet: Snippet): SnippetEditorDraft {
  return {
    title: snippet.title,
    language: snippet.language,
    description: snippet.description ?? "",
    code: snippet.code,
  };
}

function createTestCase(): TestCase {
  const timestamp = new Date().toISOString();

  return {
    id: `test-${Date.now()}`,
    name: "New test case",
    input: "",
    expectedOutput: "",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function parseStoredSnippets(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const parsedValue: unknown = JSON.parse(value);

    if (Array.isArray(parsedValue)) {
      return parsedValue as Snippet[];
    }
  } catch {
    return null;
  }

  return null;
}

function createInitialDashboardState(snippets: Snippet[]): InitialDashboardState {
  if (typeof window === "undefined") {
    const selectedSnippet = snippets[0] ?? null;

    return {
      snippets,
      selectedSnippetId: selectedSnippet?.id ?? null,
      editorDraft: selectedSnippet ? createEditorDraft(selectedSnippet) : null,
    };
  }

  const storedSnippets = parseStoredSnippets(
    window.localStorage.getItem(SNIPPETS_STORAGE_KEY),
  );
  const nextSnippets =
    storedSnippets && storedSnippets.length > 0 ? storedSnippets : snippets;
  const storedSelectedSnippetId = window.localStorage.getItem(
    SELECTED_SNIPPET_STORAGE_KEY,
  );
  const selectedSnippet =
    nextSnippets.find((snippet) => snippet.id === storedSelectedSnippetId) ??
    nextSnippets[0] ??
    null;

  return {
    snippets: nextSnippets,
    selectedSnippetId: selectedSnippet?.id ?? null,
    editorDraft: selectedSnippet ? createEditorDraft(selectedSnippet) : null,
  };
}

export function DashboardShell({ snippets }: DashboardShellProps) {
  const [initialDashboardState] = useState(() =>
    createInitialDashboardState(snippets),
  );
  const [localSnippets, setLocalSnippets] = useState<Snippet[]>(
    initialDashboardState.snippets,
  );
  const [runResultsBySnippetId, setRunResultsBySnippetId] = useState<
    Record<string, MockRunResult[]>
  >({});
  const [selectedSnippetId, setSelectedSnippetId] = useState<string | null>(
    initialDashboardState.selectedSnippetId,
  );
  const [editorDraft, setEditorDraft] =
    useState<SnippetEditorDraft | null>(initialDashboardState.editorDraft);

  const selectedSnippet =
    localSnippets.find((snippet) => snippet.id === selectedSnippetId) ??
    localSnippets[0] ??
    null;
  const selectedRunResults = selectedSnippet
    ? runResultsBySnippetId[selectedSnippet.id] ?? []
    : [];

  useEffect(() => {
    window.localStorage.setItem(
      SNIPPETS_STORAGE_KEY,
      JSON.stringify(localSnippets),
    );
  }, [localSnippets]);

  useEffect(() => {
    if (!selectedSnippet) {
      window.localStorage.removeItem(SELECTED_SNIPPET_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(
      SELECTED_SNIPPET_STORAGE_KEY,
      selectedSnippet.id,
    );
  }, [selectedSnippet]);

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

  function handleAddTestCase() {
    if (!selectedSnippet) {
      return;
    }

    const currentSelectedSnippetId = selectedSnippet.id;

    setLocalSnippets((currentSnippets) =>
      currentSnippets.map((snippet) =>
        snippet.id === currentSelectedSnippetId
          ? {
              ...snippet,
              testCases: [...snippet.testCases, createTestCase()],
              updatedAt: new Date().toISOString(),
            }
          : snippet,
      ),
    );
  }

  function handleRemoveTestCase(testCaseId: string) {
    if (!selectedSnippet) {
      return;
    }

    const currentSelectedSnippetId = selectedSnippet.id;

    setLocalSnippets((currentSnippets) =>
      currentSnippets.map((snippet) =>
        snippet.id === currentSelectedSnippetId
          ? {
              ...snippet,
              testCases: snippet.testCases.filter(
                (testCase) => testCase.id !== testCaseId,
              ),
              updatedAt: new Date().toISOString(),
            }
          : snippet,
      ),
    );
    setRunResultsBySnippetId((currentResults) => ({
      ...currentResults,
      [currentSelectedSnippetId]: (
        currentResults[currentSelectedSnippetId] ?? []
      ).filter((result) => result.testCaseId !== testCaseId),
    }));
  }

  function handleUpdateTestCase(
    testCaseId: string,
    field: "name" | "input" | "expectedOutput",
    value: string,
  ) {
    if (!selectedSnippet) {
      return;
    }

    const currentSelectedSnippetId = selectedSnippet.id;

    setLocalSnippets((currentSnippets) =>
      currentSnippets.map((snippet) =>
        snippet.id === currentSelectedSnippetId
          ? {
              ...snippet,
              testCases: snippet.testCases.map((testCase) =>
                testCase.id === testCaseId
                  ? {
                      ...testCase,
                      [field]: value,
                      updatedAt: new Date().toISOString(),
                    }
                  : testCase,
              ),
              updatedAt: new Date().toISOString(),
            }
          : snippet,
      ),
    );
  }

  function handleRunTests() {
    if (!selectedSnippet) {
      return;
    }

    const mockResults = selectedSnippet.testCases.map((testCase, index) => {
      const passed = index % 2 === 0;
      const expectedOutput =
        testCase.expectedOutput.trim() || "No expected output provided.";

      return {
        id: `run-${selectedSnippet.id}-${testCase.id}`,
        testCaseId: testCase.id,
        testCaseName: testCase.name.trim() || `Test case ${index + 1}`,
        status: passed ? "passed" : "failed",
        expectedOutput,
        actualOutput: passed
          ? expectedOutput
          : `Mock actual output for ${testCase.name || `test case ${index + 1}`}.`,
      } satisfies MockRunResult;
    });

    setRunResultsBySnippetId((currentResults) => ({
      ...currentResults,
      [selectedSnippet.id]: mockResults,
    }));
  }

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-100 text-neutral-950">
      <Sidebar
        snippets={localSnippets}
        selectedSnippetId={selectedSnippet?.id}
        onSelectSnippet={handleSelectSnippet}
      />

      <main className="min-w-0 flex-1 bg-white">
        {selectedSnippet && editorDraft ? (
          <form
            className="flex h-full min-h-0 flex-col"
            onSubmit={handleSaveSnippet}
          >
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
                      {languages.map((language) => (
                        <option key={language.value} value={language.value}>
                          {language.displayName}
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

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <section className="shrink-0 border-b border-neutral-200 px-8 py-6">
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

              <section className="flex min-h-0 flex-1 flex-col overflow-hidden px-8 py-6">
                <div className="mb-3 flex items-center justify-between border-b border-neutral-200 pb-3">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                    Code
                  </h3>
                  <span className="text-xs text-neutral-400">
                    Monaco Editor
                  </span>
                </div>
                <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
                  <Editor
                    height="100%"
                    language={
                      languageByValue[editorDraft.language].monacoLanguageId
                    }
                    theme="vs-light"
                    value={editorDraft.code}
                    onChange={(value) =>
                      setEditorDraft((currentDraft) =>
                        currentDraft
                          ? { ...currentDraft, code: value ?? "" }
                          : currentDraft,
                      )
                    }
                    options={{
                      automaticLayout: true,
                      fontSize: 14,
                      minimap: { enabled: false },
                      padding: { top: 16, bottom: 16 },
                      scrollBeyondLastLine: false,
                      wordWrap: "on",
                    }}
                  />
                </div>
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
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                    Test Cases
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddTestCase}
                    className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-white px-2.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-200"
                  >
                    Add Test Case
                  </button>
                </div>

                {selectedSnippet.testCases.length > 0 ? (
                  <div className="mt-4 flex flex-col gap-4">
                    {selectedSnippet.testCases.map((testCase, index) => (
                      <div
                        key={testCase.id}
                        className="rounded-lg border border-neutral-200 bg-neutral-50 p-3"
                      >
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <span className="text-xs font-medium text-neutral-400">
                            Case {index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTestCase(testCase.id)}
                            className="text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-950 focus:outline-none focus:ring-2 focus:ring-neutral-200"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="flex flex-col gap-3">
                          <label className="flex flex-col gap-1.5">
                            <span className="text-xs font-medium text-neutral-500">
                              Name
                            </span>
                            <input
                              value={testCase.name}
                              onChange={(event) =>
                                handleUpdateTestCase(
                                  testCase.id,
                                  "name",
                                  event.target.value,
                                )
                              }
                              className="h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-700 outline-none transition-colors focus:border-neutral-300 focus:ring-2 focus:ring-neutral-200"
                              placeholder="Test case name"
                            />
                          </label>

                          <label className="flex flex-col gap-1.5">
                            <span className="text-xs font-medium text-neutral-500">
                              Input
                            </span>
                            <textarea
                              value={testCase.input}
                              onChange={(event) =>
                                handleUpdateTestCase(
                                  testCase.id,
                                  "input",
                                  event.target.value,
                                )
                              }
                              className="min-h-20 resize-y rounded-md border border-neutral-200 bg-white px-3 py-2 font-mono text-xs leading-5 text-neutral-700 outline-none transition-colors focus:border-neutral-300 focus:ring-2 focus:ring-neutral-200"
                              placeholder="Input"
                            />
                          </label>

                          <label className="flex flex-col gap-1.5">
                            <span className="text-xs font-medium text-neutral-500">
                              Expected Output
                            </span>
                            <textarea
                              value={testCase.expectedOutput}
                              onChange={(event) =>
                                handleUpdateTestCase(
                                  testCase.id,
                                  "expectedOutput",
                                  event.target.value,
                                )
                              }
                              className="min-h-20 resize-y rounded-md border border-neutral-200 bg-white px-3 py-2 font-mono text-xs leading-5 text-neutral-700 outline-none transition-colors focus:border-neutral-300 focus:ring-2 focus:ring-neutral-200"
                              placeholder="Expected output"
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-neutral-500">
                    No test cases yet.
                  </p>
                )}
              </section>

              <section className="px-6 py-5">
                <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                  Run Results
                </h3>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-sm text-neutral-500">
                    Mock test output for the selected snippet.
                  </p>
                  <button
                    type="button"
                    onClick={handleRunTests}
                    disabled={selectedSnippet.testCases.length === 0}
                    className="inline-flex h-8 shrink-0 items-center justify-center rounded-md bg-neutral-950 px-3 text-xs font-medium text-white transition-colors hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-300 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
                  >
                    Run Tests
                  </button>
                </div>

                {selectedRunResults.length > 0 ? (
                  <div className="mt-4 flex flex-col gap-3">
                    {selectedRunResults.map((result) => (
                      <div
                        key={result.id}
                        className="rounded-lg border border-neutral-200 bg-neutral-50 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-sm font-medium text-neutral-800">
                            {result.testCaseName}
                          </h4>
                          <span className="rounded-md bg-white px-2 py-1 text-xs font-medium capitalize text-neutral-600 ring-1 ring-inset ring-neutral-200">
                            {result.status}
                          </span>
                        </div>

                        <div className="mt-3 grid gap-3">
                          <div>
                            <p className="text-xs font-medium text-neutral-400">
                              Expected Output
                            </p>
                            <pre className="mt-1 overflow-x-auto rounded-md bg-white p-2 font-mono text-xs leading-5 text-neutral-700 ring-1 ring-inset ring-neutral-200">
                              {result.expectedOutput}
                            </pre>
                          </div>

                          <div>
                            <p className="text-xs font-medium text-neutral-400">
                              Actual Output
                            </p>
                            <pre className="mt-1 overflow-x-auto rounded-md bg-white p-2 font-mono text-xs leading-5 text-neutral-700 ring-1 ring-inset ring-neutral-200">
                              {result.actualOutput}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-neutral-500">
                    Run tests to generate mock results.
                  </p>
                )}
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
