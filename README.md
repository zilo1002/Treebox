# 🌳 Treebox

[![Vue 3](https://img.shields.io/badge/Vue-3-42b883?logo=vue.js)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)](https://vitejs.dev/)
[![PWA](https://img.shields.io/badge/PWA-Supported-5A0FC8?logo=pwa)](https://web.dev/progressive-web-apps/)
[![vue-i18n](https://img.shields.io/badge/i18n-9-2E7EE5?logo=vue.js)](https://vue-i18n.intlify.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> 一个轻量、美观、可离线使用的在线工具箱。支持中英双语、自定义主题、PWA 离线访问，以及学术写作引用管理。

---

## ✨ 功能亮点

| 模块 | 功能 |
|------|------|
| **📑 引用助手** | 参考文献管理、交叉引用、题注（图/表）、脚注/尾注，支持 GB/T 7714 / APA / MLA / Chicago 格式，一键导出标准 Word 文档（.docx） |
| **🌍 多语言** | 中文 / English / 跟随系统，基于 vue-i18n 全项目国际化 |
| **💌 信封启动** | 每次新会话展示精美信封开启动画，刷新不重复打扰 |
| **🎨 主题系统** | 主题色、自定义背景/文字/导航栏颜色、8 种护眼色推荐（豆沙绿、杏仁黄等） |
| **🖼️ 背景动画** | 支持上传 GIF / 图片作为全屏动态背景，自动循环播放 |
| **🔬 科学计算器** | 标准模式 + 科学模式（仅 iPad / Mac / 电脑端显示），支持汇率、生日干支、进制转换、颜色编码转换 |
| **🧰 日常工具** | 文件批量改名、中文排版检查、二维码生成、取色器、图片压缩、倒计时、随机数、手持弹幕 |
| **📱 PWA 支持** | 可安装到桌面，离线访问，沉浸式体验 |
| **♿ 无障碍** | 减少动画开关、字体大小调节、毛玻璃效果可选 |

---

## 📋 支持格式一览

| 功能 | 输入格式 | 输出格式 | 说明 |
|------|---------|---------|------|
| 引用助手导入 | `.docx`, `.txt`, `.md`, 直接粘贴 | `.docx` | 自动提取正文并标注引用 |
| 文件批量改名 | 任意文件 | 重命名文件 | 支持规则批量替换 |
| 中文排版检查 | 纯文本 | 修复后文本 | 自动修正标点、空格、引号 |
| 二维码 | 文本 / URL | PNG 图片 | 生成与识别 |
| 图片压缩 | JPG, PNG, WebP | 压缩后图片 | 前端本地处理 |
| 颜色转换 | HEX / RGB / HSL | 互转 | 实时预览 |
| 进制转换 | 二 / 八 / 十 / 十六进制 | 互转 | 即时计算 |
| 汇率换算 | 数字输入 | 多币种结果 | 基于 xCurrency 数据源 |

---

## 🔒 隐私与安全

- **纯前端实现**：所有数据处理均在浏览器本地完成，不上传至任何服务器
- **引用助手**：文档解析使用 `mammoth.js`，Word 导出使用 `docx.js`，全程本地运行
- **本地存储**：用户配置、收藏、分类数据仅存于 `localStorage`，可随时清除
- **无追踪**：无第三方统计、无 Cookie、无用户行为收集

---

## ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + K` | 打开工具搜索 |
| `Esc` | 关闭弹窗 / 返回上一级 |
| `Ctrl + ,` | 打开设置面板 |

---

## 📁 项目结构

```
treebox/
├── public/                 # 静态资源
├── src/
│   ├── assets/
│   │   └── style.css       # 全局样式与 CSS 变量
│   ├── components/
│   │   ├── AppHeader.vue   # 顶部标题栏
│   │   ├── BottomNav.vue   # 底部导航
│   │   ├── CategoryCard.vue# 分类卡片
│   │   ├── EnvelopeScreen.vue # 信封启动页
│   │   ├── SearchBar.vue   # 全局搜索
│   │   ├── SettingsModal.vue  # 设置面板
│   │   ├── ShelfGrid.vue   # 工具网格布局
│   │   └── ...
│   ├── composables/
│   │   └── useTheme.js     # 主题/明暗模式逻辑
│   ├── data/
│   │   └── tools.js        # 分类与工具定义
│   ├── i18n/
│   │   ├── index.js        # vue-i18n 配置
│   │   ├── zh.js           # 中文语言包
│   │   └── en.js           # 英文语言包
│   ├── router/
│   │   └── index.js        # 路由配置
│   ├── stores/
│   │   └── app.js          # Pinia 全局状态（含缓存合并逻辑）
│   ├── tools/
│   │   ├── CitationTool.vue   # 引用助手
│   │   ├── DailyToolbox.vue   # 计算器/汇率/生日/进制/颜色
│   │   └── ...             # 其他工具组件
│   ├── views/
│   │   ├── HomeView.vue    # 首页
│   │   ├── AllView.vue     # 全部工具
│   │   └── CategoryView.vue # 分类详情
│   ├── App.vue             # 根组件（含下拉刷新）
│   └── main.js             # 入口文件
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| [Vue 3](https://vuejs.org/) | 前端框架（Composition API） |
| [Vite 5](https://vitejs.dev/) | 构建工具 |
| [Vue Router 4](https://router.vuejs.org/) | 单页路由 |
| [Pinia](https://pinia.vuejs.org/) | 状态管理 |
| [vue-i18n 9](https://vue-i18n.intlify.dev/) | 国际化 |
| [docx](https://github.com/dolanmiu/docx) | 原生生成 Word 文档 |
| [mammoth](https://github.com/mwilliamson/mammoth.js) | 提取 Word 文档纯文本 |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | PWA 支持 |

---

## 💡 使用提示（踩坑经验）

> [!WARNING]
> **vue-i18n 依赖缺失**
> 若 CI 构建报错 `Cannot find module 'vue-i18n'`，请在本地运行 `npm install vue-i18n@9` 并提交 `package.json`。

> [!WARNING]
> **DATA_VERSION 升级机制**
> `src/stores/app.js` 中的 `DATA_VERSION` 每次数据结构变更（如新增持久化字段）时必须 +1，否则老用户本地缓存不会自动刷新，可能导致新功能（如引用助手）无法显示。

> [!NOTE]
> **本地缓存合并策略**
> 启动时会自动将 `tools.js` 中新增的默认工具合并进用户本地 `localStorage` 缓存，既保留用户自定义分类，又不漏掉新功能。

> [!NOTE]
> **信封显示逻辑**
> 信封仅在**新会话**（关闭标签后重新打开）时显示，使用 `sessionStorage` 判断。同一会话内刷新页面不会重复出现信封，且刷新后保持当前页面。

> [!TIP]
> **科学计算器移动端隐藏**
> 科学模式通过 `@media (min-width: 768px)` 控制，手机端自动隐藏切换按钮和扩展键区，避免键盘拥挤。

> [!TIP]
> **docx 导出字体**
> 导出 Word 默认使用 Times New Roman，若目标电脑无该字体，Word 会自动回退到系统默认字体，不影响排版结构。

> [!WARNING]
> **PWA 缓存延迟**
> 更新代码后，已安装的 PWA 可能需要关闭再打开一次才能看到最新版本（Service Worker 缓存策略）。

> [!NOTE]
> **背景动画格式**
> 背景动画支持上传 GIF、PNG、JPG。大体积 GIF（>5MB）可能导致低端设备卡顿，建议压缩后上传。

> [!TIP]
> **引用助手题注自动编号**
> 删除图注/表注后系统会自动重新编号，无需手动调整。

> [!NOTE]
> **下拉刷新实现**
> 基于 Touch 事件手动实现，仅在页面滚动到顶部时触发，避免与正常滚动冲突。

---

## 📄 License

[MIT](LICENSE) © zilo1002
