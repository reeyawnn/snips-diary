import { NextResponse } from "next/server";

import type { Language, TestCase } from "@/types";

type RunTestsRequest = {
  language?: Language;
  code?: string;
  testCases?: TestCase[];
};

type MockRunResult = {
  id: string;
  testCaseId: string;
  testCaseName: string;
  status: "passed" | "failed";
  expectedOutput: string;
  actualOutput: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as RunTestsRequest;
  const testCases = Array.isArray(body.testCases) ? body.testCases : [];

  const results: MockRunResult[] = testCases.map((testCase, index) => {
    const passed = index % 2 === 0;
    const expectedOutput =
      testCase.expectedOutput.trim() || "No expected output provided.";

    return {
      id: `run-${testCase.id}`,
      testCaseId: testCase.id,
      testCaseName: testCase.name.trim() || `Test case ${index + 1}`,
      status: passed ? "passed" : "failed",
      expectedOutput,
      actualOutput: passed
        ? expectedOutput
        : `Mock actual output for ${testCase.name || `test case ${index + 1}`}.`,
    };
  });

  return NextResponse.json({
    language: body.language,
    code: body.code ?? "",
    results,
  });
}
