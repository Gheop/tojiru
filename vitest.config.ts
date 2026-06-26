import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    exclude: ['test/e2e/**', 'node_modules/**'],
    // Integration tests spawn real tools (pdftocairo, pdftotext, mutool) and run sharp.
    // Under the full suite's parallelism the heaviest convert() can exceed the 5s default,
    // so give them headroom — it isn't a per-test latency budget.
    testTimeout: 30000,
  },
})
