/**
 * 分类接口
 *
 * 注意：`deleteCategroy` / `updateCategroy` 的拼写错误属于后端既有路由，
 * 保持与 Worker 路由表一致，不要改动 URL。
 */
import { request } from '../http'

/**
 * 新增分类（一级 / 二级通用）
 * @param {{ categoryName: string, level: 1|2, parentId?: number, sort_order?: number, icon?: string }} data
 */
export function createCategory(data) {
  return request({ url: '/data/addCategory', method: 'post', data })
}

/**
 * 重命名分类
 * @param {{ categoryId: number, newName: string, level: 1|2 }} data
 */
export function updateCategory(data) {
  return request({ url: '/data/updateCategroy', method: 'post', data })
}

/**
 * 删除分类
 * @param {{ categoryId: number, level: 1|2 }} data
 */
export function deleteCategory(data) {
  return request({ url: '/data/deleteCategroy', method: 'post', data })
}

/**
 * 更新分类排序
 * @param {{ categoryId: number, newSortOrder: number, level: 1|2 }} data
 */
export function updateCategoryOrder(data) {
  return request({ url: '/data/updateCategoryOrder', method: 'post', data })
}

/** 更新一级分类的访客可见性 */
export function updateCategoryVisibility(data) {
  return request({ url: '/data/updateCategoryVisibility', method: 'post', data })
}
