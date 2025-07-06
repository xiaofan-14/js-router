type ComponentType = string | HTMLElement | Function

interface MetaType {
    title: string

}

export interface RouteRecord {
    path: string,
    name: string,
    component: ComponentType
    meta: MetaType
}

export interface RouterOptions {
    mode: 'history' | 'hash',
    base: string,
}

export interface ToType {
    path: string,
    query?: Record<string, string | string[]>
}

export interface ResolveRouteRes {
    path: string,
    query: object,

}

export interface MatchResult {
    path: string
    params: Record<string, string>
}

export interface MatchedRoute extends RouteRecord {
    params: Record<string, string>
    query: Record<string, string | string[]>
    fullPath: string
    matched: RouteRecord[]
}

