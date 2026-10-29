/**
 * 分类密码：设置 / 校验 / 凭令牌取回明文
 *
 * 三个接口的职责边界：
 *   - setCategoryPassword    管理员设置、修改、取消密码（写）
 *   - verifyCategoryPassword 访客输入密码，校验通过后签发解锁令牌
 *   - getCategoryContent     访客凭解锁令牌换回明文（刷新页面后恢复用）
 */

import { LEVEL, MIN_PASSWORD_LENGTH, UNLOCK_TOKEN_TTL } from '../constants'
import {
  createLockBlob,
  decryptJson,
  importMasterKey,
  resetLockPassword,
  unwrapContentKey,
  verifyPassword,
} from '../core/crypto'
import { assert, fail, ok, parseLevel, readJsonBody } from '../core/http'
import { createToken, verifyToken } from '../core/token'
import { readData } from '../store/data'
import {
  dehydrateSubCategories,
  findFirstCategory,
  findSubCategory,
  hasUnlockToken,
  hydrateLocks,
  sanitizeSubCategories,
} from '../store/locks'
import { withDecryptedData } from '../store/transaction'

/** 签发解锁令牌 */
function issueUnlockToken(env, level, categoryId) {
  return createToken(env, {
    scope: 'unlock',
    level,
    catId: Number(categoryId),
    exp: Date.now() + UNLOCK_TOKEN_TTL,
  })
}

/** 用加密块里的内容密钥解出明文 */
async function decryptLockPayload(env, data, blob) {
  const masterKey = await importMasterKey(env, data)
  const contentKey = await unwrapContentKey(masterKey, blob)
  return decryptJson(contentKey, blob)
}

/**
 * POST /api/data/setCategoryPassword
 * body: { categoryId, level, password, oldPassword? }
 *   - password 为空 → 取消加密（内容已在内存中解密为明文）
 *   - 已有密码 → 校验旧密码后只换摘要，内容密钥不变
 */
export async function setCategoryPassword({ request, env }) {
  const body = await readJsonBody(request)
  assert(body?.categoryId != null, 400, 'categoryId 必填')

  const level = parseLevel(body.level)
  const newPassword = body.password == null ? '' : String(body.password)
  const oldPassword = body.oldPassword == null ? '' : String(body.oldPassword)
  if (newPassword) assert(newPassword.length >= MIN_PASSWORD_LENGTH, 400, '密码至少 4 位')

  await withDecryptedData(env, async (data, ctx) => {
    if (level === LEVEL.FIRST) {
      const first = findFirstCategory(data, body.categoryId)
      assert(first, 404, '分类不存在')

      if (first.enc) {
        assert(await verifyPassword(oldPassword, first.enc), 403, '原密码错误')
        if (newPassword) await resetLockPassword(first.enc, newPassword)
        else delete first.enc
        return
      }

      assert(newPassword, 400, '该分类未加密')
      // 内部若有加密的二级分类，先回写成密文，避免明文被打包进一级密文
      await dehydrateSubCategories(data, ctx)

      first.enc = await createLockBlob(
        env,
        data,
        { level2_with_links: first.level2_with_links },
        newPassword
      )
      first.level2_with_links = []
      return
    }

    const target = findSubCategory(data, body.categoryId)
    assert(target, 404, '分类不存在')

    const { sub } = target
    if (sub.enc) {
      assert(await verifyPassword(oldPassword, sub.enc), 403, '原密码错误')
      if (newPassword) await resetLockPassword(sub.enc, newPassword)
      else delete sub.enc
      return
    }

    assert(newPassword, 400, '该分类未加密')
    sub.enc = await createLockBlob(env, data, { links: sub.links || [] }, newPassword)
    sub.links = []
  })

  return ok('设置成功')
}

/**
 * POST /api/data/verifyCategoryPassword（公开）
 * body: { categoryId, level, password, tokens? }
 * 二级分类若其上级也被加密，需要先在 tokens 里带上上级的解锁令牌。
 */
export async function verifyCategoryPassword({ request, env }) {
  const body = await readJsonBody(request)
  assert(body?.categoryId != null && body?.password != null, 400, 'categoryId 和 password 必填')

  const level = parseLevel(body.level)
  const data = await readData(env)

  if (level === LEVEL.FIRST) {
    const first = findFirstCategory(data, body.categoryId)
    assert(first, 404, '分类不存在')
    assert(first.category_level_1.guest_visible !== false, 404, '分类不存在')

    if (!first.enc) {
      return ok('该分类未加密', {
        token: null,
        data: sanitizeSubCategories(first.level2_with_links),
      })
    }
    assert(await verifyPassword(body.password, first.enc), 403, '密码错误')

    const payload = await decryptLockPayload(env, data, first.enc)
    const token = await issueUnlockToken(env, LEVEL.FIRST, body.categoryId)
    return ok('验证成功', {
      token,
      data: sanitizeSubCategories(payload.level2_with_links || []),
    })
  }

  // 二级分类：先解开上级，才有明文可供定位
  await hydrateLocks(env, data)
  const target = findSubCategory(data, body.categoryId)
  assert(target, 404, '分类不存在')

  const { first, sub } = target
  assert(first.category_level_1.guest_visible !== false, 404, '分类不存在')
  if (!sub.enc) return ok('该分类未加密', { token: null, data: sub.links || [] })

  if (first.enc) {
    const unlocked = await hasUnlockToken(env, body.tokens, LEVEL.FIRST, first.category_level_1.id)
    assert(unlocked, 403, '请先解锁上级分类')
  }
  assert(await verifyPassword(body.password, sub.enc), 403, '密码错误')

  const payload = await decryptLockPayload(env, data, sub.enc)
  const token = await issueUnlockToken(env, LEVEL.SECOND, body.categoryId)
  return ok('验证成功', { token, data: payload.links || [] })
}

/**
 * POST /api/data/getCategoryContent（公开）
 * body: { categoryId, token } —— 分类与层级以令牌内的声明为准。
 */
export async function getCategoryContent({ request, env }) {
  const body = await readJsonBody(request)
  assert(body?.categoryId != null && body?.token, 400, 'categoryId 和 token 必填')

  const claims = await verifyToken(env, body.token)
  if (!claims || claims.scope !== 'unlock') {
    return fail('解锁凭证无效或已过期，请重新输入密码', 403)
  }

  const level = Number(claims.level)
  const categoryId = Number(claims.catId)
  const data = await readData(env)

  if (level === LEVEL.FIRST) {
    const first = findFirstCategory(data, categoryId)
    assert(first, 404, '分类不存在')
    assert(first.category_level_1.guest_visible !== false, 404, '分类不存在')
    if (!first.enc) {
      return ok('获取成功', { data: sanitizeSubCategories(first.level2_with_links) })
    }
    const payload = await decryptLockPayload(env, data, first.enc)
    return ok('获取成功', { data: sanitizeSubCategories(payload.level2_with_links || []) })
  }

  await hydrateLocks(env, data)
  const target = findSubCategory(data, categoryId)
  assert(target, 404, '分类不存在')
  assert(target.first.category_level_1.guest_visible !== false, 404, '分类不存在')
  if (!target.sub.enc) return ok('获取成功', { data: target.sub.links || [] })

  const payload = await decryptLockPayload(env, data, target.sub.enc)
  return ok('获取成功', { data: payload.links || [] })
}
