import { readAB, getExt } from '../utils.js';

// 中文字体缓存（与 PDF 工具箱水印用同一字体，EPUB->PDF 需要它才能写中文）
let cachedFontBytes = null;
const CHINESE_FONT_URL = 'https://jsdelivr.deno.dev/gh/KonghaYao/cn-font-split/packages/demo/public/SmileySans-Oblique.ttf';

async function loadChineseFont() {
  if (cachedFontBytes) return cachedFontBytes;
  const res = await fetch(CHINESE_FONT_URL);
  if (!res.ok) throw new Error('中文字体加载失败（' + res.status + '），EPUB 转 PDF 需要联网加载字体');
  cachedFontBytes = await res.arrayBuffer();
  return cachedFontBytes;
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function escapeXml(str) { return escapeHtml(str); }

function htmlToParagraphs(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  div.querySelectorAll('script,style').forEach(el => el.remove());
  const blocks = div.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,blockquote');
  if (blocks.length) {
    return Array.from(blocks).map(el => (el.textContent || '').replace(/\s+/g, ' ').trim()).filter(Boolean);
  }
  const text = (div.textContent || '').trim();
  return text ? [text] : [];
}

async function extractEpubParagraphs(file) {
  const ab = await readAB(file);
  const zip = await JSZip.loadAsync(ab);
  const paragraphs = [];
  for (const [path, entry] of Object.entries(zip.files)) {
    if (/\.(xhtml|html|htm)$/i.test(path) && !entry.dir) {
      const html = await entry.async('text');
      paragraphs.push(...htmlToParagraphs(html));
    }
  }
  return paragraphs;
}

async function extractPdfPagesText(file) {
  const lib = window.pdfjsLib;
  if (!lib) throw new Error('PDF 解析库未加载，请检查网络后重试');
  lib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
  const ab = await readAB(file);
  const pdf = await lib.getDocument({ data: ab }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    const lines = [];
    let current = '';
    for (const item of tc.items) {
      current += item.str || '';
      if (item.hasEOL) { lines.push(current); current = ''; }
      else current += ' ';
    }
    if (current.trim()) lines.push(current);
    pages.push(lines.join('\n').replace(/[ \t]+/g, ' ').trim());
  }
  return pages.filter(Boolean);
}

function wrapText(text, font, size, maxWidth) {
  const lines = [];
  for (const raw of String(text).split('\n')) {
    const para = raw.trim();
    if (!para) continue;
    let line = '';
    for (const ch of para) {
      const test = line + ch;
      let w = 0;
      try { w = font.widthOfTextAtSize(test, size); } catch { w = test.length * size; }
      if (w > maxWidth && line) { lines.push(line); line = ch; }
      else line = test;
    }
    if (line) lines.push(line);
  }
  return lines;
}

async function paragraphsToPdfBlob(paragraphs, title) {
  if (!window.PDFLib) throw new Error('PDF 库未加载，请检查网络后重试');
  const { PDFDocument, rgb } = window.PDFLib;
  const pdfDoc = await PDFDocument.create();
  if (window.fontkit) pdfDoc.registerFontkit(window.fontkit);
  const fontBytes = await loadChineseFont();
  let font;
  try { font = await pdfDoc.embedFont(fontBytes, { subset: !!window.fontkit }); }
  catch { font = await pdfDoc.embedFont(fontBytes); }

  const pageWidth = 595.28, pageHeight = 841.89, margin = 48;
  const fontSize = 11, lineHeight = 17, maxWidth = pageWidth - margin * 2;
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const newPage = () => { page = pdfDoc.addPage([pageWidth, pageHeight]); y = pageHeight - margin; };
  const drawLine = (line, size, dy) => {
    if (y < margin + lineHeight) newPage();
    try { page.drawText(line, { x: margin, y, size, font, color: rgb(0.1, 0.1, 0.1) }); } catch { /* skip glyphs the font cannot encode */ }
    y -= dy;
  };

  if (title) {
    for (const line of wrapText(title, font, 16, maxWidth)) drawLine(line, 16, 24);
    y -= 6;
  }
  for (const para of paragraphs) {
    const clean = String(para).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
    for (const line of wrapText(clean, font, fontSize, maxWidth)) drawLine(line, fontSize, lineHeight);
    y -= 6;
  }
  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: 'application/pdf' });
}

async function pdfTextToEpubBlob(pagesText, title) {
  const safeTitle = title || 'Converted Book';
  const zip = new JSZip();
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
  zip.folder('META-INF').file('container.xml',
    '<?xml version="1.0" encoding="UTF-8"?>\n<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>');
  const oebps = zip.folder('OEBPS');

  // 每 5 页合并为一章，避免页数很多时文件碎片过多
  const chapters = [];
  for (let i = 0; i < pagesText.length; i += 5) chapters.push(pagesText.slice(i, i + 5));
  if (!chapters.length) throw new Error('这个 PDF 没有可提取的文字层（可能是扫描版），无法转成 EPUB');

  const manifestItems = [];
  const spineItems = [];
  chapters.forEach((chunk, idx) => {
    const id = 'chapter' + (idx + 1);
    const fileName = id + '.xhtml';
    const paras = chunk.map(p => '<p>' + escapeHtml(p).replace(/\n/g, '<br/>') + '</p>').join('\n');
    const xhtml = '<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE html>\n<html xmlns="http://www.w3.org/1999/xhtml"><head><title>' + escapeXml(safeTitle) + '</title></head><body>\n' + paras + '\n</body></html>';
    oebps.file(fileName, xhtml);
    manifestItems.push('<item id="' + id + '" href="' + fileName + '" media-type="application/xhtml+xml"/>');
    spineItems.push('<itemref idref="' + id + '"/>');
  });

  const opf = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookID" version="2.0">' +
    '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">' +
    '<dc:title>' + escapeXml(safeTitle) + '</dc:title><dc:language>zh</dc:language>' +
    '<dc:identifier id="BookID">urn:uuid:' + Date.now() + '</dc:identifier></metadata>' +
    '<manifest>' + manifestItems.join('') + '</manifest>' +
    '<spine>' + spineItems.join('') + '</spine></package>';
  oebps.file('content.opf', opf);

  const blob = await zip.generateAsync({ type: 'blob' });
  return new Blob([blob], { type: 'application/epub+zip' });
}

export async function convEbook(file, target) {
  const ext = getExt(file.name);
  const baseTitle = file.name.replace(/\.[^.]+$/, '');

  if (ext === 'epub') {
    const ab = await readAB(file);
    const zip = await JSZip.loadAsync(ab);
    if (target === 'txt') {
      let texts = [];
      for (const [path, entry] of Object.entries(zip.files)) {
        if (/\.(xhtml|html|htm)$/i.test(path) && !entry.dir) {
          const html = await entry.async('text');
          const div = document.createElement('div'); div.innerHTML = html;
          texts.push(div.textContent || div.innerText || '');
        }
      }
      return new Blob([texts.join('\n\n')], { type: 'text/plain;charset=utf-8' });
    }
    if (target === 'html') {
      let htmls = [];
      for (const [path, entry] of Object.entries(zip.files)) {
        if (/\.(xhtml|html|htm)$/i.test(path) && !entry.dir) htmls.push(await entry.async('text'));
      }
      const combined = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + file.name + '</title><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;line-height:1.8;color:#333}</style></head><body>' + htmls.join('<hr>') + '</body></html>';
      return new Blob([combined], { type: 'text/html;charset=utf-8' });
    }
    if (target === 'pdf') {
      const paragraphs = await extractEpubParagraphs(file);
      if (!paragraphs.length) throw new Error('这本 EPUB 没有提取到正文，无法转成 PDF');
      return paragraphsToPdfBlob(paragraphs, baseTitle);
    }
    if (target === 'epub') return file;
  }

  if (ext === 'pdf') {
    if (target === 'epub' || target === 'txt' || target === 'html') {
      const pagesText = await extractPdfPagesText(file);
      if (!pagesText.length) throw new Error('这个 PDF 没有可提取的文字层（可能是扫描版），无法转换');
      if (target === 'txt') return new Blob([pagesText.join('\n\n')], { type: 'text/plain;charset=utf-8' });
      if (target === 'html') {
        const body = pagesText.map(p => '<p>' + escapeHtml(p).replace(/\n/g, '<br/>') + '</p>').join('\n');
        return new Blob(['<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + escapeHtml(file.name) + '</title><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;line-height:1.8;color:#333}</style></head><body>' + body + '</body></html>'], { type: 'text/html;charset=utf-8' });
      }
      return pdfTextToEpubBlob(pagesText, baseTitle);
    }
  }

  if (['mobi', 'azw3'].includes(ext) && target === 'txt') {
    const ab = await readAB(file);
    const u8 = new Uint8Array(ab);
    let text = '';
    for (let i = 0; i < u8.length; i++) {
      const c = u8[i];
      if ((c >= 32 && c < 127) || c === 10 || c === 13) text += String.fromCharCode(c);
    }
    text = text.replace(/\s{4,}/g, '\n\n');
    return new Blob([text], { type: 'text/plain;charset=utf-8' });
  }
  throw new Error('电子书该转换组合暂不支持');
}
