// 分类加密 —— 解锁令牌存储
// 令牌由后端签发（2 小时有效），保存在 localStorage，
// 刷新页面后可用令牌换取已解锁内容，无需重复输入密码。

import { reactive } from 'vue'

const STORAGE_KEY = 'yunshenNav_unlock_tokens'

// 全局响应式状态：多个组件（侧边栏 / 主区域）共享解锁状态
export const lockState = reactive({
  // key -> token，持久化
  tokens: {},
  // key -> true，表示该分类内容已解密并加载到本地
  unlocked: {},
})

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const obj = raw ? JSON.parse(raw) : {}
    return obj && typeof obj === 'object' ? obj : {}
  } catch {
    return {}
  }
}

function writeAll(obj) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj))
  } catch (e) {
    console.warn('解锁令牌保存失败', e)
  }
}

/** 生成令牌存储的 key：L1:3 / L2:12 */
export const lockKey = (level, id) => `L${level}:${id}`

/** 从 localStorage 恢复令牌 */
export function loadTokens() {
  lockState.tokens = readAll()
}

/** 令牌数组，供后台写操作附带 */
export const getTokenList = () => Object.values(lockState.tokens).filter(Boolean)

/**
 * 令牌条目列表：[ { level, categoryId, token }, ... ]
 * 用于页面加载时批量恢复已解锁内容
 */
export const getTokenEntries = () =>
  Object.entries(lockState.tokens)
    .filter(([, token]) => !!token)
    .map(([key, token]) => {
      const [lv, id] = key.split(':')
      return {
        level: Number(String(lv).replace('L', '')),
        categoryId: Number(id),
        token,
      }
    })
    .filter((item) => item.level === 1 || item.level === 2)

/** 读取指定分类的令牌 */
export const getToken = (level, id) => lockState.tokens[lockKey(level, id)] || ''

/** 保存指定分类的令牌 */
export function saveToken(level, id, token) {
  if (!token) return
  const key = lockKey(level, id)
  lockState.tokens[key] = token
  writeAll(lockState.tokens)
}

/** 清除指定分类的令牌 */
export function clearToken(level, id) {
  const key = lockKey(level, id)
  delete lockState.tokens[key]
  writeAll(lockState.tokens)
}

/** 标记该分类内容已解密并加载 */
export function markUnlocked(level, id) {
  lockState.unlocked[lockKey(level, id)] = true
}

/** 取消已解锁标记 */
export function removeUnlocked(level, id) {
  delete lockState.unlocked[lockKey(level, id)]
}

/** 该分类当前是否已解锁（内容可见） */
export const isUnlocked = (level, id) => !!lockState.unlocked[lockKey(level, id)]

/** 该分类是否被加密 */
export const isLocked = (category) => !!(category && category.is_locked === 1)
