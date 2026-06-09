export type Language =
  | "javascript"
  | "typescript"
  | "python"
  | "java"
  | "csharp"
  | "cpp"
  | "go"
  | "rust"
  | "ruby"
  | "php"
  | "swift"
  | "kotlin"
  | "sql"
  | "html"
  | "css"
  | "shell"
  | "markdown"
  | "text";

export type TestCase = {
  id: string;
  name: string;
  input: string;
  expectedOutput: string;
  createdAt: string;
  updatedAt: string;
};

export type RunResult = {
  id: string;
  testCaseId?: string;
  status: "passed" | "failed" | "error" | "timeout";
  output: string;
  error?: string;
  durationMs: number;
  executedAt: string;
};

export type Snippet = {
  id: string;
  title: string;
  description?: string;
  language: Language;
  code: string;
  tags: string[];
  testCases: TestCase[];
  runResults: RunResult[];
  createdAt: string;
  updatedAt: string;
};
