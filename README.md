# 云深书签

## 📖 项目介绍

云深书签是一个极简风格的书签管理网站，专注于收集各类实用的网站资源。无论是工作、学习还是娱乐，这里都能找到相应的优秀网站，方便用户快速访问所需链接。同时，网站还提供简易的数据管理功能，帮助用户更加高效地管理自己的书签数据。

- **官方网站**: https://nav.yecss.com
- **GitHub 仓库**: https://github.com/yecss/yunshenNav
- **作者**: yecss
- **前端技术栈**：Vue 3 + Vite + Element Plus + Tailwind CSS + Sass + Axios + Iconify
- **后端技术栈**：Cloudflare Workers + KV（WebCrypto AES-256-GCM 实现分类加密）

## ✨ 核心功能

- [x] **分层书签管理** - 一级 / 二级分类，结构清晰
- [x] **书签增删改** - 管理员登录后可维护分类与链接，支持右键快捷编辑
- [x] **分类加密** - 分类可单独设置访问密码，内容以 AES-256-GCM 加密存储，访客需输入密码解锁
- [x] **最新添加** - 按添加时间倒序浏览全站新增书签
- [x] **智能搜索** - 站内筛选 + 多搜索引擎切换
- [x] **留言板** - 访客可留言，本人凭 QQ 号或管理员凭令牌删除
- [x] **响应式设计** - 移动端自动收起侧边栏，改为抽屉入口
- [x] **本地缓存** - 缓存按数据版本号自动失效，减少重复请求

## 🎯 解决的痛点

1. **浏览器书签杂乱** - 结构化管理，告别杂乱无章
2. **数据同步问题** - 云端存储，多设备访问
3. **管理效率低** - 快速编辑，高效管理
4. **分类不清晰** - 多级分类，层次分明

## 📸 界面预览

灵感来源：‘闪击工作台’

### 电脑端

![](https://cdn.jsdelivr.net/gh/yecss/imageStore//picgo/7e81b9cf-aee7-446c-97b0-6a197749b621.png)

### 手机端

![](https://cdn.jsdelivr.net/gh/yecss/imageStore//picgo/Group%201.png)

## 📁 项目结构

```
src/
├── api/            请求层：axios 实例 + 按业务域拆分的接口
│   └── modules/    auth / bookmark / category / categoryLock / message
├── constants/      常量、搜索引擎配置
├── services/       写操作编排：调接口 → 改本地树 → 清缓存
├── stores/         基于 reactive 的轻量状态：session / categoryLock / bookmark
├── composables/    跨组件复用的组合逻辑：弹窗开关、解锁目标、留言板数据
├── utils/          纯函数工具：storage / date / url / category / confirm / greeting
├── views/
│   ├── bookmarks/  书签页（BookmarkView + components/ 下的功能组件 + manage/ 管理卡片）
│   ├── auth/       登录页
│   └── message/    留言页（MessageBoardView + components/ 表单、条目、分页）
├── components/     全局通用组件
├── layouts/        布局
└── styles/         全局样式

worker/
├── core/           HTTP 响应、路由分发、令牌、AES-GCM 加解密
├── store/          KV 读写、分类树加解密、写事务封装
├── handlers/       接口实现：system / auth / data / category / link / lock / message
├── routes.js       路由表（前后端 URL 契约的唯一来源）
└── index.js        Worker 入口

scripts/
└── verify-worker.cjs   Worker 端到端验证（含加密往返）
```

### 分层约定

| 层 | 职责 | 不要做的事 |
| --- | --- | --- |
| `views/` | 页面编排与表单交互 | 不直接拼接口参数、不直接改 `state` 里的树 |
| `services/` | 一次写操作 = 接口 + 本地更新 + 缓存失效 | 不处理 UI 提示 |
| `stores/` | 只维护内存中的分类树与派生数据 | 不发请求 |
| `api/` | 只做 HTTP 出入参映射 | 不碰业务状态 |
| `composables/` | 可复用的组件逻辑（弹窗、分页等） | 不持有全局单例状态 |

## 🚀 快速开始

### 环境要求

- Node.js >= 20.0.0
- npm 或 yarn

### 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 启动前端（默认 http://localhost:8080/）
npm run serve

# 3. 另开一个终端启动后端（默认 http://127.0.0.1:8787）
npm run worker:dev
```

本地联调时在 `.env.local` 中指向本地 Worker，无需改动源码：

```bash
VITE_API_BASE_URL=http://127.0.0.1:8787/api
```

不配置时使用线上接口 `https://api.navapi.de5.net/api`。

### 后端环境变量

在项目根目录新建 `.dev.vars`（本地）或在 Cloudflare 后台配置同名变量：

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `ADMIN_USER` | 是 | 管理员账号 |
| `ADMIN_PASSWORD` | 是 | 管理员密码，未配置时一律拒绝登录 |
| `JWT_SECRET` | 否 | 令牌签名密钥，缺省使用内置兜底值 |
| `ENC_SECRET` | 否 | 分类加密主密钥，缺省时自动生成并存入 KV |

> ⚠️ `ENC_SECRET` 一旦更换，历史密文将无法解密，务必妥善保管。

## 🧪 校验

```bash
npm run lint         # ESLint：src + worker
npm run build        # 前端构建
npm run test:worker  # Worker 端到端验证（自动起本地 dev，含加密往返）
```

## ☁️ 部署

```bash
# 前端：构建并发布到 gh-pages
npm run deploy

# 后端：发布 Worker
npm run worker:deploy

# 首次部署时写入密钥
npx wrangler secret put JWT_SECRET
npx wrangler secret put ENC_SECRET
```

KV 绑定名为 `YUNSHEN_DATA`，全部数据保存在单个 `data` 键中，写入时整体覆盖并推进 `version`。

## 🔌 接口约定

- 统一响应体：`{ status, message, data? }`，`status` 与 HTTP 状态码一致
- 需要鉴权的接口通过 `Authorization: <token>` 携带登录令牌
- 路由清单集中在 `worker/routes.js`；其中 `deleteCategroy` / `updateCategroy` 为线上既有拼写，**请勿修正**

## 📥 联系方式

- **邮箱**: yecssnetwork@gmail.com

## 🙏 鸣谢

- 感谢 '闪击工作台' 提供的灵感
- 感谢 Vue.js 团队提供优秀的前端框架
- 感谢 Element Plus 团队提供 UI 组件库
- 感谢 不断坚持的自己

## 📅 更新日志

### V3.1.2 (2026-10-29)

- 一级分类新增“访客可见”开关，默认显示，管理员始终能查看全部分类；隐藏后同时限制访客读取和解锁
- 优化登录页布局、侧边栏入口顺序与滚动条，二级分类标题统一为蓝色
- 修复站内搜索右侧背景空隙，搜索输入框自适应剩余宽度
- 页面加载和手动刷新提示实际数据来源，提示显示 1 秒

### V3.1.1 (2026-10-29)

- Vue 层收口：`views/bookmarks/index.vue` 更名 `BookmarkView.vue`，路由同步
- 拆分超大组件：`ManageDrawer`（444 行）拆为壳 + 三张管理卡片；`MessageBoardView`（382 行）拆为表单 / 条目 / 分页
- 新增 `services/` 层，把「调接口 + 改本地树 + 清缓存」从组件里抽出来，组件只留校验与提示
- 新增 `composables/`：`useDialogModel` 统一五个弹窗的开关与重置，`useUnlockDialog` 统一解锁目标
- 「分类是否被遮挡」下沉到 `categoryLock.isCategoryMasked`，主面板与链接分组不再各写一份
- 移除 `#container` 全局 id 与 `#app { text-align: center }`，各组件不再写 `text-align: left` 去抵消
- `el-button` 图标改为组件引用，去掉 `@element-plus/icons-vue` 的全局注册；搜索引擎图标改静态导入

### V3.1.0 (2026-10-28)

- 全量重构：统一文件与函数命名，按职责拆分目录
- 前端移除 Vuex，改为轻量 reactive store；页面拆分为独立组件
- 请求层收敛为单一 axios 实例，统一错误提示与 401 处理
- 后端 `worker.js` 拆分为 `worker/` 模块，新增路由表与写事务封装
- 新增 ESLint（覆盖 worker）与 Worker 端到端验证脚本

### V3.0.0 (2023-11-03)

- 全新 V3 版本重构
- 优化用户体验
- 增强性能表现

### V2.1.0 (2024-10-29)

- 新增无后端版本
- 优化部署流程
- 修复已知问题

### V2.0.0 (2023-11-05)

- 完善 README 文档
- 优化界面设计
- 增强功能特性
