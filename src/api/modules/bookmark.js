/**
 * 书签数据读取接口
 *
 * 注意：URL 中的 `Categroy` 拼写错误是**后端既有路由**，不能顺手改正，
 * 否则会与线上 Worker 的路径不匹配（详见 worker/routes.js 的路由表）。
 */
import { request } from '../http'

/** 访客模式拉取全站数据（加密分类只返回占位信息） */
export function fetchGuestBookmarks() {
  return request({
    url: '/data/getGuestData',
    method: 'get',
    silent: true,
  })
}

/** 管理员模式拉取全站数据（含加密分类的明文） */
export function fetchAdminBookmarks() {
  return request({
    url: '/data/getData',
    method: 'post',
    silent: true,
  })
}

/** 数据版本号，用于判断本地缓存是否过期 */
export function fetchDataVersion() {
  return request({
    url: '/data/version',
    method: 'get',
    silent: true,
  })
}
