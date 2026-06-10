import { NextResponse } from "next/server";

import { judge0ExecutionService, mockExecutionService } from "@/lib/execution";
import type { Language, TestCase } from "@/types";

type RunTestsRequest = {
  language?: Language;
  code?: string;
  testCases?: TestCase[];
};

function getExecutionService() {
  if (process.env.JUDGE0_API_URL) {
    return judge0ExecutionService;
  }

  return mockExecutionService;
}

export async function POST(request: Request) {
  const body = (await request.json()) as RunTestsRequest;
  const testCases = Array.isArray(body.testCases) ? body.testCases : [];
  const code = body.code ?? "";
  const executionService = getExecutionService();
  const results = await executionService.runTests({
    language: body.language,
    code,
    testCases,
  });

  return NextResponse.json({
    language: body.language,
    code,
    results,
  });
}
