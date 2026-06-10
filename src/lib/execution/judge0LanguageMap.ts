import type { Language } from "@/types";

// Judge0 language IDs are provider-specific and live in the execution layer.
// The UI should continue using app language values from src/lib/languages.ts.
export const judge0LanguageIds: Partial<Record<Language, number>> = {
  javascript: 63,
  typescript: 74,
  python: 71,
  java: 62,
  csharp: 51,
  cpp: 54,
  go: 60,
  rust: 73,
  ruby: 72,
  php: 68,
  swift: 83,
  kotlin: 78,
  sql: 82,
  shell: 46,
  text: 43,
};
