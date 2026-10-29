/**
 * 分类加密接口
 */
import { request } from '../http'

/**
 * 设置 / 修改 / 取消分类访问密码（需管理员）
 * @param {{ categoryId: number, level: 1|2, password: string, oldPassword?: string, tokens?: string[] }} data
 *        password 传空字符串表示取消加密
 */
export function setCategoryPassword(data) {
  return request({ url: '/data/setCategoryPassword', method: 'post', data })
}

/**
 * 校验分类密码，返回解锁令牌与已解密内容
 * @param {{ categoryId: number, level: 1|2, password: string, tokens?: string[] }} data
 */
export function verifyCategoryPassword(data) {
  return request({
    url: '/data/verifyCategoryPassword',
    method: 'post',
    data,
    silent: true,
  })
}

/**
 * 凭解锁令牌换取已解密内容（刷新页面后恢复用）
 * @param {{ categoryId: number, level: 1|2, token: string }} data
 */
export function fetchCategoryContent(data) {
  return request({
    url: '/data/getCategoryContent',
    method: 'post',
    data,
    silent: true,
  })
}
