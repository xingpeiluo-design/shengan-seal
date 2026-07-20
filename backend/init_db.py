#!/usr/bin/env python3
"""
盛安密封官网 - 数据库初始化脚本
升级表结构 + 灌入8款产品完整数据 + 126张详情图路径
"""
import sqlite3
import json
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'shengan.db')
PDD_IMAGES_DIR = os.path.join(os.path.dirname(BASE_DIR), 'pdd_images', 'products')

def init_db_schema():
    """初始化/升级数据库表结构"""
    db = sqlite3.connect(DB_PATH)
    db.executescript('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            badge TEXT DEFAULT '',
            badge_color TEXT DEFAULT '#0F6637',
            highlights TEXT DEFAULT '[]',
            description TEXT DEFAULT '',
            specs TEXT DEFAULT '[]',
            use_cases TEXT DEFAULT '[]',
            bg_color TEXT DEFAULT '#f0f9f4',
            border_color TEXT DEFAULT '#7ecfa0',
            price TEXT DEFAULT '',
            stock TEXT DEFAULT '充足',
            pdd_link TEXT DEFAULT 'https://mobile.yangkeduo.com',
            status TEXT DEFAULT '上架',
            sort_order INTEGER DEFAULT 0,
            image_url TEXT DEFAULT '',
            gallery_images TEXT DEFAULT '[]',
            detail_images TEXT DEFAULT '[]',
            created_at TEXT DEFAULT (datetime('now','localtime')),
            updated_at TEXT DEFAULT (datetime('now','localtime'))
        );

        CREATE TABLE IF NOT EXISTS sub_products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            icon TEXT DEFAULT '',
            description TEXT DEFAULT '',
            sort_order INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS news (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT DEFAULT '',
            summary TEXT DEFAULT '',
            content TEXT DEFAULT '',
            tags TEXT DEFAULT '[]',
            read_time TEXT DEFAULT '3分钟',
            published INTEGER DEFAULT 1,
            views INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now','localtime')),
            updated_at TEXT DEFAULT (datetime('now','localtime'))
        );

        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            company TEXT DEFAULT '',
            phone TEXT NOT NULL,
            need TEXT DEFAULT '',
            product TEXT DEFAULT '',
            status TEXT DEFAULT '待跟进',
            source TEXT DEFAULT 'contact',
            created_at TEXT DEFAULT (datetime('now','localtime'))
        );

        CREATE TABLE IF NOT EXISTS samples (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            company TEXT DEFAULT '',
            address TEXT DEFAULT '',
            product TEXT DEFAULT '',
            note TEXT DEFAULT '',
            status TEXT DEFAULT '待处理',
            created_at TEXT DEFAULT (datetime('now','localtime'))
        );

        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT DEFAULT '',
            label TEXT DEFAULT '',
            category TEXT DEFAULT 'general'
        );

        CREATE TABLE IF NOT EXISTS qr_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            label TEXT DEFAULT '',
            description TEXT DEFAULT '',
            image_url TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now','localtime'))
        );

        CREATE TABLE IF NOT EXISTS admin_tokens (
            token TEXT PRIMARY KEY,
            user TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now','localtime'))
        );
    ''')
    # 为已有表补充新字段
    try:
        db.execute("ALTER TABLE products ADD COLUMN gallery_images TEXT DEFAULT '[]'")
    except:
        pass
    try:
        db.execute("ALTER TABLE products ADD COLUMN detail_images TEXT DEFAULT '[]'")
    except:
        pass
    try:
        db.execute("ALTER TABLE products ADD COLUMN image_url TEXT DEFAULT ''")
    except:
        pass
    db.commit()
    db.close()
    print("[OK] 数据库表结构初始化/升级完成")

def get_product_images(prod_num):
    """获取某个商品的图片路径列表"""
    prod_dir = os.path.join(PDD_IMAGES_DIR, f'product_{prod_num}')
    if not os.path.isdir(prod_dir):
        return [], []
    images = sorted([f for f in os.listdir(prod_dir) if f.startswith('img_')])
    gallery = [f'/images/products/product_{prod_num}/{img}' for img in images[:3]]
    details = [f'/images/products/product_{prod_num}/{img}' for img in images[3:]]
    return gallery, details

def seed_products():
    """灌入8款产品完整数据（仅空表时插入，幂等）"""
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    if db.execute('SELECT COUNT(*) FROM products').fetchone()[0] > 0:
        db.close()
        return

    products = [
        {
            "name": "隐形门推拉门自粘衣柜门防尘条静音条密封条批发整卷门厂用",
            "category": "拼多多热销款·家装散户", "badge": "已抢22件", "badge_color": "#e4323c",
            "highlights": ["隐形门/推拉门/衣柜门全适用", "自粘式免工具安装", "整卷批发门厂直供价格", "防尘静音双重功效"],
            "description": "隐形门、推拉门、衣柜门综合密封条，自粘式设计免开槽免打孔，门厂直供整卷批发价。高弹性PU材质回弹性好，长效防尘防撞隔音，适配各类家装门窗使用场景。",
            "specs": [{"label":"材质","value":"高弹性PU包覆式"},{"label":"规格","value":"整卷批发（详情页查看具体米数）"},{"label":"适用","value":"隐形门/推拉门/衣柜门/平开门"},{"label":"安装","value":"自粘式免工具免开槽"}],
            "use_cases": ["隐形门密封", "推拉门防尘", "衣柜门静音", "家装DIY升级"],
            "bg_color": "#f0f9f4", "border_color": "#7ecfa0", "price": "¥153.96（券后）", "stock": "充足",
            "pdd_link": "https://mobile.yangkeduo.com", "status": "上架", "sort_order": 0,
            "image_url": "/images/products/product_1/img_01.jpg"
        },
        {
            "name": "自粘门窗胶条发泡玻璃防尘石膏木条密封条防风门框条",
            "category": "拼多多热销款·家装散户", "badge": "已拼3件", "badge_color": "#f59e0b",
            "highlights": ["门窗/玻璃/石膏/木条多场景通用", "自粘发泡材质密封性强", "防风门框条冬季必备", "券后实惠价"],
            "description": "发泡自粘密封条，适用于门窗、玻璃、石膏板、木制门框等多种场景。自粘设计安装便捷，发泡材质弹性优良密封严密。",
            "specs": [{"label":"材质","value":"自粘发泡密封条"},{"label":"规格","value":"详情页多种宽度可选"},{"label":"适用","value":"门窗/玻璃/石膏/木条/门框"},{"label":"发货","value":"48小时内发货"}],
            "use_cases": ["门窗防风密封", "玻璃隔断密封", "门框防尘静音", "家装保温改造"],
            "bg_color": "#f0f4f9", "border_color": "#82a6d9", "price": "¥153.98（券后）", "stock": "充足",
            "pdd_link": "https://mobile.yangkeduo.com", "status": "上架", "sort_order": 1,
            "image_url": "/images/products/product_2/img_01.jpg"
        },
        {
            "name": "隐形门木门自粘皮条隔音胶条全屋定制家具加厚静音门封条",
            "category": "门厂配套·家装工程", "badge": "高品质皮条", "badge_color": "#0F6637",
            "highlights": ["加厚自粘皮条", "全屋定制配套专用", "家具级静音效果", "隐形门专用设计"],
            "description": "针对全屋定制家具场景设计的高品质加厚皮条密封条。自粘式安装方便快捷，专门适配隐形门、木门使用，静音效果卓越。",
            "specs": [{"label":"材质","value":"加厚自粘皮条"},{"label":"适用","value":"隐形门/木门/全屋定制家具"},{"label":"特点","value":"柔韧静音·耐老化·美观"},{"label":"安装","value":"自粘式·免开槽"}],
            "use_cases": ["全屋定制家具配套", "隐形门隔音", "木门静音升级", "工程批量采购"],
            "bg_color": "#f9f4f0", "border_color": "#d9a882", "price": "¥167.92（券后）", "stock": "充足",
            "pdd_link": "https://mobile.yangkeduo.com", "status": "上架", "sort_order": 2,
            "image_url": "/images/products/product_3/img_01.jpg"
        },
        {
            "name": "防盗门密封条铝合金门衣柜门静音条防尘条高档海绵条",
            "category": "拼多多热销款·家装散户", "badge": "51人想拼", "badge_color": "#e4323c",
            "highlights": ["防盗门/铝合金门/衣柜门通用", "高档海绵超强弹性", "静音防尘一体化", "高人气51人想拼"],
            "description": "高档海绵材质密封条，适配防盗门、铝合金门、衣柜门等多款门型。高弹性海绵密封持久不易变形，静音防尘一体设计。",
            "specs": [{"label":"材质","value":"高档海绵密封条"},{"label":"适用","value":"防盗门/铝合金门/衣柜门"},{"label":"特点","value":"高弹性·静音·防尘"},{"label":"人气","value":"51人想拼·高需求"}],
            "use_cases": ["防盗门密封降噪", "铝合金门防尘", "衣柜门静音", "出租房改造"],
            "bg_color": "#f0f9f4", "border_color": "#7ecfa0", "price": "¥147.92（券后）", "stock": "充足",
            "pdd_link": "https://mobile.yangkeduo.com", "status": "上架", "sort_order": 3,
            "image_url": "/images/products/product_4/img_01.jpg"
        },
        {
            "name": "门缝密封条门框降噪缓冲隔音防尘条加厚静音条密封条整卷批发",
            "category": "门厂配套·工程批发", "badge": "假一赔十·29人想拼", "badge_color": "#0F6637",
            "highlights": ["假一赔十品质保证", "加厚静音降噪缓冲", "整卷批发门厂用", "隔音防尘双重防护"],
            "description": "加厚型门缝密封条，专为门框降噪缓冲隔音设计。加厚结构密封更彻底，隔音防尘效果显著优于普通密封条。",
            "specs": [{"label":"材质","value":"加厚PU包覆式"},{"label":"规格","value":"整卷批发（门厂专用）"},{"label":"品质","value":"假一赔十·品质保证"},{"label":"适用","value":"门缝/门框/门窗通用"}],
            "use_cases": ["门厂大批量配套", "门窗工程采购", "隔音降噪改造", "防尘密封方案"],
            "bg_color": "#f0f4f9", "border_color": "#0F6637", "price": "¥140.76（券后）", "stock": "充足",
            "pdd_link": "https://mobile.yangkeduo.com", "status": "上架", "sort_order": 4,
            "image_url": "/images/products/product_5/img_01.jpg"
        },
        {
            "name": "铝防撞门自粘胶条密封条防尘条静音条门厂用批发整卷海绵防撞条",
            "category": "门厂配套·批发合作", "badge": "24小时内发货", "badge_color": "#f97316",
            "highlights": ["铝合金门窗防撞专用", "海绵材质缓冲吸震", "门厂整卷批发价格", "24小时内极速发货"],
            "description": "专为铝合金门窗设计的海绵防撞密封条。海绵材质柔韧缓冲，有效吸震防撞保护门窗。",
            "specs": [{"label":"材质","value":"海绵防撞自粘胶条"},{"label":"适用","value":"铝合金门窗/推拉门"},{"label":"规格","value":"整卷批发（门厂用）"},{"label":"发货","value":"24小时内极速发货"}],
            "use_cases": ["铝合金门窗防撞", "推拉门缓冲", "门厂批量配套", "工程采购"],
            "bg_color": "#f9f4f0", "border_color": "#d9a882", "price": "¥154.50（券后）", "stock": "充足",
            "pdd_link": "https://mobile.yangkeduo.com", "status": "上架", "sort_order": 5,
            "image_url": "/images/products/product_6/img_01.jpg"
        },
        {
            "name": "自粘密封条防尘条推拉门隐形门子母门静音条门厂用整卷批发防撞条",
            "category": "门厂配套·工程批发", "badge": "13人想拼", "badge_color": "#e4323c",
            "highlights": ["推拉门/隐形门/子母门全适配", "自粘式整卷批发", "防尘静音防撞三合一", "门厂直销价格"],
            "description": "多功能综合密封条，一胶适配推拉门、隐形门、子母门等多种门型。集防尘、静音、防撞三大功能于一体。",
            "specs": [{"label":"材质","value":"PU包覆式自粘密封条"},{"label":"适用","value":"推拉门/隐形门/子母门"},{"label":"功能","value":"防尘·静音·防撞三合一"},{"label":"规格","value":"整卷批发·门厂用"}],
            "use_cases": ["推拉门密封", "隐形门静音", "子母门防尘防撞", "门厂一站式采购"],
            "bg_color": "#f0f9f4", "border_color": "#7ecfa0", "price": "¥167.36（券后）", "stock": "充足",
            "pdd_link": "https://mobile.yangkeduo.com", "status": "上架", "sort_order": 6,
            "image_url": "/images/products/product_7/img_01.jpg"
        },
        {
            "name": "铝合金推拉门移门平开门卫生间门门缝静音条密封条整卷批发门厂用",
            "category": "门厂配套·批发合作", "badge": "专业款", "badge_color": "#0F6637",
            "highlights": ["推拉门/移门/平开门/卫生间门全兼容", "专属铝合金门密封方案", "门缝静音密封一体化", "整卷批发价"],
            "description": "专为铝合金推拉门、移门、平开门、卫生间门等多门型设计的综合密封条。精准适配门缝间隙，静音密封效果优秀。",
            "specs": [{"label":"材质","value":"PU包覆式静音密封条"},{"label":"适用","value":"推拉门/移门/平开门/卫生间门"},{"label":"特点","value":"专属铝合金门密封方案"},{"label":"价格","value":"¥289（整卷批发价）"}],
            "use_cases": ["铝合金推拉门密封", "移门静音防尘", "卫生间门防潮密封", "门窗厂批量采购"],
            "bg_color": "#f0f4f9", "border_color": "#82a6d9", "price": "¥289.00", "stock": "充足",
            "pdd_link": "https://mobile.yangkeduo.com", "status": "上架", "sort_order": 7,
            "image_url": "/images/products/product_8/img_01.jpg"
        },
    ]

    for i, p in enumerate(products):
        prod_num = i + 1
        gallery, details = get_product_images(prod_num)
        db.execute('''
            INSERT INTO products (name, category, badge, badge_color, highlights, description,
                specs, use_cases, bg_color, border_color, price, stock, pdd_link, status,
                sort_order, image_url, gallery_images, detail_images)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ''', (
            p['name'], p['category'], p['badge'], p['badge_color'],
            json.dumps(p['highlights'], ensure_ascii=False),
            p['description'],
            json.dumps(p['specs'], ensure_ascii=False),
            json.dumps(p['use_cases'], ensure_ascii=False),
            p['bg_color'], p['border_color'], p['price'], p['stock'],
            p['pdd_link'], p['status'], p['sort_order'], p['image_url'],
            json.dumps(gallery, ensure_ascii=False),
            json.dumps(details, ensure_ascii=False)
        ))
        print(f"  [OK] 商品{prod_num}: {p['name'][:30]}... | gallery={len(gallery)}张 detail={len(details)}张")

    db.commit()
    count = db.execute('SELECT COUNT(*) FROM products').fetchone()[0]
    print(f"\n[OK] 共写入 {count} 款产品")
    db.close()

def seed_sub_products():
    db = sqlite3.connect(DB_PATH)
    if db.execute('SELECT COUNT(*) FROM sub_products').fetchone()[0] > 0:
        db.close()
        return
    subs = [
        ('断桥铝专用密封条', '🪟', '专为断桥铝型材设计，完美卡槽适配，工厂量产批量供应', 0),
        ('阳光房专用密封条', '🌤️', '耐候性强，抗UV，高温低温不变形，工程配套首选', 1),
        ('室内木门隔音密封条', '🚪', '超强隔音效果，母婴级环保，家装工程均适用', 2),
        ('推拉门密封胶条', '↔️', '高耐磨PU材质，推拉顺滑，防尘防风，长效耐用', 3),
    ]
    for s in subs:
        db.execute('INSERT INTO sub_products (name, icon, description, sort_order) VALUES (?,?,?,?)', s)
    db.commit()
    db.close()
    print("[OK] 细分产品数据写入完成")

def seed_settings():
    db = sqlite3.connect(DB_PATH)
    if db.execute('SELECT COUNT(*) FROM settings').fetchone()[0] > 0:
        db.close()
        return
    settings = [
        ('pdd_link', 'https://mobile.yangkeduo.com/mall_page.html?msn=k7pr4d6why42zzo5f4zyvjn64y_axbuy', '拼多多店铺链接', 'channel'),
        ('hotline', '13507402179', '采购热线', 'contact'),
        ('factory_phone', '138-0000-1234', '工厂直线', 'contact'),
        ('address', '浙江省温州市某某工业园区XX路XX号', '厂区地址', 'contact'),
        ('work_hours', '周一至周六 8:00-18:00', '工作时间', 'contact'),
        ('company_name', '长沙盛安密封科技有限公司', '公司名称', 'contact'),
        ('company_name_en', 'Shengan Sealing Technology Co., Ltd.', '公司英文名', 'contact'),
        ('copyright', '© 2026 盛安密封科技有限公司 版权所有', '版权信息', 'general'),
        ('icp', '', 'ICP备案号', 'general'),
        ('site_title', '盛安密封 - 高端包覆式密封条源头制造商', '网站标题', 'seo'),
        ('site_keywords', '包覆式密封条,门窗密封条,断桥铝密封胶条,盛安密封', '网站关键词', 'seo'),
        ('site_description', '盛安密封，高端包覆式密封条专业制造商，四层复合结构，自粘式安装。', '网站描述', 'seo'),
        ('top_banner', '源头工厂直供｜包覆式密封条现货批发，工程配套、来样定制', '顶部横幅标语', 'general'),
    ]
    for s in settings:
        db.execute('INSERT INTO settings (key, value, label, category) VALUES (?,?,?,?)', s)
    db.commit()
    db.close()
    print("[OK] 系统设置数据写入完成")

def seed_qr_codes():
    db = sqlite3.connect(DB_PATH)
    if db.execute('SELECT COUNT(*) FROM qr_codes').fetchone()[0] > 0:
        db.close()
        return
    qrs = [
        ('wechat', '微信客服', '悬浮侧边栏微信图标点击弹窗'),
        ('douyin', '抖音视频号', '悬浮侧边栏抖音图标点击弹窗'),
        ('pdd', '拼多多店铺', '底部联系区展示'),
    ]
    for q in qrs:
        db.execute('INSERT INTO qr_codes (type, label, description) VALUES (?,?,?)', q)
    db.commit()
    db.close()
    print("[OK] 二维码数据写入完成")

def seed_news():
    db = sqlite3.connect(DB_PATH)
    if db.execute('SELECT COUNT(*) FROM news').fetchone()[0] > 0:
        db.close()
        return
    news_list = [
        ('自贴式密封条5分钟快速安装教程——旧房改造必看', '安装教程',
         '详细图文步骤，手把手教您如何为推拉门、平开窗安装自贴式包覆密封条，无需工具，5分钟内完成安装。',
         '["安装教程","自贴式","旧房改造"]', '3分钟'),
        ('断桥铝门窗密封条选购指南：PVC vs PU包覆式，差距不止3倍', '行业科普',
         '市场上密封条质量参差不齐，本文深度对比PVC传统胶条和PU包覆式密封条在隔音、寿命、环保等方面的差异。',
         '["断桥铝密封条","选购指南","PU密封条"]', '5分钟'),
        ('盛安密封新品上市：加厚阳光房专用密封条，耐候性升级30%', '工厂资讯',
         '针对阳光房特殊使用环境（高温、强UV、大风雨），盛安研发推出新一代加厚阳光房专用密封条。',
         '["新品发布","阳光房密封条","耐候性"]', '2分钟'),
        ('门窗隔音改造完整方案：不拆窗，密封条就能解决80%漏音问题', '改造知识',
         '不少用户反映噪音困扰，其实大部分漏音都是密封不严导致的。本文分享一套低成本、高效的门窗隔音密封改造方案。',
         '["隔音改造","门窗密封","降噪方案"]', '6分钟'),
    ]
    for n in news_list:
        db.execute('INSERT INTO news (title, category, summary, tags, read_time) VALUES (?,?,?,?,?)', n)
    db.commit()
    db.close()
    print("[OK] 行业资讯数据写入完成")

if __name__ == '__main__':
    print("=" * 60)
    print("盛安密封官网 - 数据库初始化")
    print("=" * 60)

    print("\n[1/6] 初始化表结构...")
    init_db_schema()

    print("\n[2/6] 灌入8款产品数据...")
    seed_products()

    print("\n[3/6] 灌入细分产品...")
    seed_sub_products()

    print("\n[4/6] 灌入系统设置...")
    seed_settings()

    print("\n[5/6] 灌入二维码...")
    seed_qr_codes()

    print("\n[6/6] 灌入行业资讯...")
    seed_news()

    print("\n" + "=" * 60)
    print("数据库初始化全部完成！")
    print(f"数据库文件: {DB_PATH}")
    print(f"文件大小: {os.path.getsize(DB_PATH)} bytes")

    # 最终验证
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    rows = db.execute('SELECT id, name, gallery_images, detail_images FROM products ORDER BY sort_order').fetchall()
    total_gallery = 0
    total_detail = 0
    for r in rows:
        g = len(json.loads(r['gallery_images'])) if r['gallery_images'] else 0
        d = len(json.loads(r['detail_images'])) if r['detail_images'] else 0
        total_gallery += g
        total_detail += d
        print(f"  id={r['id']} | {r['name'][:30]}... | gallery={g}张 detail={d}张")
    db.close()
    print(f"\n  主图总计: {total_gallery}张 | 详情图总计: {total_detail}张 | 合计: {total_gallery + total_detail}张")
    print("=" * 60)
