import { defineConfig, devices } from '@playwright/test';

const ejecutable = process.env.PLAYWRIGHT_CHROMIUM ?? (process.env.CI ? undefined : '/opt/pw-browsers/chromium');

export default defineConfig({
  testDir: './e2e',
  timeout: 240_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  outputDir: 'test-results',
  use: {
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...(ejecutable ? { launchOptions: { executablePath: ejecutable } } : {}),
  },
  projects: [
    { name: 'celular', use: { ...devices['Pixel 7'], browserName: 'chromium' } },
    { name: 'computador', use: { viewport: { width: 1366, height: 820 }, browserName: 'chromium' } },
  ],
});
