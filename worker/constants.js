/**
 * Worker 常量
 *
 * 把存储键、有效期、长度上限等“魔法数字”集中在一处，
 * 避免同一个数值散落在多个 handler 里各写一份。
 */

/** KV 中保存全部站点数据的键名 */
export const DATA_KEY = 'data'

/** 登录令牌有效期：7 天 */
export const SESSION_TTL = 7 * 24 * 60 * 60 * 1000

/** 分类解锁令牌有效期：2 小时 */
export const UNLOCK_TOKEN_TTL = 2 * 60 * 60 * 1000

/** PBKDF2 迭代次数 */
export const PBKDF2_ITERATIONS = 10000

/** 分类密码最小长度 */
export const MIN_PASSWORD_LENGTH = 4

/** 新增一级分类时的默认图标 */
export const DEFAULT_CATEGORY_ICON = 'heroicons:inbox'

/** 留言字段长度上限与默认值 */
export const MESSAGE_LIMITS = {
  username: 64,
  qqNumber: 20,
  text: 1000,
  defaultQq: '10000',
}

/** 历史链接补 created_at 时，相邻 id 之间的推算间隔（6 小时） */
export const LINK_TIMESTAMP_STEP = 6 * 60 * 60 * 1000

/** 分类层级 */
export const LEVEL = {
  FIRST: 1,
  SECOND: 2,
}
