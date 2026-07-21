# 线上冒烟测试（browser-use）

一套用真实无头浏览器跑的线上冒烟用例，覆盖盛安密封网站的公共页、数据闭环、后台设置同步、鉴权与 CRUD。**不硬编码任何凭据**，需鉴权的用例通过环境变量注入密码，缺失则自动跳过。

## 前置：安装 browser-use CLI（一次性）

```bash
# 用受管 Python 建独立 venv
/Users/luodong/.workbuddy/binaries/python/versions/3.13.12/bin/python3 -m venv ~/.venvs/bu
~/.venvs/bu/bin/pip install browser-use
~/.venvs/bu/bin/browser-use doctor   # 确认 chrome 可用
```

## 运行

```bash
# 只跑无需鉴权的用例（TC-09/TC-13 会 SKIP）
BASE_URL=https://maichewei.com/shengan \
  ~/.venvs/bu/bin/browser-use < tests/smoke/browser_smoke.py

# 跑全部（含登录 & 受控 CRUD 闭环）——密码走环境变量，不写进代码
SHENGAN_ADMIN_PASS='<后台密码>' \
BASE_URL=https://maichewei.com/shengan \
  ~/.venvs/bu/bin/browser-use < tests/smoke/browser_smoke.py
```

结果写入 `$SMOKE_OUT_DIR`（默认 `/tmp/shengan_report`）下的 `results.json` 与 `home.png`。

## 用例清单

| 编号 | 用例 | 需鉴权 |
|---|---|---|
| TC-01 | 首页可访问 & React 已挂载 | 否 |
| TC-02 | 前端 JS/CSS 资源无 404 | 否 |
| TC-03 | 产品列表从 /api/products 渲染 | 否 |
| TC-04 | 公开接口不泄露 is_test 测试产品 | 否 |
| TC-05 | 后台热线动态同步到前台 | 否 |
| TC-06 | tel: 链接号码 = 后台设置值 | 否 |
| TC-07 | 新闻板块从 /api/news 渲染 | 否 |
| TC-08 | SEO：description & JSON-LD | 否 |
| TC-09 | 后台登录返回 token | 是 |
| TC-10 | 未授权访问 /api/admin 被拒 | 否 |
| TC-11 | 移动端 viewport meta | 否 |
| TC-12 | 拼多多外链在前台渲染 | 否 |
| TC-13 | 后台创建→公开过滤→删除 数据闭环 | 是 |

> 环境变量：`BASE_URL`、`SHENGAN_ADMIN_USER`(默认 admin)、`SHENGAN_ADMIN_PASS`(无默认)、`SMOKE_OUT_DIR`。
