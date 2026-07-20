# 盛安密封官网 Constitution

> 项目宪法（Spec-Driven Development 顶层契约）。所有功能规范、代码、AI 生成逻辑必须遵守。
> 本文件由 AI 辅助生成代码时作为固定上下文，违反任一条红线即判定为不合格产出。

## Core Principles

### I. 禁止前端硬编码业务值（NON-NEGOTIABLE）
所有面向访客的业务内容（公司电话、公司名、地址、拼多多/商城外链、banner 文案、产品分类、
图片地址、SEO 元数据）**必须来自后端 `/api/settings` 或对应数据接口**，禁止在 `.tsx/.ts/.html`
中写死字面量。
- 前端统一通过 `src/lib/settings.ts` 的 `useSettings()` 读取后台设置，写死值仅允许作为
  `settings.x || '兜底值'` 形式的降级默认（且兜底值需与真实业务一致）。
- `index.html` 的 meta/JSON-LD 电话由 `HomePage` 的 effect 在运行时用 `settings.hotline` 覆盖。
- 检测：提交前运行 `ai-site-audit` 的【1】扫描，生产代码中出现无 `||`/`settings.` 兜底的
  手机号/外链即视为违规。

### II. 前后端字段命名强制统一（NON-NEGOTIABLE）
数据库字段、后端接口返回字段、前端取值字段**命名必须完全一致**（统一 snake_case）。
- 新增字段顺序：先改数据库/后端模型 → 后端接口适配 → 前端页面新增输入/展示，禁止先写前端再补后端。
- 后端接口返回 JSON 的 key 使用 snake_case；前端 `useSettings()`/接口取值统一转 snake_case 比对。
- 检测：提交前运行 `ai-site-audit` 的【3】扫描，前端读取但后端未提供的业务字段必须为零（框架
  内部属性如 `data_key/for_each/is_route` 除外）。

### III. 禁止启动时清空/重建数据表（NON-NEGOTIABLE）
任何初始化代码不得在生产环境清空或重置业务数据。
- 建表使用 `CREATE TABLE IF NOT EXISTS`；灌种子前用 `COUNT(*)==0` 守卫，绝不 `DELETE FROM` 后无脑重插。
- 禁止 ORM `drop_all()` / `create_all()` / `sync(force=True)`。
- 修改模型字段使用增量迁移，不删表重建。
- 检测：提交前运行 `ai-site-audit` 的【2】扫描与 Semgrep `dangerous-db-reinit` 规则，命中即拦截。

### IV. 后台账号体系必须加密（NON-NEGOTIABLE）
- 管理员密码使用 **PBKDF2-HMAC-SHA256 + 随机盐 + SECRET_KEY(pepper)**，禁止纯 `sha256/pass)` 无盐哈希。
- 默认管理员密码来自环境变量 `SHENGAN_ADMIN_PASS` → `.admin_pass` 文件 → 随机生成，禁止源码写死弱口令。
- 密钥文件 `.secret_key` / `.admin_pass` 必须被 `.gitignore` 忽略，禁止提交进仓库。
- 检测：运行 Semgrep `plaintext-password-hash` 规则，命中即拦截。

## Development Workflow

- 任何 AI 生成/修改代码前，先加载本宪法与 `ai-site-audit` 自检清单。
- 提交（PR）前必须执行质量门控：`python ~/.workbuddy/skills/ai-site-audit/scan.py <项目根>` 与
  `semgrep scan --config ~/.workbuddy/skills/ai-site-audit/semgrep-rules.yaml <项目根>`，三者全绿方可合并。
- 静态扫描仅做初筛，**终审以人工业务测试为准**：后台改电话/产品 → 刷新前台是否同步；加 2 条数据 →
  完全停启后端数据是否保留。

## Governance

本宪法优先于任何临时实践。新增红线或修改需记录原因与迁移计划。每次 AI 辅助开发结束后复核本文件对应条款。

**Version**: 1.0.0 | **Ratified**: 2026-07-20 | **Last Amended**: 2026-07-20
