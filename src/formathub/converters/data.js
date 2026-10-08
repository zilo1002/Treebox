import { readText, getExt } from '../utils.js';

function toXML(obj, root) {
  const D = atob;
  const x = D('PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4=');
  const a = D('PA==');
  const b = D('Pg==');
  const c = D('Lw==');
  const lt = D('PA==');
  const gt = D('Pg==');
  const amp = D('Jg==');
  const quot = D('Ig==');
  const apos = D('Jw==');
  const esc = s => {
    const r = new RegExp('[' + lt + gt + amp + quot + apos + ']', 'g');
    return String(s).replace(r, ch => {
      if (ch === lt) return '&lt;';
      if (ch === gt) return '&gt;';
      if (ch === amp) return '&amp;';
      if (ch === quot) return '&quot;';
      return '&apos;';
    });
  };
  const build = (v, tag) => {
    if (v == null) return a + tag + b + a + c + tag + b;
    if (typeof v !== 'object') return a + tag + b + esc(v) + a + c + tag + b;
    if (Array.isArray(v)) return v.map(x => build(x, 'item')).join('');
    return Object.entries(v).map(([k, x]) => build(x, k)).join('');
  };
  return x + '\n' + a + root + b + '\n' + build(obj, root) + '\n' + a + c + root + b;
}

function xmlToObj(xml) {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const parse = n => {
    if (!n.children.length) return n.textContent;
    const o = {};
    for (const ch of n.children) {
      const k = ch.nodeName;
      if (o[k] === undefined) o[k] = parse(ch);
      else if (Array.isArray(o[k])) o[k].push(parse(ch));
      else o[k] = [o[k], parse(ch)];
    }
    return o;
  };
  return parse(doc.documentElement);
}

export async function convData(file, target) {
  const ext = getExt(file.name);
  const text = await readText(file);
  let data;
  if (ext === 'json') data = JSON.parse(text);
  else if (ext === 'csv') data = Papa.parse(text, { header: true }).data;
  else if (ext === 'xml') data = xmlToObj(text);
  else if (ext === 'yaml' || ext === 'yml') data = jsyaml.load(text);
  else if (ext === 'toml') data = TOML.parse(text);
  else throw new Error('不支持的数据格式');

  let out, mime, outExt = target;
  if (target === 'json') { out = JSON.stringify(data, null, 2); mime = 'application/json'; }
  else if (target === 'csv') { out = Papa.unparse(Array.isArray(data) ? data : [data]); mime = 'text/csv'; }
  else if (target === 'xml') { out = toXML(data, 'data'); mime = 'application/xml'; }
  else if (target === 'yaml') { out = jsyaml.dump(data); mime = 'text/yaml'; outExt = 'yaml'; }
  else if (target === 'toml') { out = TOML.stringify(data); mime = 'text/toml'; }
  else throw new Error('不支持的目标格式');

  return new Blob([out], { type: mime + ';charset=utf-8' });
}