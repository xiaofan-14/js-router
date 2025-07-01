/**
 * 路径到正则表达式转换工具
 * 支持动态路由参数，如 /user/:id, /posts/:category/:slug
 */

/**
 * 将路径模式转换为正则表达式
 * @param {string} path - 路径模式，如 '/user/:id'
 * @param {Object} options - 选项
 * @returns {Object} 包含正则表达式和参数名的对象
 */
export function pathToRegexp(path, options = {}) {
    const { sensitive = false, strict = false, end = true } = options
    
    // 存储参数名
    const keys = []
    
    // 转义特殊字符
    let pattern = path
        .replace(/[.+*?^${}()|[\]\\]/g, '\\$&') // 转义正则特殊字符
        .replace(/\\\*/g, '.*') // 处理通配符 *
    
    // 处理参数 :param
    pattern = pattern.replace(/\\?:([^(/\\]+)/g, (match, key) => {
        keys.push({ name: key, optional: false })
        return '([^/]+)' // 匹配除 / 外的任意字符
    })
    
    // 处理可选参数 :param?
    pattern = pattern.replace(/\\?:([^(/\\]+)\\\?/g, (match, key) => {
        keys.push({ name: key, optional: true })
        return '([^/]*?)' // 可选匹配
    })
    
    // 处理通配符参数 *param
    pattern = pattern.replace(/\\\*([^(/\\]*)/g, (match, key) => {
        if (key) {
            keys.push({ name: key, optional: false, wildcard: true })
        }
        return '(.*?)' // 匹配任意字符包括 /
    })
    
    // 添加开始和结束锚点
    if (end) {
        pattern = '^' + pattern + '$'
    } else {
        pattern = '^' + pattern
    }
    
    const flags = sensitive ? '' : 'i'
    const regexp = new RegExp(pattern, flags)
    
    return {
        regexp,
        keys,
        pattern
    }
}

/**
 * 匹配路径并提取参数
 * @param {string} pattern - 路径模式
 * @param {string} pathname - 实际路径
 * @param {Object} options - 选项
 * @returns {Object|null} 匹配结果或null
 */
export function matchPath(pattern, pathname, options = {}) {
    const { regexp, keys } = pathToRegexp(pattern, options)
    const match = regexp.exec(pathname)
    
    if (!match) {
        return null
    }
    
    const params = {}
    const url = match[0]
    
    // 提取参数值
    for (let i = 1; i < match.length; i++) {
        const key = keys[i - 1]
        const value = match[i]
        
        if (key) {
            params[key.name] = value ? decodeURIComponent(value) : value
        }
    }
    
    return {
        path: pattern,
        url,
        isExact: url === pathname,
        params
    }
}

/**
 * 编译路径模板，用于生成URL
 * @param {string} pattern - 路径模式
 * @param {Object} params - 参数对象
 * @returns {string} 编译后的路径
 */
export function compilePath(pattern, params = {}) {
    let path = pattern
    
    // 替换参数
    path = path.replace(/:([^(/\\?]+)\??/g, (match, key) => {
        const value = params[key]
        if (value === undefined || value === null) {
            if (match.endsWith('?')) {
                return '' // 可选参数为空时移除
            }
            throw new Error(`Missing required parameter: ${key}`)
        }
        return encodeURIComponent(value)
    })
    
    // 替换通配符参数
    path = path.replace(/\*([^(/\\]*)/g, (match, key) => {
        const value = params[key] || ''
        return encodeURIComponent(value)
    })
    
    return path
}

/**
 * 检查两个路径是否匹配
 * @param {string} pattern - 路径模式
 * @param {string} pathname - 实际路径
 * @param {Object} options - 选项
 * @returns {boolean} 是否匹配
 */
export function isMatch(pattern, pathname, options = {}) {
    return matchPath(pattern, pathname, options) !== null
}
