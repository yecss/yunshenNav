/**
 * 书签数据仓库
 *
 * 整个书签页只有这一份数据源：
 *   categoryTree ← 后端下发的 `{ category_level_1, level2_with_links }[]`
 * 组件不再通过 prop 逐层传递、也不再直接改写 prop，
 * 所有读写都走这里导出的方法，避免各组件各改一份、状态越改越乱。
 *
 * 分工：本文件只负责「改内存里的树」；需要落库的写操作
 * （调接口 + 改树 + 清缓存）统一放在 `services/bookmark.js`。
 */
import { computed, reactive } from 'vue'
import {
  fetchAdminBookmarks,
  fetchCategoryContent,
  fetchDataVersion,
  fetchGuestBookmarks,
} from '@/api'
import { CACHE_MODE, DATA_CACHE_TTL, LATEST_INDEX, STORAGE_KEYS } from '@/constants'
import { readJson, writeJson, removeKey } from '@/utils/storage'
import {
  findLink,
  findSubCategory,
  flattenLinks,
  getFirstCategories,
  getFirstCategoryIcons,
  getLatestLinks,
  sortCategoryTree,
} from '@/utils/category'
import { isLoggedIn } from './session'
import {
  clearCategoryToken,
  getTokenEntries,
  loadTokens,
  markUnlocked,
  removeUnlocked,
} from './categoryLock'

/** 全局响应式状态，组件直接读取它的派生数据 */
export const bookmarkState = reactive({
  /** 完整分类树 */
  categoryTree: [],
  /** 当前视图：分类索引，-1 表示「最新添加」 */
  activeIndex: 0,
  /** 是否正在拉取数据 */
  loading: false,
})

/* ============================ 派生数据 ============================ */

export const firstCategories = computed(() => getFirstCategories(bookmarkState.categoryTree))
export const firstCategoryIcons = computed(() => getFirstCategoryIcons(bookmarkState.categoryTree))

export const activeFirstCategory = computed(() => {
  if (bookmarkState.activeIndex === LATEST_INDEX) return null
  return firstCategories.value[bookmarkState.activeIndex] || null
})

/** 当前一级分类下的二级分类列表（含链接） */
export const activeSubCategories = computed(() => {
  if (bookmarkState.activeIndex === LATEST_INDEX) return []
  const node = bookmarkState.categoryTree[bookmarkState.activeIndex]
  return node ? node.level2_with_links || [] : []
})

/** 全站链接（附带分类名），供站内搜索与「最新添加」使用 */
export const allLinks = computed(() => flattenLinks(bookmarkState.categoryTree))

export const latestLinks = computed(() => getLatestLinks(bookmarkState.categoryTree, 20))

/* ============================ 缓存 ============================ */

/** 缓存数据是否缺少创建时间（后端升级后旧缓存需作废） */
function hasCreatedAt(tree) {
  if (!Array.isArray(tree) || !tree.length) return true
  return tree.every((node) =>
    (node.level2_with_links || []).every((sub) =>
      (sub.links || []).every((link) => Boolean(link.created_at))
    )
  )
}

function readCache() {
  const cached = readJson(STORAGE_KEYS.dataCache, null)
  if (!cached) return null
  if (cached.visibilitySchema !== 2) return null
  if (Date.now() - (cached.timestamp || 0) > DATA_CACHE_TTL) {
    removeKey(STORAGE_KEYS.dataCache)
    return null
  }
  if (!hasCreatedAt(cached.data)) {
    removeKey(STORAGE_KEYS.dataCache)
    return null
  }
  return cached
}

export function clearDataCache() {
  removeKey(STORAGE_KEYS.dataCache)
}

/* ============================ 加载 ============================ */

/** 把已解密内容写回本地分类树 */
export function applyUnlockedContent(level, categoryId, content) {
  if (!Array.isArray(content)) return

  if (level === 1) {
    const node = bookmarkState.categoryTree.find((item) => item.category_level_1.id === categoryId)
    if (node) node.level2_with_links = content
    return
  }

  const found = findSubCategory(bookmarkState.categoryTree, categoryId)
  if (found) found.sub.links = content
}

/** 用本地保存的解锁令牌恢复已解锁内容（仅访客需要） */
async function restoreUnlockedContent() {
  if (isLoggedIn.value) return

  loadTokens()
  const entries = getTokenEntries()
  if (!entries.length) return

  // 一级解锁会整体替换其下的二级列表，必须先执行
  const ordered = [...entries].sort((a, b) => a.level - b.level)

  for (const { level, categoryId, token } of ordered) {
    try {
      const res = await fetchCategoryContent({ categoryId, level, token })
      if (res.status === 200 && res.data) {
        markUnlocked(level, categoryId)
        applyUnlockedContent(level, categoryId, res.data)
      }
    } catch {
      clearCategoryToken(level, categoryId)
      removeUnlocked(level, categoryId)
    }
  }
}

/**
 * 加载书签数据
 * @param {{ force?: boolean }} options force = true 时忽略本地缓存
 * @returns {Promise<{source: 'server'|'cache', updateCheckFailed: boolean}>} 实际数据来源
 */
export async function loadBookmarks({ force = false } = {}) {
  const mode = isLoggedIn.value ? CACHE_MODE.admin : CACHE_MODE.guest
  bookmarkState.loading = true

  try {
    let tree = null
    let source = 'server'
    let updateCheckFailed = false

    if (!force) {
      const cached = readCache()
      if (cached && cached.mode === mode) {
        try {
          const versionRes = await fetchDataVersion()
          if (versionRes.version === cached.version) {
            tree = cached.data
            source = 'cache'
          }
        } catch {
          // 版本接口异常时降级使用缓存，避免页面空白
          tree = cached.data
          source = 'cache'
          updateCheckFailed = true
        }
      }
    }

    if (!tree) {
      const res = isLoggedIn.value ? await fetchAdminBookmarks() : await fetchGuestBookmarks()
      tree = res.data || []
      writeJson(STORAGE_KEYS.dataCache, {
        visibilitySchema: 2,
        data: tree,
        version: res.version,
        mode,
        timestamp: Date.now(),
      })
    }

    bookmarkState.categoryTree = sortCategoryTree(
      isLoggedIn.value ? tree : tree.filter((node) => node.category_level_1.guest_visible !== false)
    )
    ensureActiveIndex()
    await restoreUnlockedContent()
    return { source, updateCheckFailed }
  } finally {
    bookmarkState.loading = false
  }
}

/** 索引越界时回落到第一个分类 */
function ensureActiveIndex() {
  if (bookmarkState.activeIndex === LATEST_INDEX) return
  const max = bookmarkState.categoryTree.length - 1
  if (bookmarkState.activeIndex < 0 || bookmarkState.activeIndex > max) {
    bookmarkState.activeIndex = max >= 0 ? 0 : LATEST_INDEX
  }
}

/* ============================ 视图切换 ============================ */

export function setActiveIndex(index) {
  bookmarkState.activeIndex = Number(index)
}

/* ============================ 分类增删改 ============================ */

/** 新增一级分类（只改本地，接口调用由调用方负责） */
export function addFirstCategory(category) {
  bookmarkState.categoryTree.push({ category_level_1: category, level2_with_links: [] })
  sortCategoryTree(bookmarkState.categoryTree)
}

/** 重命名一级分类 */
export function renameFirstCategory(categoryId, name) {
  const node = bookmarkState.categoryTree.find((item) => item.category_level_1.id === categoryId)
  if (node) node.category_level_1.name = name
}

export function setFirstCategoryVisibility(categoryId, visible) {
  const node = bookmarkState.categoryTree.find((item) => item.category_level_1.id === categoryId)
  if (node) node.category_level_1.guest_visible = visible
}

/** 删除一级分类 */
export function removeFirstCategory(categoryId) {
  const index = bookmarkState.categoryTree.findIndex(
    (item) => item.category_level_1.id === categoryId
  )
  if (index !== -1) bookmarkState.categoryTree.splice(index, 1)
  ensureActiveIndex()
}

/** 移动一级分类，返回移动前后的索引（用于同步后端 sort_order） */
export function moveFirstCategory(fromIndex, toIndex) {
  const tree = bookmarkState.categoryTree
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= tree.length || toIndex >= tree.length) {
    return null
  }

  const current = tree[fromIndex]
  const target = tree[toIndex]
  const currentOrder = current.category_level_1.sort_order
  current.category_level_1.sort_order = target.category_level_1.sort_order
  target.category_level_1.sort_order = currentOrder

  tree.splice(fromIndex, 1)
  tree.splice(toIndex, 0, current)

  // 保持当前浏览位置跟随被移动的分类
  if (bookmarkState.activeIndex === fromIndex) bookmarkState.activeIndex = toIndex
  else if (
    fromIndex < toIndex &&
    bookmarkState.activeIndex > fromIndex &&
    bookmarkState.activeIndex <= toIndex
  )
    bookmarkState.activeIndex -= 1
  else if (
    fromIndex > toIndex &&
    bookmarkState.activeIndex >= toIndex &&
    bookmarkState.activeIndex < fromIndex
  )
    bookmarkState.activeIndex += 1

  return { current: current.category_level_1, target: target.category_level_1 }
}

/** 新增二级分类 */
export function addSubCategory(firstCategoryId, subCategory) {
  const node = bookmarkState.categoryTree.find(
    (item) => item.category_level_1.id === firstCategoryId
  )
  if (!node) return
  node.level2_with_links = node.level2_with_links || []
  node.level2_with_links.push(subCategory)
  node.level2_with_links.sort((a, b) => (a.category.sort_order || 0) - (b.category.sort_order || 0))
}

/** 重命名二级分类 */
export function renameSubCategory(subCategoryId, name) {
  const found = findSubCategory(bookmarkState.categoryTree, subCategoryId)
  if (found) found.sub.category.name = name
}

/** 删除二级分类 */
export function removeSubCategory(subCategoryId) {
  for (const node of bookmarkState.categoryTree) {
    const index = (node.level2_with_links || []).findIndex(
      (item) => item.category.id === subCategoryId
    )
    if (index !== -1) {
      node.level2_with_links.splice(index, 1)
      return
    }
  }
}

/* ============================ 链接增删改 ============================ */

/** 新增链接到指定二级分类 */
export function addLink(subCategoryId, link) {
  const found = findSubCategory(bookmarkState.categoryTree, subCategoryId)
  if (!found) return
  found.sub.links = found.sub.links || []
  found.sub.links.push(link)
  found.sub.links.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
}

/** 就地修改链接字段（只改本地，接口调用交给 services/bookmark） */
export function updateLink(linkId, patch) {
  const found = findLink(bookmarkState.categoryTree, linkId)
  if (found) Object.assign(found.link, patch)
}

/** 删除链接 */
export function removeLink(linkId) {
  const found = findLink(bookmarkState.categoryTree, linkId)
  if (!found) return
  found.sub.links = found.sub.links.filter((link) => link.id !== linkId)
}

/**
 * 上移 / 下移链接，交换相邻两条的 sort_order
 * @param {number} linkId
 * @param {'up'|'down'} direction
 * @returns {{ current: object, target: object } | null} 被交换的两条链接，供调用方同步后端
 */
export function moveLink(linkId, direction) {
  const found = findLink(bookmarkState.categoryTree, linkId)
  if (!found) return null

  const links = found.sub.links
  links.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

  const index = links.findIndex((link) => link.id === linkId)
  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (index === -1 || targetIndex < 0 || targetIndex >= links.length) return null

  const current = links[index]
  const target = links[targetIndex]
  const order = current.sort_order
  current.sort_order = target.sort_order
  target.sort_order = order

  links.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  return { current, target }
}
