import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  snapshotPathTemplate: "{testDir}/__snapshots__/{arg}{ext}",
  use: { baseURL: "http://localhost:5199", viewport: { width: 1400, height: 900 } },
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.002 } },
  webServer: { command: "npx vite --port 5199 --strictPort", port: 5199, reuseExistingServer: true },
});
