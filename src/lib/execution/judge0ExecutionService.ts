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

function indentCode(code: string, spaces: number) {
  const indentation = " ".repeat(spaces);

  return code
    .split("\n")
    .map((line) => (line.trim() ? `${indentation}${line}` : line))
    .join("\n");
}

function shouldWrapReturnValue(request: ExecutionRequest) {
  return /\breturn\b/.test(request.code);
}

function getJavaScriptFunctionName(code: string) {
  return (
    code.match(/^\s*function\s+([A-Za-z_$][\w$]*)\s*\(/m)?.[1] ??
    code.match(/^\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/m)?.[1] ??
    null
  );
}

function buildJavaScriptSourceCode(request: ExecutionRequest) {
  // Judge0 captures stdout, not function return values. This JS/TS harness lets
  // snippets written as a function body use `return ...`; the returned value is
  // printed so it appears in the normal Run Results output.
  const requireDeclaration =
    request.language === "typescript" ? "declare const require: any;\n" : "";
  const inputDeclaration =
    request.language === "typescript"
      ? "let input: any = rawInput;"
      : "let input = rawInput;";
  const declaredFunctionName = getJavaScriptFunctionName(request.code);
  const functionReference =
    request.language === "typescript"
      ? `const snipsFunction: any = ${declaredFunctionName};`
      : `const snipsFunction = ${declaredFunctionName};`;

  if (declaredFunctionName) {
    return `
${requireDeclaration}
const fs = require("fs");
const rawInput = fs.readFileSync(0, "utf8");
${inputDeclaration}

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

${request.code}

try {
  ${functionReference}
  const result = Array.isArray(input)
    ? snipsFunction(...input)
    : snipsFunction(input);
  const output = formatSnipsResult(result);

  if (output !== "") {
    console.log(output);
  }
} catch (error) {
  console.error(error && error.stack ? error.stack : String(error));
}
`;
  }

  return `
${requireDeclaration}
const fs = require("fs");
const rawInput = fs.readFileSync(0, "utf8");
${inputDeclaration}

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

function runSnipsSnippet(input) {
${request.code}
}

try {
  const result = runSnipsSnippet(input);
  const output = formatSnipsResult(result);

  if (output !== "") {
    console.log(output);
  }
} catch (error) {
  console.error(error && error.stack ? error.stack : String(error));
}
`;
}

function buildPythonSourceCode(request: ExecutionRequest) {
  const functionMatch = request.code.match(/^\s*def\s+([A-Za-z_]\w*)\s*\(/m);

  if (functionMatch) {
    const functionName = functionMatch[1];

    return `
import json
import sys

raw_input = sys.stdin.read()

try:
    input = json.loads(raw_input)
except Exception:
    input = raw_input

def format_snips_result(value):
    if value is None:
        return ""
    if isinstance(value, (dict, list)):
        return json.dumps(value, separators=(",", ":"))
    return str(value)

${request.code}

if isinstance(input, list):
    result = ${functionName}(*input)
else:
    result = ${functionName}(input)

output = format_snips_result(result)

if output != "":
    print(output)
`;
  }

  return `
import json
import sys

raw_input = sys.stdin.read()

try:
    input = json.loads(raw_input)
except Exception:
    input = raw_input

def format_snips_result(value):
    if value is None:
        return ""
    if isinstance(value, (dict, list)):
        return json.dumps(value, separators=(",", ":"))
    return str(value)

def run_snips_snippet(input):
${indentCode(request.code, 4)}

output = format_snips_result(run_snips_snippet(input))

if output != "":
    print(output)
`;
}

function buildJavaSourceCode(request: ExecutionRequest) {
  const methodName = request.code.match(
    /^\s*(?:public|private|protected)?\s*(?:static\s+)?[\w<>\[\]]+\s+([A-Za-z_]\w*)\s*\(/m,
  )?.[1];

  if (methodName && !/\bclass\s+\w+/.test(request.code)) {
    return `
import java.io.*;

public class Main {
${indentCode(request.code, 2)}

  public static void main(String[] args) throws Exception {
    String input = new String(System.in.readAllBytes()).trim();
    Object result = new Main().${methodName}(input);

    if (result != null) {
      System.out.print(result);
    }
  }
}
`;
  }

  return `
import java.io.*;

public class Main {
  static Object runSnipsSnippet(String input) throws Exception {
${indentCode(request.code, 4)}
  }

  public static void main(String[] args) throws Exception {
    String input = new String(System.in.readAllBytes()).trim();
    Object result = runSnipsSnippet(input);

    if (result != null) {
      System.out.print(result);
    }
  }
}
`;
}

function buildCsharpSourceCode(request: ExecutionRequest) {
  const methodMatch = request.code.match(
    /^\s*(?:public|private|protected|internal)?\s*(static\s+)?[\w<>\[\]?]+\s+([A-Za-z_]\w*)\s*\(/m,
  );

  if (methodMatch && !/\bclass\s+\w+/.test(request.code)) {
    const isStatic = Boolean(methodMatch[1]);
    const methodName = methodMatch[2];
    const invocation = isStatic
      ? `${methodName}(input)`
      : `new Program().${methodName}(input)`;

    return `
using System;

public class Program {
${indentCode(request.code, 2)}

  public static void Main() {
    string input = Console.In.ReadToEnd().Trim();
    object result = ${invocation};

    if (result != null) {
      Console.Write(result);
    }
  }
}
`;
  }

  return `
using System;

public class Program {
  static object RunSnipsSnippet(string input) {
${indentCode(request.code, 4)}
  }

  public static void Main() {
    string input = Console.In.ReadToEnd().Trim();
    object result = RunSnipsSnippet(input);

    if (result != null) {
      Console.Write(result);
    }
  }
}
`;
}

function buildCppSourceCode(request: ExecutionRequest) {
  const functionName = request.code.match(
    /^\s*(?:[\w:<>,*&]+\s+)+([A-Za-z_]\w*)\s*\(/m,
  )?.[1];

  if (functionName) {
    return `
#include <bits/stdc++.h>
using namespace std;

${request.code}

int main() {
  ostringstream buffer;
  buffer << cin.rdbuf();
  string input = buffer.str();
  input.erase(input.find_last_not_of("\\r\\n") + 1);
  cout << ${functionName}(input);
  return 0;
}
`;
  }

  return `
#include <bits/stdc++.h>
using namespace std;

auto runSnipsSnippet(const string& input) {
${indentCode(request.code, 2)}
}

int main() {
  ostringstream buffer;
  buffer << cin.rdbuf();
  string input = buffer.str();
  input.erase(input.find_last_not_of("\\r\\n") + 1);
  auto result = runSnipsSnippet(input);
  cout << result;
  return 0;
}
`;
}

function buildGoSourceCode(request: ExecutionRequest) {
  const functionName = request.code.match(/^\s*func\s+([A-Za-z_]\w*)\s*\(/m)
    ?.[1];

  if (functionName) {
    return `
package main

import (
  "fmt"
  "io/ioutil"
  "os"
  "strings"
)

${request.code}

func main() {
  bytes, _ := ioutil.ReadAll(os.Stdin)
  input := strings.TrimSpace(string(bytes))
  result := ${functionName}(input)
  fmt.Print(result)
}
`;
  }

  return `
package main

import (
  "encoding/json"
  "fmt"
  "io/ioutil"
  "os"
  "strings"
)

func runSnipsSnippet(input string) interface{} {
${indentCode(request.code, 2)}
}

func main() {
  bytes, _ := ioutil.ReadAll(os.Stdin)
  input := strings.TrimSpace(string(bytes))
  result := runSnipsSnippet(input)

  switch value := result.(type) {
  case nil:
    return
  case string:
    fmt.Print(value)
  default:
    encoded, _ := json.Marshal(value)
    fmt.Print(string(encoded))
  }
}
`;
}

function buildRustSourceCode(request: ExecutionRequest) {
  const functionName = request.code.match(/^\s*fn\s+([A-Za-z_]\w*)\s*\(/m)
    ?.[1];

  if (functionName) {
    return `
use std::io::{self, Read};

${request.code}

fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
    let input = input.trim().to_string();
    let result = ${functionName}(input);
    println!("{}", result);
}
`;
  }

  return `
use std::io::{self, Read};

fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
    let input = input.trim().to_string();
    let result = (|| {
${indentCode(request.code, 8)}
    })();
    println!("{:?}", result);
}
`;
}

function buildRubySourceCode(request: ExecutionRequest) {
  const functionName = request.code.match(/^\s*def\s+([A-Za-z_]\w*[!?=]?)\s*/m)
    ?.[1];

  if (functionName) {
    return `
require "json"

raw_input = STDIN.read

begin
  input = JSON.parse(raw_input)
rescue JSON::ParserError
  input = raw_input
end

${request.code}

result = input.is_a?(Array) ? send(:${functionName}, *input) : send(:${functionName}, input)

if !result.nil?
  if result.is_a?(Array) || result.is_a?(Hash)
    puts JSON.generate(result)
  else
    puts result
  end
end
`;
  }

  return `
require "json"

raw_input = STDIN.read

begin
  input = JSON.parse(raw_input)
rescue JSON::ParserError
  input = raw_input
end

def run_snips_snippet(input)
${indentCode(request.code, 2)}
end

result = run_snips_snippet(input)

if !result.nil?
  if result.is_a?(Array) || result.is_a?(Hash)
    puts JSON.generate(result)
  else
    puts result
  end
end
`;
}

function buildPhpSourceCode(request: ExecutionRequest) {
  const code = request.code.replace(/^<\?php\s*/, "").replace(/\?>\s*$/, "");
  const functionName = code.match(/^\s*function\s+([A-Za-z_]\w*)\s*\(/m)?.[1];

  if (functionName) {
    return `
<?php
$rawInput = stream_get_contents(STDIN);
$decodedInput = json_decode($rawInput, true);
$input = json_last_error() === JSON_ERROR_NONE ? $decodedInput : $rawInput;

${code}

$result = is_array($input) ? ${functionName}(...$input) : ${functionName}($input);

if ($result !== null) {
  if (is_array($result) || is_object($result)) {
    echo json_encode($result);
  } else {
    echo $result;
  }
}
`;
  }

  return `
<?php
$rawInput = stream_get_contents(STDIN);
$decodedInput = json_decode($rawInput, true);
$input = json_last_error() === JSON_ERROR_NONE ? $decodedInput : $rawInput;

function runSnipsSnippet($input) {
${indentCode(code, 2)}
}

$result = runSnipsSnippet($input);

if ($result !== null) {
  if (is_array($result) || is_object($result)) {
    echo json_encode($result);
  } else {
    echo $result;
  }
}
`;
}

function buildSwiftSourceCode(request: ExecutionRequest) {
  const functionMatch = request.code.match(
    /^\s*func\s+([A-Za-z_]\w*)\s*\(\s*([A-Za-z_]\w*|_)?/m,
  );

  if (functionMatch) {
    const functionName = functionMatch[1];
    const firstLabel = functionMatch[2];
    const invocation =
      firstLabel && firstLabel !== "_"
        ? `${functionName}(${firstLabel}: input)`
        : `${functionName}(input)`;

    return `
import Foundation

let inputData = FileHandle.standardInput.readDataToEndOfFile()
let input = String(data: inputData, encoding: .utf8)!.trimmingCharacters(in: .whitespacesAndNewlines)

${request.code}

print(${invocation})
`;
  }

  return `
import Foundation

let inputData = FileHandle.standardInput.readDataToEndOfFile()
let input = String(data: inputData, encoding: .utf8)!.trimmingCharacters(in: .whitespacesAndNewlines)

func runSnipsSnippet(_ input: String) -> Any {
${indentCode(request.code, 2)}
}

print(runSnipsSnippet(input))
`;
}

function buildKotlinSourceCode(request: ExecutionRequest) {
  const functionName = request.code.match(/^\s*fun\s+([A-Za-z_]\w*)\s*\(/m)
    ?.[1];

  if (functionName) {
    return `
${request.code}

fun main() {
  val input = generateSequence(::readLine).joinToString("\\n").trim()
  val result = ${functionName}(input)

  if (result != null) {
    print(result)
  }
}
`;
  }

  return `
fun runSnipsSnippet(input: String): Any? {
${indentCode(request.code, 2)}
}

fun main() {
  val input = generateSequence(::readLine).joinToString("\\n").trim()
  val result = runSnipsSnippet(input)

  if (result != null) {
    print(result)
  }
}
`;
}

function buildSourceCode(request: ExecutionRequest) {
  if (!shouldWrapReturnValue(request)) {
    return request.code;
  }

  switch (request.language) {
    case "javascript":
    case "typescript":
      return buildJavaScriptSourceCode(request);
    case "python":
      return buildPythonSourceCode(request);
    case "java":
      return buildJavaSourceCode(request);
    case "csharp":
      return buildCsharpSourceCode(request);
    case "cpp":
      return buildCppSourceCode(request);
    case "go":
      return buildGoSourceCode(request);
    case "rust":
      return buildRustSourceCode(request);
    case "ruby":
      return buildRubySourceCode(request);
    case "php":
      return buildPhpSourceCode(request);
    case "swift":
      return buildSwiftSourceCode(request);
    case "kotlin":
      return buildKotlinSourceCode(request);
    default:
      return request.code;
  }
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
        const judge0StatusId = submission.status?.id;
        const hasExecutionError =
          Boolean(submission.stderr) ||
          (judge0StatusId !== undefined && judge0StatusId !== 3);

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
