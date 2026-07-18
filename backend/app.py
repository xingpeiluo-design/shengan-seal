#!/usr/bin/env python3
"""
盛安密封官网后端 API
Flask + SQLite 轻量级 CMS 后端
"""
import os
import json
import csv
import io
import zipfile
import hashlib
import secrets
import sqlite3
import shutil
import tempfile
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, request, jsonify, g, send_from_directory
from flask_cors import CORS

# ============ 配置 ============
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'shengan.db')
STATIC_DIST = os.path.join(os.path.dirname(BASE_DIR), 'dist')
IMAGES_DIR = os.path.join(os.path.dirname(BASE_DIR), 'images')
ADMIN_USER = 'admin'
ADMIN_PASS_HASH = hashlib.sha256('shengan2026'.encode()).hexdigest()

# --- 站点 URL（用于 sitemap、robots.txt、SEO 等） ---
# 售卖标准：自动从请求头推断，避免硬编码客户域名/IP
#   1. 环境变量 SHENGAN_SITE_URL（如需强制指定）
#   2. 请求的 Host 头 + X-Forwarded-Proto（nginx 反代后的真实地址）
# 这样客户部署到任意域名/IP，sitemap/robots 都自动指向正确的地址
SITE_URL = os.environ.get('SHENGAN_SITE_URL', '').rstrip('/')  # 为空时运行时动态推断

# --- SECRET_KEY 持久化 ---
# 优先级：环境变量 > 持久化文件 > 首次启动生成
_SECRET_KEY_FILE = os.path.join(BASE_DIR, '.secret_key')
_env_secret = os.environ.get('SHENGAN_SECRET_KEY')
if _env_secret:
    SECRET_KEY = _env_secret
elif os.path.exists(_SECRET_KEY_FILE):
    with open(_SECRET_KEY_FILE, 'r') as _f:
        SECRET_KEY = _f.read().strip()
else:
    SECRET_KEY = secrets.token_hex(32)
    try:
        with open(_SECRET_KEY_FILE, 'w') as _f:
            _f.write(SECRET_KEY)
        os.chmod(_SECRET_KEY_FILE, 0o600)  # 仅 root 可读写
    except Exception as _e:
        print(f'[WARN] 无法写入 SECRET_KEY 持久化文件: {_e}')

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
            short_name TEXT DEFAULT '',
            is_test INTEGER DEFAULT 0,
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
            is_test INTEGER DEFAULT 0,
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
            user TEXT DEFAULT 'admin',
            expires_at TEXT,
            created_at TEXT DEFAULT (datetime('now','localtime'))
        );

        CREATE TABLE IF NOT EXISTS admin_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'admin',
            status TEXT DEFAULT 'active',
            last_login_at TEXT,
            last_login_ip TEXT,
            failed_attempts INTEGER DEFAULT 0,
            locked_until TEXT,
            remark TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now','localtime'))
        );

        CREATE TABLE IF NOT EXISTS login_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            ip TEXT,
            user_agent TEXT,
            success INTEGER DEFAULT 0,
            reason TEXT,
            created_at TEXT DEFAULT (datetime('now','localtime'))
        );
    ''')
    db.commit()
    db.close()
    _migrate_columns()
    _auto_cleanup()

def _auto_cleanup():
    """启动时自动清理过期数据"""
    try:
        db = sqlite3.connect(DB_PATH)
        db.row_factory = sqlite3.Row
        # 清理 90 天前的登录日志
        cutoff_logs = (datetime.now() - timedelta(days=90)).strftime('%Y-%m-%d %H:%M:%S')
        deleted_logs = db.execute('DELETE FROM login_logs WHERE created_at < ?', (cutoff_logs,)).rowcount
        # 清理过期 token
        deleted_tokens = db.execute('DELETE FROM admin_tokens WHERE expires_at IS NOT NULL AND expires_at < datetime("now","localtime")').rowcount
        db.commit()
        db.close()
        if deleted_logs or deleted_tokens:
            print(f'[CLEANUP] 清理 {deleted_logs} 条过期日志，{deleted_tokens} 个过期 token')
    except Exception as e:
        print(f'[CLEANUP] 清理失败: {e}')

def _column_exists(db, table, column):
    """幂等迁移检查：列是否存在"""
    rows = db.execute(f'PRAGMA table_info({table})').fetchall()
    return any(r[1] == column for r in rows)

def _migrate_columns():
    """幂等迁移：为已存在的表补充新列"""
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    migrations = [
        ('products', 'short_name', "ALTER TABLE products ADD COLUMN short_name TEXT DEFAULT ''"),
        ('products', 'is_test', 'ALTER TABLE products ADD COLUMN is_test INTEGER DEFAULT 0'),
        ('news', 'is_test', 'ALTER TABLE news ADD COLUMN is_test INTEGER DEFAULT 0'),
        ('messages', 'is_test', 'ALTER TABLE messages ADD COLUMN is_test INTEGER DEFAULT 0'),
        ('messages', 'email', "ALTER TABLE messages ADD COLUMN email TEXT DEFAULT ''"),
        ('messages', 'subject', "ALTER TABLE messages ADD COLUMN subject TEXT DEFAULT ''"),
        ('samples', 'is_test', 'ALTER TABLE samples ADD COLUMN is_test INTEGER DEFAULT 0'),
        ('samples', 'quantity', "ALTER TABLE samples ADD COLUMN quantity TEXT DEFAULT ''"),
        ('admin_tokens', 'user', "ALTER TABLE admin_tokens ADD COLUMN user TEXT DEFAULT 'admin'"),
        ('admin_tokens', 'expires_at', "ALTER TABLE admin_tokens ADD COLUMN expires_at TEXT"),
        ('admin_users', 'remark', "ALTER TABLE admin_users ADD COLUMN remark TEXT DEFAULT ''"),
        ('login_logs', 'user_agent', "ALTER TABLE login_logs ADD COLUMN user_agent TEXT DEFAULT ''"),
    ]
    for table, col, sql in migrations:
        if not _column_exists(db, table, col):
            try:
                db.execute(sql)
                print(f'[migrate] {table}.{col} added')
            except Exception as e:
                print(f'[migrate] {table}.{col} skipped: {e}')

    # 迁移默认 admin 账号到 admin_users 表
    if db.execute('SELECT COUNT(*) as c FROM admin_users').fetchone()['c'] == 0:
        try:
            db.execute(
                'INSERT INTO admin_users (username, password_hash, role, remark) VALUES (?, ?, ?, ?)',
                (ADMIN_USER, ADMIN_PASS_HASH, 'super_admin', '系统初始化账号（自动迁移）')
            )
            print('[migrate] 默认 admin 账号已迁移到 admin_users')
        except Exception as e:
            print(f'[migrate] 默认账号迁移失败: {e}')

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
            ('icp', '', 'ICP备案号', 'general'),
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
# 锁定策略
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 30
# Token 有效期
TOKEN_EXPIRE_HOURS = 8

def _get_client_ip():
    """获取客户端 IP（考虑 nginx 反代）"""
    return request.headers.get('X-Real-IP') or request.headers.get('X-Forwarded-For', '').split(',')[0].strip() or request.remote_addr or ''

def _log_login(username, success, reason=''):
    """记录登录日志"""
    db = get_db()
    db.execute(
        'INSERT INTO login_logs (username, ip, user_agent, success, reason) VALUES (?, ?, ?, ?, ?)',
        (username, _get_client_ip(), request.headers.get('User-Agent', '')[:200], 1 if success else 0, reason)
    )
    db.commit()

def _hash_password(pwd):
    return hashlib.sha256(pwd.encode()).hexdigest()

def generate_token(user='admin'):
    token = secrets.token_hex(24)
    expires_at = (datetime.now() + timedelta(hours=TOKEN_EXPIRE_HOURS)).strftime('%Y-%m-%d %H:%M:%S')
    db = get_db()
    try:
        db.execute('INSERT INTO admin_tokens (token, user, expires_at) VALUES (?, ?, ?)', (token, user, expires_at))
    except sqlite3.IntegrityError:
        # 兼容旧表结构（无 user/expires_at 字段）
        try:
            db.execute('INSERT INTO admin_tokens (token, user, expires_at) VALUES (?, ?, ?)', (token, user, expires_at))
        except Exception:
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
        # 检查 token 是否过期
        if 'expires_at' in row.keys() and row['expires_at']:
            try:
                expires_at = datetime.strptime(row['expires_at'], '%Y-%m-%d %H:%M:%S')
                if expires_at < datetime.now():
                    # 删除过期 token
                    db.execute('DELETE FROM admin_tokens WHERE token=?', (token,))
                    db.commit()
                    return jsonify({'error': '登录已过期，请重新登录'}), 401
            except (ValueError, TypeError):
                pass
        # 将当前用户信息注入 g，供后续接口使用
        g.current_user = row['user'] if 'user' in row.keys() and row['user'] else 'admin'
        return f(*args, **kwargs)
    return decorated

def require_super_admin(f):
    """要求超级管理员权限"""
    @wraps(f)
    @require_auth
    def decorated(*args, **kwargs):
        db = get_db()
        row = db.execute('SELECT role FROM admin_users WHERE username=?', (g.current_user,)).fetchone()
        if not row or row['role'] != 'super_admin':
            return jsonify({'error': '需要超级管理员权限'}), 403
        return f(*args, **kwargs)
    return decorated

# ============ API 路由 ============

# --- 认证 ---
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    user = (data.get('user') or '').strip()
    pwd = data.get('pass') or ''
    if not user or not pwd:
        return jsonify({'error': '账号和密码不能为空'}), 400

    pwd_hash = _hash_password(pwd)
    db = get_db()
    row = db.execute('SELECT * FROM admin_users WHERE username=?', (user,)).fetchone()

    if not row:
        _log_login(user, False, '账号不存在')
        return jsonify({'error': '账号或密码错误'}), 401

    # 检查账号状态
    if row['status'] != 'active':
        _log_login(user, False, '账号已禁用')
        return jsonify({'error': '账号已被禁用，请联系超级管理员'}), 403

    # 检查锁定状态
    if row['locked_until']:
        try:
            locked_until_dt = datetime.strptime(row['locked_until'], '%Y-%m-%d %H:%M:%S')
            if locked_until_dt > datetime.now():
                remaining = int((locked_until_dt - datetime.now()).total_seconds() // 60) + 1
                _log_login(user, False, f'账号锁定中（还剩{remaining}分钟）')
                return jsonify({
                    'error': f'登录失败次数过多，账号已锁定，还剩 {remaining} 分钟',
                    'locked': True,
                    'remaining_minutes': remaining
                }), 423
        except (ValueError, TypeError):
            pass

    # 验证密码
    if pwd_hash != row['password_hash']:
        # 累计失败次数
        failed = (row['failed_attempts'] or 0) + 1
        locked_until = None
        if failed >= MAX_FAILED_ATTEMPTS:
            locked_until = (datetime.now() + timedelta(minutes=LOCKOUT_MINUTES)).strftime('%Y-%m-%d %H:%M:%S')
            reason = f'密码错误（连续{failed}次，已锁定{LOCKOUT_MINUTES}分钟）'
        else:
            reason = f'密码错误（连续{failed}次）'
        db.execute('UPDATE admin_users SET failed_attempts=?, locked_until=? WHERE id=?',
                   (failed, locked_until, row['id']))
        db.commit()
        _log_login(user, False, reason)
        remaining_attempts = max(0, MAX_FAILED_ATTEMPTS - failed)
        if locked_until:
            return jsonify({
                'error': f'密码错误，账号已锁定 {LOCKOUT_MINUTES} 分钟',
                'locked': True
            }), 423
        return jsonify({
            'error': f'账号或密码错误，还剩 {remaining_attempts} 次尝试机会',
            'remaining_attempts': remaining_attempts
        }), 401

    # 登录成功
    db.execute('UPDATE admin_users SET failed_attempts=0, locked_until=NULL, last_login_at=?, last_login_ip=? WHERE id=?',
               (datetime.now().strftime('%Y-%m-%d %H:%M:%S'), _get_client_ip(), row['id']))
    db.commit()
    _log_login(user, True, '登录成功')
    token = generate_token(user)
    return jsonify({'token': token, 'user': user, 'role': row['role']})

@app.route('/api/auth/change-password', methods=['POST'])
@require_auth
def change_password():
    """当前用户修改自己的密码"""
    data = request.get_json() or {}
    old_pwd = data.get('old_password') or ''
    new_pwd = data.get('new_password') or ''
    if not old_pwd or not new_pwd:
        return jsonify({'error': '原密码和新密码不能为空'}), 400
    if len(new_pwd) < 6:
        return jsonify({'error': '新密码至少6位'}), 400

    db = get_db()
    row = db.execute('SELECT * FROM admin_users WHERE username=?', (g.current_user,)).fetchone()
    if not row:
        return jsonify({'error': '账号不存在'}), 404
    if _hash_password(old_pwd) != row['password_hash']:
        return jsonify({'error': '原密码错误'}), 401

    db.execute('UPDATE admin_users SET password_hash=? WHERE id=?', (_hash_password(new_pwd), row['id']))
    db.commit()
    return jsonify({'ok': True, 'message': '密码修改成功'})

@app.route('/api/auth/verify', methods=['GET'])
def verify():
    auth = request.headers.get('Authorization', '')
    token = auth[7:] if auth.startswith('Bearer ') else ''
    if not token:
        return jsonify({'valid': False}), 401
    db = get_db()
    row = db.execute('SELECT * FROM admin_tokens WHERE token=?', (token,)).fetchone()
    if not row:
        return jsonify({'valid': False}), 401
    user = row['user'] if 'user' in row.keys() and row['user'] else 'admin'
    # 查询角色
    role_row = db.execute('SELECT role, status FROM admin_users WHERE username=?', (user,)).fetchone()
    role = role_row['role'] if role_row else 'admin'
    return jsonify({'valid': True, 'user': user, 'role': role})

# --- 账号管理（仅超级管理员） ---
@app.route('/api/admin/users', methods=['GET'])
@require_super_admin
def admin_list_users():
    """账号列表"""
    db = get_db()
    rows = db.execute('SELECT id, username, role, status, last_login_at, last_login_ip, failed_attempts, locked_until, remark, created_at FROM admin_users ORDER BY id').fetchall()
    result = [dict(r) for r in rows]
    return jsonify(result)

@app.route('/api/admin/users', methods=['POST'])
@require_super_admin
def admin_create_user():
    """新增账号"""
    data = request.get_json() or {}
    username = (data.get('username') or '').strip()
    password = data.get('password') or ''
    role = data.get('role') or 'admin'
    remark = data.get('remark') or ''

    if not username or not password:
        return jsonify({'error': '用户名和密码不能为空'}), 400
    if len(username) < 2 or len(username) > 32:
        return jsonify({'error': '用户名长度需为 2-32 字符'}), 400
    if len(password) < 6:
        return jsonify({'error': '密码至少 6 位'}), 400
    if role not in ('super_admin', 'admin'):
        return jsonify({'error': '角色参数无效'}), 400

    db = get_db()
    if db.execute('SELECT 1 FROM admin_users WHERE username=?', (username,)).fetchone():
        return jsonify({'error': '用户名已存在'}), 409

    db.execute(
        'INSERT INTO admin_users (username, password_hash, role, remark) VALUES (?, ?, ?, ?)',
        (username, _hash_password(password), role, remark)
    )
    db.commit()
    return jsonify({'ok': True, 'message': f'账号 {username} 创建成功'})

@app.route('/api/admin/users/<int:uid>/password', methods=['PUT'])
@require_super_admin
def admin_reset_password(uid):
    """超级管理员重置任意账号密码"""
    data = request.get_json() or {}
    new_pwd = data.get('password') or ''
    if len(new_pwd) < 6:
        return jsonify({'error': '密码至少 6 位'}), 400

    db = get_db()
    row = db.execute('SELECT username FROM admin_users WHERE id=?', (uid,)).fetchone()
    if not row:
        return jsonify({'error': '账号不存在'}), 404

    db.execute('UPDATE admin_users SET password_hash=?, failed_attempts=0, locked_until=NULL WHERE id=?',
               (_hash_password(new_pwd), uid))
    db.commit()
    return jsonify({'ok': True, 'message': f'账号 {row["username"]} 密码已重置'})

@app.route('/api/admin/users/<int:uid>/status', methods=['PUT'])
@require_super_admin
def admin_toggle_user_status(uid):
    """启用/禁用账号"""
    data = request.get_json() or {}
    new_status = data.get('status')
    if new_status not in ('active', 'disabled'):
        return jsonify({'error': 'status 参数必须为 active 或 disabled'}), 400

    db = get_db()
    row = db.execute('SELECT username, role FROM admin_users WHERE id=?', (uid,)).fetchone()
    if not row:
        return jsonify({'error': '账号不存在'}), 404
    if row['username'] == g.current_user:
        return jsonify({'error': '不能修改自己的账号状态'}), 400

    db.execute('UPDATE admin_users SET status=? WHERE id=?', (new_status, uid))
    db.commit()
    return jsonify({'ok': True, 'message': f'账号 {row["username"]} 已{("启用" if new_status == "active" else "禁用")}'})

@app.route('/api/admin/users/<int:uid>', methods=['DELETE'])
@require_super_admin
def admin_delete_user(uid):
    """删除账号"""
    db = get_db()
    row = db.execute('SELECT username, role FROM admin_users WHERE id=?', (uid,)).fetchone()
    if not row:
        return jsonify({'error': '账号不存在'}), 404
    if row['username'] == g.current_user:
        return jsonify({'error': '不能删除自己'}), 400
    # 至少保留一个超级管理员
    if row['role'] == 'super_admin':
        count = db.execute("SELECT COUNT(*) as c FROM admin_users WHERE role='super_admin' AND status='active'").fetchone()['c']
        if count <= 1:
            return jsonify({'error': '至少保留一个超级管理员'}), 400

    db.execute('DELETE FROM admin_users WHERE id=?', (uid,))
    db.commit()
    return jsonify({'ok': True, 'message': f'账号 {row["username"]} 已删除'})

@app.route('/api/admin/login-logs', methods=['GET'])
@require_super_admin
def admin_list_login_logs():
    """登录日志列表（默认最近 100 条）"""
    limit = min(int(request.args.get('limit', 100)), 500)
    db = get_db()
    rows = db.execute(
        'SELECT id, username, ip, user_agent, success, reason, created_at FROM login_logs ORDER BY id DESC LIMIT ?',
        (limit,)
    ).fetchall()
    result = [dict(r) for r in rows]
    return jsonify(result)

# --- 产品 ---
@app.route('/api/products', methods=['GET'])
def get_products():
    db = get_db()
    rows = db.execute('SELECT * FROM products WHERE status="上架" AND is_test=0 ORDER BY sort_order, id').fetchall()
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

def _infer_site_url():
    """从请求头动态推断站点 URL（售卖标准：零配置适配任何部署环境）
    优先级：环境变量 SHENGAN_SITE_URL > 请求的 Host+X-Forwarded-Proto
    """
    if SITE_URL:
        return SITE_URL
    # nginx 反代后 X-Forwarded-Proto 会被设置，否则默认 https
    proto = request.headers.get('X-Forwarded-Proto', 'https')
    host = request.headers.get('X-Forwarded-Host') or request.host
    return f'{proto}://{host}'

@app.route('/api/sitemap.xml', methods=['GET'])
def sitemap_xml():
    """动态生成 sitemap.xml·产品页 + 静态页

    说明：产品详情页是 SPA hash 路由（#/products/<id>），hash 部分
    不会被搜索引擎抓取。本 sitemap 主要价值：
    1. 让百度/Google 知道子站存在并定期访问首页
    2. 未来若改为 BrowserRouter 或 SSR，sitemap 立即生效
    """
    from flask import Response
    db = get_db()
    products = db.execute(
        'SELECT id, updated_at, name FROM products WHERE status="上架" AND is_test=0 ORDER BY sort_order, id'
    ).fetchall()
    news = db.execute("SELECT id, created_at, title FROM news ORDER BY id DESC LIMIT 50").fetchall()

    base = _infer_site_url()
    today = datetime.now().strftime('%Y-%m-%d')
    lines = ['<?xml version="1.0" encoding="UTF-8"?>']
    lines.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    # 首页
    lines.append('  <url>')
    lines.append(f'    <loc>{base}</loc>')
    lines.append(f'    <lastmod>{today}</lastmod>')
    lines.append('    <changefreq>weekly</changefreq>')
    lines.append('    <priority>1.0</priority>')
    lines.append('  </url>')
    # 产品中心页
    lines.append('  <url>')
    lines.append(f'    <loc>{base}#/products</loc>')
    lines.append(f'    <lastmod>{today}</lastmod>')
    lines.append('    <changefreq>weekly</changefreq>')
    lines.append('    <priority>0.9</priority>')
    lines.append('  </url>')
    # 行业资讯页
    lines.append('  <url>')
    lines.append(f'    <loc>{base}#/news</loc>')
    lines.append(f'    <lastmod>{today}</lastmod>')
    lines.append('    <changefreq>daily</changefreq>')
    lines.append('    <priority>0.7</priority>')
    lines.append('  </url>')
    # 产品详情页
    for p in products:
        lastmod = (p['updated_at'] or today)[:10]
        lines.append('  <url>')
        lines.append(f'    <loc>{base}#/products/{p["id"]}</loc>')
        lines.append(f'    <lastmod>{lastmod}</lastmod>')
        lines.append('    <changefreq>monthly</changefreq>')
        lines.append('    <priority>0.8</priority>')
        lines.append('  </url>')
    # 行业资讯详情
    for n in news:
        lastmod = (n['created_at'] or today)[:10]
        lines.append('  <url>')
        lines.append(f'    <loc>{base}#/news/{n["id"]}</loc>')
        lines.append(f'    <lastmod>{lastmod}</lastmod>')
        lines.append('    <changefreq>monthly</changefreq>')
        lines.append('    <priority>0.6</priority>')
        lines.append('  </url>')
    lines.append('</urlset>')
    xml = '\n'.join(lines)
    return Response(xml, mimetype='application/xml; charset=utf-8')

@app.route('/api/robots.txt', methods=['GET'])
def robots_txt():
    """动态 robots.txt：站点 URL 从请求头推断（零配置适配任何域名）"""
    from flask import Response
    base = _infer_site_url()
    content = (
        'User-agent: *\n'
        'Allow: /\n'
        'Disallow: /admin\n'  # hash 路由本不会被抓，取个保险
        '\n'
        f'Sitemap: {base}/sitemap.xml\n'
    )
    return Response(content, mimetype='text/plain; charset=utf-8')

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
        INSERT INTO products (name, category, badge, badge_color, highlights, description, specs, use_cases, bg_color, border_color, price, stock, pdd_link, status, sort_order, image_url, gallery_images, detail_images, short_name, is_test)
        VALUES (:name, :category, :badge, :badge_color, :highlights, :description, :specs, :use_cases, :bg_color, :border_color, :price, :stock, :pdd_link, :status, :sort_order, :image_url, :gallery_images, :detail_images, :short_name, :is_test)
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
        'detail_images': json.dumps(data.get('detail_images',[]), ensure_ascii=False),
        'short_name': data.get('short_name',''),
        'is_test': 1 if data.get('is_test') else 0
    })
    db.commit()
    return jsonify({'ok': True, 'id': db.execute('SELECT last_insert_rowid()').fetchone()[0]})

@app.route('/api/admin/products/<int:pid>', methods=['PUT'])
@require_auth
def admin_update_product(pid):
    data = request.get_json()
    db = get_db()
    fields = ['name','category','badge','badge_color','highlights','description','specs','use_cases','bg_color','border_color','price','stock','pdd_link','status','sort_order','image_url','gallery_images','detail_images','short_name','is_test']
    updates = []
    values = {}
    for f in fields:
        if f in data:
            updates.append(f'{f}=:{f}')
            if f in ('highlights','specs','use_cases','gallery_images','detail_images'):
                values[f] = json.dumps(data[f], ensure_ascii=False) if isinstance(data[f], (list, dict)) else data[f]
            elif f == 'is_test':
                values[f] = 1 if data[f] else 0
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
    row = db.execute('SELECT * FROM products WHERE id=? AND is_test=0', (pid,)).fetchone()
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
    
    upload_dir = os.path.join(os.path.dirname(BASE_DIR), 'images', 'products')
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
        rows = db.execute('SELECT * FROM news WHERE published=1 AND is_test=0 AND category=? ORDER BY id DESC', (category,)).fetchall()
    else:
        rows = db.execute('SELECT * FROM news WHERE published=1 AND is_test=0 ORDER BY id DESC').fetchall()
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
    row = db.execute('SELECT * FROM news WHERE id=? AND is_test=0', (nid,)).fetchone()
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
        INSERT INTO news (title, category, summary, content, tags, read_time, published, is_test)
        VALUES (:title, :category, :summary, :content, :tags, :read_time, :published, :is_test)
    ''', {
        'title': data.get('title',''), 'category': data.get('category',''),
        'summary': data.get('summary',''), 'content': data.get('content',''),
        'tags': json.dumps(data.get('tags',[]), ensure_ascii=False),
        'read_time': data.get('read_time','3分钟'),
        'published': data.get('published',1),
        'is_test': 1 if data.get('is_test') else 0
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
        tags=:tags, read_time=:read_time, published=:published, is_test=:is_test, updated_at=datetime('now','localtime')
        WHERE id=:id
    ''', {
        'id': nid, 'title': data.get('title',''), 'category': data.get('category',''),
        'summary': data.get('summary',''), 'content': data.get('content',''),
        'tags': json.dumps(data.get('tags',[]), ensure_ascii=False),
        'read_time': data.get('read_time','3分钟'),
        'published': data.get('published',1),
        'is_test': 1 if data.get('is_test') else 0
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

# ============ 批量导入导出（产品/资讯） ============
PRODUCTS_CSV_FIELDS = [
    'name', 'short_name', 'category', 'badge', 'badge_color', 'description',
    'highlights', 'specs', 'use_cases', 'bg_color', 'border_color',
    'price', 'stock', 'pdd_link', 'status', 'sort_order',
    'image_url', 'gallery_images', 'detail_images', 'is_test'
]
NEWS_CSV_FIELDS = ['title', 'category', 'summary', 'content', 'tags', 'read_time', 'published', 'is_test']
IMG_FIELDS = ('image_url', 'gallery_images', 'detail_images')
LIST_FIELDS = ('highlights', 'specs', 'use_cases', 'gallery_images', 'detail_images', 'tags')

def _collect_image_paths(product_row):
    """从 product 行里提取所有图片路径（去重保序）"""
    paths = []
    seen = set()
    for field in IMG_FIELDS:
        raw = product_row[field] or ''
        if field == 'image_url':
            candidates = [raw.strip()]
        else:
            try:
                candidates = json.loads(raw) if raw else []
            except Exception:
                candidates = []
        for p in candidates:
            p = (p or '').strip().lstrip('/')
            if p and not p.startswith('http') and p not in seen:
                seen.add(p)
                paths.append(p)
    return paths

def _resolve_local_image(rel_path):
    """把相对路径映射到 VPS 上的绝对路径"""
    candidates = [
        os.path.join(IMAGES_DIR, rel_path),
        os.path.join('/var/www/shengan-seal', rel_path),
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    return None

@app.route('/api/admin/products/export', methods=['GET'])
@require_auth
def export_products():
    """导出产品为 zip（含 products.csv + images/ 子目录）"""
    from flask import send_file
    db = get_db()
    rows = db.execute('SELECT * FROM products WHERE is_test=0 ORDER BY id').fetchall()

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
        # 写 CSV
        csv_buf = io.StringIO()
        # 加上 utf-8-sig BOM 让 Excel 不乱码
        csv_buf.write('\ufeff')
        writer = csv.writer(csv_buf)
        writer.writerow(PRODUCTS_CSV_FIELDS)
        for r in rows:
            line = []
            for f in PRODUCTS_CSV_FIELDS:
                v = r[f] if f in r.keys() else ''
                if f in LIST_FIELDS:
                    try:
                        arr = json.loads(v) if v else []
                    except Exception:
                        arr = []
                    line.append('|'.join(str(x) for x in arr))
                elif f == 'is_test':
                    line.append(v if v is not None else 0)
                else:
                    line.append('' if v is None else str(v))
            writer.writerow(line)
        zf.writestr('products.csv', csv_buf.getvalue())

        # 打包被引用到的图片
        included = set()
        for r in rows:
            for rel in _collect_image_paths(dict(r)):
                if rel in included:
                    continue
                abs_path = _resolve_local_image(rel)
                if abs_path:
                    # rel 是相对路径（可能含 images/...），原样打包为 zip 内的相对路径
                    zf.write(abs_path, arcname=rel)
                    included.add(rel)

    buf.seek(0)
    fname = f"products_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
    return send_file(buf, mimetype='application/zip', as_attachment=True, download_name=fname)


@app.route('/api/admin/news/export', methods=['GET'])
@require_auth
def export_news():
    """导出资讯为 zip（仅含 news.csv）"""
    from flask import send_file
    db = get_db()
    rows = db.execute('SELECT * FROM news WHERE is_test=0 ORDER BY id').fetchall()

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
        csv_buf = io.StringIO()
        csv_buf.write('\ufeff')
        writer = csv.writer(csv_buf)
        writer.writerow(NEWS_CSV_FIELDS)
        for r in rows:
            line = []
            for f in NEWS_CSV_FIELDS:
                v = r[f] if f in r.keys() else ''
                if f in LIST_FIELDS:
                    try:
                        arr = json.loads(v) if v else []
                    except Exception:
                        arr = []
                    line.append('|'.join(str(x) for x in arr))
                elif f == 'published' or f == 'is_test':
                    line.append(v if v is not None else 0)
                else:
                    line.append('' if v is None else str(v))
            writer.writerow(line)
        zf.writestr('news.csv', csv_buf.getvalue())

    buf.seek(0)
    fname = f"news_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
    return send_file(buf, mimetype='application/zip', as_attachment=True, download_name=fname)


def _parse_csv_text(text):
    """解析 CSV（兼容 utf-8-sig BOM + 管道分隔的多值字段）"""
    if text.startswith('\ufeff'):
        text = text[1:]
    reader = csv.DictReader(io.StringIO(text))
    rows = []
    for row in reader:
        # 转换列表字段：'a|b|c' -> ['a','b','c']；空字符串 -> []
        for f in LIST_FIELDS:
            if f in row:
                v = row[f]
                if v is None or v == '':
                    row[f] = []
                elif '|' in v:
                    row[f] = [x.strip() for x in v.split('|') if x.strip()]
                else:
                    row[f] = [v]
        rows.append(row)
    return rows

def _import_products_rows(rows):
    """逐行插入产品，跳过重名"""
    db = get_db()
    inserted, skipped, errors = 0, 0, []
    for idx, row in enumerate(rows, 1):
        try:
            name = (row.get('name') or '').strip()
            if not name:
                errors.append({'row': idx, 'msg': 'name 为空'})
                continue
            exists = db.execute('SELECT id FROM products WHERE name=? AND is_test=0', (name,)).fetchone()
            if exists:
                skipped += 1
                continue
            values = {
                'name': name,
                'short_name': row.get('short_name', ''),
                'category': row.get('category', '') or '未分类',
                'badge': row.get('badge', ''),
                'badge_color': row.get('badge_color', '#0F6637'),
                'description': row.get('description', ''),
                'highlights': json.dumps(row.get('highlights', []), ensure_ascii=False),
                'specs': json.dumps(row.get('specs', []), ensure_ascii=False),
                'use_cases': json.dumps(row.get('use_cases', []), ensure_ascii=False),
                'bg_color': row.get('bg_color', '#f0f9f4'),
                'border_color': row.get('border_color', '#7ecfa0'),
                'price': row.get('price', ''),
                'stock': row.get('stock', '充足'),
                'pdd_link': row.get('pdd_link', 'https://mobile.yangkeduo.com'),
                'status': row.get('status', '上架'),
                'sort_order': int(row.get('sort_order') or 0),
                'image_url': row.get('image_url', ''),
                'gallery_images': json.dumps(row.get('gallery_images', []), ensure_ascii=False),
                'detail_images': json.dumps(row.get('detail_images', []), ensure_ascii=False),
                'is_test': 1 if str(row.get('is_test', '0')).strip() in ('1', 'true', 'True') else 0,
            }
            placeholders = ','.join(f':{k}' for k in values.keys())
            cols = ','.join(values.keys())
            db.execute(f'INSERT INTO products ({cols}) VALUES ({placeholders})', values)
            inserted += 1
        except Exception as e:
            errors.append({'row': idx, 'msg': str(e)})
    db.commit()
    return inserted, skipped, errors

@app.route('/api/admin/products/import', methods=['POST'])
@require_auth
def import_products():
    """导入产品 csv/zip，form 字段名 'file'"""
    if 'file' not in request.files:
        return jsonify({'ok': False, 'msg': '未上传文件'}), 400
    f = request.files['file']
    filename = f.filename or ''
    data = f.read()
    try:
        if filename.lower().endswith('.zip'):
            with zipfile.ZipFile(io.BytesIO(data)) as zf:
                csv_name = next((n for n in zf.namelist() if n.lower().endswith('.csv')), None)
                if not csv_name:
                    return jsonify({'ok': False, 'msg': 'zip 中未找到 csv'}), 400
                text = zf.read(csv_name).decode('utf-8-sig', errors='replace')
        else:
            text = data.decode('utf-8-sig', errors='replace')
    except Exception as e:
        return jsonify({'ok': False, 'msg': f'文件解析失败: {e}'}), 400

    try:
        rows = _parse_csv_text(text)
    except Exception as e:
        return jsonify({'ok': False, 'msg': f'CSV 解析失败: {e}'}), 400

    if not rows:
        return jsonify({'ok': False, 'msg': 'CSV 为空'}), 400

    inserted, skipped, errors = _import_products_rows(rows)
    return jsonify({'ok': True, 'inserted': inserted, 'skipped': skipped, 'errors': errors, 'total': len(rows)})


def _import_news_rows(rows):
    db = get_db()
    inserted, skipped, errors = 0, 0, []
    for idx, row in enumerate(rows, 1):
        try:
            title = (row.get('title') or '').strip()
            if not title:
                errors.append({'row': idx, 'msg': 'title 为空'})
                continue
            exists = db.execute('SELECT id FROM news WHERE title=? AND is_test=0', (title,)).fetchone()
            if exists:
                skipped += 1
                continue
            values = {
                'title': title,
                'category': row.get('category', ''),
                'summary': row.get('summary', ''),
                'content': row.get('content', ''),
                'tags': json.dumps(row.get('tags', []), ensure_ascii=False),
                'read_time': row.get('read_time', '3分钟'),
                'published': int(row.get('published') or 1),
                'is_test': 1 if str(row.get('is_test', '0')).strip() in ('1', 'true', 'True') else 0,
            }
            placeholders = ','.join(f':{k}' for k in values.keys())
            cols = ','.join(values.keys())
            db.execute(f'INSERT INTO news ({cols}) VALUES ({placeholders})', values)
            inserted += 1
        except Exception as e:
            errors.append({'row': idx, 'msg': str(e)})
    db.commit()
    return inserted, skipped, errors


@app.route('/api/admin/news/import', methods=['POST'])
@require_auth
def import_news():
    if 'file' not in request.files:
        return jsonify({'ok': False, 'msg': '未上传文件'}), 400
    f = request.files['file']
    filename = f.filename or ''
    data = f.read()
    try:
        if filename.lower().endswith('.zip'):
            with zipfile.ZipFile(io.BytesIO(data)) as zf:
                csv_name = next((n for n in zf.namelist() if n.lower().endswith('.csv')), None)
                if not csv_name:
                    return jsonify({'ok': False, 'msg': 'zip 中未找到 csv'}), 400
                text = zf.read(csv_name).decode('utf-8-sig', errors='replace')
        else:
            text = data.decode('utf-8-sig', errors='replace')
    except Exception as e:
        return jsonify({'ok': False, 'msg': f'文件解析失败: {e}'}), 400

    try:
        rows = _parse_csv_text(text)
    except Exception as e:
        return jsonify({'ok': False, 'msg': f'CSV 解析失败: {e}'}), 400

    if not rows:
        return jsonify({'ok': False, 'msg': 'CSV 为空'}), 400

    inserted, skipped, errors = _import_news_rows(rows)
    return jsonify({'ok': True, 'inserted': inserted, 'skipped': skipped, 'errors': errors, 'total': len(rows)})

# --- 导出留言 CSV ---
@app.route('/api/admin/messages/export', methods=['GET'])
@require_auth
def export_messages():
    from flask import send_file
    db = get_db()
    rows = db.execute('SELECT * FROM messages ORDER BY id DESC').fetchall()
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
        csv_buf = io.StringIO()
        csv_buf.write('\ufeff')
        writer = csv.writer(csv_buf)
        writer.writerow(['id', 'name', 'company', 'phone', 'email', 'subject', 'need', 'product', 'status', 'source', 'created_at', 'is_test'])
        for r in rows:
            rd = dict(r)
            writer.writerow([
                rd['id'], rd['name'], rd['company'], rd['phone'],
                rd.get('email') or '', rd.get('subject') or '',
                rd['need'], rd['product'], rd['status'], rd['source'],
                rd['created_at'], rd.get('is_test', 0) or 0,
            ])
        zf.writestr('messages.csv', csv_buf.getvalue())
    buf.seek(0)
    fname = f"messages_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
    return send_file(buf, mimetype='application/zip', as_attachment=True, download_name=fname)


MESSAGES_CSV_FIELDS = ['name', 'company', 'phone', 'email', 'subject', 'need', 'product', 'status', 'source', 'is_test']
SAMPLES_CSV_FIELDS = ['name', 'phone', 'company', 'address', 'product', 'quantity', 'note', 'status', 'is_test']

def _import_messages_rows(rows):
    db = get_db()
    inserted, skipped, errors = 0, 0, []
    for idx, row in enumerate(rows, 1):
        try:
            name = (row.get('name') or '').strip()
            phone = (row.get('phone') or '').strip()
            if not name or not phone:
                errors.append({'row': idx, 'msg': 'name 或 phone 为空'})
                continue
            exists = db.execute('SELECT id FROM messages WHERE name=? AND phone=? AND is_test=0', (name, phone)).fetchone()
            if exists:
                skipped += 1
                continue
            values = {
                'name': name,
                'company': row.get('company', ''),
                'phone': phone,
                'email': row.get('email', ''),
                'subject': row.get('subject', ''),
                'need': row.get('need', ''),
                'product': row.get('product', ''),
                'status': row.get('status', '待跟进'),
                'source': row.get('source', 'import'),
                'is_test': 1 if str(row.get('is_test', '0')).strip() in ('1', 'true', 'True') else 0,
            }
            cols = ','.join(values.keys())
            placeholders = ','.join(f':{k}' for k in values.keys())
            db.execute(f'INSERT INTO messages ({cols}) VALUES ({placeholders})', values)
            inserted += 1
        except Exception as e:
            errors.append({'row': idx, 'msg': str(e)})
    db.commit()
    return inserted, skipped, errors


@app.route('/api/admin/messages/import', methods=['POST'])
@require_auth
def import_messages():
    if 'file' not in request.files:
        return jsonify({'ok': False, 'msg': '未上传文件'}), 400
    f = request.files['file']
    filename = f.filename or ''
    data = f.read()
    try:
        if filename.lower().endswith('.zip'):
            with zipfile.ZipFile(io.BytesIO(data)) as zf:
                csv_name = next((n for n in zf.namelist() if n.lower().endswith('.csv')), None)
                if not csv_name:
                    return jsonify({'ok': False, 'msg': 'zip 中未找到 csv'}), 400
                text = zf.read(csv_name).decode('utf-8-sig', errors='replace')
        else:
            text = data.decode('utf-8-sig', errors='replace')
    except Exception as e:
        return jsonify({'ok': False, 'msg': f'文件解析失败: {e}'}), 400
    try:
        rows = _parse_csv_text(text)
    except Exception as e:
        return jsonify({'ok': False, 'msg': f'CSV 解析失败: {e}'}), 400
    if not rows:
        return jsonify({'ok': False, 'msg': 'CSV 为空'}), 400
    inserted, skipped, errors = _import_messages_rows(rows)
    return jsonify({'ok': True, 'inserted': inserted, 'skipped': skipped, 'errors': errors, 'total': len(rows)})


@app.route('/api/admin/sample-requests/export', methods=['GET'])
@require_auth
def export_sample_requests():
    from flask import send_file
    db = get_db()
    rows = db.execute('SELECT * FROM samples ORDER BY id DESC').fetchall()
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
        csv_buf = io.StringIO()
        csv_buf.write('\ufeff')
        writer = csv.writer(csv_buf)
        writer.writerow(['id', 'name', 'phone', 'company', 'address', 'product', 'quantity', 'note', 'status', 'created_at', 'is_test'])
        for r in rows:
            rd = dict(r)
            writer.writerow([
                rd['id'], rd['name'], rd['phone'], rd['company'], rd['address'],
                rd['product'], rd.get('quantity') or '', rd['note'], rd['status'],
                rd['created_at'], rd.get('is_test', 0) or 0,
            ])
        zf.writestr('sample_requests.csv', csv_buf.getvalue())
    buf.seek(0)
    fname = f"sample_requests_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
    return send_file(buf, mimetype='application/zip', as_attachment=True, download_name=fname)


def _import_samples_rows(rows):
    db = get_db()
    inserted, skipped, errors = 0, 0, []
    for idx, row in enumerate(rows, 1):
        try:
            name = (row.get('name') or '').strip()
            phone = (row.get('phone') or '').strip()
            if not name or not phone:
                errors.append({'row': idx, 'msg': 'name 或 phone 为空'})
                continue
            exists = db.execute('SELECT id FROM samples WHERE name=? AND phone=? AND is_test=0', (name, phone)).fetchone()
            if exists:
                skipped += 1
                continue
            values = {
                'name': name,
                'phone': phone,
                'company': row.get('company', ''),
                'address': row.get('address', ''),
                'product': row.get('product', ''),
                'quantity': row.get('quantity', ''),
                'note': row.get('note', ''),
                'status': row.get('status', '待处理'),
                'is_test': 1 if str(row.get('is_test', '0')).strip() in ('1', 'true', 'True') else 0,
            }
            cols = ','.join(values.keys())
            placeholders = ','.join(f':{k}' for k in values.keys())
            db.execute(f'INSERT INTO samples ({cols}) VALUES ({placeholders})', values)
            inserted += 1
        except Exception as e:
            errors.append({'row': idx, 'msg': str(e)})
    db.commit()
    return inserted, skipped, errors


@app.route('/api/admin/sample-requests/import', methods=['POST'])
@require_auth
def import_sample_requests():
    if 'file' not in request.files:
        return jsonify({'ok': False, 'msg': '未上传文件'}), 400
    f = request.files['file']
    filename = f.filename or ''
    data = f.read()
    try:
        if filename.lower().endswith('.zip'):
            with zipfile.ZipFile(io.BytesIO(data)) as zf:
                csv_name = next((n for n in zf.namelist() if n.lower().endswith('.csv')), None)
                if not csv_name:
                    return jsonify({'ok': False, 'msg': 'zip 中未找到 csv'}), 400
                text = zf.read(csv_name).decode('utf-8-sig', errors='replace')
        else:
            text = data.decode('utf-8-sig', errors='replace')
    except Exception as e:
        return jsonify({'ok': False, 'msg': f'文件解析失败: {e}'}), 400
    try:
        rows = _parse_csv_text(text)
    except Exception as e:
        return jsonify({'ok': False, 'msg': f'CSV 解析失败: {e}'}), 400
    if not rows:
        return jsonify({'ok': False, 'msg': 'CSV 为空'}), 400
    inserted, skipped, errors = _import_samples_rows(rows)
    return jsonify({'ok': True, 'inserted': inserted, 'skipped': skipped, 'errors': errors, 'total': len(rows)})

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
