# 🍊 水果小程序 (Fruit Mini Program)

> 基于微信小程序 + 云开发的完整水果电商解决方案

[![Platform](https://img.shields.io/badge/platform-WeChat%20Mini%20Program-blue)](https://developers.weixin.qq.com/)
[![Framework](https://img.shields.io/badge/framework-Taro-brightgreen)](https://taro.jd.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Cloud](https://img.shields.io/badge/cloud-Tencent%20CloudDB-orange)](https://cloud.tencent.com/)

## 📖 项目简介

这是一个功能完整的水果电商小程序，采用微信小程序 + 云开发模式，无需自建服务器即可快速上线。系统支持商家端商品管理、分类管理、团队协作，以及用户端商品浏览、分类筛选、搜索等功能。

### 适用场景

- 🏪 生鲜水果店铺的线上销售平台
- 👥 小型水果批发商的管理系统
- 🍓 农场直销的微信电商小程序
- 🎓 学习微信小程序 + 云开发的学习项目

---

## ✨ 功能特点

### 用户端功能

| 功能 | 说明 |
|------|------|
| 📱 首页浏览 | 分类滑动条 + 水果卡片列表，展示商品图片、价格、标签 |
| 🏷️ 分类筛选 | 按分类查看水果，支持多分类关联 |
| 📋 商品详情 | 主图展示、规格选择、价格库存查看、商品描述 |
| 🔍 全局搜索 | 按水果名称实时搜索 |
| 📷 图片画廊 | 商品多图支持，可放大查看 |

### 商家端功能

| 功能 | 说明 |
|------|------|
| 🔐 商家登录 | 仅授权商家可登录，支持邀请码加入店铺 |
| 📦 商品管理 | 发布、编辑、删除、上架/下架商品 |
| 🏪 分类管理 | 添加、编辑、删除商品分类 |
| ⚙️ 店铺设置 | 修改店铺名称、Logo、营业状态 |
| 📢 公告管理 | 发布店铺公告，显示在首页 |
| 👥 团队管理 | 店主邀请管理员、共同管理店铺 |
| 📊 数据统计 | 商品数量、上架状态、低库存预警 |

### 权限体系

| 角色 | 权限范围 |
|------|----------|
| 👑 店主 (Creator) | 店铺所有权、邀请/移除管理员、店铺设置、全部管理权限 |
| 👔 管理员 (Manager) | 商品管理、分类管理、公告编辑 |
| 👤 普通用户 | 商品浏览、搜索 |

---

## 🛠️ 技术栈

### 前端

- **框架**: 微信小程序原生框架
- **状态管理**: 分层架构 (services + models + pages)
- **样式**: WXSS (微信样式表)
- **组件化**: 自定义组件 (fruit-card 等)

### 后端 (云开发)

- **运行环境**: 微信云开发 (TCB)
- **云函数**: Node.js (wx-server-sdk)
- **数据库**: MongoDB (云开发自带)
- **文件存储**: 云存储 (图片上传)

### 项目架构

```
┌─────────────────────────────────────────────────────────────┐
│                        小程序前端                            │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │  Pages  │→ │Services │→ │   API   │→ │ Request │        │
│  │  页面层  │  │ 服务层  │  │ 端点定义 │  │  调用封装 │        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
└─────────────────────────────────────────────────────────────┘
                              ↓ wx.cloud.callFunction()
┌─────────────────────────────────────────────────────────────┐
│                      微信云开发                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Cloud       │  │ Cloud       │  │ Cloud       │         │
│  │ Functions   │→ │ Database    │→ │ Storage     │         │
│  │ 云函数       │  │ 数据库       │  │ 文件存储     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 项目结构

```
fruit_v2/
├── app.js                    # 小程序入口
├── app.json                  # 全局配置
├── app.wxss                  # 全局样式
├── project.config.json       # 项目配置
├── sitemap.json              # sitemap 配置
│
├── pages/                    # 页面目录
│   ├── index/                # 用户首页
│   ├── detail/               # 商品详情页
│   ├── search/               # 搜索页
│   ├── category/             # 分类页
│   ├── merchant/             # 商家首页（管理）
│   ├── login/                # 商家登录
│   ├── publish/              # 发布商品
│   ├── edit/                 # 编辑商品
│   ├── categoryManage/       # 分类管理
│   ├── ownerManage/          # 团队管理
│   ├── shopSettings/         # 店铺设置
│   └── announcementManage/   # 公告管理
│
├── cloudfunctions/           # 云函数目录
│   ├── login/                # 用户登录
│   ├── merchantLogin/        # 商家登录
│   ├── createFruit/          # 创建商品
│   ├── updateFruit/          # 更新商品
│   ├── deleteFruit/          # 删除商品
│   ├── getFruitDetail/       # 获取商品详情
│   ├── listPublicFruits/     # 用户端商品列表
│   ├── listMerchantFruits/   # 商家端商品列表
│   ├── updateFruitStatus/    # 更新上下架状态
│   ├── saveCategory/         # 保存分类
│   ├── deleteCategory/       # 删除分类
│   ├── listPublicCategories/ # 用户端分类列表
│   ├── listMerchantCategories/# 商家端分类列表
│   ├── createInvite/         # 创建邀请链接
│   ├── acceptInvite/         # 接受邀请
│   ├── removeOwner/          # 移除管理员
│   ├── listOwners/           # 管理员列表
│   ├── updateShop/           # 更新店铺信息
│   ├── getPublicShop/        # 获取公开店铺
│   ├── publishAnnouncement/  # 发布公告
│   └── initDatabase/         # 初始化数据库
│
├── components/               # 组件目录
│   └── fruit-card/           # 水果卡片组件
│
├── services/                 # 业务服务层
│   ├── fruitService.js       # 商品服务
│   ├── authService.js        # 认证服务
│   ├── categoryService.js    # 分类服务
│   ├── shopService.js        # 店铺服务
│   ├── ownerService.js       # 团队管理服务
│   └── announcementService.js# 公告服务
│
├── models/                    # 数据模型层
│   └── fruitMapper.js        # 商品数据映射/格式化
│
├── behaviors/                # 行为
│   ├── authRequired.js       # 授权验证行为
│   └── refreshOnHomeChanged.js# 首页刷新行为
│
├── forms/                    # 表单模型
│   ├── fruitForm.js          # 商品表单
│   ├── categoryForm.js       # 分类表单
│   └── shopForm.js           # 店铺表单
│
├── constants/                # 常量配置
│   └── api.js                # API 端点配置
│
└── utils/                    # 工具函数
    ├── request.js           # 云函数调用封装
    ├── store.js             # 本地存储
    ├── ui.js                # UI 提示封装
    ├── navigation.js        # 页面导航
    ├── fruit.js             # 水果数据处理
    ├── category.js          # 分类数据处理
    └── constants.js         # 全局常量
```

---

## 🚀 快速开始

### 环境要求

- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) >= 1.06.0
- 微信小程序基础库 >= 2.2.3
- Node.js >= 14.0 (仅用于云函数本地调试)

### 步骤 1: 克隆项目

```bash
git clone https://github.com/your-username/fruit-mini-program.git
cd fruit-mini-program
```

### 步骤 2: 导入项目

1. 打开微信开发者工具
2. 点击「导入项目」
3. 选择项目根目录
4. 填写 AppID（使用您自己的小程序 AppID）
5. 点击「导入」

### 步骤 3: 创建云开发环境

1. 在微信开发者工具中，点击「云开发」按钮
2. 按照提示开通云开发服务
3. 记录环境 ID（如 `cloud1-xxxx`）
4. 将环境 ID 填入 `app.js` 中的 `globalData.envId`

```javascript
// app.js
globalData: {
  envId: "your-cloud-environment-id",  // 修改这里
  // ...
}
```

### 步骤 4: 部署云函数

1. 进入 `cloudfunctions/` 目录
2. 对每个云函数文件夹右键，选择「上传并部署」
3. 或者使用微信开发者工具的「云函数」面板进行批量部署

**需要部署的云函数列表：**

| 云函数 | 说明 |
|--------|------|
| initDatabase | 初始化数据库（只需运行一次） |
| login | 用户登录 |
| merchantLogin | 商家登录 |
| createFruit | 创建商品 |
| updateFruit | 更新商品 |
| deleteFruit | 删除商品 |
| getFruitDetail | 获取商品详情 |
| listPublicFruits | 用户端商品列表 |
| listMerchantFruits | 商家端商品列表 |
| updateFruitStatus | 更新商品状态 |
| saveCategory | 保存分类 |
| deleteCategory | 删除分类 |
| listPublicCategories | 用户端分类列表 |
| listMerchantCategories | 商家端分类列表 |
| createInvite | 创建邀请 |
| acceptInvite | 接受邀请 |
| removeOwner | 移除管理员 |
| listOwners | 管理员列表 |
| updateShop | 更新店铺 |
| getPublicShop | 获取店铺信息 |
| publishAnnouncement | 发布公告 |

### 步骤 5: 初始化数据库

1. 在微信开发者工具中打开云开发控制台
2. 进入「云函数」页面
3. 找到 `initDatabase` 函数，点击「测试」
4. 确认运行成功，系统会自动创建示例数据

### 步骤 6: 运行项目

1. 在微信开发者工具中点击「预览」
2. 使用微信扫描二维码即可预览

---

## 📖 使用指南

### 商家端使用

#### 首次使用

1. 先在云数据库中绑定店主 `openid` 和店铺 `shopId`
2. 进入小程序后，点击「商家入口」
3. 使用微信商家登录
4. 登录成功后开始添加分类和发布商品

#### 团队协作

1. 店主进入「团队管理」页面
2. 点击「生成邀请链接」
3. 复制链接发送给团队成员
4. 被邀请人点击链接后自动成为管理员

### 用户端使用

1. 打开小程序即可浏览商品
2. 点击顶部分类滑动条可按分类筛选
3. 点击右上角搜索图标可搜索商品
4. 点击商品卡片可查看详情

---

## 🗄️ 数据库说明

### 集合列表

| 集合名 | 说明 | 主要字段 |
|--------|------|----------|
| `users` | 用户表 | openid, shopId, role, createTime |
| `shops` | 店铺表 | name, logo, ownerIds, creatorId, announcement, businessStatus |
| `categories` | 分类表 | shopId, name, subTitle, description, sort |
| `fruits` | 商品表 | shopId, name, categoryIds, tags, mainImage, specs, status |
| `invites` | 邀请表 | shopId, code, creatorId, createTime |

### 数据规则

- **价格**: 存储为数字（单位：分），前端显示时转换为元
- **库存**: 整数类型
- **状态**: `on_sale` 上架 / `off_sale` 下架
- **营业状态**: `open` 营业 / `closed` 打烊

---

## 🔧 开发指南

### 添加新的云函数

1. 在 `cloudfunctions/` 下创建新文件夹
2. 创建 `index.js` 入口文件
3. 创建 `package.json` 配置文件
4. 右键部署云函数

**示例 `package.json`:**

```json
{
  "name": "your-function-name",
  "version": "1.0.0",
  "description": "Your function description",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "~2.6.3"
  }
}
```

### 添加新的页面

1. 在 `pages/` 下创建新文件夹
2. 创建 `index.js`, `index.wxml`, `index.wxss`, `index.json`
3. 在 `app.json` 的 `pages` 数组中添加路由

### 调用云函数

使用封装好的 `request.js`:

```javascript
const { callCloud } = require("../../utils/request");
const API = require("../../constants/api");

// 在 service 中调用
async function getData(params) {
  return callCloud(API.YOUR_FUNCTION_NAME, params);
}
```

---

## 📝 常见问题

### Q: 如何修改店铺名称？

A: 商家登录后进入「店铺设置」页面，可直接修改店铺名称。

### Q: 如何添加自定义标签？

A: 目前标签为预设固定值（新上、低价、热卖、预售、售罄），如需自定义可修改 `constants/api.js` 中的配置。

### Q: 如何查看统计数据？

A: 在商家首页底部可以看到商品统计（总数、上架数、下架数、低库存数）。

### Q: 云函数部署失败怎么办？

A: 检查以下几点：
- 确保已开通云开发服务
- 检查 `package.json` 中的依赖是否正确
- 尝试删除 `node_modules` 后重新部署

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发流程

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

---

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

---

## 📞 联系方式

- 项目主页: https://github.com/your-username/fruit-mini-program
- 问题反馈: https://github.com/your-username/fruit-mini-program/issues

---

## 🙏 致谢

- [微信小程序](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [腾讯云开发](https://cloud.tencent.com/product/tcb)
- [Taro](https://taro.jd.com/) (参考框架)

---

<p align="center">
  <strong>如果这个项目对您有帮助，请给我们一个 ⭐️</strong>
</p>
