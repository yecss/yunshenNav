/**
 * 书签写操作编排
 *
 * 一次写操作固定三步：调接口 → 改本地分类树 → 让数据缓存失效。
 * 这三步原先散落在各个弹窗组件里，漏掉任何一步就会出现「改完必须刷新才生效」。
 * 现在组件只负责收集表单、校验、提示，状态同步统一收敛在这里。
 */
import {
  createCategory,
  createLink as createLinkApi,
  deleteCategory as deleteCategoryApi,
  deleteLink as deleteLinkApi,
  updateCategory as updateCategoryApi,
  updateCategoryOrder,
  updateCategoryVisibility,
  updateLink as updateLinkApi,
  updateLinkOrder,
} from '@/api'
import { ICONS, LEVEL } from '@/constants'
import {
  addFirstCategory,
  addLink,
  addSubCategory,
  bookmarkState,
  clearDataCache,
  moveFirstCategory as moveFirstCategoryInTree,
  moveLink as moveLinkInTree,
  removeFirstCategory,
  removeLink,
  removeSubCategory,
  renameFirstCategory,
  renameSubCategory,
  setFirstCategoryVisibility,
  updateLink as updateLinkInTree,
} from '@/stores/bookmark'
import { findLink, findSubCategory } from '@/utils/category'
import { ensureProtocol } from '@/utils/url'

/**
 * 取下一个可用的 sort_order
 * 用「现有最大值 + 1」而不是「数组长度 + 1」：
 * 删除中间某项后长度会变小，用长度会和已有项的 sort_order 撞车，导致排序错乱。
 */
function nextSortOrder(list) {
  return (list || []).reduce((max, item) => Math.max(max, item?.sort_order || 0), 0) + 1
}

/**
 * 同步相邻两项的排序
 * 排序是次要操作，失败时保留本地顺序（下次强制刷新会以服务端为准）
 */
async function syncOrder(tasks) {
  try {
    await Promise.all(tasks)
  } catch {
    // 忽略：排序失败不影响当前浏览
  }
}

/* ============================ 一级分类 ============================ */

export async function createFirstCategory(name) {
  const sortOrder = nextSortOrder(bookmarkState.categoryTree.map((n) => n.category_level_1))
  const res = await createCategory({
    categoryName: name,
    level: LEVEL.FIRST,
    sort_order: sortOrder,
  })

  addFirstCategory({
    id: res.categoryId,
    name,
    icon: ICONS.inbox,
    sort_order: sortOrder,
    is_locked: 0,
    guest_visible: true,
  })
  clearDataCache()
  return res
}

/** 保存一级分类的访客显示设置 */
export async function setCategoryGuestVisibility(categoryId, visible) {
  await updateCategoryVisibility({ categoryId, visible })
  setFirstCategoryVisibility(categoryId, visible)
  clearDataCache()
}

/** 一级分类上移 / 下移一位 */
export async function moveFirstCategory(fromIndex, toIndex) {
  const swapped = moveFirstCategoryInTree(fromIndex, toIndex)
  if (!swapped) return null

  await syncOrder([
    updateCategoryOrder({
      categoryId: swapped.current.id,
      newSortOrder: swapped.current.sort_order,
      level: LEVEL.FIRST,
    }),
    updateCategoryOrder({
      categoryId: swapped.target.id,
      newSortOrder: swapped.target.sort_order,
      level: LEVEL.FIRST,
    }),
  ])
  clearDataCache()
  return swapped
}

/* ============================ 二级分类 ============================ */

export async function createSubCategory({ firstCategoryId, name }) {
  const node = bookmarkState.categoryTree.find(
    (item) => item.category_level_1.id === firstCategoryId
  )
  if (!node) throw new Error('一级分类不存在')

  const sortOrder = nextSortOrder((node.level2_with_links || []).map((sub) => sub.category))
  const res = await createCategory({
    categoryName: name,
    level: LEVEL.SECOND,
    parentId: firstCategoryId,
    sort_order: sortOrder,
  })

  addSubCategory(firstCategoryId, {
    category: {
      id: res.categoryId,
      name,
      parentId: firstCategoryId,
      level: LEVEL.SECOND,
      sort_order: sortOrder,
      is_locked: 0,
    },
    links: [],
  })
  clearDataCache()
  return res
}

/* ============================ 分类改名 / 删除 ============================ */

export async function renameCategory({ level, category, name }) {
  await updateCategoryApi({ categoryId: category.id, newName: name, level })

  if (level === LEVEL.FIRST) renameFirstCategory(category.id, name)
  else renameSubCategory(category.id, name)

  clearDataCache()
}

export async function deleteCategory({ level, category }) {
  await deleteCategoryApi({ categoryId: category.id, level })

  if (level === LEVEL.FIRST) removeFirstCategory(category.id)
  else removeSubCategory(category.id)

  clearDataCache()
}

/* ============================ 链接 ============================ */

export async function createLink({ subCategoryId, name, url }) {
  const found = findSubCategory(bookmarkState.categoryTree, subCategoryId)
  const sortOrder = nextSortOrder(found?.sub.links)
  const normalizedUrl = ensureProtocol(url)

  const res = await createLinkApi({
    name,
    url: normalizedUrl,
    sort_order: sortOrder,
    category_level_2: subCategoryId,
  })

  addLink(subCategoryId, {
    id: res.linkId,
    name,
    url: normalizedUrl,
    sort_order: sortOrder,
    is_blocked: 0,
    is_recommend: 0,
    created_at: Date.now(),
  })
  clearDataCache()
  return res
}

export async function updateLink({ id, title, url, order, isBlocked, isRecommend }) {
  const normalizedUrl = ensureProtocol(url)

  await updateLinkApi({
    id,
    title,
    url: normalizedUrl,
    order,
    isBlocked,
    isRecommend,
  })

  updateLinkInTree(id, {
    name: title,
    url: normalizedUrl,
    sort_order: order,
    is_blocked: isBlocked,
    is_recommend: isRecommend,
  })
  clearDataCache()
}

export async function deleteLink(linkId) {
  await deleteLinkApi({ id: linkId })
  removeLink(linkId)
  clearDataCache()
}

/** 链接上移 / 下移一位 */
export async function moveLink(linkId, direction) {
  const swapped = moveLinkInTree(linkId, direction)
  if (!swapped) return null

  await syncOrder([
    updateLinkOrder({ linkId: swapped.current.id, newSortOrder: swapped.current.sort_order }),
    updateLinkOrder({ linkId: swapped.target.id, newSortOrder: swapped.target.sort_order }),
  ])
  clearDataCache()
  return swapped
}

/* ============================ 查询辅助 ============================ */

/** 链接在所属二级分类中的位置，用于禁用首/末项的前进后退 */
export function getLinkPosition(linkId) {
  const found = findLink(bookmarkState.categoryTree, linkId)
  if (!found) return { index: -1, total: 0 }

  const links = [...(found.sub.links || [])].sort(
    (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
  )
  return { index: links.findIndex((link) => link.id === linkId), total: links.length }
}
