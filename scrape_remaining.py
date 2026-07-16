#!/usr/bin/env python3
"""批量抓取商品 2-8 的详情图片（复用已登录的店铺页标签）"""
import json, urllib.request, os, time

WB = "http://127.0.0.1:10086/command"
BASE = "/Users/luodong/trae/03-Web与产品项目/shengan-seal/pdd_images/products"

def wb(action, args=None):
    payload = {"action": action}
    if args: payload["args"] = args
    data = json.dumps(payload).encode()
    req = urllib.request.Request(WB, data=data, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=30) as resp:
        r = json.loads(resp.read())
    if r.get("ok"):
        return r.get("data", {}).get("value", "") or r.get("data", {}).get("result", "")
    return None

def download_imgs(imgs, product_dir):
    os.makedirs(product_dir, exist_ok=True)
    ok = 0
    for i, url in enumerate(imgs):
        ext = "jpg"
        if "png" in url: ext = "png"
        elif "webp" in url: ext = "webp"
        path = f"{product_dir}/img_{i+1:02d}.{ext}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                with open(path, "wb") as f: f.write(resp.read())
                ok += 1
        except Exception as e:
            print(f"    [{i+1:02d}] FAIL: {e}")
        time.sleep(0.2)
    return ok

# 商品 2-8（index 1-7）
for idx in range(1, 8):
    prod_num = idx + 1
    print(f"\n{'='*50}")
    print(f"商品 {prod_num}/8 (index={idx})")
    print(f"{'='*50}")

    # 1. 点击商品
    js_click = f'(() => {{ const items = document.querySelectorAll(".goodsItem_R1ok0MpS"); if (items[{idx}]) {{ items[{idx}].click(); return "clicked"; }} return "not_found"; }})()'
    r = wb("evaluate", {"code": js_click})
    print(f"  点击: {r}")
    if r != "clicked":
        print("  跳过（未找到）")
        continue

    # 2. 等待 + 滚动 + 提取图片
    time.sleep(4)
    js_scroll_extract = """(async () => {
        const h = document.body.scrollHeight;
        for (let i = 1; i <= 10; i++) { window.scrollTo(0, h * i / 10); await new Promise(r => setTimeout(r, 600)); }
        await new Promise(r => setTimeout(r, 2000));
        const imgs = [...document.querySelectorAll("img")].map(img => ({src: img.src, w: img.naturalWidth}))
            .filter(o => o.src && o.w > 100 && !o.src.includes("data:"));
        const seen = new Set();
        const unique = imgs.filter(o => { if (seen.has(o.src)) return false; seen.add(o.src); return true; });
        return JSON.stringify({title: document.title, url: location.href, imgCount: unique.length, imgs: unique.map(o => o.src)});
    })()"""
    r = wb("evaluate", {"code": js_scroll_extract})
    if not r:
        print("  提取失败")
        # 尝试返回
        wb("evaluate", {"code": "window.history.back()"})
        time.sleep(3)
        continue

    data = json.loads(r)
    print(f"  标题: {data.get('title', '')[:40]}")
    print(f"  图片数: {data.get('imgCount', 0)}")

    # 保存图片URL
    prod_dir = f"{BASE}/product_{prod_num}"
    os.makedirs(prod_dir, exist_ok=True)
    with open(f"{prod_dir}/urls.json", "w") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    # 3. 下载图片
    downloaded = download_imgs(data.get("imgs", []), prod_dir)
    print(f"  下载: {downloaded}/{data.get('imgCount', 0)} 张 -> {prod_dir}")

    # 4. 返回店铺页
    wb("evaluate", {"code": "window.history.back()"})
    time.sleep(3)

print(f"\n{'='*50}")
print("全部完成！")
print(f"图片目录: {BASE}")
# 统计
total = 0
for d in os.listdir(BASE):
    pdir = os.path.join(BASE, d)
    if os.path.isdir(pdir):
        count = len([f for f in os.listdir(pdir) if f.startswith("img_")])
        total += count
        print(f"  {d}: {count} 张")
print(f"  总计: {total} 张")
