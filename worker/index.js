/**
 * Cloudflare Worker 入口 —— yunshenNav 后端
 *
 * 数据全部持久化在 Cloudflare KV（绑定名 YUNSHEN_DATA）里，
 * 只有一个 `data` 键，写入时整体覆盖并推进 version。
 *
 * 目录结构：
 *   core/     HTTP、路由、令牌、加解密等基础能力
 *   store/    KV 读写、分类树加解密、写事务
 *   handlers/ 按业务域拆分的接口实现
 *   routes.js 路由表（URL 契约）
 *
 * 必填环境变量：
 *   ADMIN_USER / ADMIN_PASSWORD   管理员账号
 *   JWT_SECRET                    令牌签名密钥（可选，缺省用内置值）
 *   ENC_SECRET                    分类加密主密钥（可选，缺省用数据内随机值）
 *
 * ⚠️ ENC_SECRET 一旦更换，历史密文将无法解密，请勿随意修改。
 */

import { createRoutes } from './routes'

const router = createRoutes()

export default {
  fetch(request, env) {
    return router.handle(request, env)
  },
}
