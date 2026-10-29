/**
 * KV 数据访问层
 *
 * 整个站点只有一条 `data` 记录，结构固定为：
 *   { version, categories, messages, seq, encMasterKey? }
 * 所有写入都会推进 version，前端据此判断本地缓存是否过期。
 */

import { DATA_KEY, LINK_TIMESTAMP_STEP } from '../constants'
import { bytesToBase64, randomBytes } from '../core/crypto'

/** 空数据结构（首次部署时使用） */
export function createEmptyData() {
  return {
    version: 1,
    categories: [],
    messages: [],
    seq: { category: 1, link: 1, message: 1 },
  }
}

/** 把历史数据补齐到当前结构，避免上层到处判空 */
function normalizeData(raw) {
  if (!raw || typeof raw !== 'object') return createEmptyData()
  if (!Array.isArray(raw.categories)) raw.categories = []
  if (!Array.isArray(raw.messages)) raw.messages = []
  if (!raw.seq) raw.seq = { category: 1, link: 1, message: 1 }
  if (!raw.version) raw.version = 1
  return raw
}

/** 读取全量数据 */
export async function readData(env) {
  const data = normalizeData(await env.YUNSHEN_DATA.get(DATA_KEY, 'json'))

  // 未配置 ENC_SECRET 时，首次使用生成并持久化主密钥，保证密文长期可解
  if (!env.ENC_SECRET && !data.encMasterKey) {
    data.encMasterKey = bytesToBase64(randomBytes(32))
    await writeData(env, data)
  }
  return data
}

/** 写入全量数据 */
export async function writeData(env, data) {
  await env.YUNSHEN_DATA.put(DATA_KEY, JSON.stringify(data))
}

/** 自增 id 生成器：由 seq 记录各实体的下一个可用 id */
export function nextId(seq, key) {
  const id = seq[key]
  seq[key] = id + 1
  return id
}

/** 数据版本自增 */
export function bumpVersion(data) {
  data.version = (data.version || 1) + 1
  return data.version
}

/** 摊平所有链接，便于批量处理 */
export function collectLinks(data) {
  const links = []
  for (const first of data.categories) {
    for (const sub of first.level2_with_links || []) {
      for (const link of sub.links || []) links.push(link)
    }
  }
  return links
}

/**
 * 为早期没有 created_at 的链接补时间戳
 * 按 id 递增、每个 id 间隔固定时长往回推算，保证“最近添加”顺序与 id 一致。
 * @returns {Promise<boolean>} 是否发生了写入
 */
export async function ensureLinkTimestamps(env, data) {
  const links = collectLinks(data)
  const missing = links.filter((link) => !link.created_at)
  if (!missing.length) return false

  const maxId = links.reduce((max, link) => Math.max(max, Number(link.id) || 0), 0)
  const now = Date.now()
  for (const link of missing) {
    link.created_at = now - (maxId - (Number(link.id) || 0)) * LINK_TIMESTAMP_STEP
  }

  await writeData(env, data)
  return true
}
