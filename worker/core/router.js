/**
 * 极简路由：注册表 + 分发 + 统一错误出口。
 *
 * 设计取舍：
 *   - 不用第三方框架，Worker 冷启动更轻；
 *   - 路由表集中在 routes.js，URL 契约一眼可查；
 *   - `{ admin: true }` 的路由在分发阶段统一校验管理员令牌，
 *     handler 里只需要关心业务，不必各自重复鉴权。
 */

import { HttpError, fail, preflight } from './http'
import { requireUser } from './token'

/** 折叠路径开头的重复斜杠，`//api/health` 与 `/api/health` 等价 */
function normalizePath(pathname) {
  return pathname.replace(/^\/+/, '/')
}

export function createRouter() {
  const routes = []

  function register(method, path, handler, options = {}) {
    routes.push({ method, path, handler, admin: Boolean(options.admin) })
    return router
  }

  const router = {
    get: (path, handler, options) => register('GET', path, handler, options),
    post: (path, handler, options) => register('POST', path, handler, options),

    /** 路由清单，便于排查“这条路径到底注册没有” */
    list: () => routes.map(({ method, path, admin }) => ({ method, path, admin })),

    async handle(request, env) {
      const method = request.method.toUpperCase()
      if (method === 'OPTIONS') return preflight()

      const url = new URL(request.url)
      const path = normalizePath(url.pathname)
      const route = routes.find((item) => item.method === method && item.path === path)
      if (!route) return fail('Not Found', 404)

      try {
        const auth = route.admin ? await requireUser(env, request) : null
        return await route.handler({ request, env, url, path, method, auth })
      } catch (error) {
        if (error instanceof HttpError) return fail(error.message, error.status)
        console.error('[worker] 未捕获异常:', error)
        return fail(error?.message || '服务器错误', 500)
      }
    },
  }

  return router
}
