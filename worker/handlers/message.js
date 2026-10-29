/** 留言板：公开读取与创建，删除需管理员或留言本人的 QQ 号 */

import { MESSAGE_LIMITS } from '../constants'
import { assert, ok, readJsonBody } from '../core/http'
import { readAuthToken, verifyToken } from '../core/token'
import { nextId, readData } from '../store/data'
import { updateData } from '../store/transaction'

/** GET /api/data/getMessages */
export async function getMessages({ env }) {
  const data = await readData(env)
  return ok('留言获取成功', { data: data.messages })
}

/** POST /api/data/createMessage */
export async function createMessage({ request, env }) {
  const body = await readJsonBody(request)
  assert(body?.username && body?.text, 400, 'username 和 text 必填')

  const message = {
    id: '',
    username: String(body.username).slice(0, MESSAGE_LIMITS.username),
    qqNumber: body.qqNumber
      ? String(body.qqNumber).slice(0, MESSAGE_LIMITS.qqNumber)
      : MESSAGE_LIMITS.defaultQq,
    text: String(body.text).slice(0, MESSAGE_LIMITS.text),
    timestamp: new Date().toISOString(),
  }

  await updateData(env, (data) => {
    message.id = String(nextId(data.seq, 'message'))
    data.messages.push(message)
  })

  return ok('留言成功', { data: { id: message.id, timestamp: message.timestamp } })
}

/** POST /api/data/deleteMessage —— 管理员可用令牌删除任意留言，访客需匹配 QQ 号 */
export async function deleteMessage({ request, env }) {
  const body = await readJsonBody(request)
  assert(body?.messageId, 400, 'messageId 必填')

  const admin = await verifyToken(env, body.token || readAuthToken(request))

  await updateData(env, (data) => {
    const index = data.messages.findIndex((item) => String(item.id) === String(body.messageId))
    assert(index !== -1, 404, '留言不存在')

    const message = data.messages[index]
    const isOwner = body.qqNumber && String(message.qqNumber) === String(body.qqNumber)
    assert(admin || isOwner, 403, '无权删除该留言')

    data.messages.splice(index, 1)
  })

  return ok('删除成功')
}
