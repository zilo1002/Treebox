﻿export const MAX_SIZE = 200 * 1024 * 1024;

/* ============================================================
   GitHub Raw 镜像源配置
   ============================================================ */
export const RAW_MIRRORS = {
  github:   { name: 'GitHub (官方)', url: 'https://raw.githubusercontent.com' },
  ghproxy:  { name: 'GHProxy', url: 'https://ghproxy.com/https://raw.githubusercontent.com' },
  mirrorgh: { name: 'Mirror.gh', url: 'https://mirror.ghproxy.com/https://raw.githubusercontent.com' },
  fastgit:  { name: 'FastGit', url: 'https://raw.fastgit.org' },
};

export function getRawMirror() {
  const saved = localStorage.getItem('formathub-raw-mirror');
  return saved && RAW_MIRRORS[saved] ? saved : 'github';
}

export function setRawMirror(key) {
  localStorage.setItem('formathub-raw-mirror', key);
}

/* ============================================================
   下载断点续传 IndexedDB
   ============================================================ */
const DB_NAME = 'FormatHubDB';
const DB_VERSION = 1;
const STORE_NAME = 'downloads';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function getDownloadProgress(id) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch { return null; }
}

export async function saveDownloadProgress(id, data) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ id, ...data, timestamp: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch { /* ignore */ }
}

export async function clearDownloadProgress(id) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch { /* ignore */ }
}

export const I18N = {
  zh: {
    appName: 'FormatHub',
    appSubtitle: '多格式转换中心',
    selectType: '选择转换类型',
    selectTypeDesc: '点击分类进入，上传文件即可自动识别并转换',
    localProcess: '本地处理',
    localProcessDesc: '不上传服务器',
    fastConvert: '极速转换',
    fastConvertDesc: '浏览器直接处理',
    allPlatform: '全平台',
    allPlatformDesc: '手机/平板/电脑',
    free: '完全免费',
    freeDesc: '无限制使用',
    formatsCount: '种格式',
    enterConvert: '进入转换',
    clickOrDrag: '点击或拖拽上传文件',
    maxSize: '最大 200MB',
    supportedFormats: '支持的转换格式',
    convertTo: '转换为：',
    notSupported: '暂不支持转换此格式',
    startConvert: '开始转换',
    converting: '转换中...',
    done: '已完成',
    failed: '失败',
    previewFirst500: '前 500 字预览',
    previewFirst10: '前 10 行预览',
    archivePreview: '压缩包内容预览',
    batchSet: '批量设置：',
    applyToAll: '应用到全部',
    batchApplied: '已批量设置',
    files: '个文件的目标格式',
    original: '原',
    newSize: '新',
    footer: 'FormatHub · 纯前端多格式转换工具',
    footerDesc: '支持 40+ 格式 · 最大 200MB · 本地处理',
    pasteHint: 'Ctrl+V 粘贴截图/文件',
    mergeFiles: '合并文件',
    mergeTo: '合并为',
    customName: '输出文件名',
    imageQuality: '图片质量',
    imageWidth: '宽度(px)',
    imageHeight: '高度(px)',
    imageRotate: '旋转',
    formatJSON: 'JSON 格式化',
    beautify: '美化',
    compress: '压缩',
    validate: '校验',
    validateOk: 'JSON 格式正确',
    validateFail: 'JSON 语法错误',
    langSwitch: '语言',
    offlineReady: '已支持离线使用',
    fileCount: '个文件',
    mergeOrder: '按上传顺序合并',
    remove: '删除',
    download: '下载',
    // === GitHub / Release / Gitee ===
    newBadge: '新功能',
    githubDesc: '粘贴 GitHub 文件/文件夹链接，直接下载到本地',
    githubSubtitle: '支持文件和文件夹 ZIP 打包下载',
    githubUrlLabel: 'GitHub 链接',
    githubUrlHint: '支持 blob 文件链接和 tree 文件夹链接',
    githubFetching: '正在获取文件列表...',
    githubProgress: '已下载 {done}/{total} · {name}',
    githubZipSuccess: '打包完成：{done}/{total} 个文件',
    githubRateHint: 'API 剩余：{remain}/{limit} 次/小时',
    githubNoteTitle: '使用说明',
    githubNote1: '文件链接（blob）直接下载，不消耗 API 配额',
    githubNote2: '文件夹链接（tree）需要调用 GitHub API 获取文件列表',
    githubNote3: '文件夹下载会自动打包为 ZIP 格式',
    githubNote4: '如遇到速率限制，请等待 1 小时后重试',
    githubNote5: '下载后部分文件会在浏览器中预览，请点击分享按钮保存到本地文件管理',
    downloadMode: '下载模式',
    modeZip: 'ZIP 打包（保留文件夹结构）',
    modeFlat: '纯文件下载（扁平化）',
    pathHandling: '路径处理',
    keepPath: '保留路径信息（path_to_file.ext）',
    nameOnly: '仅文件名（自动处理重名）',
    githubFlatSuccess: '扁平化打包完成：{done}/{total} 个文件',
    downloadSuccess: '下载成功',
    downloadCancelled: '已取消',
    downloadFailed: '下载失败',
    enterUrl: '请输入链接',
    invalidGitHubUrl: '无效的 GitHub 链接',
    invalidGiteeUrl: '无效的 Gitee 链接',
    paste: '粘贴',
    pasteFailed: '剪贴板内容无效',
    mirrorSource: '镜像源',
    mirrorGithub: 'GitHub（官方）',
    mirrorGHProxy: 'GHProxy',
    mirrorMirrorGH: 'Mirror.gh',
    mirrorFastGit: 'FastGit',
    resumeDownload: '继续下载',
    resumeFound: '发现未完成的下载，已下载 {done}/{total}，是否继续？',
    releaseDownload: 'Release 下载',
    releaseUrlLabel: '仓库地址',
    releaseUrlHint: '如：github.com/owner/repo',
    releaseFetch: '获取 Release 列表',
    releaseListTitle: 'Release 资产',
    releaseAssetSize: '大小',
    releaseNoAssets: '暂无资产',
    releaseFetchFailed: '获取 Release 失败',
    giteeUrlLabel: 'Gitee 链接',
    giteeUrlHint: '支持 Gitee 文件和文件夹链接',
    platformGithub: 'GitHub',
    platformGitee: 'Gitee',
    switchPlatform: '切换平台',
        close: '关闭',
    zipExtract: 'ZIP 内容提取',
    clearCompleted: '清理已完成',
    cleared: '已清理 {count} 个文件缓存',
    autoCleaned: '自动释放 {count} 个旧缓存',
    loadingLibs: '正在加载必要库...',
    libsReady: '库加载完成',
    selectAll: '全选',
    deselectAll: '取消全选',
    selectedCount: '已选择 {count} 个',
    downloadAll: '下载全部',
    compressAll: '压缩全部',
    compressDownload: '压缩下载',
    mergeDownload: '合并下载',
    compressMergeDownload: '压缩合并下载',
    // === PDF 工具箱 ===
    pdfToolSelect: '选择工具',
    pdfSplit: 'PDF 拆分',
    pdfMerge: 'PDF 合并',
    pdfWatermark: 'PDF 水印',
    pdfEncrypt: 'PDF 加密',
    pageRange: '页码范围',
    pageRangeHint: '如：1-5, 8, 10-12',
    split: '拆分',
    merge: '合并',
    applyWatermark: '添加水印',
    applyEncrypt: '加密',
    watermarkText: '水印文字',
    fontSize: '字号',
    opacity: '透明度',
    position: '位置',
    rotation: '旋转角度',
    password: '密码',
    rememberPassword: '记住密码（当前会话）',
    passwordSet: '已设置密码',
    clearPassword: '清除密码',
    watermarkHint: '仅限英文/数字，中文 PDF 可能显示异常',
    dragToSort: '拖拽排序',
    pageCount: '页',
    mergeWarning: '超过 500 页，处理可能较慢',
    result: '处理结果',
    noFiles: '请先上传文件',
    enterPageRange: '请输入页码范围',
    needTwoFiles: '请至少上传 2 个 PDF 文件',
    enterWatermarkText: '请输入水印文字',
    enterPassword: '请输入密码',
    splitResult: '拆分结果',
    mergeResult: '合并结果',
    watermarkResult: '水印结果',
    encryptResult: '加密结果',
  },
  en: {
    appName: 'FormatHub',
    appSubtitle: 'Multi-Format Converter',
    selectType: 'Select Conversion Type',
    selectTypeDesc: 'Click a category, upload files to auto-detect and convert',
    localProcess: 'Local Processing',
    localProcessDesc: 'No server upload',
    fastConvert: 'Fast Conversion',
    fastConvertDesc: 'Browser native processing',
    allPlatform: 'All Platforms',
    allPlatformDesc: 'Mobile/Tablet/Desktop',
    free: 'Completely Free',
    freeDesc: 'Unlimited usage',
    formatsCount: ' formats',
    enterConvert: 'Enter',
    clickOrDrag: 'Click or drag to upload',
    maxSize: 'Max 200MB',
    supportedFormats: 'Supported Formats',
    convertTo: 'Convert to:',
    notSupported: 'Format not supported',
    startConvert: 'Start Conversion',
    converting: 'Converting...',
    done: 'Done',
    failed: 'Failed',
    previewFirst500: 'First 500 chars preview',
    previewFirst10: 'First 10 rows preview',
    archivePreview: 'Archive contents preview',
    batchSet: 'Batch:',
    applyToAll: 'Apply to All',
    batchApplied: 'Batch applied to',
    files: ' files',
    original: 'Orig',
    newSize: 'New',
    footer: 'FormatHub · Browser-based File Converter',
    footerDesc: '40+ formats · Max 200MB · Local processing',
    pasteHint: 'Ctrl+V to paste screenshot/file',
    mergeFiles: 'Merge Files',
    mergeTo: 'Merge to',
    customName: 'Output filename',
    imageQuality: 'Image Quality',
    imageWidth: 'Width(px)',
    imageHeight: 'Height(px)',
    imageRotate: 'Rotate',
    formatJSON: 'JSON Formatter',
    beautify: 'Beautify',
    compress: 'Compress',
    validate: 'Validate',
    validateOk: 'Valid JSON',
    validateFail: 'Invalid JSON syntax',
    langSwitch: 'Language',
    offlineReady: 'Offline support ready',
    fileCount: ' files',
    mergeOrder: 'Merge in upload order',
    remove: 'Remove',
    download: 'Download',
    // === GitHub / Release / Gitee ===
    newBadge: 'NEW',
    githubDesc: 'Paste GitHub file/folder link to download locally',
    githubSubtitle: 'Supports file and folder ZIP download',
    githubUrlLabel: 'GitHub URL',
    githubUrlHint: 'Supports blob file links and tree folder links',
    githubFetching: 'Fetching file list...',
    githubProgress: 'Downloaded {done}/{total} · {name}',
    githubZipSuccess: 'Packaged: {done}/{total} files',
    githubRateHint: 'API remaining: {remain}/{limit} per hour',
    githubNoteTitle: 'Instructions',
    githubNote1: 'File links (blob) download directly, no API quota used',
    githubNote2: 'Folder links (tree) require GitHub API to list files',
    githubNote3: 'Folder downloads are automatically packaged as ZIP',
    githubNote4: 'If rate limited, please wait 1 hour and retry',
    githubNote5: 'Some files may open in browser preview after download; tap Share to save to local file manager',
    downloadMode: 'Download Mode',
    modeZip: 'ZIP Package (keep folder structure)',
    modeFlat: 'Flat File Download',
    pathHandling: 'Path Handling',
    keepPath: 'Keep path info (path_to_file.ext)',
    nameOnly: 'Filename only (auto-rename duplicates)',
    githubFlatSuccess: 'Flat package done: {done}/{total} files',
    downloadSuccess: 'Download successful',
    downloadCancelled: 'Cancelled',
    downloadFailed: 'Download failed',
    enterUrl: 'Please enter URL',
    invalidGitHubUrl: 'Invalid GitHub URL',
    invalidGiteeUrl: 'Invalid Gitee URL',
    paste: 'Paste',
    pasteFailed: 'Clipboard content invalid',
    mirrorSource: 'Mirror Source',
    mirrorGithub: 'GitHub (Official)',
    mirrorGHProxy: 'GHProxy',
    mirrorMirrorGH: 'Mirror.gh',
    mirrorFastGit: 'FastGit',
    resumeDownload: 'Resume Download',
    resumeFound: 'Found unfinished download: {done}/{total}, resume?',
    releaseDownload: 'Release Download',
    releaseUrlLabel: 'Repository URL',
    releaseUrlHint: 'e.g. github.com/owner/repo',
    releaseFetch: 'Fetch Release List',
    releaseListTitle: 'Release Assets',
    releaseAssetSize: 'Size',
    releaseNoAssets: 'No assets available',
    releaseFetchFailed: 'Failed to fetch releases',
    giteeUrlLabel: 'Gitee URL',
    giteeUrlHint: 'Supports Gitee file and folder links',
    platformGithub: 'GitHub',
    platformGitee: 'Gitee',
    switchPlatform: 'Switch Platform',
        close: 'Close',
    zipExtract: 'ZIP Contents',
    clearCompleted: 'Clear Completed',
    cleared: 'Cleared {count} file caches',
    autoCleaned: 'Auto-released {count} old caches',
    loadingLibs: 'Loading required libraries...',
    libsReady: 'Libraries ready',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    selectedCount: '{count} selected',
    downloadAll: 'Download All',
    compressAll: 'Compress All',
    compressDownload: 'Compress Download',
    mergeDownload: 'Merge Download',
    compressMergeDownload: 'Compress Merge',
    // === PDF Toolbox ===
    pdfToolSelect: 'Select Tool',
    pdfSplit: 'PDF Split',
    pdfMerge: 'PDF Merge',
    pdfWatermark: 'PDF Watermark',
    pdfEncrypt: 'PDF Encrypt',
    pageRange: 'Page Range',
    pageRangeHint: 'e.g. 1-5, 8, 10-12',
    split: 'Split',
    merge: 'Merge',
    applyWatermark: 'Apply Watermark',
    applyEncrypt: 'Encrypt',
    watermarkText: 'Watermark Text',
    fontSize: 'Font Size',
    opacity: 'Opacity',
    position: 'Position',
    rotation: 'Rotation',
    password: 'Password',
    rememberPassword: 'Remember password (this session)',
    passwordSet: 'Password set',
    clearPassword: 'Clear password',
    watermarkHint: 'English/numbers only; Chinese may not display correctly',
    dragToSort: 'Drag to sort',
    pageCount: ' pages',
    mergeWarning: 'Over 500 pages, processing may be slow',
    result: 'Result',
    noFiles: 'Please upload files first',
    enterPageRange: 'Please enter page range',
    needTwoFiles: 'Please upload at least 2 PDF files',
    enterWatermarkText: 'Please enter watermark text',
    enterPassword: 'Please enter password',
    splitResult: 'Split Result',
    mergeResult: 'Merge Result',
    watermarkResult: 'Watermark Result',
    encryptResult: 'Encrypted Result',
  }
};

let currentLang = localStorage.getItem('formathub-lang') || 'zh';
export function t(key) { return I18N[currentLang]?.[key] || I18N['zh'][key] || key; }
export function setLang(lang) { currentLang = lang; localStorage.setItem('formathub-lang', lang); }
export function getLang() { return currentLang; }

export const CATEGORIES = {
  document: {
    id: 'document',
    emoji: '📄',
    title: '文档与办公文件',
    titleEn: 'Documents & Office',
    desc: 'Word、Excel、PPT、PDF 等办公格式互转',
    descEn: 'Word, Excel, PPT, PDF conversion',
    color: 'blue',
    bgGradient: 'from-blue-500/20 to-cyan-500/10',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400',
    dotColor: 'bg-blue-400',
    accept: '.doc,.docx,.txt,.rtf,.odt,.pdf,.md,.pages,.xls,.xlsx,.csv,.ods,.xlsm,.ppt,.pptx,.odp,.key',
    exts: ['doc','docx','txt','rtf','odt','pdf','md','pages','xls','xlsx','csv','ods','xlsm','ppt','pptx','odp','key'],
    targets: {
      docx: { label: 'Word 文档', labelEn: 'Word Doc', ext: 'docx' },
      doc: { label: 'Word 97-2003', labelEn: 'Word 97-2003', ext: 'doc' },
      txt: { label: '纯文本', labelEn: 'Plain Text', ext: 'txt' },
      md: { label: 'Markdown', labelEn: 'Markdown', ext: 'md' },
      html: { label: 'HTML 网页', labelEn: 'HTML', ext: 'html' },
      pdf: { label: 'PDF 文档', labelEn: 'PDF', ext: 'pdf' },
      csv: { label: 'CSV 表格', labelEn: 'CSV', ext: 'csv' },
      json: { label: 'JSON 数据', labelEn: 'JSON', ext: 'json' },
      xlsx: { label: 'Excel 表格', labelEn: 'Excel', ext: 'xlsx' }
    }
  },
  image: {
    id: 'image',
    emoji: '🖼️',
    title: '图像与图片',
    titleEn: 'Images',
    desc: 'JPG、PNG、WebP、GIF、SVG 等格式互转',
    descEn: 'JPG, PNG, WebP, GIF, SVG conversion',
    color: 'purple',
    bgGradient: 'from-purple-500/20 to-pink-500/10',
    borderColor: 'border-purple-500/30',
    textColor: 'text-purple-400',
    dotColor: 'bg-purple-400',
    accept: '.jpg,.jpeg,.png,.gif,.bmp,.webp,.tiff,.tif,.heic,.avif,.svg',
    exts: ['jpg','jpeg','png','gif','bmp','webp','tiff','tif','heic','avif','svg'],
    targets: {
      png: { label: 'PNG 图片', labelEn: 'PNG', ext: 'png' },
      jpg: { label: 'JPEG 图片', labelEn: 'JPEG', ext: 'jpg' },
      webp: { label: 'WebP 图片', labelEn: 'WebP', ext: 'webp' },
      gif: { label: 'GIF 动图', labelEn: 'GIF', ext: 'gif' },
      bmp: { label: 'BMP 图片', labelEn: 'BMP', ext: 'bmp' }
    }
  },
  ebook: {
    id: 'ebook',
    emoji: '📚',
    title: '电子书',
    titleEn: 'E-Books',
    desc: 'EPUB、MOBI、AZW3 等电子书格式转换',
    descEn: 'EPUB, MOBI, AZW3 conversion',
    color: 'amber',
    bgGradient: 'from-amber-500/20 to-orange-500/10',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-400',
    dotColor: 'bg-amber-400',
    accept: '.epub,.mobi,.azw3,.pdf',
    exts: ['epub','mobi','azw3','pdf'],
    targets: {
      txt: { label: '纯文本', labelEn: 'Plain Text', ext: 'txt' },
      html: { label: 'HTML 网页', labelEn: 'HTML', ext: 'html' }
    }
  },
  data: {
    id: 'data',
    emoji: '💾',
    title: '数据与压缩包',
    titleEn: 'Data & Archives',
    desc: 'JSON、CSV、XML、YAML 等数据格式互转',
    descEn: 'JSON, CSV, XML, YAML conversion',
    color: 'emerald',
    bgGradient: 'from-emerald-500/20 to-teal-500/10',
    borderColor: 'border-emerald-500/30',
    textColor: 'text-emerald-400',
    dotColor: 'bg-emerald-400',
    accept: '.json,.xml,.csv,.yaml,.yml,.toml,.zip,.rar,.7z',
    exts: ['json','xml','csv','yaml','yml','toml','zip','rar','7z'],
    targets: {
      json: { label: 'JSON', labelEn: 'JSON', ext: 'json' },
      xml: { label: 'XML', labelEn: 'XML', ext: 'xml' },
      csv: { label: 'CSV', labelEn: 'CSV', ext: 'csv' },
      yaml: { label: 'YAML', labelEn: 'YAML', ext: 'yaml' },
      toml: { label: 'TOML', labelEn: 'TOML', ext: 'toml' },
      zip: { label: 'ZIP 压缩包', labelEn: 'ZIP Archive', ext: 'zip' }
    }
  },
  pdf: {
    id: 'pdf',
    emoji: '📕',
    title: 'PDF 工具箱',
    titleEn: 'PDF Toolbox',
    desc: 'PDF 拆分、合并、水印、密码保护',
    descEn: 'PDF split, merge, watermark, encrypt',
    color: 'red',
    bgGradient: 'from-red-500/20 to-orange-500/10',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-400',
    dotColor: 'bg-red-400',
    accept: '.pdf',
    exts: ['pdf'],
    targets: {}
  }
};

export const SUPPORTED_MATRIX = {
  document: {
    docx:  ['txt','md','html','pdf'],
    xlsx:  ['csv','json','html','xlsx'],
    xls:   ['csv','json','html','xlsx'],
    csv:   ['csv','json','html','xlsx'],
    ods:   ['csv','json','html','xlsx'],
    txt:   ['txt','md','html','pdf','docx'],
    md:    ['txt','md','html','pdf','docx','doc'],
    html:  ['txt','md','html','docx'],
    pdf:   [],
    doc:   [],
    rtf:   [],
    odt:   [],
    pages: [],
    ppt:   [],
    pptx:  [],
    odp:   [],
    key:   [],
    xlsm:  []
  },
  image: {
    jpg:   ['png','jpg','webp','gif','bmp'],
    jpeg:  ['png','jpg','webp','gif','bmp'],
    png:   ['png','jpg','webp','gif','bmp'],
    gif:   ['png','jpg','webp','gif','bmp'],
    bmp:   ['png','jpg','webp','gif','bmp'],
    webp:  ['png','jpg','webp','gif','bmp'],
    tiff:  ['png','jpg','webp','gif','bmp'],
    tif:   ['png','jpg','webp','gif','bmp'],
    svg:   ['png','jpg','webp','bmp'],
    heic:  [],
    avif:  []
  },
  ebook: {
    epub:  ['txt','html'],
    mobi:  ['txt'],
    azw3:  ['txt'],
    pdf:   []
  },
  data: {
    json:  ['json','xml','csv','yaml','toml'],
    xml:   ['json','xml','csv','yaml','toml'],
    csv:   ['json','xml','csv','yaml','toml'],
    yaml:  ['json','xml','csv','yaml','toml'],
    yml:   ['json','xml','csv','yaml','toml'],
    toml:  ['json','xml','csv','yaml','toml'],
    zip:   ['zip'],
    rar:   [],
    '7z':  []
  }
};

export function getSupportedTargets(catId, filename) {
  const ext = getExt(filename);
  const matrix = SUPPORTED_MATRIX[catId];
  return matrix ? (matrix[ext] || []) : [];
}

export function getExt(name) { return name.split('.').pop().toLowerCase(); }
export function getCat(name) {
  const e = getExt(name);
  for (const [c, info] of Object.entries(CATEGORIES)) if (info.exts.includes(e)) return c;
  return null;
}
export function fmtSize(b) {
  if (!b) return '0 B';
  const u = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(b)/Math.log(1024));
  return (b/Math.pow(1024,i)).toFixed(1)+' '+u[i];
}
export function dlBlob(blob, name) {
  const ext = name.split('.').pop().toLowerCase();
  const textExts = ['js','ts','jsx','tsx','mjs','cjs','md','txt','json','xml','html','htm','css','scss','sass','less','yaml','yml','toml','csv','vue','py','java','c','cpp','h','hpp','go','rs','rb','php','sh','bash','zsh','bat','cmd','ps1','sql','dart','kt','swift','r','lua','scala','groovy','pl','ini','conf','log','dockerfile','makefile','gitignore'];
  const isText = textExts.includes(ext);

  let finalBlob;
  if (isText) {
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    finalBlob = new Blob([bom, blob], { type: 'application/octet-stream' });
  } else {
    finalBlob = blob.type ? new Blob([blob], { type: 'application/octet-stream' }) : blob;
  }

  const url = URL.createObjectURL(finalBlob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
export function readAB(file) { return new Promise((r,j)=>{const R=new FileReader();R.onload=e=>r(e.target.result);R.onerror=j;R.readAsArrayBuffer(file);}); }
export function readText(file) { return new Promise((r,j)=>{const R=new FileReader();R.onload=e=>r(e.target.result);R.onerror=j;R.readAsText(file);}); }
export function readData(file) { return new Promise((r,j)=>{const R=new FileReader();R.onload=e=>r(e.target.result);R.onerror=j;R.readAsDataURL(file);}); }
export function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
