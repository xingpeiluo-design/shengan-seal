import { test, expect } from '@playwright/test';

/**
 * 官网首页 E2E 测试
 * 测试范围：页面加载、导航、联系方式、Hero 区域
 */
test.describe('官网首页', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('页面正常加载', async ({ page }) => {
    // 验证页面标题
    await expect(page).toHaveTitle(/盛安密封|盛安/);
    // 验证 body 可见
    await expect(page.locator('body')).toBeVisible();
  });

  test('顶部横幅显示联系方式', async ({ page }) => {
    // 验证电话号码存在
    await expect(page.locator('text=13507402179')).toBeVisible();
    // 验证座机号码存在
    await expect(page.locator('text=0731-86869145')).toBeVisible();
  });

  test('导航栏完整显示', async ({ page }) => {
    // 验证主要导航项
    const navItems = ['首页', '产品中心', '关于我们'];
    for (const item of navItems) {
      await expect(page.getByText(item, { exact: false }).first()).toBeVisible();
    }
  });

  test('Hero 区域渲染正常', async ({ page }) => {
    // 验证 Hero 区域存在（轮播图）
    const hero = page.locator('[class*="carousel"], [class*="banner"], section').first();
    await expect(hero).toBeVisible();
  });

  test('产品卡片区域可见', async ({ page }) => {
    // 滚动到产品区域
    await page.getByText('产品中心').first().scrollIntoViewIfNeeded();
    // 验证产品区域可见
    const productSection = page.locator('text=产品中心').first();
    await expect(productSection).toBeVisible();
  });

  test('底部联系信息完整', async ({ page }) => {
    // 滚动到底部
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    // 验证底部联系信息
    await expect(page.locator('text=13507402179').last()).toBeVisible();
  });

  test('管理后台入口不可见（安全）', async ({ page }) => {
    // 管理后台链接应该是隐藏的（opacity-0 或不可见）
    const adminLink = page.locator('a[href*="admin"]');
    // 如果存在，应该是不可见的（opacity-0 + 3x3px）
    if (await adminLink.count() > 0) {
      const box = await adminLink.first().boundingBox();
      if (box) {
        // 热区应该很小（3x3px）
        expect(box.width).toBeLessThanOrEqual(10);
        expect(box.height).toBeLessThanOrEqual(10);
      }
    }
  });
});
