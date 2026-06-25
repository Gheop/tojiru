import { defineConfig } from '@playwright/test'

export default defineConfig({
  globalSetup: './test/e2e/global-setup.ts',
  testDir: 'test/e2e',
  use: { baseURL: 'http://127.0.0.1:4173' },
  webServer: {
    command: 'npx tsx test/e2e/make-bundle.ts test-output/bundle && npx http-server test-output/bundle -p 4173 -c-1 --silent',
    url: 'http://127.0.0.1:4173/manifest.json',
    reuseExistingServer: true,
  },
})
