/**
 * 路由表 —— 前后端 URL 契约的唯一来源
 *
 * ⚠️ `deleteCategroy` / `updateCategroy` 的拼写错误是线上既有路径，
 *    前端 src/api/modules/category.js 已按此对齐，改动会直接导致 404。
 *
 * `{ admin: true }` 表示该路由需要管理员令牌，由 router 统一校验。
 */

import { createRouter } from './core/router'
import * as auth from './handlers/auth'
import * as bookmark from './handlers/bookmark'
import * as category from './handlers/category'
import * as link from './handlers/link'
import * as lock from './handlers/lock'
import * as message from './handlers/message'
import * as system from './handlers/system'

export function createRoutes() {
  const router = createRouter()

  // ---- 基础 ----
  router.get('/api/health', system.health)
  router.post('/api/user/login', auth.login)
  router.get('/api/data/version', bookmark.getVersion)

  // ---- 数据读取 ----
  router.get('/api/data/getGuestData', bookmark.getGuestData)
  router.post('/api/data/getData', bookmark.getAdminData, { admin: true })

  // ---- 分类解锁（公开）----
  router.post('/api/data/verifyCategoryPassword', lock.verifyCategoryPassword)
  router.post('/api/data/getCategoryContent', lock.getCategoryContent)

  // ---- 留言板（公开读、公开写）----
  router.get('/api/data/getMessages', message.getMessages)
  router.post('/api/data/createMessage', message.createMessage)
  router.post('/api/data/deleteMessage', message.deleteMessage)

  // ---- 点击日志：当前丢弃，保留占位 ----
  router.post('/api/data/logClick', system.logClick)

  // ---- 以下需要管理员令牌 ----
  router.post('/api/data/setCategoryPassword', lock.setCategoryPassword, { admin: true })
  router.post('/api/data/addCategory', category.addCategory, { admin: true })
  router.post('/api/data/deleteCategroy', category.deleteCategory, { admin: true })
  router.post('/api/data/updateCategroy', category.updateCategory, { admin: true })
  router.post('/api/data/updateCategoryOrder', category.updateCategoryOrder, { admin: true })
  router.post('/api/data/updateCategoryVisibility', category.updateCategoryVisibility, {
    admin: true,
  })
  router.post('/api/data/addLink', link.addLink, { admin: true })
  router.post('/api/data/deleteLink', link.deleteLink, { admin: true })
  router.post('/api/data/updateLink', link.updateLink, { admin: true })
  router.post('/api/data/updateLinkOrder', link.updateLinkOrder, { admin: true })

  return router
}
