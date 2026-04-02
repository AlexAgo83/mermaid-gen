import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/tests/setup.ts"],
    include: ["src/tests/**/*.spec.ts", "src/tests/**/*.spec.tsx"],
    exclude: ["tests/e2e/**"],
  },
});
