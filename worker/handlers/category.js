/**
 * 分类管理（管理员）
 *
 * 注意：删除 / 改名的路由路径保留了历史拼写 `deleteCategroy` / `updateCategroy`，
 * 前端已经对齐，改路径会直接导致 404。
 */

import { DEFAULT_CATEGORY_ICON, LEVEL } from '../constants'
import { assert, ok, parseLevel, readJsonBody } from '../core/http'
import { nextId } from '../store/data'
import { findFirstCategory, findSubCategory } from '../store/locks'
import { updateData, withDecryptedData } from '../store/transaction'

/**
 * 取下一个可用的 sort_order
 * 用「现有最大值 + 1」而不是「数组长度 + 1」：
 * 删除中间某项后长度会变小，用长度会和已有项撞车，导致排序错乱。
 */
function nextSortOrder(list) {
  return (list || []).reduce((max, item) => Math.max(max, item?.sort_order || 0), 0) + 1
}

/** POST /api/data/addCategory —— 一级 / 二级通用 */
export async function addCategory({ request, env }) {
  const body = await readJsonBody(request)
  assert(body?.categoryName, 400, 'categoryName 必填')
  const level = parseLevel(body.level)

  const categoryId = await withDecryptedData(env, async (data) => {
    if (level === LEVEL.SECOND) {
      const parent = findFirstCategory(data, body.parentId)
      assert(parent, 400, '父分类不存在')

      const id = nextId(data.seq, 'category')
      parent.level2_with_links.push({
        category: {
          id,
          parentId: Number(body.parentId),
          name: body.categoryName,
          level: LEVEL.SECOND,
          sort_order:
            body.sort_order ?? nextSortOrder(parent.level2_with_links.map((s) => s.category)),
        },
        links: [],
      })
      return id
    }

    const id = nextId(data.seq, 'category')
    data.categories.push({
      category_level_1: {
        id,
        name: body.categoryName,
        icon: body.icon || DEFAULT_CATEGORY_ICON,
        guest_visible: true,
        sort_order:
          body.sort_order ?? nextSortOrder(data.categories.map((n) => n.category_level_1)),
      },
      level2_with_links: [],
    })
    return id
  })

  return ok('新增成功', { categoryId })
}

/** POST /api/data/deleteCategroy */
export async function deleteCategory({ request, env }) {
  const body = await readJsonBody(request)
  assert(body?.categoryId != null, 400, 'categoryId 必填')
  const level = parseLevel(body.level)

  await withDecryptedData(env, (data) => {
    if (level === LEVEL.SECOND) {
      const target = findSubCategory(data, body.categoryId)
      assert(target, 404, '分类不存在')

      target.first.level2_with_links = target.first.level2_with_links.filter(
        (sub) => sub.category.id !== Number(body.categoryId)
      )
      return
    }

    const index = data.categories.findIndex(
      (item) => item.category_level_1.id === Number(body.categoryId)
    )
    assert(index !== -1, 404, '分类不存在')
    data.categories.splice(index, 1)
  })

  return ok('删除成功')
}

/** POST /api/data/updateCategroy —— 改名 */
export async function updateCategory({ request, env }) {
  const body = await readJsonBody(request)
  assert(body?.categoryId != null && body?.newName, 400, 'categoryId 和 newName 必填')
  const level = parseLevel(body.level)

  await withDecryptedData(env, (data) => {
    if (level === LEVEL.SECOND) {
      const target = findSubCategory(data, body.categoryId)
      assert(target, 404, '分类不存在')
      target.sub.category.name = body.newName
      return
    }

    const first = findFirstCategory(data, body.categoryId)
    assert(first, 404, '分类不存在')
    first.category_level_1.name = body.newName
  })

  return ok('更新成功')
}

/**
 * POST /api/data/updateCategoryOrder
 * 只改一级分类的 sort_order，不涉及加密内容，因此不走解密流程。
 */
export async function updateCategoryOrder({ request, env }) {
  const body = await readJsonBody(request)
  assert(
    body?.categoryId != null && body?.newSortOrder != null,
    400,
    'categoryId 和 newSortOrder 必填'
  )

  await updateData(env, (data) => {
    const first = findFirstCategory(data, body.categoryId)
    assert(first, 404, '分类不存在')
    first.category_level_1.sort_order = body.newSortOrder
  })

  return ok('排序已更新')
}

/** 一级分类默认对访客显示，仅在管理员明确关闭后隐藏。 */
export async function updateCategoryVisibility({ request, env }) {
  const body = await readJsonBody(request)
  assert(
    body?.categoryId != null && typeof body?.visible === 'boolean',
    400,
    'categoryId 和布尔值 visible 必填'
  )
  await updateData(env, (data) => {
    const first = findFirstCategory(data, body.categoryId)
    assert(first, 404, '分类不存在')
    first.category_level_1.guest_visible = body.visible
  })
  return ok('显示设置已保存')
}
