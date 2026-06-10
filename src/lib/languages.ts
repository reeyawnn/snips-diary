import type { Language } from "@/types";

export type LanguageConfig = {
  displayName: string;
  value: Language;
  monacoLanguageId: string;
};

export const languages: LanguageConfig[] = [
  {
    displayName: "JavaScript",
    value: "javascript",
    monacoLanguageId: "javascript",
  },
  {
    displayName: "TypeScript",
    value: "typescript",
    monacoLanguageId: "typescript",
  },
  {
    displayName: "Python",
    value: "python",
    monacoLanguageId: "python",
  },
  {
    displayName: "Java",
    value: "java",
    monacoLanguageId: "java",
  },
  {
    displayName: "C#",
    value: "csharp",
    monacoLanguageId: "csharp",
  },
  {
    displayName: "C++",
    value: "cpp",
    monacoLanguageId: "cpp",
  },
  {
    displayName: "Go",
    value: "go",
    monacoLanguageId: "go",
  },
  {
    displayName: "Rust",
    value: "rust",
    monacoLanguageId: "rust",
  },
  {
    displayName: "Ruby",
    value: "ruby",
    monacoLanguageId: "ruby",
  },
  {
    displayName: "PHP",
    value: "php",
    monacoLanguageId: "php",
  },
  {
    displayName: "Swift",
    value: "swift",
    monacoLanguageId: "swift",
  },
  {
    displayName: "Kotlin",
    value: "kotlin",
    monacoLanguageId: "kotlin",
  },
  {
    displayName: "SQL",
    value: "sql",
    monacoLanguageId: "sql",
  },
  {
    displayName: "HTML",
    value: "html",
    monacoLanguageId: "html",
  },
  {
    displayName: "CSS",
    value: "css",
    monacoLanguageId: "css",
  },
  {
    displayName: "Shell",
    value: "shell",
    monacoLanguageId: "shell",
  },
  {
    displayName: "Markdown",
    value: "markdown",
    monacoLanguageId: "markdown",
  },
  {
    displayName: "Text",
    value: "text",
    monacoLanguageId: "plaintext",
  },
];

export const languageByValue = Object.fromEntries(
  languages.map((language) => [language.value, language]),
) as Record<Language, LanguageConfig>;
