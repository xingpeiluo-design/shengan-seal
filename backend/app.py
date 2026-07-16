#!/usr/bin/env python3
"""
盛安密封官网后端 API
Flask + SQLite 轻量级 CMS 后端
"""
import os
import json
import hashlib
import secrets
import sqlite3
from datetime import datetime
from functools import wraps
from flask import Flask, request, jsonify, g, send_from_directory
from flask_cors import CORS

# ============ 配置 ============
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'shengan.db')
STATIC_DIST = os.path.join(os.path.dirname(BASE_DIR), 'dist')
ADMIN_USER = 'admin'
ADMIN_PASS_HASH = hashlib.sha256('shengan2026'.encode()).hexdigest()
SECRET_KEY = secrets.token_hex(32)

app = Flask(__name__)
app.config['SECRET_KEY'] = SECRET_KEY
CORS(app)

# ============ 数据库 ============
def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute('PRAGMA journal_mode=WAL')
    return g.db

@app.teardown_appcontext
def close_db(exc):
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_db():
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
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
            image_url TEXT DEFAULT '',
            description TEXT DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS admin_tokens (
            token TEXT PRIMARY KEY,
            created_at TEXT DEFAULT (datetime('now','localtime'))
        );
    ''')
    db.commit()
    db.close()

def seed_data():
    """初始化种子数据"""
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    # 检查是否已有数据
    if db.execute('SELECT COUNT(*) as c FROM products').fetchone()['c'] == 0:
        products = [
            {
                'name': '自贴式包覆密封条', 'category': '拼多多C端·家装散户',
                'badge': '拼多多热销款', 'badge_color': '#e4323c',
                'highlights': json.dumps(['自带德国进口双面胶','免开槽·免打孔','旧房改装首选','5分钟极速安装']),
                'description': '主打旧房改装、门店零售、个人家装、小额散单。拼多多无起订量、现货充足、极速发货，包邮到家，适合个人消费者与小批量采购商。',
                'specs': json.dumps([
                    {'label':'规格','value':'4mm / 5mm / 6mm / 8mm / 10mm 均有'},
                    {'label':'颜色','value':'黑色 / 白色 / 定制色'},
                    {'label':'起订量','value':'1米起拍，无最低要求'},
                    {'label':'发货','value':'48小时内发货，全国包邮'}
                ]),
                'use_cases': json.dumps(['旧窗改造密封','门缝隔音隔风','家装门窗升级','阳台推拉门密封']),
                'bg_color': '#f0f9f4', 'border_color': '#7ecfa0',
                'price': '¥2.8/米起', 'pdd_link': 'https://mobile.yangkeduo.com'
            },
            {
                'name': '卡槽式包覆密封条', 'category': 'B端工程·批发合作',
                'badge': '工程配套主力款', 'badge_color': '#0F6637',
                'highlights': json.dumps(['TPU倒钩卡紧不掉','稳固耐用密封性强','大批量阶梯低价','支持OEM贴牌']),
                'description': '主打门窗厂大批量配套、阳光房工程、地产精装项目。支持对公长期合作、OEM贴牌定制、阶梯底价、含税开票，适配工厂、工程商、地产采购。',
                'specs': json.dumps([
                    {'label':'规格','value':'全系列宽度·卡槽尺寸定制'},
                    {'label':'起订量','value':'100米起批，10000米以上享底价'},
                    {'label':'合作方式','value':'含税报价·对公签约·经销授权'},
                    {'label':'定制','value':'来样开模，7-15天交期'}
                ]),
                'use_cases': json.dumps(['门窗厂长期配套','阳光房工程项目','地产精装楼盘','OEM贴牌代工']),
                'bg_color': '#f0f4f9', 'border_color': '#0F6637',
                'price': '¥2.2/米起', 'pdd_link': 'https://mobile.yangkeduo.com'
            },
        ]
        for p in products:
            db.execute('''
                INSERT INTO products (name, category, badge, badge_color, highlights, description, specs, use_cases, bg_color, border_color, price, pdd_link)
                VALUES (:name, :category, :badge, :badge_color, :highlights, :description, :specs, :use_cases, :bg_color, :border_color, :price, :pdd_link)
            ''', p)

    if db.execute('SELECT COUNT(*) as c FROM sub_products').fetchone()['c'] == 0:
        subs = [
            {'name': '断桥铝专用密封条', 'icon': '🪟', 'description': '专为断桥铝型材设计，完美卡槽适配，工厂量产批量供应'},
            {'name': '阳光房专用密封条', 'icon': '🌤️', 'description': '耐候性强，抗UV，高温低温不变形，工程配套首选'},
            {'name': '室内木门隔音密封条', 'icon': '🚪', 'description': '超强隔音效果，母婴级环保，家装工程均适用'},
            {'name': '推拉门密封胶条', 'icon': '↔️', 'description': '高耐磨PU材质，推拉顺滑，防尘防风，长效耐用'},
        ]
        for i, s in enumerate(subs):
            s['sort_order'] = i
            db.execute('INSERT INTO sub_products (name, icon, description, sort_order) VALUES (:name, :icon, :description, :sort_order)', s)

    if db.execute('SELECT COUNT(*) as c FROM news').fetchone()['c'] == 0:
        news_list = [
            {'title': '自贴式密封条5分钟快速安装教程——旧房改造必看', 'category': '安装教程',
             'summary': '详细图文步骤，手把手教您如何为推拉门、平开窗安装自贴式包覆密封条，无需工具，5分钟内完成安装...',
             'tags': json.dumps(['安装教程','自贴式','旧房改造']), 'read_time': '3分钟'},
            {'title': '断桥铝门窗密封条选购指南：PVC vs PU包覆式，差距不止3倍', 'category': '行业科普',
             'summary': '市场上密封条质量参差不齐，本文深度对比PVC传统胶条和PU包覆式密封条在隔音、寿命、环保等方面的差异...',
             'tags': json.dumps(['断桥铝密封条','选购指南','PU密封条']), 'read_time': '5分钟'},
            {'title': '盛安密封新品上市：加厚阳光房专用密封条，耐候性升级30%', 'category': '工厂资讯',
             'summary': '针对阳光房特殊使用环境（高温、强UV、大风雨），盛安研发推出新一代加厚阳光房专用密封条，全面升级...',
             'tags': json.dumps(['新品发布','阳光房密封条','耐候性']), 'read_time': '2分钟'},
            {'title': '2026年国家门窗密封条检测标准更新解读，厂家必看', 'category': '建材标准',
             'summary': '国家最新建材检测标准对门窗密封条的VOC、压缩永久变形率、热老化性能提出更高要求，盛安全系产品已满足...',
             'tags': json.dumps(['检测标准','合规','环保']), 'read_time': '4分钟'},
            {'title': '门窗隔音改造完整方案：不拆窗，密封条就能解决80%漏音问题', 'category': '改造知识',
             'summary': '不少用户反映噪音困扰，其实大部分漏音都是密封不严导致的。本文分享一套低成本、高效的门窗隔音密封改造方案...',
             'tags': json.dumps(['隔音改造','门窗密封','降噪方案']), 'read_time': '6分钟'},
            {'title': '温州/浙江地区门窗厂密封材料采购渠道深度整理', 'category': 'SEO专题',
             'summary': '整理了温州及浙江地区门窗加工厂、阳光房工程公司、装修公司的密封材料主流采购渠道和价格区间，供参考...',
             'tags': json.dumps(['温州密封条','门窗厂配套','本地工程']), 'read_time': '4分钟'},
        ]
        for n in news_list:
            db.execute('''
                INSERT INTO news (title, category, summary, tags, read_time)
                VALUES (:title, :category, :summary, :tags, :read_time)
            ''', n)

    if db.execute('SELECT COUNT(*) as c FROM settings').fetchone()['c'] == 0:
        settings = [
            ('pdd_link', 'https://mobile.yangkeduo.com', '拼多多店铺链接', 'channel'),
            ('pdd_link_1688', 'https://shop.1688.com', '1688批发链接', 'channel'),
            ('hotline', '400-888-SEAL', '采购热线', 'contact'),
            ('factory_phone', '138-0000-1234', '工厂直线', 'contact'),
            ('address', '浙江省温州市某某工业园区XX路XX号', '厂区地址', 'contact'),
            ('work_hours', '周一至周六 8:00-18:00', '工作时间', 'contact'),
            ('company_name', '盛安密封科技有限公司', '公司名称', 'contact'),
            ('company_name_en', 'Shengan Sealing Technology Co., Ltd.', '公司英文名', 'contact'),
            ('copyright', '© 2026 盛安密封科技有限公司 版权所有', '版权信息', 'general'),
            ('icp', '浙ICP备XXXXXXXX号', 'ICP备案号', 'general'),
            ('site_title', '盛安密封 - 高端包覆式密封条源头制造商', '网站标题', 'seo'),
            ('site_keywords', '包覆式密封条,门窗密封条,断桥铝密封胶条', '网站关键词', 'seo'),
            ('site_description', '盛安密封，高端包覆式密封条专业制造商，四层复合结构...', '网站描述', 'seo'),
            ('top_banner', '源头工厂直供｜包覆式密封条现货批发，工程配套、来样定制', '顶部横幅标语', 'general'),
        ]
        for s in settings:
            db.execute('INSERT INTO settings (key, value, label, category) VALUES (?,?,?,?)', s)

    if db.execute('SELECT COUNT(*) as c FROM qr_codes').fetchone()['c'] == 0:
        qrs = [
            {'type': 'wechat', 'label': '微信客服', 'description': '悬浮侧边栏微信图标点击弹窗'},
            {'type': 'douyin', 'label': '抖音视频号', 'description': '悬浮侧边栏抖音图标点击弹窗'},
            {'type': 'pdd', 'label': '拼多多店铺', 'description': '底部联系区展示'},
        ]
        for q in qrs:
            db.execute('INSERT INTO qr_codes (type, label, description) VALUES (:type, :label, :description)', q)

    db.commit()
    db.close()

# ============ 认证 ============
def generate_token(user='admin'):
    token = secrets.token_hex(24)
    db = get_db()
    try:
        db.execute('INSERT INTO admin_tokens (token, user) VALUES (?, ?)', (token, user))
    except sqlite3.IntegrityError:
        # 兼容旧表结构（无 user 字段）
        db.execute('INSERT INTO admin_tokens (token) VALUES (?)', (token,))
    db.commit()
    return token

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get('Authorization', '')
        token = ''
        if auth.startswith('Bearer '):
            token = auth[7:]
        if not token:
            return jsonify({'error': '未登录'}), 401
        db = get_db()
        row = db.execute('SELECT * FROM admin_tokens WHERE token=?', (token,)).fetchone()
        if not row:
            return jsonify({'error': '登录已过期'}), 401
        return f(*args, **kwargs)
    return decorated

# ============ API 路由 ============

# --- 认证 ---
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    user = data.get('user', '')
    pwd = data.get('pass', '')
    pwd_hash = hashlib.sha256(pwd.encode()).hexdigest()
    if user == ADMIN_USER and pwd_hash == ADMIN_PASS_HASH:
        token = generate_token()
        return jsonify({'token': token, 'user': user})
    return jsonify({'error': '账号或密码错误'}), 401

@app.route('/api/auth/verify', methods=['GET'])
def verify():
    auth = request.headers.get('Authorization', '')
    token = auth[7:] if auth.startswith('Bearer ') else ''
    if not token:
        return jsonify({'valid': False}), 401
    db = get_db()
    row = db.execute('SELECT * FROM admin_tokens WHERE token=?', (token,)).fetchone()
    return jsonify({'valid': bool(row)})

# --- 产品 ---
@app.route('/api/products', methods=['GET'])
def get_products():
    db = get_db()
    rows = db.execute('SELECT * FROM products WHERE status="上架" ORDER BY sort_order, id').fetchall()
    result = []
    for r in rows:
        item = dict(r)
        item['highlights'] = json.loads(item['highlights'])
        item['specs'] = json.loads(item['specs'])
        item['use_cases'] = json.loads(item['use_cases'])
        item['gallery_images'] = json.loads(item['gallery_images']) if item.get('gallery_images') else []
        item['detail_images'] = json.loads(item['detail_images']) if item.get('detail_images') else []
        result.append(item)
    return jsonify(result)

@app.route('/api/admin/products', methods=['GET'])
@require_auth
def admin_get_products():
    db = get_db()
    rows = db.execute('SELECT * FROM products ORDER BY sort_order, id').fetchall()
    result = []
    for r in rows:
        item = dict(r)
        for field in ('highlights', 'specs', 'use_cases', 'gallery_images', 'detail_images'):
            try:
                item[field] = json.loads(item[field]) if item.get(field) else []
            except (json.JSONDecodeError, TypeError):
                item[field] = []
        result.append(item)
    return jsonify(result)

@app.route('/api/admin/products', methods=['POST'])
@require_auth
def admin_create_product():
    data = request.get_json()
    db = get_db()
    db.execute('''
        INSERT INTO products (name, category, badge, badge_color, highlights, description, specs, use_cases, bg_color, border_color, price, stock, pdd_link, status, sort_order, image_url, gallery_images, detail_images)
        VALUES (:name, :category, :badge, :badge_color, :highlights, :description, :specs, :use_cases, :bg_color, :border_color, :price, :stock, :pdd_link, :status, :sort_order, :image_url, :gallery_images, :detail_images)
    ''', {
        'name': data.get('name',''), 'category': data.get('category',''),
        'badge': data.get('badge',''), 'badge_color': data.get('badge_color','#0F6637'),
        'highlights': json.dumps(data.get('highlights',[]), ensure_ascii=False),
        'description': data.get('description',''),
        'specs': json.dumps(data.get('specs',[]), ensure_ascii=False),
        'use_cases': json.dumps(data.get('use_cases',[]), ensure_ascii=False),
        'bg_color': data.get('bg_color','#f0f9f4'), 'border_color': data.get('border_color','#7ecfa0'),
        'price': data.get('price',''), 'stock': data.get('stock','充足'),
        'pdd_link': data.get('pdd_link','https://mobile.yangkeduo.com'),
        'status': data.get('status','上架'), 'sort_order': data.get('sort_order',0),
        'image_url': data.get('image_url',''),
        'gallery_images': json.dumps(data.get('gallery_images',[]), ensure_ascii=False),
        'detail_images': json.dumps(data.get('detail_images',[]), ensure_ascii=False)
    })
    db.commit()
    return jsonify({'ok': True, 'id': db.execute('SELECT last_insert_rowid()').fetchone()[0]})

@app.route('/api/admin/products/<int:pid>', methods=['PUT'])
@require_auth
def admin_update_product(pid):
    data = request.get_json()
    db = get_db()
    fields = ['name','category','badge','badge_color','highlights','description','specs','use_cases','bg_color','border_color','price','stock','pdd_link','status','sort_order','image_url','gallery_images','detail_images']
    updates = []
    values = {}
    for f in fields:
        if f in data:
            updates.append(f'{f}=:{f}')
            if f in ('highlights','specs','use_cases','gallery_images','detail_images'):
                values[f] = json.dumps(data[f], ensure_ascii=False) if isinstance(data[f], (list, dict)) else data[f]
            else:
                values[f] = data[f]
    if not updates:
        return jsonify({'ok': True, 'msg': '无更新'})
    updates.append("updated_at=datetime('now','localtime')")
    values['id'] = pid
    db.execute(f"UPDATE products SET {','.join(updates)} WHERE id=:id", values)
    db.commit()
    return jsonify({'ok': True})

@app.route('/api/admin/products/<int:pid>', methods=['DELETE'])
@require_auth
def admin_delete_product(pid):
    db = get_db()
    db.execute('DELETE FROM products WHERE id=?', (pid,))
    db.commit()
    return jsonify({'ok': True})

# --- 单品详情（前端路由用） ---
@app.route('/api/products/<int:pid>', methods=['GET'])
def get_product_detail(pid):
    db = get_db()
    row = db.execute('SELECT * FROM products WHERE id=?', (pid,)).fetchone()
    if not row:
        return jsonify({'error': '产品不存在'}), 404
    item = dict(row)
    item['highlights'] = json.loads(item['highlights'])
    item['specs'] = json.loads(item['specs'])
    item['use_cases'] = json.loads(item['use_cases'])
    item['gallery_images'] = json.loads(item['gallery_images']) if item.get('gallery_images') else []
    item['detail_images'] = json.loads(item['detail_images']) if item.get('detail_images') else []
    return jsonify(item)

# --- 图片上传 ---
@app.route('/api/admin/upload', methods=['POST'])
@require_auth
def upload_image():
    if 'file' not in request.files:
        return jsonify({'error': '没有文件'}), 400
    files = request.files.getlist('file')
    if not files or files[0].filename == '':
        return jsonify({'error': '文件为空'}), 400
    
    upload_dir = os.path.join(STATIC_DIST, 'images', 'products')
    os.makedirs(upload_dir, exist_ok=True)
    
    uploaded = []
    for f in files:
        if f.filename:
            # 生成唯一文件名
            ext = os.path.splitext(f.filename)[1].lower()
            if ext not in ('.jpg', '.jpeg', '.png', '.gif', '.webp'):
                ext = '.jpg'
            filename = f"{secrets.token_hex(8)}{ext}"
            filepath = os.path.join(upload_dir, filename)
            f.save(filepath)
            uploaded.append(f'/images/products/{filename}')
    
    return jsonify({'ok': True, 'urls': uploaded})

# --- 细分产品 ---
@app.route('/api/sub-products', methods=['GET'])
def get_sub_products():
    db = get_db()
    rows = db.execute('SELECT * FROM sub_products ORDER BY sort_order, id').fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/admin/sub-products', methods=['POST','PUT','DELETE'])
@require_auth
def manage_sub_products():
    db = get_db()
    if request.method == 'POST':
        data = request.get_json()
        db.execute('INSERT INTO sub_products (name, icon, description, sort_order) VALUES (?,?,?,?)',
                   (data.get('name',''), data.get('icon',''), data.get('description',''), data.get('sort_order',0)))
        db.commit()
        return jsonify({'ok': True})
    elif request.method == 'PUT':
        data = request.get_json()
        sid = data.get('id')
        db.execute('UPDATE sub_products SET name=?, icon=?, description=?, sort_order=? WHERE id=?',
                   (data.get('name',''), data.get('icon',''), data.get('description',''), data.get('sort_order',0), sid))
        db.commit()
        return jsonify({'ok': True})
    else:
        sid = request.args.get('id')
        db.execute('DELETE FROM sub_products WHERE id=?', (sid,))
        db.commit()
        return jsonify({'ok': True})

# --- 资讯 ---
@app.route('/api/news', methods=['GET'])
def get_news():
    db = get_db()
    category = request.args.get('category')
    if category and category != '全部':
        rows = db.execute('SELECT * FROM news WHERE published=1 AND category=? ORDER BY id DESC', (category,)).fetchall()
    else:
        rows = db.execute('SELECT * FROM news WHERE published=1 ORDER BY id DESC').fetchall()
    result = []
    for r in rows:
        item = dict(r)
        item['tags'] = json.loads(item['tags'])
        result.append(item)
    return jsonify(result)

@app.route('/api/news/<int:nid>', methods=['GET'])
def get_news_detail(nid):
    db = get_db()
    db.execute('UPDATE news SET views=views+1 WHERE id=?', (nid,))
    db.commit()
    row = db.execute('SELECT * FROM news WHERE id=?', (nid,)).fetchone()
    if not row:
        return jsonify({'error': '不存在'}), 404
    item = dict(row)
    item['tags'] = json.loads(item['tags'])
    return jsonify(item)

@app.route('/api/admin/news', methods=['GET'])
@require_auth
def admin_get_news():
    db = get_db()
    rows = db.execute('SELECT * FROM news ORDER BY id DESC').fetchall()
    result = []
    for r in rows:
        item = dict(r)
        item['tags'] = json.loads(item['tags'])
        result.append(item)
    return jsonify(result)

@app.route('/api/admin/news', methods=['POST'])
@require_auth
def admin_create_news():
    data = request.get_json()
    db = get_db()
    db.execute('''
        INSERT INTO news (title, category, summary, content, tags, read_time, published)
        VALUES (:title, :category, :summary, :content, :tags, :read_time, :published)
    ''', {
        'title': data.get('title',''), 'category': data.get('category',''),
        'summary': data.get('summary',''), 'content': data.get('content',''),
        'tags': json.dumps(data.get('tags',[]), ensure_ascii=False),
        'read_time': data.get('read_time','3分钟'),
        'published': data.get('published',1)
    })
    db.commit()
    return jsonify({'ok': True, 'id': db.execute('SELECT last_insert_rowid()').fetchone()[0]})

@app.route('/api/admin/news/<int:nid>', methods=['PUT'])
@require_auth
def admin_update_news(nid):
    data = request.get_json()
    db = get_db()
    db.execute('''
        UPDATE news SET title=:title, category=:category, summary=:summary, content=:content,
        tags=:tags, read_time=:read_time, published=:published, updated_at=datetime('now','localtime')
        WHERE id=:id
    ''', {
        'id': nid, 'title': data.get('title',''), 'category': data.get('category',''),
        'summary': data.get('summary',''), 'content': data.get('content',''),
        'tags': json.dumps(data.get('tags',[]), ensure_ascii=False),
        'read_time': data.get('read_time','3分钟'),
        'published': data.get('published',1)
    })
    db.commit()
    return jsonify({'ok': True})

@app.route('/api/admin/news/<int:nid>', methods=['DELETE'])
@require_auth
def admin_delete_news(nid):
    db = get_db()
    db.execute('DELETE FROM news WHERE id=?', (nid,))
    db.commit()
    return jsonify({'ok': True})

# --- 留言（公开提交 + 管理后台） ---
@app.route('/api/messages', methods=['POST'])
def submit_message():
    data = request.get_json()
    db = get_db()
    db.execute('''
        INSERT INTO messages (name, company, phone, need, product, source)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (data.get('name',''), data.get('company',''), data.get('phone',''),
          data.get('need',''), data.get('product',''), data.get('source','contact')))
    db.commit()
    return jsonify({'ok': True, 'msg': '留言提交成功'})

@app.route('/api/samples', methods=['POST'])
def submit_sample():
    data = request.get_json()
    db = get_db()
    db.execute('''
        INSERT INTO samples (name, phone, company, address, product, note)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (data.get('name',''), data.get('phone',''), data.get('company',''),
          data.get('address',''), data.get('product',''), data.get('note','')))
    db.commit()
    return jsonify({'ok': True, 'msg': '寄样申请提交成功'})

@app.route('/api/admin/messages', methods=['GET'])
@require_auth
def admin_get_messages():
    db = get_db()
    status = request.args.get('status')
    if status:
        rows = db.execute('SELECT * FROM messages WHERE status=? ORDER BY id DESC', (status,)).fetchall()
    else:
        rows = db.execute('SELECT * FROM messages ORDER BY id DESC').fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/admin/messages/<int:mid>', methods=['PUT'])
@require_auth
def admin_update_message(mid):
    data = request.get_json()
    db = get_db()
    if 'status' in data:
        db.execute('UPDATE messages SET status=? WHERE id=?', (data['status'], mid))
        db.commit()
    return jsonify({'ok': True})

@app.route('/api/admin/messages/<int:mid>', methods=['DELETE'])
@require_auth
def admin_delete_message(mid):
    db = get_db()
    db.execute('DELETE FROM messages WHERE id=?', (mid,))
    db.commit()
    return jsonify({'ok': True})

# --- 寄样申请管理 ---
@app.route('/api/admin/samples', methods=['GET'])
@require_auth
def admin_get_samples():
    db = get_db()
    rows = db.execute('SELECT * FROM samples ORDER BY id DESC').fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/admin/samples/<int:sid>', methods=['PUT'])
@require_auth
def admin_update_sample(sid):
    data = request.get_json()
    db = get_db()
    if 'status' in data:
        db.execute('UPDATE samples SET status=? WHERE id=?', (data['status'], sid))
        db.commit()
    return jsonify({'ok': True})

@app.route('/api/admin/samples/<int:sid>', methods=['DELETE'])
@require_auth
def admin_delete_sample(sid):
    db = get_db()
    db.execute('DELETE FROM samples WHERE id=?', (sid,))
    db.commit()
    return jsonify({'ok': True})

# --- 设置 ---
@app.route('/api/settings', methods=['GET'])
def get_settings():
    db = get_db()
    rows = db.execute('SELECT * FROM settings').fetchall()
    return jsonify({r['key']: r['value'] for r in rows})

@app.route('/api/admin/settings', methods=['GET'])
@require_auth
def admin_get_settings():
    db = get_db()
    rows = db.execute('SELECT * FROM settings ORDER BY category, key').fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/admin/settings', methods=['PUT'])
@require_auth
def admin_update_settings():
    data = request.get_json()
    db = get_db()
    for key, value in data.items():
        db.execute('UPDATE settings SET value=? WHERE key=?', (value, key))
    db.commit()
    return jsonify({'ok': True})

# --- 二维码 ---
@app.route('/api/qr-codes', methods=['GET'])
def get_qr_codes():
    db = get_db()
    rows = db.execute('SELECT * FROM qr_codes').fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/admin/qr-codes/<int:qid>', methods=['PUT'])
@require_auth
def admin_update_qr(qid):
    data = request.get_json()
    db = get_db()
    db.execute('UPDATE qr_codes SET label=?, image_url=?, description=? WHERE id=?',
               (data.get('label',''), data.get('image_url',''), data.get('description',''), qid))
    db.commit()
    return jsonify({'ok': True})

# --- 统计 ---
@app.route('/api/admin/stats', methods=['GET'])
@require_auth
def admin_stats():
    db = get_db()
    today = datetime.now().strftime('%Y-%m-%d')
    stats = {
        'total_messages': db.execute('SELECT COUNT(*) as c FROM messages').fetchone()['c'],
        'pending_messages': db.execute("SELECT COUNT(*) as c FROM messages WHERE status='待跟进'").fetchone()['c'],
        'total_samples': db.execute('SELECT COUNT(*) as c FROM samples').fetchone()['c'],
        'pending_samples': db.execute("SELECT COUNT(*) as c FROM samples WHERE status='待处理'").fetchone()['c'],
        'total_products': db.execute('SELECT COUNT(*) as c FROM products').fetchone()['c'],
        'total_news': db.execute('SELECT COUNT(*) as c FROM news').fetchone()['c'],
        'today_messages': db.execute("SELECT COUNT(*) as c FROM messages WHERE date(created_at)=date('now','localtime')").fetchone()['c'],
        'today_samples': db.execute("SELECT COUNT(*) as c FROM samples WHERE date(created_at)=date('now','localtime')").fetchone()['c'],
    }
    return jsonify(stats)

# --- 导出留言 CSV ---
@app.route('/api/admin/messages/export', methods=['GET'])
@require_auth
def export_messages():
    db = get_db()
    rows = db.execute('SELECT * FROM messages ORDER BY id DESC').fetchall()
    import csv, io
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['ID','姓名','公司','电话','需求','意向产品','状态','来源','时间'])
    for r in rows:
        writer.writerow([r['id'], r['name'], r['company'], r['phone'], r['need'], r['product'], r['status'], r['source'], r['created_at']])
    from flask import Response
    return Response(
        '\ufeff' + output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=messages.csv'}
    )

# --- 前端静态文件（生产环境） ---
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if path and os.path.exists(os.path.join(STATIC_DIST, path)):
        return send_from_directory(STATIC_DIST, path)
    return send_from_directory(STATIC_DIST, 'index.html')

# ============ 启动 ============
if __name__ == '__main__':
    init_db()
    seed_data()
    app.run(host='0.0.0.0', port=5000, debug=True)
else:
    init_db()
    seed_data()
