function g() {
  const s = window;
  function t(i) {
    return i && typeof i.addEventListener == "function";
  }
  function e(i, r, o) {
    const a = i || s;
    t(a) && a.addEventListener(r, o);
  }
  function n(i, r, o) {
    const a = i || s;
    t(a) && a.removeEventListener(r, o);
  }
  return {
    addListener: e,
    removeListener: n
  };
}
function m(s, t = {}) {
  const { sensitive: e = !1, strict: n = !1, end: i = !0 } = t, r = [];
  let o = s.replace(/[.+*?^${}()|[\]\\]/g, "\\$&").replace(/\\\*/g, ".*");
  o = o.replace(/\\?:([^(/\\]+)/g, (u, c) => (r.push({ name: c, optional: !1 }), "([^/]+)")), o = o.replace(/\\?:([^(/\\]+)\\\?/g, (u, c) => (r.push({ name: c, optional: !0 }), "([^/]*?)")), o = o.replace(/\\\*([^(/\\]*)/g, (u, c) => (c && r.push({ name: c, optional: !1, wildcard: !0 }), "(.*?)")), i ? o = "^" + o + "$" : o = "^" + o;
  const a = e ? "" : "i";
  return {
    regexp: new RegExp(o, a),
    keys: r,
    pattern: o
  };
}
function p(s, t, e = {}) {
  const { regexp: n, keys: i } = m(s, e), r = n.exec(t);
  if (!r)
    return null;
  const o = {}, a = r[0];
  for (let l = 1; l < r.length; l++) {
    const u = i[l - 1], c = r[l];
    u && (o[u.name] = c && decodeURIComponent(c));
  }
  return {
    path: s,
    url: a,
    isExact: a === t,
    params: o
  };
}
function w(s, t = {}) {
  let e = s;
  return e = e.replace(/:([^(/\\?]+)\??/g, (n, i) => {
    const r = t[i];
    if (r == null) {
      if (n.endsWith("?"))
        return "";
      throw new Error(`Missing required parameter: ${i}`);
    }
    return encodeURIComponent(r);
  }), e = e.replace(/\*([^(/\\]*)/g, (n, i) => {
    const r = t[i] || "";
    return encodeURIComponent(r);
  }), e;
}
function R(s, t, e = {}) {
  return p(s, t, e) !== null;
}
class C {
  #t = [];
  #l = {};
  #r;
  #e = [];
  #i = null;
  #h = [];
  #d = -1;
  constructor(t = [], e = {}) {
    this.#t = this.normalizeRoutes(t), this.#l = {
      mode: "history",
      // 'history' | 'hash'
      base: "/",
      scrollBehavior: null,
      ...e
    }, this.#r = g(), typeof window < "u" && (window.__router__ = this);
  }
  normalizeRoutes(t) {
    return t.map((e) => ({
      path: e.path,
      component: e.component,
      template: e.template,
      html: e.html,
      name: e.name,
      meta: e.meta || {},
      redirect: e.redirect,
      children: e.children ? this.normalizeRoutes(e.children) : []
    }));
  }
  init() {
    return this.#r.addListener(window, "popstate", (t) => {
      this.handlePopState(t);
    }), this.#s(), this;
  }
  // 路由导航方法
  async push(t, e, n) {
    return this.#n(t, "push", e, n);
  }
  async replace(t, e, n) {
    return this.#n(t, "replace", e, n);
  }
  go(t) {
    window.history.go(t);
  }
  back() {
    this.go(-1);
  }
  forward() {
    this.go(1);
  }
  // 内部导航方法
  async #n(t, e = "push", n, i) {
    try {
      const r = this.#o(t);
      if (!r) {
        const l = new Error(`Route not found: ${t}`);
        throw i && i(l), l;
      }
      if (r.redirect)
        return this.#n(r.redirect, e, n, i);
      const o = typeof t == "string" ? t : this.#u(t), a = {
        path: r.path,
        name: r.name,
        params: r.params,
        query: r.query,
        meta: r.meta,
        matched: r.matched?.map((l) => ({
          path: l.path,
          name: l.name,
          params: l.params,
          meta: l.meta
          // 排除 component, template 等函数/复杂对象
        }))
      };
      return e === "replace" ? window.history.replaceState({ route: a }, "", o) : window.history.pushState({ route: a }, "", o), await this.#a(r), n && n(r), r;
    } catch (r) {
      throw console.error("Navigation error:", r), i && i(r), r;
    }
  }
  // 路由解析
  #o(t) {
    const e = typeof t == "string" ? t : t.path, n = typeof t == "object" ? t.query : this.#c();
    console.log("解析路由:", { path: e, routes: this.#t.map((r) => r.path) });
    for (const r of this.#t) {
      if (r.path === "*") continue;
      const o = p(r.path, e);
      if (console.log(`匹配测试: ${r.path} vs ${e}`, o), o)
        return console.log("路由匹配成功:", r.path), {
          ...r,
          path: o.path,
          params: o.params,
          query: n,
          fullPath: e,
          matched: [r]
        };
    }
    const i = this.#t.find((r) => r.path === "*");
    return i ? (console.log("使用通配符路由 (404)"), {
      ...i,
      path: i.path,
      params: {},
      query: n,
      fullPath: e,
      matched: [i]
    }) : (console.log("没有找到匹配的路由"), null);
  }
  #s() {
    const t = window.location.pathname, e = this.#o(t);
    this.#a(e);
  }
  async #a(t) {
    this.#i = t, this.#e.forEach((e) => {
      try {
        e(t);
      } catch (n) {
        console.error("Route change listener error:", n);
      }
    });
  }
  handlePopState(t) {
    this.#s();
  }
  // 工具方法
  #c(t = window.location.search) {
    const e = {};
    return t.startsWith("?") && (t = t.slice(1)), t.split("&").forEach((n) => {
      const [i, r] = n.split("=");
      i && (e[decodeURIComponent(i)] = r ? decodeURIComponent(r) : "");
    }), e;
  }
  #u(t) {
    if (typeof t == "string")
      return t;
    let e = t.path || "/";
    if (t.params && (e = w(e, t.params)), t.query && Object.keys(t.query).length > 0) {
      const n = Object.entries(t.query).map(([i, r]) => `${encodeURIComponent(i)}=${encodeURIComponent(r)}`).join("&");
      e += "?" + n;
    }
    return t.hash && (e += "#" + t.hash), e;
  }
  // 监听器管理
  addRouteChangeListener(t) {
    this.#e.push(t);
  }
  removeRouteChangeListener(t) {
    const e = this.#e.indexOf(t);
    e > -1 && this.#e.splice(e, 1);
  }
  // Getter方法
  get currentRoute() {
    return this.#i;
  }
  get routes() {
    return this.#t;
  }
  // 销毁方法
  destroy() {
    this.#e = [], window.__router__ === this && delete window.__router__;
  }
}
class h extends HTMLElement {
  constructor() {
    super(), this.router = null, this.currentRoute = null, this.isLoading = !1;
  }
  async connectedCallback() {
    this.router = this.getRouter(), this.router ? (this.router.addRouteChangeListener(this.handleRouteChange.bind(this)), await this.handleRouteChange(this.router.currentRoute)) : this.waitForRouter();
  }
  waitForRouter() {
    const t = () => {
      this.router = this.getRouter(), this.router ? (console.log("RouteView: Router found, initializing..."), this.router.addRouteChangeListener(this.handleRouteChange.bind(this)), this.handleRouteChange(this.router.currentRoute)) : setTimeout(t, 100);
    };
    t();
  }
  disconnectedCallback() {
    this.router && this.router.removeRouteChangeListener(this.handleRouteChange.bind(this));
  }
  getRouter() {
    if (window.__router__)
      return window.__router__;
    let t = this.parentElement;
    for (; t; ) {
      if (t.router)
        return t.router;
      t = t.parentElement;
    }
    return null;
  }
  async handleRouteChange(t) {
    if (!t) {
      this.innerHTML = "";
      return;
    }
    this.currentRoute = t, this.hasAttribute("loading-template") && this.showLoading();
    try {
      await this.renderRoute(t);
    } catch (e) {
      console.error("RouteView: Error rendering route", e), this.renderError(e);
    }
  }
  async renderRoute(t) {
    const { component: e, template: n, html: i } = t;
    if (typeof e == "function") {
      const r = await e(t.params, t.query);
      this.isFilePath(r) ? (console.log("检测到文件路径，加载外部HTML文件:", r), await this.loadExternalHTML(r, t)) : this.innerHTML = r;
      return;
    }
    if (n) {
      const r = await fetch(n);
      if (!r.ok)
        throw new Error(`Failed to load template: ${n}`);
      const o = await r.text();
      this.innerHTML = this.interpolateTemplate(o, t.params, t.query);
      return;
    }
    if (i) {
      this.innerHTML = this.interpolateTemplate(i, t.params, t.query);
      return;
    }
    this.innerHTML = `
            <div class="route-info">
                <h3>Route: ${t.path}</h3>
                <p>No component or template defined</p>
            </div>
        `;
  }
  interpolateTemplate(t, e = {}, n = {}) {
    return t.replace(/\{\{([^}]+)\}\}/g, (i, r) => {
      const o = r.trim();
      if (o.startsWith("params.")) {
        const a = o.substring(7);
        return e[a] || "";
      }
      if (o.startsWith("query.")) {
        const a = o.substring(6);
        return n[a] || "";
      }
      return e[o] || n[o] || "";
    });
  }
  /**
   * 检测字符串是否是文件路径
   * @param {string} str - 要检测的字符串
   * @returns {boolean} 是否是文件路径
   */
  isFilePath(t) {
    return typeof t != "string" ? !1 : [
      /^\.\/.*\.html$/,
      // ./path/file.html
      /^\.\.\/.*\.html$/,
      // ../path/file.html
      /^\/.*\.html$/,
      // /path/file.html
      /^.*\.html$/,
      // file.html
      /^\.\/.*\.(htm|xml)$/
      // 其他标记文件
    ].some((n) => n.test(t.trim()));
  }
  /**
   * 加载外部HTML文件
   * @param {string} filePath - 文件路径
   * @param {Object} route - 路由对象
   */
  async loadExternalHTML(t, e) {
    try {
      console.log("开始加载外部HTML文件:", t), console.log("当前页面URL:", window.location.href), console.log("解析后的完整URL:", new URL(t, window.location.href).href);
      const n = await fetch(t);
      if (console.log("Fetch响应状态:", n.status, n.statusText), !n.ok) {
        const r = this.generateAlternativePaths(t);
        console.log("尝试备用路径:", r);
        for (const o of r)
          try {
            console.log("尝试加载:", o);
            const a = await fetch(o);
            if (a.ok) {
              console.log("备用路径成功:", o);
              const l = await a.text();
              this.innerHTML = this.interpolateTemplate(l, e.params, e.query), this.executeScripts();
              return;
            }
          } catch (a) {
            console.log("备用路径失败:", o, a.message);
          }
        throw new Error(`Failed to load HTML file: ${t} (${n.status} ${n.statusText})`);
      }
      const i = await n.text();
      console.log("HTML文件加载成功，内容长度:", i.length), this.innerHTML = this.interpolateTemplate(i, e.params, e.query), this.executeScripts();
    } catch (n) {
      console.error("加载HTML文件失败:", n), this.innerHTML = `
                <div class="error" style="padding: 20px; background: #f8d7da; color: #721c24; border-radius: 8px; margin: 20px 0;">
                    <h3>❌ 加载失败</h3>
                    <p><strong>文件路径:</strong> <code>${t}</code></p>
                    <p><strong>错误信息:</strong> ${n.message}</p>
                    <p><strong>当前页面:</strong> ${window.location.href}</p>
                    <p><strong>解析URL:</strong> ${new URL(t, window.location.href).href}</p>
                    <details>
                        <summary>调试信息</summary>
                        <pre>${JSON.stringify({
        filePath: t,
        currentURL: window.location.href,
        resolvedURL: new URL(t, window.location.href).href,
        error: n.message
      }, null, 2)}</pre>
                    </details>
                    <p>
                        <button onclick="location.reload()">重新加载页面</button>
                        <button onclick="router.push('/')">返回首页</button>
                    </p>
                </div>
            `;
    }
  }
  /**
   * 生成备用文件路径
   * @param {string} originalPath - 原始路径
   * @returns {string[]} 备用路径数组
   */
  generateAlternativePaths(t) {
    const e = [];
    if (t.startsWith("./")) {
      const n = t.substring(2);
      e.push(
        n,
        // 直接文件名
        `../${n}`,
        // 上级目录
        `/examples/${n}`,
        // 绝对路径到examples
        `examples/${n}`
        // 相对路径到examples
      );
    }
    if (t.includes("pages/")) {
      const n = t.substring(t.indexOf("pages/"));
      e.push(
        n,
        // pages/file.html
        `./${n}`,
        // ./pages/file.html
        `../${n}`,
        // ../pages/file.html
        `/examples/${n}`
        // /examples/pages/file.html
      );
    }
    return e;
  }
  /**
   * 执行动态加载的HTML中的脚本
   */
  executeScripts() {
    this.querySelectorAll("script").forEach((e) => {
      const n = document.createElement("script");
      Array.from(e.attributes).forEach((i) => {
        n.setAttribute(i.name, i.value);
      }), e.src ? n.src = e.src : n.textContent = e.textContent, e.parentNode.replaceChild(n, e);
    });
  }
  showLoading() {
    const t = this.getAttribute("loading-template");
    t ? this.innerHTML = t : this.innerHTML = '<div class="route-loading">Loading...</div>';
  }
  renderError(t) {
    const e = this.getAttribute("error-template");
    e ? this.innerHTML = e.replace("{{error}}", t.message) : this.innerHTML = `
                <div class="route-error">
                    <h3>Error loading route</h3>
                    <p>${t.message}</p>
                </div>
            `;
  }
  // 静态方法用于注册组件
  static register(t = "route-view") {
    customElements.get(t) || customElements.define(t, h);
  }
}
h.register();
class d extends HTMLElement {
  constructor() {
    super(), this.router = null, this.boundHandleClick = this.handleClick.bind(this), this.boundHandleRouteChange = this.handleRouteChange.bind(this), this.isRendered = !1, this.originalContent = "", this.linkElement = null, console.log("constructor - 元素状态:", {
      innerHTML: `"${this.innerHTML}"`,
      textContent: `"${this.textContent}"`
    });
  }
  static get observedAttributes() {
    return ["to", "replace", "active-class", "exact-active-class", "exact"];
  }
  connectedCallback() {
    this.router = this.getRouter(), console.log("connectedCallback - 元素状态:", {
      tagName: this.tagName,
      innerHTML: `"${this.innerHTML}"`,
      textContent: `"${this.textContent}"`,
      isConnected: this.isConnected
    }), setTimeout(() => {
      console.log("延迟检查 - 元素状态:", {
        innerHTML: `"${this.innerHTML}"`,
        textContent: `"${this.textContent}"`
      }), this.saveOriginalContent(), this.tryRender();
    }, 0), this.addEventListener("click", this.boundHandleClick), this.router && this.router.addRouteChangeListener(this.boundHandleRouteChange);
  }
  saveOriginalContent() {
    console.log("saveOriginalContent - 开始:", {
      textContent: `"${this.textContent}"`,
      innerHTML: `"${this.innerHTML}"`,
      childNodes: this.childNodes.length,
      children: this.children.length
    });
    for (let t = 0; t < this.childNodes.length; t++) {
      const e = this.childNodes[t];
      console.log(`子节点 ${t}:`, {
        nodeType: e.nodeType,
        nodeName: e.nodeName,
        nodeValue: e.nodeValue,
        textContent: e.textContent
      });
    }
    if (this.originalContent = this.textContent.trim(), !this.originalContent && this.innerHTML.trim()) {
      const t = document.createElement("div");
      t.innerHTML = this.innerHTML, this.originalContent = t.textContent.trim();
    }
    if (!this.originalContent) {
      let t = "";
      for (let e of this.childNodes)
        e.nodeType === Node.TEXT_NODE && (t += e.textContent);
      this.originalContent = t.trim();
    }
    console.log("saveOriginalContent - 结果:", {
      originalContent: `"${this.originalContent}"`
    });
  }
  tryRender() {
    this.isRendered || (console.log("tryRender:", {
      originalContent: this.originalContent,
      hasContent: !!this.originalContent
    }), this.originalContent ? (this.render(), this.router && this.updateActiveState()) : (this.saveOriginalContent(), this.originalContent ? (this.render(), this.router && this.updateActiveState()) : setTimeout(() => this.tryRender(), 50)));
  }
  disconnectedCallback() {
    this.removeEventListener("click", this.boundHandleClick), this.router && this.router.removeRouteChangeListener(this.boundHandleRouteChange);
  }
  attributeChangedCallback(t, e, n) {
    e !== n && (t === "to" && this.render(), this.updateActiveState());
  }
  getRouter() {
    if (console.log("getRouter - 尝试获取路由器:", {
      windowRouter: window.__router__,
      windowRouterType: typeof window.__router__
    }), window.__router__)
      return console.log("getRouter - 从全局获取到路由器"), window.__router__;
    let t = this.parentElement;
    for (; t; ) {
      if (t.router)
        return console.log("getRouter - 从父元素获取到路由器"), t.router;
      t = t.parentElement;
    }
    return console.log("getRouter - 未找到路由器实例"), null;
  }
  render() {
    const t = this.getAttribute("to"), e = this.getAttribute("tag") || "a";
    if (!t) {
      console.warn('RouteLink: "to" attribute is required');
      return;
    }
    if (this.isRendered) {
      e === "a" && this.setAttribute("href", t);
      return;
    }
    this.originalContent || (this.originalContent = this.textContent.trim(), console.log("render - 重新获取内容:", `"${this.originalContent}"`)), console.log("RouteLink render:", {
      to: t,
      originalContent: this.originalContent,
      currentTextContent: this.textContent,
      currentInnerHTML: this.innerHTML
    });
    const n = this.originalContent || this.textContent.trim() || "链接";
    e === "a" ? this.setAttribute("href", t) : (this.setAttribute("data-route-link", "true"), this.setAttribute("data-to", t)), this.textContent.trim() !== n && (this.textContent = n), this.style.cursor = "pointer", e === "a" && (this.style.textDecoration = this.style.textDecoration || "none"), this.isRendered = !0, console.log("RouteLink rendered (简化版):", {
      href: this.getAttribute("href"),
      textContent: this.textContent,
      finalHTML: this.outerHTML
    });
  }
  // 简化版本 - 不再需要复制样式，因为我们保持了原始DOM结构
  handleClick(t) {
    if (console.log("RouteLink handleClick 触发:", {
      target: t.target,
      currentTarget: t.currentTarget,
      to: this.getAttribute("to")
    }), this.shouldPreventNavigation(t)) {
      console.log("导航被阻止");
      return;
    }
    t.preventDefault();
    const e = this.getAttribute("to"), n = this.hasAttribute("replace");
    if (!e) {
      console.warn("RouteLink: 缺少 to 属性");
      return;
    }
    if (this.router || (this.router = this.getRouter()), !this.router) {
      console.warn("RouteLink: 找不到路由器实例", {
        windowRouter: window.__router__,
        globalRouter: typeof window < "u" ? window.__router__ : null
      });
      return;
    }
    console.log("执行导航:", { to: e, replace: n, router: this.router }), n ? this.router.replace(e) : this.router.push(e);
  }
  shouldPreventNavigation(t) {
    if (t.metaKey || t.altKey || t.ctrlKey || t.shiftKey || t.button !== 0)
      return !0;
    const e = this.getAttribute("target");
    return !!(e && e !== "_self");
  }
  handleRouteChange() {
    this.updateActiveState();
  }
  updateActiveState() {
    if (!this.router)
      return;
    const t = this.getAttribute("to"), e = this.router.currentRoute?.path || window.location.pathname, n = this.hasAttribute("exact");
    if (!t)
      return;
    const i = n ? e === t : R(t, e) || e.startsWith(t), r = e === t, o = this.getAttribute("active-class") || "router-link-active", a = this.getAttribute("exact-active-class") || "router-link-exact-active";
    this.classList.remove(o, a), i && this.classList.add(o), r && this.classList.add(a), r ? this.setAttribute("aria-current", "page") : this.removeAttribute("aria-current");
  }
  // 静态方法用于注册组件
  static register(t = "route-link") {
    customElements.get(t) || customElements.define(t, d);
  }
}
d.register();
function L(s = {}) {
  const { routes: t = [], ...e } = s, n = new C(t, e);
  return typeof window < "u" && (window.__router__ = n), typeof window < "u" && (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", () => {
    n.init();
  }) : setTimeout(() => n.init(), 0)), n;
}
function f() {
  return typeof window < "u" && window.__router__ ? window.__router__ : (console.warn("useRouter: No router instance found. Make sure to call createRouter() first."), null);
}
function b() {
  const s = f();
  return s ? s.currentRoute : null;
}
function v(s, t = {}, e = {}) {
  if (!f())
    return typeof s == "string" ? s : s.path || "/";
  if (typeof s == "string")
    return s;
  let i = s.path || "/";
  if (t && Object.keys(t).length > 0 && Object.entries(t).forEach(([r, o]) => {
    i = i.replace(`:${r}`, encodeURIComponent(o));
  }), e && Object.keys(e).length > 0) {
    const r = Object.entries(e).map(([o, a]) => `${encodeURIComponent(o)}=${encodeURIComponent(a)}`).join("&");
    i += "?" + r;
  }
  return s.hash && (i += "#" + s.hash), i;
}
class x {
  static beforeEach = [];
  static beforeResolve = [];
  static afterEach = [];
  static addBeforeEach(t) {
    this.beforeEach.push(t);
  }
  static addBeforeResolve(t) {
    this.beforeResolve.push(t);
  }
  static addAfterEach(t) {
    this.afterEach.push(t);
  }
  static removeGuard(t, e) {
    const n = t.indexOf(e);
    n > -1 && t.splice(n, 1);
  }
}
const T = {
  /**
   * 检查路由是否需要认证
   */
  requiresAuth(s) {
    return s && s.meta && s.meta.requiresAuth === !0;
  },
  /**
   * 获取路由标题
   */
  getTitle(s, t = "") {
    return s && s.meta && s.meta.title ? typeof s.meta.title == "function" ? s.meta.title(s) : s.meta.title : t;
  },
  /**
   * 获取面包屑导航
   */
  getBreadcrumbs(s) {
    const t = [];
    return s && s.matched && s.matched.forEach((e) => {
      e.meta && e.meta.breadcrumb && t.push({
        text: e.meta.breadcrumb,
        path: e.path,
        route: e
      });
    }), t;
  }
};
function y(s) {
  return s.map((t) => {
    const e = {
      path: t.path,
      name: t.name,
      meta: t.meta || {},
      ...t
    };
    return t.children && (e.children = y(t.children)), e;
  });
}
function _(s) {
  return async (t, e) => {
    try {
      const n = await s();
      return typeof n.default == "function" ? await n.default(t, e) : n.default || n;
    } catch (n) {
      return console.error("Failed to load async component:", n), '<div class="error">Failed to load component</div>';
    }
  };
}
export {
  x as RouteGuard,
  d as RouteLink,
  T as RouteUtils,
  h as RouteView,
  C as Router,
  C as UseRouter,
  w as compilePath,
  v as createRouteLink,
  L as createRouter,
  _ as defineAsyncComponent,
  y as defineRoutes,
  R as isMatch,
  p as matchPath,
  m as pathToRegexp,
  g as useListener,
  b as useRoute,
  f as useRouter
};
//# sourceMappingURL=app.js.map
