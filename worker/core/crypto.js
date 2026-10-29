/**
 * 分类加密：AES-256-GCM 加密内容 + PBKDF2 校验分类密码。
 *
 * 加密块结构（挂在 category.enc / level2.enc 上）：
 *   { pwdSalt, pwdHash, wiv, wdata, iv, data }
 *   - data + iv     内容密文及其 IV
 *   - wdata + wiv   “内容密钥”被主密钥包裹后的密文及其 IV
 *   - pwdSalt/pwdHash  PBKDF2 派生的密码摘要（不可逆，仅用于校验）
 *
 * 主密钥来自 ENC_SECRET 或数据内的 encMasterKey，只用来包裹内容密钥；
 * 因此修改密码时内容无需重新加密，只更新密码摘要即可。
 */

import { PBKDF2_ITERATIONS } from '../constants'

/** 字节数组 → Base64 */
export function bytesToBase64(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

/** Base64 → 字节数组 */
export function base64ToBytes(value) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/** 生成安全随机字节 */
export function randomBytes(size) {
  return crypto.getRandomValues(new Uint8Array(size))
}

async function sha256(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return new Uint8Array(digest)
}

/**
 * 导入主密钥（仅用于包裹/解包内容密钥）
 * @returns {Promise<CryptoKey|null>} 未配置任何主密钥来源时返回 null
 */
export async function importMasterKey(env, data) {
  const secret = env.ENC_SECRET || data.encMasterKey
  if (!secret) return null
  const raw = await sha256(secret)
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

/** 用 PBKDF2 派生密码摘要 */
export async function derivePasswordHash(password, salt) {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(String(password)),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: base64ToBytes(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    material,
    256
  )
  return bytesToBase64(new Uint8Array(bits))
}

/** 校验分类密码 */
export async function verifyPassword(password, blob) {
  if (!blob || !blob.pwdSalt || !blob.pwdHash) return false
  const hash = await derivePasswordHash(password, blob.pwdSalt)
  return hash === blob.pwdHash
}

/** 用内容密钥加密载荷 */
export async function encryptJson(contentKey, payload) {
  const iv = randomBytes(12)
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    contentKey,
    new TextEncoder().encode(JSON.stringify(payload))
  )
  return { iv: bytesToBase64(iv), data: bytesToBase64(new Uint8Array(ciphertext)) }
}

/** 用内容密钥解密载荷 */
export async function decryptJson(contentKey, blob) {
  const iv = base64ToBytes(blob.iv)
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    contentKey,
    base64ToBytes(blob.data)
  )
  return JSON.parse(new TextDecoder().decode(plaintext))
}

/** 解开加密块里的内容密钥 */
export async function unwrapContentKey(masterKey, blob) {
  const raw = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(blob.wiv) },
    masterKey,
    base64ToBytes(blob.wdata)
  )
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

/**
 * 生成一个全新的加密块
 * 随机内容密钥加密载荷，内容密钥再用主密钥包裹
 */
export async function createLockBlob(env, data, payload, password) {
  const masterKey = await importMasterKey(env, data)
  const contentKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt',
  ])
  const rawKey = await crypto.subtle.exportKey('raw', contentKey)
  const wiv = randomBytes(12)
  const wrapped = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: wiv }, masterKey, rawKey)
  const encrypted = await encryptJson(contentKey, payload)
  const pwdSalt = bytesToBase64(randomBytes(16))

  return {
    pwdSalt,
    pwdHash: await derivePasswordHash(password, pwdSalt),
    wiv: bytesToBase64(wiv),
    wdata: bytesToBase64(new Uint8Array(wrapped)),
    iv: encrypted.iv,
    data: encrypted.data,
  }
}

/**
 * 重置加密块的密码（内容密钥不变，只换盐与摘要）
 * @returns {Promise<void>}
 */
export async function resetLockPassword(blob, password) {
  const salt = bytesToBase64(randomBytes(16))
  blob.pwdSalt = salt
  blob.pwdHash = await derivePasswordHash(password, salt)
}
