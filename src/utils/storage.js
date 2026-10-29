/**
 * localStorage 安全封装
 * 统一处理 JSON 解析失败、隐私模式写入异常等情况，避免各页面重复 try/catch。
 */

/** 读取 JSON，解析失败或不存在时返回兜底值 */
export function readJson(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

/** 写入 JSON，配额超限等异常只告警不抛出 */
export function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.warn(`[storage] 写入 ${key} 失败`, error)
    return false
  }
}

/** 读取字符串 */
export function readText(key, fallback = '') {
  try {
    return localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

/** 写入字符串 */
export function writeText(key, value) {
  try {
    localStorage.setItem(key, value)
    return true
  } catch (error) {
    console.warn(`[storage] 写入 ${key} 失败`, error)
    return false
  }
}

/** 删除键 */
export function removeKey(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    /* 忽略：无痕模式下可能不可用 */
  }
}
