/**
 * 登录会话
 * 只保存一个管理员令牌，方案上不需要完整的状态管理库，
 * 用一个响应式对象即可（替换原先仅承载 token 的 Vuex 模块）。
 */
import { computed, reactive } from 'vue'
import { STORAGE_KEYS } from '@/constants'
import { readText, removeKey, writeText } from '@/utils/storage'

const sessionState = reactive({
  token: readText(STORAGE_KEYS.authToken, ''),
})

/**
 * 解析令牌载荷（后端签发的是 base64url(payload).hmac 两段式结构）
 * @param {string} token
 * @returns {object|null}
 */
function decodeTokenPayload(token) {
  try {
    const [body] = token.split('.')
    if (!body) return null
    const base64 = body.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return null
  }
}

/** 是否已登录（令牌存在且未过期） */
export const isLoggedIn = computed(() => {
  if (!sessionState.token) return false
  const payload = decodeTokenPayload(sessionState.token)
  if (!payload) return false
  return !(payload.exp && payload.exp < Date.now())
})

/** 当前令牌 */
export function getToken() {
  return sessionState.token
}

/** 保存令牌 */
export function setToken(token) {
  if (!token) return
  sessionState.token = token
  writeText(STORAGE_KEYS.authToken, token)
}

/** 清除令牌 */
export function clearToken() {
  sessionState.token = ''
  removeKey(STORAGE_KEYS.authToken)
}
