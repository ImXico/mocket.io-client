import { coverageConfigDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ["src/vitest/vitest.attach-mocket-io-client.ts"],
    coverage: {
      exclude: [
        ...coverageConfigDefaults.exclude, // See https://github.com/vitest-dev/vitest/issues/5101
        "src/**/*.css.ts", // Exclude css files
        "src/**/*.d.ts", // Exclude TypeScript declaration files
      ],
    },
  },
});
