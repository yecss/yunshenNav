// Cloudflare Worker — yunshenNav 后端
// 数据持久化在 Cloudflare KV 中。
//
// 「分类加密」说明：
//   - 一级/二级分类都可设置访问密码；
//   - 被加密分类的书签链接以 AES-256-GCM 加密后存储，访客接口不返回明文；
//   - 访客输入密码后，服务端校验并签发解锁令牌（2 小时有效），令牌对应的内容才会下发；
//   - 管理员（已登录）始终拥有完整访问权限，可自由管理加密分类。
//
// 加密结构：
//   一级分类被加密 → category.enc = { pwdSalt, pwdHash, wiv, wdata, iv, data }
//                    其中 data 加密的是 { level2_with_links: [...] }
//   二级分类被加密 → l2.enc = { pwdSalt, pwdHash, wiv, wdata, iv, data }
//                    其中 data 加密的是 { links: [...] }
//   （enc 内的内容密钥由服务端主密钥包裹，主密钥由 ENC_SECRET 或数据内随机值派生）

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400',
};

const EMPTY_DATA = () => ({
  version: 1,
  categories: [],
  messages: [],
  seq: { category: 1, link: 1, message: 1 },
});

// ---- 签名（登录 / 解锁令牌）----
function b64uEncode(s) {
  const b64 = btoa(unescape(encodeURIComponent(s)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64uDecode(s) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  return decodeURIComponent(escape(atob(b64 + pad)));
}

async function hmacSign(secret, msg) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg));
  const bytes = new Uint8Array(sig);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// 签名密钥：优先 JWT_SECRET，未配置时退回固定兜底值（保证登录/解锁可用）
function signSecret(env) {
  return env.JWT_SECRET || 'yunshen-nav-default-sign-secret';
}

async function makeToken(env, payload) {
  const body = b64uEncode(JSON.stringify(payload));
  const sig = await hmacSign(signSecret(env), body);
  return body + '.' + sig;
}

async function verifyToken(env, headerVal) {
  if (!headerVal) return null;
  const parts = headerVal.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = await hmacSign(signSecret(env), body);
  if (sig !== expected) return null;
  try {
    const payload = JSON.parse(b64uDecode(body));
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function newId(seq, key) {
  const id = seq[key];
  seq[key] = id + 1;
  return id;
}

// ============================================================
// 分类加密：AES-256-GCM + PBKDF2 密码摘要
// ============================================================

const PBKDF2_ITERATIONS = 10000;
const UNLOCK_TOKEN_TTL = 2 * 60 * 60 * 1000; // 解锁令牌有效期：2 小时

function b64FromBytes(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}
function bytesFromB64(str) {
  const bin = atob(str);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function randomBytes(len) {
  return crypto.getRandomValues(new Uint8Array(len));
}

async function sha256Bytes(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return new Uint8Array(buf);
}

// 服务端主密钥：优先使用 wrangler secret ENC_SECRET，否则使用数据内保存的随机密钥
async function getMasterKey(env, data) {
  const secret = env.ENC_SECRET || data.encMasterKey;
  if (!secret) return null;
  const raw = await sha256Bytes(secret);
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

async function derivePwdHash(password, saltB64) {
  const enc = new TextEncoder();
  const material = await crypto.subtle.importKey(
    'raw',
    enc.encode(String(password)),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: bytesFromB64(saltB64),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    material,
    256
  );
  return b64FromBytes(new Uint8Array(bits));
}

async function verifyPwd(password, blob) {
  if (!blob || !blob.pwdSalt || !blob.pwdHash) return false;
  const h = await derivePwdHash(password, blob.pwdSalt);
  return h === blob.pwdHash;
}

async function encryptPayload(ckey, payload) {
  const iv = randomBytes(12);
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    ckey,
    new TextEncoder().encode(JSON.stringify(payload))
  );
  return { iv: b64FromBytes(iv), data: b64FromBytes(new Uint8Array(ct)) };
}

async function decryptPayload(ckey, blob) {
  const iv = bytesFromB64(blob.iv);
  const ct = bytesFromB64(blob.data);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, ckey, ct);
  return JSON.parse(new TextDecoder().decode(pt));
}

// 生成加密块：随机内容密钥加密内容，内容密钥再用主密钥包裹
async function createBlob(env, data, payload, password) {
  const master = await getMasterKey(env, data);
  const ckey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  const rawKey = await crypto.subtle.exportKey('raw', ckey);
  const wiv = randomBytes(12);
  const wrapped = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: wiv }, master, rawKey);
  const enc = await encryptPayload(ckey, payload);
  const pwdSalt = b64FromBytes(randomBytes(16));
  const pwdHash = await derivePwdHash(password, pwdSalt);
  return {
    blob: {
      pwdSalt,
      pwdHash,
      wiv: b64FromBytes(wiv),
      wdata: b64FromBytes(new Uint8Array(wrapped)),
      iv: enc.iv,
      data: enc.data,
    },
  };
}

async function unwrapContentKey(master, blob) {
  const wiv = bytesFromB64(blob.wiv);
  const wrapped = bytesFromB64(blob.wdata);
  const raw = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: wiv }, master, wrapped);
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

// 解开所有加密内容，得到明文结构（仅存在于服务端内存中）
// 返回的 ctx 记录了内容密钥，写回时需要用同一把密钥重新加密
async function hydrateLocks(env, data) {
  const master = await getMasterKey(env, data);
  if (!master) return { catKeys: new Map(), l2Keys: new Map(), l2Parent: new Map() };
  const ctx = { catKeys: new Map(), l2Keys: new Map(), l2Parent: new Map() };
  for (const cat of data.categories) {
    if (cat.enc) {
      const ckey = await unwrapContentKey(master, cat.enc);
      ctx.catKeys.set(cat.category_level_1.id, ckey);
      const payload = await decryptPayload(ckey, cat.enc);
      cat.level2_with_links = payload.level2_with_links || [];
    }
    // 一级解密后，再处理其中嵌套的加密二级分类
    for (const l2 of cat.level2_with_links || []) {
      ctx.l2Parent.set(l2.category.id, cat.category_level_1.id);
      if (l2.enc) {
        const ckey = await unwrapContentKey(master, l2.enc);
        ctx.l2Keys.set(l2.category.id, ckey);
        const payload = await decryptPayload(ckey, l2.enc);
        l2.links = payload.links || [];
      }
    }
  }
  return ctx;
}

// 把加密的二级分类回写为密文（必须先于一级分类回写）
async function dehydrateLevel2s(env, data, ctx) {
  for (const cat of data.categories) {
    for (const l2 of cat.level2_with_links || []) {
      if (l2.enc && ctx.l2Keys.has(l2.category.id)) {
        const ckey = ctx.l2Keys.get(l2.category.id);
        const enc = await encryptPayload(ckey, { links: l2.links || [] });
        l2.enc = { ...l2.enc, iv: enc.iv, data: enc.data };
        l2.links = [];
      }
    }
  }
}

// 把加密的一级分类回写为密文
async function dehydrateLevel1s(env, data, ctx) {
  for (const cat of data.categories) {
    if (cat.enc && ctx.catKeys.has(cat.category_level_1.id)) {
      const ckey = ctx.catKeys.get(cat.category_level_1.id);
      const enc = await encryptPayload(ckey, {
        level2_with_links: cat.level2_with_links || [],
      });
      cat.enc = { ...cat.enc, iv: enc.iv, data: enc.data };
      cat.level2_with_links = [];
    }
  }
}

// 输出给前端前剥离所有加密相关字段
function sanitizeLevel2List(list) {
  return (list || []).map((l2) => ({
    category: { ...l2.category, is_locked: l2.enc ? 1 : 0 },
    links: l2.links || [],
  }));
}

function sanitizeCategories(categories) {
  return (categories || []).map((cat) => ({
    category_level_1: {
      ...cat.category_level_1,
      is_locked: cat.enc ? 1 : 0,
    },
    level2_with_links: sanitizeLevel2List(cat.level2_with_links),
  }));
}

function findLevel1(data, categoryId) {
  return data.categories.find((c) => c.category_level_1.id === Number(categoryId));
}

function findLevel2(data, categoryId) {
  for (const cat of data.categories) {
    const l2 = (cat.level2_with_links || []).find(
      (x) => x.category.id === Number(categoryId)
    );
    if (l2) return { cat, l2 };
  }
  return null;
}

function findLinkContainer(data, linkId) {
  for (const cat of data.categories) {
    for (const l2 of cat.level2_with_links || []) {
      const link = (l2.links || []).find((l) => l.id === Number(linkId));
      if (link) return { cat, l2, link };
    }
  }
  return null;
}

// 解锁令牌是否覆盖指定分类
async function hasUnlockToken(env, tokens, level, categoryId) {
  if (!Array.isArray(tokens) || !tokens.length) return false;
  for (const t of tokens) {
    const p = await verifyToken(env, t);
    if (
      p &&
      p.scope === 'unlock' &&
      Number(p.level) === Number(level) &&
      Number(p.catId) === Number(categoryId)
    ) {
      return true;
    }
  }
  return false;
}

// ---- KV 存储 ----
async function readData(env) {
  const data = await env.YUNSHEN_DATA.get('data', 'json');
  if (!data) return EMPTY_DATA();
  if (!Array.isArray(data.categories)) data.categories = [];
  if (!Array.isArray(data.messages)) data.messages = [];
  if (!data.seq) data.seq = { category: 1, link: 1, message: 1 };
  if (!data.version) data.version = 1;
  // 首次使用时生成并保存服务端主密钥（保证加密数据长期可解）
  if (!env.ENC_SECRET && !data.encMasterKey) {
    data.encMasterKey = b64FromBytes(randomBytes(32));
    await writeData(env, data);
  }
  return data;
}

// 为历史链接补齐 created_at（按 id 递增推算时间，保证顺序与 id 一致）
async function ensureLinkTimestamps(env, data) {
  let changed = false;
  const links = [];
  for (const c of data.categories) {
    for (const l2 of c.level2_with_links || []) {
      for (const link of l2.links || []) links.push(link);
    }
  }
  const missing = links.filter((l) => !l.created_at);
  if (missing.length === 0) return false;

  // 基准时间：当前时间；每个 id 间隔 6 小时往回推
  const STEP = 6 * 60 * 60 * 1000;
  const now = Date.now();
  const maxId = Math.max(...links.map((l) => Number(l.id) || 0));
  for (const link of missing) {
    link.created_at = now - (maxId - (Number(link.id) || 0)) * STEP;
  }
  changed = true;
  await writeData(env, data);
  return changed;
}

async function writeData(env, data) {
  await env.YUNSHEN_DATA.put('data', JSON.stringify(data));
}

// 数据版本号：任何写入都会自增，前端据此判断本地缓存是否过期
function bumpVersion(data) {
  data.version = (data.version || 1) + 1;
  return data.version;
}

// ---- 响应工具 ----
function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS, ...extra },
  });
}

function ok(message, extra = {}) {
  return json({ status: 200, message, ...extra });
}
function fail(message, status = 500, extra = {}) {
  return json({ status, message, ...extra }, status);
}

// ---- 路由 ----
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/+/, '/');
    const method = request.method.toUpperCase();

    try {
      // 健康检查
      if (path === '/api/health' && method === 'GET') {
        return ok('OK');
      }

      // ---- 登录 ----
      if (path === '/api/user/login' && method === 'POST') {
        const { username, password } = await request.json();
        if (username === env.ADMIN_USER && password === env.ADMIN_PASSWORD) {
          const token = await makeToken(env, {
            user: username,
            exp: Date.now() + 7 * 24 * 3600 * 1000,
          });
          return ok('登录成功', { token });
        }
        return fail('用户名或密码错误', 403);
      }

      // ---- 数据版本号：前端用于校验本地缓存 ----
      if (path === '/api/data/version' && method === 'GET') {
        const data = await readData(env);
        return ok('OK', { version: data.version || 1, silent: true });
      }

      // ---- 游客数据：加密分类不返回明文内容 ----
      if (path === '/api/data/getGuestData' && method === 'GET') {
        const data = await readData(env);
        await ensureLinkTimestamps(env, data);
        return ok('数据获取成功', {
          data: sanitizeCategories(data.categories),
          version: data.version || 1,
        });
      }

      // ---- 管理员数据：始终返回完整内容 ----
      if (path === '/api/data/getData' && method === 'POST') {
        const admin = await verifyToken(env, request.headers.get('Authorization'));
        if (!admin) return fail('未授权', 401);
        const data = await readData(env);
        await ensureLinkTimestamps(env, data);
        const ctx = await hydrateLocks(env, data);
        return ok('数据获取成功', {
          data: sanitizeCategories(data.categories),
          version: data.version || 1,
          lockedIds: {
            level1: [...ctx.catKeys.keys()],
            level2: [...ctx.l2Keys.keys()],
          },
        });
      }

      // ---- 分类解锁（公开）：校验密码并返回解密后的内容 ----
      if (path === '/api/data/verifyCategoryPassword' && method === 'POST') {
        const body = await request.json();
        if (!body || body.categoryId == null || body.password == null) {
          return fail('categoryId 和 password 必填', 400);
        }
        const level = Number(body.level) === 2 ? 2 : 1;
        const data = await readData(env);

        if (level === 1) {
          const cat = findLevel1(data, body.categoryId);
          if (!cat) return fail('分类不存在', 404);
          if (!cat.enc) {
            return ok('该分类未加密', {
              token: null,
              data: sanitizeLevel2List(cat.level2_with_links),
            });
          }
          if (!(await verifyPwd(body.password, cat.enc))) {
            return fail('密码错误', 403);
          }
          const master = await getMasterKey(env, data);
          const ckey = await unwrapContentKey(master, cat.enc);
          const payload = await decryptPayload(ckey, cat.enc);
          const token = await makeToken(env, {
            scope: 'unlock',
            level: 1,
            catId: Number(body.categoryId),
            exp: Date.now() + UNLOCK_TOKEN_TTL,
          });
          return ok('验证成功', {
            token,
            data: sanitizeLevel2List(payload.level2_with_links || []),
          });
        }

        // 二级分类：先解开上级分类，找到目标二级分类
        await hydrateLocks(env, data);
        const found = findLevel2(data, body.categoryId);
        if (!found) return fail('分类不存在', 404);
        const { cat, l2 } = found;
        if (!l2.enc) {
          return ok('该分类未加密', { token: null, data: l2.links || [] });
        }
        // 若上级分类本身被加密，必须先解锁上级分类
        if (cat.enc) {
          const okToken = await hasUnlockToken(
            env,
            body.tokens,
            1,
            cat.category_level_1.id
          );
          if (!okToken) return fail('请先解锁上级分类', 403);
        }
        if (!(await verifyPwd(body.password, l2.enc))) {
          return fail('密码错误', 403);
        }
        const master = await getMasterKey(env, data);
        const ckey = await unwrapContentKey(master, l2.enc);
        const payload = await decryptPayload(ckey, l2.enc);
        const token = await makeToken(env, {
          scope: 'unlock',
          level: 2,
          catId: Number(body.categoryId),
          exp: Date.now() + UNLOCK_TOKEN_TTL,
        });
        return ok('验证成功', { token, data: payload.links || [] });
      }

      // ---- 分类内容（公开）：凭解锁令牌换取已解密内容（刷新页面后恢复用）----
      if (path === '/api/data/getCategoryContent' && method === 'POST') {
        const body = await request.json();
        if (!body || body.categoryId == null || !body.token) {
          return fail('categoryId 和 token 必填', 400);
        }
        const payload = await verifyToken(env, body.token);
        if (!payload || payload.scope !== 'unlock') {
          return fail('解锁凭证无效或已过期，请重新输入密码', 403);
        }
        const level = Number(payload.level);
        const catId = Number(payload.catId);
        const data = await readData(env);

        if (level === 1) {
          const cat = findLevel1(data, catId);
          if (!cat) return fail('分类不存在', 404);
          if (!cat.enc) {
            return ok('获取成功', { data: sanitizeLevel2List(cat.level2_with_links) });
          }
          const master = await getMasterKey(env, data);
          const ckey = await unwrapContentKey(master, cat.enc);
          const p = await decryptPayload(ckey, cat.enc);
          return ok('获取成功', { data: sanitizeLevel2List(p.level2_with_links || []) });
        }

        await hydrateLocks(env, data);
        const found = findLevel2(data, catId);
        if (!found) return fail('分类不存在', 404);
        if (!found.l2.enc) {
          return ok('获取成功', { data: found.l2.links || [] });
        }
        const master = await getMasterKey(env, data);
        const ckey = await unwrapContentKey(master, found.l2.enc);
        const p = await decryptPayload(ckey, found.l2.enc);
        return ok('获取成功', { data: p.links || [] });
      }

      // ---- 留言板：公开 ----
      if (path === '/api/data/getMessages' && method === 'GET') {
        const data = await readData(env);
        return ok('留言获取成功', { data: data.messages });
      }
      if (path === '/api/data/createMessage' && method === 'POST') {
        const body = await request.json();
        if (!body || !body.username || !body.text) {
          return fail('username 和 text 必填', 400);
        }
        const message = {
          id: '',
          username: String(body.username).slice(0, 64),
          qqNumber: body.qqNumber ? String(body.qqNumber).slice(0, 20) : '10000',
          text: String(body.text).slice(0, 1000),
          timestamp: new Date().toISOString(),
        };
        const data = await readData(env);
        message.id = String(newId(data.seq, 'message'));
        data.messages.push(message);
        bumpVersion(data);
        await writeData(env, data);
        return ok('留言成功', { data: { id: message.id, timestamp: message.timestamp } });
      }
      if (path === '/api/data/deleteMessage' && method === 'POST') {
        const body = await request.json();
        if (!body || !body.messageId) return fail('messageId 必填', 400);
        const admin = await verifyToken(env, body.token || request.headers.get('Authorization'));
        const data = await readData(env);
        const idx = data.messages.findIndex((m) => String(m.id) === String(body.messageId));
        if (idx === -1) return fail('留言不存在', 404);
        const msg = data.messages[idx];
        if (!admin && (!body.qqNumber || String(msg.qqNumber) !== String(body.qqNumber))) {
          return fail('无权删除该留言', 403);
        }
        data.messages.splice(idx, 1);
        bumpVersion(data);
        await writeData(env, data);
        return ok('删除成功');
      }

      // ---- 点击日志：丢弃 ----
      if (path === '/api/data/logClick' && method === 'POST') {
        return ok('OK');
      }

      // ============================================================
      // 以下为 admin 专属：管理员始终拥有完整访问权限
      // ============================================================
      const admin = await verifyToken(env, request.headers.get('Authorization'));
      if (!admin) return fail('未授权', 401);

      // 设置 / 修改 / 取消分类密码
      if (path === '/api/data/setCategoryPassword' && method === 'POST') {
        const body = await request.json();
        if (!body || body.categoryId == null) return fail('categoryId 必填', 400);
        const level = Number(body.level) === 2 ? 2 : 1;
        const newPassword = body.password == null ? '' : String(body.password);
        const oldPassword = body.oldPassword == null ? '' : String(body.oldPassword);
        if (newPassword && newPassword.length < 4) return fail('密码至少 4 位', 400);

        const data = await readData(env);
        const ctx = await hydrateLocks(env, data);

        if (level === 1) {
          const cat = findLevel1(data, body.categoryId);
          if (!cat) return fail('分类不存在', 404);
          if (cat.enc) {
            if (!(await verifyPwd(oldPassword, cat.enc))) {
              return fail('原密码错误', 403);
            }
            if (!newPassword) {
              // 取消加密：内容已解密为明文
              delete cat.enc;
            } else {
              // 修改密码：内容密钥不变，仅更新密码摘要
              const salt = b64FromBytes(randomBytes(16));
              cat.enc.pwdSalt = salt;
              cat.enc.pwdHash = await derivePwdHash(newPassword, salt);
            }
          } else {
            if (!newPassword) return fail('该分类未加密', 400);
            // 内部若有加密的二级分类，先回写为密文，避免明文被打包进一级密文
            await dehydrateLevel2s(env, data, ctx);
            const { blob } = await createBlob(
              env,
              data,
              { level2_with_links: cat.level2_with_links },
              newPassword
            );
            cat.enc = blob;
            cat.level2_with_links = [];
          }
        } else {
          const found = findLevel2(data, body.categoryId);
          if (!found) return fail('分类不存在', 404);
          const { l2 } = found;
          if (l2.enc) {
            if (!(await verifyPwd(oldPassword, l2.enc))) {
              return fail('原密码错误', 403);
            }
            if (!newPassword) {
              delete l2.enc;
            } else {
              const salt = b64FromBytes(randomBytes(16));
              l2.enc.pwdSalt = salt;
              l2.enc.pwdHash = await derivePwdHash(newPassword, salt);
            }
          } else {
            if (!newPassword) return fail('该分类未加密', 400);
            const { blob } = await createBlob(
              env,
              data,
              { links: l2.links || [] },
              newPassword
            );
            l2.enc = blob;
            l2.links = [];
          }
        }

        await dehydrateLevel2s(env, data, ctx);
        await dehydrateLevel1s(env, data, ctx);
        bumpVersion(data);
        await writeData(env, data);
        return ok('设置成功');
      }

      // 分类新增
      if (path === '/api/data/addCategory' && method === 'POST') {
        const body = await request.json();
        if (!body || !body.categoryName) return fail('categoryName 必填', 400);
        const data = await readData(env);
        const ctx = await hydrateLocks(env, data);
        let categoryId;

        if (body.level === 1) {
          categoryId = newId(data.seq, 'category');
          data.categories.push({
            category_level_1: {
              id: categoryId,
              name: body.categoryName,
              icon: body.icon || 'heroicons:inbox',
              sort_order: body.sort_order ?? data.categories.length + 1,
            },
            level2_with_links: [],
          });
        } else {
          const parent = findLevel1(data, body.parentId);
          if (!parent) return fail('父分类不存在', 400);
          categoryId = newId(data.seq, 'category');
          parent.level2_with_links.push({
            category: {
              id: categoryId,
              parentId: Number(body.parentId),
              name: body.categoryName,
              level: 2,
              sort_order: body.sort_order ?? parent.level2_with_links.length + 1,
            },
            links: [],
          });
        }

        await dehydrateLevel2s(env, data, ctx);
        await dehydrateLevel1s(env, data, ctx);
        bumpVersion(data);
        await writeData(env, data);
        return ok('新增成功', { categoryId });
      }

      // 分类删除
      if (path === '/api/data/deleteCategroy' && method === 'POST') {
        const body = await request.json();
        if (!body || body.categoryId == null) return fail('categoryId 必填', 400);
        const data = await readData(env);
        const ctx = await hydrateLocks(env, data);
        let found = false;

        if (body.level === 1) {
          const idx = data.categories.findIndex(
            (c) => c.category_level_1.id === Number(body.categoryId)
          );
          if (idx !== -1) {
            data.categories.splice(idx, 1);
            found = true;
          }
        } else {
          const target = findLevel2(data, body.categoryId);
          if (target) {
            target.cat.level2_with_links = target.cat.level2_with_links.filter(
              (l2) => l2.category.id !== Number(body.categoryId)
            );
            found = true;
          }
        }

        if (!found) return fail('分类不存在', 404);
        await dehydrateLevel2s(env, data, ctx);
        await dehydrateLevel1s(env, data, ctx);
        bumpVersion(data);
        await writeData(env, data);
        return ok('删除成功');
      }

      // 分类改名
      if (path === '/api/data/updateCategroy' && method === 'POST') {
        const body = await request.json();
        if (!body || body.categoryId == null || !body.newName) {
          return fail('categoryId 和 newName 必填', 400);
        }
        const data = await readData(env);
        const ctx = await hydrateLocks(env, data);
        let found = false;

        if (body.level === 1) {
          const c = findLevel1(data, body.categoryId);
          if (c) {
            c.category_level_1.name = body.newName;
            found = true;
          }
        } else {
          const target = findLevel2(data, body.categoryId);
          if (target) {
            target.l2.category.name = body.newName;
            found = true;
          }
        }

        if (!found) return fail('分类不存在', 404);
        await dehydrateLevel2s(env, data, ctx);
        await dehydrateLevel1s(env, data, ctx);
        bumpVersion(data);
        await writeData(env, data);
        return ok('更新成功');
      }

      // 链接新增
      if (path === '/api/data/addLink' && method === 'POST') {
        const body = await request.json();
        if (!body || !body.name || !body.url) return fail('name 和 url 必填', 400);
        const data = await readData(env);
        const ctx = await hydrateLocks(env, data);
        let linkId;
        let placed = false;

        for (const cat of data.categories) {
          const l2 = (cat.level2_with_links || []).find(
            (x) => x.category.id === Number(body.category_level_2)
          );
          if (!l2) continue;
          linkId = newId(data.seq, 'link');
          l2.links = l2.links || [];
          l2.links.push({
            id: linkId,
            name: body.name,
            url: body.url,
            sort_order: body.sort_order ?? l2.links.length + 1,
            is_blocked: body.is_blocked || 0,
            is_recommend: body.is_recommend || 0,
            icon: body.icon || '',
            created_at: Date.now(),
          });
          placed = true;
          break;
        }

        if (!placed) return fail('目标分类不存在', 400);
        await dehydrateLevel2s(env, data, ctx);
        await dehydrateLevel1s(env, data, ctx);
        bumpVersion(data);
        await writeData(env, data);
        return ok('新增成功', { linkId });
      }

      // 链接删除
      if (path === '/api/data/deleteLink' && method === 'POST') {
        const body = await request.json();
        if (!body || body.id == null) return fail('id 必填', 400);
        const data = await readData(env);
        const ctx = await hydrateLocks(env, data);
        const target = findLinkContainer(data, body.id);
        if (!target) return fail('链接不存在', 404);
        target.l2.links = target.l2.links.filter((l) => l.id !== Number(body.id));
        await dehydrateLevel2s(env, data, ctx);
        await dehydrateLevel1s(env, data, ctx);
        bumpVersion(data);
        await writeData(env, data);
        return ok('删除成功');
      }

      // 链接更新
      if (path === '/api/data/updateLink' && method === 'POST') {
        const body = await request.json();
        if (!body || body.id == null) return fail('id 必填', 400);
        const data = await readData(env);
        const ctx = await hydrateLocks(env, data);
        const target = findLinkContainer(data, body.id);
        if (!target) return fail('链接不存在', 404);
        const link = target.link;
        if (body.title != null) link.name = body.title;
        if (body.url != null) link.url = body.url;
        if (body.order != null) link.sort_order = body.order;
        if (body.isBlocked != null) link.is_blocked = body.isBlocked;
        if (body.isRecommend != null) link.is_recommend = body.isRecommend;
        await dehydrateLevel2s(env, data, ctx);
        await dehydrateLevel1s(env, data, ctx);
        bumpVersion(data);
        await writeData(env, data);
        return ok('更新成功');
      }

      // 链接排序更新
      if (path === '/api/data/updateLinkOrder' && method === 'POST') {
        const body = await request.json();
        if (!body || body.linkId == null || body.newSortOrder == null) {
          return fail('linkId 和 newSortOrder 必填', 400);
        }
        const data = await readData(env);
        const ctx = await hydrateLocks(env, data);
        const target = findLinkContainer(data, body.linkId);
        if (!target) return fail('链接不存在', 404);
        target.link.sort_order = body.newSortOrder;
        await dehydrateLevel2s(env, data, ctx);
        await dehydrateLevel1s(env, data, ctx);
        bumpVersion(data);
        await writeData(env, data);
        return ok('排序已更新');
      }

      // 一级分类排序更新
      if (path === '/api/data/updateCategoryOrder' && method === 'POST') {
        const body = await request.json();
        if (!body || body.categoryId == null || body.newSortOrder == null) {
          return fail('categoryId 和 newSortOrder 必填', 400);
        }
        const data = await readData(env);
        const c = findLevel1(data, body.categoryId);
        if (!c) return fail('分类不存在', 404);
        c.category_level_1.sort_order = body.newSortOrder;
        bumpVersion(data);
        await writeData(env, data);
        return ok('排序已更新');
      }

      return fail('Not Found', 404);
    } catch (e) {
      console.error('worker error', e);
      return fail(e.message || '服务器错误', 500);
    }
  },
};
