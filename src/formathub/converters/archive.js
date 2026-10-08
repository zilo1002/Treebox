import { readAB, getExt } from '../utils.js';
export async function convArchive(file, target) {
  const ext = getExt(file.name);
  if (ext === 'zip' && target === 'zip') {
    const ab = await readAB(file);
    const zip = await JSZip.loadAsync(ab);
    const out = await zip.generateAsync({ type: 'blob' });
    return out;
  }
  if (ext === 'zip') {
    const ab = await readAB(file);
    const zip = await JSZip.loadAsync(ab);
    const entries = [];
    for (const [path, entry] of Object.entries(zip.files)) {
      if (!entry.dir) {
        const content = await entry.async('blob');
        entries.push({ path, content, size: entry._data.uncompressedSize });
      }
    }
    return { type: 'extracted', entries };
  }
  throw new Error('仅支持 ZIP 格式');
}