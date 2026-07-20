# 盛安密封问题自检工具 ai-site-audit + 工具清单真伪甄别

关联工作日记：2026-07-20_盛安密封三大问题修复与Spec-Kit安装

## 一、用户真实诉求
用户（小白）确认了盛安密封有"前端硬编码 / 前后端错位 / 启动建 SQL"三类问题（上轮已修复），现在要的是：
1. 以后别的 AI 生成项目，怎么**自己检测**这类问题；
2. 甄别他贴来的一份工具清单里**哪些是真能用的、哪些是被 AI 编造的**。

## 二、交付物：可复用检测 Skill ai-site-audit
位置：`~/.workbuddy/skills/ai-site-audit/`（scan.py + SKILL.md），用户级，全项目通用。
一条命令扫全三类问题：
```bash
python ~/.workbuddy/skills/ai-site-audit/scan.py <项目根目录>
```
- 【1】前端硬编码：手机号 / 外链 / 图片地址（标 `*` 为"疑似兜底值"，含 `||` 或 `settings.`，后台可覆盖）。
- 【2】危险数据库初始化：`force/drop/create_all/sync` 等启动清空表配置。
- 【3】前后端字段错位：后端字段（CREATE TABLE 列 + `row['x']` + jsonify key，兼容 SQLAlchemy `Column()`/`=Column()`）与前端取值（camelCase→snake 对齐）对比，列出前端读、后端没提供的字段。

### 验证（盛安密封，已修复态）
- 【2】危险 SQL：0 处（已修复 init_db 幂等）。
- 【3】错位：仅 3 个框架内部属性（data_key/for_each/is_route），可接受。
- 【1】硬编码：24 处，绝大多数是修复后的 `settings.x || fallback`（标 `*`）；工具**额外抓出上轮漏改的真硬编码** `BannerCarousel.tsx:23` 幻灯片 `href2` 写死拼多多链接 → 已改为空 + 渲染回退 `settings.pdd_link`，构建通过，复扫降至 24 处。
- 造 demo（故意留 DROP TABLE / shopUrl 错位）复测：工具正确抓出【2】与【3】真问题，证明灵敏度。

## 三、用户贴的工具清单——真伪甄别
**真实可用（推荐）**：SonarLint（VSCode 插件，静态扫硬编码/危险SQL）、ESLint+禁硬编码规则、Semgrep（开源，规则名是示意非精确）、Spectral（OpenAPI 字段校验）、Playwright（动态业务测试，最适合验证"后台改前台是否同步"）、Postman、Testcontainers。

**被 AI 编造 / 不实（勿信）**：
- Spec-Kit 内置 "Frontend Hardcode Check / API Consistency / DB Migration Safety" 三个 Skill —— **不存在**。Spec-Kit 实际命令只有 /constitution /specify /plan /tasks /validate，/validate 是校验 spec 符合度，不是那三个检测器。
- `github.com/yourduskquibbles/ai-code-audit` —— 占位假链接，非真实项目。
- `fullstack-linter` —— 非已知真实项目，系泛称。
- "Cursor/Claude 自定义提示词 Skill" —— 只是段提示词模板，不是工具，可当 prompt 用但别当成品。

## 四、给小白的最小落地建议
1. 检测：本机跑 `ai-site-audit` 扫描器（零安装）+ VSCode 装 SonarLint；
2. 终审：必做"人工业务测试"——后台改电话/产品→刷新前台看是否同步、加 2 条数据→停启后端看是否丢失；
3. 预防：新项目让 AI 先出数据库表→接口文档→再写前端，并要求关闭 `force` 删表同步。

## 五、未做 / 待确认
- 改动未 git 提交、未部署（dist 已 rebuild，需部署才对线上生效）。
- 用户若同意，下一步：git commit + 部署到小红 VPS；或把 ai-site-audit 用于巡检其他 AI 生成项目。
