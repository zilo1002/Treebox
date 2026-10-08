// ebook.worker.js - 电子书转换 Worker
importScripts('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js');

// 轻量 HTML 到文本转换（Worker 中无 DOM）
function htmlToText(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

self.onmessage = function(e) {
  const { id, type, payload } = e.data;

  try {
    if (type === 'convertEpub') {
      const { arrayBuffer, target, fileName } = payload;

      JSZip.loadAsync(arrayBuffer).then(zip => {
        const htmlFiles = Object.entries(zip.files)
          .filter(([path, entry]) => !entry.dir && /\.(xhtml|html|htm)$/i.test(path));

        self.postMessage({ id, type: 'progress', value: 40 });

        const promises = htmlFiles.map(([path, entry]) => entry.async('text'));

        Promise.all(promises).then(htmls => {
          self.postMessage({ id, type: 'progress', value: 80 });

          if (target === 'txt') {
            const texts = htmls.map(html => htmlToText(html));
            const text = texts.join('\n\n');
            self.postMessage({
              id,
              type: 'complete',
              result: { mode: 'text', text, mime: 'text/plain' }
            });
          } else if (target === 'html') {
            const combined = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + (fileName || 'Ebook') + '</title><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;line-height:1.8;color:#333}</style></head><body>' + htmls.join('<hr>') + '</body></html>';
            self.postMessage({
              id,
              type: 'complete',
              result: { mode: 'text', text: combined, mime: 'text/html' }
            });
          }
        }).catch(err => {
          self.postMessage({ id, type: 'error', message: err.message });
        });
      }).catch(err => {
        self.postMessage({ id, type: 'error', message: err.message });
      });
    }
    else if (type === 'convertMobi') {
      const { uint8Array } = payload;
      let text = '';
      for (let i = 0; i < uint8Array.length; i++) {
        const c = uint8Array[i];
        if ((c >= 32 && c < 127) || c === 10 || c === 13) text += String.fromCharCode(c);
      }
      text = text.replace(/\s{4,}/g, '\n\n');
      self.postMessage({
        id,
        type: 'complete',
        result: { mode: 'text', text, mime: 'text/plain' }
      });
    }
  } catch (err) {
    self.postMessage({ id, type: 'error', message: err.message });
  }
};
