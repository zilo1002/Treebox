# Treebox

[![Vue 3](https://img.shields.io/badge/Vue_3-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![PWA](https://img.shields.io/badge/PWA-5A0FC8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)

> 一个像书架一样的个人在线工具箱，纯前端实现，开箱即用。

## 功能亮点

- **信封开启动画** —— 点击信封翻盖进入主界面，仪式感拉满
- **书架式工具网格** —— 支持 3×3 / 4×4 / 列表三种布局，自由切换
- **圆角无级调节** —— 0~20px 滑杆控制，全站卡片联动
- **明暗模式 + 主题色** —— 浅色 / 深色 / 自动跟随系统，8 色主题盘
- **分类管理** —— 网页内直接创建分类、添加工具，数据自动保存
- **收藏系统** —— 常用工具星标收藏，首页优先展示
- **中文排版检查器** —— 支持 .txt / .md / .docx，12 项排版规则检测与自动修复
- **文件批量改名** —— 前缀/后缀/序号/查找替换，一键下载
- **图片压缩** —— 纯 Canvas 实现，支持质量、尺寸、格式调节
- **PWA 支持** —— 可添加到手机桌面，离线可用

## 支持格式一览

| 功能 | 输入格式 | 输出格式 | 说明 |
|------|---------|---------|------|
| 中文排版检查 | .txt / .md / .docx | .txt | 本地解析，不上传服务器 |
| 文件批量改名 | 任意文件 | 重命名后的文件 | 浏览器内批量下载 |
| 图片压缩 | JPG / PNG / WebP / GIF / BMP | JPG / PNG / WebP | Canvas 本地处理 |
| 二维码生成 | 文本/URL | PNG | Canvas 绘制下载 |

## 隐私与安全

- **纯前端运行** —— 所有文件处理均在浏览器本地完成，不会上传到任何服务器
- **数据本地存储** —— 分类、收藏、主题设置等保存在浏览器 localStorage 中
- **无账号体系** —— 无需登录注册，打开网页即可使用
- **PWA 离线可用** —— 首次加载后，无网络环境也能使用已缓存的工具

## 快捷键

| 快捷键 | 作用 |
|--------|------|
| `Ctrl + F` / 点击顶部 🔍 | 打开工具搜索 |
| `ESC` | 关闭搜索 / 关闭弹窗 |

## 项目结构

```
treebox/
├── public/
│   ├── manifest.json          # PWA 清单
│   └── favicon.svg
├── src/
│   ├── assets/
│   │   └── style.css          # CSS 变量主题系统
│   ├── components/            # 通用组件
│   │   ├── AppHeader.vue
│   │   ├── BottomNav.vue
│   │   ├── CategoryCard.vue
│   │   ├── EnvelopeScreen.vue # 信封开场动画
│   │   ├── SearchBar.vue
│   │   ├── SettingsModal.vue  # 设置面板
│   │   ├── ShelfGrid.vue      # 书架网格
│   │   ├── ToolCard.vue
│   │   ├── CreateCategoryModal.vue
│   │   └── AddToolModal.vue
│   ├── composables/
│   │   └── useTheme.js        # 主题动态切换逻辑
│   ├── data/
│   │   └── tools.js           # 工具元数据 & 组件映射
│   ├── router/
│   │   └── index.js           # Hash 路由（GitHub Pages 兼容）
│   ├── stores/
│   │   └── app.js             # Pinia 状态管理 + localStorage 持久化
│   ├── tools/                 # 功能工具组件
│   │   ├── RenameTool.vue     # 文件批量改名
│   │   ├── ProofreaderTool.vue # 中文排版检查
│   │   ├── ImageTool.vue      # 图片压缩
│   │   ├── QrCodeTool.vue     # 二维码生成
│   │   ├── TimerTool.vue      # 倒计时
│   │   ├── RandomTool.vue     # 随机数
│   │   ├── BarrageTool.vue    # 手持弹幕
│   │   ├── CalcTool.vue       # 计算器
│   │   ├── ColorPickerTool.vue # 取色器
│   │   ├── Base64Tool.vue     # Base64 编解码
│   │   └── TextTool.vue       # 文本处理
│   ├── views/                 # 页面视图
│   │   ├── HomeView.vue       # 首页分类
│   │   ├── AllView.vue        # 全部工具
│   │   ├── FavView.vue        # 我的收藏
│   │   ├── CategoryView.vue   # 分类详情
│   │   └── ToolView.vue       # 工具详情页
│   ├── App.vue                # 应用壳层
│   └── main.js                # 入口
├── .github/
│   └── workflows/
│       └── deploy.yml         # GitHub Actions 自动部署
├── index.html
├── vite.config.js             # Vite + PWA 配置
├── package.json
└── LICENSE
```

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 框架 | Vue 3 + Composition API | 响应式、组件化 |
| 构建工具 | Vite | 极速 HMR、Rollup 打包 |
| 路由 | Vue Router 4 | Hash 模式，兼容 GitHub Pages |
| 状态管理 | Pinia | 轻量、TypeScript 友好 |
| PWA | vite-plugin-pwa | Service Worker、离线缓存、manifest |
| 样式 | CSS 变量 + 原生 CSS | 无 UI 框架依赖，体积极致 |
| 文档解析 | mammoth (可选) | 浏览器端解析 .docx 为纯文本 |

## 使用提示（踩坑经验）

1. **GitHub Pages 路径大小写敏感** —— 仓库名 `Treebox` 是大写 T，`vite.config.js` 里的 `base` 必须写 `/Treebox/`，否则资源 404 白屏
2. **Hash 路由防刷新 404** —— 部署到 GitHub Pages 必须用 `createWebHashHistory`，不能用 history 模式
3. **mammoth 依赖按需加载** —— `.docx` 解析依赖 `mammoth`，已在 `package.json` 中声明，无需额外配置
4. **localStorage 缓存导致数据不更新** —— `stores/app.js` 中已加入 `DATA_VERSION` 机制，每次修改默认工具数据后递增版本号，用户刷新页面会自动重置
5. **图片压缩大文件卡顿** —— Canvas 处理超大图（>10MB）可能卡死，建议限制上传尺寸或在 `ImageTool.vue` 中增加文件大小提示
6. **移动端底部安全区** —— 已使用 `env(safe-area-inset-bottom)` 处理刘海屏，底部导航不会被遮挡
7. **批量下载间隔** —— 浏览器限制连续下载，`RenameTool.vue` 中已加入 200ms 间隔，避免被拦截

## License

[MIT](LICENSE)
