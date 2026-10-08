import { readAB } from '../utils.js';

// 缓存中文字体字节
let cachedFontBytes = null;
const CHINESE_FONT_URL = 'https://jsdelivr.deno.dev/gh/KonghaYao/cn-font-split/packages/demo/public/SmileySans-Oblique.ttf';

async function loadChineseFont() {
  if (cachedFontBytes) return cachedFontBytes;
  const res = await fetch(CHINESE_FONT_URL);
  if (!res.ok) throw new Error('中文字体加载失败（' + res.status + '），请检查网络连接');
  cachedFontBytes = await res.arrayBuffer();
  return cachedFontBytes;
}

/**
 * 解析页码范围字符串
 * @param {string} rangeStr - 如 "1-5, 8, 10-12"
 * @param {number} totalPages - PDF 总页数
 * @returns {number[]} 页码数组（1-based）
 */
export function parsePageRange(rangeStr, totalPages) {
  const pages = new Set();
  const parts = rangeStr.split(/[,，]/).map(s => s.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(s => parseInt(s.trim(), 10));
      if (!isNaN(start) && !isNaN(end)) {
        const s = Math.max(1, start);
        const e = Math.min(totalPages, end);
        for (let i = s; i <= e; i++) pages.add(i);
      }
    } else {
      const p = parseInt(part, 10);
      if (!isNaN(p) && p >= 1 && p <= totalPages) pages.add(p);
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

/**
 * PDF 拆分
 */
export async function splitPDF(file, rangeStr) {
  const { PDFDocument } = window.PDFLib;
  const ab = await readAB(file);
  const pdfDoc = await PDFDocument.load(ab);
  const totalPages = pdfDoc.getPageCount();
  const pages = parsePageRange(rangeStr, totalPages);

  if (pages.length === 0) {
    throw new Error('页码范围无效');
  }

  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(pdfDoc, pages.map(p => p - 1));
  for (const page of copiedPages) {
    newPdf.addPage(page);
  }

  const bytes = await newPdf.save();
  return new Blob([bytes], { type: 'application/pdf' });
}

/**
 * PDF 合并
 */
export async function mergePDF(files, order) {
  const { PDFDocument } = window.PDFLib;
  const merged = await PDFDocument.create();
  let totalPages = 0;

  for (const idx of order) {
    const file = files[idx];
    const ab = await readAB(file);
    const pdf = await PDFDocument.load(ab);
    totalPages += pdf.getPageCount();
    const pages = await merged.copyPages(pdf, pdf.getPageIndices());
    for (const page of pages) {
      merged.addPage(page);
    }
  }

  const bytes = await merged.save();
  return { blob: new Blob([bytes], { type: 'application/pdf' }), totalPages };
}

/**
 * PDF 水印（嵌入中文字体 + fontkit 注册）
 */
export async function watermarkPDF(file, opts) {
  const { PDFDocument, rgb, degrees } = window.PDFLib;
  const { text, fontSize, opacity, position, rotation } = opts;
  const ab = await readAB(file);
  const pdfDoc = await PDFDocument.load(ab);
  const pages = pdfDoc.getPages();

  if (pages.length === 0) throw new Error('PDF 没有页面');

  // 加载并嵌入中文字体（必须注册 fontkit）
  const fontBytes = await loadChineseFont();
  if (window.fontkit) {
    pdfDoc.registerFontkit(window.fontkit);
  }
  const customFont = await pdfDoc.embedFont(fontBytes);

  const firstPage = pages[0];
  const pw = firstPage.getWidth();
  const ph = firstPage.getHeight();

  // 九宫格位置
  const posMap = {
    'top-left':     { x: 60, y: ph - 40 },
    'top-center':   { x: pw / 2, y: ph - 40 },
    'top-right':    { x: pw - 60, y: ph - 40 },
    'center-left':  { x: 60, y: ph / 2 },
    'center':       { x: pw / 2, y: ph / 2 },
    'center-right': { x: pw - 60, y: ph / 2 },
    'bottom-left':  { x: 60, y: 40 },
    'bottom-center':{ x: pw / 2, y: 40 },
    'bottom-right': { x: pw - 60, y: 40 },
  };

  const pos = posMap[position] || posMap['center'];

  for (const page of pages) {
    page.drawText(text, {
      font: customFont,
      x: pos.x,
      y: pos.y,
      size: parseInt(fontSize, 10),
      opacity: parseFloat(opacity),
      rotate: degrees(parseInt(rotation, 10) || 0),
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: 'application/pdf' });
}

/**
 * PDF 加密
 */
export async function encryptPDF(file, password) {
  const { PDFDocument } = window.PDFLib;
  const ab = await readAB(file);
  const pdfDoc = await PDFDocument.load(ab);
  const bytes = await pdfDoc.save({
    encrypt: {
      userPassword: password,
      ownerPassword: password,
      permissions: {
        printing: 'highResolution',
        modifying: false,
        copying: false,
        annotating: false,
        fillingForms: false,
        contentAccessibility: false,
        documentAssembly: false,
      }
    }
  });
  return new Blob([bytes], { type: 'application/pdf' });
}
