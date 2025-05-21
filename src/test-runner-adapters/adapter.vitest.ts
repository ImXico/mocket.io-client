import { TestRunnerAdapter } from "./adapter";

/**
 * Creates a Vitest adapter for mocking.
 * @returns {TestRunnerAdapter} An object with a mock method for mocking objects.
 */
export const createVitestAdapter = (): TestRunnerAdapter => {
  const { vi } = require("vitest");
  return {
    mock: <T>(obj: T) => vi.mocked(obj),
  };
};
