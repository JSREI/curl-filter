import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 设置基础路径为实际部署路径，适配GitHub Pages
  base: '/curl-filter/',
  server: {
    port: 25519,
    host: true
  },
  build: {
    // 确保构建输出目录为 dist
    outDir: 'dist',
    // 生成源映射文件用于调试
    sourcemap: true,
    // 清理输出目录
    emptyOutDir: true
  }
})
