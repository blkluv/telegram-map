import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  // Use a non-interactive reporter so `playwright test` exits cleanly in all environments
  reporter: 'list',
  use: {
    // Use a dedicated port for Playwright's preview server to avoid clashing
    // with any dev/preview servers you may already be running.
    baseURL: 'http://localhost:4322',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // Build a dedicated test variant of the site that uses test config/content,
    // then serve it via preview for a stable, production-like environment.
    // We bind preview to port 4322 to avoid conflicts with any existing servers.
    command: 'pnpm run build:test && pnpm astro preview --port=4322',
    url: 'http://localhost:4322',
    // Always start a fresh preview server for tests so we don't accidentally
    // reuse a previous build that was created with different env/config.
    reuseExistingServer: false,
    timeout: 240000,
  },
});
