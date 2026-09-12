import { defineConfig, devices } from '@playwright/test';

// Smoke config for the public deployment. Separate from the local E2E suite
// (tests/e2e) so local tests never depend on the internet. Run with:
//   SMOKE_BASE_URL=https://kurio-nft-marketplace.vercel.app npx playwright test -c playwright.smoke.config.ts
export default defineConfig({
  testDir: './tests/smoke',
  timeout: 60000,
  fullyParallel: false,
  reporter: [['html', { outputFolder: 'playwright-smoke-report', open: 'never' }], ['list']],
  use: {
    baseURL: process.env.SMOKE_BASE_URL ?? 'https://kurio-nft-marketplace.vercel.app',
  },
  projects: [
    {
      name: 'public-smoke',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
});