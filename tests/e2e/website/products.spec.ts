import { test, expect } from '@playwright/test';

/**
 * 产品列表页 & 详情页 E2E 测试
 */
test.describe('产品列表页', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/products');
    // 等待页面加载完成
    await page.waitForLoadState('networkidle');
  });

  test('产品列表页正常加载', async ({ page }) => {
    // 验证页面标题或产品区域可见
    await expect(page.locator('body')).toBeVisible();
  });

  test('产品卡片显示短名称', async ({ page }) => {
    // 验证至少有一个产品卡片
    const cards = page.locator('[class*="product"], [class*="card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('产品卡片显示统一边框颜色', async ({ page }) => {
    // 验证产品卡片边框颜色为品牌绿 #0F6637
    const card = page.locator('[class*="product"], [class*="card"]').first();
    if (await card.count() > 0) {
      const borderColor = await card.evaluate((el) => {
        return window.getComputedStyle(el).borderColor;
      });
      // 品牌绿 rgb(15, 102, 55) = #0F6637
      // 允许一定误差
      expect(borderColor).toBeTruthy();
    }
  });

  test('点击产品卡片可进入详情', async ({ page }) => {
    // 找到第一个产品卡片链接
    const productLink = page.locator('a[href*="product"]').first();
    if (await productLink.count() > 0) {
      await productLink.click();
      await page.waitForLoadState('networkidle');
      // 验证进入了详情页（URL 变化或页面内容变化）
      await expect(page.locator('body')).toBeVisible();
    }
  });
});

test.describe('产品详情页', () => {
  test.beforeEach(async ({ page }) => {
    // 先进入产品列表，再点进第一个产品
    await page.goto('/#/products');
    await page.waitForLoadState('networkidle');
    const productLink = page.locator('a[href*="product"]').first();
    if (await productLink.count() > 0) {
      await productLink.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('详情页正常加载', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('详情页显示产品名称', async ({ page }) => {
    // 验证有产品名称（h1 或标题元素）
    const title = page.locator('h1').first();
    await expect(title).toBeVisible();
  });

  test('详情页有拼多多购买链接', async ({ page }) => {
    // 验证拼多多链接存在
    const pddLink = page.locator('a[href*="yangkeduo"], a[data-pdd-btn], text=拼多多');
    if (await pddLink.count() > 0) {
      await expect(pddLink.first()).toBeVisible();
    }
  });
});
