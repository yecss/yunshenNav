/**
 * 分类树工具
 *
 * 后端下发的数据结构（**字段名是接口契约，不要改名**）：
 * categoryTree = [
 *   {
 *     category_level_1: { id, name, icon, sort_order, is_locked },
 *     level2_with_links: [
 *       { category: { id, name, parentId, level, sort_order, is_locked }, links: [link] }
 *     ]
 *   }
 * ]
 *
 * 查找函数的返回结构与 Worker 侧 store/locks.js 保持一致：
 *   一级节点用 `first` 指代，二级分类用 `sub`，链接用 `link`。
 */

/** 按 sort_order 升序排序（缺失时按 0 处理） */
const bySortOrder = (a, b) => (a.sort_order || 0) - (b.sort_order || 0)

/** 原地整理分类树的顺序：一级分类 → 二级分类 → 链接 */
export function sortCategoryTree(tree) {
  if (!Array.isArray(tree)) return []

  tree.sort((a, b) => bySortOrder(a.category_level_1, b.category_level_1))

  tree.forEach((node) => {
    if (!Array.isArray(node.level2_with_links)) {
      node.level2_with_links = []
      return
    }
    node.level2_with_links.sort((a, b) => bySortOrder(a.category, b.category))
    node.level2_with_links.forEach((sub) => {
      if (Array.isArray(sub.links)) sub.links.sort(bySortOrder)
    })
  })

  return tree
}

/** 一级分类列表 */
export function getFirstCategories(tree) {
  return (tree || []).map((node) => node.category_level_1)
}

/** 一级分类图标列表，与 getFirstCategories 一一对应 */
export function getFirstCategoryIcons(tree) {
  return (tree || []).map((node) => node.category_level_1.icon)
}

/** 扁平化全部链接，并附带所属分类名称，供站内搜索使用 */
export function flattenLinks(tree) {
  const result = []
  ;(tree || []).forEach((node) => {
    const firstCategoryName = node.category_level_1?.name || ''
    ;(node.level2_with_links || []).forEach((sub) => {
      const subCategoryName = sub.category?.name || ''
      ;(sub.links || []).forEach((link) => {
        result.push({ ...link, subCategoryName, firstCategoryName })
      })
    })
  })
  return result
}

/** 按创建时间倒序取最近的若干条链接 */
export function getLatestLinks(tree, limit = 20) {
  return flattenLinks(tree)
    .sort((a, b) => {
      const timeA = a.created_at || 0
      const timeB = b.created_at || 0
      if (timeA && timeB) return timeB - timeA
      if (timeA) return -1
      if (timeB) return 1
      return (b.id || 0) - (a.id || 0)
    })
    .slice(0, limit)
}

/**
 * 按 id 查二级分类
 * @returns {{ first: object, sub: object } | null}
 */
export function findSubCategory(tree, subCategoryId) {
  for (const node of tree || []) {
    const sub = (node.level2_with_links || []).find((item) => item.category.id === subCategoryId)
    if (sub) return { first: node, sub }
  }
  return null
}

/**
 * 按 id 查链接及其所在的二级分类、一级分类
 * @returns {{ first: object, sub: object, link: object } | null}
 */
export function findLink(tree, linkId) {
  for (const node of tree || []) {
    for (const sub of node.level2_with_links || []) {
      const link = (sub.links || []).find((item) => item.id === linkId)
      if (link) return { first: node, sub, link }
    }
  }
  return null
}

/**
 * 站内搜索：跨全部一级分类按名称 / 网址过滤
 *
 * 只返回访客有权看到的内容：
 *   - 加密的一级分类，其下内容整体不可见；
 *   - 加密的二级分类，明文不会出现在访客拿到的数据里（后端只给 is_locked 标记）。
 * 因此这里跳过被遮挡的一级分类即可，避免把「已加密」的分类名暴露给搜索结果。
 *
 * @returns {{ category: object, links: object[] }[]}
 */
export function searchLinks(tree, keyword, { isFirstCategoryVisible } = {}) {
  const kw = String(keyword || '')
    .trim()
    .toLowerCase()
  if (!kw) return []

  const result = []
  ;(tree || []).forEach((node) => {
    if (isFirstCategoryVisible && !isFirstCategoryVisible(node)) return
    ;(node.level2_with_links || []).forEach((sub) => {
      const matched = (sub.links || []).filter((link) => {
        const name = (link.name || '').toLowerCase()
        const url = (link.url || '').toLowerCase()
        return name.includes(kw) || url.includes(kw)
      })
      if (matched.length) result.push({ category: sub.category, links: matched })
    })
  })
  return result
}
