/**
 * 创建路由器的工厂函数和相关API
 */

import { Router } from './useRouter.js'
import './RouteView.js'
import './RouteLink.js'

/**
 * 创建路由器实例
 * @param {Object} options - 路由器配置
 * @param {Array} options.routes - 路由配置数组
 * @param {string} options.mode - 路由模式 'history' | 'hash'
 * @param {string} options.base - 基础路径
 * @param {Function} options.scrollBehavior - 滚动行为函数
 * @returns {Router} 路由器实例
 */
export function createRouter(options = {}) {
    const { routes = [], ...routerOptions } = options

    const router = new Router(routes, routerOptions)

    // 立即设置全局路由器实例，确保组件能够获取到
    if (typeof window !== 'undefined') {
        window.__router__ = router
    }

    // 自动初始化
    if (typeof window !== 'undefined') {
        // 等待DOM加载完成后初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                router.init()
            })
        } else {
            // DOM已经加载完成，立即初始化
            setTimeout(() => router.init(), 0)
        }
    }

    return router
}

/**
 * 获取当前路由器实例
 * @returns {Router|null} 当前路由器实例
 */
export function useRouter() {
    if (typeof window !== 'undefined' && window.__router__) {
        return window.__router__
    }
    
    console.warn('useRouter: No router instance found. Make sure to call createRouter() first.')
    return null
}

/**
 * 获取当前路由信息
 * @returns {Object|null} 当前路由对象
 */
export function useRoute() {
    const router = useRouter()
    return router ? router.currentRoute : null
}

/**
 * 创建路由链接的辅助函数
 * @param {string|Object} to - 目标路由
 * @param {Object} params - 路由参数
 * @param {Object} query - 查询参数
 * @returns {string} 完整的URL
 */
export function createRouteLink(to, params = {}, query = {}) {
    const router = useRouter()
    if (!router) {
        return typeof to === 'string' ? to : to.path || '/'
    }

    // 使用router的内部方法构建URL
    if (typeof to === 'string') {
        return to
    }

    let url = to.path || '/'

    if (params && Object.keys(params).length > 0) {
        // 简单的参数替换
        Object.entries(params).forEach(([key, value]) => {
            url = url.replace(`:${key}`, encodeURIComponent(value))
        })
    }

    if (query && Object.keys(query).length > 0) {
        const queryString = Object.entries(query)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&')
        url += '?' + queryString
    }

    if (to.hash) {
        url += '#' + to.hash
    }

    return url
}

/**
 * 路由守卫相关API
 */
export class RouteGuard {
    static beforeEach = []
    static beforeResolve = []
    static afterEach = []
    
    static addBeforeEach(guard) {
        this.beforeEach.push(guard)
    }
    
    static addBeforeResolve(guard) {
        this.beforeResolve.push(guard)
    }
    
    static addAfterEach(guard) {
        this.afterEach.push(guard)
    }
    
    static removeGuard(guardArray, guard) {
        const index = guardArray.indexOf(guard)
        if (index > -1) {
            guardArray.splice(index, 1)
        }
    }
}

/**
 * 路由元信息工具
 */
export const RouteUtils = {
    /**
     * 检查路由是否需要认证
     */
    requiresAuth(route) {
        return route && route.meta && route.meta.requiresAuth === true
    },
    
    /**
     * 获取路由标题
     */
    getTitle(route, defaultTitle = '') {
        if (route && route.meta && route.meta.title) {
            return typeof route.meta.title === 'function' 
                ? route.meta.title(route) 
                : route.meta.title
        }
        return defaultTitle
    },
    
    /**
     * 获取面包屑导航
     */
    getBreadcrumbs(route) {
        const breadcrumbs = []
        if (route && route.matched) {
            route.matched.forEach(match => {
                if (match.meta && match.meta.breadcrumb) {
                    breadcrumbs.push({
                        text: match.meta.breadcrumb,
                        path: match.path,
                        route: match
                    })
                }
            })
        }
        return breadcrumbs
    }
}

/**
 * 简化的路由配置创建器
 */
export function defineRoutes(routes) {
    return routes.map(route => {
        // 标准化路由配置
        const normalizedRoute = {
            path: route.path,
            name: route.name,
            meta: route.meta || {},
            ...route
        }
        
        // 处理子路由
        if (route.children) {
            normalizedRoute.children = defineRoutes(route.children)
        }
        
        return normalizedRoute
    })
}

/**
 * 路由懒加载辅助函数
 */
export function defineAsyncComponent(loader) {
    return async (params, query) => {
        try {
            const module = await loader()
            if (typeof module.default === 'function') {
                return await module.default(params, query)
            }
            return module.default || module
        } catch (error) {
            console.error('Failed to load async component:', error)
            return '<div class="error">Failed to load component</div>'
        }
    }
}

// 注意：避免循环引用，这些导出在index.js中处理
