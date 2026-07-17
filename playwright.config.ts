import { defineConfig, devices } from '@playwright/test';

/**
 * 盛安密封官网 E2E 测试配置
 * 可复用于其他网站项目，修改 BASE_URL 即可
 */
const BASE_URL = process.env.BASE_URL || 'http://139.224.186.15:8082';

export default defineConfig({
  testDir: './tests/e2e',
  /* 并行执行 */
  fullyParallel: true,
  /* CI 环境禁止 test.only */
  forbidOnly: !!process.env.CI,
  /* 失败重试 2 次 */
  retries: process.env.CI ? 2 : 1,
  /* 并发 workers */
  workers: process.env.CI ? 1 : undefined,
  /* 报告器 */
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],
  /* 全局配置 */
  use: {
    baseURL: BASE_URL,
    /* 失败时收集 trace */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    /* 超时 */
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  /* 全局超时 */
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  /* 项目配置 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
