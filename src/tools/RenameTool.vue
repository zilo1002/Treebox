<template>
  <div class="rename-tool">
    <!-- Upload -->
    <div v-if="!files.length">
      <div class="upload-area"
        @click="triggerFile"
        @drop.prevent="onDrop"
        @dragover.prevent="dragover = true"
        @dragleave.prevent="dragover = false"
        :class="{ dragover }">
        <input type="file" ref="fileInput" multiple @change="onFileSelect" hidden>
        <div class="upload-inner">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <p class="upload-title">{{ parsing ? '正在解析，请稍候…' : '点击或拖拽文件到此处' }}</p>
          <p class="upload-hint">支持多选；.zip 会展开，也可直接上传文件夹；不会上传服务器</p>
        </div>
      </div>
      <button class="btn-secondary folder-upload-btn" @click="triggerFolder">📂 上传文件夹</button>
      <input type="file" ref="folderInput" webkitdirectory @change="onFolderSelect" hidden>
    </div>

    <!-- Editor -->
    <div v-else class="editor">
      <!-- Rules -->
      <div class="rules-panel">
        <div class="rule-row">
          <div class="rule-field">
            <label>前缀</label>
            <input v-model="prefix" type="text" placeholder="例如：IMG_">
          </div>
          <div class="rule-field">
            <label>后缀</label>
            <input v-model="suffix" type="text" placeholder="例如：_backup">
          </div>
        </div>
        <div class="rule-row">
          <div class="rule-field">
            <label>起始序号</label>
            <input v-model.number="startNum" type="number" min="0">
          </div>
          <div class="rule-field">
            <label>序号位数</label>
            <input v-model.number="numDigits" type="number" min="1" max="10">
          </div>
          <div class="rule-field">
            <label>序号位置</label>
            <select v-model="numPosition">
              <option value="before">文件名前</option>
              <option value="after">文件名后</option>
            </select>
          </div>
        </div>
        <div class="rule-row">
          <div class="rule-field">
            <label>查找</label>
            <input v-model="findText" type="text" placeholder="要替换的文本">
          </div>
          <div class="rule-field">
            <label>替换为</label>
            <input v-model="replaceText" type="text" placeholder="新文本">
          </div>
        </div>
        <div class="rule-actions">
          <button class="btn-secondary" @click="applyRules">应用规则</button>
          <button class="btn-secondary" @click="resetNames">重置原名</button>
          <button class="btn-secondary" @click="clearAll">清空列表</button>
        </div>
      </div>

      <!-- File List -->
      <div class="file-list">
        <div class="list-header">
          <span class="col-num">#</span>
          <span class="col-kind"></span>
          <span class="col-old">原文件名</span>
          <span class="col-arrow">→</span>
          <span class="col-new">新文件名</span>
        </div>
        <div v-for="(item, i) in files" :key="i" class="file-row" :class="{ changed: item.oldName !== item.newName }">
          <span class="col-num">{{ i + 1 }}</span>
          <span class="col-kind">{{ item.kind === 'dir' ? '📁' : item.kind === 'zip' ? '🗜️' : item.kind === 'folder' ? '📂' : '📄' }}</span>
          <span class="col-old" :title="item.oldName">{{ item.oldName }}</span>
          <span class="col-arrow">→</span>
          <input v-model="item.newName" type="text" class="col-new-input" @change="onNameEdited(item)">
        </div>
      </div>

      <!-- Bottom Actions -->
      <div class="bottom-actions">
        <button class="btn-primary" @click="downloadAll" :disabled="downloading">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          {{ downloading ? '下载中...' : '下载全部' }}
        </button>
        <button class="btn-secondary" @click="copyScript">复制批处理脚本</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const fileInput = ref(null)
const folderInput = ref(null)
const dragover = ref(false)
const files = ref([])
const downloading = ref(false)
const parsing = ref(false)

// Rules
const prefix = ref('')
const suffix = ref('')
const startNum = ref(1)
const numDigits = ref(2)
const numPosition = ref('before')
const findText = ref('')
const replaceText = ref('')

// 列表项结构：
// { kind: 'file'|'dir'|'zip', source: 'upload'|'zip',
//   file, zipEntry, zipId, oldName, newName, ext, base, dir, _appliedName }
// kind 'zip' = 上传的 .zip 文件本身（改它的名 = 改打出来的包名）；
// kind 'dir' = zip 内部文件夹（含推断出的中间目录）；dir 以 '/ ' 结尾，如 'docs/'。
let zipSeq = 0

function splitName(name) {
  const idx = name.lastIndexOf('.')
  if (idx < 0) return { base: name, ext: '' }
  return { base: name.slice(0, idx), ext: name.slice(idx) }
}

function triggerFile() {
  fileInput.value?.click()
}

async function triggerFolder() {
  // 优先用系统文件夹选择器（File System Access API）：部分手机浏览器不认 webkitdirectory
  // 选择框，却认这个。用户取消则静默返回，不再弹选择框；其他错误回退到选择框。
  if (typeof window.showDirectoryPicker === 'function') {
    try {
      const handle = await window.showDirectoryPicker()
      parsing.value = true
      try {
        const dropped = []
        await collectHandle(handle, '', dropped)
        addDroppedEntries(dropped)
      } finally {
        parsing.value = false
      }
      return
    } catch (e) {
      if (e && e.name === 'AbortError') return
    }
  }
  folderInput.value?.click()
}

// File System Access 的目录句柄递归：与拖入条目同一形状，复用 addDroppedEntries
async function collectHandle(handle, prefix, out) {
  const path = prefix ? prefix + '/' + handle.name : handle.name
  if (handle.kind === 'file') {
    out.push({ path, isDir: false, file: await handle.getFile(), zipEntry: null })
  } else {
    out.push({ path, isDir: true, file: null, zipEntry: null })
    for await (const child of handle.values()) {
      await collectHandle(child, path, out)
    }
  }
}

function onFileSelect(e) {
  handleFiles(e.target.files)
}

function onFolderSelect(e) {
  const list = Array.from(e.target.files || [])
  folderInput.value && (folderInput.value.value = '')
  if (!list.length) return
  addFolderFiles(list)
  // 选择框回退到了选文件模式（文件全无文件夹路径）：明说，不让用户以为文件夹结构还在
  if (!list.some(f => f.webkitRelativePath && f.webkitRelativePath.includes('/'))) {
    alert('这台设备选不了文件夹，已按散文件加入；要保留文件夹结构，请先把文件夹打成 zip 再上传')
  }
}

// 文件夹选择框的文件带 webkitRelativePath（如 photos/img/a.jpg），按顶层目录分组
function addFolderFiles(list) {
  const groups = new Map()
  const loose = []
  for (const f of list) {
    const rel = f.webkitRelativePath || f.name
    const slash = rel.indexOf('/')
    if (slash === -1) {
      loose.push(regularItem(f))
    } else {
      const root = rel.slice(0, slash)
      if (!groups.has(root)) groups.set(root, [])
      groups.get(root).push({ path: rel, isDir: false, file: f, zipEntry: null })
    }
  }
  for (const [root, entries] of groups) {
    files.value.push(...expandFolder(entries, root))
  }
  if (loose.length) files.value.push(...loose)
}

function entryToFile(entry) {
  return new Promise((resolve, reject) => entry.file(resolve, reject))
}

async function readAllEntries(dirEntry) {
  const reader = dirEntry.createReader()
  const out = []
  for (;;) {
    const batch = await new Promise((resolve, reject) => reader.readEntries(resolve, reject))
    if (!batch.length) break
    out.push(...batch)
  }
  return out
}

async function collectEntry(entry, prefix, out) {
  const path = prefix ? prefix + '/' + entry.name : entry.name
  if (entry.isFile) {
    out.push({ path, isDir: false, file: await entryToFile(entry), zipEntry: null })
  } else if (entry.isDirectory) {
    out.push({ path, isDir: true, file: null, zipEntry: null })
    for (const child of await readAllEntries(entry)) {
      await collectEntry(child, path, out)
    }
  }
}

async function onDrop(e) {
  dragover.value = false
  const dt = e.dataTransfer
  const items = dt ? Array.from(dt.items || []) : []
  const entries = []
  for (const it of items) {
    const en = typeof it.webkitGetAsEntry === 'function' ? it.webkitGetAsEntry() : null
    if (en) entries.push(en)
  }
  if (entries.length) {
    parsing.value = true
    try {
      const dropped = []
      for (const en of entries) await collectEntry(en, '', dropped)
      addDroppedEntries(dropped)
    } finally {
      parsing.value = false
    }
    return
  }
  handleFiles(dt.files)
}

// 拖入内容按顶层目录分组；单段目录（空文件夹）只有容器行
function addDroppedEntries(dropped) {
  const groups = new Map()
  const loose = []
  for (const d of dropped) {
    const slash = d.path.indexOf('/')
    if (slash === -1) {
      if (d.isDir) {
        if (!groups.has(d.path)) groups.set(d.path, [])
      } else {
        loose.push(regularItem(d.file))
      }
    } else {
      const root = d.path.slice(0, slash)
      if (!groups.has(root)) groups.set(root, [])
      groups.get(root).push(d)
    }
  }
  for (const [root, entries] of groups) {
    files.value.push(...expandFolder(entries, root))
  }
  if (loose.length) files.value.push(...loose)
}

let jszipPromise = null
function getJSZip() {
  if (window.JSZip) return Promise.resolve(window.JSZip)
  if (!jszipPromise) {
    jszipPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
      s.onload = () => (window.JSZip ? resolve(window.JSZip) : reject(new Error('JSZip 未加载')))
      s.onerror = () => reject(new Error('JSZip 加载失败'))
      document.head.appendChild(s)
    }).catch(e => { jszipPromise = null; throw e })
  }
  return jszipPromise
}

function regularItem(f) {
  const { base, ext } = splitName(f.name)
  return { kind: 'file', source: 'upload', file: f, zipEntry: null, zipId: 0, oldName: f.name, newName: f.name, ext, base, dir: '', _appliedName: f.name }
}

// 共享的包内行构建：entries 为 [{ path, isDir, file, zipEntry }]，path 不带末尾 '/'；
// minDepth 为开始补目录行的深度（zip 为 1；文件夹为 2，根目录本身由容器行代表）。
// 目录行会为缺失的中间目录补齐（zip 常省略目录条目），已有的不重复。
function buildPackageRows(groupId, entries, minDepth, source) {
  const seenDirs = new Set()
  const rows = []
  for (const { path, isDir, file, zipEntry } of entries) {
    const clean = path.replace(/\/$/, '')
    if (!clean) continue
    const parts = clean.split('/')
    for (let d = minDepth; d < parts.length; d++) {
      const dirPath = parts.slice(0, d).join('/')
      if (!seenDirs.has(dirPath)) {
        seenDirs.add(dirPath)
        const parent = parts.slice(0, d - 1).join('/')
        rows.push({ kind: 'dir', source, file: null, zipEntry: null, zipId: groupId, oldName: dirPath, newName: dirPath, ext: '', base: parts[d - 1], dir: parent ? parent + '/' : '', _appliedName: dirPath })
      }
    }
    if (isDir) {
      if (!seenDirs.has(clean)) {
        seenDirs.add(clean)
        const parent = parts.slice(0, -1).join('/')
        rows.push({ kind: 'dir', source, file: null, zipEntry: null, zipId: groupId, oldName: clean, newName: clean, ext: '', base: parts[parts.length - 1], dir: parent ? parent + '/' : '', _appliedName: clean })
      }
      continue
    }
    const parent = parts.slice(0, -1).join('/')
    const { base: b, ext: e } = splitName(parts[parts.length - 1])
    rows.push({ kind: 'file', source, file: file || null, zipEntry: zipEntry || null, zipId: groupId, oldName: clean, newName: clean, ext: e, base: b, dir: parent ? parent + '/' : '', _appliedName: clean })
  }
  return rows
}

async function expandZip(f) {
  const JSZipCtor = await getJSZip()
  const zip = await JSZipCtor.loadAsync(await f.arrayBuffer())
  const zipId = ++zipSeq
  const { base, ext } = splitName(f.name)
  const container = { kind: 'zip', source: 'zip', file: f, zipEntry: null, zipId, oldName: f.name, newName: f.name, ext, base, dir: '', _appliedName: f.name }
  const entries = []
  zip.forEach((path, entry) => entries.push({ path, isDir: entry.dir, file: null, zipEntry: entry }))
  return [container, ...buildPackageRows(zipId, entries, 1, 'zip')]
}

// 文件夹上传：条目路径带根目录前缀（如 photos/img/a.jpg），根目录本身由容器行代表。
// 容器行即输出包名（下载时自动补 .zip 后缀）；内部路径以根目录名为前缀，改容器名即改前缀。
function expandFolder(entries, rootName) {
  const zipId = ++zipSeq
  const container = { kind: 'folder', source: 'folder', file: null, zipEntry: null, zipId, oldName: rootName, newName: rootName, ext: '', base: rootName, dir: '', _appliedName: rootName }
  const rest = entries.filter(en => en.path !== rootName)
  return [container, ...buildPackageRows(zipId, rest, 2, 'folder')]
}

async function handleFiles(fileList) {
  if (!fileList || !fileList.length) return
  parsing.value = true
  const failed = []
  try {
    for (const f of Array.from(fileList)) {
      if (/\.zip$/i.test(f.name)) {
        try {
          files.value.push(...await expandZip(f))
        } catch (e) {
          failed.push(f.name)
          files.value.push(regularItem(f))
        }
      } else {
        files.value.push(regularItem(f))
      }
    }
  } finally {
    parsing.value = false
  }
  if (failed.length) {
    alert(`以下文件无法按 zip 展开，已按普通文件加入：\n${failed.join('\n')}`)
  }
}

// 文件夹/包容器改名后，同一包内名字以旧路径开头的条目跟着换前缀（改完输入框、失焦/回车时触发）
function onNameEdited(item) {
  if (item.kind !== 'dir' && item.kind !== 'folder') return
  const prev = item._appliedName ?? item.oldName
  const next = item.newName.replace(/\/+$/, '')
  item.newName = next
  if (prev === next || !prev) { item._appliedName = next; return }
  for (const it of files.value) {
    if (it === item || it.zipId !== item.zipId) continue
    if (it.newName.startsWith(prev + '/')) {
      it.newName = next + it.newName.slice(prev.length)
      if (it.kind === 'dir') it._appliedName = it.newName
    }
  }
  item._appliedName = next
}

function applyRules() {
  // 1. 每项先算好“最后一段”的新名字（序号按列表顺序，与原来一致）
  const segName = new Map()
  files.value.forEach((item, i) => {
    let name = item.base
    if (findText.value) {
      name = name.split(findText.value).join(replaceText.value)
    }
    const num = String(startNum.value + i).padStart(numDigits.value, '0')
    if (numPosition.value === 'before') {
      name = prefix.value + num + name + suffix.value
    } else {
      name = prefix.value + name + num + suffix.value
    }
    segName.set(item, name + item.ext)
  })
  // 2. 文件夹路径重映射：浅层先算，子目录继承已改名的父路径（包容器按一层目录算）
  const dirMap = new Map()
  const dirItems = files.value
    .filter(it => it.kind === 'dir' || it.kind === 'folder')
    .sort((a, b) => a.oldName.split('/').length - b.oldName.split('/').length)
  for (const d of dirItems) {
    const parts = d.oldName.split('/')
    const parentOld = parts.slice(0, -1).join('/')
    const parentNew = parentOld ? (dirMap.get(parentOld) ?? parentOld) : ''
    dirMap.set(d.oldName, parentNew ? parentNew + '/' + segName.get(d) : segName.get(d))
  }
  // 3. 合成完整新路径
  files.value.forEach(item => {
    if (item.kind === 'dir' || item.kind === 'folder') {
      item.newName = dirMap.get(item.oldName)
      item._appliedName = item.newName
    } else if (item.source === 'zip' || item.source === 'folder') {
      const parentOld = item.dir ? item.dir.replace(/\/$/, '') : ''
      const parentNew = parentOld ? (dirMap.get(parentOld) ?? parentOld) : ''
      item.newName = parentNew ? parentNew + '/' + segName.get(item) : segName.get(item)
    } else {
      item.newName = segName.get(item)
    }
  })
}

function resetNames() {
  files.value.forEach(item => {
    item.newName = item.oldName
    item._appliedName = item.oldName
  })
}

function clearAll() {
  files.value = []
  fileInput.value && (fileInput.value.value = '')
  folderInput.value && (folderInput.value.value = '')
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

async function downloadZipGroup(container) {
  const JSZipCtor = await getJSZip()
  const zip = new JSZipCtor()
  const entries = files.value.filter(it => it.zipId === container.zipId && it !== container)
  for (const it of entries) {
    const target = it.newName.replace(/^\/+/, '')
    if (!target) continue
    if (it.kind === 'dir') {
      zip.folder(target)
    } else {
      const data = it.zipEntry ? await it.zipEntry.async('uint8array') : await it.file.arrayBuffer()
      zip.file(target, data)
    }
  }
  const blob = await zip.generateAsync({ type: 'blob' })
  // 文件夹上传的包名自动补 .zip 后缀；zip 上传的包名按行内名字原样
  const outName = container.kind === 'folder' && !/\.zip$/i.test(container.newName)
    ? container.newName + '.zip'
    : container.newName
  downloadBlob(blob, outName)
}

async function downloadAll() {
  if (downloading.value) return
  downloading.value = true
  try {
    for (const item of files.value) {
      if (item.kind === 'zip' || item.kind === 'folder') {
        await downloadZipGroup(item)
      } else if (item.source === 'upload') {
        downloadBlob(item.file, item.newName)
        await sleep(200)
      }
      // 包内条目随所属的包一起打出，此处跳过
    }
  } catch (e) {
    alert(`下载失败：${e.message || e}`)
  } finally {
    downloading.value = false
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

function copyScript() {
  // 批处理脚本只对本地真实文件有意义，包内条目不参与
  const lines = files.value
    .filter(f => f.source === 'upload')
    .map(f => `Rename-Item -Path "${f.oldName}" -NewName "${f.newName}"`)
  if (!lines.length) {
    alert('列表中没有本地文件，无法生成脚本')
    return
  }
  const script = lines.join('\n')
  navigator.clipboard?.writeText(script).then(() => {
    alert('PowerShell 脚本已复制到剪贴板')
  })
}
</script>

<style scoped>
.rename-tool { width: 100%; }

/* Upload */
.upload-area {
  border: 2px dashed var(--border);
  border-radius: 16px;
  padding: 48px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--bg-muted);
}
.upload-area:hover, .upload-area.dragover {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 4%, var(--bg-muted));
}
.upload-inner svg {
  color: var(--text-tertiary);
  margin-bottom: 12px;
}
.upload-title {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
}
.upload-hint {
  font-size: 0.8125rem;
  color: var(--text-tertiary);
}

/* Editor */
.editor { display: flex; flex-direction: column; gap: 16px; }

/* Rules */
.rules-panel {
  background: var(--bg-raised);
  border-radius: 12px;
  border: 1px solid var(--border);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.rule-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.rule-field {
  flex: 1;
  min-width: 100px;
}
.rule-field label {
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 4px;
}
.rule-field input, .rule-field select {
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text-primary);
  font-size: 0.8125rem;
  outline: none;
}
.rule-field input:focus, .rule-field select:focus {
  border-color: var(--accent);
}
.rule-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* File List */
.file-list {
  background: var(--bg-raised);
  border-radius: 12px;
  border: 1px solid var(--border);
  overflow: hidden;
}
.list-header, .file-row {
  display: grid;
  grid-template-columns: 36px 28px 1fr 30px 1fr;
  align-items: center;
  padding: 8px 12px;
  gap: 8px;
  font-size: 0.8125rem;
}
.list-header {
  background: var(--bg);
  border-bottom: 1px solid var(--border);
  font-weight: 500;
  color: var(--text-secondary);
}
.file-row {
  border-bottom: 1px solid var(--border);
  transition: background 0.1s;
}
.file-row:last-child { border-bottom: none; }
.file-row:hover { background: var(--bg-muted); }
.file-row.changed .col-new-input { color: var(--accent); font-weight: 500; }
.col-num {
  text-align: center;
  color: var(--text-tertiary);
  font-size: 0.75rem;
}
.col-kind {
  text-align: center;
  font-size: 0.8125rem;
}
.folder-upload-btn { margin-top: 12px; width: 100%; }
.col-old, .col-new-input {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.col-old { color: var(--text-secondary); }
.col-arrow { text-align: center; color: var(--text-tertiary); }
.col-new-input {
  width: 100%;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-primary);
  font-size: 0.8125rem;
  outline: none;
}
.col-new-input:hover, .col-new-input:focus {
  border-color: var(--border);
  background: var(--bg);
}

/* Bottom Actions */
.bottom-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.bottom-actions button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

/* Buttons */
.btn-primary, .btn-secondary {
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: opacity 0.15s;
}
.btn-primary {
  background: var(--accent);
  color: #fff;
}
.btn-primary:hover:not(:disabled) { opacity: 0.9; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary {
  background: var(--bg-raised);
  color: var(--text-primary);
  border: 1px solid var(--border);
}
.btn-secondary:hover { background: var(--bg-muted); }
</style>
