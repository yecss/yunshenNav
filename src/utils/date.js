/**
 * 日期时间格式化
 */

/**
 * 把时间戳 / 日期字符串格式化为 `YYYY-MM-DD HH:mm`
 * @param {number|string|Date} input 时间戳（毫秒）或可被 Date 解析的值
 * @param {{ withSeconds?: boolean }} options
 * @returns {string} 无法解析时返回空字符串
 */
export function formatDateTime(input, { withSeconds = false } = {}) {
  if (input == null || input === '') return ''

  const date = input instanceof Date ? input : new Date(Number(input) || input)
  if (Number.isNaN(date.getTime())) return ''

  const pad = (n) => String(n).padStart(2, '0')
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`
  return withSeconds ? `${day} ${time}:${pad(date.getSeconds())}` : `${day} ${time}`
}
