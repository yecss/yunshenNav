/**
 * 令牌：`Base64URL(JSON 载荷).HMAC-SHA256 签名`
 *
 * 服务端不保存会话，令牌自证身份，靠 exp 字段过期：
 *   - 登录令牌：{ user, exp }
 *   - 解锁令牌：{ scope: 'unlock', level, catId, exp }
 */

import { assert } from './http'

/** 字符串 → Base64URL（UTF-8 安全） */
export function encodeBase64Url(text) {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return binaryToBase64Url(binary)
}

/** Base64URL → 字符串（UTF-8 安全） */
export function decodeBase64Url(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

/** 二进制字符串（每个字符一个字节）→ Base64URL */
function binaryToBase64Url(binary) {
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** 定长比较，避免签名校验被时序攻击 */
function safeEqual(a, b) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

async function hmacSign(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  let binary = ''
  for (const byte of new Uint8Array(signature)) binary += String.fromCharCode(byte)
  return binaryToBase64Url(binary)
}

/** 签名密钥：优先 JWT_SECRET，未配置时退回固定兜底值（保证登录/解锁可用） */
function signingSecret(env) {
  return env.JWT_SECRET || 'yunshen-nav-default-sign-secret'
}

/** 签发令牌 */
export async function createToken(env, payload) {
  const body = encodeBase64Url(JSON.stringify(payload))
  const signature = await hmacSign(signingSecret(env), body)
  return `${body}.${signature}`
}

/**
 * 校验令牌
 * @returns {Promise<object|null>} 有效时返回载荷，否则返回 null
 */
export async function verifyToken(env, rawValue) {
  if (!rawValue || typeof rawValue !== 'string') return null
  const parts = rawValue.split('.')
  if (parts.length !== 2) return null

  const [body, signature] = parts
  const expected = await hmacSign(signingSecret(env), body)
  if (!safeEqual(signature, expected)) return null

  try {
    const payload = JSON.parse(decodeBase64Url(body))
    if (payload.exp && payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

/** 从请求头读取令牌，兼容 `Bearer xxx` 写法 */
export function readAuthToken(request) {
  const raw = request.headers.get('Authorization') || ''
  return raw.replace(/^Bearer\s+/i, '').trim()
}

/** 校验管理员令牌，失败直接中断为 401 */
export async function requireUser(env, request) {
  const payload = await verifyToken(env, readAuthToken(request))
  assert(payload, 401, '未授权')
  return payload
}
