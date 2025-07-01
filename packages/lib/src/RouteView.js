/**
 * RouteView Web Component
 * 用于渲染匹配的路由内容
 */

export class RouteView extends HTMLElement {
    constructor() {
        super()
        this.router = null
        this.currentRoute = null
        this.isLoading = false
    }

    async connectedCallback() {
        // 从全局获取router实例或从父级传递
        this.router = this.getRouter()

        if (this.router) {
            // 监听路由变化
            this.router.addRouteChangeListener(this.handleRouteChange.bind(this))
            // 初始渲染
            await this.handleRouteChange(this.router.currentRoute)
        } else {
            // 等待路由器初始化
            this.waitForRouter()
        }
    }

    waitForRouter() {
        const checkRouter = () => {
            this.router = this.getRouter()
            if (this.router) {
                console.log('RouteView: Router found, initializing...')
                this.router.addRouteChangeListener(this.handleRouteChange.bind(this))
                this.handleRouteChange(this.router.currentRoute)
            } else {
                setTimeout(checkRouter, 100)
            }
        }
        checkRouter()
    }

    disconnectedCallback() {
        if (this.router) {
            this.router.removeRouteChangeListener(this.handleRouteChange.bind(this))
        }
    }

    getRouter() {
        // 尝试从全局获取
        if (window.__router__) {
            return window.__router__
        }
        
        // 尝试从父级元素获取
        let parent = this.parentElement
        while (parent) {
            if (parent.router) {
                return parent.router
            }
            parent = parent.parentElement
        }
        
        return null
    }

    async handleRouteChange(route) {
        if (!route) {
            this.innerHTML = ''
            return
        }

        this.currentRoute = route
        
        // 显示加载状态
        if (this.hasAttribute('loading-template')) {
            this.showLoading()
        }

        try {
            await this.renderRoute(route)
        } catch (error) {
            console.error('RouteView: Error rendering route', error)
            this.renderError(error)
        }
    }

    async renderRoute(route) {
        const { component, template, html } = route

        // 如果有组件函数
        if (typeof component === 'function') {
            const result = await component(route.params, route.query)

            // 检查返回的内容是否是文件路径
            if (this.isFilePath(result)) {
                console.log('检测到文件路径，加载外部HTML文件:', result)
                await this.loadExternalHTML(result, route)
            } else {
                // 直接渲染HTML内容
                this.innerHTML = result
            }
            return
        }

        // 如果有模板URL
        if (template) {
            const response = await fetch(template)
            if (!response.ok) {
                throw new Error(`Failed to load template: ${template}`)
            }
            const content = await response.text()
            this.innerHTML = this.interpolateTemplate(content, route.params, route.query)
            return
        }

        // 如果有直接的HTML内容
        if (html) {
            this.innerHTML = this.interpolateTemplate(html, route.params, route.query)
            return
        }

        // 默认显示路由信息
        this.innerHTML = `
            <div class="route-info">
                <h3>Route: ${route.path}</h3>
                <p>No component or template defined</p>
            </div>
        `
    }

    interpolateTemplate(template, params = {}, query = {}) {
        // 简单的模板插值，支持 {{param}} 语法
        return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
            const trimmedKey = key.trim()

            // 支持 params.xxx 和 query.xxx
            if (trimmedKey.startsWith('params.')) {
                const paramKey = trimmedKey.substring(7)
                return params[paramKey] || ''
            }

            if (trimmedKey.startsWith('query.')) {
                const queryKey = trimmedKey.substring(6)
                return query[queryKey] || ''
            }

            // 直接从params中查找
            return params[trimmedKey] || query[trimmedKey] || ''
        })
    }

    /**
     * 检测字符串是否是文件路径
     * @param {string} str - 要检测的字符串
     * @returns {boolean} 是否是文件路径
     */
    isFilePath(str) {
        if (typeof str !== 'string') return false

        const trimmed = str.trim()

        // 如果包含HTML标签，肯定不是文件路径
        if (trimmed.includes('<') && trimmed.includes('>')) {
            return false
        }

        // 检测常见的文件路径模式
        const filePathPatterns = [
            /^\.\/.*\.(html?|xml)$/,    // ./path/file.html
            /^\.\.\/.*\.(html?|xml)$/,  // ../path/file.html
            /^\/.*\.(html?|xml)$/,      // /path/file.html
            /^[^<>]*\.(html?|xml)$/,    // file.html (不包含<>字符)
            /^src\/.*\.(html?|xml)$/,   // src/path/file.html
            /^pages\/.*\.(html?|xml)$/, // pages/file.html
        ]

        const isPath = filePathPatterns.some(pattern => pattern.test(trimmed))
        console.log(`路径检测: "${trimmed}" -> ${isPath ? '文件路径' : 'HTML内容'}`)
        return isPath
    }

    /**
     * 加载外部HTML文件
     * @param {string} filePath - 文件路径
     * @param {Object} route - 路由对象
     */
    async loadExternalHTML(filePath, route) {
        try {
            console.log('开始加载外部HTML文件:', filePath)
            console.log('当前页面URL:', window.location.href)
            console.log('解析后的完整URL:', new URL(filePath, window.location.href).href)

            const response = await fetch(filePath)
            console.log('Fetch响应状态:', response.status, response.statusText)

            if (!response.ok) {
                // 尝试不同的路径解析方式
                const alternativePaths = this.generateAlternativePaths(filePath)
                console.log('尝试备用路径:', alternativePaths)

                for (const altPath of alternativePaths) {
                    try {
                        console.log('尝试加载:', altPath)
                        const altResponse = await fetch(altPath)
                        if (altResponse.ok) {
                            console.log('备用路径成功:', altPath)
                            const content = await altResponse.text()
                            this.innerHTML = this.interpolateTemplate(content, route.params, route.query)
                            this.executeScripts()
                            return
                        }
                    } catch (altError) {
                        console.log('备用路径失败:', altPath, altError.message)
                    }
                }

                throw new Error(`Failed to load HTML file: ${filePath} (${response.status} ${response.statusText})`)
            }

            const content = await response.text()
            console.log('HTML文件加载成功，内容长度:', content.length)

            // 支持模板插值
            this.innerHTML = this.interpolateTemplate(content, route.params, route.query)

            // 执行加载的HTML中的脚本
            this.executeScripts()

        } catch (error) {
            console.error('加载HTML文件失败:', error)
            this.innerHTML = `
                <div class="error" style="padding: 20px; background: #f8d7da; color: #721c24; border-radius: 8px; margin: 20px 0;">
                    <h3>❌ 加载失败</h3>
                    <p><strong>文件路径:</strong> <code>${filePath}</code></p>
                    <p><strong>错误信息:</strong> ${error.message}</p>
                    <p><strong>当前页面:</strong> ${window.location.href}</p>
                    <p><strong>解析URL:</strong> ${new URL(filePath, window.location.href).href}</p>
                    <details>
                        <summary>调试信息</summary>
                        <pre>${JSON.stringify({
                            filePath,
                            currentURL: window.location.href,
                            resolvedURL: new URL(filePath, window.location.href).href,
                            error: error.message
                        }, null, 2)}</pre>
                    </details>
                    <p>
                        <button onclick="location.reload()">重新加载页面</button>
                        <button onclick="router.push('/')">返回首页</button>
                    </p>
                </div>
            `
        }
    }

    /**
     * 生成备用文件路径
     * @param {string} originalPath - 原始路径
     * @returns {string[]} 备用路径数组
     */
    generateAlternativePaths(originalPath) {
        const alternatives = []

        // 如果是相对路径，尝试不同的基础路径
        if (originalPath.startsWith('./')) {
            const fileName = originalPath.substring(2)
            alternatives.push(
                fileName,                           // 直接文件名
                `../${fileName}`,                   // 上级目录
                `/examples/${fileName}`,            // 绝对路径到examples
                `examples/${fileName}`,             // 相对路径到examples
            )
        }

        // 如果路径包含pages，尝试不同的pages路径
        if (originalPath.includes('pages/')) {
            const pagesPart = originalPath.substring(originalPath.indexOf('pages/'))
            alternatives.push(
                pagesPart,                          // pages/file.html
                `./${pagesPart}`,                   // ./pages/file.html
                `../${pagesPart}`,                  // ../pages/file.html
                `/examples/${pagesPart}`,           // /examples/pages/file.html
            )
        }

        return alternatives
    }

    /**
     * 执行动态加载的HTML中的脚本
     */
    executeScripts() {
        const scripts = this.querySelectorAll('script')
        scripts.forEach(script => {
            const newScript = document.createElement('script')

            // 复制属性
            Array.from(script.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value)
            })

            // 复制内容
            if (script.src) {
                newScript.src = script.src
            } else {
                newScript.textContent = script.textContent
            }

            // 替换原脚本
            script.parentNode.replaceChild(newScript, script)
        })
    }

    showLoading() {
        const loadingTemplate = this.getAttribute('loading-template')
        if (loadingTemplate) {
            this.innerHTML = loadingTemplate
        } else {
            this.innerHTML = '<div class="route-loading">Loading...</div>'
        }
    }

    renderError(error) {
        const errorTemplate = this.getAttribute('error-template')
        if (errorTemplate) {
            this.innerHTML = errorTemplate.replace('{{error}}', error.message)
        } else {
            this.innerHTML = `
                <div class="route-error">
                    <h3>Error loading route</h3>
                    <p>${error.message}</p>
                </div>
            `
        }
    }

    // 静态方法用于注册组件
    static register(tagName = 'route-view') {
        if (!customElements.get(tagName)) {
            customElements.define(tagName, RouteView)
        }
    }
}

// 自动注册组件
RouteView.register()
