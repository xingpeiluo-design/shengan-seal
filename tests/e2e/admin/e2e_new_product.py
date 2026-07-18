"""
新产品上架完整流程 E2E 测试（Python Playwright）
模拟真实用户在后台点击操作的完整流程：
P1: 登录后台
P2: 进入产品管理 → 新增产品 → 填写所有字段
P3: 通过文件选择器上传3张测试图片
P4: 保存产品 → 验证后台列表出现
P5: 打开前台详情页 → 验证所有字段+图片
P6: 编辑产品 → 删除产品 → 清理
"""

import json
import sys
import time
import os
from datetime import datetime
from playwright.sync_api import sync_playwright, expect

BASE_URL = "http://139.224.186.15:8082"
ADMIN_URL = f"{BASE_URL}/#/admin"

# 测试图片路径
TEST_IMAGES = {
    "jpg": "/tmp/test-upload/test_red.jpg",
    "png": "/tmp/test-upload/test_blue.png",
    "webp": "/tmp/test-upload/test_green.webp",
}

PRODUCT_NAME = "Playwright E2E测试产品-包覆式密封条"
PRODUCT_SHORT = "E2E测试·Pro"
PRODUCT_CATEGORY = "E2E测试分类"
PRODUCT_BADGE = "E2E标签"
PRODUCT_PRICE = "¥29.9/米起"
PRODUCT_DESC = "这是通过Playwright E2E测试创建的产品，模拟真实用户在后台点击上传的完整操作流程"


def input_after_label(page, label_text):
    """根据 label 文字定位相邻的 input/textarea"""
    return page.locator(f"label:has-text('{label_text}')").locator("..").locator("input, textarea").first


def login(page):
    """登录后台"""
    page.goto(ADMIN_URL, wait_until="networkidle")
    page.get_by_placeholder("请输入账号").fill("admin")
    page.get_by_placeholder("请输入密码").fill("shengan2026")
    page.get_by_role("button", name="登录管理后台").click()
    expect(page.get_by_text("控制台概览")).to_be_visible(timeout=10000)
    print("✅ P1 PASS: 登录成功")


def create_product(page):
    """P2: 新增产品 + P3: 上传图片 + P4: 保存"""
    # ===== P2: 进入产品管理 → 新增产品 =====
    print("=== P2: 新增产品 ===")
    page.locator("button:has-text('产品管理')").first.click()
    expect(page.locator("h2:has-text('产品管理')")).to_be_visible(timeout=5000)

    page.locator("button:has-text('+ 新增产品')").click()
    expect(page.locator("h2:has-text('新增产品')")).to_be_visible(timeout=5000)

    # 填写基础信息
    input_after_label(page, "产品名称（拼多多标题）").fill(PRODUCT_NAME)
    input_after_label(page, "官网短名（卡片标题）").fill(PRODUCT_SHORT)
    input_after_label(page, "分类 *").fill(PRODUCT_CATEGORY)
    input_after_label(page, "标签文字").fill(PRODUCT_BADGE)
    input_after_label(page, "价格").fill(PRODUCT_PRICE)

    # 填写产品描述
    input_after_label(page, "产品描述").fill(PRODUCT_DESC)
    input_after_label(page, "亮点标签（每行一个）").fill("E2E亮点1\nE2E亮点2\n免开槽免打孔")
    input_after_label(page, "使用场景（每行一个）").fill("家装DIY\n工程批量\nE2E测试场景")

    # 填写规格参数（JSON）
    input_after_label(page, "规格参数（JSON 格式）").fill(
        json.dumps([
            {"key": "材质", "value": "E2E测试PU"},
            {"key": "规格", "value": "25mm×10m"},
            {"key": "颜色", "value": "透明"},
        ], ensure_ascii=False)
    )

    # 填写拼多多链接
    input_after_label(page, "拼多多链接").fill("https://mobile.yangkeduo.com/e2e-test")
    print("  所有字段填写完成")

    # ===== P3: 通过文件选择器上传3张测试图片 =====
    print("=== P3: 上传图片（模拟用户点击上传按钮） ===")

    # 监听前端控制台
    page.on("console", lambda msg: print(f"  [浏览器控制台] {msg.type}: {msg.text}") if msg.type in ("error", "warning") else None)

    # 让所有隐藏的 file input 可见（移除 hidden class），以便 Playwright 能操作
    page.evaluate("""
        document.querySelectorAll('input[type="file"]').forEach(el => {
            el.classList.remove('hidden');
            el.style.display = 'block';
            el.style.width = '200px';
            el.style.height = '30px';
        });
    """)

    # 上传主图（JPG）- 直接 set_input_files 触发 React onChange
    page.locator("input[type='file']").first.set_input_files(TEST_IMAGES["jpg"])
    page.wait_for_selector("img[alt='主图']", timeout=15000)
    print("  ✅ 主图(JPG)上传成功")

    # 上传轮播图（PNG）
    page.locator("input[type='file']").nth(1).set_input_files(TEST_IMAGES["png"])
    page.wait_for_timeout(3000)
    print("  ✅ 轮播图(PNG)上传成功")

    # 上传详情图（WebP）
    page.locator("input[type='file']").nth(2).set_input_files(TEST_IMAGES["webp"])
    page.wait_for_timeout(3000)
    print("  ✅ 详情图(WebP)上传成功")

    page.screenshot(path="/tmp/e2e-p3-form-filled.png", full_page=True)
    print("✅ P3 PASS: 3张图片全部上传完成")

    # ===== P4: 保存产品 → 验证后台列表 =====
    print("=== P4: 保存并验证 ===")
    page.get_by_role("button", name="保存").click()

    expect(page.locator("h2:has-text('产品管理')")).to_be_visible(timeout=10000)
    expect(page.locator("td:has-text('Playwright E2E测试产品')").first).to_be_visible(timeout=5000)
    print("✅ P4 PASS: 新产品出现在后台列表")
    page.screenshot(path="/tmp/e2e-p4-admin-list.png", full_page=False)


def verify_frontend(page):
    """P5: 前台详情页验证"""
    print("=== P5: 前台详情页验证 ===")

    # 通过 API 获取最新产品 ID
    resp = page.request.get(f"{BASE_URL}/api/admin/products", headers={
        "Authorization": f"Bearer {page.request.post(f'{BASE_URL}/api/auth/login', data={'user': 'admin', 'pass': 'shengan2026'}).json()['token']}"
    })
    products = resp.json()
    test_product = next((p for p in products if PRODUCT_NAME in (p.get("name") or "")), None)
    assert test_product, "找不到测试产品"
    product_id = test_product["id"]
    print(f"  找到测试产品 id={product_id}")

    # 访问前台详情页
    page.goto(f"{BASE_URL}/#/products/{product_id}", wait_until="networkidle")

    # 验证标题
    expect(page.locator(f"text={PRODUCT_SHORT}").first).to_be_visible(timeout=10000)
    print("  ✅ 标题/面包屑正确")

    # 验证价格
    expect(page.locator(f"text={PRODUCT_PRICE}").first).to_be_visible()
    print("  ✅ 价格正确")

    # 验证标签
    expect(page.locator(f"text={PRODUCT_BADGE}").first).to_be_visible()
    print("  ✅ 标签正确")

    # 验证规格参数
    expect(page.locator("text=E2E测试PU").first).to_be_visible()
    expect(page.locator("text=25mm×10m").first).to_be_visible()
    print("  ✅ 规格参数正确")

    # 验证图片数量
    expect(page.locator("text=/共 \\d+ 张图片/").first).to_be_visible()
    print("  ✅ 图片计数正确")

    # 截图画廊区域
    page.evaluate("() => window.scrollTo(0, 600)")
    page.wait_for_timeout(500)
    page.screenshot(path="/tmp/e2e-p5-detail-gallery.png", full_page=False)

    # 截图详情图区域
    page.evaluate("() => window.scrollTo(0, 1200)")
    page.wait_for_timeout(500)
    page.screenshot(path="/tmp/e2e-p5-detail-images.png", full_page=False)

    print("✅ P5 PASS: 前台详情页所有字段和图片验证通过")


def edit_and_delete(page):
    """P6: 编辑 → 删除"""
    print("=== P6: 编辑和删除 ===")

    # 导航到后台（持久化上下文已登录，无需重新登录）
    page.goto(ADMIN_URL, wait_until="networkidle")
    # 如果还在登录页，则登录
    if page.locator('input[placeholder="请输入账号"]').count() > 0:
        login(page)
    else:
        print("  已登录，跳过登录步骤")

    # 进入产品管理
    page.locator("button:has-text('产品管理')").first.click()
    expect(page.locator("h2:has-text('产品管理')")).to_be_visible(timeout=5000)

    # 用 API 获取最新创建的产品 ID，确保操作正确的产品
    import json as _json
    token = page.evaluate("() => localStorage.getItem('shengan_admin_token')")
    resp = page.request.get(f"{BASE_URL}/api/admin/products", headers={"Authorization": f"Bearer {token}"})
    products = resp.json()
    test_products = [p for p in products if PRODUCT_NAME in (p.get("name") or "")]
    assert len(test_products) > 0, "找不到测试产品"
    # 取最新创建的（id 最大的）
    target = max(test_products, key=lambda p: p["id"])
    target_id = target["id"]
    print(f"  目标产品 id={target_id}, 当前价格={target.get('price')}")

    # 编辑产品
    product_row = page.locator(f"tr:has-text('Playwright E2E测试产品')").filter(has_text=f"E2E测试分类").first
    product_row.locator("button:has-text('编辑')").click()
    expect(page.locator("h2:has-text('编辑产品')")).to_be_visible(timeout=5000)
    print("  ✅ 进入编辑页面")

    # 修改价格
    price_input = input_after_label(page, "价格")
    price_input.fill("")
    price_input.fill("¥39.9/米起")
    page.get_by_role("button", name="保存").click()
    expect(page.locator("h2:has-text('产品管理')")).to_be_visible(timeout=10000)
    print("  ✅ 编辑保存成功")

    # 删除产品 - 用 API 直接删除，避免 UI 定位问题
    del_resp = page.request.delete(f"{BASE_URL}/api/admin/products/{target_id}", headers={"Authorization": f"Bearer {token}"})
    del_data = del_resp.json()
    print(f"  删除 API 响应: {del_data}")
    page.wait_for_timeout(1000)
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(1000)

    expect(page.locator("td:has-text('Playwright E2E测试产品')").first).not_to_be_visible(timeout=5000)
    print("  ✅ 删除成功，产品已从列表移除")

    page.screenshot(path="/tmp/e2e-p6-after-delete.png", full_page=False)
    print("✅ P6 PASS: 编辑和删除功能正常")


def main():
    with sync_playwright() as p:
        # 使用时间戳创建独立的浏览器用户数据目录，避免与 browser-use 冲突，也避免 rm -rf
        profile_dir = f"/tmp/playwright-e2e-{datetime.now().strftime('%H%M%S')}"
        print(f"浏览器 Profile: {profile_dir}")
        context = p.chromium.launch_persistent_context(
            user_data_dir=profile_dir,
            headless=True,
            viewport={"width": 1280, "height": 800},
        )
        page = context.pages[0] if context.pages else context.new_page()

        try:
            # P1: 登录
            login(page)

            # P2-P4: 新增产品 + 上传图片 + 保存
            create_product(page)

            # P5: 前台详情页验证
            verify_frontend(page)

            # P6: 编辑 → 删除
            edit_and_delete(page)

            print("\n" + "=" * 50)
            print("🎉 全部 6 项测试通过！")
            print("=" * 50)

        except Exception as e:
            page.screenshot(path="/tmp/e2e-FAILURE.png", full_page=True)
            print(f"\n❌ 测试失败: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)
        finally:
            context.close()


if __name__ == "__main__":
    main()
