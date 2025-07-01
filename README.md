# JS Router

一个现代化的JavaScript SPA路由库，灵感来源于Vue Router，提供声明式路由、动态参数、Web Components等功能。

## ✨ 特性

- 🎯 **动态路由匹配** - 支持 `/user/:id`、`/posts/:category/:slug?` 等动态路由参数
- 🧩 **Web Components** - 内置 `<route-view>` 和 `<route-link>` 自定义元素
- ⚡ **程序化导航** - 提供 `router.push()`、`router.replace()` 等API
- 📋 **灵活的路由配置** - 支持组件函数、HTML模板、内联HTML等多种内容类型
- 🎨 **自动活跃状态** - 自动管理导航链接的活跃样式
- 🔍 **查询参数支持** - 完整的查询字符串和hash片段支持
- 📦 **轻量级** - 零依赖，体积小巧
- 🌐 **现代浏览器支持** - 基于ES6+和Web Components

## 🚀 快速开始

### 基本使用

```javascript
import { createRouter, defineRoutes } from '@js-router/lib'

// 定义路由配置
const routes = defineRoutes([
  {
    path: '/',
    name: 'home',
    component: () => '<h1>欢迎来到首页</h1>',
    meta: { title: '首页' }
  },
  {
    path: '/about',
    name: 'about',
    template: '/templates/about.html', // 从HTML文件加载
    meta: { title: '关于我们' }
  },
  {
    path: '/user/:id',
    name: 'user',
    component: (params, query) => `
      <div class="user-profile">
        <h2>用户资料</h2>
        <p>用户ID: ${params.id}</p>
        ${query.tab ? `<p>当前标签: ${query.tab}</p>` : ''}
      </div>
    `,
    meta: { title: '用户资料' }
  }
])

// 创建路由器
const router = createRouter({
  routes,
  mode: 'history'
})
```

### HTML模板

```html
<!DOCTYPE html>
<html>
<head>
  <title>JS Router Demo</title>
</head>
<body>
  <div id="app">
    <!-- 导航栏 -->
    <nav>
      <route-link to="/" exact-active-class="active">首页</route-link>
      <route-link to="/about" active-class="active">关于</route-link>
      <route-link to="/user/123?tab=profile" active-class="active">用户资料</route-link>
    </nav>
    
    <!-- 路由视图 -->
    <main>
      <route-view loading-template="<div>加载中...</div>"></route-view>
    </main>
  </div>
  
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

## 📚 API 文档

### createRouter(options)

创建路由器实例。

```javascript
const router = createRouter({
  routes: [], // 路由配置数组
  mode: 'history', // 'history' | 'hash'
  base: '/', // 基础路径
})
```

### 路由配置

```javascript
{
  path: '/user/:id',        // 路径模式
  name: 'user',             // 路由名称（可选）
  component: Function,      // 组件函数
  template: String,         // HTML模板URL
  html: String,             // 内联HTML
  meta: Object,             // 元信息
  redirect: String,         // 重定向路径
  children: Array           // 子路由（暂未实现）
}
```

### Router 实例方法

```javascript
// 程序化导航
router.push('/user/123')
router.push({ path: '/user/123', query: { tab: 'profile' } })
router.replace('/about')

// 历史导航
router.back()
router.forward()
router.go(-2)

// 获取当前路由
const currentRoute = router.currentRoute

// 监听路由变化
router.addRouteChangeListener((route) => {
  console.log('路由变化:', route)
})
```

### Web Components

#### `<route-view>`

渲染匹配的路由内容。

```html
<route-view 
  loading-template="<div class='loading'>加载中...</div>"
  error-template="<div class='error'>加载失败: {{error}}</div>">
</route-view>
```

#### `<route-link>`

声明式导航链接。

```html
<route-link 
  to="/user/123"
  active-class="router-link-active"
  exact-active-class="router-link-exact-active"
  exact
  replace>
  用户资料
</route-link>
```

**属性说明:**
- `to`: 目标路由路径
- `active-class`: 活跃时的CSS类名
- `exact-active-class`: 精确匹配时的CSS类名  
- `exact`: 是否精确匹配
- `replace`: 是否使用replace模式
- `tag`: 渲染的HTML标签（默认为'a'）

### 工具函数

```javascript
import { 
  useRouter,      // 获取当前路由器实例
  useRoute,       // 获取当前路由信息
  pathToRegexp,   // 路径转正则表达式
  matchPath,      // 路径匹配
  compilePath     // 编译路径模板
} from '@js-router/lib'

// 在组件中使用
const router = useRouter()
const route = useRoute()

// 路径匹配示例
const match = matchPath('/user/:id', '/user/123')
// { path: '/user/:id', params: { id: '123' }, isExact: true }
```

## 🎯 高级用法

### 动态路由参数

```javascript
// 支持多种参数模式
const routes = [
  { path: '/user/:id', component: UserComponent },           // 必需参数
  { path: '/posts/:id?', component: PostsComponent },        // 可选参数  
  { path: '/files/*path', component: FileComponent },        // 通配符参数
  { path: '/shop/:category/:product?', component: ShopComponent } // 多参数
]
```

### 模板插值

HTML模板支持简单的插值语法：

```html
<!-- user.html -->
<div class="user-page">
  <h1>用户: {{params.id}}</h1>
  <p>排序方式: {{query.sort}}</p>
</div>
```

### 路由元信息

```javascript
const routes = [
  {
    path: '/admin',
    component: AdminComponent,
    meta: {
      requiresAuth: true,
      title: '管理后台',
      breadcrumb: '管理'
    }
  }
]

// 使用元信息
router.addRouteChangeListener((route) => {
  if (route.meta.title) {
    document.title = route.meta.title
  }
  
  if (route.meta.requiresAuth && !isAuthenticated()) {
    router.push('/login')
  }
})
```

## 🛠️ 开发

### 项目结构

```
js-router/
├── packages/
│   ├── lib/                    # 核心库
│   │   ├── src/               # 源代码
│   │   │   ├── app.js       # 主入口
│   │   │   ├── useRouter.js   # 路由器核心
│   │   │   ├── pathToRegexp.js # 路径匹配
│   │   │   ├── RouteView.js   # route-view组件
│   │   │   ├── RouteLink.js   # route-link组件
│   │   │   └── createRouter.js # 公共API
│   │   ├── dist/              # 构建输出 (ESM格式)
│   │   ├── package.json
│   │   └── vite.config.js     # Vite构建配置
│   └── play/                  # 示例项目
│       ├── src/
│       ├── public/
│       ├── package.json
│       └── vite.config.js     # 开发服务器配置
├── package.json               # 根目录配置
└── README.md
```

### 本地开发

```bash
# 克隆项目
git clone <repository-url>
cd js-router

# 安装依赖
npm install

# 构建核心库 (首次运行必需)
npm run build

# 启动示例项目
npm run dev
```

### 构建命令

```bash
# 构建核心库 (输出ESM格式到 packages/lib/dist/)
npm run build

# 构建示例项目
npm run build:play

# 构建所有项目
npm run build:all

# 预览构建结果
npm run preview
```

### 使用构建后的库

构建后的库位于 `packages/lib/dist/app.js`，提供标准的ESM格式：

```javascript
// 直接导入构建后的文件 (推荐)
import { createRouter, defineRoutes } from './packages/lib/dist/app.js'

// 在HTML中使用
<script type="module">
  import { createRouter, defineRoutes } from './packages/lib/dist/app.js'

  const routes = defineRoutes([
    { path: '/', component: () => '<h1>首页</h1>' }
  ])

  const router = createRouter({ routes }).init()
</script>

// 在package.json中配置路径映射
{
  "imports": {
    "@js-router/lib": "./packages/lib/dist/app.js"
  }
}

// 在Vite项目中配置别名
// vite.config.js
export default {
  resolve: {
    alias: {
      '@js-router/lib': './packages/lib/dist/app.js'
    }
  }
}
```

### 完整示例

查看 `examples/basic-usage.html` 获取完整的HTML + ESM使用示例。

## 🌟 示例

查看 `packages/play` 目录获取完整的使用示例，包括：

- 基础路由配置
- 动态参数路由
- 程序化导航
- 活跃链接样式
- 模板加载
- 错误处理

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 支持

如果你在使用过程中遇到问题，请：

1. 查看示例项目 `packages/play`
2. 阅读API文档
3. 提交 Issue

---

**享受现代化的JavaScript路由体验！** 🚀
