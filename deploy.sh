#!/bin/bash
# ============================================================
# 盛安密封官网 · 一键部署脚本
# ============================================================
# 售卖标准（最简方案 A）：
#   · 所有静态资源用根路径 /images/...、/api/...
#   · 客户部署到任意域名/IP，资源自动适配，无需修改任何代码
#   · 客户只需：①解析域名 ②执行本脚本 ③配置 SSL
#
# 用法：
#   bash deploy.sh                          # 默认：根部署（推荐给客户）
#   SITE_URL=https://domain.com/subpath/ bash deploy.sh  # 子路径部署（保留兼容）
#
# 适用：全新 Ubuntu/Debian 服务器
# ============================================================
set -e

# ============ 配置区（一般无需修改）============
PORT=8082                # nginx HTTP 监听端口（生产环境推荐 80/443）
BACKEND_PORT=5000        # Flask/gunicorn 端口（仅 127.0.0.1 监听）
APP_DIR="/var/www/shengan-seal"
PYTHON_BIN="python3"

# ============ 子路径部署兼容（可选）============
# 默认根部署（/），无需任何配置
# 仅当客户必须部署到子路径（如 https://主站.com/shengan/）时设置：
#   export SITE_URL=https://www.maichewei.com/shengan/
#   export VITE_BASE_PATH=/shengan/
#   bash deploy.sh
SITE_URL="${SITE_URL:-}"                          # 站点 URL，留空 = 自动从请求头推断
VITE_BASE_PATH="${VITE_BASE_PATH:-/}"              # Vite base 路径，默认根

# ============ 颜色输出 ============
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ============ 0. 检查 root ============
[ "$EUID" -ne 0 ] && error "请用 root 执行: sudo bash deploy.sh"

# ============ 1. 系统依赖 ============
info "安装系统依赖..."
if command -v apt-get &> /dev/null; then
    apt-get update -qq
    apt-get install -y -qq nginx python3 python3-pip python3-venv nodejs npm git curl > /dev/null 2>&1
elif command -v yum &> /dev/null; then
    yum install -y -q nginx python3 python3-pip nodejs npm git curl > /dev/null 2>&1
fi
info "系统依赖安装完成"

# ============ 2. Python 后端环境 ============
info "配置 Python 后端环境..."
mkdir -p "$APP_DIR"
cd "$APP_DIR"

if [ ! -f "backend/app.py" ]; then
    warn "项目代码未找到，请先将代码放到 $APP_DIR"
    warn "  git clone <repo_url> $APP_DIR"
    error "中止部署"
fi

if [ ! -d "backend/venv" ]; then
    $PYTHON_BIN -m venv backend/venv
fi
source backend/venv/bin/activate
pip install -q -r backend/requirements.txt 2>/dev/null || pip install -q flask flask-cors gunicorn > /dev/null 2>&1
info "Python 环境就绪"

# ============ 3. 初始化数据库 ============
info "初始化数据库..."
cd backend
if [ ! -f "shengan.db" ] || [ ! -s "shengan.db" ]; then
    $PYTHON_BIN init_db.py
    info "数据库初始化完成"
else
    info "数据库已存在，跳过初始化"
fi
cd ..

# ============ 4. 前端构建 ============
info "构建前端..."
if [ -f "package.json" ]; then
    npm install --silent 2>/dev/null

    # 生成 .env.production（仅当与默认不同）
    if [ "$VITE_BASE_PATH" != "/" ] || [ -n "$SITE_URL" ]; then
        cat > .env.production << ENVEOF
VITE_BASE_PATH=$VITE_BASE_PATH
${SITE_URL:+SITE_URL=$SITE_URL}
ENVEOF
        info "已生成 .env.production (VITE_BASE_PATH=$VITE_BASE_PATH)"
    else
        info "使用默认配置（根部署·推荐）"
    fi
    npm run build 2>/dev/null
    info "前端构建完成"
else
    warn "未找到 package.json，请确保 dist/ 目录已有构建产物"
fi

# ============ 5. 目录权限 ============
info "设置目录权限..."
mkdir -p "$APP_DIR/images/products" "$APP_DIR/backend/uploads"
chmod -R 755 "$APP_DIR/images" 2>/dev/null || true

# ============ 6. Gunicorn systemd 服务 ============
info "配置 Gunicorn 服务..."
SERVICE_ENV=""
[ -n "$SITE_URL" ] && SERVICE_ENV="Environment=\"SHENGAN_SITE_URL=$SITE_URL\""

cat > /etc/systemd/system/shengan-seal.service << EOF
[Unit]
Description=盛安密封官网 Flask 后端
After=network.target

[Service]
User=root
WorkingDirectory=$APP_DIR/backend
Environment="PATH=$APP_DIR/backend/venv/bin"
$SERVICE_ENV
ExecStart=$APP_DIR/backend/venv/bin/gunicorn -w 4 -b 127.0.0.1:$BACKEND_PORT app:app
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

# 根据是否子路径部署生成不同配置
if [ "$VITE_BASE_PATH" = "/" ]; then
    # ============ 根部署（标准·推荐）============
    cat > "$NGINX_CONF" << 'NGINX_EOF'
# ============================================================
# 盛安密封官网 · 根部署配置（推荐·客户 VPS 独立域名场景）
# ============================================================
# 售卖标准：所有静态资源用根路径，客户无需修改任何代码
# 适用：客户域名解析到本服务器 IP

server {
    listen 8082;
    server_name _;

    root /var/www/shengan-seal/dist;
    index index.html;

    # === SEO 专用：sitemap/robots 走后端（避免被 SPA 拦截） ===
    location = /sitemap.xml { proxy_pass http://127.0.0.1:5000/api/sitemap.xml; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto $scheme; add_header Content-Type "application/xml; charset=utf-8"; expires 1h; }
    location = /robots.txt { proxy_pass http://127.0.0.1:5000/api/robots.txt; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto $scheme; }

    # === API 反向代理 ===
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 25M;
        proxy_read_timeout 300s;
    }

    # === 图片资源（30天缓存） ===
    location ^~ /images/ {
        root /var/www/shengan-seal;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # === 前端 SPA（hash 路由） ===
    location / {
        try_files $uri $uri/ /index.html;
    }

    # === 静态资源缓存 ===
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_EOF
else
    # ============ 子路径部署（兼容老环境）============
    BP="$VITE_BASE_PATH"
    [[ "$BP" != */ ]] && BP="$BP/"
    cat > "$NGINX_CONF" << NGINX_EOF
# 盛安密封官网 · 子路径部署配置（兼容）
server {
    listen $PORT;
    server_name _;

    root $APP_DIR/dist;
    index index.html;

    location = ${BP}sitemap.xml { proxy_pass http://127.0.0.1:$BACKEND_PORT/api/sitemap.xml; proxy_set_header Host \$host; proxy_set_header X-Real-IP \$remote_addr; proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto \$scheme; add_header Content-Type "application/xml; charset=utf-8"; expires 1h; }
    location = ${BP}robots.txt { proxy_pass http://127.0.0.1:$BACKEND_PORT/api/robots.txt; proxy_set_header Host \$host; proxy_set_header X-Real-IP \$remote_addr; proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto \$scheme; }

    location ${BP}api/ { proxy_pass http://127.0.0.1:$BACKEND_PORT; proxy_set_header Host \$host; proxy_set_header X-Real-IP \$remote_addr; proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto \$scheme; client_max_body_size 25M; }
    location ^~ ${BP}images/ { proxy_pass http://127.0.0.1:$BACKEND_PORT; expires 30d; add_header Cache-Control "public, immutable"; }
    location ${BP} { try_files \$uri \$uri/ /index.html; }
    location ${BP} { proxy_pass http://127.0.0.1:$BACKEND_PORT/; proxy_set_header Host \$host; proxy_set_header X-Real-IP \$remote_addr; proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto \$scheme; }
}
NGINX_EOF
fi

ln -sf "$NGINX_CONF" "$NGINX_LINK"
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

nginx -t && systemctl reload nginx
info "Nginx 配置完成 (端口 $PORT)"

# ============ 8. 防火墙 ============
info "开放端口..."
ufw allow $PORT/tcp 2>/dev/null || iptables -I INPUT -p tcp --dport $PORT -j ACCEPT 2>/dev/null || true

# ============ 9. 【售卖标准】禁止 IP 直接访问 ============
info "检查是否需要禁止 IP 访问..."
SERVER_NAME=$(grep -E "^[[:space:]]*server_name" "$NGINX_CONF" | head -1 | sed 's/.*server_name[[:space:]]*//;s/;//' | awk '{print $1}')
if [ "$SERVER_NAME" = "_" ] || [ -z "$SERVER_NAME" ]; then
    warn "未配置 server_name，无法添加 IP 访问跳转"
    warn "建议在 $NGINX_CONF 中设置 server_name your-domain.com;"
    warn "或手动添加 IP 访问 301 跳转："
    warn "  if (\$host != 'your-domain.com') { return 301 https://your-domain.com\$request_uri; }"
else
    info "已配置 server_name=$SERVER_NAME（IP 访问会被 404，不会暴露真实地址）"
fi

# ============ 完成 ============
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  盛安密封官网部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "  访问地址: http://$(hostname -I | awk '{print $1}'):$PORT"
echo "  管理后台: http://$(hostname -I | awk '{print $1}'):$PORT/#/admin"
echo "  默认账号: admin / shengan2026"
echo ""
echo "  ⚠️  强烈建议:"
echo "    1. 修改默认密码: vi $APP_DIR/backend/app.py  (第 27 行 ADMIN_PASS_HASH)"
echo "    2. 申请 SSL 证书: certbot --nginx -d 你的域名"
echo "    3. 在 nginx 中配置 server_name 你的域名 + IP 访问 301 跳转"
echo ""
echo "  服务管理:"
echo "    systemctl status shengan-seal   # 后端状态"
echo "    systemctl restart shengan-seal  # 重启后端"
echo "    systemctl reload nginx          # 重载 nginx"
echo "    bash $APP_DIR/deploy.sh         # 重新部署（保留数据库）"
echo ""