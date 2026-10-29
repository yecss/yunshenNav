/**
 * 问候语
 * 每个时段只在当天首次打开时提醒一次（例如上午提醒过，中午才会再提醒）。
 */
import { STORAGE_KEYS } from '@/constants'
import { readText, writeText } from '@/utils/storage'

const PERIODS = [
  { key: 'morning', start: 5, end: 11, text: '早上好！新的一天，满是希望！' },
  { key: 'noon', start: 11, end: 13, text: '中午好！小憩一下，继续前行！' },
  { key: 'afternoon', start: 13, end: 18, text: '下午好，愿你一切顺利！' },
  { key: 'evening', start: 18, end: 22, text: '晚上好，放松心情，享受宁静时光！' },
  { key: 'night', start: 22, end: 5, text: '深夜了，愿你安然入睡，梦中见到美好的明天！' },
]

function resolvePeriod(hour) {
  return (
    PERIODS.find(({ start, end }) =>
      start < end ? hour >= start && hour < end : hour >= start || hour < end
    ) || PERIODS[PERIODS.length - 1]
  )
}

/**
 * 取本次访问应展示的问候语
 * @returns {string} 当前时段已问候过时返回空字符串
 */
export function takeGreeting() {
  const now = new Date()
  const period = resolvePeriod(now.getHours())
  const stamp = `${now.toLocaleDateString()}-${period.key}`

  if (readText(STORAGE_KEYS.greetedPeriod) === stamp) return ''
  writeText(STORAGE_KEYS.greetedPeriod, stamp)
  return period.text
}
