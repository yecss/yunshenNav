/**
 * 解锁弹窗的目标管理
 *
 * 主面板可能因为「一级分类被加密」或「二级分类被加密」分别触发解锁，
 * 两种场景共用一个 UnlockDialog，这里负责记录当前要解锁的是谁。
 */
import { ref } from 'vue'
import { LEVEL } from '@/constants'

const EMPTY_TARGET = { level: LEVEL.FIRST, categoryId: null, categoryName: '' }

export function useUnlockDialog() {
  const visible = ref(false)
  const target = ref({ ...EMPTY_TARGET })

  /**
   * @param {number} level 一级或二级分类
   * @param {{ id: number|string, name: string }} category
   */
  function open(level, category) {
    if (!category) return
    target.value = { level, categoryId: category.id, categoryName: category.name }
    visible.value = true
  }

  function close() {
    visible.value = false
  }

  return { visible, target, open, close }
}
