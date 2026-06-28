// Cloudflare Worker — yunshenNav 后端
// 数据持久化在 Cloudflare KV 中。

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400',
};

const EMPTY_DATA = () => ({
  categories: [],
  messages: [],
  seq: { category: 1, link: 1, message: 1 },
});

// ---- crypto helpers ----
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

async function makeToken(env, payload) {
  const body = b64uEncode(JSON.stringify(payload));
  const sig = await hmacSign(env.JWT_SECRET, body);
  return body + '.' + sig;
}

async function verifyToken(env, headerVal) {
  if (!headerVal) return null;
  const parts = headerVal.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = await hmacSign(env.JWT_SECRET, body);
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

// ---- KV 存储 ----
async function readData(env) {
  const data = await env.YUNSHEN_DATA.get('data', 'json');
  if (!data) return EMPTY_DATA();
  if (!Array.isArray(data.categories)) data.categories = [];
  if (!Array.isArray(data.messages)) data.messages = [];
  if (!data.seq) data.seq = { category: 1, link: 1, message: 1 };
  return data;
}

async function writeData(env, data) {
  await env.YUNSHEN_DATA.put('data', JSON.stringify(data));
}

async function mutate(env, fn) {
  const data = await readData(env);
  const result = fn(data);
  if (result === false) return null;
  await writeData(env, data);
  return result === undefined ? data : result;
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

      // ---- 游客数据 ----
      if (path === '/api/data/getGuestData' && method === 'GET') {
        const data = await readData(env);
        return ok('OK', { data: data.categories });
      }
      if (path === '/api/data/getData' && method === 'POST') {
        const admin = await verifyToken(env, request.headers.get('Authorization'));
        if (!admin) return fail('未授权', 401);
        const data = await readData(env);
        return ok('OK', { data: data.categories });
      }

      // ---- 留言板：公开 ----
      if (path === '/api/data/getMessages' && method === 'GET') {
        const data = await readData(env);
        return ok('OK', { data: data.messages });
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
        await mutate(env, (data) => {
          message.id = String(newId(data.seq, 'message'));
          data.messages.push(message);
        });
        return ok('留言成功', { data: { id: message.id, timestamp: message.timestamp } });
      }
      if (path === '/api/data/deleteMessage' && method === 'POST') {
        const body = await request.json();
        if (!body || !body.messageId) return fail('messageId 必填', 400);
        const admin = await verifyToken(env, body.token || request.headers.get('Authorization'));
        let removed = false;
        await mutate(env, (data) => {
          const idx = data.messages.findIndex((m) => String(m.id) === String(body.messageId));
          if (idx === -1) return false;
          const msg = data.messages[idx];
          if (!admin && (!body.qqNumber || String(msg.qqNumber) !== String(body.qqNumber))) {
            return false;
          }
          data.messages.splice(idx, 1);
          removed = true;
        });
        return removed ? ok('删除成功') : fail('无权删除或留言不存在', 403);
      }

      // ---- 点击日志：丢弃 ----
      if (path === '/api/data/logClick' && method === 'POST') {
        return ok('OK');
      }

      // ---- 以下为 admin 专属 ----
      const admin = await verifyToken(env, request.headers.get('Authorization'));
      if (!admin) return fail('未授权', 401);

      // 分类新增
      if (path === '/api/data/addCategory' && method === 'POST') {
        const body = await request.json();
        if (!body || !body.categoryName) return fail('categoryName 必填', 400);
        let categoryId;
        await mutate(env, (data) => {
          categoryId = newId(data.seq, 'category');
          if (body.level === 1) {
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
            const parent = data.categories.find(
              (c) => c.category_level_1.id === Number(body.parentId)
            );
            if (!parent) return false;
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
        });
        if (categoryId === undefined) return fail('父分类不存在', 400);
        return ok('新增成功', { categoryId });
      }

      // 分类删除
      if (path === '/api/data/deleteCategroy' && method === 'POST') {
        const body = await request.json();
        if (!body || body.categoryId == null) return fail('categoryId 必填', 400);
        let found = false;
        await mutate(env, (data) => {
          if (body.level === 1) {
            const idx = data.categories.findIndex(
              (c) => c.category_level_1.id === Number(body.categoryId)
            );
            if (idx !== -1) {
              data.categories.splice(idx, 1);
              found = true;
            }
          } else {
            for (const c of data.categories) {
              const idx = c.level2_with_links.findIndex(
                (l2) => l2.category.id === Number(body.categoryId)
              );
              if (idx !== -1) {
                c.level2_with_links.splice(idx, 1);
                found = true;
                break;
              }
            }
          }
        });
        return found ? ok('删除成功') : fail('分类不存在', 404);
      }

      // 分类改名
      if (path === '/api/data/updateCategroy' && method === 'POST') {
        const body = await request.json();
        if (!body || body.categoryId == null || !body.newName) {
          return fail('categoryId 和 newName 必填', 400);
        }
        let found = false;
        await mutate(env, (data) => {
          if (body.level === 1) {
            const c = data.categories.find(
              (c) => c.category_level_1.id === Number(body.categoryId)
            );
            if (c) {
              c.category_level_1.name = body.newName;
              found = true;
            }
          } else {
            for (const c of data.categories) {
              const l2 = c.level2_with_links.find(
                (l2) => l2.category.id === Number(body.categoryId)
              );
              if (l2) {
                l2.category.name = body.newName;
                found = true;
                return;
              }
            }
          }
        });
        return found ? ok('更新成功') : fail('分类不存在', 404);
      }

      // 链接新增
      if (path === '/api/data/addLink' && method === 'POST') {
        const body = await request.json();
        if (!body || !body.name || !body.url) return fail('name 和 url 必填', 400);
        let linkId;
        let placed = false;
        await mutate(env, (data) => {
          linkId = newId(data.seq, 'link');
          for (const c of data.categories) {
            const l2 = c.level2_with_links.find(
              (l2) => l2.category.id === Number(body.category_level_2)
            );
            if (l2) {
              l2.links.push({
                id: linkId,
                name: body.name,
                url: body.url,
                sort_order: body.sort_order ?? l2.links.length + 1,
                is_blocked: body.is_blocked || 0,
                is_recommend: body.is_recommend || 0,
                icon: body.icon || '',
              });
              placed = true;
              return;
            }
          }
          return false;
        });
        if (!placed) return fail('目标分类不存在', 400);
        return ok('新增成功', { linkId });
      }

      // 链接删除
      if (path === '/api/data/deleteLink' && method === 'POST') {
        const body = await request.json();
        if (!body || body.id == null) return fail('id 必填', 400);
        let found = false;
        await mutate(env, (data) => {
          for (const c of data.categories) {
            for (const l2 of c.level2_with_links) {
              const idx = l2.links.findIndex((l) => l.id === Number(body.id));
              if (idx !== -1) {
                l2.links.splice(idx, 1);
                found = true;
                return;
              }
            }
          }
        });
        return found ? ok('删除成功') : fail('链接不存在', 404);
      }

      // 链接更新
      if (path === '/api/data/updateLink' && method === 'POST') {
        const body = await request.json();
        if (!body || body.id == null) return fail('id 必填', 400);
        let found = false;
        await mutate(env, (data) => {
          for (const c of data.categories) {
            for (const l2 of c.level2_with_links) {
              const link = l2.links.find((l) => l.id === Number(body.id));
              if (link) {
                if (body.title != null) link.name = body.title;
                if (body.url != null) link.url = body.url;
                if (body.order != null) link.sort_order = body.order;
                if (body.isBlocked != null) link.is_blocked = body.isBlocked;
                if (body.isRecommend != null) link.is_recommend = body.isRecommend;
                found = true;
                return;
              }
            }
          }
        });
        return found ? ok('更新成功') : fail('链接不存在', 404);
      }

      // 链接排序更新
      if (path === '/api/data/updateLinkOrder' && method === 'POST') {
        const body = await request.json();
        if (!body || body.linkId == null || body.newSortOrder == null) {
          return fail('linkId 和 newSortOrder 必填', 400);
        }
        let found = false;
        await mutate(env, (data) => {
          for (const c of data.categories) {
            for (const l2 of c.level2_with_links) {
              const link = l2.links.find((l) => l.id === Number(body.linkId));
              if (link) {
                link.sort_order = body.newSortOrder;
                found = true;
                return;
              }
            }
          }
        });
        return found ? ok('排序已更新') : fail('链接不存在', 404);
      }

      return fail('Not Found', 404);
    } catch (e) {
      console.error('worker error', e);
      return fail(e.message || '服务器错误', 500);
    }
  },
};