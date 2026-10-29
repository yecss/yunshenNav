/**
 * 全局常量
 * 这里的存储键是历史遗留值，**不要随意修改**，改掉会导致用户本地缓存与登录态全部失效。
 */

/** 浏览数据缓存有效期：7 天（过期或版本号变化才会重新拉取，右上角可手动强制刷新） */
export const DATA_CACHE_TTL = 7 * 24 * 60 * 60 * 1000

/** 「最新添加」视图使用 -1 作为哨兵索引，与真实分类索引区分开 */
export const LATEST_INDEX = -1

/** 分类层级（与 Worker 侧 constants.js 的 LEVEL 保持一致） */
export const LEVEL = {
  FIRST: 1,
  SECOND: 2,
}

/** localStorage 键名 */
export const STORAGE_KEYS = {
  /** 登录令牌 */
  authToken: 'pm_token',
  /** 书签数据缓存（含 version / mode / timestamp） */
  dataCache: 'yunshenNav_data_cache',
  /** 分类解锁令牌 */
  unlockTokens: 'yunshenNav_unlock_tokens',
  /** 上一次问候的时段，用于避免重复弹问候语 */
  greetedPeriod: 'lastGreetedPeriod',
}

/** 数据缓存的两种身份，避免管理员与访客互相复用缓存 */
export const CACHE_MODE = {
  admin: 'admin',
  guest: 'guest',
}

/**
 * Iconify 图标名集中管理
 * 注意：Element Plus 的 `el-button` 图标来自 @element-plus/icons-vue
 * （锁只有 Lock / Unlock / Key），与这里的 heroicons 风格名不是一套。
 */
export const ICONS = {
  lock: 'heroicons:lock-closed',
  clock: 'heroicons:clock',
  messageBoard: 'heroicons:clipboard-document-list',
  manage: 'heroicons:bookmark',
  about: 'heroicons:information-circle',
  feedback: 'heroicons:chat-bubble-left-ellipsis',
  user: 'heroicons:user',
  logout: 'heroicons:arrow-left-on-rectangle',
  inbox: 'heroicons:inbox',
}

/** 侧边栏「其他」区的入口 */
export const SIDEBAR_ACTIONS = [
  { key: 'latest', label: '最新添加', icon: ICONS.clock },
  { key: 'messageBoard', label: '留言板', icon: ICONS.messageBoard },
  { key: 'manage', label: '数据管理', icon: ICONS.manage },
  { key: 'about', label: '网站介绍', icon: ICONS.about },
  { key: 'feedback', label: '产品建议', icon: ICONS.feedback },
]

/** 产品建议 / 反馈表单地址 */
export const FEEDBACK_URL = 'https://docs.qq.com/form/page/DTlpES3NlYUZMblNp'

/** 项目仓库地址 */
export const REPO_URL = 'https://github.com/yecss/yunshenNav'
