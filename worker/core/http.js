/**
 * HTTP 层：跨域头、统一响应体、请求体解析、业务异常。
 *
 * 响应体契约（必须与前端 src/api/http.js 保持一致）：
 *   { status, message, data?, ...payload }
 * 其中 status 与 HTTP 状态码保持一致，前端据此判定成功与否。
 */

import { LEVEL } from '../constants'

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400',
}

/** 业务异常：携带 HTTP 状态码，由 router 统一转成 JSON 响应 */
export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

/** 中断请求处理（等价于 `return fail(...)`，但可以在任意深度调用） */
export function abortRequest(status, message) {
  throw new HttpError(status, message)
}

/** 断言：条件不成立时中断请求 */
export function assert(condition, status, message) {
  if (!condition) abortRequest(status, message)
}

/** 构造 JSON 响应 */
export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

/** 成功响应：`{ status: 200, message, ...payload }` */
export function ok(message, payload = {}) {
  return json({ status: 200, message, ...payload })
}

/** 失败响应：`{ status, message }`，HTTP 状态码同步 */
export function fail(message, status = 500, payload = {}) {
  return json({ status, message, ...payload }, status)
}

/** 预检请求响应 */
export function preflight() {
  return new Response(null, { headers: CORS_HEADERS })
}

/**
 * 读取 JSON 请求体
 * 解析失败时返回 null，由调用方按“参数缺失”处理，避免把解析异常当成 500 抛出。
 */
export async function readJsonBody(request) {
  try {
    const body = await request.json()
    return body && typeof body === 'object' ? body : null
  } catch {
    return null
  }
}

/** 统一解析分类层级：除 2 以外一律按一级分类处理 */
export function parseLevel(value) {
  return Number(value) === LEVEL.SECOND ? LEVEL.SECOND : LEVEL.FIRST
}
