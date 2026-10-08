// data.worker.js - 数据格式转换 Worker
// 加载所需 CDN 库（importScripts 在 Worker 内同步加载，不影响主线程 UI）
importScripts(
  'https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js',
  'https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'
);

// ===== 轻量 TOML 解析/序列化（Worker 内联，避免额外 CDN 依赖） =====
const TOML = {
  parse(str) {
    const obj = {};
    let current = obj;
    let currentArray = null;
    const lines = str.split('\n');
    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('#')) continue;
      // 表头 [section]
      if (line.startsWith('[') && line.endsWith(']') && !line.startsWith('[[')) {
        const keys = line.slice(1, -1).split('.');
        current = obj;
        for (const k of keys) {
          if (!current[k]) current[k] = {};
          current = current[k];
        }
        currentArray = null;
        continue;
      }
      // 数组表头 [[section]]
      if (line.startsWith('[[') && line.endsWith(']]')) {
        const keys = line.slice(2, -2).split('.');
        current = obj;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) current[keys[i]] = {};
          current = current[keys[i]];
        }
        const lastKey = keys[keys.length - 1];
        if (!current[lastKey]) current[lastKey] = [];
        currentArray = current[lastKey];
        currentArray.push({});
        current = currentArray[currentArray.length - 1];
        continue;
      }
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      // 字符串
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      } else if (val === 'true') val = true;
      else if (val === 'false') val = false;
      else if (val === 'inf' || val === '+inf') val = Infinity;
      else if (val === '-inf') val = -Infinity;
      else if (val === 'nan') val = NaN;
      else if (!isNaN(Number(val)) && val !== '') val = Number(val);
      else if (val.startsWith('[') && val.endsWith(']')) {
        try { val = JSON.parse(val); } catch(e) {}
      }
      if (key) current[key] = val;
    }
    return obj;
  },
  stringify(obj) {
    const lines = [];
    function write(v, prefix = '') {
      if (v == null) return;
      if (typeof v !== 'object') {
        if (typeof v === 'string') lines.push(`${prefix} = "${v.replace(/"/g, '\\"')}"`);
        else if (typeof v === 'number' && (v === Infinity || v === -Infinity || Number.isNaN(v))) {
          lines.push(`${prefix} = ${v === Infinity ? 'inf' : v === -Infinity ? '-inf' : 'nan'}`);
        }
        else lines.push(`${prefix} = ${v}`);
        return;
      }
      if (Array.isArray(v)) {
        if (v.length && typeof v[0] === 'object') {
          for (const item of v) {
            lines.push(`[[${prefix}]]`);
            write(item, '');
          }
        } else {
          const arr = v.map(x => typeof x === 'string' ? `"${x.replace(/"/g, '\\"')}"` : String(x));
          lines.push(`${prefix} = [${arr.join(', ')}]`);
        }
        return;
      }
      for (const [k, x] of Object.entries(v)) {
        const p = prefix ? `${prefix}.${k}` : k;
        if (typeof x === 'object' && !Array.isArray(x)) {
          lines.push(`[${p}]`);
          write(x, '');
        } else {
          write(x, p);
        }
      }
    }
    write(obj);
    return lines.join('\n');
  }
};

// ===== XML 工具 =====
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

// ===== 主消息处理 =====
self.onmessage = function(e) {
  const { id, type, payload } = e.data;

  try {
    if (type === 'convert') {
      const { text, ext, target } = payload;
      let data;

      self.postMessage({ id, type: 'progress', value: 20 });

      if (ext === 'json') data = JSON.parse(text);
      else if (ext === 'csv') data = Papa.parse(text, { header: true }).data;
      else if (ext === 'xml') data = xmlToObj(text);
      else if (ext === 'yaml' || ext === 'yml') data = jsyaml.load(text);
      else if (ext === 'toml') data = TOML.parse(text);

      self.postMessage({ id, type: 'progress', value: 60 });

      let out, mime, outExt = target;
      if (target === 'json') { out = JSON.stringify(data, null, 2); mime = 'application/json'; }
      else if (target === 'csv') { out = Papa.unparse(Array.isArray(data) ? data : [data]); mime = 'text/csv'; }
      else if (target === 'xml') { out = toXML(data, 'data'); mime = 'application/xml'; }
      else if (target === 'yaml') { out = jsyaml.dump(data); mime = 'text/yaml'; outExt = 'yaml'; }
      else if (target === 'toml') { out = TOML.stringify(data); mime = 'text/toml'; }

      self.postMessage({ id, type: 'progress', value: 90 });
      self.postMessage({ id, type: 'complete', result: { mode: 'text', text: out, mime, ext: outExt } });
    }
    else if (type === 'convertXLSX') {
      const { arrayBuffer, target } = payload;
      const wb = XLSX.read(arrayBuffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];

      self.postMessage({ id, type: 'progress', value: 40 });

      let out, mime;
      if (target === 'csv') {
        out = XLSX.utils.sheet_to_csv(ws);
        mime = 'text/csv';
      } else if (target === 'json') {
        out = JSON.stringify(XLSX.utils.sheet_to_json(ws), null, 2);
        mime = 'application/json';
      } else if (target === 'xlsx') {
        out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else if (target === 'html') {
        out = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>table{border-collapse:collapse;font-size:13px}td,th{border:1px solid #ccc;padding:6px 10px}</style></head><body>' + XLSX.utils.sheet_to_html(ws) + '</body></html>';
        mime = 'text/html';
      }

      self.postMessage({ id, type: 'progress', value: 90 });

      if (target === 'xlsx') {
        self.postMessage({ id, type: 'complete', result: { mode: 'arraybuffer', data: out, mime } });
      } else {
        self.postMessage({ id, type: 'complete', result: { mode: 'text', text: out, mime } });
      }
    }
  } catch (err) {
    self.postMessage({ id, type: 'error', message: err.message });
  }
};
