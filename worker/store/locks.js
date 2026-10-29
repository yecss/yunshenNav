/**
 * 分类树的加解密与查找
 *
 * 加解密流程（一次写操作的完整闭环）：
 *   1. hydrateLocks  —— 把所有 enc 解密到内存，同时记录每层的内容密钥；
 *   2. handler 直接改明文结构；
 *   3. dehydrateLocks —— 二级先用原密钥回写密文，一级再整体回写密文。
 *
 * 顺序不能反：一级密文里打包的是整个 level2_with_links，
 * 必须先让二级变回密文，一级的打包结果才不含明文。
 */

import { decryptJson, encryptJson, importMasterKey, unwrapContentKey } from '../core/crypto'
import { verifyToken } from '../core/token'

/** 解密上下文：记录内容密钥，回写时要复用同一把密钥 */
function createContext() {
  return {
    /** 一级分类 id → 内容密钥 */
    firstKeys: new Map(),
    /** 二级分类 id → 内容密钥 */
    subKeys: new Map(),
    /** 二级分类 id → 所属一级分类 id */
    subParent: new Map(),
    /**
     * 本次事务内已回写过密文的二级分类 id
     *
     * 回写会把 `links` 清空（明文不落盘），因此同一个事务里绝不能回写两次：
     * 第二次拿到的 `links` 已经是空的，会把正确的密文覆盖成空内容。
     * `setCategoryPassword` 给一级分类加密时会先回写一次二级，
     * 之后 `withDecryptedData` 还会统一回写一次，靠这个集合保证幂等。
     */
    dehydratedSubs: new Set(),
    /** 本次事务内已回写过密文的一级分类 id，作用同上 */
    dehydratedFirsts: new Set(),
  }
}

/**
 * 解密整棵分类树
 * @returns {Promise<ReturnType<typeof createContext>>} 解密上下文
 */
export async function hydrateLocks(env, data) {
  const ctx = createContext()
  const masterKey = await importMasterKey(env, data)
  if (!masterKey) return ctx

  for (const first of data.categories) {
    if (first.enc) {
      const contentKey = await unwrapContentKey(masterKey, first.enc)
      ctx.firstKeys.set(first.category_level_1.id, contentKey)
      const payload = await decryptJson(contentKey, first.enc)
      first.level2_with_links = payload.level2_with_links || []
    }

    // 一级解密后才能看到其中嵌套的加密二级分类
    for (const sub of first.level2_with_links || []) {
      ctx.subParent.set(sub.category.id, first.category_level_1.id)
      if (sub.enc) {
        const contentKey = await unwrapContentKey(masterKey, sub.enc)
        ctx.subKeys.set(sub.category.id, contentKey)
        const payload = await decryptJson(contentKey, sub.enc)
        sub.links = payload.links || []
      }
    }
  }

  return ctx
}

/** 二级分类回写为密文（必须先于一级执行） */
export async function dehydrateSubCategories(data, ctx) {
  for (const first of data.categories) {
    for (const sub of first.level2_with_links || []) {
      const contentKey = ctx.subKeys.get(sub.category.id)
      if (!sub.enc || !contentKey) continue
      // 本次事务已回写过：links 已被清空，再回写一次会把密文覆盖成空
      if (ctx.dehydratedSubs.has(sub.category.id)) continue

      const encrypted = await encryptJson(contentKey, { links: sub.links || [] })
      sub.enc = { ...sub.enc, iv: encrypted.iv, data: encrypted.data }
      sub.links = []
      ctx.dehydratedSubs.add(sub.category.id)
    }
  }
}

/** 一级分类回写为密文 */
export async function dehydrateFirstCategories(data, ctx) {
  for (const first of data.categories) {
    const contentKey = ctx.firstKeys.get(first.category_level_1.id)
    if (!first.enc || !contentKey) continue
    // 同上，保证同一次事务内幂等
    if (ctx.dehydratedFirsts.has(first.category_level_1.id)) continue

    const encrypted = await encryptJson(contentKey, {
      level2_with_links: first.level2_with_links || [],
    })
    first.enc = { ...first.enc, iv: encrypted.iv, data: encrypted.data }
    first.level2_with_links = []
    ctx.dehydratedFirsts.add(first.category_level_1.id)
  }
}

/** 回写全部密文：顺序固定为“先二级、后一级” */
export async function dehydrateLocks(data, ctx) {
  await dehydrateSubCategories(data, ctx)
  await dehydrateFirstCategories(data, ctx)
}

/** 二级分类列表 → 对外结构（剥离 enc 等敏感字段，只留 is_locked 标记） */
export function sanitizeSubCategories(list) {
  return (list || []).map((sub) => ({
    category: { ...sub.category, is_locked: sub.enc ? 1 : 0 },
    links: sub.links || [],
  }))
}

/** 分类树 → 对外结构 */
export function sanitizeCategories(categories) {
  return (categories || []).map((first) => ({
    category_level_1: {
      ...first.category_level_1,
      is_locked: first.enc ? 1 : 0,
    },
    level2_with_links: sanitizeSubCategories(first.level2_with_links),
  }))
}

/** 按 id 查一级分类 */
export function findFirstCategory(data, categoryId) {
  return data.categories.find((item) => item.category_level_1.id === Number(categoryId))
}

/**
 * 按 id 查二级分类
 * @returns {{ first: object, sub: object } | null}
 */
export function findSubCategory(data, categoryId) {
  const id = Number(categoryId)
  for (const first of data.categories) {
    const sub = (first.level2_with_links || []).find((item) => item.category.id === id)
    if (sub) return { first, sub }
  }
  return null
}

/**
 * 按 id 查链接及其所在分类
 * @returns {{ first: object, sub: object, link: object } | null}
 */
export function findLink(data, linkId) {
  const id = Number(linkId)
  for (const first of data.categories) {
    for (const sub of first.level2_with_links || []) {
      const link = (sub.links || []).find((item) => item.id === id)
      if (link) return { first, sub, link }
    }
  }
  return null
}

/** 解锁令牌是否覆盖指定分类 */
export async function hasUnlockToken(env, tokens, level, categoryId) {
  if (!Array.isArray(tokens) || !tokens.length) return false

  for (const token of tokens) {
    const payload = await verifyToken(env, token)
    if (
      payload &&
      payload.scope === 'unlock' &&
      Number(payload.level) === Number(level) &&
      Number(payload.catId) === Number(categoryId)
    ) {
      return true
    }
  }
  return false
}
