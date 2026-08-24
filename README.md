# 🧰 我的工具箱

[![Vue 3](https://img.shields.io/badge/Vue-3-42b883?logo=vue.js)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite)](https://vitejs.dev/)
[![PWA](https://img.shields.io/badge/PWA-Supported-5a0fc8?logo=pwa)](https://web.dev/progressive-web-apps/)
[![vue-i18n](https://img.shields.io/badge/i18n-zh|en-4fc08d)](https://vue-i18n.intlify.dev/)

> 一个基于 Vue 3 + Vite 的纯前端工具箱，支持 PWA 离线使用，中英文双语切换，所有数据保存在本地浏览器。

---

## ✨ 功能亮点

### 📝 文字工具

| 工具 | 说明 |
|------|------|
| **📑 引用助手** | 参考文献 / 题注 / 脚注管理，支持 GB/T 7714、APA 7th、MLA 9th、Chicago 17th 格式，可导出 Word 文档 |
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

| 功能 | 输入格式 | 输出格式 | 备注 |
|------|----------|----------|------|
| 二维码生成 | 文本 / URL | PNG / SVG | 支持自定义颜色、Logo |
| 二维码识别 | 图片文件 | 文本 | 本地解析不上传 |
| 取色器 | 图片 / 屏幕 | HEX / RGB / HSL | 实时预览 |
| 图片压缩 | JPG / PNG / WebP | 原格式 | 本地压缩，不上传服务器 |
| 颜色编码转换 | HEX / RGB / HSL | 互转 | 计算器内颜色编码转换，实时预览 |
| 进制转换 | 二 / 八 / 十 / 十六进制 | 互转 | 实时同步 |
| 汇率换算 | 160+ 货币 | 实时汇率 | 数据来源 xCurrency |
| 参考文献导出 | 手动录入 / 自动标注 | Word (.docx) | 支持 GB/T 7714、APA、MLA、Chicago |
| 代码格式化 | .js .ts .html .css .vue .py .java .json .xml .md | 格式化文本 | 大文件超长行自动拆分 |
| JS 网址转换 | URL | .js / .txt | 受 CORS 限制时需手动下载 |
| 代码批量替换 | 上述代码格式 | 修改后代码 | 支持行号替换与内容查找替换 |

---

## 🔒 隐私与安全

- **纯前端运行**：所有数据处理均在浏览器本地完成，不上传任何服务器
- **本地存储**：使用 `localStorage` / `sessionStorage` 保存设置与收藏，无云端同步
- **PWA 离线可用**：安装后无需网络即可使用全部功能
- **无追踪**：无第三方统计、无 Cookie、无广告

---

## ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + K` / `Cmd + K` | 全局搜索工具 |
| `Esc` | 返回首页 / 关闭弹窗 |
| `Ctrl + S` / `Cmd + S` | 保存当前设置（设置页） |

---

## 🗂️ 项目结构

```
src/
├── assets/                 # 静态资源
├── components/             # 公共组件
│   ├── ToolCard.vue
│   ├── ToolGrid.vue
│   ├── SearchModal.vue
│   └── ...
├── data/
│   └── tools.js            # 工具分类与路由配置
├── i18n/
│   ├── zh.js               # 中文语言包
│   └── en.js               # 英文语言包
├── stores/
│   └── app.js              # Pinia 全局状态（主题、收藏、布局等）
├── tools/                  # 各工具页面组件
│   ├── RenameTool.vue
│   ├── ProofreaderTool.vue
│   ├── CitationTool.vue
│   ├── QrCodeTool.vue
│   ├── ColorPickerTool.vue
│   ├── ImageTool.vue
│   ├── TimerTool.vue
│   ├── RandomTool.vue
│   ├── BarrageTool.vue
│   ├── DailyToolbox.vue    # 计算器（含汇率/生日/进制/颜色）
│   ├── CodeFormatTool.vue  # 代码格式化
│   ├── JsUrlTool.vue       # JS 网址转换
│   └── CodeReplaceTool.vue # 代码批量替换
├── views/
│   ├── HomeView.vue
│   ├── AllToolsView.vue
│   ├── FavView.vue
│   └── SettingsView.vue
├── App.vue
└── main.js
public/
├── manifest.json           # PWA 配置
└── sw.js                   # Service Worker
```

---

## 🛠️ 技术栈

- **Vue 3** — Composition API + `<script setup>`
- **Vite 5** — 极速构建与 HMR
- **Pinia** — 状态管理
- **vue-i18n** — 国际化
- **vite-plugin-pwa** — PWA 支持（离线缓存、Service Worker）
- **docx.js** — 引用助手 Word 导出
- **pako / jszip** — 图片压缩
- **qrcode.vue** — 二维码生成

---

## 💡 使用提示（踩坑经验）

1. **PWA 安装**：首次访问后点击浏览器地址栏「安装」图标，即可离线使用。iOS 需通过 Safari「添加到主屏幕」。
2. **大文件代码格式化**：minified 文件单行动辄几万字节，浏览器直接渲染会卡死。上传后工具自动检测最长行字节数，超过 2000 字节会提示拆分，建议设置 500~1000 字节/行。
3. **JS 网址转换 CORS**：如果目标 CDN 禁止跨域（如 GitHub raw），会提示下载后使用「代码格式化」查看，这是浏览器安全限制，非工具问题。
4. **代码批量替换行号偏移**：多处行号替换时，工具会自动按从后往前的顺序执行，避免前面的替换导致后面行号错位。内容替换时如果同一内容出现多次，会弹出面板让你勾选具体位置。
5. **数据备份**：所有收藏和自定义分类存在浏览器本地，清除缓存或换设备会丢失，重要数据建议定期导出备份。
6. **科学计算器隐藏**：手机端屏幕较窄，科学模式自动隐藏，iPad / Mac / 电脑端才会显示完整科学键盘。
7. **引用助手自动标注**：粘贴论文正文后，输入被引用的原文片段可自动定位插入引用标记；如果片段有微小差异，会尝试模糊匹配并提示。
8. **主题色自定义**：支持任意 HEX 色值，推荐开启「护眼色」快速获取低饱和舒适配色。

---

## 📄 License

MIT
