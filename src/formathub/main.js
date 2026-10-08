import {
  MAX_SIZE, CATEGORIES, getExt, getCat,
  fmtSize, dlBlob, sleep, readAB, readText,
  getSupportedTargets, t, setLang, getLang
} from './utils.js';
import { convImage } from './converters/image.js';
import { convData } from './converters/data.js';
import { convDoc, mergeDocs } from './converters/document.js';
import { convArchive } from './converters/archive.js';
import { convEbook } from './converters/ebook.js';
import { splitPDF, mergePDF, watermarkPDF, encryptPDF } from './converters/pdf.js';
import { formatJSON } from './converters/format.js';
import { parseGitHubUrl, isGitHubUrl, checkRateLimit, downloadGitHubFile, downloadGitHubFolder, downloadGitHubFolderFlat, parseReleaseUrl, isReleaseUrl, fetchReleases, downloadReleaseAsset, getDefaultBranch } from './converters/github.js';
import { parseGiteeUrl, isGiteeUrl, downloadGiteeFile, downloadGiteeFolder, downloadGiteeFolderFlat, getGiteeDefaultBranch } from './converters/gitee.js';
import { RAW_MIRRORS, getRawMirror, setRawMirror, getDownloadProgress, clearDownloadProgress } from './utils.js';

let currentCat = null;
let files = [];
let converting = false;
let imageOpts = { quality: 92, width: '', height: '', rotate: 0 };
let mergeMode = false;
let formatMode = false;
let app = null;
let currentView = 'home';
let lockedView = null; // Treebox 子工具模式：锁定到初始分支，不允许跳回 FormatHub 首页或其它分支
let githubAbortController = null;
let pdfTool = 'split'; // 'split' | 'merge' | 'watermark'
let pdfToolFiles = [];
let pdfOpts = { range: '', watermarkText: '', fontSize: 36, opacity: 0.3, position: 'center', rotation: -30, password: '' };
let pdfResult = null; // { blob, name, info }
let pdfPageCounts = new Map(); // File -> 页数(number) | 'loading' | 'unknown'
let githubPlatform = 'github'; // 'github' | 'gitee'
let releaseAssets = [];

/* ============================================================
   Worker 管理器 + 全局进度 + 内存管理
   ============================================================ */

// Worker 连接池（按分类复用，避免重复加载 CDN）
const workerPool = {
  data: null,
  doc: null,
  ebook: null,

  get(type) {
    if (!this[type]) {
      try {
        this[type] = new Worker(new URL('./workers/' + type + '.worker.js', import.meta.url));
      } catch (e) {
        // 降级：如果 Worker 创建失败，返回 null，主线程处理
        console.warn('Worker creation failed for ' + type + ':', e);
        return null;
      }
    }
    return this[type];
  },

  terminateAll() {
    ['data', 'doc', 'ebook'].forEach(t => {
      if (this[t]) { this[t].terminate(); this[t] = null; }
    });
  }
};

/* ============================================================
   CDN 按需加载系统
   ============================================================ */

const CDN_LIBS = {
  papaparse:   'https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js',
  jsyaml:      'https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js',
  xlsx:        'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  mammoth:     'https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js',
  html2canvas: 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
  jspdf:       'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
  pdflib:      'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js',
  fontkit:     'https://cdn.jsdelivr.net/npm/@pdf-lib/fontkit@1.1.1/dist/fontkit.umd.min.js',
  pdfjs:       'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js',
};

const loadedLibs = new Set();
const loadingPromises = {};

function loadScript(url) {
  if (loadedLibs.has(url)) return Promise.resolve();
  if (loadingPromises[url]) return loadingPromises[url];

  loadingPromises[url] = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = url;
    s.onload = () => { loadedLibs.add(url); resolve(); };
    s.onerror = () => reject(new Error('Failed to load ' + url));
    document.head.appendChild(s);
  });

  return loadingPromises[url];
}

// 按分类加载所需库
const CAT_LIBS = {
  document: ['mammoth', 'html2canvas', 'jspdf'],
  data:     ['papaparse', 'jsyaml', 'xlsx'],
  ebook:    ['jspdf', 'pdflib', 'pdfjs'], // epub<->pdf 在主线程做，需要 jsPDF/PDFLib/pdf.js
  image:    [], // 纯 Canvas，不需要额外库
  archive:  [], // JSZip 已在 index.html 全局加载
  pdf:      ['pdflib'], // 预留阶段二
};

async function loadCategoryLibs(catId) {
  const needed = CAT_LIBS[catId] || [];
  const urls = needed.map(k => CDN_LIBS[k]).filter(Boolean);
  if (!urls.length) return;

  // 显示加载提示
  toast('⏳', t('loadingLibs'));

  await Promise.all(urls.map(loadScript));

  // 初始化 jspdf 全局（jsPDF 库加载后挂在 window.jspdf 上）
  if (needed.includes('jspdf') && window.jspdf) {
    window.jsPDF = window.jspdf.jsPDF;
  }

  toast('✅', t('libsReady'));
}

// 全局进度状态
let globalProgress = { current: 0, total: 0, active: false };

// 转换结果缓存上限
const MAX_CONVERTED_CACHE = 10;

// 内存管理：自动释放最旧的已完成结果
function manageMemory() {
  const done = files.filter(f => f.status === 'done' && f.convertedBlob);
  if (done.length > MAX_CONVERTED_CACHE) {
    const toRelease = done.slice(0, done.length - MAX_CONVERTED_CACHE);
    for (const item of toRelease) {
      item.convertedBlob = null;
      item.convertedSize = null;
    }
    if (toRelease.length > 0) {
      toast('🗑️', t('autoCleaned').replace('{count}', String(toRelease.length)));
    }
  }
}

function render() {
  const view = lockedView || currentView || 'home';
  if (view === 'github') {
    currentCat = null;
    renderGitHubPage();
  } else if (CATEGORIES[view]) {
    currentCat = view;
    mergeMode = false;
    formatMode = false;
    renderCategoryPage(view);
  } else {
    currentCat = null;
    renderHome();
  }
}

function renderHome() {
  // 「选择转换类型」聚合页已删除：每个分支在 Treebox 里是独立子工具，不再提供首页选单
  app.innerHTML = '<div class="view-enter" style="padding:32px 16px;text-align:center;color:var(--text-secondary);font-size:13px;line-height:1.6">请从 Treebox 里选择一个具体工具</div>';
}


/* ============================================================
   PDF 工具箱专用页面（拆分 / 合并 / 水印）
   密码保护不在这里提供：pdf-lib 在浏览器里无法真正加密，
   现有 encryptPDF 保存出来的文件其实没有 /Encrypt，是假保护，宁可不做。
   ============================================================ */
function renderPdfToolboxPage(cat) {
  const isEn = getLang() === 'en';
  const title = isEn ? cat.titleEn : cat.title;
  const tools = [
    { id: 'split', label: t('pdfSplit'), icon: '✂️' },
    { id: 'merge', label: t('pdfMerge'), icon: '🧩' },
    { id: 'watermark', label: t('pdfWatermark'), icon: '💧' },
    { id: 'encrypt', label: t('pdfEncrypt'), icon: '🔒' },
  ];
  const toolBtns = tools.map(tool =>
    '<button onclick="window.setPdfTool(\'' + tool.id + '\')" class="flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ' +
    (pdfTool === tool.id ? 'bg-red-500/10 border-red-500/40 text-red-400' : 'bg-slate-800/30 border-slate-700/40 text-slate-300') + '">' +
    tool.icon + ' ' + tool.label + '</button>'
  ).join('');

  let optionsHtml = '';
  if (pdfTool === 'split') {
    optionsHtml = '<div class="space-y-2">' +
      '<label class="text-xs text-slate-400 block">' + t('pageRange') + '</label>' +
      '<input type="text" value="' + pdfOpts.range.replace(/"/g, '&quot;') + '" oninput="window.updatePdfOpt(\'range\', this.value)" placeholder="1-5, 8, 10-12" class="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none">' +
      '<p class="text-[10px] text-slate-500">' + t('pageRangeHint') + '</p></div>';
  } else if (pdfTool === 'merge') {
    optionsHtml = '<p class="text-xs text-slate-400">' + t('mergeOrder') + ' · ' + t('needTwoFiles') + '</p>';
  } else if (pdfTool === 'watermark') {
    const positions = ['top-left','top-center','top-right','center-left','center','center-right','bottom-left','bottom-center','bottom-right'];
    const posOpts = positions.map(pos => '<option value="' + pos + '"' + (pdfOpts.position === pos ? ' selected' : '') + '>' + pos + '</option>').join('');
    optionsHtml = '<div class="space-y-3">' +
      '<div><label class="text-xs text-slate-400 block mb-1">' + t('watermarkText') + '</label>' +
      '<input type="text" value="' + pdfOpts.watermarkText.replace(/"/g, '&quot;') + '" oninput="window.updatePdfOpt(\'watermarkText\', this.value)" class="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none"></div>' +
      '<div class="grid grid-cols-2 gap-2">' +
        '<div><label class="text-[10px] text-slate-500 block mb-1">' + t('fontSize') + '</label><input type="number" value="' + pdfOpts.fontSize + '" oninput="window.updatePdfOpt(\'fontSize\', this.value)" class="w-full bg-slate-800 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-slate-200"></div>' +
        '<div><label class="text-[10px] text-slate-500 block mb-1">' + t('opacity') + ' (0.1-0.9)</label><input type="number" step="0.1" min="0.1" max="0.9" value="' + pdfOpts.opacity + '" oninput="window.updatePdfOpt(\'opacity\', this.value)" class="w-full bg-slate-800 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-slate-200"></div>' +
        '<div><label class="text-[10px] text-slate-500 block mb-1">' + t('position') + '</label><select onchange="window.updatePdfOpt(\'position\', this.value)" class="w-full bg-slate-800 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-slate-200">' + posOpts + '</select></div>' +
        '<div><label class="text-[10px] text-slate-500 block mb-1">' + t('rotation') + '</label><input type="number" value="' + pdfOpts.rotation + '" oninput="window.updatePdfOpt(\'rotation\', this.value)" class="w-full bg-slate-800 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-slate-200"></div>' +
      '</div>' +
      '<p class="text-[10px] text-slate-500">' + t('watermarkHint') + '</p></div>';
  } else if (pdfTool === 'encrypt') {
    optionsHtml = '<div class="space-y-2">' +
      '<label class="text-xs text-slate-400 block">' + t('password') + '</label>' +
      '<input type="password" autocomplete="new-password" oninput="window.updatePdfOpt(\'password\', this.value)" placeholder="' + t('enterPassword') + '" class="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none">' +
      '<p class="text-[10px] text-slate-500">AES-256 · 打开文件时需要这个密码，丢了无法找回 · 加密库约 1.3MB，只在加密时加载</p></div>';
  }
  const actionLabel = pdfTool === 'split' ? t('split') : (pdfTool === 'merge' ? t('merge') : (pdfTool === 'encrypt' ? t('applyEncrypt') : t('applyWatermark')));

  app.innerHTML = '<div class="min-h-screen bg-slate-950 view-enter">' +
    '<header class="border-b border-slate-800 glass sticky top-0 z-50">' +
      '<div class="max-w-6xl mx-auto px-4 py-3.5 flex items-center gap-3">' +
        '<div class="flex items-center gap-2.5"><span class="text-2xl">' + cat.emoji + '</span>' +
          '<div><h1 class="text-base font-bold leading-none">' + title + '</h1><p class="text-[10px] text-slate-400 mt-0.5">' + (isEn ? cat.descEn : cat.desc) + '</p></div></div>' +
        '<div class="ml-auto flex items-center gap-1">' +
          '<button onclick="window.switchLang(\'zh\')" class="lang-btn ' + (getLang() === 'zh' ? 'active' : '') + '">中文</button>' +
          '<button onclick="window.switchLang(\'en\')" class="lang-btn ' + (getLang() === 'en' ? 'active' : '') + '">EN</button>' +
        '</div>' +
      '</div>' +
    '</header>' +
    '<main class="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6 w-full">' +
      '<div class="rounded-2xl bg-slate-800/20 border border-slate-700/30 p-4 space-y-3">' +
        '<h3 class="text-sm font-semibold text-slate-300">' + t('pdfToolSelect') + '</h3>' +
        '<div class="flex gap-2">' + toolBtns + '</div>' +
      '</div>' +
      '<div id="pdfDropZone" class="group relative border-2 border-dashed border-slate-600 rounded-2xl bg-slate-800/20 p-8 text-center cursor-pointer">' +
        '<input type="file" id="pdfFileInput" multiple accept=".pdf" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">' +
        '<div class="relative z-0 pointer-events-none"><h3 class="text-base font-semibold mb-1">' + t('clickOrDrag') + '</h3>' +
        '<p class="text-slate-400 text-xs">PDF · ' + t('maxSize') + '</p></div>' +
      '</div>' +
      '<div id="libLoader" class="hidden rounded-xl bg-slate-800/40 border border-slate-700/40 p-3 text-center"><span class="text-xs text-slate-400">' + t('loadingLibs') + '</span></div>' +
      '<div id="pdfFileList" class="space-y-2"></div>' +
      '<div class="rounded-2xl bg-slate-800/20 border border-slate-700/30 p-4">' + optionsHtml + '</div>' +
      '<button onclick="window.runPdfTool()" class="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl text-sm active:scale-[0.98] transition-all">' + actionLabel + '</button>' +
      '<div id="pdfResultArea"></div>' +
    '</main></div>';

  const input = document.getElementById('pdfFileInput');
  if (input) {
    input.addEventListener('change', (e) => {
      const added = Array.from(e.target.files || []).filter(f => /\.pdf$/i.test(f.name));
      for (const f of added) {
        if (f.size > MAX_SIZE) { toast('⚠️', '「' + f.name + '」' + t('maxSize')); continue; }
        pdfToolFiles.push(f);
      }
      pdfResult = null;
      renderPdfFileList();
      renderPdfResultArea();
      updatePdfPageCounts();
      e.target.value = '';
    });
  }
  renderPdfFileList();
  renderPdfResultArea();
}

async function updatePdfPageCounts() {
  const pending = pdfToolFiles.filter(f => !pdfPageCounts.has(f));
  if (!pending.length) return;
  for (const f of pending) pdfPageCounts.set(f, 'loading');
  renderPdfFileList();
  try { await ensureLibsReady('pdf'); } catch { /* 库加载失败时下面会逐个标 unknown */ }
  if (!window.PDFLib) {
    for (const f of pending) pdfPageCounts.set(f, 'unknown');
    renderPdfFileList();
    return;
  }
  for (const f of pending) {
    try {
      const ab = await readAB(f);
      const doc = await window.PDFLib.PDFDocument.load(ab, { ignoreEncryption: true });
      pdfPageCounts.set(f, doc.getPageCount());
    } catch {
      pdfPageCounts.set(f, 'unknown');
    }
    renderPdfFileList();
  }
}

function renderPdfFileList() {
  const el = document.getElementById('pdfFileList');
  if (!el) return;
  if (!pdfToolFiles.length) { el.innerHTML = ''; return; }
  const isEn = getLang() === 'en';
  let html = pdfToolFiles.map((f, idx) => {
    const pc = pdfPageCounts.get(f);
    const pageBadge = pc === 'loading' || pc === undefined
      ? '<span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">' + (isEn ? 'Counting…' : '页数统计中…') + '</span>'
      : pc === 'unknown'
        ? '<span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-500">' + (isEn ? 'Pages unknown' : '页数未知') + '</span>'
        : '<span class="text-[10px] px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400">' + pc + t('pageCount') + '</span>';
    return '<div class="flex items-center gap-2 p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">' +
      '<span class="text-xs text-slate-400 w-6">' + (idx + 1) + '.</span>' +
      '<span class="flex-1 text-xs text-slate-200 truncate">' + f.name + '</span>' +
      pageBadge +
      '<span class="text-[10px] text-slate-500">' + fmtSize(f.size) + '</span>' +
      (pdfTool === 'merge' ? '<button onclick="window.movePdfFile(' + idx + ',-1)" class="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300">↑</button><button onclick="window.movePdfFile(' + idx + ',1)" class="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300">↓</button>' : '') +
      '<button onclick="window.removePdfFile(' + idx + ')" class="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300">' + t('remove') + '</button>' +
    '</div>';
  }).join('');
  if (pdfTool === 'merge' && pdfToolFiles.length > 1) {
    const counts = pdfToolFiles.map(f => pdfPageCounts.get(f));
    if (counts.every(c => typeof c === 'number')) {
      const total = counts.reduce((a, b) => a + b, 0);
      html += '<p class="text-[11px] text-slate-400 px-1">' + (isEn ? 'Total: ' : '合计：') + total + t('pageCount') + (isEn ? ' after merge' : '') + '</p>';
    }
  }
  if (pdfTool === 'split' && pdfToolFiles.length) {
    const pc = pdfPageCounts.get(pdfToolFiles[0]);
    if (typeof pc === 'number') {
      html += '<p class="text-[11px] text-slate-400 px-1">' + (isEn ? 'This PDF has ' + pc + ' pages in total, page range e.g. 1-' + Math.min(pc, 5) : '这个 PDF 共 ' + pc + ' 页，页码范围可填如 1-' + Math.min(pc, 5)) + '</p>';
    }
  }
  el.innerHTML = html;
}

function renderPdfResultArea() {
  const el = document.getElementById('pdfResultArea');
  if (!el) return;
  if (!pdfResult) { el.innerHTML = ''; return; }
  el.innerHTML = '<div class="rounded-2xl bg-slate-800/20 border border-slate-700/30 p-4 space-y-2">' +
    '<h3 class="text-sm font-semibold text-slate-300">' + t('result') + '</h3>' +
    '<p class="text-xs text-slate-400">' + pdfResult.name + ' · ' + fmtSize(pdfResult.blob.size) + (pdfResult.info ? ' · ' + pdfResult.info : '') + '</p>' +
    '<button onclick="window.downloadPdfResult()" class="w-full py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium">' + t('download') + '</button></div>';
}

window.setPdfTool = function(tool) { pdfTool = tool; pdfResult = null; render(); };
window.updatePdfOpt = function(key, value) { pdfOpts[key] = value; };
window.removePdfFile = function(idx) { const removed = pdfToolFiles[idx]; pdfToolFiles.splice(idx, 1); if (removed && !pdfToolFiles.includes(removed)) pdfPageCounts.delete(removed); pdfResult = null; renderPdfFileList(); renderPdfResultArea(); };
window.movePdfFile = function(idx, dir) {
  const next = idx + dir;
  if (next < 0 || next >= pdfToolFiles.length) return;
  const tmp = pdfToolFiles[idx]; pdfToolFiles[idx] = pdfToolFiles[next]; pdfToolFiles[next] = tmp;
  renderPdfFileList();
};
window.downloadPdfResult = function() { if (pdfResult) dlBlob(pdfResult.blob, pdfResult.name); };

window.runPdfTool = async function() {
  try {
    await ensureLibsReady('pdf');
    if (!window.PDFLib) throw new Error(t('loadingLibs'));
    if (pdfTool === 'split') {
      if (!pdfToolFiles.length) throw new Error(t('noFiles'));
      if (!pdfOpts.range.trim()) throw new Error(t('enterPageRange'));
      const file = pdfToolFiles[0];
      const blob = await splitPDF(file, pdfOpts.range.trim());
      pdfResult = { blob, name: file.name.replace(/\.[^.]+$/, '') + '_split.pdf', info: '' };
    } else if (pdfTool === 'merge') {
      if (pdfToolFiles.length < 2) throw new Error(t('needTwoFiles'));
      const order = pdfToolFiles.map((_, i) => i);
      const { blob, totalPages } = await mergePDF(pdfToolFiles, order);
      pdfResult = { blob, name: 'merged.pdf', info: totalPages + ' ' + t('pageCount') };
      if (totalPages > 500) toast('⚠️', t('mergeWarning'));
    } else if (pdfTool === 'watermark') {
      if (!pdfToolFiles.length) throw new Error(t('noFiles'));
      if (!pdfOpts.watermarkText.trim()) throw new Error(t('enterWatermarkText'));
      const file = pdfToolFiles[0];
      const blob = await watermarkPDF(file, {
        text: pdfOpts.watermarkText.trim(),
        fontSize: parseInt(pdfOpts.fontSize, 10) || 36,
        opacity: Math.min(0.9, Math.max(0.1, parseFloat(pdfOpts.opacity) || 0.3)),
        position: pdfOpts.position,
        rotation: parseInt(pdfOpts.rotation, 10) || 0,
      });
      pdfResult = { blob, name: file.name.replace(/\.[^.]+$/, '') + '_watermark.pdf', info: '' };
    } else if (pdfTool === 'encrypt') {
      if (!pdfToolFiles.length) throw new Error(t('noFiles'));
      if (!pdfOpts.password) throw new Error(t('enterPassword'));
      const file = pdfToolFiles[0];
      const blob = await encryptPDF(file, pdfOpts.password);
      pdfOpts.password = '';
      pdfResult = { blob, name: file.name.replace(/\.[^.]+$/, '') + '_encrypted.pdf', info: 'AES-256' };
    }
    renderPdfResultArea();
    toast('✅', t('done'));
  } catch (err) {
    toast('❌', err.message || t('failed'));
  }
};


async function renderCategoryPage(catId) {
  const cat = CATEGORIES[catId];
  if (catId === 'pdf') { renderPdfToolboxPage(cat); return; }
  const isEn = getLang() === 'en';
  const title = isEn ? cat.titleEn : cat.title;
  const desc = isEn ? cat.descEn : cat.desc;

  let matrixHtml = '';
  const matrixData = {
    document: [
      { from: 'DOCX', to: 'TXT, Markdown, HTML, PDF', icon: '📝' },
      { from: 'XLSX / XLS / CSV / ODS', to: 'CSV, JSON, HTML, XLSX', icon: '📊' },
      { from: 'TXT / Markdown', to: 'PDF, HTML, DOCX', icon: '📄' }
    ],
    image: [
      { from: 'JPG / JPEG / PNG / GIF / WebP', to: '互转全部格式', icon: '🖼️' },
      { from: 'SVG 矢量图', to: 'PNG, JPG, WebP', icon: '✏️' }
    ],
    ebook: [
      { from: 'EPUB', to: 'TXT, HTML, PDF', icon: '📖' },
      { from: 'MOBI / AZW3', to: 'TXT', icon: '📱' },
      { from: 'PDF', to: 'EPUB, TXT, HTML', icon: '📕' }
    ],
    data: [
      { from: 'JSON / XML / CSV / YAML / YML', to: '互转全部格式', icon: '{ }' },
      { from: 'ZIP', to: '提取内容 / 重新打包', icon: '📦' }
    ]
  };
  const items = matrixData[catId] || [];
  for (const item of items) {
    const iconBg = item.warn ? 'bg-red-500/10 text-red-400' : 'bg-'+cat.color+'-500/10 '+cat.textColor;
    const borderClass = item.warn ? 'border-red-500/10' : 'border-slate-700/20';
    const toText = item.warn ? '<span class="text-red-400 text-[10px]">'+item.to+'</span>' : '<span class="text-slate-300 text-[10px]">'+item.to+'</span>';
    matrixHtml += '<div class="flex items-start gap-3 p-3 rounded-xl bg-slate-900/30 border '+borderClass+'">'+
      '<div class="w-8 h-8 rounded-lg '+iconBg+' flex items-center justify-center text-sm shrink-0 mt-0.5">'+item.icon+'</div>'+
      '<div class="flex-1 min-w-0">'+
        '<p class="text-xs font-medium text-slate-300 mb-1">'+item.from+'</p>'+toText+
      '</div>'+
    '</div>';
  }

  // 图片高级处理控件
  let imageControls = '';
  if (catId === 'image') {
    imageControls = '<div class="rounded-2xl bg-slate-800/20 border border-slate-700/30 p-4 space-y-3">'+
      '<h3 class="text-sm font-semibold text-slate-300">'+t('imageQuality')+'</h3>'+
      '<div class="flex items-center gap-3">'+
        '<input type="range" id="imgQuality" min="10" max="100" value="'+imageOpts.quality+'" class="range-slider flex-1" oninput="window.updateImgQuality(this.value)">'+
        '<span id="imgQualityVal" class="text-xs text-slate-400 w-10 text-right">'+imageOpts.quality+'%</span>'+
      '</div>'+
      '<div class="grid grid-cols-3 gap-2">'+
        '<div><label class="text-[10px] text-slate-500 block mb-1">'+t('imageWidth')+'</label><input type="number" id="imgWidth" value="'+imageOpts.width+'" placeholder="auto" class="w-full bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-xs text-slate-200 focus:border-'+cat.color+'-500 focus:outline-none" onchange="window.updateImgWidth(this.value)"></div>'+
        '<div><label class="text-[10px] text-slate-500 block mb-1">'+t('imageHeight')+'</label><input type="number" id="imgHeight" value="'+imageOpts.height+'" placeholder="auto" class="w-full bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-xs text-slate-200 focus:border-'+cat.color+'-500 focus:outline-none" onchange="window.updateImgHeight(this.value)"></div>'+
        '<div><label class="text-[10px] text-slate-500 block mb-1">'+t('imageRotate')+'</label><select id="imgRotate" class="w-full bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-xs text-slate-200 focus:border-'+cat.color+'-500 focus:outline-none" onchange="window.updateImgRotate(this.value)"><option value="0">0°</option><option value="90">90°</option><option value="180">180°</option><option value="270">270°</option></select></div>'+
      '</div>'+
    '</div>';
  }

  // 文档合并按钮
  let mergeBtn = '';
  if (catId === 'document') {
    mergeBtn = '<button id="mergeToggle" onclick="window.toggleMergeMode()" class="w-full py-2.5 rounded-xl border border-'+cat.color+'-500/30 text-'+cat.color+'-400 hover:bg-'+cat.color+'-500/10 transition-all text-sm font-medium flex items-center justify-center gap-2">'+
      '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"/></svg>'+
      t('mergeFiles')+
    '</button>';
  }

  // JSON 格式化按钮
  let formatBtn = '';
  if (catId === 'data') {
    formatBtn = '<button id="formatToggle" onclick="window.toggleFormatMode()" class="w-full py-2.5 rounded-xl border border-'+cat.color+'-500/30 text-'+cat.color+'-400 hover:bg-'+cat.color+'-500/10 transition-all text-sm font-medium flex items-center justify-center gap-2">'+
      '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>'+
      t('formatJSON')+
    '</button>';
  }

  app.innerHTML = '<div class="min-h-screen bg-slate-950 view-enter">'+
    '<header class="border-b border-slate-800 glass sticky top-0 z-50">'+
      '<div class="max-w-6xl mx-auto px-4 py-3.5 flex items-center gap-3">'+

        '<div class="flex items-center gap-2.5">'+
          '<span class="text-2xl">'+cat.emoji+'</span>'+
          '<div><h1 class="text-base font-bold leading-none">'+title+'</h1><p class="text-[10px] text-slate-400 mt-0.5">'+desc+'</p></div>'+
        '</div>'+
        '<div class="ml-auto flex items-center gap-1">'+
          '<button onclick="window.switchLang(\'zh\')" class="lang-btn '+(getLang()==='zh'?'active':'')+'">中文</button>'+
          '<button onclick="window.switchLang(\'en\')" class="lang-btn '+(getLang()==='en'?'active':'')+'">EN</button>'+
        '</div>'+
      '</div>'+
    '</header>'+
    '<div id="globalProgress" class="fixed top-0 left-0 right-0 z-50 hidden">'+
      '<div class="h-1 bg-slate-800">'+
        '<div id="globalProgressBar" class="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300" style="width:0%"></div>'+
      '</div>'+
      '<div id="globalProgressText" class="text-center text-[10px] text-slate-400 py-1 bg-slate-900/90 backdrop-blur-sm border-b border-slate-800"></div>'+
    '</div>'+
    '<main class="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6 w-full">'+
      '<div id="dropZone" class="group relative border-2 border-dashed border-slate-600 rounded-2xl bg-slate-800/20 hover:bg-slate-800/40 hover:border-'+cat.color+'-500/40 active:border-'+cat.color+'-500 transition-all duration-300 p-8 sm:p-12 text-center cursor-pointer">'+
        '<input type="file" id="fileInput" multiple class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" accept="'+cat.accept+'">'+
        '<div class="relative z-0 pointer-events-none">'+
          '<div class="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-700/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">'+
            '<svg class="w-7 h-7 text-'+cat.color+'-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>'+
          '</div>'+
          '<h3 class="text-base font-semibold mb-1">'+t('clickOrDrag')+'</h3>'+
          '<p class="text-slate-400 text-xs mb-3">'+cat.exts.join('、')+' · '+t('maxSize')+'</p>'+
          '<div class="flex flex-wrap justify-center gap-1.5">'+cat.exts.slice(0,8).map(e=>'<span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-500 uppercase">'+e+'</span>').join('')+'</div>'+
          '<p class="paste-hint text-[10px] text-'+cat.color+'-400 mt-3 font-medium">'+t('pasteHint')+'</p>'+
        '</div>'+
      '</div>'+
      '<div id="libLoader" class="hidden rounded-xl bg-slate-800/40 border border-slate-700/40 p-3 flex items-center justify-center gap-2">'+
        '<span class="inline-block w-4 h-4 border-2 border-' + cat.color + '-400 border-t-transparent rounded-full animate-spin"></span>'+
        '<span class="text-xs text-slate-400">' + t('loadingLibs') + '</span>'+
      '</div>'+
      '<div class="rounded-2xl bg-slate-800/20 border border-slate-700/30 p-4 sm:p-5 overflow-hidden">'+
        '<h3 class="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 flex items-center gap-2">'+
          '<svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>'+
          t('supportedFormats')+
        '</h3>'+
        '<div class="space-y-2.5">'+matrixHtml+'</div>'+
      '</div>'+
      imageControls +
      mergeBtn +
      formatBtn +
      '<div id="mergeArea" class="hidden rounded-2xl p-4 space-y-3">'+
        '<div class="flex items-center gap-2">'+
          '<span class="text-xs text-slate-400">'+t('mergeTo')+':</span>'+
          '<select id="mergeTarget" class="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:border-'+cat.color+'-500 focus:outline-none">'+
            '<option value="txt">TXT</option><option value="md">Markdown</option><option value="html">HTML</option>'+
          '</select>'+
        '</div>'+
        '<input type="text" id="mergeName" placeholder="merged.txt" class="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:border-'+cat.color+'-500 focus:outline-none" value="merged.txt">'+
        '<button onclick="window.startMerge()" class="w-full py-2.5 bg-gradient-to-r from-'+cat.color+'-500 to-'+cat.color+'-600 text-white font-semibold rounded-xl shadow-lg shadow-'+cat.color+'-500/20 transition-all active:scale-[0.98] text-sm">'+t('mergeFiles')+'</button>'+
      '</div>'+
      '<div id="formatArea" class="hidden rounded-2xl p-4 space-y-3">'+
        '<div class="flex gap-2">'+
          '<button onclick="window.startFormatJSON(\'beautify\')" class="flex-1 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700 text-xs font-medium transition-colors">'+t('beautify')+'</button>'+
          '<button onclick="window.startFormatJSON(\'compress\')" class="flex-1 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700 text-xs font-medium transition-colors">'+t('compress')+'</button>'+
          '<button onclick="window.startFormatJSON(\'validate\')" class="flex-1 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700 text-xs font-medium transition-colors">'+t('validate')+'</button>'+
        '</div>'+
      '</div>'+
      '<div id="batchBar" class="hidden">' +
        '<div class="rounded-xl bg-slate-800/40 border border-slate-700/40 p-3 space-y-3">' +
          '<div class="flex items-center gap-2 flex-wrap">' +
            '<span class="text-xs text-slate-400 shrink-0">' + t('batchSet') + '</span>' +
            '<select id="batchTarget" class="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 pr-8 focus:border-' + cat.color + '-500 focus:outline-none">' +
              '<option value="">' + t('batchSet').replace('：','') + '...</option>' +
            '</select>' +
            '<button onclick="window.applyBatchTarget()" class="text-xs px-3 py-1.5 rounded-lg bg-' + cat.color + '-500/10 text-' + cat.color + '-400 hover:bg-' + cat.color + '-500/20 transition-colors shrink-0 font-medium">' + t('applyToAll') + '</button>' +
            '<button onclick="window.selectAll()" class="text-xs px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors shrink-0 font-medium">' + t('selectAll') + '</button>' +
            '<button onclick="window.deselectAll()" class="text-xs px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors shrink-0 font-medium">' + t('deselectAll') + '</button>' +
          '</div>' +
          '<div class="flex flex-wrap items-center gap-2">' +
            '<span id="selectedCount" class="text-xs text-slate-400">' + t('selectedCount').replace('{count}', '0') + '</span>' +
            '<div class="flex-1"></div>' +
            '<button onclick="window.mergeSelected()" class="text-xs px-3 py-1.5 rounded-lg bg-' + cat.color + '-500/10 text-' + cat.color + '-400 hover:bg-' + cat.color + '-500/20 transition-colors font-medium">' + t('mergeDownload') + '</button>' +
            '<button onclick="window.compressSelected()" class="text-xs px-3 py-1.5 rounded-lg bg-' + cat.color + '-500/10 text-' + cat.color + '-400 hover:bg-' + cat.color + '-500/20 transition-colors font-medium">' + t('compressDownload') + '</button>' +
            '<button onclick="window.compressMergeSelected()" class="text-xs px-3 py-1.5 rounded-lg bg-' + cat.color + '-500/10 text-' + cat.color + '-400 hover:bg-' + cat.color + '-500/20 transition-colors font-medium">' + t('compressMergeDownload') + '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div id="fileList" class="hidden space-y-3"></div>'+
      '<div id="convertArea" class="hidden space-y-3">'+
        '<button id="convertBtn" class="w-full py-3 bg-gradient-to-r from-'+cat.color+'-500 to-'+cat.color+'-600 hover:from-'+cat.color+'-400 hover:to-'+cat.color+'-500 text-white font-semibold rounded-xl shadow-lg shadow-'+cat.color+'-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">'+
          '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>'+
          t('startConvert')+
        '</button>'+
        '<div id="postConvertActions" class="hidden space-y-1.5 sm:space-y-2">'+
        '<div class="grid grid-cols-2 gap-2">'+
          '<button onclick="window.downloadAll()" class="py-2.5 rounded-xl bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors text-sm font-medium flex items-center justify-center gap-1">'+
            '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>'+
            t('downloadAll')+
          '</button>'+
          '<button onclick="window.compressAll()" class="py-2.5 rounded-xl bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors text-sm font-medium flex items-center justify-center gap-1">'+
            '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>'+
            t('compressAll')+
          '</button>'+
        '</div>'+
        '<button onclick="window.clearCompleted()" class="w-full py-2 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-300 transition-colors text-xs font-medium flex items-center justify-center gap-1.5">'+
          '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>'+
          t('clearCompleted')+
        '</button>'+
      '</div>'+
      '</div>'+
    '</main>'+
  '</div>'+
  '<div id="toast" class="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 transform translate-y-24 opacity-0 transition-all duration-300 pointer-events-none">'+
    '<div class="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-600 shadow-2xl flex items-center gap-2.5 whitespace-nowrap">'+
      '<span id="toastIcon" class="text-base"></span><span id="toastMsg" class="text-sm font-medium"></span>'+
    '</div>'+
  '</div>'+
  '<div id="extractModal" class="fixed inset-0 z-50 hidden items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">'+
    '<div class="bg-slate-800 rounded-t-2xl sm:rounded-2xl border border-slate-700 w-full max-w-lg max-h-[75vh] flex flex-col">'+
      '<div class="p-4 border-b border-slate-700 flex items-center justify-between">'+
        '<h3 class="font-semibold text-sm">'+t('zipExtract')+'</h3>'+
        '<button id="closeModal" class="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400">'+
          '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>'+
        '</button>'+
      '</div>'+
      '<div id="extractList" class="p-3 overflow-y-auto space-y-1.5 flex-1"></div>'+
    '</div>'+
  '</div>';

  bindCategoryEvents(catId);
}

function bindCategoryEvents(catId) {
  const dz = document.getElementById('dropZone');
  const fi = document.getElementById('fileInput');
  const btn = document.getElementById('convertBtn');

  fi.addEventListener('change', e => { handleFiles(e.target.files, catId); e.target.value = ''; });
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drop-active'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('drop-active'));
  dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('drop-active'); handleFiles(e.dataTransfer.files, catId); });
  if (btn) btn.addEventListener('click', () => startConvert(catId));

  const cm = document.getElementById('closeModal');
  if (cm) cm.addEventListener('click', () => {
    document.getElementById('extractModal').classList.add('hidden');
    document.getElementById('extractModal').classList.remove('flex');
  });
}

/* ============================================================
   图片高级处理参数更新
   ============================================================ */
window.updateImgQuality = function(v) {
  imageOpts.quality = parseInt(v);
  const val = document.getElementById('imgQualityVal');
  if (val) val.textContent = v + '%';
};
window.updateImgWidth = function(v) {
  imageOpts.width = v ? parseInt(v) : '';
};
window.updateImgHeight = function(v) {
  imageOpts.height = v ? parseInt(v) : '';
};
window.updateImgRotate = function(v) {
  imageOpts.rotate = parseInt(v);
};

/* ============================================================
   合并模式 / 格式化模式切换
   ============================================================ */
window.toggleMergeMode = function() {
  mergeMode = !mergeMode;
  const area = document.getElementById('mergeArea');
  const btn = document.getElementById('mergeToggle');
  if (area && btn) {
    if (mergeMode) { area.classList.remove('hidden'); area.classList.add('merge-area'); btn.classList.add('bg-'+CATEGORIES.document.color+'-500/10'); }
    else { area.classList.add('hidden'); area.classList.remove('merge-area'); btn.classList.remove('bg-'+CATEGORIES.document.color+'-500/10'); }
  }
};

window.toggleFormatMode = function() {
  formatMode = !formatMode;
  const area = document.getElementById('formatArea');
  const btn = document.getElementById('formatToggle');
  if (area && btn) {
    if (formatMode) { area.classList.remove('hidden'); btn.classList.add('bg-'+CATEGORIES.data.color+'-500/10'); }
    else { area.classList.add('hidden'); btn.classList.remove('bg-'+CATEGORIES.data.color+'-500/10'); }
  }
};

/* ============================================================
   多语言切换
   ============================================================ */
window.switchLang = function(lang) {
  setLang(lang);
  render();
};

/* ============================================================
   文件处理 + 预览生成
   ============================================================ */
async function ensureLibsReady(catId) {
  const libs = window._CATEGORY_LIBS?.[catId];
  if (libs && libs.length && !window._scriptLoader.isReady(catId)) {
    const loader = document.getElementById('libLoader');
    if (loader) loader.classList.remove('hidden');
    await window._scriptLoader.loadBatch(libs);
    if (loader) loader.classList.add('hidden');
  }
}

function handleFiles(fileList, catId) {
  const cat = CATEGORIES[catId];
  Array.from(fileList).forEach(f => {
    if (f.size > MAX_SIZE) { toast('⚠️', '「'+f.name+'」'+t('maxSize')); return; }
    const e = getExt(f.name);
    if (!cat.exts.includes(e)) { toast('⚠️', '「'+f.name+'」'+t('notSupported')); return; }
    const item = { file: f, id: Date.now()+Math.random(), status: 'pending', progress: 0, target: Object.keys(cat.targets)[0], preview: null, customName: '', selected: true, convertedBlob: null, convertedName: '' };
    files.push(item);
    generatePreview(item, catId);
  });
  renderFiles(catId);
}

async function generatePreview(item, catId) {
  await ensureLibsReady(catId);
  const ext = getExt(item.file.name);
  const itemId = item.id;
  try {
    if (catId === 'image') {
      const url = URL.createObjectURL(item.file);
      item.preview = { type: 'image', url };
    } else if (catId === 'document') {
      if (['txt','md','html'].includes(ext)) {
        const text = await readText(item.file);
        item.preview = { type: 'text', content: text.slice(0, 500) };
      } else if (ext === 'docx') {
        const ab = await readAB(item.file);
        const r = await mammoth.extractRawText({ arrayBuffer: ab });
        item.preview = { type: 'text', content: r.value.slice(0, 500) };
      } else if (['xlsx','xls','csv','ods'].includes(ext)) {
        const ab = await readAB(item.file);
        const wb = XLSX.read(ab, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { header: 1 });
        item.preview = { type: 'table', rows: json.slice(0, 10) };
      } else {
        item.preview = { type: 'none' };
      }
    } else if (catId === 'ebook') {
      if (ext === 'epub') {
        const ab = await readAB(item.file);
        const zip = await JSZip.loadAsync(ab);
        let texts = [];
        for (const [path, entry] of Object.entries(zip.files)) {
          if (/\.(xhtml|html|htm)$/i.test(path) && !entry.dir) {
            const html = await entry.async('text');
            const div = document.createElement('div'); div.innerHTML = html;
            texts.push(div.textContent || div.innerText || '');
            if (texts.join('').length > 500) break;
          }
        }
        item.preview = { type: 'text', content: texts.join('\n\n').slice(0, 500) };
      } else if (['mobi','azw3'].includes(ext)) {
        const ab = await readAB(item.file);
        const u8 = new Uint8Array(ab);
        let text = '';
        for (let i = 0; i < u8.length; i++) {
          const c = u8[i];
          if ((c >= 32 && c < 127) || c === 10 || c === 13) text += String.fromCharCode(c);
        }
        item.preview = { type: 'text', content: text.replace(/\s{4,}/g, '\n\n').slice(0, 500) };
      } else {
        item.preview = { type: 'none' };
      }
    } else if (catId === 'data') {
      if (ext === 'zip') {
        const ab = await readAB(item.file);
        const zip = await JSZip.loadAsync(ab);
        const entries = Object.keys(zip.files).filter(p => !zip.files[p].dir).slice(0, 8);
        item.preview = { type: 'archive', entries };
      } else if (['json','xml','yaml','yml','toml','csv'].includes(ext)) {
        const text = await readText(item.file);
        item.preview = { type: 'text', content: text.slice(0, 500) };
      } else {
        item.preview = { type: 'none' };
      }
    }
  } catch (e) {
    item.preview = { type: 'error', message: 'Preview failed' };
  }
  if (files.find(f => f.id === itemId) && currentCat === catId) {
    renderFiles(catId);
  }
}

window.rmFile = function(idx) {
  const item = files[idx];
  if (item && item.preview && item.preview.url) URL.revokeObjectURL(item.preview.url);
  files.splice(idx, 1);
  renderFiles(currentCat);
};

window.chgTarget = function(idx, val) {
  if (files[idx]) files[idx].target = val;
};

window.chgCustomName = function(idx, val) {
  if (files[idx]) files[idx].customName = val;
};

window.applyBatchTarget = function() {
  const sel = document.getElementById('batchTarget');
  if (!sel || !sel.value) return;
  const val = sel.value;
  let count = 0;
  for (const item of files) {
    const supported = getSupportedTargets(currentCat, item.file.name);
    if (supported.includes(val)) {
      item.target = val;
      count++;
    }
  }
  renderFiles(currentCat);
  toast('✅', t('batchApplied') + ' ' + count + t('files'));
};

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function renderPreview(preview, catId) {
  if (!preview) return '<div class="mt-3 p-3 rounded-lg bg-slate-900/30 border border-slate-700/20"><span class="text-xs text-slate-500">'+t('pasteHint')+'...</span></div>';
  if (preview.type === 'none') return '';
  if (preview.type === 'error') return '<div class="mt-3 p-3 rounded-lg bg-red-500/5 border border-red-500/10"><span class="text-xs text-red-400">'+escapeHtml(preview.message)+'</span></div>';
  if (preview.type === 'image') {
    return '<div class="mt-3 rounded-lg overflow-hidden bg-slate-900/50 border border-slate-700/30">'+
      '<img src="'+preview.url+'" class="max-h-36 w-auto object-contain mx-auto" alt="preview" loading="lazy">'+
    '</div>';
  }
  if (preview.type === 'text') {
    return '<div class="mt-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700/30">'+
      '<p class="text-xs text-slate-300 font-mono whitespace-pre-wrap break-words line-clamp-6 leading-relaxed">'+escapeHtml(preview.content)+'</p>'+
      '<p class="text-[10px] text-slate-500 mt-1.5">'+t('previewFirst500')+'</p>'+
    '</div>';
  }
  if (preview.type === 'table') {
    const rows = preview.rows;
    if (!rows || !rows.length) return '';
    let thead = '', tbody = '';
    const headers = rows[0] || [];
    for (const h of headers) {
      thead += '<th class="px-2 py-1 text-left text-[10px] font-semibold text-slate-300 border-b border-slate-600">'+escapeHtml(h)+'</th>';
    }
    for (let r = 1; r < rows.length; r++) {
      let tds = '';
      for (const cell of rows[r]) {
        tds += '<td class="px-2 py-1 text-[10px] text-slate-400 border-b border-slate-700/30">'+escapeHtml(cell)+'</td>';
      }
      tbody += '<tr>'+tds+'</tr>';
    }
    return '<div class="mt-3 rounded-lg overflow-hidden border border-slate-700/30">'+
      '<div class="overflow-x-auto">'+
        '<table class="w-full text-left">'+
          '<thead class="bg-slate-800"><tr>'+thead+'</tr></thead>'+
          '<tbody class="bg-slate-900/30">'+tbody+'</tbody>'+
        '</table>'+
      '</div>'+
      '<p class="text-[10px] text-slate-500 px-2 py-1.5 bg-slate-900/30">'+t('previewFirst10')+'</p>'+
    '</div>';
  }
  if (preview.type === 'archive') {
    const list = preview.entries.map(e => '<li class="truncate text-xs text-slate-400">📄 '+escapeHtml(e)+'</li>').join('');
    return '<div class="mt-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700/30">'+
      '<ul class="space-y-1">'+list+'</ul>'+
      '<p class="text-[10px] text-slate-500 mt-1.5">'+t('archivePreview')+'</p>'+
    '</div>';
  }
  return '';
}

function renderSizeCompare(item) {
  if (item.status !== 'done' || item.convertedSize == null) return '';
  const orig = item.file.size;
  const now = item.convertedSize;
  const pct = orig === 0 ? 0 : Math.round((now - orig) / orig * 100);
  let color, arrow, text;
  if (pct < 0) { color = 'text-emerald-400'; arrow = '↓'; text = Math.abs(pct) + '%'; }
  else if (pct > 0) { color = 'text-amber-400'; arrow = '↑'; text = pct + '%'; }
  else { color = 'text-slate-500'; arrow = '→'; text = '0%'; }
  return '<div class="mt-2 flex items-center gap-1.5 text-[10px]">'+
    '<span class="text-slate-500">'+t('original')+' '+fmtSize(orig)+'</span>'+
    '<span class="text-slate-600">→</span>'+
    '<span class="text-slate-300">'+t('newSize')+' '+fmtSize(now)+'</span>'+
    '<span class="'+color+' font-medium">'+arrow+' '+text+'</span>'+
  '</div>';
}


function renderFiles(catId) {
  const list = document.getElementById('fileList');
  const area = document.getElementById('convertArea');
  const batchBar = document.getElementById('batchBar');
  const cat = CATEGORIES[catId];

  if (!files.length) {
    list.classList.add('hidden');
    area.classList.add('hidden');
    if (batchBar) batchBar.classList.add('hidden');
    return;
  }

  list.classList.remove('hidden');
  area.classList.remove('hidden');
  if (batchBar) batchBar.classList.remove('hidden');

  // 更新选中数量
  const selectedCount = files.filter(f => f.selected).length;
  const countEl = document.getElementById('selectedCount');
  if (countEl) countEl.textContent = t('selectedCount').replace('{count}', selectedCount);

  // 更新 batchTarget options
  const batchTarget = document.getElementById('batchTarget');
  if (batchTarget) {
    let commonTargets = [];
    if (files.length > 0) {
      const allSupported = files.map(f => getSupportedTargets(catId, f.file.name));
      commonTargets = allSupported[0].filter(t => allSupported.every(s => s.includes(t)));
    }
    let currentVal = batchTarget.value;
    let batchOptions = '<option value="">' + t('batchSet').replace('：','') + '...</option>';
    for (const tKey of commonTargets) {
      const info = cat.targets[tKey];
      const label = getLang() === 'en' ? (info.labelEn || info.label) : info.label;
      batchOptions += '<option value="' + tKey + '">' + label + ' (.' + info.ext + ')</option>';
    }
    batchTarget.innerHTML = batchOptions;
    if (currentVal && commonTargets.includes(currentVal)) {
      batchTarget.value = currentVal;
    }
  }

  let html = '';
  for (let idx = 0; idx < files.length; idx++) {
    const item = files[idx];
    const f = item.file;
    const e = getExt(f.name);
    // BUG FIX: f 已经是 item.file，所以用 f.name 而不是 f.file.name
    const supported = getSupportedTargets(catId, f.name);

    let statusHtml = '';
    if (item.status === 'done') statusHtml = '<span class="text-emerald-400 text-xs font-medium ml-2">✓ ' + t('done') + '</span>';
    else if (item.status === 'error') statusHtml = '<span class="text-red-400 text-xs font-medium ml-2">✗ ' + t('failed') + '</span>';
    else if (item.status === 'converting') statusHtml = '<span class="inline-block w-3.5 h-3.5 border-2 border-' + cat.color + '-400 border-t-transparent rounded-full animate-spin ml-2"></span>';

    let selectHtml = '';
    if (!supported.length) {
      selectHtml = '<span class="flex-1 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">' + t('notSupported') + '</span>';
    } else {
      let options = '';
      for (const [v, info] of Object.entries(cat.targets)) {
        if (supported.includes(v)) {
          const label = getLang() === 'en' ? (info.labelEn || info.label) : info.label;
          options += '<option value="' + v + '"' + (item.target === v ? ' selected' : '') + '>' + label + ' (.' + info.ext + ')</option>';
        }
      }
      selectHtml = '<select id="t-' + idx + '" onchange="window.chgTarget(' + idx + ',this.value)" class="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm focus:border-' + cat.color + '-500 focus:outline-none text-slate-200 pr-8">' + options + '</select>';
    }

    const defaultName = f.name.replace(/\.[^.]+$/i, '.' + (cat.targets[item.target] ? cat.targets[item.target].ext : item.target));
    const customNameVal = item.customName || defaultName;

    // 操作按钮（转换完成后显示）
    let actionButtons = '';
    if (item.status === 'done' && item.convertedBlob) {
      actionButtons = '<div class="mt-3 flex gap-2">' +
        '<button onclick="window.downloadFile(' + idx + ')" class="flex-1 py-2 rounded-lg bg-' + cat.color + '-500/10 text-' + cat.color + '-400 hover:bg-' + cat.color + '-500/20 transition-colors text-xs font-medium flex items-center justify-center gap-1">' +
          '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>' +
          t('download') +
        '</button>' +
        '<button onclick="window.compressFile(' + idx + ')" class="flex-1 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors text-xs font-medium flex items-center justify-center gap-1">' +
          '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>' +
          t('compressDownload') +
        '</button>' +
      '</div>';
    }

    html += '<div class="slide-in rounded-xl bg-slate-800/40 border border-slate-700/40 p-4 ' + (item.status === 'done' ? 'border-emerald-500/20' : '') + ' ' + (item.selected ? 'ring-1 ring-' + cat.color + '-500/30' : '') + '">' +
      '<div class="flex items-center gap-3 mb-3">' +
        '<input type="checkbox" onchange="window.toggleSelect(' + idx + ')" ' + (item.selected ? 'checked' : '') + ' class="w-4 h-4 rounded border-slate-600 bg-slate-800 text-' + cat.color + '-500 focus:ring-' + cat.color + '-500 focus:ring-offset-0 cursor-pointer">' +
        '<div class="w-9 h-9 rounded-lg bg-' + cat.color + '-500/10 ' + cat.textColor + ' flex items-center justify-center text-[10px] font-bold uppercase shrink-0">' + e + '</div>' +
        '<div class="flex-1 min-w-0">' +
          '<p class="text-sm font-medium truncate flex items-center">' + f.name + statusHtml + '</p>' +
          '<p class="text-[10px] text-slate-500 leading-relaxed">' + fmtSize(f.size) + '</p>' +
        '</div>' +
        '<button onclick="window.rmFile(' + idx + ')" class="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-400 text-slate-500 transition-colors shrink-0">' +
          '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="flex items-center gap-2">' +
        '<span class="text-xs text-slate-400 shrink-0">' + t('convertTo') + '</span>' + selectHtml +
      '</div>' +
      '<div class="mt-2 flex items-center gap-2">' +
        '<span class="text-[10px] text-slate-500 shrink-0">' + t('customName') + ':</span>' +
        '<input type="text" value="' + escapeHtml(customNameVal) + '" onchange="window.chgCustomName(' + idx + ',this.value)" class="flex-1 bg-slate-900/50 border border-slate-700 rounded-md px-2 py-1 text-[11px] text-slate-300 focus:border-' + cat.color + '-500 focus:outline-none">' +
      '</div>' +
      renderPreview(item.preview, catId) +
      renderSizeCompare(item) +
      (item.status === 'converting' ? '<div class="mt-3 h-1 bg-slate-700 rounded-full overflow-hidden"><div class="h-full bg-gradient-to-r from-' + cat.color + '-500 to-' + cat.color + '-400 progress-bar" style="width:' + item.progress + '%"></div></div>' : '') +
      (item.status === 'error' ? '<p class="text-xs text-red-400 mt-2">' + escapeHtml(item.error || '') + '</p>' : '') +
      actionButtons +
    '</div>';
  }

  list.innerHTML = html;
}


async function startConvert(catId) {
  if (converting || !files.length) return;
  converting = true;

  // 显示全局进度
  showGlobalProgress(files.length);

  const btn = document.getElementById('convertBtn');
  const cat = CATEGORIES[catId];
  btn.disabled = true;
  btn.innerHTML = '<span class="inline-flex items-center gap-2"><span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>'+t('converting')+'</span>';

  for (let i = 0; i < files.length; i++) {
    const item = files[i];
    const target = item.target;
    item.status = 'converting';
    item.progress = 10;
    renderFiles(catId);
    updateGlobalProgress(i, files.length, item.file.name);

    try {
      const supported = getSupportedTargets(catId, item.file.name);
      if (!supported.length || !supported.includes(target)) {
        throw new Error(t('notSupported'));
      }

      let blob;
      const ext = getExt(item.file.name);

      if (catId === 'image') {
        // 图片转换：保持主线程（Canvas 无法 Worker 化）
        blob = await convImage(item.file, target, imageOpts);
      }
      else if (catId === 'data') {
        if (ext === 'zip') {
          // ZIP 提取/打包：保持主线程（需要即时展示提取结果）
          const r = await convArchive(item.file, target);
          if (r && r.type === 'extracted') {
            showExtractModal(r.entries);
            item.status = 'done'; item.progress = 100;
            renderFiles(catId);
            continue;
          }
          blob = r;
        } else if (['xlsx', 'xls', 'csv', 'ods'].includes(ext)) {
          // Excel 格式：Worker 处理
          const ab = await readAB(item.file);
          blob = await workerConvert('data', 'convertXLSX', { arrayBuffer: ab, target }, item.id);
        } else {
          // JSON/XML/YAML/TOML/CSV 互转：Worker 处理
          const text = await readText(item.file);
          blob = await workerConvert('data', 'convert', { text, ext, target }, item.id);
        }
      }
      else if (catId === 'document') {
        if (ext === 'docx') {
          if (target === 'pdf') {
            // DOCX→PDF：保持主线程（需要 html2canvas + DOM）
            await ensureLibsReady('document');
            blob = await convDoc(item.file, target);
          } else if (target === 'md') {
            // DOCX→Markdown：主线程（mammoth.convertToMarkdown）
            await ensureLibsReady('document');
            blob = await convDoc(item.file, target);
          } else {
            // DOCX→txt/html：Worker 处理
            const ab = await readAB(item.file);
            const wType = target === 'html' ? 'convertHtml' : 'extractText';
            const result = await workerConvert('doc', wType, { arrayBuffer: ab, fileName: item.file.name }, item.id);
            blob = new Blob([result.text], { type: result.mime + ';charset=utf-8' });
          }
        } else if (['xlsx', 'xls', 'csv', 'ods'].includes(ext)) {
          // Excel 文档：Worker 处理
          const ab = await readAB(item.file);
          blob = await workerConvert('data', 'convertXLSX', { arrayBuffer: ab, target }, item.id);
        } else if (['txt', 'md'].includes(ext) && target === 'pdf') {
          // 文本→PDF：保持主线程（需要 jsPDF）
          await ensureLibsReady('document');
          blob = await convDoc(item.file, target);
        } else if (['txt', 'md', 'html'].includes(ext) && target === 'docx') {
          // 文本→DOCX：需要 docx.js
          await ensureLibsReady('document');
          blob = await convDoc(item.file, target);
        } else {
          // 其他文本互转：保持主线程（简单文本复制）
          blob = await convDoc(item.file, target);
        }
      }
      else if (catId === 'ebook') {
        if (ext === 'pdf' || target === 'pdf' || target === 'epub') {
          // EPUB <-> PDF 互转在主线程做（需要 PDFLib/pdf.js 和中文字体）
          await ensureLibsReady('ebook');
          blob = await convEbook(item.file, target);
        } else if (ext === 'epub') {
          const ab = await readAB(item.file);
          blob = await workerConvert('ebook', 'convertEpub', { arrayBuffer: ab, target, fileName: item.file.name }, item.id);
        } else if (['mobi', 'azw3'].includes(ext)) {
          const ab = await readAB(item.file);
          const u8 = new Uint8Array(ab);
          blob = await workerConvert('ebook', 'convertMobi', { uint8Array: u8 }, item.id);
        }
      }

      if (!blob) throw new Error('转换未返回文件');

      item.convertedBlob = blob;
      item.convertedName = item.customName || item.file.name.replace(/\.[^.]+$/i, '.' + cat.targets[target].ext);
      item.convertedSize = blob.size;
      item.progress = 100;
      item.status = 'done';

      toast('✅', '「'+item.file.name+'」'+t('done'));
    } catch (err) {
      item.status = 'error';
      item.error = err.message || t('failed');
      toast('❌', '「'+item.file.name+'」'+item.error);
    }

    renderFiles(catId);
    manageMemory();
    await sleep(200);
  }

  hideGlobalProgress();
  converting = false;
  btn.disabled = false;
  btn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg> '+t('startConvert');

  const postActions = document.getElementById('postConvertActions');
  const hasDone = files.some(f => f.status === 'done' && f.convertedBlob);
  if (postActions && hasDone) {
    postActions.classList.remove('hidden');
  }
}

/* ============================================================
   Worker 任务封装
   ============================================================ */
function workerConvert(workerType, taskType, payload, taskId) {
  return new Promise((resolve, reject) => {
    const worker = workerPool.get(workerType);
    if (!worker) {
      reject(new Error('Worker not available'));
      return;
    }

    function handler(e) {
      const { id, type, result, message, value } = e.data;
      if (id !== taskId) return;

      if (type === 'progress') {
        const item = files.find(f => f.id === id);
        if (item) {
          item.progress = value;
          renderFiles(currentCat);
        }
      }
      else if (type === 'complete') {
        worker.removeEventListener('message', handler);
        if (result.mode === 'text') {
          resolve(new Blob([result.text], { type: result.mime + ';charset=utf-8' }));
        } else if (result.mode === 'arraybuffer') {
          resolve(new Blob([result.data], { type: result.mime }));
        } else {
          resolve(result);
        }
      }
      else if (type === 'error') {
        worker.removeEventListener('message', handler);
        reject(new Error(message));
      }
    }

    worker.addEventListener('message', handler);
    worker.postMessage({ id: taskId, type: taskType, payload });
  });
}

/* ============================================================
   全局进度条控制
   ============================================================ */
function showGlobalProgress(total) {
  globalProgress = { current: 0, total, active: true };
  const gp = document.getElementById('globalProgress');
  if (gp) { gp.classList.remove('hidden'); }
  updateGlobalProgress(0, total, '');
}

function updateGlobalProgress(current, total, fileName) {
  globalProgress.current = current;
  const pct = total === 0 ? 0 : Math.round((current / total) * 100);
  const bar = document.getElementById('globalProgressBar');
  const text = document.getElementById('globalProgressText');
  if (bar) bar.style.width = pct + '%';
  if (text) {
    const name = fileName ? ' · ' + fileName : '';
    text.textContent = t('converting') + ' ' + (current + 1) + '/' + total + name;
  }
}

function hideGlobalProgress() {
  globalProgress.active = false;
  const gp = document.getElementById('globalProgress');
  if (gp) {
    gp.classList.add('hidden');
    const bar = document.getElementById('globalProgressBar');
    if (bar) bar.style.width = '0%';
  }
}

/* ============================================================
   内存清理
   ============================================================ */
window.clearCompleted = function() {
  let count = 0;
  for (const item of files) {
    if (item.status === 'done' && item.convertedBlob) {
      item.convertedBlob = null;
      item.convertedSize = null;
      count++;
    }
  }
  renderFiles(currentCat);
  toast('🗑️', t('cleared').replace('{count}', String(count)));
};window.startMerge = async function() {
  const selected = files.filter(f => f.selected);
  if (selected.length < 2) { toast('⚠️', '请至少选择 2 个文件'); return; }
  const target = document.getElementById('mergeTarget')?.value || 'txt';
  const customName = document.getElementById('mergeName')?.value || 'merged.txt';
  try {
    const { blob, name } = await mergeDocs(selected.map(f => f.file), target, customName);
    dlBlob(blob, name);
    toast('✅', t('mergeFiles') + ': ' + name);
  } catch (err) {
    toast('❌', err.message || t('failed'));
  }
};

window.startFormatJSON = async function(mode) {
  const jsonFiles = files.filter(f => f.selected && getExt(f.file.name) === 'json');
  if (!jsonFiles.length) { toast('⚠️', '请先选择 JSON 文件'); return; }
  for (const item of jsonFiles) {
    try {
      if (mode === 'validate') {
        const r = await formatJSON(item.file, 'validate');
        toast('✅', item.file.name + ': ' + r.message);
      } else {
        const blob = await formatJSON(item.file, mode);
        const outName = item.customName || item.file.name.replace(/\.json$/i, mode === 'beautify' ? '.beautified.json' : '.minified.json');
        dlBlob(blob, outName);
        toast('✅', item.file.name + ': ' + (mode === 'beautify' ? t('beautify') : t('compress')) + ' ' + t('done'));
      }
    } catch (err) {
      toast('❌', item.file.name + ': ' + err.message);
    }
  }
};

function showExtractModal(entries) {
  const modal = document.getElementById('extractModal');
  const list = document.getElementById('extractList');
  modal.classList.remove('hidden'); modal.classList.add('flex');
  window._extracted = entries;
  let html = '';
  for (let i=0; i<entries.length; i++) {
    const e = entries[i];
    html += '<div class="flex items-center justify-between p-2.5 rounded-lg bg-slate-700/20 hover:bg-slate-700/40 transition-colors">'+
      '<div class="min-w-0">'+
        '<p class="text-xs truncate">'+e.path+'</p>'+
        '<p class="text-[10px] text-slate-500 leading-relaxed">'+fmtSize(e.size)+'</p>'+
      '</div>'+
      '<button onclick="window.dlExtract('+i+')" class="text-[10px] px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors shrink-0 ml-2">'+t('download')+'</button>'+
    '</div>';
  }
  list.innerHTML = html;
}

window.dlExtract = function(idx) {
  const e = window._extracted ? window._extracted[idx] : null;
  if (e && e.content) { dlBlob(e.content, e.path.split('/').pop()); toast('✅', t('download') + ' ' + t('done')); }
};

function toast(icon, msg) {
  const tEl = document.getElementById('toast'), ti = document.getElementById('toastIcon'), tm = document.getElementById('toastMsg');
  ti.textContent = icon; tm.textContent = msg;
  tEl.classList.remove('translate-y-24', 'opacity-0');
  setTimeout(() => tEl.classList.add('translate-y-24', 'opacity-0'), 2800);
}

/* ============================================================
   多选操作
   ============================================================ */
window.toggleSelect = function(idx) {
  if (files[idx]) {
    files[idx].selected = !files[idx].selected;
    renderFiles(currentCat);
  }
};

window.selectAll = function() {
  files.forEach(f => f.selected = true);
  renderFiles(currentCat);
};

window.deselectAll = function() {
  files.forEach(f => f.selected = false);
  renderFiles(currentCat);
};

/* ============================================================
   下载操作
   ============================================================ */
window.downloadFile = function(idx) {
  const item = files[idx];
  if (item && item.convertedBlob) {
    dlBlob(item.convertedBlob, item.convertedName);
    toast('✅', t('download') + ': ' + item.convertedName);
  }
};

window.compressFile = async function(idx) {
  const item = files[idx];
  if (!item) return;
  try {
    const zip = new JSZip();
    const blob = item.convertedBlob || item.file;
    const name = item.convertedName || item.customName || item.file.name;
    zip.file(name, blob);
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    dlBlob(zipBlob, name + '.zip');
    toast('✅', t('compressDownload') + ' ' + t('done'));
  } catch (err) {
    toast('❌', err.message);
  }
};

window.downloadSelected = function() {
  const selected = files.filter(f => f.selected && f.convertedBlob);
  if (!selected.length) { toast('⚠️', '没有选中的可下载文件'); return; }
  for (const item of selected) {
    dlBlob(item.convertedBlob, item.convertedName);
  }
  toast('✅', t('download') + ' ' + selected.length + t('fileCount'));
};

window.downloadAll = function() {
  const done = files.filter(f => f.status === 'done' && f.convertedBlob);
  if (!done.length) { toast('⚠️', '没有可下载的文件'); return; }
  for (const item of done) {
    dlBlob(item.convertedBlob, item.convertedName);
  }
  toast('✅', t('downloadAll') + ' ' + done.length + t('fileCount'));
};

window.compressSelected = async function() {
  const selected = files.filter(f => f.selected);
  if (!selected.length) { toast('⚠️', '请先选择文件'); return; }
  try {
    await packFilesToZip(selected, 'selected-files.zip');
    toast('✅', t('compressDownload') + ' ' + t('done'));
  } catch (err) {
    toast('❌', err.message);
  }
};

window.compressAll = async function() {
  const done = files.filter(f => f.status === 'done' && f.convertedBlob);
  if (!done.length) { toast('⚠️', '没有可下载的文件'); return; }
  try {
    await packFilesToZip(done, 'all-files.zip');
    toast('✅', t('compressAll') + ' ' + t('done'));
  } catch (err) {
    toast('❌', err.message);
  }
};

window.mergeSelected = async function() {
  const selected = files.filter(f => f.selected);
  if (selected.length < 1) { toast('⚠️', '请先选择文件'); return; }
  if (selected.length < 2) { toast('⚠️', '请至少选择 2 个文件'); return; }
  try {
    const { blob, name } = await mergeFiles(selected, currentCat);
    dlBlob(blob, name);
    toast('✅', t('mergeDownload') + ': ' + name);
  } catch (err) {
    toast('❌', err.message);
  }
};

window.compressMergeSelected = async function() {
  const selected = files.filter(f => f.selected);
  if (selected.length < 1) { toast('⚠️', '请先选择文件'); return; }
  if (selected.length < 2) { toast('⚠️', '请至少选择 2 个文件'); return; }
  try {
    const { blob, name } = await mergeFiles(selected, currentCat);
    const zip = new JSZip();
    zip.file(name, blob);
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    dlBlob(zipBlob, name + '.zip');
    toast('✅', t('compressMergeDownload') + ' ' + t('done'));
  } catch (err) {
    toast('❌', err.message);
  }
};

/* ============================================================
   分类合并实现
   ============================================================ */
async function mergeFiles(selectedFiles, catId) {
  const target = document.getElementById('mergeTarget')?.value || 'txt';
  const customName = document.getElementById('mergeName')?.value || 'merged.txt';

  if (catId === 'document') {
    return await mergeDocs(selectedFiles.map(f => f.file), target, customName);
  }

  if (catId === 'ebook') {
    let contents = [];
    for (const item of selectedFiles) {
      const ext = getExt(item.file.name);
      if (ext === 'epub') {
        const ab = await readAB(item.file);
        const zip = await JSZip.loadAsync(ab);
        let texts = [];
        for (const [path, entry] of Object.entries(zip.files)) {
          if (/\.(xhtml|html|htm)$/i.test(path) && !entry.dir) {
            const html = await entry.async('text');
            const div = document.createElement('div'); div.innerHTML = html;
            texts.push(div.textContent || '');
          }
        }
        contents.push(texts.join('\n\n'));
      } else if (['mobi','azw3'].includes(ext)) {
        const ab = await readAB(item.file);
        const u8 = new Uint8Array(ab);
        let text = '';
        for (let i = 0; i < u8.length; i++) {
          const c = u8[i];
          if ((c >= 32 && c < 127) || c === 10 || c === 13) text += String.fromCharCode(c);
        }
        contents.push(text.replace(/\s{4,}/g, '\n\n'));
      } else {
        const text = await readText(item.file);
        contents.push(text);
      }
    }
    const joined = contents.join('\n\n---\n\n');
    const mime = target === 'html' ? 'text/html' : 'text/plain';
    const ext = target === 'html' ? 'html' : 'txt';
    const name = customName || ('merged.' + ext);
    return { blob: new Blob([joined], { type: mime + ';charset=utf-8' }), name };
  }

  if (catId === 'data') {
    let contents = [];
    for (const item of selectedFiles) {
      const text = await readText(item.file);
      contents.push('=== ' + item.file.name + ' ===\n' + text);
    }
    const joined = contents.join('\n\n');
    return { blob: new Blob([joined], { type: 'text/plain;charset=utf-8' }), name: customName };
  }

  if (catId === 'image') {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    for (let i = 0; i < selectedFiles.length; i++) {
      const item = selectedFiles[i];
      if (i > 0) pdf.addPage();
      const dataUrl = await readData(item.file);
      const img = new Image();
      await new Promise((r, j) => { img.onload = r; img.onerror = j; img.src = dataUrl; });
      const pageWidth = 210;
      const pageHeight = 297;
      const imgRatio = img.naturalWidth / img.naturalHeight;
      let imgW = pageWidth;
      let imgH = pageWidth / imgRatio;
      if (imgH > pageHeight) { imgH = pageHeight; imgW = pageHeight * imgRatio; }
      const x = (pageWidth - imgW) / 2;
      const y = (pageHeight - imgH) / 2;
      let format = 'JPEG';
      if (dataUrl.includes('image/png')) format = 'PNG';
      pdf.addImage(dataUrl, format, x, y, imgW, imgH);
    }
    const blob = pdf.output('blob');
    return { blob, name: customName.replace(/\.[^.]+$/, '.pdf') };
  }

  throw new Error('该分类暂不支持合并');
}

/* ============================================================
   ZIP 打包工具
   ============================================================ */
async function packFilesToZip(items, zipName) {
  const zip = new JSZip();
  for (const item of items) {
    const blob = item.convertedBlob || item.file;
    const name = item.convertedName || item.customName || item.file.name;
    zip.file(name, blob);
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  dlBlob(blob, zipName);
}


/* ============================================================
   GitHub 下载页面
   ============================================================ */
function renderGitHubPage() {
  const isGithub = githubPlatform === 'github';
  app.innerHTML = '<div class="min-h-screen bg-slate-950 view-enter">'+
    '<header class="border-b border-slate-800 glass sticky top-0 z-50">'+
      '<div class="max-w-6xl mx-auto px-4 py-3.5 flex items-center gap-3">'+

        '<div class="flex items-center gap-2.5">'+
          '<span class="text-2xl">🐙</span>'+
          '<div><h1 class="text-base font-bold leading-none">GitHub '+t('download')+'</h1><p class="text-[10px] text-slate-400 mt-0.5">'+t('githubSubtitle')+'</p></div>'+
        '</div>'+
        '<div class="ml-auto flex items-center gap-1">'+
          '<button onclick="window.switchLang(\'zh\')" class="lang-btn '+(getLang()==='zh'?'active':'')+'">中文</button>'+
          '<button onclick="window.switchLang(\'en\')" class="lang-btn '+(getLang()==='en'?'active':'')+'">EN</button>'+
        '</div>'+
      '</div>'+
    '</header>'+
    '<main class="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6 w-full">'+
      '<div class="rounded-2xl bg-slate-800/20 border border-slate-700/30 p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-hidden">'+
        '<div class="flex items-center gap-2">'+
          '<button onclick="window.switchPlatform(\'github\')" class="text-xs px-3 py-1 rounded-full '+(isGithub?'bg-purple-500/20 text-purple-400 border border-purple-500/30':'bg-slate-800 text-slate-400 border border-slate-700')+'">'+t('platformGithub')+'</button>'+
          '<button onclick="window.switchPlatform(\'gitee\')" class="text-xs px-3 py-1 rounded-full '+(isGithub?'bg-slate-800 text-slate-400 border border-slate-700':'bg-purple-500/20 text-purple-400 border border-purple-500/30')+'">'+t('platformGitee')+'</button>'+
        '</div>'+
        (isGithub?'<div class="flex items-center gap-2">'+
          '<span class="text-xs text-slate-400 shrink-0">'+t('mirrorSource')+':</span>'+
          '<select id="rawMirror" onchange="window.changeMirror(this.value)" class="flex-1 min-w-0 bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:border-purple-500 focus:outline-none">'+
            Object.entries(RAW_MIRRORS).map(([k,v])=>'<option value="'+k+'"'+(getRawMirror()===k?' selected':'')+'>'+v.name+'</option>').join('')+
          '</select>'+
        '</div>':'')+
        '<div class="space-y-2">'+
          '<label class="text-xs sm:text-sm font-medium text-slate-300">'+(isGithub?t('githubUrlLabel'):t('giteeUrlLabel'))+'</label>'+
          '<div class="flex flex-col sm:flex-row gap-2">'+
            '<input type="text" id="githubUrl" placeholder="'+(isGithub?t('githubUrlHint'):t('giteeUrlHint'))+'" class="flex-1 min-w-0 w-full bg-slate-800 border border-slate-600 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-200 focus:border-purple-500 focus:outline-none placeholder-slate-500">'+
            '<button onclick="window.pasteGitHubUrl()" class="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors text-xs sm:text-sm font-medium shrink-0 whitespace-nowrap">'+t('paste')+'</button>'+
          '</div>'+
          '<p class="text-[10px] text-slate-500 leading-relaxed">'+(isGithub?t('githubUrlHint'):t('giteeUrlHint'))+'</p>'+
        '</div>'+
        '<div class="space-y-2">'          +'<label class="text-xs text-slate-400 font-medium">'+t('downloadMode')+'</label>'          +'<select id="downloadMode" onchange="window.onDownloadModeChange(this.value)" class="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-purple-500 focus:outline-none">'            +'<option value="zip">'+t('modeZip')+'</option>'            +'<option value="flat">'+t('modeFlat')+'</option>'          +'</select>'        +'</div>'        +'<div id="flatOptions" class="hidden space-y-2">'          +'<label class="text-xs text-slate-400 font-medium">'+t('pathHandling')+'</label>'          +'<select id="flatPathMode" class="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-purple-500 focus:outline-none">'            +'<option value="keep">'+t('keepPath')+'</option>'            +'<option value="nameonly">'+t('nameOnly')+'</option>'          +'</select>'        +'</div>'        +'<button id="githubDownloadBtn" onclick="window.startGitHubDownload()" class="w-full py-2.5 sm:py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base">'+
          '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>'+
          t('download')+
        '</button>'+
        '<div id="githubProgress" class="hidden space-y-1.5 sm:space-y-2">'+
          '<div class="h-1.5 bg-slate-800 rounded-full overflow-hidden">'+
            '<div id="githubProgressBar" class="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-300" style="width:0%"></div>'+
          '</div>'+
          '<p id="githubProgressText" class="text-[10px] text-slate-400"></p>'+
        '</div>'+
        '<p id="githubRateHint" class="flex items-center justify-between text-[10px] text-slate-500 flex-wrap gap-1"></p>'+
      '</div>'+
      '<div class="rounded-2xl bg-slate-800/20 border border-slate-700/30 p-4 sm:p-5 overflow-hidden">'+
        '<h3 class="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 flex items-center gap-2">'+
          '<svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'+
          t('githubNoteTitle')+
        '</h3>'+
        '<ul class="space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs text-slate-400">'+
          '<li class="flex items-start gap-2"><span class="w-1 h-1 rounded-full bg-purple-400 mt-1.5 shrink-0"></span><span>'+t('githubNote1')+'</span></li>'+
          '<li class="flex items-start gap-2"><span class="w-1 h-1 rounded-full bg-purple-400 mt-1.5 shrink-0"></span><span>'+t('githubNote2')+'</span></li>'+
          '<li class="flex items-start gap-2"><span class="w-1 h-1 rounded-full bg-purple-400 mt-1.5 shrink-0"></span><span>'+t('githubNote3')+'</span></li>'+
          '<li class="flex items-start gap-2"><span class="w-1 h-1 rounded-full bg-purple-400 mt-1.5 shrink-0"></span><span>'+t('githubNote4')+'</span></li>'+
          '<li class="flex items-start gap-2"><span class="w-1 h-1 rounded-full bg-purple-400 mt-1.5 shrink-0"></span><span>'+t('githubNote5')+'</span></li>'+
        '</ul>'+
      '</div>'+
      '<div class="rounded-2xl bg-slate-800/20 border border-slate-700/30 p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-hidden">'+
        '<h3 class="text-xs sm:text-sm font-semibold text-slate-300">'+t('releaseDownload')+'</h3>'+
        '<div class="flex flex-col sm:flex-row gap-2">'+
          '<input type="text" id="releaseUrl" placeholder="'+t('releaseUrlHint')+'" class="flex-1 min-w-0 w-full bg-slate-800 border border-slate-600 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-200 focus:border-purple-500 focus:outline-none placeholder-slate-500">'+
          '<button onclick="window.fetchReleases()" class="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors text-xs sm:text-sm font-medium shrink-0 whitespace-nowrap">'+t('releaseFetch')+'</button>'+
        '</div>'+
        '<div id="releaseList" class="hidden space-y-3"></div>'+
      '</div>'+
    '</main>'+
    '<footer class="border-t border-slate-800 mt-8">'+
      '<div class="max-w-6xl mx-auto px-4 py-4 text-center">'+
        '<p class="text-[10px] text-slate-500">'+t('footer')+'</p>'+
      '</div>'+
    '</footer>'+
  '</div>';

  checkRateLimit().then(r => {
    const el = document.getElementById('githubRateHint');
    if (el && r) {
      el.textContent = t('githubRateHint').replace('{remain}', r.remaining).replace('{limit}', r.limit);
      if (r.remaining < 10) el.className = 'text-red-400 font-medium';
      else if (r.remaining < 30) el.className = 'text-amber-400';
      else el.className = 'text-slate-500';
    }
  });

  const input = document.getElementById('githubUrl');
  if (input) {
    input.addEventListener('paste', e => {
      setTimeout(() => {
        const val = input.value.trim();
        if (isGithub ? isGitHubUrl(val) : isGiteeUrl(val)) input.value = val;
      }, 0);
    });
    input.focus();
  }
}

window.pasteGitHubUrl = async function() {
  try {
    const text = await navigator.clipboard.readText();
    const input = document.getElementById('githubUrl');
    if (input && isGitHubUrl(text)) {
      input.value = text.trim();
      toast('📋', t('paste') + ' ' + t('done'));
    } else {
      toast('⚠️', t('pasteFailed'));
    }
  } catch {
    toast('⚠️', t('pasteFailed'));
  }
};

window.onDownloadModeChange = function(mode) {
  const flatOpts = document.getElementById('flatOptions');
  if (flatOpts) {
    if (mode === 'flat') { flatOpts.classList.remove('hidden'); }
    else { flatOpts.classList.add('hidden'); }
  }
};

window.startGitHubDownload = async function() {
  const input = document.getElementById('githubUrl');
  const btn = document.getElementById('githubDownloadBtn');
  const progress = document.getElementById('githubProgress');
  const bar = document.getElementById('githubProgressBar');
  const text = document.getElementById('githubProgressText');

  const url = input?.value.trim();
  if (!url) { toast('⚠️', t('enterUrl')); return; }

  let info;
  if (githubPlatform === 'github') {
    info = parseGitHubUrl(url);
    if (!info) { toast('⚠️', t('invalidGitHubUrl')); return; }
  } else {
    info = parseGiteeUrl(url);
    if (!info) { toast('⚠️', t('invalidGiteeUrl')); return; }
  }

  // 如果没有指定分支，获取默认分支
  if (!info.branch) {
    text.textContent = '正在获取默认分支...';
    if (progress) progress.classList.remove('hidden');
    try {
      info.branch = githubPlatform === 'github'
        ? await getDefaultBranch(info.owner, info.repo, githubAbortController.signal)
        : await getGiteeDefaultBranch(info.owner, info.repo, githubAbortController.signal);
    } catch (err) {
      toast('❌', '获取默认分支失败: ' + err.message);
      btn.disabled = false;
      btn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg> '+t('download');
      if (progress) progress.classList.add('hidden');
      return;
    }
  }

  const mode = document.getElementById('downloadMode')?.value || 'zip';
  const keepPath = document.getElementById('flatPathMode')?.value === 'keep';

  // 断点续传检查
  if (info.type === 'tree') {
    const downloadId = `${info.owner}/${info.repo}/${info.branch}/${info.path || '__root__'}${mode === 'flat' ? '_flat' : ''}`;
    const prevProgress = await getDownloadProgress(downloadId);
    if (prevProgress && prevProgress.files && prevProgress.files.length > 0) {
      const allFiles = prevProgress.files.length + 1;
      if (!confirm(t('resumeFound').replace('{done}', prevProgress.files.length).replace('{total}', allFiles))) {
        await clearDownloadProgress(downloadId);
      }
    }
  }

  if (githubAbortController) githubAbortController.abort();
  githubAbortController = new AbortController();

  btn.disabled = true;
  btn.innerHTML = '<svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> '+t('downloading');
  if (progress) progress.classList.remove('hidden');

  try {
    if (info.type === 'blob') {
      text.textContent = t('downloading');
      const { blob, filename } = githubPlatform === 'github'
        ? await downloadGitHubFile(info, githubAbortController.signal)
        : await downloadGiteeFile(info, githubAbortController.signal);
      dlBlob(blob, filename);
      toast('✅', t('downloadSuccess') + ': ' + filename);
    } else {
      text.textContent = t('githubFetching');
      const onProgress = (done, total, name) => {
        const pct = Math.round(done / total * 100);
        if (bar) bar.style.width = pct + '%';
        if (text) text.textContent = t('githubProgress').replace('{done}', done).replace('{total}', total).replace('{name}', name);
      };
      if (mode === 'flat') {
        const { blob, filename, done, total } = githubPlatform === 'github'
          ? await downloadGitHubFolderFlat(info, keepPath, onProgress, githubAbortController.signal)
          : await downloadGiteeFolderFlat(info, keepPath, onProgress, githubAbortController.signal);
        dlBlob(blob, filename);
        toast('✅', t('githubFlatSuccess').replace('{done}', done).replace('{total}', total));
      } else {
        const { blob, filename, done, total } = githubPlatform === 'github'
          ? await downloadGitHubFolder(info, onProgress, githubAbortController.signal)
          : await downloadGiteeFolder(info, onProgress, githubAbortController.signal);
        dlBlob(blob, filename);
        toast('✅', t('githubZipSuccess').replace('{done}', done).replace('{total}', total));
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      toast('⏹️', t('downloadCancelled'));
    } else {
      toast('❌', t('downloadFailed') + ': ' + err.message);
    }
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg> '+t('download');
    if (progress) progress.classList.add('hidden');
    if (bar) bar.style.width = '0%';
    githubAbortController = null;
  }
};
window.changeMirror = function(key) {
  setRawMirror(key);
  toast('✅', t('mirrorSource') + ': ' + RAW_MIRRORS[key].name);
};

window.switchPlatform = function(platform) {
  githubPlatform = platform;
  renderGitHubPage();
};

window.fetchReleases = async function() {
  const input = document.getElementById('releaseUrl');
  const list = document.getElementById('releaseList');
  const url = input?.value.trim();
  if (!url) { toast('⚠️', t('enterUrl')); return; }

  const info = parseReleaseUrl(url);
  if (!info) { toast('⚠️', t('invalidGitHubUrl')); return; }

  try {
    const releases = await fetchReleases(info.owner, info.repo);
    releaseAssets = [];
    let html = '';
    for (const rel of releases.slice(0, 5)) {
      html += '<div class="rounded-lg bg-slate-800/40 border border-slate-700/30 p-3">'+
        '<p class="text-xs font-medium text-slate-300 mb-2">'+rel.tag_name+' · '+(rel.name||'')+'</p>'+
        '<div class="space-y-1.5">';
      for (const asset of rel.assets || []) {
        releaseAssets.push(asset);
        const idx = releaseAssets.length - 1;
        html += '<div class="flex items-center justify-between p-2 rounded bg-slate-900/30">'+
          '<div class="min-w-0">'+
            '<p class="text-[11px] text-slate-300 truncate">'+asset.name+'</p>'+
            '<p class="text-[10px] text-slate-500">'+fmtSize(asset.size)+'</p>'+
          '</div>'+
          '<button onclick="window.downloadReleaseAssetByIdx('+idx+')" class="text-[10px] px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors shrink-0 ml-2">'+t('download')+'</button>'+
        '</div>';
      }
      if (!rel.assets || rel.assets.length === 0) {
        html += '<p class="text-[10px] text-slate-500">'+t('releaseNoAssets')+'</p>';
      }
      html += '</div></div>';
    }
    list.innerHTML = html;
    list.classList.remove('hidden');
  } catch (err) {
    toast('❌', t('releaseFetchFailed') + ': ' + err.message);
  }
};

window.downloadReleaseAssetByIdx = async function(idx) {
  const asset = releaseAssets[idx];
  if (!asset) return;
  try {
    const { blob, filename } = await downloadReleaseAsset(asset);
    dlBlob(blob, filename);
    toast('✅', t('downloadSuccess') + ': ' + filename);
  } catch (err) {
    toast('❌', t('downloadFailed') + ': ' + err.message);
  }
};

function navigate(view) {
  // 子工具模式下禁止内部跳首页/其它分支，保持独立
  if (lockedView && view !== lockedView) return;
  currentView = view;
  render();
}

function handleClick(e) {
  const el = e.target;
  if (!el || typeof el.closest !== 'function') return;
  const a = el.closest('a[href^="#"]');
  if (!a) return;
  if (app && !app.contains(a)) return;
  e.preventDefault();
  const target = a.getAttribute('href').slice(1);
  if (lockedView) {
    // 历史遗留的 href="#" 链接不再回 FormatHub 首页（该页已删除，返回按钮已去掉）
    if (target === '' || target === 'home') {
      window.history.back();
      return;
    }
    // 点到其它分支的链接直接忽略，子工具之间不互相跳转
    if (target !== lockedView) return;
  }
  navigate(target === '' ? 'home' : target);
}

document.addEventListener('paste', e => {
  if (!app || !currentCat) return;
  const items = e.clipboardData?.items;
  if (!items) return;
  const pastedFiles = [];
  for (const item of items) {
    if (item.kind === 'file') {
      const f = item.getAsFile();
      if (f) pastedFiles.push(f);
    }
  }
  if (pastedFiles.length) {
    handleFiles(pastedFiles, currentCat);
    toast('📋', t('pasteHint') + ': ' + pastedFiles.length + t('fileCount'));
  }
});

export function initFormatHub(container, initialView) {
  app = container;
  currentView = initialView || 'home';
  // Treebox 里每个 fh-* 都是独立子工具，只有显式传 home 时才允许首页导航
  lockedView = (initialView && initialView !== 'home') ? initialView : null;
  files = [];
  currentCat = null;
  mergeMode = false;
  formatMode = false;
  app.addEventListener('click', handleClick);
  render();
  return function destroyFormatHub() {
    app.removeEventListener('click', handleClick);
    workerPool.terminateAll();
    app = null;
    lockedView = null;
  };
}
