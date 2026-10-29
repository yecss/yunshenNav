/** 管理员登录 */

import { SESSION_TTL } from '../constants'
import { assert, fail, ok, readJsonBody } from '../core/http'
import { createToken } from '../core/token'

/**
 * POST /api/user/login
 * 账号密码来自 Worker 环境变量 ADMIN_USER / ADMIN_PASSWORD。
 */
export async function login({ request, env }) {
  const body = await readJsonBody(request)
  assert(body?.username != null && body?.password != null, 400, '用户名和密码必填')

  // 未配置 ADMIN_PASSWORD 时一律拒绝，避免空密码直接放行
  const expected = env.ADMIN_PASSWORD
  const matched =
    Boolean(expected) && body.username === env.ADMIN_USER && body.password === expected
  if (!matched) return fail('用户名或密码错误', 403)

  const token = await createToken(env, {
    user: body.username,
    exp: Date.now() + SESSION_TTL,
  })
  return ok('登录成功', { token })
}
