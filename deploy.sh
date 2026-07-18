#!/bin/bash
# ============================================================
# 盛安密封官网 · 一键部署脚本
# 适用于全新 Ubuntu/Debian 服务器初始化 + 项目部署
# 用法: bash deploy.sh
# ============================================================
set -e

# ============ 配置区（按需修改） ============
DOMAIN=""            # 域名（可选，留空则用 IP）
PORT=8082            # nginx 监听端口
BACKEND_PORT=5000    # Flask/gunicorn 端口
APP_DIR="/var/www/shengan-seal"
PYTHON_BIN="python3"
NODE_BIN="node"

# ============ 颜色输出 ============
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ============ 0. 检查 root ============
[ "$EUID" -ne 0 ] && error "请用 root 执行: sudo bash deploy.sh"

# ============ 1. 系统依赖 ============
info "安装系统依赖..."
apt-get update -qq
apt-get install -y -qq nginx python3 python3-pip python3-venv nodejs npm git curl > /dev/null 2>&1
info "系统依赖安装完成"

# ============ 2. Python 虚拟环境 + 后端依赖 ============
info "配置 Python 后端环境..."
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# 如果项目代码还没拉取，提示用户
if [ ! -f "backend/app.py" ]; then
    warn "项目代码未找到，请先将代码放到 $APP_DIR"
    warn "  git clone <repo_url> $APP_DIR  或  scp -r ./dist $APP_DIR/"
    error "中止部署"
fi

# 创建虚拟环境
if [ ! -d "backend/venv" ]; then
    $PYTHON_BIN -m venv backend/venv
fi
source backend/venv/bin/activate
pip install -q flask gunicorn flask-cors > /dev/null 2>&1
info "Python 环境就绪"

# ============ 3. 初始化数据库 ============
info "初始化数据库..."
cd backend
$PYTHON_BIN -c "
import sqlite3, os
db = 'shengan.db'
if not os.path.exists(db) or os.path.getsize(db) == 0:
    conn = sqlite3.connect(db)
    cur = conn.cursor()
    cur.executescript('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            short_name TEXT,
            category TEXT,
            badge TEXT,
            badge_color TEXT DEFAULT '#0F6637',
            description TEXT,
            highlights TEXT,
            use_cases TEXT,
            specs TEXT,
            bg_color TEXT DEFAULT '#f0f9f4',
            border_color TEXT DEFAULT '#0F6637',
            price TEXT,
            stock TEXT DEFAULT '充足',
            pdd_link TEXT,
            status TEXT DEFAULT '上架',
            sort_order INTEGER DEFAULT 0,
            image_url TEXT,
            gallery_images TEXT,
            detail_images TEXT,
            is_test INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS news (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT,
            content TEXT,
            cover_image TEXT,
            views INTEGER DEFAULT 0,
            published INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            company TEXT,
            phone TEXT NOT NULL,
            need TEXT,
            product TEXT,
            source TEXT,
            status TEXT DEFAULT '待跟进',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS sample_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            phone TEXT NOT NULL,
            company TEXT,
            address TEXT,
            product TEXT,
            note TEXT,
            status TEXT DEFAULT '待处理',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        );
        CREATE TABLE IF NOT EXISTS qr_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            url TEXT,
            image_url TEXT,
            sort_order INTEGER DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS sub_products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER,
            name TEXT,
            price TEXT,
            specs TEXT,
            image_url TEXT,
            sort_order INTEGER DEFAULT 0,
            FOREIGN KEY (product_id) REFERENCES products(id)
        );
        INSERT OR IGNORE INTO settings (key, value) VALUES
            ('hotline', '13507402179'),
            ('factory_phone', '0731-86869145'),
            ('wechat', '13507402179'),
            ('pdd_link', 'https://mobile.yangkeduo.com'),
            ('company_name', '盛安密封'),
            ('address', '湖南省长沙市');
    ''')
    conn.commit()
    conn.close()
    print('数据库初始化完成')
else:
    print('数据库已存在，跳过初始化')
"
cd ..
info "数据库就绪"

# ============ 4. 前端构建 ============
info "构建前端..."
if [ -f "package.json" ]; then
    npm install --silent 2>/dev/null
    npm run build 2>/dev/null
    info "前端构建完成"
else
    warn "未找到 package.json，请确保 dist/ 目录已有构建产物"
fi

# ============ 5. 目录权限 ============
info "设置目录权限..."
mkdir -p "$APP_DIR/images/products"
mkdir -p "$APP_DIR/backend/uploads"
chown -R www-data:www-data "$APP_DIR/images" 2>/dev/null || true
chmod -R 755 "$APP_DIR/images" 2>/dev/null || true

# ============ 6. Gunicorn systemd 服务 ============
info "配置 Gunicorn 服务..."
cat > /etc/systemd/system/shengan-seal.service << EOF
[Unit]
Description=盛安密封官网 Flask 后端
After=network.target

[Service]
User=root
WorkingDirectory=$APP_DIR/backend
Environment="PATH=$(pwd)/backend/venv/bin"
ExecStart=$(pwd)/backend/venv/bin/gunicorn -w 4 -b 127.0.0.1:$BACKEND_PORT app:app
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable shengan-seal
systemctl restart shengan-seal
info "Gunicorn 服务已启动 (端口 $BACKEND_PORT)"

# ============ 7. Nginx 配置 ============
info "配置 Nginx..."
NGINX_CONF="/etc/nginx/sites-available/shengan-seal"
NGINX_LINK="/etc/nginx/sites-enabled/shengan-seal"

cat > "$NGINX_CONF" << EOF
server {
    listen $PORT;
    server_name _;

    root $APP_DIR/dist;
    index index.html;

    # API 反向代理到 Flask 后端
    location /api/ {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # 图片资源
    location ^~ /images/ {
        root $APP_DIR;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 前端 SPA 路由
    location = /index.html {
        add_header Cache-Control "no-store, no-cache, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
        try_files /index.html =404;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# 启用站点
ln -sf "$NGINX_CONF" "$NGINX_LINK"
# 删除默认站点（如果存在）
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

nginx -t && systemctl reload nginx
info "Nginx 配置完成 (端口 $PORT)"

# ============ 8. 防火墙 ============
info "开放端口..."
ufw allow $PORT/tcp 2>/dev/null || iptables -I INPUT -p tcp --dport $PORT -j ACCEPT 2>/dev/null || true

# ============ 完成 ============
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  盛安密封官网部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "  前端地址: http://$(hostname -I | awk '{print $1}'):$PORT"
echo "  管理后台: http://$(hostname -I | awk '{print $1}'):$PORT/#/admin"
echo "  默认账号: admin / shengan2026"
echo ""
echo "  服务管理:"
echo "    systemctl status shengan-seal   # 查看后端状态"
echo "    systemctl restart shengan-seal  # 重启后端"
echo "    systemctl reload nginx          # 重载前端"
echo ""
