import { createJestAdapter } from "./adapter.jest";
import { createVitestAdapter } from "./adapter.vitest";

/**
 * TestRunnerAdapter is an interface that defines a method for mocking objects.
 * It is used to create adapters for different test runners like Jest and Vitest.
 */
export interface TestRunnerAdapter {
  mock: <T>(obj: T) => {
    mockImplementation: (fn: () => any) => void;
  };
}

/**
 * Detects the test runner being used (Jest or Vitest) and returns the corresponding adapter.
 * @throws {Error} If no supported test runner is detected.
 * @returns {TestRunnerAdapter} The adapter for the detected test runner.
 * @example
 * const testRunnerAdapter = detectTestRunner();
 * const mockedObject = testRunnerAdapter.mock(myObject);
 * mockedObject.mockImplementation(() => {  << mocked implementation >>  });
 */
export const resolveTestRunner = (): TestRunnerAdapter => {
  try {
    // Can be detected with require("vitest") because Vitest is typically
    // installed as a package in your project that exports specific functions.
    // When Vitest is imported, one is  accessing the package API directly.
    require("vitest");
    return createVitestAdapter();
  } catch (e) {
    try {
      // Jest often injects itself into the global scope when running tests rather than being explicitly imported.
      // The jest module might not be directly importable in one's test environment, as Jest is usually set up as
      // part of the test runner configuration rather than being imported in code. Checking for `globalThis.jest`
      // is more reliable because when Jest runs, it adds itself to the global object so that test files can access it.
      if (typeof (globalThis as any).jest !== "undefined") {
        return createJestAdapter();
      }
    } catch (e) {
      // Fall through
    }
    throw new Error("No supported testing framework (Vitest or Jest) detected");
  }
};
