import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      // 开发时使用源码，生产时使用构建后的文件
      '@js-router/lib': process.env.NODE_ENV === 'production'
        ? resolve(__dirname, '../lib/dist/app.js')
        : resolve(__dirname, '../lib/src/app.js')
    }
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
