# Vite 迁移设计文档

- **日期**：2026-06-28
- **主题**：将 yunshenNav 前端构建工具从 Vue CLI 5 (webpack) 迁移至 Vite
- **范围**：仅构建工具迁移，不升级业务依赖（Vue / element-plus / vuex 版本保持不变）

## 1. 背景与目标

当前项目基于 `@vue/cli-service` 5.x（webpack 5）构建，使用 element-plus 自动导入、tailwindcss、sass、vuex/vue-router，通过 `gh-pages` 部署到 GitHub Pages 的 `/yunshenNav/` 子路径。

**目标**：将构建工具切换为 Vite，保持功能与部署方式完全等价，提升开发服务器启动与 HMR 速度，简化依赖树。

**非目标**：
- 不升级 Vue / element-plus / vuex 等业务依赖版本
- 不引入 pinia、TypeScript、Vitest 等新工具
- 不改动业务组件逻辑（仅 2 处环境适配修改）
- 不改动 `worker.js` / `wrangler.toml` / 后端

## 2. 架构与配置映射

| 项 | Vue CLI (现状) | Vite (目标) |
|----|---------------|-------------|
| 构建工具 | `@vue/cli-service` (webpack 5) | `vite` + `@vitejs/plugin-vue` |
| 配置文件 | `vue.config.js` | `vite.config.js` |
| 入口 HTML | `public/index.html` | 根目录 `index.html`（移动） |
| 入口脚本 | HTML 注入 | `index.html` 中 `<script type="module" src="/src/main.js">` |
| base 路径 | `publicPath: '/yunshenNav/'` | `base: '/yunshenNav/'` |
| `@/` 别名 | vue-cli 内置 | `vite.config.js` 的 `resolve.alias` |
| element-plus 自动导入 | `unplugin-*/webpack` | `unplugin-*/vite` |
| 环境变量 | `process.env.BASE_URL` | `import.meta.env.BASE_URL` |
| 动态图片 | `require('../../assets/...')` | `new URL('../../assets/...', import.meta.url).href` |
| postcss/tailwind | `postcss.config.js` | 不变（Vite 自动读取） |
| sass | `sass-loader` | Vite 内置（保留 `sass` 依赖） |
| ESLint 解析器 | `@babel/eslint-parser` | 默认 espree（移除 babel 依赖） |
| babel/core-js | 需要 | 移除（Vite 用 esbuild） |
| 部署 | `gh-pages -d dist` | 不变 |

## 3. 依赖变更

### 移除
- `@vue/cli-plugin-babel`、`@vue/cli-plugin-eslint`、`@vue/cli-plugin-router`、`@vue/cli-plugin-vuex`、`@vue/cli-service`
- `@babel/core`、`@babel/eslint-parser`
- `core-js`
- `sass-loader`
- `@iconify/vue`（源码未引用，属遗留依赖）

### 新增
- `vite`
- `@vitejs/plugin-vue`

### 保留（不动）
- 运行时：`vue`、`vue-router`、`vuex`、`element-plus`、`@element-plus/icons-vue`、`axios`
- 构建/样式：`tailwindcss`、`autoprefixer`、`postcss`、`sass`、`unplugin-auto-import`、`unplugin-vue-components`
- 代码规范：`eslint`、`eslint-config-prettier`、`eslint-plugin-prettier`、`eslint-plugin-vue`、`prettier`
- 部署/后端：`gh-pages`、`wrangler`

### scripts 变更
| 原脚本 | 新脚本 |
|--------|--------|
| `vue-cli-service serve` | `vite` |
| `vue-cli-service build` | `vite build` |
| `vue-cli-service lint` | `eslint src` |
| `npm run build && gh-pages -d dist` | 不变 |
| `wrangler dev` / `wrangler deploy` | 不变 |

## 4. 需要修改的源码（仅 2 处）

### 4.1 `src/router/index.js`
```js
// 原
history: createWebHistory(process.env.BASE_URL),
// 新
history: createWebHistory(import.meta.env.BASE_URL),
```

### 4.2 `src/views/app/Search.vue`
```js
// 原
<img class="current-img" :src="require('../../assets/search-icon/'+currentIocn[INDEX])" alt="" />
// 新
<img class="current-img" :src="getIcon(currentIocn[INDEX])" alt="" />
```
配套在 `<script setup>` 中增加：
```js
const getIcon = (name) => new URL(`../../assets/search-icon/${name}`, import.meta.url).href
```
前提：`currentIocn` 数组项为纯文件名字符串（已确认）。

## 5. 删除的文件
- `vue.config.js`
- `babel.config.js`
- `public/index.html`（移动到根目录后删除原文件）

## 6. 新增/改写的文件
- `vite.config.js`（新建）
- `index.html`（根目录，由 `public/index.html` 迁移并注入模块脚本）
- `.eslintrc.js`（移除 `@babel/eslint-parser` 配置）
- `package.json`（依赖与 scripts 调整）
- `src/router/index.js`、`src/views/app/Search.vue`（见第 4 节）

## 7. 不改动的部分
- 所有 `.vue` 业务组件（除 Search.vue 一行外）
- `worker.js`、`wrangler.toml`、`.dev.vars`
- `src/api/*`、`src/store/*`、`src/request/*`
- `tailwind.config.js`、`postcss.config.js`（Vite 自动读取）
- `jsconfig.json`（`@/*` 路径映射仍有效）
- `.gitignore`、`README.md`

## 8. 边界情况与风险

1. **`index.html` 迁移**：保留 sessionStorage redirect 逻辑与 51.la 统计脚本，仅注入 `<script type="module">`。Vite 要求 `index.html` 在根目录。
2. **`base` 语义一致**：`base: '/yunshenNav/'` 下 `import.meta.env.BASE_URL` 自动等于 `/yunshenNav/`，路由行为不变。
3. **`require()` 动态图片**：`new URL(..., import.meta.url).href` 为标准等价写法，已确认 `currentIocn` 项为纯文件名。
4. **element-plus 自动导入**：`unplugin-*/vite` 入口 API 与 `/webpack` 一致，配置直接平移。
5. **ESLint 解析器**：移除 `@babel/eslint-parser` 后用默认 espree，`vue3-essential` 规则不变。
6. **部署验证**：`gh-pages -d dist` 不变，需本地 `build` 后确认 `dist/index.html` 资源前缀为 `/yunshenNav/`。
7. **`@iconify/vue`**：grep 源码未发现引用，确认移除。若仍在用需保留。

## 9. 验证方式

迁移完成后：
1. `npm install` 安装新依赖
2. `npm run serve` 本地启动，验证：
   - 首页加载、路由跳转
   - 登录、分类排序、增删改链接
   - 留言板
   - 抽屉/弹窗层级、图标渲染
3. `npm run build` 检查 `dist/` 产物结构与资源前缀
4. （可选）`npm run deploy` 验证 gh-pages 部署

## 10. 回滚方案

迁移前通过 git 分支隔离（如 `feature/vite-migration`）。若出现问题，回退到主分支即可，无数据/配置损失。`vue.config.js`、`babel.config.js` 在迁移 commit 中删除，回滚 commit 即可恢复。
