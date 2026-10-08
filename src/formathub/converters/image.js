import { readData, getExt } from '../utils.js';

export async function convImage(file, target, opts = {}) {
  const ext = getExt(file.name);
  const quality = opts.quality != null ? opts.quality : 0.92;
  const maxW = opts.width || null;
  const maxH = opts.height || null;
  const rotate = opts.rotate || 0;

  let canvas, ctx;

  if (ext === 'svg') {
    if (target === 'svg') return file;
    const text = await file.text();
    const blob = new Blob([text], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = await createImageBitmap(blob);
    // createImageBitmap 已解码完成，无需等待 onload
    canvas = document.createElement('canvas');
    let w = img.naturalWidth || 800;
    let h = img.naturalHeight || 600;
    if (rotate === 90 || rotate === 270) { const tmp = w; w = h; h = tmp; }
    canvas.width = w; canvas.height = h;
    ctx = canvas.getContext('2d');
    if (target !== 'png') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); }
    applyTransform(ctx, w, h, rotate);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
  } else {
    const dataUrl = await readData(file);
    const blob = await file.slice(0, file.size, file.type);
    const img = await createImageBitmap(blob);
    let w = img.naturalWidth;
    let h = img.naturalHeight;
    if (maxW && w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
    if (maxH && h > maxH) { w = Math.round(w * maxH / h); h = maxH; }
    if (rotate === 90 || rotate === 270) { const tmp = w; w = h; h = tmp; }
    canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    ctx = canvas.getContext('2d');
    if (target !== 'png' && target !== 'webp' && target !== 'gif') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); }
    applyTransform(ctx, w, h, rotate);
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, w, h);
  }

  const mime = target === 'jpg' ? 'image/jpeg' : 'image/' + target;
  const q = target === 'webp' ? Math.min(quality, 0.85) : quality;
  const out = await new Promise(r => canvas.toBlob(r, mime, q));
  if (!out) throw new Error('浏览器不支持导出此格式');
  return out;
}

function applyTransform(ctx, w, h, rotate) {
  if (rotate === 90) { ctx.translate(w, 0); ctx.rotate(Math.PI / 2); }
  else if (rotate === 180) { ctx.translate(w, h); ctx.rotate(Math.PI); }
  else if (rotate === 270) { ctx.translate(0, h); ctx.rotate(-Math.PI / 2); }
}
