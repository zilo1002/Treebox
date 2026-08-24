# 🌳 Treebox

[![Vue 3](https://img.shields.io/badge/Vue-3-42b883?logo=vue.js)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)](https://vitejs.dev/)
[![PWA](https://img.shields.io/badge/PWA-Supported-5A0FC8?logo=pwa)](https://web.dev/progressive-web-apps/)
[![vue-i18n](https://img.shields.io/badge/i18n-9-2E7EE5?logo=vue.js)](https://vue-i18n.intlify.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> 一个轻量、美观、可离线使用的在线工具箱。支持中英双语、自定义主题、PWA 离线访问，以及学术写作引用管理。

---

## ✨ 功能亮点

### 📝 文字工具

| 工具 | 说明 |
|------|------|
| **📑 引用助手** | 参考文献管理、交叉引用、题注（图/表）、脚注/尾注，支持 GB/T 7714 / APA / MLA / Chicago 格式，一键导出标准 Word 文档（.docx） |
| **📁 文件批量改名** | 批量重命名文件，支持序号、替换、插入等多种规则 |
| **📋 中文排版检查** | 自动检查并修复中文排版常见问题（空格、标点、引号等） |

### 🖼️ 图片工具

| 工具 | 说明 |
|------|------|
| **📱 二维码** | 生成 / 识别二维码，支持自定义颜色与 Logo |
| **🎨 取色器** | 提取图片或屏幕任意位置颜色 |
| **🗜️ 图片压缩** | 本地压缩图片，保护隐私不上传 |

### 🧰 日常工具

| 工具 | 说明 |
|------|------|
| **🧮 计算器** | 标准模式 + 科学模式（仅 iPad / Mac / 电脑端显示），支持汇率换算、生日星座查询、进制转换、颜色编码转换（HEX / RGB / HSL 互转） |
| **⏱️ 倒计时** | 计时器与倒计时 |
| **🎲 随机数** | 生成随机数、随机密码、随机抽签 |
| **📢 手持弹幕** | 全屏滚动弹幕，支持自定义颜色与速度 |

### 💻 代码工具

| 工具 | 说明 |
|------|------|
| **📄 代码格式化** | 上传大文件自动检测语言，超长行按字节拆分（可自定义每行字节数），防止浏览器渲染崩溃，支持复制 / 下载格式化后的文件 |
| **🔗 JS 网址转换** | 输入 JS 文件 URL 获取内容预览，支持下载为 `.js` 或 `.txt`，CORS 受限时友好提示 |
| **📝 代码批量替换** | 上传代码文件后按指令批量修改：① **行号替换** — 支持 `第 X~Y 行替换为：` 等多种格式，从后往前替换避免行号偏移；② **内容替换** — `xxx换成xxx` / `把这个代码xxx替换成xxx` 等，多处匹配时弹出面板提示用户选择替换位置；修改行自动红色高亮标记，支持一键复制 / 下载 |

---

## 📋 支持格式一览

| 功能 | 输入格式 | 输出格式 | 说明 |
|------|---------|---------|------|
| 引用助手导入 | `.docx`, `.txt`, `.md`, 直接粘贴 | `.docx` | 自动提取正文并标注引用 |
| 文件批量改名 | 任意文件 | 重命名文件 | 支持规则批量替换 |
| 中文排版检查 | 纯文本 | 修复后文本 | 自动修正标点、空格、引号 |
| 二维码 | 文本 / URL | PNG 图片 | 生成与识别 |
| 图片压缩 | JPG, PNG, WebP | 压缩后图片 | 前端本地处理 |
| 颜色转换 | HEX / RGB / HSL | 互转 | 计算器内颜色编码转换，实时预览 |
| 进制转换 | 二 / 八 / 十 / 十六进制 | 互转 | 即时计算 |
| 汇率换算 | 数字输入 | 多币种结果 | 基于 xCurrency 数据源 |
| 代码格式化 | `.js` `.ts` `.html` `.css` `.vue` `.py` `.java` `.json` `.xml` `.md` | 格式化文本 | 大文件超长行自动拆分 |
| JS 网址转换 | URL | `.js` / `.txt` | 受 CORS 限制时需手动下载 |
| 代码批量替换 | 上述代码格式 | 修改后代码 | 支持行号替换与内容查找替换 |

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
│   │   ├── CodeFormatTool.vue # 代码格式化
│   │   ├── JsUrlTool.vue      # JS 网址转换
│   │   ├── CodeReplaceTool.vue # 代码批量替换
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

> [!TIP]
> **大文件代码格式化**
> minified 文件单行动辄几万字节，浏览器直接渲染会卡死。上传后工具自动检测最长行字节数，超过 2000 字节会提示拆分，建议设置 500~1000 字节/行。

> [!NOTE]
> **JS 网址转换 CORS**
> 如果目标 CDN 禁止跨域（如 GitHub raw），会提示下载后使用「代码格式化」查看，这是浏览器安全限制，非工具问题。

> [!TIP]
> **代码批量替换行号偏移**
> 多处行号替换时，工具会自动按从后往前的顺序执行，避免前面的替换导致后面行号错位。内容替换时如果同一内容出现多次，会弹出面板让你勾选具体位置。

---

## 📄 License

[MIT](LICENSE) © zilo1002
