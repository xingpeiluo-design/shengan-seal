import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  site: 'https://www.maichewei.com',
  base: '/shengan',
  // SSG 模式：构建时生成静态 HTML
  output: 'static',
  // 构建时获取产品数据
  vite: {
    plugins: [],
  },
});
