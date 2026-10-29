/** 系统级接口：健康检查、点击日志 */

import { ok } from '../core/http'

/** GET /api/health */
export function health() {
  return ok('OK')
}

/** POST /api/data/logClick —— 点击日志当前不落库，保留接口占位 */
export function logClick() {
  return ok('OK')
}
