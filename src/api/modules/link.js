/**
 * 链接接口
 */
import { request } from '../http'

/**
 * 新增链接
 * @param {{ name: string, url: string, category_level_2: number, sort_order?: number,
 *           is_blocked?: number, is_recommend?: number, icon?: string }} data
 */
export function createLink(data) {
  return request({ url: '/data/addLink', method: 'post', data })
}

/**
 * 更新链接（后端只更新传入的字段）
 * @param {{ id: number, title: string, url: string, order: number,
 *           isBlocked: number, isRecommend: number }} data
 */
export function updateLink(data) {
  return request({ url: '/data/updateLink', method: 'post', data })
}

/**
 * 删除链接
 * @param {{ id: number }} data
 */
export function deleteLink(data) {
  return request({ url: '/data/deleteLink', method: 'post', data })
}

/**
 * 更新链接排序
 * @param {{ linkId: number, newSortOrder: number }} data
 */
export function updateLinkOrder(data) {
  return request({ url: '/data/updateLinkOrder', method: 'post', data })
}

/** 上报链接点击（失败不影响跳转，静默处理） */
export function reportLinkClick(data) {
  return request({
    url: '/data/logClick',
    method: 'post',
    data,
    silent: true,
  })
}
