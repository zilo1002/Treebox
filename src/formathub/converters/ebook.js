import { readAB, getExt } from '../utils.js';
export async function convEbook(file, target) {
  const ext = getExt(file.name);
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