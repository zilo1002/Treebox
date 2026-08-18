# 我的工具箱

[![Vite](https://img.shields.io/badge/Vite-5.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Vue](https://img.shields.io/badge/Vue-3.4-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![PWA](https://img.shields.io/badge/PWA-Supported-5A0FC8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> 一个像书架一样的个人工具箱，打开信封，进入你的工具世界。

---

## 功能亮点

- **信封入场动效** — 点击信封翻盖打开，卡片抽出动画，仪式感满满
- **书架式布局** — 每个分类像书架一样排列工具，支持 3×3 / 4×4 / 列表三种视图
- **动态分类管理** — 网页内即可创建新分类，无需修改代码
- **动态添加工具** — 在分类内直接添加工具，配置化扩展
- **明暗主题 + 主题色** — 支持浅色/深色/自动三种模式，8 种主题色可选
- **圆角自由调节** — 卡片圆角 0~20px 无级调节
- **收藏系统** — 星标收藏常用工具，首页快速访问
- **PWA 支持** — 可添加到手机桌面，离线可用
- **全端适配** — 移动端优先，响应式适配平板和桌面

---

## 支持格式一览

| 功能 | 类型 | 说明 |
|------|------|------|
| Base64 编解码 | 文字工具 | 文本与 Base64 互相转换 |
| 文本对比 | 文字工具 | 两段文本差异高亮对比 |
| 字数统计 | 文字工具 | 字符/行数/单词数统计 |
| 简繁转换 | 文字工具 | 中文简体繁体互转 |
| 二维码生成 | 图片工具 | 文本/链接转二维码图片 |
| 取色器 | 图片工具 | HEX/RGB 颜色提取与复制 |
| 图片压缩 | 图片工具 | Canvas 前端压缩，支持下载 |
| 倒计时 | 日常工具 | 可设置分钟数的倒计时器 |
| 随机数 | 日常工具 | 指定范围内的随机整数 |
| 手持弹幕 | 日常工具 | 全屏滚动文字，可调大小/速度/颜色 |
| 计算器 | 日常工具 | 基础四则运算 |

---

## 隐私与安全

- **纯前端应用** — 所有数据处理均在浏览器本地完成，不上传任何数据到服务器
- **localStorage 存储** — 用户配置、收藏列表、自建分类保存在本地，不会同步到云端
- **无第三方追踪** — 不包含任何统计脚本、广告代码或第三方 Cookie
- **图片处理本地完成** — 图片压缩、Base64 转换均使用浏览器原生 Canvas API，图片不会离开你的设备
- **HTTPS 建议** — 部署时建议启用 HTTPS，确保 PWA 功能正常工作

---

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + K` / `Cmd + K` | 打开/关闭搜索栏 |
| `Esc` | 关闭弹窗/返回上一页 |
| `Ctrl + ,` / `Cmd + ,` | 打开设置面板 |

> 注：当前版本快捷键需手动在代码中绑定，可在 `App.vue` 中添加全局键盘监听实现。

---

## 项目结构

```
toolbox-app/
├── index.html                  # 入口 HTML
├── vite.config.js              # Vite + PWA 配置
├── package.json
├── public/
│   ├── manifest.json           # PWA 清单
│   └── favicon.svg             # 站点图标
└── src/
    ├── main.js                 # 应用入口
    ├── App.vue                 # 根组件（信封 + 壳子）
    ├── assets/
    │   └── style.css           # 全局样式 + CSS 变量
    ├── router/
    │   └── index.js            # Vue Router 配置（Hash 模式）
    ├── stores/
    │   └── app.js              # Pinia 状态管理（分类/收藏/主题）
    ├── composables/
    │   └── useTheme.js         # 主题系统（明暗 + 主题色）
    ├── data/
    │   └── tools.js            # 默认分类数据 + 工具类型映射
    ├── components/
    │   ├── EnvelopeScreen.vue  # 信封动效开场
    │   ├── AppHeader.vue       # 顶部导航栏
    │   ├── BottomNav.vue       # 底部 Tab 导航
    │   ├── SearchBar.vue       # 搜索栏
    │   ├── CategoryCard.vue    # 分类卡片
    │   ├── ToolCard.vue        # 工具卡片
    │   ├── ShelfGrid.vue       # 书架网格容器
    │   ├── SettingsModal.vue   # 设置面板（主题/布局/圆角）
    │   ├── CreateCategoryModal.vue  # 新建分类弹窗
    │   └── AddToolModal.vue    # 添加工具弹窗
    ├── views/
    │   ├── HomeView.vue        # 首页（分类网格）
    │   ├── AllView.vue         # 全部工具页
    │   ├── FavView.vue         # 收藏页
    │   ├── CategoryView.vue    # 分类详情页
    │   └── ToolView.vue        # 工具详情页（动态加载组件）
    └── tools/                  # 工具组件（按需异步加载）
        ├── Base64Tool.vue
        ├── QrCodeTool.vue
        ├── TimerTool.vue
        ├── RandomTool.vue
        ├── BarrageTool.vue
        ├── ColorPickerTool.vue
        ├── TextTool.vue
        ├── CalcTool.vue
        └── ImageTool.vue
```

---

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| [Vue](https://vuejs.org/) | 3.4 | 前端框架 |
| [Vue Router](https://router.vuejs.org/) | 4.3 | 单页路由 |
| [Pinia](https://pinia.vuejs.org/) | 2.1 | 状态管理 |
| [Vite](https://vitejs.dev/) | 5.2 | 构建工具 |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | 0.19 | PWA 支持 |
| CSS Variables | - | 主题系统（明暗 + 主题色 + 圆角） |
| localStorage | - | 数据持久化 |

---

## 使用提示（踩坑经验）

1. **GitHub Pages 部署路径** — `vite.config.js` 中已设置 `base: './'`，确保使用 Hash 路由（`createWebHashHistory`），否则刷新 404。

2. **PWA 图标缺失** — 当前使用 SVG favicon，PWA 需要 `icon-192.png` 和 `icon-512.png`，部署前请替换 `public/` 下的占位图标。

3. **首次加载白屏** — 若部署后白屏，检查浏览器控制台是否有 CORS 或 MIME 类型错误，GitHub Pages 对 `.js` 文件的 MIME 类型支持良好，但确保分支设置为 `gh-pages` 或使用 GitHub Actions 自动部署。

4. **localStorage 容量** — 分类和工具数据存在 localStorage，建议单条工具数据不要过大（如避免存储大量图片 Base64），可考虑后期迁移到 IndexedDB。

5. **深色模式闪烁** — 主题变量通过 JS 在 `onMounted` 时应用，若出现闪白，可在 `index.html` 的 `<head>` 中添加内联脚本提前设置主题类。

6. **添加新工具的最简步骤**：
   - 在 `src/tools/` 下新建 `XxxTool.vue`
   - 在 `src/data/tools.js` 的 `toolTypeMap` 中注册异步加载器
   - 在 `toolIcons` 和 `toolDescs` 中添加图标和描述
   - 在分类数据中引用该 `type`，或在网页内通过「添加工具」选择该类型

7. **Vue 异步组件缓存** — `ToolView.vue` 中使用 `defineAsyncComponent` 动态加载工具，首次加载会有短暂 loading，后续从缓存读取。

---

## License

[MIT](LICENSE) © 2024
