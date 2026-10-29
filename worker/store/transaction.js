/**
 * 写事务封装
 *
 * 加密分类的写入有一个固定套路：读数据 → 解密到内存 → 改结构 →
 * 二级/一级回写密文 → 版本自增 → 落盘。
 * 这个顺序散在每个 handler 里极易漏步，统一收敛到 withDecryptedData。
 */

import { bumpVersion, ensureLinkTimestamps, readData, writeData } from './data'
import { dehydrateLocks, hydrateLocks } from './locks'

/** 只读加载：顺带补齐历史链接的 created_at */
export async function loadData(env) {
  const data = await readData(env)
  await ensureLinkTimestamps(env, data)
  return data
}

/**
 * 需要触碰加密分类的写操作
 * 回调里拿到的是已解密的分类树，改完由这里统一回写密文。
 * 回调抛错时不会落盘，数据保持原样。
 *
 * @param {object} env
 * @param {(data: object, ctx: object) => Promise<any>|any} apply
 * @returns {Promise<any>} 回调的返回值
 */
export async function withDecryptedData(env, apply) {
  const data = await readData(env)
  const ctx = await hydrateLocks(env, data)

  const result = await apply(data, ctx)

  await dehydrateLocks(data, ctx)
  bumpVersion(data)
  await writeData(env, data)
  return result
}

/**
 * 不涉及加密字段的写操作（留言、一级分类排序等）
 * 跳过解密/回写，避免无谓地重写密文。
 *
 * @param {object} env
 * @param {(data: object) => Promise<any>|any} apply
 * @returns {Promise<any>} 回调的返回值
 */
export async function updateData(env, apply) {
  const data = await readData(env)
  const result = await apply(data)
  bumpVersion(data)
  await writeData(env, data)
  return result
}
