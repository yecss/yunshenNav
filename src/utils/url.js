/**
 * URL 处理
 */

/**
 * 补全协议头：用户只填 `example.com` 时默认按 http 处理
 * @param {string} url
 * @returns {string}
 */
export function ensureProtocol(url) {
  const value = String(url || '').trim()
  if (!value) return ''
  if (/^[a-z][a-z\d+\-.]*:\/\//i.test(value)) return value
  return `http://${value}`
}
