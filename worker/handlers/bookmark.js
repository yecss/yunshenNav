/**
 * 书签数据读取：游客视角、管理员视角、版本号
 */

import { ok } from '../core/http'
import { hydrateLocks, sanitizeCategories } from '../store/locks'
import { loadData } from '../store/transaction'
import { readData } from '../store/data'

/**
 * GET /api/data/getGuestData
 * 加密分类只返回 is_locked 标记，不返回明文内容。
 */
export async function getGuestData({ env }) {
  const data = await loadData(env)
  return ok('数据获取成功', {
    data: sanitizeCategories(
      data.categories.filter((first) => first.category_level_1.guest_visible !== false)
    ),
    version: data.version || 1,
  })
}

/**
 * POST /api/data/getData（需管理员令牌）
 * 解密后返回完整内容。
 */
export async function getAdminData({ env }) {
  const data = await loadData(env)
  await hydrateLocks(env, data)

  return ok('数据获取成功', {
    data: sanitizeCategories(data.categories),
    version: data.version || 1,
  })
}

/**
 * GET /api/data/version
 * 前端用它判断本地缓存是否过期（静默，不弹提示）
 */
export async function getVersion({ env }) {
  const data = await readData(env)
  return ok('OK', { version: data.version || 1, silent: true })
}
