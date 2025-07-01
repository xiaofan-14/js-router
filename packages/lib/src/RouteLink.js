/**
 * RouteLink Web Component
 * 提供声明式路由导航功能
 */

import { isMatch } from './pathToRegexp.js'

export class RouteLink extends HTMLElement {
    constructor() {
        super()
        this.router = null
        this.boundHandleClick = this.handleClick.bind(this)
        this.boundHandleRouteChange = this.handleRouteChange.bind(this)
        this.isRendered = false
        this.originalContent = ''
        this.linkElement = null

        // 在构造函数中尝试保存内容
        console.log('constructor - 元素状态:', {
            innerHTML: `"${this.innerHTML}"`,
            textContent: `"${this.textContent}"`
        })
    }

    static get observedAttributes() {
        return ['to', 'replace', 'active-class', 'exact-active-class', 'exact']
    }

    connectedCallback() {
        this.router = this.getRouter()

        console.log('connectedCallback - 元素状态:', {
            tagName: this.tagName,
            innerHTML: `"${this.innerHTML}"`,
            textContent: `"${this.textContent}"`,
            isConnected: this.isConnected
        })

        // 使用 setTimeout 确保 DOM 完全加载
        setTimeout(() => {
            console.log('延迟检查 - 元素状态:', {
                innerHTML: `"${this.innerHTML}"`,
                textContent: `"${this.textContent}"`
            })

            // 保存原始内容
            this.saveOriginalContent()

            // 尝试渲染
            this.tryRender()
        }, 0)

        // 绑定事件
        this.addEventListener('click', this.boundHandleClick)

        if (this.router) {
            this.router.addRouteChangeListener(this.boundHandleRouteChange)
        }
    }

    saveOriginalContent() {
        console.log('saveOriginalContent - 开始:', {
            textContent: `"${this.textContent}"`,
            innerHTML: `"${this.innerHTML}"`,
            childNodes: this.childNodes.length,
            children: this.children.length
        })

        // 检查所有子节点
        for (let i = 0; i < this.childNodes.length; i++) {
            const node = this.childNodes[i]
            console.log(`子节点 ${i}:`, {
                nodeType: node.nodeType,
                nodeName: node.nodeName,
                nodeValue: node.nodeValue,
                textContent: node.textContent
            })
        }

        // 保存原始内容，优先使用 textContent
        this.originalContent = this.textContent.trim()

        // 如果 textContent 为空，尝试从 innerHTML 提取
        if (!this.originalContent && this.innerHTML.trim()) {
            const temp = document.createElement('div')
            temp.innerHTML = this.innerHTML
            this.originalContent = temp.textContent.trim()
        }

        // 如果还是为空，尝试直接从子节点获取
        if (!this.originalContent) {
            let content = ''
            for (let node of this.childNodes) {
                if (node.nodeType === Node.TEXT_NODE) {
                    content += node.textContent
                }
            }
            this.originalContent = content.trim()
        }

        console.log('saveOriginalContent - 结果:', {
            originalContent: `"${this.originalContent}"`
        })
    }

    tryRender() {
        // 如果已经渲染过，跳过
        if (this.isRendered) {
            return
        }

        console.log('tryRender:', {
            originalContent: this.originalContent,
            hasContent: !!this.originalContent
        })

        // 如果有原始内容，立即渲染
        if (this.originalContent) {
            this.render()
            if (this.router) {
                this.updateActiveState()
            }
        } else {
            // 如果没有内容，重新尝试保存内容
            this.saveOriginalContent()
            if (this.originalContent) {
                this.render()
                if (this.router) {
                    this.updateActiveState()
                }
            } else {
                // 仍然没有内容，稍后再试
                setTimeout(() => this.tryRender(), 50)
            }
        }
    }

    disconnectedCallback() {
        this.removeEventListener('click', this.boundHandleClick)
        
        if (this.router) {
            this.router.removeRouteChangeListener(this.boundHandleRouteChange)
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === 'to') {
                this.render()
            }
            this.updateActiveState()
        }
    }

    getRouter() {
        console.log('getRouter - 尝试获取路由器:', {
            windowRouter: window.__router__,
            windowRouterType: typeof window.__router__
        })

        // 尝试从全局获取
        if (window.__router__) {
            console.log('getRouter - 从全局获取到路由器')
            return window.__router__
        }

        // 尝试从父级元素获取
        let parent = this.parentElement
        while (parent) {
            if (parent.router) {
                console.log('getRouter - 从父元素获取到路由器')
                return parent.router
            }
            parent = parent.parentElement
        }

        console.log('getRouter - 未找到路由器实例')
        return null
    }

    render() {
        const to = this.getAttribute('to')
        const tag = this.getAttribute('tag') || 'a'

        if (!to) {
            console.warn('RouteLink: "to" attribute is required')
            return
        }

        // 如果已经渲染过，只更新href
        if (this.isRendered) {
            if (tag === 'a') {
                this.setAttribute('href', to)
            }
            return
        }

        // 如果没有保存的原始内容，现在再次尝试获取
        if (!this.originalContent) {
            this.originalContent = this.textContent.trim()
            console.log('render - 重新获取内容:', `"${this.originalContent}"`)
        }

        console.log('RouteLink render:', {
            to,
            originalContent: this.originalContent,
            currentTextContent: this.textContent,
            currentInnerHTML: this.innerHTML
        })

        // 如果仍然没有内容，使用当前的 textContent 或默认值
        const contentToUse = this.originalContent || this.textContent.trim() || '链接'

        // 简化方案：直接将 route-link 元素转换为链接行为
        // 不创建内部元素，保持原有DOM结构

        if (tag === 'a') {
            this.setAttribute('href', to)
        } else {
            this.setAttribute('data-route-link', 'true')
            this.setAttribute('data-to', to)
        }

        // 确保内容正确显示
        if (this.textContent.trim() !== contentToUse) {
            this.textContent = contentToUse
        }

        // 设置基本的链接样式
        this.style.cursor = 'pointer'
        if (tag === 'a') {
            this.style.textDecoration = this.style.textDecoration || 'none'
        }

        this.isRendered = true

        console.log('RouteLink rendered (简化版):', {
            href: this.getAttribute('href'),
            textContent: this.textContent,
            finalHTML: this.outerHTML
        })
    }

    // 简化版本 - 不再需要复制样式，因为我们保持了原始DOM结构

    handleClick(event) {
        console.log('RouteLink handleClick 触发:', {
            target: event.target,
            currentTarget: event.currentTarget,
            to: this.getAttribute('to')
        })

        // 检查是否应该阻止导航
        if (this.shouldPreventNavigation(event)) {
            console.log('导航被阻止')
            return
        }

        event.preventDefault()

        const to = this.getAttribute('to')
        const replace = this.hasAttribute('replace')

        if (!to) {
            console.warn('RouteLink: 缺少 to 属性')
            return
        }

        // 重新尝试获取路由器实例（可能在初始化时还没有准备好）
        if (!this.router) {
            this.router = this.getRouter()
        }

        if (!this.router) {
            console.warn('RouteLink: 找不到路由器实例', {
                windowRouter: window.__router__,
                globalRouter: typeof window !== 'undefined' ? window.__router__ : null
            })
            return
        }

        console.log('执行导航:', { to, replace, router: this.router })

        // 执行导航
        if (replace) {
            this.router.replace(to)
        } else {
            this.router.push(to)
        }
    }

    shouldPreventNavigation(event) {
        // 如果按住修饰键，让浏览器处理默认行为
        if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) {
            return true
        }
        
        // 如果不是左键点击
        if (event.button !== 0) {
            return true
        }
        
        // 如果有target属性
        const target = this.getAttribute('target')
        if (target && target !== '_self') {
            return true
        }
        
        return false
    }

    handleRouteChange() {
        this.updateActiveState()
    }

    updateActiveState() {
        if (!this.router) {
            return
        }

        const to = this.getAttribute('to')
        const currentPath = this.router.currentRoute?.path || window.location.pathname
        const exact = this.hasAttribute('exact')
        
        if (!to) {
            return
        }

        const isActive = exact 
            ? currentPath === to 
            : isMatch(to, currentPath) || currentPath.startsWith(to)
        
        const isExactActive = currentPath === to

        // 更新CSS类
        const activeClass = this.getAttribute('active-class') || 'router-link-active'
        const exactActiveClass = this.getAttribute('exact-active-class') || 'router-link-exact-active'
        
        // 移除旧的类
        this.classList.remove(activeClass, exactActiveClass)
        
        // 添加新的类
        if (isActive) {
            this.classList.add(activeClass)
        }
        
        if (isExactActive) {
            this.classList.add(exactActiveClass)
        }

        // 更新aria-current属性
        if (isExactActive) {
            this.setAttribute('aria-current', 'page')
        } else {
            this.removeAttribute('aria-current')
        }
    }

    // 静态方法用于注册组件
    static register(tagName = 'route-link') {
        if (!customElements.get(tagName)) {
            customElements.define(tagName, RouteLink)
        }
    }
}

// 自动注册组件
RouteLink.register()
