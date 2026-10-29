/**
 * Worker 端到端验证
 *
 * 启动本地 wrangler dev，依次验证：健康检查 / 鉴权 / 分类与链接 CRUD /
 * 分类加密往返 / 留言板。断言全部按 id 定位节点，不假设库里是空数据。
 *
 * 用法：npm run test:worker
 * 前置：项目根目录存在 .dev.vars（提供 ADMIN_USER / ADMIN_PASSWORD）。
 */

const { spawn, spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const wranglerBin = path.join(root, 'node_modules/wrangler/bin/wrangler.js')
const persistDir = path.join(root, '.workbuddy/tmp-kv')
const PORT = Number(process.env.PORT || 8788)
const BASE = `http://127.0.0.1:${PORT}`

if (!fs.existsSync(path.join(root, '.dev.vars'))) {
  console.error('缺少 .dev.vars，请先配置 ADMIN_USER / ADMIN_PASSWORD')
  process.exit(1)
}

// 从 .dev.vars 读取本地管理员账号，避免把密码写进脚本
const devVars = Object.fromEntries(
  fs
    .readFileSync(path.join(root, '.dev.vars'), 'utf8')
    .split(/\r?\n/)
    .map((line) => line.split('='))
    .filter((pair) => pair.length >= 2)
    .map(([key, ...rest]) => [key.trim(), rest.join('=').trim().replace(/^"|"$/g, '')])
)

const ADMIN_USER = devVars.ADMIN_USER || 'admin'
const ADMIN_PASSWORD = devVars.ADMIN_PASSWORD || ''

if (!ADMIN_PASSWORD) {
  console.error('.dev.vars 中缺少 ADMIN_PASSWORD，无法验证登录相关接口')
  process.exit(1)
}

let passed = 0
const failures = []

function check(name, condition, detail) {
  if (condition) {
    passed += 1
    console.log(`  ok   ${name}`)
  } else {
    failures.push(name)
    console.log(`  FAIL ${name}`)
    if (detail !== undefined) console.log('       ', JSON.stringify(detail).slice(0, 500))
  }
}

async function call(method, path, { body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = token
  const response = await fetch(BASE + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }
  return { http: response.status, body: payload }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function waitForServer(timeoutMs = 120000) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`${BASE}/api/health`)
      if (response.ok) return true
    } catch {
      // 还没起来
    }
    await sleep(1000)
  }
  return false
}

function stopChild(child) {
  if (!child || child.killed) return
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'])
  } else {
    child.kill('SIGTERM')
  }
}

/** 在一级分类列表里按 id 找节点 */
const findFirst = (tree, id) => (tree || []).find((node) => node.category_level_1.id === id)

/** 在整棵树里按 id 找二级分类 */
function findSub(tree, id) {
  for (const node of tree || []) {
    const sub = (node.level2_with_links || []).find((item) => item.category.id === id)
    if (sub) return { node, sub }
  }
  return null
}

async function guestTree() {
  const response = await call('GET', '/api/data/getGuestData')
  return response.body?.data || []
}

async function adminTree(token) {
  const response = await call('POST', '/api/data/getData', { token })
  return response.body?.data || []
}

async function run() {
  await fs.promises.rm(persistDir, {
    recursive: true,
    force: true,
    maxRetries: 10,
    retryDelay: 200,
  })

  const child = spawn(
    process.execPath,
    [
      wranglerBin,
      'dev',
      '--local',
      '--port',
      String(PORT),
      '--persist-to',
      persistDir,
      '--var',
      `ADMIN_USER:${ADMIN_USER}`,
      '--var',
      `ADMIN_PASSWORD:${ADMIN_PASSWORD}`,
    ],
    {
      cwd: root,
      env: { ...process.env, WRANGLER_SEND_METRICS: 'false' },
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  )

  let serverLog = ''
  child.stdout.on('data', (chunk) => {
    serverLog += chunk
  })
  child.stderr.on('data', (chunk) => {
    serverLog += chunk
  })

  try {
    const ready = await waitForServer()
    if (!ready) {
      console.log('--- 服务未启动，wrangler 输出 ---')
      console.log(serverLog.slice(-3000))
      failures.push('服务未启动')
      return
    }
    console.log(
      `\n[持久化目录] ${
        fs.existsSync(persistDir) ? persistDir + '（已创建）' : '未创建，使用默认 .wrangler/state'
      }\n`
    )

    // ---------- 基础 ----------
    const health = await call('GET', '/api/health')
    check('GET /api/health', health.http === 200 && health.body?.status === 200, health.body)

    const preflight = await fetch(`${BASE}/api/health`, { method: 'OPTIONS' })
    check(
      'OPTIONS 预检返回 CORS 头',
      preflight.status === 200 && preflight.headers.get('access-control-allow-origin') === '*'
    )

    const missing = await call('GET', '/api/not-exist')
    check('未知路径 404', missing.http === 404)

    const noAuth = await call('POST', '/api/data/getData')
    check('未带令牌读取管理员数据 401', noAuth.http === 401, noAuth.body)

    const badLogin = await call('POST', '/api/user/login', {
      body: { username: ADMIN_USER, password: 'definitely-wrong' },
    })
    check('错误密码登录 403', badLogin.http === 403, badLogin.body)

    const login = await call('POST', '/api/user/login', {
      body: { username: ADMIN_USER, password: ADMIN_PASSWORD },
    })
    const token = login.body?.token
    check('管理员登录成功', login.http === 200 && typeof token === 'string', login.body)

    const guest0 = await call('GET', '/api/data/getGuestData')
    check(
      '游客数据接口可用',
      guest0.http === 200 &&
        Array.isArray(guest0.body?.data) &&
        typeof guest0.body?.version === 'number',
      { version: guest0.body?.version }
    )

    // ---------- 分类 / 链接 ----------
    const addFirst = await call('POST', '/api/data/addCategory', {
      token,
      body: { level: 1, categoryName: `测试分类-${Date.now()}`, icon: 'heroicons:inbox' },
    })
    const firstId = addFirst.body?.categoryId
    check('新增一级分类', addFirst.http === 200 && typeof firstId === 'number', addFirst.body)

    check(
      '新分类默认对访客显示',
      findFirst(await guestTree(), firstId)?.category_level_1.guest_visible === true
    )
    await call('POST', '/api/data/updateCategoryVisibility', {
      token,
      body: { categoryId: firstId, visible: false },
    })
    check('手动关闭后对访客隐藏', !findFirst(await guestTree(), firstId))
    check('管理员始终能看到隐藏分类', Boolean(findFirst(await adminTree(token), firstId)))
    const visibilityNoAuth = await call('POST', '/api/data/updateCategoryVisibility', {
      body: { categoryId: firstId, visible: true },
    })
    check('访客不能修改分类显示设置', visibilityNoAuth.http === 401)
    const invalidVisibility = await call('POST', '/api/data/updateCategoryVisibility', {
      token,
      body: { categoryId: firstId, visible: 'false' },
    })
    check('显示设置必须为布尔值', invalidVisibility.http === 400)
    const showFirst = await call('POST', '/api/data/updateCategoryVisibility', {
      token,
      body: { categoryId: firstId, visible: true },
    })
    check(
      '开启后访客可见',
      showFirst.http === 200 && Boolean(findFirst(await guestTree(), firstId))
    )

    const addSub = await call('POST', '/api/data/addCategory', {
      token,
      body: { level: 2, parentId: firstId, categoryName: '测试子分类' },
    })
    const subId = addSub.body?.categoryId
    check('新增二级分类', addSub.http === 200 && subId > firstId, addSub.body)

    const addLink = await call('POST', '/api/data/addLink', {
      token,
      body: { name: '测试站点', url: 'https://example.com', category_level_2: subId },
    })
    const linkId = addLink.body?.linkId
    check('新增链接', addLink.http === 200 && typeof linkId === 'number', addLink.body)

    const tree1 = await guestTree()
    const node1 = findFirst(tree1, firstId)
    const sub1 = findSub(tree1, subId)?.sub
    check(
      '游客可见新建分类与链接',
      node1?.category_level_1.name?.startsWith('测试分类') &&
        sub1?.links?.length === 1 &&
        sub1.links[0].created_at > 0,
      node1
    )

    const rename = await call('POST', '/api/data/updateCategroy', {
      token,
      body: { categoryId: subId, newName: '测试子分类-改', level: 2 },
    })
    check('二级分类改名（历史路由拼写）', rename.http === 200, rename.body)

    const updateLink = await call('POST', '/api/data/updateLink', {
      token,
      body: { id: linkId, title: '测试站点-改', url: 'https://example.com/v2' },
    })
    const afterUpdate = findSub(await guestTree(), subId)?.sub?.links?.[0]
    check(
      '更新链接标题与地址',
      updateLink.http === 200 &&
        afterUpdate?.name === '测试站点-改' &&
        afterUpdate?.url === 'https://example.com/v2',
      afterUpdate
    )

    const orderLink = await call('POST', '/api/data/updateLinkOrder', {
      token,
      body: { linkId, newSortOrder: 5 },
    })
    const orderCat = await call('POST', '/api/data/updateCategoryOrder', {
      token,
      body: { categoryId: firstId, newSortOrder: 9 },
    })
    const tree2 = await guestTree()
    const orderedLink = findSub(tree2, subId)?.sub?.links?.[0]
    check(
      '链接与一级分类排序',
      orderLink.http === 200 &&
        orderCat.http === 200 &&
        orderedLink?.sort_order === 5 &&
        findFirst(tree2, firstId)?.category_level_1.sort_order === 9,
      { sort: orderedLink?.sort_order, cat: findFirst(tree2, firstId)?.category_level_1.sort_order }
    )

    const notEncrypted = await call('POST', '/api/data/verifyCategoryPassword', {
      body: { categoryId: firstId, level: 1, password: 'whatever' },
    })
    check(
      '未加密分类直接返回内容',
      notEncrypted.http === 200 &&
        notEncrypted.body?.token === null &&
        notEncrypted.body.data.length === 1,
      notEncrypted.body
    )

    // ---------- 二级分类加密 ----------
    const lockSub = await call('POST', '/api/data/setCategoryPassword', {
      token,
      body: { categoryId: subId, level: 2, password: 'abcd1234' },
    })
    check('给二级分类设置密码', lockSub.http === 200, lockSub.body)

    const lockedSub = findSub(await guestTree(), subId)?.sub
    check(
      '游客看不到加密分类明文',
      lockedSub?.category?.is_locked === 1 && lockedSub.links.length === 0,
      lockedSub
    )
    check(
      '加密分类的链接字段已被剥离',
      lockedSub && !('enc' in lockedSub),
      Object.keys(lockedSub || {})
    )

    const shortPwd = await call('POST', '/api/data/setCategoryPassword', {
      token,
      body: { categoryId: subId, level: 2, password: 'ab', oldPassword: 'abcd1234' },
    })
    check('密码长度校验 400', shortPwd.http === 400, shortPwd.body)

    const wrongPwd = await call('POST', '/api/data/verifyCategoryPassword', {
      body: { categoryId: subId, level: 2, password: 'nope', tokens: [] },
    })
    check('错误密码解锁 403', wrongPwd.http === 403, wrongPwd.body)

    const okPwd = await call('POST', '/api/data/verifyCategoryPassword', {
      body: { categoryId: subId, level: 2, password: 'abcd1234', tokens: [] },
    })
    const unlockToken = okPwd.body?.token
    check(
      '正确密码解锁并返回明文',
      okPwd.http === 200 && okPwd.body?.data?.[0]?.name === '测试站点-改',
      okPwd.body
    )

    const contentByToken = await call('POST', '/api/data/getCategoryContent', {
      body: { categoryId: subId, token: unlockToken },
    })
    check('凭解锁令牌取回内容', contentByToken.body?.data?.length === 1, contentByToken.body)

    const badToken = await call('POST', '/api/data/getCategoryContent', {
      body: { categoryId: subId, token: 'a.b' },
    })
    check('无效解锁令牌 403', badToken.http === 403, badToken.body)

    const missingParam = await call('POST', '/api/data/getCategoryContent', { body: {} })
    check('缺参数 400', missingParam.http === 400, missingParam.body)

    const adminData = await call('POST', '/api/data/getData', { token })
    const adminSub = findSub(adminData.body?.data, subId)?.sub
    check(
      '管理员看到加密分类的明文',
      adminSub?.links?.length === 1,
      `链接数=${adminSub?.links?.length}`
    )
    check(
      '加密分类仍带 is_locked 标记',
      adminSub?.category?.is_locked === 1,
      `is_locked=${adminSub?.category?.is_locked}`
    )

    const addIntoLocked = await call('POST', '/api/data/addLink', {
      token,
      body: { name: '测试站点二', url: 'https://example.org', category_level_2: subId },
    })
    const guestAfterWrite = findSub(await guestTree(), subId)?.sub
    check(
      '写入加密分类后游客仍看不到明文',
      addIntoLocked.http === 200 &&
        guestAfterWrite?.category?.is_locked === 1 &&
        guestAfterWrite.links.length === 0,
      guestAfterWrite
    )

    const adminSub2 = findSub(await adminTree(token), subId)?.sub
    check(
      '管理员看到 2 条链接（密文回写正确）',
      adminSub2?.links?.length === 2,
      adminSub2?.links?.length
    )

    // ---------- 一级分类加密 ----------
    const lockFirst = await call('POST', '/api/data/setCategoryPassword', {
      token,
      body: { categoryId: firstId, level: 1, password: 'efgh5678' },
    })
    check('给一级分类设置密码（打包二级密文）', lockFirst.http === 200, lockFirst.body)

    const guestL1Node = findFirst(await guestTree(), firstId)
    check(
      '游客看不到一级分类内容',
      guestL1Node?.category_level_1?.is_locked === 1 &&
        guestL1Node?.level2_with_links?.length === 0,
      guestL1Node
    )

    const subWithoutParent = await call('POST', '/api/data/verifyCategoryPassword', {
      body: { categoryId: subId, level: 2, password: 'abcd1234', tokens: [] },
    })
    check(
      '未解锁上级时拒绝二级解锁',
      subWithoutParent.http === 403 && /上级/.test(subWithoutParent.body?.message || ''),
      subWithoutParent.body
    )

    const unlockFirst = await call('POST', '/api/data/verifyCategoryPassword', {
      body: { categoryId: firstId, level: 1, password: 'efgh5678' },
    })
    const firstUnlockToken = unlockFirst.body?.token
    check(
      '解锁一级分类',
      unlockFirst.http === 200 && unlockFirst.body?.data?.length === 1,
      unlockFirst.body
    )
    check(
      '一级明文里二级仍标记为加密',
      unlockFirst.body?.data?.[0]?.category?.is_locked === 1,
      unlockFirst.body?.data?.[0]?.category
    )

    const subWithParent = await call('POST', '/api/data/verifyCategoryPassword', {
      body: { categoryId: subId, level: 2, password: 'abcd1234', tokens: [firstUnlockToken] },
    })
    check(
      '带上级令牌解锁二级分类',
      subWithParent.http === 200 && subWithParent.body?.data?.length === 2,
      subWithParent.body
    )

    const l1Content = await call('POST', '/api/data/getCategoryContent', {
      body: { categoryId: firstId, token: firstUnlockToken },
    })
    check('凭一级令牌取回子分类列表', l1Content.body?.data?.length === 1, l1Content.body)

    const versionBeforeHide = (await call('GET', '/api/data/version')).body.version
    await call('POST', '/api/data/updateCategoryVisibility', {
      token,
      body: { categoryId: firstId, visible: false },
    })
    check('隐藏后访客列表移除整个分类', !findFirst(await guestTree(), firstId))
    check(
      '显示设置更新数据版本使缓存失效',
      (await call('GET', '/api/data/version')).body.version > versionBeforeHide
    )
    const hiddenAdmin = findFirst(await adminTree(token), firstId)
    check('隐藏不影响管理员读取加密内容', hiddenAdmin?.level2_with_links?.[0]?.links?.length === 2)
    for (const [level, id, password, savedToken] of [
      [1, firstId, 'efgh5678', firstUnlockToken],
      [2, subId, 'abcd1234', unlockToken],
    ]) {
      const unlockHidden = await call('POST', '/api/data/verifyCategoryPassword', {
        body: { categoryId: id, level, password, tokens: [firstUnlockToken] },
      })
      const restoreHidden = await call('POST', '/api/data/getCategoryContent', {
        body: { categoryId: id, token: savedToken },
      })
      check(
        `隐藏分类阻止${level}级密码及旧令牌读取`,
        unlockHidden.http === 404 && restoreHidden.http === 404
      )
    }
    await call('POST', '/api/data/updateCategoryVisibility', {
      token,
      body: { categoryId: firstId, visible: true },
    })
    const restoredVisible = await call('POST', '/api/data/getCategoryContent', {
      body: { categoryId: subId, token: unlockToken },
    })
    check('重新显示后加密内容完整保留', restoredVisible.body?.data?.length === 2)

    // ---------- 取消加密 ----------
    const wrongOld = await call('POST', '/api/data/setCategoryPassword', {
      token,
      body: { categoryId: subId, level: 2, password: '', oldPassword: 'bad' },
    })
    check('取消密码时校验旧密码 403', wrongOld.http === 403, wrongOld.body)

    const clearFirst = await call('POST', '/api/data/setCategoryPassword', {
      token,
      body: { categoryId: firstId, level: 1, password: '', oldPassword: 'efgh5678' },
    })
    const guestClearFirst = findFirst(await guestTree(), firstId)
    check(
      '取消一级密码后子分类恢复可见',
      clearFirst.http === 200 &&
        guestClearFirst?.category_level_1?.is_locked === 0 &&
        guestClearFirst?.level2_with_links?.length === 1,
      guestClearFirst
    )

    const clearSub = await call('POST', '/api/data/setCategoryPassword', {
      token,
      body: { categoryId: subId, level: 2, password: '', oldPassword: 'abcd1234' },
    })
    const guestClearAll = findSub(await guestTree(), subId)?.sub
    check(
      '取消二级密码后链接全部可见',
      clearSub.http === 200 && guestClearAll?.links?.length === 2,
      guestClearAll
    )

    // ---------- 回归：加密无关的一级分类不得清空他处二级分类的密文 ----------
    // 历史缺陷：给一级分类加密时会先回写一次二级密文，事务结束时又统一回写一次，
    // 第二次拿到的 links 已被清空，会把正确的密文覆盖成空内容。
    const relockSub = await call('POST', '/api/data/setCategoryPassword', {
      token,
      body: { categoryId: subId, level: 2, password: 'abcd1234' },
    })
    check('重新给二级分类设置密码', relockSub.http === 200, relockSub.body)

    const otherFirst = await call('POST', '/api/data/addCategory', {
      token,
      body: { categoryName: '无关分类', level: 1 },
    })
    const otherFirstId = otherFirst.body?.categoryId
    const lockOtherFirst = await call('POST', '/api/data/setCategoryPassword', {
      token,
      body: { categoryId: otherFirstId, level: 1, password: 'ijkl5678' },
    })
    check('给无关的一级分类设置密码', lockOtherFirst.http === 200, lockOtherFirst.body)

    const subAfterOther = await call('POST', '/api/data/verifyCategoryPassword', {
      body: { categoryId: subId, level: 2, password: 'abcd1234', tokens: [] },
    })
    check(
      '加密无关一级分类后，二级分类内容未丢失',
      subAfterOther.http === 200 && subAfterOther.body?.data?.length === 2,
      subAfterOther.body
    )

    // 清理：解锁无关分类，避免影响后续断言
    await call('POST', '/api/data/setCategoryPassword', {
      token,
      body: { categoryId: otherFirstId, level: 1, password: '', oldPassword: 'ijkl5678' },
    })
    await call('POST', '/api/data/deleteCategroy', {
      token,
      body: { categoryId: otherFirstId, level: 1 },
    })
    await call('POST', '/api/data/setCategoryPassword', {
      token,
      body: { categoryId: subId, level: 2, password: '', oldPassword: 'abcd1234' },
    })

    // ---------- 留言板 ----------
    const createMessage = await call('POST', '/api/data/createMessage', {
      body: { username: '访客A', qqNumber: '12345', text: '你好，这个站很好用' },
    })
    const messageId = createMessage.body?.data?.id
    check(
      '发表留言',
      createMessage.http === 200 &&
        Boolean(messageId) &&
        Boolean(createMessage.body?.data?.timestamp),
      createMessage.body
    )

    const messages = await call('GET', '/api/data/getMessages')
    const mine = (messages.body?.data || []).find((item) => item.id === messageId)
    check('读取留言', mine?.username === '访客A', mine)

    const deleteWrong = await call('POST', '/api/data/deleteMessage', {
      body: { messageId, qqNumber: '99999' },
    })
    check('非本人删除留言 403', deleteWrong.http === 403, deleteWrong.body)

    const deleteOwner = await call('POST', '/api/data/deleteMessage', {
      body: { messageId, qqNumber: '12345' },
    })
    const messagesAfter = await call('GET', '/api/data/getMessages')
    check(
      '本人删除留言成功',
      deleteOwner.http === 200 &&
        !(messagesAfter.body?.data || []).some((item) => item.id === messageId),
      deleteOwner.body
    )

    const deleteByAdmin = await call('POST', '/api/data/createMessage', {
      body: { username: '访客B', text: '待管理员删除' },
    })
    const adminDelete = await call('POST', '/api/data/deleteMessage', {
      body: { messageId: deleteByAdmin.body?.data?.id, token },
    })
    check('管理员凭令牌删除留言', adminDelete.http === 200, adminDelete.body)

    const logClick = await call('POST', '/api/data/logClick', { body: { linkId } })
    check('点击日志占位接口', logClick.http === 200, logClick.body)

    // ---------- 清理 ----------
    const removeLinks = await call('POST', '/api/data/deleteLink', { token, body: { id: linkId } })
    const afterRemove = findSub(await adminTree(token), subId)?.sub
    check(
      '删除链接',
      removeLinks.http === 200 && afterRemove?.links?.length === 1,
      afterRemove?.links?.length
    )

    const removeSub = await call('POST', '/api/data/deleteCategroy', {
      token,
      body: { categoryId: subId, level: 2 },
    })
    const removeFirst = await call('POST', '/api/data/deleteCategroy', {
      token,
      body: { categoryId: firstId, level: 1 },
    })
    const cleaned = await adminTree(token)
    check(
      '删除分类后节点消失',
      removeSub.http === 200 &&
        removeFirst.http === 200 &&
        !findFirst(cleaned, firstId) &&
        !findSub(cleaned, subId),
      { sub: removeSub.http, first: removeFirst.http }
    )
  } finally {
    stopChild(child)
  }
}

run()
  .catch((error) => {
    console.error('验证脚本异常:', error)
    failures.push('脚本异常')
  })
  .finally(async () => {
    await fs.promises.rm(persistDir, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 200,
    })
    console.log('\n===== 结果 =====')
    console.log(`通过 ${passed} 项，失败 ${failures.length} 项`)
    if (failures.length) {
      console.log('失败项：' + failures.join(' | '))
      process.exitCode = 1
    }
  })
