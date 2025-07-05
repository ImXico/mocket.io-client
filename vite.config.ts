import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [dts({ rollupTypes: true })],
  build: {
    lib: {
      entry: {
        "vitest-setup": resolve(__dirname, "./src/vitest/vitest-setup.ts"),
        "vitest-context": resolve(__dirname, "./src/vitest/vitest-context.ts"),
      },
      name: "mocket.io-client",
      fileName: (format, name) => {
        return format === "es" ? `${name}.js` : `${name}.cjs`;
      },
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: ["socket.io-client", "vitest"],
    },
  },
});
