#!/usr/bin/env python3
"""
盛安密封 - 拼多多店铺商品详情图片抓取脚本
通过 Kimi WebBridge API 抓取店铺所有商品的详情图片
"""
import json
import urllib.request
import urllib.error
import os
import time
import re

WEBBRIDGE_URL = "http://127.0.0.1:10086/command"
STORE_URL = "https://mobile.yangkeduo.com/mall_page.html?msn=k7pr4d6why42zzo5f4zyvjn64y_axbuy"
SAVE_DIR = "/Users/luodong/trae/03-Web与产品项目/shengan-seal/pdd_images"

def wb_command(action, args=None, session=None):
    """发送命令到 Kimi WebBridge"""
    payload = {"action": action}
    if args:
        payload["args"] = args
    if session:
        payload["session"] = session
    
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        WEBBRIDGE_URL,
        data=data,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read().decode('utf-8'))
            return result
    except Exception as e:
        return {"ok": False, "error": str(e)}

def download_image(url, save_path):
    """下载图片到本地"""
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=30) as resp:
            with open(save_path, 'wb') as f:
                f.write(resp.read())
            return True
    except Exception as e:
        print(f"  下载失败: {e}")
        return False

def main():
    print("=" * 60)
    print("盛安密封 - 拼多多店铺商品详情图片抓取")
    print("=" * 60)
    
    # 创建保存目录
    os.makedirs(SAVE_DIR, exist_ok=True)
    os.makedirs(f"{SAVE_DIR}/logo", exist_ok=True)
    os.makedirs(f"{SAVE_DIR}/products", exist_ok=True)
    
    # 1. 导航到店铺页面
    print("\n[1] 导航到拼多多店铺页面...")
    result = wb_command("navigate", {"url": STORE_URL})
    print(f"  结果: {json.dumps(result, ensure_ascii=False)[:200]}")
    
    if not result.get("ok"):
        print("  导航失败，请确认 Kimi WebBridge 已启动且 Chrome 已打开")
        return
    
    # 等待页面加载
    print("  等待页面加载...")
    time.sleep(5)
    
    # 2. 截取店铺页面截图
    print("\n[2] 截取店铺页面...")
    result = wb_command("screenshot")
    if result.get("ok"):
        screenshot_path = result.get("data", {}).get("path", "")
        print(f"  截图保存: {screenshot_path}")
    
    # 3. 提取店铺 logo 和所有商品卡片信息
    print("\n[3] 提取店铺 logo 和商品列表...")
    js_code = """
    (() => {
        // 提取 logo
        const logoImg = document.querySelector('.mall-logo img, .store-logo img, [class*=logo] img, header img');
        const logoSrc = logoImg ? logoImg.src : '';
        
        // 提取所有商品卡片
        const items = document.querySelectorAll('[class*=goodsItem], [class*=goods_item], [class*=product]');
        const products = [];
        items.forEach((item, i) => {
            const link = item.querySelector('a');
            const img = item.querySelector('img');
            const title = item.querySelector('[class*=title], [class*=name], h3, h4');
            products.push({
                index: i,
                href: link ? link.href : '',
                imgSrc: img ? img.src : '',
                title: title ? title.textContent.trim() : ''
            });
        });
        
        // 也尝试通过所有链接找商品
        const allLinks = [...document.querySelectorAll('a')];
        const goodsLinks = allLinks.filter(a => a.href && (a.href.includes('goods.html') || a.href.includes('goods_id')));
        
        return JSON.stringify({
            logoSrc,
            productCount: products.length,
            products,
            goodsLinksCount: goodsLinks.length,
            goodsLinks: goodsLinks.map(a => a.href).slice(0, 20),
            pageTitle: document.title,
            url: location.href
        });
    })()
    """
    
    result = wb_command("evaluate", {"code": js_code})
    if result.get("ok"):
        try:
            # evaluate 返回格式: {"ok": true, "data": {"type": "string", "value": "..."}}
            raw_value = result.get("data", {}).get("value", "")
            if not raw_value:
                raw_value = result.get("data", {}).get("result", "")
            data = json.loads(raw_value)
            print(f"  页面标题: {data.get('pageTitle', '')}")
            print(f"  商品卡片数: {data.get('productCount', 0)}")
            print(f"  商品链接数: {data.get('goodsLinksCount', 0)}")
            
            # 保存 logo
            if data.get("logoSrc"):
                print(f"  Logo: {data['logoSrc'][:100]}")
                ext = data["logoSrc"].split(".")[-1].split("?")[0]
                if ext not in ("jpg", "jpeg", "png", "webp"):
                    ext = "jpg"
                logo_path = f"{SAVE_DIR}/logo/store_logo.{ext}"
                if download_image(data["logoSrc"], logo_path):
                    print(f"  Logo 已保存: {logo_path}")
            
            # 打印商品信息
            for p in data.get("products", []):
                print(f"  商品{p['index']}: {p.get('title', '')[:40]} | {p.get('href', '')[:80]}")
            
            # 保存商品链接
            with open(f"{SAVE_DIR}/goods_links.json", "w") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"  商品信息已保存: {SAVE_DIR}/goods_links.json")
            
        except json.JSONDecodeError as e:
            print(f"  解析失败: {e}")
            print(f"  原始数据: {str(result.get('data', {}))[:500]}")
    else:
        print(f"  执行失败: {result}")
    
    # 4. 尝试点击每个商品获取详情页图片
    print("\n[4] 逐个点击商品获取详情页图片...")
    
    # 先回到店铺页
    wb_command("navigate", {"url": STORE_URL})
    time.sleep(4)
    
    # 获取所有商品卡片并逐个点击
    js_get_items = """
    (() => {
        // 尝试多种选择器
        const selectors = [
            '[class*=goodsItem]',
            '[class*=goods_item]', 
            '[class*=GoodsItem]',
            '.goods-item',
            '[data-goods-id]',
            'a[href*=goods.html]',
            'a[href*=goods_id]'
        ];
        
        let items = [];
        for (const sel of selectors) {
            items = document.querySelectorAll(sel);
            if (items.length > 0) break;
        }
        
        const results = [];
        items.forEach((item, i) => {
            const link = item.tagName === 'A' ? item : item.querySelector('a');
            results.push({
                index: i,
                href: link ? link.href : item.getAttribute('href') || '',
                tag: item.tagName,
                className: item.className ? item.className.toString().slice(0, 50) : ''
            });
        });
        
        return JSON.stringify({count: results.length, items: results});
    })()
    """
    
    result = wb_command("evaluate", {"code": js_get_items})
    if result.get("ok"):
        raw_value = result.get("data", {}).get("value", "")
        if not raw_value:
            raw_value = result.get("data", {}).get("result", "")
        data = json.loads(raw_value)
        print(f"  找到 {data['count']} 个商品元素")
        
        if data["count"] == 0:
            # 尝试滚动加载更多
            print("  尝试滚动页面加载商品...")
            for i in range(5):
                wb_command("evaluate", {"code": "window.scrollTo(0, document.body.scrollHeight * " + str(i+1) + "/5)"})
                time.sleep(1)
            
            # 重新获取
            result = wb_command("evaluate", {"code": js_get_items})
            if result.get("ok"):
                raw_value = result.get("data", {}).get("value", "")
                if not raw_value:
                    raw_value = result.get("data", {}).get("result", "")
                data = json.loads(raw_value)
                print(f"  滚动后找到 {data['count']} 个商品元素")
            
            # 逐个点击商品
            for i in range(min(data["count"], 8)):
                print(f"\n  --- 商品 {i+1}/{min(data['count'], 8)} ---")
                
                # 点击第 i 个商品
                js_click = f"""
                (() => {{
                    const selectors = [
                        '[class*=goodsItem]',
                        '[class*=goods_item]',
                        '[class*=GoodsItem]',
                        '.goods-item',
                        '[data-goods-id]',
                        'a[href*=goods.html]',
                        'a[href*=goods_id]'
                    ];
                    let items = [];
                    for (const sel of selectors) {{
                        items = document.querySelectorAll(sel);
                        if (items.length > 0) break;
                    }}
                    if (items[{i}]) {{
                        items[{i}].click();
                        return JSON.stringify({{clicked: true, index: {i}}});
                    }}
                    return JSON.stringify({{clicked: false, index: {i}, total: items.length}});
                }})()
                """
                
                click_result = wb_command("evaluate", {"code": js_click})
                print(f"  点击结果: {json.dumps(click_result, ensure_ascii=False)[:200]}")
                
                # 滚动触发懒加载
                js_scroll = """
                (async () => {
                    const h = document.body.scrollHeight;
                    for (let i = 1; i <= 8; i++) {
                        window.scrollTo(0, h * i / 8);
                        await new Promise(r => setTimeout(r, 800));
                    }
                    await new Promise(r => setTimeout(r, 2000));
                    return JSON.stringify({scrolled: true, url: location.href});
                })()
                """
                wb_command("evaluate", {"code": js_scroll})
                time.sleep(3)
                
                # 提取详情页所有图片
                js_extract = """
                (() => {
                    const imgs = [...document.querySelectorAll('img')].map(img => ({
                        src: img.src,
                        w: img.naturalWidth,
                        h: img.naturalHeight
                    })).filter(o => o.src && o.w > 100);
                    
                    // 去重
                    const seen = new Set();
                    const unique = imgs.filter(o => {
                        if (seen.has(o.src)) return false;
                        seen.add(o.src);
                        return true;
                    });
                    
                    return JSON.stringify({
                        url: location.href,
                        title: document.title,
                        imgCount: unique.length,
                        imgs: unique.map(o => o.src)
                    });
                })()
                """
                
                extract_result = wb_command("evaluate", {"code": js_extract})
                if extract_result.get("ok"):
                    try:
                        raw_value = extract_result.get("data", {}).get("value", "")
                        if not raw_value:
                            raw_value = extract_result.get("data", {}).get("result", "")
                        img_data = json.loads(raw_value)
                        print(f"  详情页: {img_data.get('title', '')[:50]}")
                        print(f"  找到 {img_data.get('imgCount', 0)} 张图片")
                        
                        # 下载图片
                        product_dir = f"{SAVE_DIR}/products/product_{i+1}"
                        os.makedirs(product_dir, exist_ok=True)
                        
                        downloaded = 0
                        for j, img_url in enumerate(img_data.get("imgs", [])[:30]):  # 限制每个商品最多30张
                            ext = "jpg"
                            if "png" in img_url:
                                ext = "png"
                            elif "webp" in img_url:
                                ext = "webp"
                            
                            save_path = f"{product_dir}/img_{j+1:02d}.{ext}"
                            if download_image(img_url, save_path):
                                downloaded += 1
                        
                        print(f"  已下载 {downloaded} 张图片到 {product_dir}")
                        
                        # 保存图片URL列表
                        with open(f"{product_dir}/urls.json", "w") as f:
                            json.dump(img_data, f, ensure_ascii=False, indent=2)
                        
                    except json.JSONDecodeError as e:
                        print(f"  解析图片数据失败: {e}")
                else:
                    print(f"  提取图片失败: {extract_result}")
                
                # 返回店铺页
                wb_command("navigate", {"url": STORE_URL})
                time.sleep(3)
                
        except json.JSONDecodeError as e:
            print(f"  解析商品列表失败: {e}")
    else:
        print(f"  获取商品列表失败: {result}")
    
    print("\n" + "=" * 60)
    print("抓取完成！")
    print(f"图片保存目录: {SAVE_DIR}")
    print("=" * 60)

if __name__ == "__main__":
    main()
