import { TestRunnerAdapter } from "./adapter";

/**
 * Creates a Jest adapter for mocking.
 * @returns {TestRunnerAdapter} An object with a mock method for mocking objects.
 */
export const createJestAdapter = (): TestRunnerAdapter => {
  return {
    mock: <T>(obj: T) => ({
      mockImplementation: (fn: () => any) => {
        (globalThis as any).jest.mock(obj as any, () => fn());
      },
    }),
  };
};
