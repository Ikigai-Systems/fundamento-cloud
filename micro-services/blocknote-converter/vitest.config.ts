import {defineConfig} from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],

    // Reporter configuration - shows individual test names as they run
    reporters: ["default"],

    // Show full error diffs
    outputDiffLines: 10,

    // Mark tests as slow if they take longer than this (in ms)
    slowTestThreshold: 1000,

    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.d.ts",
        "src/**/*.test.ts",
        "src/**/*.spec.ts",
      ],
    },
  },
});
