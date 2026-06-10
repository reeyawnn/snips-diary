import type { ExecutionService } from "@/lib/execution/types";

export const mockExecutionService: ExecutionService = {
  async runTests({ testCases }) {
    return testCases.map((testCase, index) => {
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
  },
};
