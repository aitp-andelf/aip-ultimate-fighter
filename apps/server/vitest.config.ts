/// <reference types="vitest" />
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    env: {
      PM2_SILENT: "true",
      KEYMETRICS_DISABLED: "1",
    },
    setupFiles: ["./src/test-setup.ts"],
  },
});
