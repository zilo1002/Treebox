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
  return {
    owner: m[1],
    repo: m[2],
    type: m[3] || 'tree',
    branch: m[4] || null,
    path: m[5] ? decodeURIComponent(m[5]) : ''
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

/* 下载单个文件（走 raw） */
export async function downloadGiteeFile(info, signal) {
  if (!info.branch) {
    info.branch = await getGiteeDefaultBranch(info.owner, info.repo, signal);
  }
  const raw = `https://gitee.com/${info.owner}/${info.repo}/raw/${info.branch}/${info.path}`;
  const resp = await fetch(raw, { signal });
  if (!resp.ok) throw new Error(`下载失败 HTTP ${resp.status}`);
  const blob = await resp.blob();
  const filename = info.path.split('/').pop();
  return { blob, filename };
}

/* 递归获取文件夹内所有文件（带错误隔离，单文件夹失败不中断整体） */
async function walkGiteeTree(owner, repo, branch, path, prefix, out, signal) {
  const apiPath = path ? `contents/${encodeURIComponent(path)}` : 'contents';
  const api = `https://gitee.com/api/v5/repos/${owner}/${repo}/${apiPath}?ref=${branch}`;
  let items;
  try {
    const resp = await fetch(api, { signal });
    if (!resp.ok) {
      console.warn(`Gitee API ${resp.status} for ${path || 'root'}`);
      return;
    }
    items = await resp.json();
  } catch (e) {
    console.warn(`Gitee API error for ${path || 'root'}:`, e.message);
    return;
  }

  const list = Array.isArray(items) ? items : [items];

  for (const it of list) {
    if (signal?.aborted) throw new Error('已取消');
    if (it.type === 'file') {
      out.push({ path: it.path, name: prefix ? `${prefix}/${it.name}` : it.name, size: it.size || 0 });
    } else if (it.type === 'dir' || it.type === 'tree') {
      await walkGiteeTree(owner, repo, branch, it.path, prefix ? `${prefix}/${it.name}` : it.name, out, signal);
    }
  }
}

/* 下载文件夹并打包为 ZIP */
export async function downloadGiteeFolder(info, onProgress, signal) {
  if (!info.branch) {
    info.branch = await getGiteeDefaultBranch(info.owner, info.repo, signal);
  }

  const files = [];
  await walkGiteeTree(info.owner, info.repo, info.branch, info.path, '', files, signal);

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
      const raw = `https://gitee.com/${info.owner}/${info.repo}/raw/${info.branch}/${f.path}`;
      const r = await fetch(raw, { signal });
      if (!r.ok) continue;
      const blob = await r.blob();
      zip.file(f.name, blob);
      done++;
      if (onProgress) onProgress(done, files.length, f.name);
    } catch (e) {
      console.warn('skip', f.path, e.message);
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  return { blob, filename: `${folderName}.zip`, done, total: files.length };
}

/* 纯文件下载（扁平化）—— 按顺序串行下载，无文件夹层级 */
export async function downloadGiteeFolderFlat(info, keepPath, onProgress, signal) {
  if (!info.branch) {
    info.branch = await getGiteeDefaultBranch(info.owner, info.repo, signal);
  }

  const files = [];
  await walkGiteeTree(info.owner, info.repo, info.branch, info.path, '', files, signal);

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
      const raw = `https://gitee.com/${info.owner}/${info.repo}/raw/${info.branch}/${f.path}`;
      const r = await fetch(raw, { signal });
      if (!r.ok) continue;
      const blob = await r.blob();

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
      console.warn('skip', f.path, e.message);
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  return { blob, filename: `${folderName}_flat.zip`, done, total: files.length };
}