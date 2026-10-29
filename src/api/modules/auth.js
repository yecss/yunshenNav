/**
 * 登录相关接口
 */
import { request } from '../http'

export function login(data) {
  return request({ url: '/user/login', method: 'post', data })
}
