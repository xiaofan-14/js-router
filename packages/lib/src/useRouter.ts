import type {
    RouteRecord ,
    RouterOptions,
    ToType,
    MatchedRoute
} from './types'
import {
    matchPath
} from "./pathToRegexp"

export class Router {
    private routes: RouteRecord [] = []
    private options: RouterOptions

    constructor(routes: RouteRecord[], options: RouterOptions) {
        this.routes = routes
        this.options = {
            mode: 'history',
            base: '/',
            ...options
        }
    }

    init(){
        return this
    }

    private resolveCurrentRoute() {
        const path = window.location.pathname
        const route = this.resolveRoute(path)
    }

    /**
     * 解析路由
     * @param to
     * @private
     */
    private resolveRoute(to: ToType | string): MatchedRoute | null {
        const path = typeof to === 'string' ? to : to.path
        const query = typeof to === 'object' ? to.query ?? {} : this.parseQuery()

        for (const route of this.routes) {
            if (route.path === '*') continue

            const match = matchPath(route.path, path)
            if (match) {
                return {
                    ...route,
                    path: match.path,
                    params: match.params,
                    query,
                    fullPath: path,
                    matched: [route],
                }
            }
        }

        const wildcardRoute = this.routes.find(r => r.path === '*')
        if (wildcardRoute) {
            return {
                ...wildcardRoute,
                path: wildcardRoute.path,
                params: {},
                query,
                fullPath: path,
                matched: [wildcardRoute],
            }
        }

        return null
    }


    private parseQuery(){
        return null
    }
}