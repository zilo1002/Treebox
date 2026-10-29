import { readData, getExt } from '../utils.js';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';

export async function convImage(file, target, opts = {}) {
  const ext = getExt(file.name);
  // 滑块给的是 10–100 的百分比，toBlob 要 0–1：大于 1 按百分比换算，
  // 已是小数则直接用，并夹到 [0, 1]。以前 92 直接传给 toBlob 等于恒为最高质量，
  // WebP 还被写死钳在 0.85，滑块等于摆设。
  const rawQ = opts.quality != null ? opts.quality : 92;
  const quality = Math.min(1, Math.max(0, rawQ > 1 ? rawQ / 100 : rawQ));
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
    let w = img.width || 800;
    let h = img.height || 600;
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
    let w = img.width;
    let h = img.height;
    if (maxW && w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
    if (maxH && h > maxH) { w = Math.round(w * maxH / h); h = maxH; }
    if (rotate === 90 || rotate === 270) { const tmp = w; w = h; h = tmp; }
    canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    ctx = canvas.getContext('2d');
    if (target !== 'png' && target !== 'webp') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); }
    applyTransform(ctx, w, h, rotate);
    ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, w, h);
  }

  // GIF：浏览器 canvas.toBlob 不支持 image/gif（永远返回 null），
  // 用 gifenc 编一帧静态 GIF（256 色调色板，无抖动）。画布已在上面垫白，
  // 故此处像素均不透明。
  if (target === 'gif') {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const palette = quantize(imageData.data, 256);
    const index = applyPalette(imageData.data, palette);
    const gif = GIFEncoder();
    gif.writeFrame(index, canvas.width, canvas.height, { palette, first: true });
    gif.finish();
    return new Blob([gif.bytes()], { type: 'image/gif' });
  }

  const mime = target === 'jpg' ? 'image/jpeg' : 'image/' + target;
  const out = await new Promise(r => canvas.toBlob(r, mime, quality));
  if (!out) throw new Error('浏览器不支持导出此格式');
  return out;
}

function applyTransform(ctx, w, h, rotate) {
  if (rotate === 90) { ctx.translate(w, 0); ctx.rotate(Math.PI / 2); }
  else if (rotate === 180) { ctx.translate(w, h); ctx.rotate(Math.PI); }
  else if (rotate === 270) { ctx.translate(0, h); ctx.rotate(-Math.PI / 2); }
}
