# 盛安密封官网 · 部署文档

> 交付版本：2026-07-29（对应 git 提交 7909459）
> 技术栈：React 18 + Vite（前端） / Flask + Gunicorn（后端） / SQLite（数据库，零配置） / Nginx（网关）
> **数据库是 SQLite 文件，不需要安装 MySQL，也不需要建库建表** —— 首次启动自动初始化。

---

## 一、服务器要求

| 项目 | 要求 |
|------|------|
| 配置 | 2 核 / 2G 内存 / 20G 硬盘 起步 |
| 系统 | Ubuntu 20.04+ / Debian 11+（推荐）；CentOS 7+ 也可 |
| 权限 | root |
| 软件 | 无需预装，一键脚本自动安装 nginx / python3 / nodejs / npm |

> 注意：脚本用 apt/yum 安装的 nodejs 版本较旧也能构建本项目；若构建报 Node 版本错误，装 Node 18+ 即可（`curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && apt-get install -y nodejs`）。

---

## 二、一键部署（3 步）

### 第 1 步：上传代码

把 `shengan-seal` 整个文件夹放到服务器 **`/var/www/shengan-seal`**（路径固定，deploy.sh 里写死了 `APP_DIR=/var/www/shengan-seal`）：

```bash
# 方式 A：本地 scp 上传
scp -r shengan-seal root@服务器IP:/var/www/

# 方式 B：先传 zip 再解压
# unzip shengan-seal.zip -d /var/www/
```

### 第 2 步：执行一键脚本

```bash
cd /var/www/shengan-seal
sudo bash deploy.sh
```

脚本自动完成：安装系统依赖 → 创建 Python venv 并装依赖 → **初始化 SQLite 数据库**（14 款产品 + 设置 + 资讯种子数据）→ npm install + 前端构建 → 配置 systemd 后端服务（gunicorn，127.0.0.1:5000）→ 配置 nginx（默认监听 **8082** 端口）→ 开防火墙端口。

完成后访问 `http://服务器IP:8082/` 应能看到网站。

### 第 3 步：绑域名 + SSL

```bash
# 1. 域名服务商处添加 A 记录：@ 和 www → 服务器 IP

# 2. 改 nginx 监听 80 并绑定域名
vi /etc/nginx/sites-available/shengan-seal
#   listen 8082;      → listen 80;
#   server_name _;    → server_name 你的域名 www.你的域名;
nginx -t && systemctl reload nginx

# 3. 申请免费 SSL（自动改写 nginx 配置为 443）
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d 你的域名 -d www.你的域名
```

完成，访问 `https://你的域名/`。

---

## 三、部署后必做

1. **获取后台初始密码**：全新部署首次启动时，系统会**自动生成随机管理员密码**并写入 `backend/.admin_pass`（不使用固定弱口令）。查看方式：
   ```bash
   cat /var/www/shengan-seal/backend/.admin_pass
   ```
   然后浏览器访问 `https://你的域名/admin`，用 `admin / 上面的密码` 登录，建议在「账号管理」改成自己的密码。
   也可以在部署前用环境变量指定初始密码：`SHENGAN_ADMIN_PASS=你的密码 bash deploy.sh`。
   密码使用 PBKDF2-HMAC-SHA256 + 随机盐加密存储，改密码只需在后台操作，**不需要改任何代码**。
2. **后台 → 系统设置**：把「站点 URL」填成客户正式域名（影响 SEO canonical / og:url / sitemap）。
3. **禁止 IP 直访（建议）**：在 nginx server 块顶部加：
   ```nginx
   if ($host != $server_name) { return 301 https://$server_name$request_uri; }
   ```

---

## 四、目录与配置说明

| 路径 | 说明 |
|------|------|
| `backend/app.py` | Flask 后端（API + 后台登录 + sitemap/robots） |
| `backend/init_db.py` | 数据库种子脚本（幂等：已有数据不会重建/清空） |
| `backend/shengan.db` | SQLite 数据库（**部署后自动生成**，升级代码时务必保留） |
| `backend/.secret_key` | 首次启动自动生成的密钥文件（务必保留，权限 600） |
| `dist/` | 前端构建产物（deploy.sh 自动生成） |
| `images/` | 产品图片（约 10MB，已含全部素材） |
| `.env.production` | 前端构建变量，默认 `VITE_BASE_PATH=/`（独立域名部署**不要改**） |
| `deploy.sh` | 一键部署脚本（可重复执行，数据库已存在时自动跳过初始化） |

**端口**：nginx 对外 8082（可改 `deploy.sh` 顶部 `PORT`，绑域名后建议直接改成 80）；gunicorn 后端 5000（仅监听 127.0.0.1，不对外）。

---

## 五、运维命令速查

```bash
systemctl status  shengan-seal   # 后端状态
systemctl restart shengan-seal   # 重启后端
journalctl -u shengan-seal -f    # 后端日志
nginx -t && systemctl reload nginx

# 升级代码（保留数据库和密钥）
cd /var/www/shengan-seal && sudo bash deploy.sh

# 数据备份（只需备这两样 + 图片）
cp backend/shengan.db /root/shengan-$(date +%Y%m%d).db
tar czf /root/images-$(date +%Y%m%d).tgz images/
```

---

## 六、常见问题

**Q1：首页 502**
`systemctl status shengan-seal` 看后端是否活着；`journalctl -u shengan-seal -n 50` 看报错。常见原因：5000 端口被占 → 改 `deploy.sh` 的 `BACKEND_PORT` 后重跑脚本。

**Q2：图片 404**
`curl -I http://127.0.0.1:8082/images/store_logo.webp` 应为 200；否则检查 `/var/www/shengan-seal/images/` 是否存在、权限 755。

**Q3：产品中心 0 款产品**
`curl http://127.0.0.1:5000/api/products` 应返回 JSON 数组。为空则 `cd backend && venv/bin/python init_db.py` 重新灌种子数据（幂等，不会覆盖已有数据）。

**Q4：前端资源 404（路径带 /shengan/）**
说明 `.env.production` 里 `VITE_BASE_PATH` 不是 `/`。改回 `VITE_BASE_PATH=/`，重新 `npm run build` 或重跑 `deploy.sh`。

**Q5：sitemap.xml 里的 URL 不对**
后台「系统设置」填站点 URL；或在 `/etc/systemd/system/shengan-seal.service` 加 `Environment=SHENGAN_SITE_URL=https://你的域名`，然后 `systemctl daemon-reload && systemctl restart shengan-seal`。

**Q6：忘记后台密码**
`.admin_pass` / 环境变量只在 admin 账号**首次创建**时生效，已有账号需重置：
```bash
cd /var/www/shengan-seal/backend
echo '新密码' > .admin_pass && chmod 600 .admin_pass
venv/bin/python -c "import sqlite3; db=sqlite3.connect('shengan.db'); db.execute('DELETE FROM admin_users'); db.commit()"
systemctl restart shengan-seal   # 重启后按 .admin_pass 重建 admin 账号
```
（此操作会清空后台账号表，仅重建 admin，产品/设置等业务数据不受影响。）

---

## 七、验收清单

- [ ] `https://域名/` 首页正常、图片不裂
- [ ] 产品中心能看到 14 款产品
- [ ] `https://域名/admin` 能登录，且默认密码已修改
- [ ] `https://域名/sitemap.xml`、`/robots.txt` 可访问
- [ ] HTTPS 锁形图标正常
- [ ] IP 直访 301 跳到域名
- [ ] 重启服务器后网站自动恢复（systemd 已 enable）
