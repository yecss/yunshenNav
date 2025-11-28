# 云深书签

## 📖 项目介绍

云深书签是一个极简风格的书签管理网站，专注于收集各类实用的网站资源。无论是工作、学习还是娱乐，这里都能找到相应的优秀网站，方便用户快速访问所需链接。同时，网站还提供简易的数据管理功能，帮助用户更加高效地管理自己的书签数据。

- **官方网站**: https://nav.yecss.com
- **GitHub 仓库**: https://github.com/yecss/yunshenNav
- **作者**: yecss
- **技术栈**: Vue3 + ElementPlus + TailwindCSS + Node.js + MySQL

## ✨ 核心功能

- [x] **用户系统** - 登录注册，每个用户的数据互相独立
- [x] **游客模式** - 支持游客登录，无需注册即可体验
- [x] **响应式设计** - 移动端适配，多设备支持
- [x] **智能搜索** - 快速定位所需书签
- [x] **分层管理** - 多层级数据展示，结构清晰
- [x] **快捷操作** - 支持右键快速修改标题和网址
- [x] **灵活编辑** - 支持添加、自定义链接项目
- [x] **分类管理** - 支持添加、修改、删除一级标题，二级标题

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



## 🛠️ 技术架构

### 前端技术栈

- **框架**: Vue 3
- **UI 库**: Element Plus
- **样式**: TailwindCSS

### 后端技术栈

- **运行环境**: Node.js
- **Web 框架**: Express
- **数据库**: MySQL
- **API 设计**: RESTful API

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- MySQL >= 8.0
- npm 或 yarn

### 本地开发

#### 1. 克隆项目

```bash
git clone https://github.com/yecss/yunshenNav.git
cd yunshenNav
```

#### 2. 安装前端依赖

```bash
# 进入前端目录
cd frontend
npm install
```

#### 3. 启动后端

**yunshenBackend**：待

#### 4. 配置数据库

```bash
# 打开后端目录db/index.js
# 配置mysql
const db = mysql.createPool({
  host: "",
  port:3306,
  user: "",
  password: "",
  database: "",
});
```

#### 5. 初始化数据库

```sql
-- 创建数据库
CREATE DATABASE yunshen_nav;

-- 执行数据库初始化脚本
source database/init.sql;
```

#### 6. 启动服务

```bash
# 启动后端服务
npm run serve

# 启动前端服务
npm run serve
```

#### 7. 管理员登录

打开前端，点击管理登录

账号：admin

密码：admin

## 📞 联系方式

- **邮箱**: yecssnetwork@gmail.com
- **项目地址**: https://github.com/yecss/yunshenNav
- **官网**: https://nav.yecss.com

## 🙏 鸣谢

- 感谢 '闪击工作台' 提供的灵感
- 感谢 Vue.js 团队提供优秀的前端框架
- 感谢 Element Plus 团队提供 UI 组件库
- 感谢 不断坚持的自己

## 📅 更新日志

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