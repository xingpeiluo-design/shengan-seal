import { defineConfig, devices } from '@playwright/test';

/**
 * 盛安密封官网 E2E 测试配置
 * 可复用于其他网站项目，修改 BASE_URL 即可
 */
const BASE_URL = process.env.BASE_URL || 'https://maichewei.com/shengan';

export default defineConfig({
  testDir: './tests/e2e',
  /* 默认单串行执行，避免后端被压垮；UI 调试模式可用 --workers=2 加快 */
  fullyParallel: false,
  /* CI 环境禁止 test.only */
  forbidOnly: !!process.env.CI,
  /* 失败重试 2 次 */
  retries: process.env.CI ? 2 : 1,
  /* 串行执行 */
  workers: 1,
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
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  /* 全局超时 */
  timeout: 60_000,
  expect: {
    timeout: 15_000,
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
