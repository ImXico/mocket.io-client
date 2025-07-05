import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./examples/vitest.setup.ts"],
    include: ["**/*.test.ts"],
    environment: "node",
  },
});
