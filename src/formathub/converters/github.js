/* ============================================================
   GitHub 链接解析与下载
   ============================================================ */

import { getRawMirror, RAW_MIRRORS, getDownloadProgress, saveDownloadProgress, clearDownloadProgress } from '../utils.js';

// 支持：
//   github.com/owner/repo
//   github.com/owner/repo/tree/branch
//   github.com/owner/repo/tree/branch/path
//   github.com/owner/repo/blob/branch/path
const GITHUB_URL_REGEX = /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)(?:\/(blob|tree)\/([^\/]+)(?:\/(.*))?)?\/?$/;

export function parseGitHubUrl(url) {
  const m = url.trim().match(GITHUB_URL_REGEX);
  if (!m) return null;
  return {
    owner: m[1],
    repo: m[2],
    type: m[3] || 'tree',
    branch: m[4] || null,
    path: m[5] ? decodeURIComponent(m[5]) : ''
  };
}

export function isGitHubUrl(url) {
  return GITHUB_URL_REGEX.test(url.trim());
}

/* 获取默认分支 */
export async function getDefaultBranch(owner, repo, signal) {
  const resp = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { signal });
  if (!resp.ok) throw new Error(`获取仓库信息失败 HTTP ${resp.status}`);
  const data = await resp.json();
  return data.default_branch;
}

/* 检查 GitHub API 速率限制 */
export async function checkRateLimit() {
  try {
    const r = await fetch('https://api.github.com/rate_limit');
    const d = await r.json();
    return {
      limit: d.resources.core.limit,
      remaining: d.resources.core.remaining,
      reset: d.resources.core.reset
    };
  } catch { return null; }
}

/* 构建 raw URL（支持镜像源） */
function buildRawUrl(owner, repo, branch, path) {
  const mirrorKey = getRawMirror();
  if (mirrorKey === 'github') {
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  }
  const mirror = RAW_MIRRORS[mirrorKey];
  return `${mirror.url}/${owner}/${repo}/${branch}/${path}`;
}

/* 下载单个文件（走 raw，不耗 API） */
export async function downloadGitHubFile(info, signal) {
  if (!info.branch) {
    info.branch = await getDefaultBranch(info.owner, info.repo, signal);
  }
  const raw = buildRawUrl(info.owner, info.repo, info.branch, info.path);
  const resp = await fetch(raw, { signal });
  if (!resp.ok) throw new Error(`下载失败 HTTP ${resp.status}`);
  const blob = await resp.blob();
  const filename = info.path.split('/').pop();
  return { blob, filename };
}

/* 使用 Tree API 获取文件夹内所有文件（一次调用，无需递归） */
async function fetchTreeFiles(owner, repo, branch, targetPath, signal) {
  const api = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
  const resp = await fetch(api, { signal });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API ${resp.status}`);
  }

  const data = await resp.json();
  if (data.truncated) {
    throw new Error('文件夹过大，API 返回被截断，请尝试下载子文件夹');
  }

  const prefix = targetPath ? targetPath + '/' : '';
  const files = [];
  for (const item of data.tree || []) {
    if (item.type === 'blob' && item.path.startsWith(prefix)) {
      const relativePath = item.path.slice(prefix.length);
      files.push({ path: item.path, name: relativePath || item.path, size: item.size || 0 });
    }
  }
  return files;
}

/* 下载文件夹并打包为 ZIP（支持断点续传） */
export async function downloadGitHubFolder(info, onProgress, signal) {
  if (!info.branch) {
    info.branch = await getDefaultBranch(info.owner, info.repo, signal);
  }

  const downloadId = `${info.owner}/${info.repo}/${info.branch}/${info.path || '__root__'}`;
  const progress = await getDownloadProgress(downloadId);

  let files = await fetchTreeFiles(info.owner, info.repo, info.branch, info.path, signal);
  let skipped = 0;

  if (progress && progress.files && progress.files.length > 0) {
    const doneSet = new Set(progress.files);
    files = files.filter(f => !doneSet.has(f.path));
    skipped = progress.files.length;
    if (onProgress) onProgress(skipped, skipped + files.length, 'resume');
  }

  if (files.length === 0) {
    if (skipped > 0) {
      await clearDownloadProgress(downloadId);
      throw new Error('所有文件已下载完成');
    }
    throw new Error('文件夹为空');
  }

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
  let done = skipped;

  for (const f of files) {
    if (signal?.aborted) throw new Error('已取消');
    try {
      const raw = buildRawUrl(info.owner, info.repo, info.branch, f.path);
      const r = await fetch(raw, { signal });
      if (!r.ok) continue;
      const blob = await r.blob();
      zip.file(f.name, blob);
      done++;
      await saveDownloadProgress(downloadId, {
        owner: info.owner, repo: info.repo, branch: info.branch, path: info.path,
        files: [...(progress?.files || []), f.path]
      });
      if (onProgress) onProgress(done, skipped + files.length, f.name);
    } catch (e) {
      console.warn('skip', f.path, e.message);
    }
  }

  await clearDownloadProgress(downloadId);

  const blob = await zip.generateAsync({ type: 'blob' });
  return { blob, filename: `${folderName}.zip`, done, total: skipped + files.length };
}

/* 纯文件下载（扁平化）—— 按顺序串行下载，无文件夹层级 */
export async function downloadGitHubFolderFlat(info, keepPath, onProgress, signal) {
  if (!info.branch) {
    info.branch = await getDefaultBranch(info.owner, info.repo, signal);
  }

  const downloadId = `${info.owner}/${info.repo}/${info.branch}/${info.path || '__root__'}_flat`;
  const progress = await getDownloadProgress(downloadId);

  let files = await fetchTreeFiles(info.owner, info.repo, info.branch, info.path, signal);
  let skipped = 0;

  if (progress && progress.files && progress.files.length > 0) {
    const doneSet = new Set(progress.files);
    files = files.filter(f => !doneSet.has(f.path));
    skipped = progress.files.length;
    if (onProgress) onProgress(skipped, skipped + files.length, 'resume');
  }

  if (files.length === 0) {
    if (skipped > 0) {
      await clearDownloadProgress(downloadId);
      throw new Error('所有文件已下载完成');
    }
    throw new Error('文件夹为空');
  }

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
  let done = skipped;

  for (const f of files) {
    if (signal?.aborted) throw new Error('已取消');
    try {
      const raw = buildRawUrl(info.owner, info.repo, info.branch, f.path);
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
      await saveDownloadProgress(downloadId, {
        owner: info.owner, repo: info.repo, branch: info.branch, path: info.path,
        files: [...(progress?.files || []), f.path]
      });
      if (onProgress) onProgress(done, skipped + files.length, f.name);
    } catch (e) {
      console.warn('skip', f.path, e.message);
    }
  }

  await clearDownloadProgress(downloadId);

  const blob = await zip.generateAsync({ type: 'blob' });
  return { blob, filename: `${folderName}_flat.zip`, done, total: skipped + files.length };
}

/* ============================================================
   GitHub Release 资产下载
   ============================================================ */


const RELEASE_URL_REGEX = /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)(?:\/releases)?\/?$/;

export function parseReleaseUrl(url) {
  const m = url.trim().match(RELEASE_URL_REGEX);
  if (!m) return null;
  return { owner: m[1], repo: m[2] };
}

export function isReleaseUrl(url) {
  return RELEASE_URL_REGEX.test(url.trim());
}

export async function fetchReleases(owner, repo, signal) {
  const api = `https://api.github.com/repos/${owner}/${repo}/releases`;
  const resp = await fetch(api, { signal });
  if (!resp.ok) throw new Error(`获取 Release 失败 HTTP ${resp.status}`);
  return await resp.json();
}

export async function downloadReleaseAsset(asset, signal) {
  const resp = await fetch(asset.browser_download_url, { signal });
  if (!resp.ok) throw new Error(`下载失败 HTTP ${resp.status}`);
  const blob = await resp.blob();
  return { blob, filename: asset.name, size: asset.size };
}
