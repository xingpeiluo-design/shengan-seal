import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

// https://vite.dev/config/
//
// 部署适配（两个核心变量）：
//   VITE_BASE_PATH  HTML 中 <base href> 和静态资源前缀
//                   · /            → 独立域名根部署（推荐用于客户 VPS）
//                   · /shengan/    → 主站子路径部署（当前生产环境）
//                   · /任意子路径/ → 其他子路径场景
//
//   VITE_SITE_URL  站点绝对 URL（用于 canonical、og:url、JSON-LD）
//                   注意：这个值会原样写入 HTML 的 <link>/<meta>，**不需要**带尾斜杠以外的差异
//                   · 默认 https://www.maichewei.com/shengan/
//                   · 客户域名部署时改为 https://shengan.example.com/（不带子路径）
//
// 部署到客户独立域名的工作流：
//   1. .env.production 里 VITE_BASE_PATH=/  + VITE_SITE_URL=https://shengan.example.com/
//   2. 后端服务环境变量 SHENGAN_SITE_URL=https://shengan.example.com/
//   3. 重新 build 前端 + 重启后端
//   4. nginx 配置客户域名解析到 8082 即可
export default defineConfig(({ mode }) => {
  // build 时根据当前 mode 加载对应的 .env 文件
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE_PATH || '/'
  // SITE_URL 默认值与后端保持一致
  const siteUrl = env.VITE_SITE_URL || 'https://www.maichewei.com/shengan/'
  return {
    base,
    plugins: [
      react(),
      {
        name: 'inject-html-vars',
        transformIndexHtml: {
          order: 'pre',
          handler(html) {
            return html
              // 注入 <base href>（Vite 本身不自动做这件事）
              .replace('<head>', `<head>\n    <base href="${base}" />`)
              // 替换 SEO 相关的占位符为站点绝对 URL
              .replace(/__SITE_URL__/g, siteUrl)
          },
        },
      },
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
});