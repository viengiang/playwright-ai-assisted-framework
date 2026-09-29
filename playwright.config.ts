import { defineConfig, devices } from '@playwright/test';
import { env } from './src/config/env';

export default defineConfig({
  testDir: './tests',
  globalSetup: './src/config/global-setup.ts',
  fullyParallel: true,
  // ParaBank is not safe for concurrent use: overlapping writes collide on ids and sign-up
  // state leaks between sessions (docs/KNOWN-ISSUES.md). One worker per ParaBank instance;
  // CI scales out with shards, each with its own Docker instance.
  workers: 1,
  forbidOnly: env.isCI,
  retries: env.isCI ? 2 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // Sharded CI jobs write blob reports that a later job merges into a single HTML report.
  reporter: env.isCI ? [['blob'], ['github'], ['list']] : [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: env.appUrl,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'api', testDir: './tests/api' },
    { name: 'chromium', testDir: './tests/ui', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', testDir: './tests/ui', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', testDir: './tests/ui', use: { ...devices['Desktop Safari'] } },
    {
      // ParaBank is not responsive; the mobile run is a smoke check that critical flows still work.
      name: 'mobile-chrome',
      testDir: './tests/ui',
      grep: /@smoke/,
      use: { ...devices['Pixel 7'] },
    },
  ],
});
