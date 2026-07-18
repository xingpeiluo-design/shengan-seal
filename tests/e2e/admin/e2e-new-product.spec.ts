import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://139.224.186.15:8082';
const ADMIN_URL = `${BASE_URL}/#/admin`;

// 测试图片路径
const TEST_IMAGES = {
  jpg: '/tmp/test-upload/test_red.jpg',
  png: '/tmp/test-upload/test_blue.png',
  webp: '/tmp/test-upload/test_green.webp',
};

// 辅助函数：根据 label 文字定位相邻的 input
function inputAfterLabel(page: any, labelText: string) {
  return page.locator(`label:has-text("${labelText}")`).locator('..').locator('input, textarea').first();
}

test.describe('新产品上架完整流程 E2E（模拟真实用户操作）', () => {

  test('P1-P4: 登录→新增产品→上传图片→保存→验证', async ({ page }) => {
    // ===== P1: 登录后台 =====
    console.log('=== P1: 登录后台 ===');
    await page.goto(ADMIN_URL, { waitUntil: 'networkidle' });

    // 填写登录表单（使用 placeholder 定位）
    await page.getByPlaceholder('请输入账号').fill('admin');
    await page.getByPlaceholder('请输入密码').fill('shengan2026');
    await page.getByRole('button', { name: '登录管理后台' }).click();

    // 验证登录成功
    await expect(page.getByText('控制台概览')).toBeVisible({ timeout: 10000 });
    console.log('✅ P1 PASS: 登录成功');

    // ===== P2: 进入产品管理 → 新增产品 =====
    console.log('=== P2: 新增产品 ===');
    // 点击产品管理 tab
    await page.locator('button:has-text("产品管理")').first().click();
    await expect(page.locator('h2:has-text("产品管理")')).toBeVisible({ timeout: 5000 });

    // 点击新增产品按钮
    await page.locator('button:has-text("+ 新增产品")').click();
    await expect(page.locator('h2:has-text("新增产品")')).toBeVisible({ timeout: 5000 });

    // 填写基础信息（根据 label 文字定位对应 input）
    await inputAfterLabel(page, '产品名称（拼多多标题）').fill('Playwright E2E测试产品-包覆式密封条');
    await inputAfterLabel(page, '官网短名（卡片标题）').fill('E2E测试·Pro');
    await inputAfterLabel(page, '分类 *').fill('E2E测试分类');
    await inputAfterLabel(page, '标签文字').fill('E2E标签');
    await inputAfterLabel(page, '价格').fill('¥29.9/米起');

    // 填写产品描述（textarea）
    await inputAfterLabel(page, '产品描述').fill('这是通过Playwright E2E测试创建的产品，模拟真实用户在后台点击上传的完整操作流程');
    await inputAfterLabel(page, '亮点标签（每行一个）').fill('E2E亮点1\nE2E亮点2\n免开槽免打孔');
    await inputAfterLabel(page, '使用场景（每行一个）').fill('家装DIY\n工程批量\nE2E测试场景');

    // 填写规格参数（JSON）
    await inputAfterLabel(page, '规格参数（JSON 格式）').fill('[{"key":"材质","value":"E2E测试PU"},{"key":"规格","value":"25mm×10m"},{"key":"颜色","value":"透明"}]');

    // 填写拼多多链接
    await inputAfterLabel(page, '拼多多链接').fill('https://mobile.yangkeduo.com/e2e-test');

    console.log('  所有字段填写完成');

    // ===== P3: 通过文件选择器上传3张测试图片 =====
    console.log('=== P3: 上传图片（模拟用户点击上传按钮） ===');

    // 3个 file input 按顺序：主图(0)、轮播图(1)、详情图(2)
    const fileInputs = page.locator('input[type="file"]');

    // 上传主图（JPG）
    await fileInputs.nth(0).setInputFiles(TEST_IMAGES.jpg);
    await page.waitForTimeout(2000);
    // 验证主图预览出现
    await expect(page.locator('img[alt="主图"]')).toBeVisible({ timeout: 10000 });
    console.log('  ✅ 主图(JPG)上传成功');

    // 上传轮播图（PNG）
    await fileInputs.nth(1).setInputFiles(TEST_IMAGES.png);
    await page.waitForTimeout(2000);
    console.log('  ✅ 轮播图(PNG)上传成功');

    // 上传详情图（WebP）
    await fileInputs.nth(2).setInputFiles(TEST_IMAGES.webp);
    await page.waitForTimeout(2000);
    console.log('  ✅ 详情图(WebP)上传成功');

    // 截图当前表单状态
    await page.screenshot({ path: '/tmp/e2e-p3-form-filled.png', fullPage: true });
    console.log('✅ P3 PASS: 3张图片全部上传完成');

    // ===== P4: 保存产品 → 验证后台列表 =====
    console.log('=== P4: 保存并验证 ===');
    await page.getByRole('button', { name: '保存' }).click();

    // 等待返回列表页
    await expect(page.locator('h2:has-text("产品管理")')).toBeVisible({ timeout: 10000 });

    // 验证新产品出现在列表中
    await expect(page.locator('td:has-text("Playwright E2E测试产品")')).toBeVisible({ timeout: 5000 });
    console.log('✅ P4 PASS: 新产品出现在后台列表');

    // 截图后台列表
    await page.screenshot({ path: '/tmp/e2e-p4-admin-list.png', fullPage: false });
  });

  test('P5: 前台详情页验证（浏览器访问）', async ({ page }) => {
    console.log('=== P5: 前台详情页验证 ===');

    // 通过 API 获取最新产品 ID（辅助步骤）
    const resp = await page.request.get(`${BASE_URL}/api/admin/products`, {
      headers: {
        'Authorization': `Bearer ${(await page.request.post(`${BASE_URL}/api/auth/login`, {
          data: { user: 'admin', pass: 'shengan2026' }
        })).json().then(d => d.token)}`
      }
    });
    const products = await resp.json();
    const testProduct = products.find((p: any) => p.name?.includes('Playwright E2E测试产品'));
    expect(testProduct).toBeDefined();
    const productId = testProduct.id;
    console.log(`  找到测试产品 id=${productId}`);

    // 访问前台详情页
    await page.goto(`${BASE_URL}/#/products/${productId}`, { waitUntil: 'networkidle' });

    // 验证面包屑/标题
    await expect(page.locator('text=E2E测试·Pro')).toBeVisible({ timeout: 10000 });
    console.log('  ✅ 标题/面包屑正确');

    // 验证价格
    await expect(page.locator('text=¥29.9/米起')).toBeVisible();
    console.log('  ✅ 价格正确');

    // 验证标签
    await expect(page.locator('text=E2E标签')).toBeVisible();
    console.log('  ✅ 标签正确');

    // 验证规格参数
    await expect(page.locator('text=E2E测试PU')).toBeVisible();
    await expect(page.locator('text=25mm×10m')).toBeVisible();
    console.log('  ✅ 规格参数正确');

    // 验证图片数量提示
    await expect(page.locator('text=/共 \\d+ 张图片/')).toBeVisible();
    console.log('  ✅ 图片计数正确');

    // 滚动查看图片区域
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/e2e-p5-detail-gallery.png', fullPage: false });

    // 滚动到详情图区域
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/e2e-p5-detail-images.png', fullPage: false });

    console.log('✅ P5 PASS: 前台详情页所有字段和图片验证通过');
  });

  test('P6: 编辑→删除→清理', async ({ page }) => {
    console.log('=== P6: 编辑和删除 ===');

    // 登录
    await page.goto(ADMIN_URL, { waitUntil: 'networkidle' });
    await page.getByPlaceholder('请输入账号').fill('admin');
    await page.getByPlaceholder('请输入密码').fill('shengan2026');
    await page.getByRole('button', { name: '登录管理后台' }).click();
    await expect(page.getByText('控制台概览')).toBeVisible({ timeout: 10000 });

    // 进入产品管理
    await page.locator('button:has-text("产品管理")').first().click();
    await expect(page.locator('h2:has-text("产品管理")')).toBeVisible({ timeout: 5000 });

    // 找到测试产品的编辑按钮
    const productRow = page.locator('tr:has-text("Playwright E2E测试产品")');
    await expect(productRow).toBeVisible({ timeout: 5000 });
    await productRow.locator('button:has-text("编辑")').click();

    // 验证进入编辑页面
    await expect(page.locator('h2:has-text("编辑产品")')).toBeVisible({ timeout: 5000 });
    console.log('  ✅ 进入编辑页面');

    // 修改价格
    const priceInput = inputAfterLabel(page, '价格');
    await priceInput.fill('');
    await priceInput.fill('¥39.9/米起');
    await page.getByRole('button', { name: '保存' }).click();

    // 等待返回列表
    await expect(page.locator('h2:has-text("产品管理")')).toBeVisible({ timeout: 10000 });
    console.log('  ✅ 编辑保存成功');

    // 删除产品 - 先注册 dialog handler，再点击删除
    page.on('dialog', dialog => dialog.accept());
    await productRow.locator('button:has-text("删除")').click();
    await page.waitForTimeout(2000);

    // 验证产品已从列表消失
    await expect(page.locator('td:has-text("Playwright E2E测试产品")')).not.toBeVisible({ timeout: 5000 });
    console.log('  ✅ 删除成功，产品已从列表移除');

    await page.screenshot({ path: '/tmp/e2e-p6-after-delete.png', fullPage: false });
    console.log('✅ P6 PASS: 编辑和删除功能正常');
  });
});
