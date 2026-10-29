/**
 * 分类解锁状态
 *
 * 令牌由后端签发（2 小时有效），保存在 localStorage；
 * 刷新页面后可用令牌换取已解锁内容，无需重复输入密码。
 * 使用全局响应式对象，让侧边栏与主内容区共享同一份解锁状态。
 */
import { reactive } from 'vue'
import { STORAGE_KEYS } from '@/constants'
import { readJson, writeJson } from '@/utils/storage'
import { isLoggedIn } from './session'

export const lockState = reactive({
  /** 'L1:3' -> token，需要持久化 */
  tokens: {},
  /** 'L1:3' -> true，表示该分类内容已解密并写入本地 */
  unlocked: {},
})

/** 生成令牌存储键：L1:3 / L2:12 */
function lockKey(level, categoryId) {
  return `L${level}:${categoryId}`
}

/** 从 localStorage 恢复令牌 */
export function loadTokens() {
  const stored = readJson(STORAGE_KEYS.unlockTokens, {})
  lockState.tokens = stored && typeof stored === 'object' ? stored : {}
}

/** 令牌数组，供加密接口校验上级分类权限时携带 */
export function getTokenList() {
  return Object.values(lockState.tokens).filter(Boolean)
}

/**
 * 令牌条目列表 `[{ level, categoryId, token }]`
 * 用于页面加载时批量恢复已解锁内容
 */
export function getTokenEntries() {
  return Object.entries(lockState.tokens)
    .filter(([, token]) => Boolean(token))
    .map(([key, token]) => {
      const [levelPart, idPart] = key.split(':')
      return {
        level: Number(String(levelPart).replace('L', '')),
        categoryId: Number(idPart),
        token,
      }
    })
    .filter((item) => item.level === 1 || item.level === 2)
}

/** 保存指定分类的令牌 */
export function saveToken(level, categoryId, token) {
  if (!token) return
  lockState.tokens[lockKey(level, categoryId)] = token
  writeJson(STORAGE_KEYS.unlockTokens, lockState.tokens)
}

/** 清除指定分类的令牌 */
export function clearCategoryToken(level, categoryId) {
  delete lockState.tokens[lockKey(level, categoryId)]
  writeJson(STORAGE_KEYS.unlockTokens, lockState.tokens)
}

/** 标记该分类内容已解密并加载 */
export function markUnlocked(level, categoryId) {
  lockState.unlocked[lockKey(level, categoryId)] = true
}

/** 取消已解锁标记 */
export function removeUnlocked(level, categoryId) {
  delete lockState.unlocked[lockKey(level, categoryId)]
}

/** 该分类内容当前是否可见 */
export function isUnlocked(level, categoryId) {
  return Boolean(lockState.unlocked[lockKey(level, categoryId)])
}

/** 该分类是否被加密（后端用 is_locked === 1 表示） */
export function isLocked(category) {
  return Number(category?.is_locked) === 1
}

/**
 * 分类内容是否需要遮挡
 *
 * 三个条件同时成立才算遮挡：已加密 + 非管理员 + 本地没有解锁。
 * 主面板（一级分类）与链接分组（二级分类）共用这段判断，避免两处各写一遍。
 */
export function isCategoryMasked(level, category) {
  if (!isLocked(category)) return false
  if (isLoggedIn.value) return false
  return !isUnlocked(level, category.id)
}
