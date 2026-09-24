import { defineConfig } from "vite";
import { resolve } from "node:path";

// Builds one self-contained ES module (fonts inlined) into the integration,
// because HACS installs the repository as-is without running a Node build.
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/panel.ts"),
      formats: ["es"],
      fileName: () => "cyd-studio-panel.js",
    },
    outDir: resolve(__dirname, "../custom_components/cyd_studio/frontend/dist"),
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    target: "es2022",
    minify: true,
    sourcemap: false,
  },
  server: {
    // dev harness (dev/) reads the integration's data files and golden projects
    fs: { allow: [resolve(__dirname, "..")] },
  },
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
