#!/usr/bin/env python3
"""
从拼多多真实数据更新盛安密封官网产品数据库
通过 VPS 后端 API 操作
"""
import json
import requests
import sys

API_BASE = "http://139.224.186.15:8082/api"
USER = "admin"
PASS = "shengan2026"

def api_login():
    resp = requests.post(f"{API_BASE}/auth/login", json={"user": USER, "pass": PASS})
    data = resp.json()
    if "token" not in data:
        print(f"Login failed: {data}")
        sys.exit(1)
    token = data["token"]
    print(f"Logged in. Token: {token[:16]}...")
    return {"Authorization": f"Bearer {token}"}

def delete_all_products(headers):
    # Get all products
    resp = requests.get(f"{API_BASE}/admin/products", headers=headers)
    products = resp.json()
    print(f"Found {len(products)} existing products")
    for p in products:
        pid = p["id"]
        r = requests.delete(f"{API_BASE}/admin/products/{pid}", headers=headers)
        print(f"  Deleted product #{pid}: {p['name'][:30]}... -> {r.json()}")

def create_product(headers, product_data):
    resp = requests.post(f"{API_BASE}/admin/products", json=product_data, headers=headers)
    data = resp.json()
    if data.get("ok"):
        print(f"  Created: {product_data['name'][:40]}... [id={data.get('id')}]")
    else:
        print(f"  FAILED: {product_data['name'][:40]}... -> {data}")
    return data

# 8个从拼多多商家页面提取的真实商品
PRODUCTS = [
    {
        "name": "隐形门推拉门自粘衣柜门防尘条静音条密封条批发整卷门厂用",
        "category": "拼多多热销款·家装散户",
        "badge": "已抢22件",
        "badge_color": "#e4323c",
        "highlights": [
            "隐形门/推拉门/衣柜门全适用",
            "自粘式免工具安装",
            "整卷批发门厂直供价格",
            "防尘静音双重功效"
        ],
        "description": "隐形门、推拉门、衣柜门综合密封条，自粘式设计免开槽免打孔，门厂直供整卷批发价。高弹性PU材质回弹性好，长效防尘防撞隔音，适配各类家装门窗使用场景。拼多多热销款，累计已抢22件。",
        "specs": [
            {"label": "材质", "value": "高弹性PU包覆式"},
            {"label": "规格", "value": "整卷批发（详情页查看具体米数）"},
            {"label": "适用", "value": "隐形门/推拉门/衣柜门/平开门"},
            {"label": "安装", "value": "自粘式免工具免开槽"}
        ],
        "use_cases": ["隐形门密封", "推拉门防尘", "衣柜门静音", "家装DIY升级"],
        "bg_color": "#f0f9f4",
        "border_color": "#7ecfa0",
        "price": "¥153.96（券后）",
        "stock": "充足",
        "pdd_link": "https://mobile.yangkeduo.com",
        "status": "上架",
        "sort_order": 0,
        "image_url": "/images/products/01-menui-tuila-1.jpg"
    },
    {
        "name": "自粘门窗胶条发泡玻璃防尘石膏木条密封条防风门框条",
        "category": "拼多多热销款·家装散户",
        "badge": "已拼3件",
        "badge_color": "#f59e0b",
        "highlights": [
            "门窗/玻璃/石膏/木条多场景通用",
            "自粘发泡材质密封性强",
            "防风门框条冬季必备",
            "券后实惠价"
        ],
        "description": "发泡自粘密封条，适用于门窗、玻璃、石膏板、木制门框等多种场景。自粘设计安装便捷，发泡材质弹性优良密封严密。防风门框条有效阻挡冬季冷风渗入，居家保暖降噪好帮手。",
        "specs": [
            {"label": "材质", "value": "自粘发泡密封条"},
            {"label": "规格", "value": "详情页多种宽度可选"},
            {"label": "适用", "value": "门窗/玻璃/石膏/木条/门框"},
            {"label": "发货", "value": "48小时内发货"}
        ],
        "use_cases": ["门窗防风密封", "玻璃隔断密封", "门框防尘静音", "家装保温改造"],
        "bg_color": "#f0f4f9",
        "border_color": "#82a6d9",
        "price": "¥153.98（券后）",
        "stock": "充足",
        "pdd_link": "https://mobile.yangkeduo.com",
        "status": "上架",
        "sort_order": 1,
        "image_url": "/images/products/02-zizhan-men.jpg"
    },
    {
        "name": "隐形门木门自粘皮条隔音胶条全屋定制家具加厚静音门封条",
        "category": "门厂配套·家装工程",
        "badge": "高品质皮条",
        "badge_color": "#0F6637",
        "highlights": [
            "加厚自粘皮条",
            "全屋定制配套专用",
            "家具级静音效果",
            "隐形门专用设计"
        ],
        "description": "针对全屋定制家具场景设计的高品质加厚皮条密封条。自粘式安装方便快捷，专门适配隐形门、木门使用，静音效果卓越。皮条材质柔韧耐用不易老化，是定制家具门厂和家装工程的首选配套密封条。",
        "specs": [
            {"label": "材质", "value": "加厚自粘皮条"},
            {"label": "适用", "value": "隐形门/木门/全屋定制家具"},
            {"label": "特点", "value": "柔韧静音·耐老化·美观"},
            {"label": "安装", "value": "自粘式·免开槽"}
        ],
        "use_cases": ["全屋定制家具配套", "隐形门隔音", "木门静音升级", "工程批量采购"],
        "bg_color": "#f9f4f0",
        "border_color": "#d9a882",
        "price": "¥167.92（券后）",
        "stock": "充足",
        "pdd_link": "https://mobile.yangkeduo.com",
        "status": "上架",
        "sort_order": 2,
        "image_url": "/images/products/03-yinxing-pitao.jpg"
    },
    {
        "name": "防盗门密封条铝合金门衣柜门静音条防尘条高档海绵条",
        "category": "拼多多热销款·家装散户",
        "badge": "51人想拼",
        "badge_color": "#e4323c",
        "highlights": [
            "防盗门/铝合金门/衣柜门通用",
            "高档海绵超强弹性",
            "静音防尘一体化",
            "高人气51人想拼"
        ],
        "description": "高档海绵材质密封条，适配防盗门、铝合金门、衣柜门等多款门型。高弹性海绵密封持久不易变形，静音防尘一体设计。简单自粘安装无需专业技能，拼多多高人气款，已有51人想拼团。",
        "specs": [
            {"label": "材质", "value": "高档海绵密封条"},
            {"label": "适用", "value": "防盗门/铝合金门/衣柜门"},
            {"label": "特点", "value": "高弹性·静音·防尘"},
            {"label": "人气", "value": "51人想拼·高需求"}
        ],
        "use_cases": ["防盗门密封降噪", "铝合金门防尘", "衣柜门静音", "出租房改造"],
        "bg_color": "#f0f9f4",
        "border_color": "#7ecfa0",
        "price": "¥147.92（券后）",
        "stock": "充足",
        "pdd_link": "https://mobile.yangkeduo.com",
        "status": "上架",
        "sort_order": 3,
        "image_url": "/images/products/04-fangdaomen.jpg"
    },
    {
        "name": "门缝密封条门框降噪缓冲隔音防尘条加厚静音条密封条整卷批发",
        "category": "门厂配套·工程批发",
        "badge": "假一赔十·29人想拼",
        "badge_color": "#0F6637",
        "highlights": [
            "假一赔十品质保证",
            "加厚静音降噪缓冲",
            "整卷批发门厂用",
            "隔音防尘双重防护"
        ],
        "description": "加厚型门缝密封条，专为门框降噪缓冲隔音设计。加厚结构密封更彻底，隔音防尘效果显著优于普通密封条。整卷批发模式适配门厂大批量采购，假一赔十品质保障，29人想拼高人气。",
        "specs": [
            {"label": "材质", "value": "加厚PU包覆式"},
            {"label": "规格", "value": "整卷批发（门厂专用）"},
            {"label": "品质", "value": "假一赔十·品质保证"},
            {"label": "适用", "value": "门缝/门框/门窗通用"}
        ],
        "use_cases": ["门厂大批量配套", "门窗工程采购", "隔音降噪改造", "防尘密封方案"],
        "bg_color": "#f0f4f9",
        "border_color": "#0F6637",
        "price": "¥140.76（券后）",
        "stock": "充足",
        "pdd_link": "https://mobile.yangkeduo.com",
        "status": "上架",
        "sort_order": 4,
        "image_url": "/images/products/05-menfen.jpg"
    },
    {
        "name": "铝防撞门自粘胶条密封条防尘条静音条门厂用批发整卷海绵防撞条",
        "category": "门厂配套·批发合作",
        "badge": "24小时内发货",
        "badge_color": "#f97316",
        "highlights": [
            "铝合金门窗防撞专用",
            "海绵材质缓冲吸震",
            "门厂整卷批发价格",
            "24小时内极速发货"
        ],
        "description": "专为铝合金门窗设计的海绵防撞密封条。海绵材质柔韧缓冲，有效吸震防撞保护门窗。自粘胶条安装便捷，整卷批发价格优惠，门厂配套首选。已抢3件，24小时内发货现货充足。",
        "specs": [
            {"label": "材质", "value": "海绵防撞自粘胶条"},
            {"label": "适用", "value": "铝合金门窗/推拉门"},
            {"label": "规格", "value": "整卷批发（门厂用）"},
            {"label": "发货", "value": "24小时内极速发货"}
        ],
        "use_cases": ["铝合金门窗防撞", "推拉门缓冲", "门厂批量配套", "工程采购"],
        "bg_color": "#f9f4f0",
        "border_color": "#d9a882",
        "price": "¥154.50（券后）",
        "stock": "充足",
        "pdd_link": "https://mobile.yangkeduo.com",
        "status": "上架",
        "sort_order": 5,
        "image_url": "/images/products/06-lvfangzhuang.jpg"
    },
    {
        "name": "自粘密封条防尘条推拉门隐形门子母门静音条门厂用整卷批发防撞条",
        "category": "门厂配套·工程批发",
        "badge": "13人想拼",
        "badge_color": "#e4323c",
        "highlights": [
            "推拉门/隐形门/子母门全适配",
            "自粘式整卷批发",
            "防尘静音防撞三合一",
            "门厂直销价格"
        ],
        "description": "多功能综合密封条，一胶适配推拉门、隐形门、子母门等多种门型。自粘设计操作简便，集防尘、静音、防撞三大功能于一体。整卷批发专供门厂，门厂直销价格优惠，已有13人想拼。",
        "specs": [
            {"label": "材质", "value": "PU包覆式自粘密封条"},
            {"label": "适用", "value": "推拉门/隐形门/子母门"},
            {"label": "功能", "value": "防尘·静音·防撞三合一"},
            {"label": "规格", "value": "整卷批发·门厂用"}
        ],
        "use_cases": ["推拉门密封", "隐形门静音", "子母门防尘防撞", "门厂一站式采购"],
        "bg_color": "#f0f9f4",
        "border_color": "#7ecfa0",
        "price": "¥167.36（券后）",
        "stock": "充足",
        "pdd_link": "https://mobile.yangkeduo.com",
        "status": "上架",
        "sort_order": 6,
        "image_url": "/images/products/07-zizhan-mifen.jpg"
    },
    {
        "name": "铝合金推拉门移门平开门卫生间门门缝静音条密封条整卷批发门厂用",
        "category": "门厂配套·批发合作",
        "badge": "专业款",
        "badge_color": "#0F6637",
        "highlights": [
            "推拉门/移门/平开门/卫生间门全兼容",
            "专属铝合金门密封方案",
            "门缝静音密封一体化",
            "整卷批发价"
        ],
        "description": "专为铝合金推拉门、移门、平开门、卫生间门等多门型设计的综合密封条。精准适配门缝间隙，静音密封效果优秀。整卷批发专供门窗厂大批量采购，价格实惠性价比高，已有2人拼团。",
        "specs": [
            {"label": "材质", "value": "PU包覆式静音密封条"},
            {"label": "适用", "value": "推拉门/移门/平开门/卫生间门"},
            {"label": "特点", "value": "专属铝合金门密封方案"},
            {"label": "价格", "value": "¥289（整卷批发价）"}
        ],
        "use_cases": ["铝合金推拉门密封", "移门静音防尘", "卫生间门防潮密封", "门窗厂批量采购"],
        "bg_color": "#f0f4f9",
        "border_color": "#82a6d9",
        "price": "¥289.00",
        "stock": "充足",
        "pdd_link": "https://mobile.yangkeduo.com",
        "status": "上架",
        "sort_order": 7,
        "image_url": "/images/products/08-lvhejin.jpg"
    },
]

def main():
    print("=" * 60)
    print("盛安密封官网 - 拼多多真实商品数据同步")
    print("=" * 60)
    
    headers = api_login()
    
    # 1. 删除所有现有产品
    print("\n[1/3] 清理旧数据...")
    delete_all_products(headers)
    
    # 2. 创建新产品
    print(f"\n[2/3] 插入 {len(PRODUCTS)} 个拼多多真实商品...")
    for i, product in enumerate(PRODUCTS):
        create_product(headers, product)
    
    # 3. 验证
    print("\n[3/3] 验证数据...")
    resp = requests.get(f"{API_BASE}/admin/products", headers=headers)
    products = resp.json()
    print(f"当前数据库中共有 {len(products)} 个商品")
    for p in products:
        print(f"  [{p['id']}] {p['name'][:50]} | {p['price']} | {p['badge']}")
    
    print("\n" + "=" * 60)
    print("同步完成！")
    print("=" * 60)

if __name__ == "__main__":
    main()
