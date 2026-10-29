/** 链接管理（管理员） */

import { assert, ok, readJsonBody } from '../core/http'
import { nextId } from '../store/data'
import { findLink, findSubCategory } from '../store/locks'
import { withDecryptedData } from '../store/transaction'

/**
 * 取下一个可用的 sort_order
 * 用「现有最大值 + 1」而不是「数组长度 + 1」：
 * 删除中间某项后长度会变小，用长度会和已有项撞车，导致排序错乱。
 */
function nextSortOrder(list) {
  return (list || []).reduce((max, item) => Math.max(max, item?.sort_order || 0), 0) + 1
}

/** POST /api/data/addLink */
export async function addLink({ request, env }) {
  const body = await readJsonBody(request)
  assert(body?.name && body?.url, 400, 'name 和 url 必填')

  const linkId = await withDecryptedData(env, (data) => {
    const target = findSubCategory(data, body.category_level_2)
    assert(target, 400, '目标分类不存在')

    const sub = target.sub
    sub.links = sub.links || []

    const id = nextId(data.seq, 'link')
    sub.links.push({
      id,
      name: body.name,
      url: body.url,
      sort_order: body.sort_order ?? nextSortOrder(sub.links),
      is_blocked: body.is_blocked || 0,
      is_recommend: body.is_recommend || 0,
      icon: body.icon || '',
      created_at: Date.now(),
    })
    return id
  })

  return ok('新增成功', { linkId })
}

/** POST /api/data/deleteLink */
export async function deleteLink({ request, env }) {
  const body = await readJsonBody(request)
  assert(body?.id != null, 400, 'id 必填')

  await withDecryptedData(env, (data) => {
    const target = findLink(data, body.id)
    assert(target, 404, '链接不存在')

    target.sub.links = target.sub.links.filter((link) => link.id !== Number(body.id))
  })

  return ok('删除成功')
}

/** POST /api/data/updateLink —— 只更新传入的字段 */
export async function updateLink({ request, env }) {
  const body = await readJsonBody(request)
  assert(body?.id != null, 400, 'id 必填')

  await withDecryptedData(env, (data) => {
    const target = findLink(data, body.id)
    assert(target, 404, '链接不存在')

    const { link } = target
    if (body.title != null) link.name = body.title
    if (body.url != null) link.url = body.url
    if (body.order != null) link.sort_order = body.order
    if (body.isBlocked != null) link.is_blocked = body.isBlocked
    if (body.isRecommend != null) link.is_recommend = body.isRecommend
  })

  return ok('更新成功')
}

/** POST /api/data/updateLinkOrder */
export async function updateLinkOrder({ request, env }) {
  const body = await readJsonBody(request)
  assert(body?.linkId != null && body?.newSortOrder != null, 400, 'linkId 和 newSortOrder 必填')

  await withDecryptedData(env, (data) => {
    const target = findLink(data, body.linkId)
    assert(target, 404, '链接不存在')

    target.link.sort_order = body.newSortOrder
  })

  return ok('排序已更新')
}
