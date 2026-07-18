# 盛安密封官网 · 客户交付部署手册

> 本文档用于将本项目交付到客户服务器并完成生产部署。
> 预计完整部署耗时：**15-30 分钟**（含 HTTPS 证书申请）。

---

## 目录

1. [系统要求](#1-系统要求)
2. [三种部署场景速查](#2-三种部署场景速查)
3. [一键部署步骤](#3-一键部署步骤)
4. [HTTPS 配置（推荐）](#4-https-配置推荐)
5. [升级部署](#5-升级部署)
6. [服务管理与运维](#6-服务管理与运维)
7. [常见问题](#7-常见问题)
8. [关键路径与凭证](#8-关键路径与凭证)

---

## 1. 系统要求

| 项目 | 最低 | 推荐 |
|------|------|------|
| OS | Ubuntu 20.04 / Debian 11 | Ubuntu 22.04 LTS |
| CPU | 1 核 | 2 核 |
| 内存 | 1 GB | 2 GB |
| 磁盘 | 5 GB 可用 | 20 GB+ |
| 网络 | 公网 IP 或域名 | 公网 IP + 已备案域名 |
| 端口 | 8082（或自定） | 80/443（生产） |

---

## 2. 三种部署场景速查

| 场景 | 适用 | SITE_URL | VITE_BASE_PATH | 访问地址 |
|------|------|----------|---------------|---------|
| **A. 客户独立域名根部署** | 客户有自己的独立域名（推荐） | `https://shengan.example.com/` | `/` | `https://shengan.example.com/` |
| **B. 主站子路径部署** | 部署到客户主站的 `/shengan/` 子路径下 | `https://www.example.com/shengan/` | `/shengan/` | `https://www.example.com/shengan/` |
| **C. IP 直连（仅开发/演示）** | 没有域名，临时测试 | `http://公网IP:8082/` | `/` | `http://公网IP:8082/` |

> 💡 项目已配置化，**场景 A/B 之间切换只需改一个环境变量 + 一行 nginx 配置，无需改任何代码**。

---

## 3. 一键部署步骤

### 3.1 上传项目代码

```bash
# 方式 1：从 GitHub 拉取（推荐）
cd /var/www
git clone https://github.com/xingpeiluo-design/shengan-seal.git
mv shengan-seal shengan-seal-app
cd shengan-seal-app

# 方式 2：本地 scp 上传（开发者机器执行）
scp -r ./shengan-seal root@<服务器IP>:/var/www/
```

### 3.2 执行一键部署脚本

```bash
# 进入项目目录
cd /var/www/shengan-seal-app

# 场景 A：客户独立域名（推荐生产环境）
SITE_URL="https://shengan.example.com/" bash deploy.sh

# 场景 B：主站子路径
SITE_URL="https://www.example.com/shengan/" bash deploy.sh

# 场景 C：IP 直连（不带域名）
SITE_URL="http://$(hostname -I | awk '{print $1}'):8082/" bash deploy.sh
```

**脚本会自动完成**：
1. ✅ 安装系统依赖（nginx、python3、nodejs、npm）
2. ✅ 创建 Python 虚拟环境 + 安装 Flask/gunicorn
3. ✅ 初始化 SQLite 数据库（8 款产品 + 设置 + 资讯 + 二维码）
4. ✅ 根据 `SITE_URL` 自动生成 `.env.production`（含 base path 推导）
5. ✅ 构建前端（npm install + npm run build）
6. ✅ 创建 systemd 服务 `shengan-seal`（注入 `SHENGAN_SITE_URL` 环境变量）
7. ✅ 配置 nginx 反代 + API/图片路由
8. ✅ 开放防火墙端口

**部署成功输出**：

```
========================================
  盛安密封官网部署完成！
========================================

  SITE_URL:      https://shengan.example.com/
  访问地址:       https://shengan.example.com
  管理后台:       https://shengan.example.com/#/admin
  默认账号:       admin / shengan2026

  服务管理:
    systemctl status shengan-seal
    systemctl restart shengan-seal
    systemctl reload nginx
    bash /var/www/shengan-seal-app/deploy.sh
```

### 3.3 验证部署

```bash
# 检查服务状态
systemctl status shengan-seal    # 后端（应 active）
systemctl status nginx           # nginx（应 active）

# 访问验证
curl -I http://<服务器IP>:8082/                          # 首页
curl -I http://<服务器IP>:8082/api/products              # API
curl -I http://<服务器IP>:8082/api/sitemap.xml           # sitemap
```

打开浏览器访问 `http://<服务器IP>:8082/`，应能看到网站首页。
访问 `http://<服务器IP>:8082/#/admin` 输入 `admin / shengan2026` 进入管理后台。

---

## 4. HTTPS 配置（推荐）

生产环境**强烈建议**启用 HTTPS。两种方案：

### 4.1 方案 A：Let's Encrypt 免费证书（推荐）

```bash
# 安装 certbot
apt-get install -y certbot python3-certbot-nginx

# 申请证书（自动配置 nginx）
certbot --nginx -d shengan.example.com -d www.shengan.example.com

# 测试自动续期
certbot renew --dry-run
```

申请成功后，证书位于：
- 证书：`/etc/letsencrypt/live/shengan.example.com/fullchain.pem`
- 私钥：`/etc/letsencrypt/live/shengan.example.com/privkey.pem`

然后**重新运行部署脚本**启用 HTTPS：

```bash
cd /var/www/shengan-seal-app
SITE_URL="https://shengan.example.com/" \
ENABLE_HTTPS=true \
SSL_CERT_PATH="/etc/letsencrypt/live/shengan.example.com/fullchain.pem" \
SSL_KEY_PATH="/etc/letsencrypt/live/shengan.example.com/privkey.pem" \
bash deploy.sh
```

### 4.2 方案 B：商业 SSL 证书（已签发）

把 `.crt` 和 `.key` 文件放到服务器任意位置，然后在 deploy 时指定路径：

```bash
ENABLE_HTTPS=true \
SSL_CERT_PATH="/path/to/shengan.crt" \
SSL_KEY_PATH="/path/to/shengan.key" \
SITE_URL="https://shengan.example.com/" \
bash deploy.sh
```

### 4.3 HTTPS 反代（主站子路径场景，已签发主站证书）

如果客户已有主站 `www.example.com` 的 SSL 证书，可以**复用主站证书**走子路径：

```nginx
# 在主站 server block 顶部添加
location = /shengan { return 301 https://$host/shengan/; }
location /shengan/api/ { proxy_pass http://127.0.0.1:8082/api/; ... }
location /shengan/images/ { proxy_pass http://127.0.0.1:8082/images/; expires 30d; }
location /shengan/ { proxy_pass http://127.0.0.1:8082/; ... }
```

参考配置：`/www/server/panel/vhost/nginx/proxy/maichewei.com/shengan.conf`

---

## 5. 升级部署

后续收到代码更新时，使用以下流程升级（数据不会丢失）：

```bash
# 1. 备份当前数据库（强烈建议）
cp /var/www/shengan-seal-app/backend/shengan.db \
   /var/www/shengan-seal-app/backend/shengan.db.bak.$(date +%Y%m%d)

# 2. 拉取最新代码
cd /var/www/shengan-seal-app
git pull origin main

# 3. 重新执行部署脚本（自动重建前端 + 重启服务）
SITE_URL="https://shengan.example.com/" bash deploy.sh
```

**重要**：SITE_URL 必须与首次部署时一致，否则 sitemap/canonical 会指向错误的域名。

**仅升级前端**（后端没改时）：

```bash
cd /var/www/shengan-seal-app
git pull
npm run build
scp -r dist/. root@<服务器>:/var/www/shengan-seal-app/dist/
```

**仅升级后端**（前端没改时）：

```bash
cd /var/www/shengan-seal-app
git pull
scp backend/app.py root@<服务器>:/var/www/shengan-seal-app/backend/
ssh root@<服务器> 'systemctl restart shengan-seal'
```

---

## 6. 服务管理与运维

### 6.1 systemd 服务

```bash
# 状态
systemctl status shengan-seal       # 查看后端运行状态
systemctl status nginx              # 查看 nginx 运行状态

# 重启
systemctl restart shengan-seal      # 重启后端（代码改动后必走）
systemctl reload nginx              # 重载 nginx 配置（不中断服务）

# 日志
journalctl -u shengan-seal -f       # 实时查看后端日志
journalctl -u nginx -f              # 实时查看 nginx 访问/错误日志

# 自启动
systemctl enable shengan-seal       # 开机自启
```

### 6.2 数据备份

```bash
# 备份数据库（每日 cron 推荐）
cp /var/www/shengan-seal-app/backend/shengan.db \
   /backup/shengan-$(date +%Y%m%d).db

# 备份上传的产品图片
tar czf /backup/images-$(date +%Y%m%d).tar.gz \
   /var/www/shengan-seal-app/images/
```

### 6.3 登录日志清理

服务已内置：
- 启动时自动清理 90 天前的登录日志
- 每日凌晨 3 点 cron 自动清理过期数据

如需手动清理：

```bash
ssh root@<服务器> /usr/local/bin/shengan-clean-logs.sh
```

---

## 7. 常见问题

### Q1: 部署后访问首页 502 Bad Gateway

**原因**：后端 gunicorn 没启动成功。

```bash
systemctl status shengan-seal      # 看具体错误
journalctl -u shengan-seal -n 50   # 查看最近 50 条日志
```

常见原因：
- 数据库文件被锁（重启服务即可）
- 端口 5000 被占用：`netstat -tlnp | grep 5000`

### Q2: 图片显示不出来 / 404

**检查路径配置**：

```bash
# 后端是否能访问图片
curl http://127.0.0.1:5000/images/store_logo.webp

# nginx 是否反代成功
curl http://127.0.0.1:8082/images/store_logo.webp
```

如果 404：
- 子路径部署：检查 vite 的 `VITE_BASE_PATH` 是否正确（应为 `/shengan/`）
- 独立域名部署：`VITE_BASE_PATH=/`

### Q3: sitemap.xml 里的 URL 指向主站/旧域名

**原因**：`SHENGAN_SITE_URL` 环境变量未生效。

```bash
# 检查 systemd 服务里的环境变量
systemctl show shengan-seal | grep SHENGAN_SITE_URL

# 修改方法
vi /etc/systemd/system/shengan-seal.service
# 把 Environment="SHENGAN_SITE_URL=..." 改成客户域名
systemctl daemon-reload
systemctl restart shengan-seal
```

### Q4: 管理后台登录失败

- 默认账号：`admin / shengan2026`
- 如果改过密码：在 `backend/app.py` 第 27 行 `ADMIN_PASS_HASH` 重新生成：
  ```python
  import hashlib
  print(hashlib.sha256('新密码'.encode()).hexdigest())
  ```

### Q5: 端口被占用

```bash
# 查看占用
netstat -tlnp | grep -E '8082|5000'

# 修改 deploy.sh 顶部的 PORT 和 BACKEND_PORT
```

### Q6: 部署到已有 nginx 的服务器，80/443 端口被占用

deploy.sh 默认使用 8082 端口，不影响已有服务。如需改用 80：

```bash
PORT=80 bash deploy.sh
```

---

## 8. 关键路径与凭证

### 默认账号

| 项目 | 值 |
|------|------|
| 后台账号 | `admin` |
| 后台密码 | `shengan2026` |

> ⚠️ **首次部署后请立即修改默认密码！** 在 `backend/app.py` 中修改 `ADMIN_PASS_HASH` 后重启服务。

### 关键路径

| 路径 | 用途 |
|------|------|
| `/var/www/shengan-seal-app/` | 项目根目录 |
| `/var/www/shengan-seal-app/backend/shengan.db` | SQLite 数据库 |
| `/var/www/shengan-seal-app/images/` | 上传的产品图片 |
| `/var/www/shengan-seal-app/dist/` | 前端构建产物（nginx 直接 serve） |
| `/var/www/shengan-seal-app/.secret_key` | Flask SECRET_KEY 持久化文件（权限 600） |
| `/etc/systemd/system/shengan-seal.service` | 后端 systemd 服务配置 |
| `/etc/nginx/sites-available/shengan-seal` | nginx 站点配置 |
| `/etc/nginx/ssl/` | SSL 证书存放目录 |
| `/usr/local/bin/shengan-clean-logs.sh` | 日志清理脚本 |
| `/etc/cron.d/shengan-clean` | 日志清理 cron |

### 关键端口

| 端口 | 用途 |
|------|------|
| 8082 | nginx 对外 HTTP 端口（可改） |
| 5000 | Flask/gunicorn 后端端口（仅 127.0.0.1 监听，不对外暴露） |
| 443 | nginx 对外 HTTPS 端口（启用 HTTPS 时） |

---

## 交付检查清单

部署完成后请逐项打勾：

- [ ] 网站首页能正常打开，所有图片显示正常
- [ ] 12 款产品图片都能加载（点击产品详情页确认）
- [ ] 管理后台能登录（默认 admin / shengan2026）
- [ ] sitemap.xml 指向正确的域名（curl `/api/sitemap.xml` 检查）
- [ ] robots.txt 能访问（curl `/api/robots.txt` 检查）
- [ ] HTTPS 已启用（生产环境）
- [ ] 默认密码已修改
- [ ] 数据库自动备份 cron 已配置
- [ ] 服务器防火墙已配置（开放 80/443 或自定义端口）

---

## 联系支持

- 项目仓库：https://github.com/xingpeiluo-design/shengan-seal
- 技术支持：罗东 / 13507402179
- 工作日记：`00_【操作日记前必读SUMMARY.md、CLAUDE.md】工作日记/`