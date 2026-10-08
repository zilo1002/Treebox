import { dlBlob, readText } from '../utils.js';

export async function formatJSON(file, mode) {
  const text = await readText(file);
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error('JSON 语法错误: ' + e.message);
  }
  let out;
  if (mode === 'beautify') {
    out = JSON.stringify(data, null, 2);
  } else if (mode === 'compress') {
    out = JSON.stringify(data);
  } else if (mode === 'validate') {
    return { valid: true, message: 'JSON 格式正确' };
  }
  return new Blob([out], { type: 'application/json;charset=utf-8' });
}