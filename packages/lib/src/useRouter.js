// Router.js - 重构后的现代化路由器
import { useListener } from './useListener.js'
import { matchPath, compilePath } from './pathToRegexp.js'

export class Router {
    #routes = []
    #options = {}
    #listener
    #routeChangeListeners = []
    #currentRoute = null
    #history = []
    #historyIndex = -1

    constructor(routes = [], options = {}) {
        this.#routes = this.normalizeRoutes(routes)
        this.#options = {
            mode: 'history', // 'history' | 'hash'
            base: '/',
            scrollBehavior: null,
            ...options
        }
        this.#listener = useListener()

        // 设置全局router实例
        if (typeof window !== 'undefined') {
            window.__router__ = this
        }
    }

    normalizeRoutes(routes) {
        return routes.map(route => ({
            path: route.path,
            component: route.component,
            template: route.template,
            html: route.html,
            name: route.name,
            meta: route.meta || {},
            redirect: route.redirect,
            children: route.children ? this.normalizeRoutes(route.children) : []
        }))
    }

    init() {
        // 绑定浏览器事件
        this.#listener.addListener(window, 'popstate', (e) => {
            this.handlePopState(e)
        })

        // 初始化当前路由
        this.#resolveCurrentRoute()

        return this
    }

    // 路由导航方法
    async push(to, onComplete, onAbort) {
        return this.#navigate(to, 'push', onComplete, onAbort)
    }

    async replace(to, onComplete, onAbort) {
        return this.#navigate(to, 'replace', onComplete, onAbort)
    }

    go(n) {
        window.history.go(n)
    }

    back() {
        this.go(-1)
    }

    forward() {
        this.go(1)
    }

    // 内部导航方法
    async #navigate(to, method = 'push', onComplete, onAbort) {
        try {
            const route = this.#resolveRoute(to)

            if (!route) {
                const error = new Error(`Route not found: ${to}`)
                if (onAbort) onAbort(error)
                throw error
            }

            // 处理重定向
            if (route.redirect) {
                return this.#navigate(route.redirect, method, onComplete, onAbort)
            }

            // 更新浏览器历史
            const url = typeof to === 'string' ? to : this.#buildUrl(to)

            // 创建可序列化的路由状态（排除函数）
            const serializableRoute = {
                path: route.path,
                name: route.name,
                params: route.params,
                query: route.query,
                meta: route.meta,
                matched: route.matched?.map(match => ({
                    path: match.path,
                    name: match.name,
                    params: match.params,
                    meta: match.meta
                    // 排除 component, template 等函数/复杂对象
                }))
            }

            if (method === 'replace') {
                window.history.replaceState({ route: serializableRoute }, '', url)
            } else {
                window.history.pushState({ route: serializableRoute }, '', url)
            }

            // 更新当前路由
            await this.#updateCurrentRoute(route)

            if (onComplete) onComplete(route)

            return route
        } catch (error) {
            console.error('Navigation error:', error)
            if (onAbort) onAbort(error)
            throw error
        }
    }

    // 路由解析
    #resolveRoute(to) {
        const path = typeof to === 'string' ? to : to.path
        const query = typeof to === 'object' ? to.query : this.#parseQuery()

        console.log('解析路由:', { path, routes: this.#routes.map(r => r.path) })

        // 查找匹配的路由（排除通配符路由）
        for (const route of this.#routes) {
            if (route.path === '*') continue // 跳过通配符路由，最后处理

            const match = matchPath(route.path, path)
            console.log(`匹配测试: ${route.path} vs ${path}`, match)

            if (match) {
                console.log('路由匹配成功:', route.path)
                return {
                    ...route,
                    path: match.path,
                    params: match.params,
                    query,
                    fullPath: path,
                    matched: [route]
                }
            }
        }

        // 如果没有匹配的路由，查找通配符路由（404）
        const wildcardRoute = this.#routes.find(route => route.path === '*')
        if (wildcardRoute) {
            console.log('使用通配符路由 (404)')
            return {
                ...wildcardRoute,
                path: wildcardRoute.path,
                params: {},
                query,
                fullPath: path,
                matched: [wildcardRoute]
            }
        }

        console.log('没有找到匹配的路由')
        return null
    }

    #resolveCurrentRoute() {
        const path = window.location.pathname
        const route = this.#resolveRoute(path)
        this.#updateCurrentRoute(route)
    }

    async #updateCurrentRoute(route) {
        this.#currentRoute = route

        // 通知所有监听器
        this.#routeChangeListeners.forEach(listener => {
            try {
                listener(route)
            } catch (error) {
                console.error('Route change listener error:', error)
            }
        })
    }

    handlePopState(event) {
        this.#resolveCurrentRoute()
    }

    // 工具方法
    #parseQuery(search = window.location.search) {
        const query = {}
        if (search.startsWith('?')) {
            search = search.slice(1)
        }

        search.split('&').forEach(param => {
            const [key, value] = param.split('=')
            if (key) {
                query[decodeURIComponent(key)] = value ? decodeURIComponent(value) : ''
            }
        })

        return query
    }

    #buildUrl(to) {
        if (typeof to === 'string') {
            return to
        }

        let url = to.path || '/'

        if (to.params) {
            url = compilePath(url, to.params)
        }

        if (to.query && Object.keys(to.query).length > 0) {
            const queryString = Object.entries(to.query)
                .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
                .join('&')
            url += '?' + queryString
        }

        if (to.hash) {
            url += '#' + to.hash
        }

        return url
    }

    // 监听器管理
    addRouteChangeListener(listener) {
        this.#routeChangeListeners.push(listener)
    }

    removeRouteChangeListener(listener) {
        const index = this.#routeChangeListeners.indexOf(listener)
        if (index > -1) {
            this.#routeChangeListeners.splice(index, 1)
        }
    }

    // Getter方法
    get currentRoute() {
        return this.#currentRoute
    }

    get routes() {
        return this.#routes
    }

    // 销毁方法
    destroy() {
        this.#routeChangeListeners = []
        if (window.__router__ === this) {
            delete window.__router__
        }
    }
}

// 保持向后兼容
export { Router as UseRouter }
