import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"],
    // Playwright specs live in e2e/ and must not be collected by Vitest.
    include: ["src/**/*.{test,spec}.{js,jsx}"],
    exclude: ["node_modules/**", "e2e/**", "dist/**"],
    css: false,
    restoreMocks: true,
  },
});
