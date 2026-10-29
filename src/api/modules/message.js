/**
 * 留言板接口
 */
import { request } from '../http'

export function fetchMessages() {
  return request({ url: '/data/getMessages', method: 'get', silent: true })
}

/**
 * 新增留言
 * @param {{ username: string, qqNumber: string, text: string }} data
 */
export function createMessage(data) {
  return request({ url: '/data/createMessage', method: 'post', data })
}

/**
 * 删除留言
 * @param {{ messageId: number, qqNumber?: string, token?: string }} data
 */
export function deleteMessage(data) {
  return request({ url: '/data/deleteMessage', method: 'post', data })
}
