import type { Language, TestCase } from "@/types";

export type ExecutionRequest = {
  language?: Language;
  code: string;
  testCases: TestCase[];
};

export type ExecutionResult = {
  id: string;
  testCaseId: string;
  testCaseName: string;
  status: "passed" | "failed" | "error";
  expectedOutput: string;
  actualOutput: string;
  stderr?: string;
  compileOutput?: string;
  runtime?: string;
  memory?: number;
};

export type ExecutionService = {
  runTests: (request: ExecutionRequest) => Promise<ExecutionResult[]>;
};
