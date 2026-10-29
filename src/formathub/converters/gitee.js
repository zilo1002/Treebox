/* ============================================================
   Gitee 链接解析与下载
   ============================================================ */

// 支持：
//   gitee.com/owner/repo
//   gitee.com/owner/repo/tree/branch
//   gitee.com/owner/repo/tree/branch/path
//   gitee.com/owner/repo/blob/branch/path
const GITEE_URL_REGEX = /^https?:\/\/gitee\.com\/([^\/]+)\/([^\/]+)(?:\/(blob|tree)\/([^\/]+)(?:\/(.*))?)?\/?$/;

export function parseGiteeUrl(url) {
  const m = url.trim().match(GITEE_URL_REGEX);
  if (!m) return null;
  // 路径里有孤立的 %（如文件名含 100%）时 decodeURIComponent 会抛 URIError：
  // 当作无效链接返回 null，调用处会提示“链接无效”，而不是毫无反应。
  let path = '';
  if (m[5]) {
    try { path = decodeURIComponent(m[5]); } catch { return null; }
  }
  return {
    owner: m[1],
    repo: m[2],
    type: m[3] || 'tree',
    branch: m[4] || null,
    path
  };
}

export function isGiteeUrl(url) {
  return GITEE_URL_REGEX.test(url.trim());
}

/* 获取默认分支 */
export async function getGiteeDefaultBranch(owner, repo, signal) {
  const resp = await fetch(`https://gitee.com/api/v5/repos/${owner}/${repo}`, { signal });
  if (!resp.ok) throw new Error(`获取仓库信息失败 HTTP ${resp.status}`);
  const data = await resp.json();
  return data.default_branch;
}

/* 经 Gitee contents 接口取单个文件内容并解 base64。
   raw 地址会被浏览器跨域拦截（fetch 永远 Failed to fetch，导航打开却正常），故不走 raw。
   未登录接口每小时 60 次：403 即限流，抛带标记的错，调用处不再逐个重试。 */
async function fetchGiteeFileBlob(owner, repo, branch, path, signal) {
  const api = `https://gitee.com/api/v5/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`;
  const resp = await fetch(api, { signal });
  if (!resp.ok) {
    const err = new Error(resp.status === 403
      ? 'Gitee 接口访问受限 (403)，可能已触发每小时限额，请稍后再试'
      : `获取文件内容失败 HTTP ${resp.status}`);
    if (resp.status === 403) err.isRateLimit = true;
    throw err;
  }
  const data = await resp.json();
  if (data.type !== 'file' || !data.content) {
    throw new Error('该文件无法通过接口获取内容（可能过大）');
  }
  const bin = atob(String(data.content).replace(/\s/g, ''));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes]);
}

/* 下载单个文件（走 contents 接口取 base64 内容） */
export async function downloadGiteeFile(info, signal) {
  if (!info.branch) {
    info.branch = await getGiteeDefaultBranch(info.owner, info.repo, signal);
  }
  const blob = await fetchGiteeFileBlob(info.owner, info.repo, info.branch, info.path, signal);
  const filename = info.path.split('/').pop();
  return { blob, filename };
}

/* 递归获取文件夹内所有文件（带错误隔离，单文件夹失败不中断整体）。
   根目录请求失败不再静默吞掉：抛明错，调用处不再把“连不上 Gitee”报成“文件夹为空”。 */
async function walkGiteeTree(owner, repo, branch, path, prefix, out, signal, isRoot) {
  const apiPath = path ? `contents/${encodeURIComponent(path)}` : 'contents';
  const api = `https://gitee.com/api/v5/repos/${owner}/${repo}/${apiPath}?ref=${branch}`;
  let items;
  try {
    const resp = await fetch(api, { signal });
    if (!resp.ok) {
      if (isRoot) {
        const err = new Error(resp.status === 403
          ? 'Gitee 接口访问受限 (403)，可能已触发每小时限额，请稍后再试'
          : `Gitee 接口访问失败 HTTP ${resp.status}`);
        if (resp.status === 403) err.isRateLimit = true;
        throw err;
      }
      console.warn(`Gitee API ${resp.status} for ${path || 'root'}`);
      return;
    }
    items = await resp.json();
  } catch (e) {
    if (isRoot) {
      if (e.isRateLimit) throw e;
      throw new Error(`无法访问 Gitee 接口（${e.message}）`);
    }
    console.warn(`Gitee API error for ${path || 'root'}:`, e.message);
    return;
  }

  const list = Array.isArray(items) ? items : [items];

  for (const it of list) {
    if (signal?.aborted) throw new Error('已取消');
    if (it.type === 'file') {
      out.push({ path: it.path, name: prefix ? `${prefix}/${it.name}` : it.name, size: it.size || 0 });
    } else if (it.type === 'dir' || it.type === 'tree') {
      await walkGiteeTree(owner, repo, branch, it.path, prefix ? `${prefix}/${it.name}` : it.name, out, signal, false);
    }
  }
}

/* 下载文件夹并打包为 ZIP */
export async function downloadGiteeFolder(info, onProgress, signal) {
  if (!info.branch) {
    info.branch = await getGiteeDefaultBranch(info.owner, info.repo, signal);
  }

  const files = [];
  await walkGiteeTree(info.owner, info.repo, info.branch, info.path, '', files, signal, true);

  if (files.length === 0) throw new Error('文件夹为空或无法访问');

  if (!window.JSZip) {
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  const zip = new window.JSZip();
  const folderName = info.path ? info.path.split('/').pop() : info.repo;
  let done = 0;

  for (const f of files) {
    if (signal?.aborted) throw new Error('已取消');
    try {
      const blob = await fetchGiteeFileBlob(info.owner, info.repo, info.branch, f.path, signal);
      zip.file(f.name, blob);
      done++;
      if (onProgress) onProgress(done, files.length, f.name);
    } catch (e) {
      if (signal?.aborted) throw new Error('已取消');
      if (e.isRateLimit) throw e;
      console.warn('skip', f.path, e.message);
    }
  }

  if (done === 0) throw new Error('所有文件均下载失败，请检查网络或 Gitee 接口限额');

  const blob = await zip.generateAsync({ type: 'blob' });
  return { blob, filename: `${folderName}.zip`, done, total: files.length };
}

/* 纯文件下载（扁平化）—— 按顺序串行下载，无文件夹层级 */
export async function downloadGiteeFolderFlat(info, keepPath, onProgress, signal) {
  if (!info.branch) {
    info.branch = await getGiteeDefaultBranch(info.owner, info.repo, signal);
  }

  const files = [];
  await walkGiteeTree(info.owner, info.repo, info.branch, info.path, '', files, signal, true);

  if (files.length === 0) throw new Error('文件夹为空或无法访问');

  if (!window.JSZip) {
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  const zip = new window.JSZip();
  const folderName = info.path ? info.path.split('/').pop() : info.repo;
  const usedNames = new Set();
  let done = 0;

  for (const f of files) {
    if (signal?.aborted) throw new Error('已取消');
    try {
      const blob = await fetchGiteeFileBlob(info.owner, info.repo, info.branch, f.path, signal);

      let flatName;
      if (keepPath) {
        flatName = f.name.replace(/\//g, '_');
      } else {
        flatName = f.name.split('/').pop();
        const ext = flatName.includes('.') ? flatName.split('.').pop() : '';
        const base = ext ? flatName.slice(0, -(ext.length + 1)) : flatName;
        let candidate = flatName;
        let counter = 1;
        while (usedNames.has(candidate)) {
          candidate = ext ? `${base}_${counter}.${ext}` : `${base}_${counter}`;
          counter++;
        }
        flatName = candidate;
      }
      usedNames.add(flatName);

      zip.file(flatName, blob);
      done++;
      if (onProgress) onProgress(done, files.length, f.name);
    } catch (e) {
      if (signal?.aborted) throw new Error('已取消');
      if (e.isRateLimit) throw e;
      console.warn('skip', f.path, e.message);
    }
  }

  if (done === 0) throw new Error('所有文件均下载失败，请检查网络或 Gitee 接口限额');

  const blob = await zip.generateAsync({ type: 'blob' });
  return { blob, filename: `${folderName}_flat.zip`, done, total: files.length };
}