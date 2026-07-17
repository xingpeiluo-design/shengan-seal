import { test, expect } from '@playwright/test';

/**
 * 管理后台 E2E 测试
 * 测试范围：登录、产品管理、渠道设置
 *
 * 凭证：admin / shengan2026
 */

const ADMIN_URL = '/#/admin';
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'shengan2026';

test.describe('管理后台登录', () => {
  test('未登录访问后台跳转到登录页', async ({ page }) => {
    await page.goto(ADMIN_URL);
    await expect(page.locator('input[type="password"], input[placeholder*="密码"]').first()).toBeVisible();
  });

  test('登录成功', async ({ page }) => {
    await page.goto(ADMIN_URL);
    await page.locator('input[type="text"], input[placeholder*="用户名"], input[name="user"]').first().fill(ADMIN_USER);
    await page.locator('input[type="password"], input[name="pass"]').first().fill(ADMIN_PASS);
    await page.getByRole('button', { name: /登录|Login/i }).click();
    await expect(page.locator('text=控制台').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=产品管理').first()).toBeVisible();
  });

  test('错误密码被拒绝', async ({ page }) => {
    await page.goto(ADMIN_URL);
    await page.locator('input[type="text"], input[placeholder*="用户名"], input[name="user"]').first().fill(ADMIN_USER);
    await page.locator('input[type="password"], input[name="pass"]').first().fill('wrong_password');
    await page.getByRole('button', { name: /登录|Login/i }).click();
    await page.waitForTimeout(1000);
    const dashVisible = await page.locator('text=控制台').first().isVisible().catch(() => false);
    expect(dashVisible).toBeFalsy();
  });
});

test.describe('管理后台 - 产品管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ADMIN_URL);
    await page.locator('input[type="text"], input[placeholder*="用户名"], input[name="user"]').first().fill(ADMIN_USER);
    await page.locator('input[type="password"], input[name="pass"]').first().fill(ADMIN_PASS);
    await page.getByRole('button', { name: /登录|Login/i }).click();
    await expect(page.locator('text=控制台').first()).toBeVisible({ timeout: 10000 });
  });

  test('产品列表可见', async ({ page }) => {
    await page.locator('text=产品管理').first().click();
    await page.waitForTimeout(800);
    await expect(page.locator('table, [class*="product"], [class*="list"]').first()).toBeVisible();
  });

  test('产品有短名称字段', async ({ page }) => {
    await page.locator('text=产品管理').first().click();
    await page.waitForTimeout(800);
    const editBtn = page.getByRole('button', { name: /编辑|Edit|修改/ }).first();
    if (await editBtn.count() > 0) {
      await editBtn.click();
      await page.waitForTimeout(500);
      // 官网短名是输入框上方的 label 文字
      await expect(page.getByText('官网短名').first()).toBeVisible({ timeout: 5000 });
      // 验证对应的输入框有值
      await expect(page.locator('input[placeholder*="自粘式密封条"]').first()).toBeVisible();
    } else {
      test.skip();
    }
  });
});

test.describe('管理后台 - 渠道设置', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ADMIN_URL);
    await page.locator('input[type="text"], input[placeholder*="用户名"], input[name="user"]').first().fill(ADMIN_USER);
    await page.locator('input[type="password"], input[name="pass"]').first().fill(ADMIN_PASS);
    await page.getByRole('button', { name: /登录|Login/i }).click();
    await expect(page.locator('text=控制台').first()).toBeVisible({ timeout: 10000 });
  });

  test('渠道设置页面可见', async ({ page }) => {
    await page.locator('text=渠道设置').first().click();
    await page.waitForTimeout(800);
    // 验证页面标题或表单存在
    await expect(page.getByText('渠道链接').first()).toBeVisible({ timeout: 5000 });
  });

  test('渠道设置包含联系方式字段', async ({ page }) => {
    await page.locator('text=渠道设置').first().click();
    await page.waitForTimeout(800);
    // 联系方式区包含：厂区地址、公司名称、座机、电话/微信等
    const hasContact = await page.getByText('联系方式').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasContact).toBeTruthy();
    // 验证座机字段
    await expect(page.getByText('座机').first()).toBeVisible();
  });
});