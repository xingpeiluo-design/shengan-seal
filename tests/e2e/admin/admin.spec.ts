import { test, expect } from '@playwright/test';

/**
 * 管理后台 E2E 测试
 * 测试范围：登录、产品管理、设置管理
 * 
 * 凭证：admin / shengan2026
 */

const ADMIN_URL = '/#/admin';
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'shengan2026';

test.describe('管理后台登录', () => {
  test('未登录访问后台跳转到登录页', async ({ page }) => {
    await page.goto(ADMIN_URL);
    // 应该显示登录表单
    await expect(page.locator('input[type="password"], input[placeholder*="密码"]').first()).toBeVisible();
  });

  test('登录成功', async ({ page }) => {
    await page.goto(ADMIN_URL);
    
    // 填写登录表单（字段名：user / pass）
    await page.locator('input[type="text"], input[placeholder*="用户名"], input[name="user"]').first().fill(ADMIN_USER);
    await page.locator('input[type="password"], input[name="pass"]').first().fill(ADMIN_PASS);
    
    // 点击登录按钮
    await page.getByRole('button', { name: /登录|Login/i }).click();
    
    // 验证登录成功（进入后台界面）
    await expect(page.locator('text=产品管理, text=网站设置, [class*="admin"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('错误密码被拒绝', async ({ page }) => {
    await page.goto(ADMIN_URL);
    
    await page.locator('input[type="text"], input[placeholder*="用户名"], input[name="user"]').first().fill(ADMIN_USER);
    await page.locator('input[type="password"], input[name="pass"]').first().fill('wrong_password');
    await page.getByRole('button', { name: /登录|Login/i }).click();
    
    // 应该显示错误提示或留在登录页
    await expect(page.locator('text=错误, text=失败, text=不正确, .error, [class*="error"]').first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('管理后台 - 产品管理', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto(ADMIN_URL);
    await page.locator('input[type="text"], input[placeholder*="用户名"], input[name="user"]').first().fill(ADMIN_USER);
    await page.locator('input[type="password"], input[name="pass"]').first().fill(ADMIN_PASS);
    await page.getByRole('button', { name: /登录|Login/i }).click();
    await page.waitForLoadState('networkidle');
  });

  test('产品列表可见', async ({ page }) => {
    // 导航到产品管理
    await page.getByText('产品管理').click();
    await page.waitForLoadState('networkidle');
    
    // 验证产品列表存在
    await expect(page.locator('table, [class*="product"], [class*="list"]').first()).toBeVisible();
  });

  test('产品有短名称字段', async ({ page }) => {
    // 导航到产品管理
    await page.getByText('产品管理').click();
    await page.waitForLoadState('networkidle');
    
    // 点击编辑第一个产品
    const editBtn = page.getByRole('button', { name: /编辑|Edit/i }).first();
    if (await editBtn.count() > 0) {
      await editBtn.click();
      // 验证短名称字段存在
      await expect(page.locator('text=官网短名, input[name="short_name"]').first()).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('管理后台 - 网站设置', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto(ADMIN_URL);
    await page.locator('input[type="text"], input[placeholder*="用户名"], input[name="user"]').first().fill(ADMIN_USER);
    await page.locator('input[type="password"], input[name="pass"]').first().fill(ADMIN_PASS);
    await page.getByRole('button', { name: /登录|Login/i }).click();
    await page.waitForLoadState('networkidle');
  });

  test('设置页面可见', async ({ page }) => {
    // 导航到设置
    await page.getByText('网站设置').click();
    await page.waitForLoadState('networkidle');
    
    // 验证设置页面存在
    await expect(page.locator('[class*="setting"], form, [class*="settings"]').first()).toBeVisible();
  });

  test('联系方式设置包含正确字段', async ({ page }) => {
    // 导航到设置
    await page.getByText('网站设置').click();
    await page.waitForLoadState('networkidle');
    
    // 验证联系方式字段存在
    await expect(page.locator('text=电话/微信, text=热线, text=座机').first()).toBeVisible();
  });
});
