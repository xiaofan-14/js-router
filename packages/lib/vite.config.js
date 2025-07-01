import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      // 入口文件
      entry: resolve(__dirname, 'src/app.js'),
      name: 'JSRouter',
      // 输出文件名 - 使用函数形式避免重复后缀
      fileName: (format) => `index.${format === 'es' ? 'js' : format + '.js'}`,
      // 只构建 ES 模块格式
      formats: ['es']
    },
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: [],
      output: {
        // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
        globals: {}
      }
    },
    // 生成源码映射
    sourcemap: true,
    // 清空输出目录
    emptyOutDir: true,
    // 输出目录
    outDir: 'dist'
  },
  // 开发服务器配置
  server: {
    port: 3001
  }
})
