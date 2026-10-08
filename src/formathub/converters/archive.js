import { readAB, getExt } from '../utils.js';

/**
 * ZIP 解压（含带密码的 ZIP）
 * 普通 ZIP 以前用 JSZip 就能解，但 JSZip 不支持加密 ZIP。
 * 这里改用 zip.js（no-worker 版，约 90KB，只在解压时按需从 CDN 加载），
 * 它支持传统 ZipCrypto 和 AES 加密：必须填入正确密码，
 * 没填会报 __ZIP_NEEDS_PASSWORD__，填错会报 __ZIP_WRONG_PASSWORD__，
 * 都不会生成假的解压结果。
 */
const ZIPJS_URL = 'https://cdn.jsdelivr.net/npm/@zip.js/zip.js@2.7.62/dist/zip-no-worker.min.js';
let zipJsPromise = null;

function loadZipJs() {
  if (typeof window !== 'undefined' && window.zip && window.zip.ZipReader) return Promise.resolve(window.zip);
  if (zipJsPromise) return zipJsPromise;
  zipJsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = ZIPJS_URL;
    script.onload = () => {
      if (window.zip && window.zip.ZipReader) {
        try { window.zip.configure({ useWebWorkers: false }); } catch { }
        resolve(window.zip);
      } else {
        zipJsPromise = null;
        reject(new Error('ZIP 解压库加载失败，请检查网络后重试'));
      }
    };
    script.onerror = () => { zipJsPromise = null; reject(new Error('ZIP 解压库加载失败，请检查网络后重试')); };
    document.head.appendChild(script);
  });
  return zipJsPromise;
}

export async function convArchive(file, target, password = '') {
  const ext = getExt(file.name);
  if (ext === 'zip' && target === 'zip') {
    const ab = await readAB(file);
    const zip = await JSZip.loadAsync(ab);
    const out = await zip.generateAsync({ type: 'blob' });
    return out;
  }
  if (ext === 'zip') {
    const zip = await loadZipJs();
    let reader = null;
    try {
      reader = new zip.ZipReader(new zip.BlobReader(file), password ? { password } : undefined);
      const zipEntries = await reader.getEntries();
      const hasEncrypted = zipEntries.some(e => e.encrypted);
      if (hasEncrypted && !password) {
        throw new Error('__ZIP_NEEDS_PASSWORD__');
      }
      const entries = [];
      for (const entry of zipEntries) {
        if (entry.directory) continue;
        let content;
        try {
          content = await entry.getData(new zip.BlobWriter());
        } catch (err) {
          if (entry.encrypted) throw new Error('__ZIP_WRONG_PASSWORD__');
          throw err;
        }
        entries.push({ path: entry.filename, content, size: entry.uncompressedSize });
      }
      return { type: 'extracted', entries };
    } catch (err) {
      if (err && (err.message === '__ZIP_NEEDS_PASSWORD__' || err.message === '__ZIP_WRONG_PASSWORD__')) throw err;
      const msg = String((err && err.message) || err || '');
      if (/invalid password/i.test(msg)) throw new Error('__ZIP_WRONG_PASSWORD__');
      if (/encrypted/i.test(msg)) throw new Error(password ? '__ZIP_WRONG_PASSWORD__' : '__ZIP_NEEDS_PASSWORD__');
      throw err;
    } finally {
      if (reader) { try { await reader.close(); } catch { } }
    }
  }
  throw new Error('仅支持 ZIP 格式');
}
