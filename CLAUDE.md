# CLAUDE.md — 盛安密封全栈项目审计指引

> 本文件供 Claude Code（或其他读取 CLAUDE.md 的 AI 编码助手）在进入本项目时使用。
> 目标：自动跑完静态复核，聚焦三类原始问题 + 安全风险。**剔除无效工具，只保留真实可运行项。**

---

## 项目概况

- 前端：React + Vite（构建产物 `dist/`，线上基路径 `/shengan/`）
- 后端：Flask + SQLite（`backend/app.py`、`backend/shengan.db`）
- 部署：小红 VPS `/var/www/shengan-seal`，公开站点 `https://maichewei.com/shengan/`
- 鉴权：登录 `POST /api/auth/login` → 返回 `token`，后续接口带 `Authorization: Bearer <token>`

## 真实可用工具（已安装、已验证）

- **Semgrep**：`semgrep scan --config ~/.workbuddy/skills/ai-site-audit/semgrep-rules.yaml backend src index.html`
- **ai-site-audit（自研）**：`python3 ~/.workbuddy/skills/ai-site-audit/scan.py .`
- 二者即本项目**底层门禁**，用于校验是否违背三条强制约束。

## 明确不使用的工具（本项目不适用）

- ❌ **Spectral / OpenAPI 校验**：后端无 `openapi.json` / Swagger，调用即空转。
- ❌ **`specify validate` / `specify analyze`**：`specify` 二进制无 `validate` 子命令，Spec-Kit 仅作规范底座。

---

## 一次性全局审计指令（复制直接发给 AI）

```
当前项目：盛安密封全栈网站
可用校验工具：semgrep、自研 ai-site-audit
不可用工具：specify validate、Spectral（项目无 OpenAPI 接口文档，无需执行）
本次需要你完整执行三层静态检测，输出结构化报告，只聚焦三类原始问题 + 安全风险：

1. 数据库风险扫描
   调用 semgrep 检索后端全部 ORM / SQL 代码，查找 sync force:true、drop_all、自动重建表逻辑，
   统计风险数量、文件行号；

2. 前端硬编码全局检索
   扫描所有 tsx/html/js/astro 页面，区分两类：
   - 业务硬编码（公司电话、地址、产品名称、宣传文案、图片 CDN 地址，高危）
   - 种子初始化兜底常量 / settings.x || '默认值'（允许存在，单独标注，不计入故障）

3. 前后端字段错位校验
   读取数据库模型、后端接口返回结构、前端渲染取值代码，自动比对字段映射，区分：
   ① 跨业务前后端字段不匹配（业务故障，高危）
   ② 前端组件内部私有属性（data_key/for_each/is_route/text_content，低风险，备注即可）

4. 安全附加检测
   检索明文密码、未哈希密钥、后台硬编码登录凭证，统计风险点；
   当前后台默认密码 shengan2026 标记为高危弱口令，给出修改方案。

输出规范：每条风险含 文件路径:行数、风险等级、业务影响、修复代码片段；
检测完成汇总统计：危险 DB 配置 X 处、高危硬编码 X 处、业务字段错位 X 处、安全漏洞 X 处。
```

## 动态业务验证（静态之外，必须补的闭环）

仅靠静态扫描查不出运行时问题，用 Playwright 自动跑（见 `tests/e2e/admin/dynamic-audit.spec.ts`）：
- 后台改配置 → 刷新前台验证同步；
- 新增测试产品 → 重启后端 → 验证数据保留。

## 三条强制开发约束（写入 .specify/constitution.md，源头限制错误）

1. 所有企业文案、电话、产品名称、静态图片地址**禁止前端硬编码**，必须后端接口动态获取；
2. 数据库模型字段、OpenAPI 接口返回字段、前端渲染取值字段命名**完全统一**；
3. 数据库 ORM 同步**禁止** `force` 强制重建、`drop` 清空表，仅允许迁移脚本管理结构变更。
