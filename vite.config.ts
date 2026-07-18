import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

// ============================================================
// 盛安密封官网 · Vite 配置
// ============================================================
//
// 售卖标准（最简方案 A）：
//   所有静态资源统一使用【根相对路径 /】
//   · <img src="/images/xxx">      → 客户部署到任意域名/IP 都自动适配
//   · fetch('/api/products')        → 走根路径，客户无需修改
//   · 客户只需：解析域名 + 配置 SSL + 重启服务
//
// 关于 base：
//   默认 base='/'（根部署·推荐）
//   如果客户必须部署到子路径（如 https://主站.com/shengan/）：
//     在 .env.production 设置 VITE_BASE_PATH=/shengan/
//     同时配置 nginx location 反代 + fetch 路径会自动加上 /shengan 前缀
//
// 关于 SEO 绝对 URL（canonical / og:url / JSON-LD logo）：
//   这些不影响资源加载，部署到独立域名后由【管理后台→系统设置】填入站点 URL 即可
//   不再硬编码在源码中（卖源码标准：不要把客户域名/IP 写死在代码里）
//
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE_PATH || '/'

  return {
    base,
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
});