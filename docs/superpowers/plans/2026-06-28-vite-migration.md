# Vite 迁移实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 yunshenNav 前端构建工具从 Vue CLI 5 (webpack) 迁移至 Vite，保持功能与部署方式完全等价。

**Architecture:** 用 `vite` + `@vitejs/plugin-vue` 替换 `@vue/cli-service`，`unplugin-*/vite` 替换 `unplugin-*/webpack`，`index.html` 从 `public/` 移到根目录并注入模块脚本。仅 2 处源码适配（环境变量、动态图片），其余业务代码零改动。

**Tech Stack:** Vite、@vitejs/plugin-vue、Vue 3、element-plus、tailwindcss、vuex、vue-router、gh-pages

**Spec:** [docs/superpowers/specs/2026-06-28-vite-migration-design.md](../specs/2026-06-28-vite-migration-design.md)

---

## 文件结构

| 文件 | 操作 | 责任 |
|------|------|------|
| `vite.config.js` | 新建 | Vite 配置：base、alias、element-plus 自动导入 |
| `index.html` | 新建（由 public/index.html 迁移） | 入口 HTML，注入模块脚本 |
| `public/index.html` | 删除 | 迁移后移除原文件 |
| `vue.config.js` | 删除 | Vue CLI 配置，不再需要 |
| `babel.config.js` | 删除 | babel 配置，Vite 用 esbuild |
| `package.json` | 修改 | 依赖增删、scripts 调整 |
| `.eslintrc.js` | 修改 | 移除 @babel/eslint-parser |
| `src/router/index.js` | 修改 | `process.env.BASE_URL` → `import.meta.env.BASE_URL` |
| `src/views/app/Search.vue` | 修改 | `require()` → `import.meta.url` 方式 |

---

### Task 1: 创建 Vite 配置文件

**Files:**
- Create: `vite.config.js`

- [ ] **Step 1: 创建 `vite.config.js`**

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: '/yunshenNav/',
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 8080,
  },
})
```

- [ ] **Step 2: 确认文件创建成功**

Run: `git -C "e:\webapp\yunshenNav" status vite.config.js`
Expected: 显示 `?? vite.config.js`（未跟踪）

---

### Task 2: 迁移 index.html 到根目录

**Files:**
- Create: `index.html`（根目录）
- Delete: `public/index.html`

- [ ] **Step 1: 在根目录创建 `index.html`**

内容来自 `public/index.html`，保留所有 meta、title、sessionStorage redirect 脚本、51.la 统计脚本，但在 `<div id="app">` 后注入模块脚本：

```html
<!doctype html>
<html lang="zh-CN" itemscope itemtype="http://schema.org/WebSite">
<head>
<meta charset="utf-8"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>

<meta name="description" content="云深书签 - 免费在线书签管理工具，提供高效的多级分类网址导航服务，帮助用户快速整理与访问常用网站。"/>
<meta name="keywords" content="云深书签,网址导航,书签管理工具,多级分类书签,快速书签,Yecss,在线书签"/>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "云深书签",
  "url": "https:/nav.yecss.com/",
  "description": "云深书签 - 免费在线书签管理工具"
}
</script>

<title>云深书签 - 极简风网址导航</title>

</head>

<body>
<div id="app"></div>
<noscript>
<strong>We're sorry but yunshen doesn't work properly without JavaScript enabled.</strong>
</noscript>

<script>
;(function () {
const redirect = sessionStorage.redirect
delete sessionStorage.redirect
if (redirect && redirect !== location.href) {
history.replaceState(null, null, redirect)
}
})()
</script>

<script type="module" src="/src/main.js"></script>

<script charset="UTF-8" id="LA_COLLECT" src="//sdk.51.la/js-sdk-pro.min.js"></script>
<script>LA.init({id:"3P7Y1rZ5jqCpqHof",ck:"3P7Y1rZ5jqCpqHof",autoTrack:true,hashMode:true,screenRecord:true})</script>

</body>
</html>
```

- [ ] **Step 2: 删除 `public/index.html`**

Run: `git -C "e:\webapp\yunshenNav" rm public/index.html`

- [ ] **Step 3: 确认状态**

Run: `git -C "e:\webapp\yunshenNav" status`
Expected: 显示 `index.html` 为新文件，`public/index.html` 为删除

---

### Task 3: 删除 Vue CLI 与 babel 配置文件

**Files:**
- Delete: `vue.config.js`
- Delete: `babel.config.js`

- [ ] **Step 1: 删除文件**

Run: `git -C "e:\webapp\yunshenNav" rm vue.config.js babel.config.js`

- [ ] **Step 2: 确认删除**

Run: `git -C "e:\webapp\yunshenNav" status`
Expected: 两个文件显示为 deleted

---

### Task 4: 更新 package.json 依赖与脚本

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 修改 scripts**

把 `serve`/`build`/`lint` 改为 Vite 命令，其余脚本不变。原内容：

```json
"scripts": {
  "serve": "vue-cli-service serve",
  "build": "vue-cli-service build",
  "lint": "vue-cli-service lint",
  "deploy": "npm run build && gh-pages -d dist",
  "worker:dev": "wrangler dev",
  "worker:deploy": "wrangler deploy"
},
```

改为：

```json
"scripts": {
  "serve": "vite",
  "build": "vite build",
  "lint": "eslint src",
  "deploy": "npm run build && gh-pages -d dist",
  "worker:dev": "wrangler dev",
  "worker:deploy": "wrangler deploy"
},
```

- [ ] **Step 2: 从 dependencies 移除 core-js**

原 dependencies：

```json
"dependencies": {
  "@element-plus/icons-vue": "^2.1.0",
  "axios": "^1.6.0",
  "core-js": "^3.8.3",
  "element-plus": "2.1.4",
  "vue": "^3.2.13",
  "vue-router": "^4.0.3",
  "vuex": "^4.0.0"
},
```

改为：

```json
"dependencies": {
  "@element-plus/icons-vue": "^2.1.0",
  "axios": "^1.6.0",
  "element-plus": "2.1.4",
  "vue": "^3.2.13",
  "vue-router": "^4.0.3",
  "vuex": "^4.0.0"
},
```

- [ ] **Step 3: 从 devDependencies 移除 Vue CLI/babel/sass-loader/iconify，新增 vite**

原 devDependencies：

```json
"devDependencies": {
  "@babel/core": "^7.12.16",
  "@babel/eslint-parser": "^7.12.16",
  "@iconify/vue": "^4.1.1",
  "@vue/cli-plugin-babel": "~5.0.0",
  "@vue/cli-plugin-eslint": "~5.0.0",
  "@vue/cli-plugin-router": "~5.0.0",
  "@vue/cli-plugin-vuex": "~5.0.0",
  "@vue/cli-service": "~5.0.0",
  "autoprefixer": "^10.4.16",
  "eslint": "^7.32.0",
  "eslint-config-prettier": "^8.3.0",
  "eslint-plugin-prettier": "^4.0.0",
  "eslint-plugin-vue": "^8.0.3",
  "gh-pages": "^6.3.0",
  "postcss": "^8.4.31",
  "prettier": "^2.4.1",
  "sass": "^1.32.7",
  "sass-loader": "^12.0.0",
  "tailwindcss": "^3.3.5",
  "unplugin-auto-import": "^0.16.6",
  "unplugin-vue-components": "^0.25.2",
  "wrangler": "^4.105.0"
}
```

改为：

```json
"devDependencies": {
  "@vitejs/plugin-vue": "^5.0.0",
  "autoprefixer": "^10.4.16",
  "eslint": "^7.32.0",
  "eslint-config-prettier": "^8.3.0",
  "eslint-plugin-prettier": "^4.0.0",
  "eslint-plugin-vue": "^8.0.3",
  "gh-pages": "^6.3.0",
  "postcss": "^8.4.31",
  "prettier": "^2.4.1",
  "sass": "^1.32.7",
  "tailwindcss": "^3.3.5",
  "unplugin-auto-import": "^0.16.6",
  "unplugin-vue-components": "^0.25.2",
  "vite": "^5.0.0",
  "wrangler": "^4.105.0"
}
```

- [ ] **Step 4: 删除 lock 文件以便重新安装**

Run: `git -C "e:\webapp\yunshenNav" rm package-lock.json yarn.lock`

（迁移构建工具后依赖树变化大，lock 文件需重建。下一步会重新安装。）

> 注意：此步会丢弃 lock 文件，但源码尚未改动，风险可控。

---

### Task 5: 更新 .eslintrc.js 移除 babel 解析器

**Files:**
- Modify: `.eslintrc.js`

- [ ] **Step 1: 移除 `parserOptions` 中的 babel 解析器**

原内容：

```js
module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    "plugin:vue/vue3-essential",
    "eslint:recommended",
    "plugin:prettier/recommended",
  ],
  parserOptions: {
    parser: "@babel/eslint-parser",
  },
  rules: {
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
  },
};
```

改为（删除 `parserOptions` 整段）：

```js
module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    "plugin:vue/vue3-essential",
    "eslint:recommended",
    "plugin:prettier/recommended",
  ],
  rules: {
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
  },
};
```

---

### Task 6: 修改路由环境变量引用

**Files:**
- Modify: `src/router/index.js:36`

- [ ] **Step 1: 修改 `process.env.BASE_URL` 为 `import.meta.env.BASE_URL`**

原第 36 行：

```js
  history: createWebHistory(process.env.BASE_URL),
```

改为：

```js
  history: createWebHistory(import.meta.env.BASE_URL),
```

---

### Task 7: 修改 Search.vue 动态图片引用

**Files:**
- Modify: `src/views/app/Search.vue`

`Search.vue` 是 Options API（非 `<script setup>`），需要在 `methods` 中新增方法，并在模板中调用。

- [ ] **Step 1: 修改模板中的 `require()`**

原第 5 行：

```html
<img class="current-img" :src="require('../../assets/search-icon/'+currentIocn[INDEX])" alt="" />
```

改为：

```html
<img class="current-img" :src="getIcon(currentIocn[INDEX])" alt="" />
```

- [ ] **Step 2: 在 `methods` 中新增 `getIcon` 方法**

在 `methods` 块内（`autoFocus` 方法之前或之后均可）新增：

```js
    getIcon(name) {
      return new URL(`../../assets/search-icon/${name}`, import.meta.url).href
    },
```

完整 `methods` 块应为：

```js
  methods: {
    getIcon(name) {
      return new URL(`../../assets/search-icon/${name}`, import.meta.url).href
    },
    autoFocus() {
      this.$refs.Input.focus();
    },
    // 按下回车搜索函数
    getBaidu() {
      if(this.inpValue){
        window.open(
        `${this.searchEngine[this.INDEX]}${this.inpValue}`,
        "_blank"
      );
      }
    },
    showSearchSelect(){
      this.hiddenBlock = !this.hiddenBlock;
    },
    getIndex(e){
      this.INDEX = e.currentTarget.getAttribute("data-index");
    }
  },
```

- [ ] **Step 3: 确认模板中其它静态图片引用不受影响**

`Search.vue` 模板第 53/58/62/66/70 行有 `src="../../assets/search-icon/xxx.svg"` 静态引用，这些在 Vite 中会被自动处理为 URL 字符串，无需修改。

---

### Task 8: 安装依赖

**Files:** 无（仅命令）

- [ ] **Step 1: 安装新依赖**

Run: `npm install` （在 `e:\webapp\yunshenNav` 目录下）

Expected: 安装完成，生成新的 `package-lock.json`。可能有 peer 警告，只要无 error 即可。

- [ ] **Step 2: 确认 vite 可用**

Run: `npx vite --version`
Expected: 显示 vite 版本号（如 `5.x.x`）

---

### Task 9: 本地启动验证

**Files:** 无（仅命令与浏览器验证）

- [ ] **Step 1: 启动开发服务器**

Run: `npm run serve`（在 `e:\webapp\yunshenNav` 目录下，非阻塞执行）
Expected: 控制台显示 `Local: http://localhost:8080/yunshenNav/`

- [ ] **Step 2: 浏览器访问验证**

打开浏览器访问 `http://localhost:8080/yunshenNav/`，逐项验证：

- 首页加载、背景图渲染、问候语提示
- 顶部搜索框图标显示（验证 `getIcon` 生效）
- 搜索引擎切换下拉框、各图标显示
- 侧边栏一级分类、二级分类、链接渲染
- 点击登录页路由跳转
- 留言板页路由跳转
- 抽屉/弹窗层级正常（`append-to-body` 仍生效）
- element-plus 组件样式正常（按钮、消息提示等）
- tailwindcss 样式生效（响应式断点）

- [ ] **Step 3: 如有问题修复，无问题则停止开发服务器**

如所有验证通过，用 StopCommand 停止开发服务器。

---

### Task 10: 生产构建验证

**Files:** 无（仅命令）

- [ ] **Step 1: 执行生产构建**

Run: `npm run build`
Expected: 构建成功，产物在 `dist/` 目录

- [ ] **Step 2: 检查产物结构**

Run: `ls dist`
Expected: 包含 `index.html`、`assets/` 目录

- [ ] **Step 3: 检查 index.html 资源前缀**

Run: 打开 `dist/index.html` 检查
Expected: 资源引用路径以 `/yunshenNav/` 开头（如 `/yunshenNav/assets/index-xxxx.js`）

---

### Task 11: 提交迁移

**Files:** 全部变更

- [ ] **Step 1: 暂存所有变更**

Run: `git -C "e:\webapp\yunshenNav" add -A`

- [ ] **Step 2: 检查暂存状态**

Run: `git -C "e:\webapp\yunshenNav" status`
Expected: 显示所有新增/修改/删除文件已暂存

- [ ] **Step 3: 提交**

```bash
git -C "e:\webapp\yunshenNav" commit -m "build: 迁移构建工具至 Vite

- 用 vite + @vitejs/plugin-vue 替换 @vue/cli-service
- index.html 从 public/ 迁移到根目录，注入模块脚本
- unplugin-auto-import/unplugin-vue-components 切换到 vite 入口
- router 的 process.env.BASE_URL 改为 import.meta.env.BASE_URL
- Search.vue 的 require() 改为 new URL(..., import.meta.url).href
- 移除 @vue/cli-*、@babel/*、core-js、sass-loader、@iconify/vue
- .eslintrc.js 移除 @babel/eslint-parser
- 删除 vue.config.js、babel.config.js"
```

- [ ] **Step 4: 确认提交成功**

Run: `git -C "e:\webapp\yunshenNav" log --oneline -3`
Expected: 显示最新提交在顶部

---

## 自审检查

**Spec 覆盖：**
- ✅ 第 2 节配置映射 → Task 1（vite.config.js）、Task 4（package.json）
- ✅ 第 3 节依赖变更 → Task 4
- ✅ 第 4.1 节 router 修改 → Task 6
- ✅ 第 4.2 节 Search.vue 修改 → Task 7
- ✅ 第 5 节删除文件 → Task 2（public/index.html）、Task 3（vue.config.js、babel.config.js）
- ✅ 第 6 节新增文件 → Task 1、Task 2（根 index.html）、Task 5（.eslintrc.js）
- ✅ 第 8 节边界情况 → 已在对应 Task 中处理
- ✅ 第 9 节验证方式 → Task 9、Task 10
- ✅ 第 10 节回滚 → Task 11 的 commit 天然支持回滚

**Placeholder 扫描：** 无 TBD/TODO，所有步骤含完整代码或命令。

**类型一致性：** `getIcon` 方法名在 Task 7 的模板与 methods 中一致。`import.meta.env.BASE_URL` 在 Task 6 与 spec 一致。
