// doc.worker.js - 文档解析 Worker（mammoth 纯文本/HTML 提取）
importScripts('https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js');

self.onmessage = function(e) {
  const { id, type, payload } = e.data;

  try {
    if (type === 'extractText') {
      const { arrayBuffer } = payload;
      mammoth.extractRawText({ arrayBuffer })
        .then(result => {
          self.postMessage({
            id,
            type: 'complete',
            result: { mode: 'text', text: result.value, mime: 'text/plain' }
          });
        })
        .catch(err => {
          self.postMessage({ id, type: 'error', message: err.message });
        });
    }
    else if (type === 'convertHtml') {
      const { arrayBuffer, fileName } = payload;
      mammoth.convertToHtml({ arrayBuffer })
        .then(result => {
          const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + (fileName || 'Document') + '</title></head><body>' + result.value + '</body></html>';
          self.postMessage({
            id,
            type: 'complete',
            result: { mode: 'text', text: html, mime: 'text/html' }
          });
        })
        .catch(err => {
          self.postMessage({ id, type: 'error', message: err.message });
        });
    }
  } catch (err) {
    self.postMessage({ id, type: 'error', message: err.message });
  }
};
