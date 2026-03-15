import { defineConfig } from '@playwright/test';
import path from 'path';

/**
 * Playwright configuration for Pixel Bounce gameplay testing.
 *
 * Optimized for:
 * - Canvas-based games (400×600 viewport — Pixel Bounce's canvas size)
 * - Screenshot capture on failure for auto-issue creation
 * - Sequential execution (games often use global state)
 * - JSON reporter for CI/CD integration with create-issues-from-failures.js
 */
export default defineConfig({
  testDir: path.resolve(__dirname, 'tests'),
  testMatch: '**/*.spec.ts',

  // Sequential — games with global state can conflict in parallel
  workers: 1,
  fullyParallel: false,

  // Generous timeout for games with loading screens / asset downloads
  timeout: 60_000,
  expect: { timeout: 10_000 },

  retries: 1,

  use: {
    browserName: 'chromium',
    viewport: { width: 400, height: 600 },

    // Capture evidence on failure for auto-issue creation
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',

    launchOptions: {
      args: ['--disable-gpu-sandbox'],
    },
  },

  outputDir: path.resolve(__dirname, 'test-results'),

  reporter: [
    ['list'],
    ['json', { outputFile: path.resolve(__dirname, 'test-results.json') }],
  ],

  projects: [
    {
      name: 'gameplay-chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
