import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./specs",
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    channel: "chrome",
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    video: "off",
  },
  webServer: [
    {
      command: "pnpm --filter @aipuf/server start",
      port: 2567,
      timeout: 30000,
      reuseExistingServer: !process.env["CI"],
    },
    {
      command: "pnpm --filter @aipuf/web preview",
      port: 5173,
      timeout: 30000,
      reuseExistingServer: !process.env["CI"],
    },
  ],
});
