import { judge0LanguageIds } from "@/lib/execution/judge0LanguageMap";
import type {
  ExecutionRequest,
  ExecutionResult,
  ExecutionService,
} from "@/lib/execution/types";

type Judge0SubmissionResponse = {
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  time?: string | null;
  memory?: number | null;
  status?: {
    id?: number;
    description?: string;
  } | null;
};

function buildJudge0Headers() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (process.env.JUDGE0_API_KEY) {
    headers["X-RapidAPI-Key"] = process.env.JUDGE0_API_KEY;
  }

  if (process.env.JUDGE0_API_HOST) {
    headers["X-RapidAPI-Host"] = process.env.JUDGE0_API_HOST;
  }

  return headers;
}

function getJudge0SubmissionsUrl() {
  const apiUrl = process.env.JUDGE0_API_URL;

  if (!apiUrl) {
    throw new Error("JUDGE0_API_URL is not configured.");
  }

  const normalizedApiUrl = apiUrl.replace(/\/$/, "");

  return `${normalizedApiUrl}/submissions?base64_encoded=false&wait=true`;
}

function shouldWrapReturnValue(request: ExecutionRequest) {
  return (
    (request.language === "javascript" || request.language === "typescript") &&
    /\breturn\b/.test(request.code)
  );
}

function buildSourceCode(request: ExecutionRequest) {
  if (!shouldWrapReturnValue(request)) {
    return request.code;
  }

  // Judge0 captures stdout, not function return values. This JS/TS harness lets
  // snippets written as a function body use `return ...`; the returned value is
  // printed so it appears in the normal Run Results output.
  return `
const fs = require("fs");
const rawInput = fs.readFileSync(0, "utf8");
let input = rawInput;

try {
  input = JSON.parse(rawInput);
} catch {
  input = rawInput;
}

function formatSnipsResult(value) {
  if (value === undefined) return "";
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

async function runSnipsSnippet(input) {
${request.code}
}

Promise.resolve(runSnipsSnippet(input))
  .then((result) => {
    const output = formatSnipsResult(result);

    if (output !== "") {
      console.log(output);
    }
  })
  .catch((error) => {
    console.error(error && error.stack ? error.stack : String(error));
    process.exit(1);
  });
`;
}

async function runJudge0Submission(
  request: ExecutionRequest,
  languageId: number,
  stdin: string,
) {
  const sourceCode = buildSourceCode(request);

  const response = await fetch(getJudge0SubmissionsUrl(), {
    method: "POST",
    headers: buildJudge0Headers(),
    body: JSON.stringify({
      source_code: sourceCode,
      language_id: languageId,
      stdin,
    }),
  });

  if (!response.ok) {
    throw new Error(`Judge0 request failed with status ${response.status}.`);
  }

  return (await response.json()) as Judge0SubmissionResponse;
}

export const judge0ExecutionService: ExecutionService = {
  async runTests(request) {
    const languageId = request.language
      ? judge0LanguageIds[request.language]
      : undefined;

    if (!languageId) {
      throw new Error(`Judge0 does not support language: ${request.language}`);
    }

    const results: ExecutionResult[] = [];

    // Judge0-specific execution happens here. The API route and React UI only
    // depend on the generic ExecutionService contract.
    for (const [index, testCase] of request.testCases.entries()) {
      try {
        const submission = await runJudge0Submission(
          request,
          languageId,
          testCase.input,
        );
        const expectedOutput = testCase.expectedOutput.trim();
        const actualOutput = (submission.stdout ?? "").trim();
        const hasExecutionError =
          Boolean(submission.stderr) || Boolean(submission.compile_output);

        results.push({
          id: `run-${testCase.id}`,
          testCaseId: testCase.id,
          testCaseName: testCase.name.trim() || `Test case ${index + 1}`,
          status:
            hasExecutionError || submission.status?.id === 6
              ? "error"
              : actualOutput === expectedOutput
                ? "passed"
                : "failed",
          expectedOutput,
          actualOutput,
          stderr: submission.stderr ?? undefined,
          compileOutput: submission.compile_output ?? undefined,
          runtime: submission.time ?? undefined,
          memory: submission.memory ?? undefined,
        });
      } catch (error) {
        results.push({
          id: `run-${testCase.id}`,
          testCaseId: testCase.id,
          testCaseName: testCase.name.trim() || `Test case ${index + 1}`,
          status: "error",
          expectedOutput: testCase.expectedOutput.trim(),
          actualOutput: "",
          stderr:
            error instanceof Error
              ? error.message
              : "Unknown Judge0 execution error.",
        });
      }
    }

    return results;
  },
};
