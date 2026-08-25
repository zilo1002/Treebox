<template>
  <div class="code-replace-tool">
    <!-- 上传区域 -->
    <div v-if="!lines.length" class="upload-wrap" @drop="onDrop" @dragover.prevent @click="$refs.fileInput.click()">
      <input ref="fileInput" type="file" style="display:none" @change="onFileChange" accept="*">
      <div class="upload-box">
        <div class="upload-icon">📝</div>
        <div class="upload-title">{{ t.codereplace?.uploadHint || '点击上传或拖拽代码文件到此处' }}</div>
        <div class="upload-sub">{{ t.codereplace?.supportFormats || '支持 .js .ts .html .css .vue .py .java .json .xml .md 等格式' }}</div>
      </div>
    </div>

    <!-- 编辑区域 -->
    <div v-else class="editor-wrap">
      <div class="info-bar">
        <div class="info-left">
          <span class="filename">{{ fileName }}</span>
          <span class="badge size">{{ formatSize(fileSize) }}</span>
          <span class="badge lines">{{ lines.length }} 行</span>
        </div>
        <div class="info-right">
          <button class="btn-sm" @click="clear">{{ t.codereplace?.reupload || '重新上传' }}</button>
        </div>
      </div>

      <!-- 指令输入区 -->
      <div class="command-card">
        <div class="command-title">🛠️ {{ t.codereplace?.commandTitle || '修改指令' }}</div>
        <div class="command-desc">{{ t.codereplace?.commandDesc || '按格式输入修改指令，支持多处同时修改。示例：' }}</div>
        <div class="command-example">
          <div>第 37~43 行替换为：</div>
          <div>&nbsp;&nbsp;html, body { height: 100%; }</div>
          <div>第 20-25 行替换为：</div>
          <div>&nbsp;&nbsp;const app = createApp(App);</div>
          <div>把这个代码background换成bg：</div>
          <div>将 padding 替换成 margin：</div>
        </div>
        <textarea
          v-model="commandText"
          class="command-input"
          :placeholder="t.codereplace?.commandPlaceholder || '在此输入修改指令...\n第 X~Y 行替换为：\n（替换内容）\n\n第 A-B 行替换为：\n（替换内容）\n\n把这个代码xxx换成xxx：'"
          spellcheck="false"
        ></textarea>
        <div class="command-actions">
          <button class="btn-sm primary" @click="applyCommands">
            {{ t.codereplace?.applyBtn || '✨ 一键实现' }}
          </button>
          <button class="btn-sm" @click="commandText = ''">
            {{ t.codereplace?.clearBtn || '清空' }}
          </button>
        </div>
      </div>

      <!-- 冲突提示面板 -->
      <div v-if="conflictMatches.length" class="conflict-card">
        <div class="conflict-title">⚠️ {{ t.codereplace?.conflictTitle || '发现多处匹配' }}</div>
        <div class="conflict-desc">{{ t.codereplace?.conflictDesc || '以下内容在文件中存在多处，请选择要替换的位置：' }}</div>
        <div class="conflict-list">
          <label v-for="(match, idx) in conflictMatches" :key="idx" class="conflict-item">
            <input type="checkbox" v-model="match.selected">
            <span class="conflict-line">第 {{ match.line }} 行</span>
            <span class="conflict-context">{{ match.context }}</span>
          </label>
        </div>
        <div class="conflict-actions">
          <button class="btn-sm" @click="selectAllConflicts(true)">{{ t.codereplace?.selectAll || '全选' }}</button>
          <button class="btn-sm" @click="selectAllConflicts(false)">{{ t.codereplace?.selectNone || '全不选' }}</button>
          <button class="btn-sm primary" @click="applySelectedConflicts">{{ t.codereplace?.applySelected || '替换选中' }}</button>
          <button class="btn-sm" @click="applyAllConflicts">{{ t.codereplace?.applyAll || '全部替换' }}</button>
          <button class="btn-sm" @click="skipConflicts">{{ t.codereplace?.skip || '跳过' }}</button>
        </div>
      </div>

      <!-- 修改预览 -->
      <div v-if="modifiedLines.length && !conflictMatches.length" class="preview-card">
        <div class="preview-header">
          <div class="preview-title">📋 {{ t.codereplace?.previewTitle || '修改预览' }}</div>
          <div class="preview-actions">
            <button class="btn-sm" @click="copyResult">{{ t.codereplace?.copy || '复制' }}</button>
            <button class="btn-sm primary" @click="downloadResult">{{ t.codereplace?.download || '下载' }}</button>
          </div>
        </div>
        <div class="change-summary">
          {{ (t.codereplace?.changeSummary || '共修改 {count} 处，涉及 {lines} 行')
             .replace('{count}', changeCount).replace('{lines}', changeLineCount) }}
        </div>
        <div class="editor-box">
          <div
            v-for="n in displayedPreviewLines"
            :key="n"
            class="code-row"
            :class="{ changed: isLineChanged(n) }"
          >
            <div class="line-num">{{ n }}</div>
            <div class="code-line">{{ modifiedLines[n - 1] || '' }}</div>
          </div>
        </div>
        <div v-if="modifiedLines.length > maxPreviewLines" class="preview-more">
          {{ (t.codereplace?.previewMore || '还有 {n} 行未显示，请下载查看完整内容').replace('{n}', modifiedLines.length - maxPreviewLines) }}
        </div>
      </div>

      <!-- 原始文件预览（折叠） -->
      <details class="original-details">
        <summary>{{ t.codereplace?.originalFile || '原始文件' }}</summary>
        <div class="editor-box">
          <div
            v-for="n in displayedOriginalLines"
            :key="n"
            class="code-row"
          >
            <div class="line-num">{{ n }}</div>
            <div class="code-line">{{ lines[n - 1] || '' }}</div>
          </div>
        </div>
        <div v-if="lines.length > maxPreviewLines" class="preview-more">
          {{ (t.codereplace?.previewMore || '还有 {n} 行未显示，请下载查看完整内容').replace('{n}', lines.length - maxPreviewLines) }}
        </div>
      </details>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const lines = ref([])
const modifiedLines = ref([])
const fileName = ref('')
const fileSize = ref(0)
const commandText = ref('')
const changeMap = ref(new Map())
const changeCount = ref(0)
const changeLineCount = ref(0)
const maxPreviewLines = 500
const conflictMatches = ref([])
const pendingContentCommands = ref([])

const t = computed(() => {
  try {
    const msgs = window.__VUE_I18N__?.global?.messages
    const locale = window.__VUE_I18N__?.global?.locale || 'zh'
    return msgs?.[locale] || {}
  } catch { return {} }
})

const displayedOriginalLines = computed(() => {
  return Math.min(lines.value.length, maxPreviewLines)
})

const displayedPreviewLines = computed(() => {
  return Math.min(modifiedLines.value.length, maxPreviewLines)
})

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

function isLineChanged(n) {
  return changeMap.value.has(n)
}

function processFile(file) {
  fileName.value = file.name
  fileSize.value = file.size
  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target.result.replace(/\r\n?/g, '\n')
    lines.value = text.split('\n')
    modifiedLines.value = [...lines.value]
    changeMap.value.clear()
    changeCount.value = 0
    changeLineCount.value = 0
    conflictMatches.value = []
    pendingContentCommands.value = []
  }
  reader.readAsText(file)
}

function onFileChange(e) {
  const file = e.target.files?.[0]
  if (file) processFile(file)
}

function onDrop(e) {
  e.preventDefault()
  const file = e.dataTransfer.files?.[0]
  if (file) processFile(file)
}

// 分隔符：中英文冒号、箭头、向下箭头
const SEPARATORS = '[\uff1a:\u2192\u2193]'

function buildHeaderRegex() {
  // 行号型指令头（优先匹配）
  const linePattern = '(?:\u628a|\u5c06)?(?:\u7b2c\\s*)?\\d+(?:\\s*(?:~|\u2013|\\-|\u5230|\u81f3)\\s*(?:\u7b2c\\s*)?\\d*)?\\s*\u884c?\\s*(?:\u66ff\u6362\u4e3a|\u66ff\u6362\u6210|\u6362\u6210|\u6539\u6210|\u66ff\u6362)'
  // 内容型指令头
  const contentPattern = '(?:\u628a|\u5c06|\u8fd9\u4e2a\u4ee3\u7801)?[^\\n]{1,200}(?:\u66ff\u6362\u4e3a|\u66ff\u6362\u6210|\u6362\u6210|\u6539\u6210|\u66ff\u6362)'
  return new RegExp('(' + linePattern + '|' + contentPattern + ')' + SEPARATORS + '\\s*\\n?', 'g')
}

function parseContentCommandHeader(text) {
  let clean = text.replace(/^(?:\u628a|\u5c06|\u8fd9\u4e2a\u4ee3\u7801)/, '').trim()
  const patterns = [
    /^(.+?)(?:\u66ff\u6362\u6210|\u6362\u6210|\u6539\u6210|\u66ff\u6362|\u66ff\u6362\u4e3a)(.+)$/
  ]
  for (const p of patterns) {
    const m = clean.match(p)
    if (m) {
      return { search: m[1].trim(), replace: m[2].trim() }
    }
  }
  return null
}

function parseCommands(text) {
  const commands = []
  const regex = buildHeaderRegex()
  const matches = []
  let match

  while ((match = regex.exec(text)) !== null) {
    matches.push({
      header: match[1],
      index: match.index,
      fullLength: match[0].length
    })
  }

  for (let i = 0; i < matches.length; i++) {
    const cmd = matches[i]
    const contentStart = cmd.index + cmd.fullLength
    const contentEnd = i < matches.length - 1 ? matches[i + 1].index : text.length
    const content = text.slice(contentStart, contentEnd).trimEnd()

    // 判断是否为行号型
    const lineRegex = /^(?:\u628a|\u5c06)?(?:\u7b2c\s*)?(\d+)(?:\s*(?:~|\u2013|\-|\u5230|\u81f3)\s*(?:\u7b2c\s*)?(\d*))?\s*\u884e?/
    const lineMatch = cmd.header.match(lineRegex)

    if (lineMatch) {
      const start = parseInt(lineMatch[1])
      const end = lineMatch[2] ? parseInt(lineMatch[2]) : start
      commands.push({
        type: 'line',
        start,
        end,
        content
      })
    } else {
      // 内容型
      const parsed = parseContentCommandHeader(cmd.header)
      if (parsed) {
        commands.push({
          type: 'content',
          search: parsed.search,
          replace: parsed.replace,
          content
        })
      }
    }
  }

  return commands
}

function findContentMatches(search) {
  const matches = []
  if (!search) return matches
  for (let i = 0; i < lines.value.length; i++) {
    const line = lines.value[i]
    let idx = line.indexOf(search)
    while (idx !== -1) {
      const start = Math.max(0, idx - 20)
      const end = Math.min(line.length, idx + search.length + 20)
      const context = line.slice(start, end)
      matches.push({
        line: i + 1,
        lineIndex: i,
        charIndex: idx,
        context: context,
        selected: false
      })
      idx = line.indexOf(search, idx + 1)
    }
  }
  return matches
}

function applyCommands() {
  if (!commandText.value.trim() || !lines.value.length) return

  const commands = parseCommands(commandText.value)
  if (!commands.length) {
    alert(t.value.codereplace?.noCommand || '未识别到有效指令，请检查格式')
    return
  }

  // 分离行号指令和内容指令
  const lineCommands = commands.filter(c => c.type === 'line')
  const contentCommands = commands.filter(c => c.type === 'content')

  // 先处理内容指令，检查冲突
  const allConflicts = []
  for (const cmd of contentCommands) {
    const matches = findContentMatches(cmd.search)
    if (matches.length === 0) {
      continue
    } else if (matches.length === 1) {
      allConflicts.push({
        ...matches[0],
        search: cmd.search,
        replace: cmd.replace,
        auto: true
      })
    } else {
      allConflicts.push(...matches.map(m => ({
        ...m,
        search: cmd.search,
        replace: cmd.replace,
        auto: false
      })))
    }
  }

  // 如果有需要用户选择的多处匹配
  const manualConflicts = allConflicts.filter(c => !c.auto)
  if (manualConflicts.length > 0) {
    conflictMatches.value = manualConflicts
    pendingContentCommands.value = allConflicts.filter(c => c.auto)
    return
  }

  // 没有冲突，直接执行
  executeAllReplacements(lineCommands, allConflicts)
}

function executeAllReplacements(lineCommands, contentReplacements) {
  let result = [...lines.value]
  const changed = new Map()
  let count = 0

  // 先执行内容替换（从后往前，避免偏移）
  const sortedContent = [...contentReplacements].sort((a, b) => {
    if (a.lineIndex !== b.lineIndex) return b.lineIndex - a.lineIndex
    return b.charIndex - a.charIndex
  })

  for (const rep of sortedContent) {
    const lineIdx = rep.lineIndex
    const line = result[lineIdx]
    const before = line.slice(0, rep.charIndex)
    const after = line.slice(rep.charIndex + rep.search.length)
    result[lineIdx] = before + rep.replace + after
    changed.set(lineIdx + 1, true)
    count++
  }

  // 再执行行号替换（从后往前）
  const sortedLine = [...lineCommands].sort((a, b) => b.start - a.start)

  for (const cmd of sortedLine) {
    const start = Math.max(1, cmd.start)
    const end = Math.min(result.length, cmd.end)
    if (start > end) continue

    const newLines = cmd.content ? cmd.content.split('\n') : ['']

    for (let i = start; i <= end; i++) {
      changed.set(i, true)
    }
    for (let i = 0; i < newLines.length; i++) {
      changed.set(start + i, true)
    }

    result.splice(start - 1, end - start + 1, ...newLines)
    count++
  }

  modifiedLines.value = result
  changeMap.value = changed
  changeCount.value = count
  changeLineCount.value = changed.size
  conflictMatches.value = []
  pendingContentCommands.value = []
}

function selectAllConflicts(selected) {
  for (const m of conflictMatches.value) {
    m.selected = selected
  }
}

function applySelectedConflicts() {
  const selected = conflictMatches.value.filter(m => m.selected)
  const all = [...pendingContentCommands.value, ...selected]
  const commands = parseCommands(commandText.value)
  const lineCommands = commands.filter(c => c.type === 'line')
  executeAllReplacements(lineCommands, all)
}

function applyAllConflicts() {
  const all = [...pendingContentCommands.value, ...conflictMatches.value]
  const commands = parseCommands(commandText.value)
  const lineCommands = commands.filter(c => c.type === 'line')
  executeAllReplacements(lineCommands, all)
}

function skipConflicts() {
  const commands = parseCommands(commandText.value)
  const lineCommands = commands.filter(c => c.type === 'line')
  executeAllReplacements(lineCommands, pendingContentCommands.value)
}

function copyResult() {
  const text = modifiedLines.value.join('\n')
  navigator.clipboard.writeText(text).then(() => {
    alert(t.value.codereplace?.copied || '已复制到剪贴板')
  })
}

function downloadResult() {
  const text = modifiedLines.value.join('\n')
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const ext = fileName.value.match(/\.[^.]+$/)?.[0] || '.txt'
  const base = fileName.value.replace(/\.[^.]+$/, '')
  a.href = url
  a.download = base + '_modified' + ext
  a.click()
  URL.revokeObjectURL(url)
}

function clear() {
  lines.value = []
  modifiedLines.value = []
  fileName.value = ''
  fileSize.value = 0
  commandText.value = ''
  changeMap.value.clear()
  changeCount.value = 0
  changeLineCount.value = 0
  conflictMatches.value = []
  pendingContentCommands.value = []
}
</script>

<style scoped>
.code-replace-tool { padding: 16px; }
.upload-wrap {
  border: 2px dashed var(--border-color, #ddd);
  border-radius: 16px;
  padding: 48px 24px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}
.upload-wrap:hover {
  border-color: var(--accent, #3b82f6);
  background: rgba(59,130,246,0.04);
}
.upload-icon { font-size: 48px; margin-bottom: 12px; }
.upload-title { font-size: 16px; font-weight: 500; color: var(--text-color, #333); margin-bottom: 6px; }
.upload-sub { font-size: 13px; color: var(--text-secondary, #999); }

.editor-wrap { display: flex; flex-direction: column; gap: 14px; }
.info-bar {
  display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
  justify-content: space-between;
}
.info-left { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.filename { font-weight: 600; font-size: 15px; color: var(--text-color, #333); }
.badge {
  font-size: 11px; padding: 2px 8px; border-radius: 20px;
  background: var(--bg-secondary, #f3f4f6); color: var(--text-secondary, #666);
}
.badge.size { background: #f3f4f6; color: #4b5563; }
.badge.lines { background: #e0e7ff; color: #3730a3; }
.info-right { display: flex; gap: 6px; }
.btn-sm {
  padding: 6px 14px; border-radius: 8px; border: 1px solid var(--border-color, #e5e7eb);
  background: var(--bg-card, #fff); color: var(--text-color, #333);
  font-size: 13px; cursor: pointer; transition: all 0.15s;
}
.btn-sm:hover { background: var(--bg-secondary, #f9fafb); }
.btn-sm.primary { background: var(--accent, #3b82f6); color: #fff; border-color: var(--accent, #3b82f6); }
.btn-sm.primary:hover { opacity: 0.9; }

.command-card {
  padding: 16px; border-radius: 14px;
  background: var(--bg-secondary, #f9fafb);
  border: 1px solid var(--border-color, #e5e7eb);
}
.command-title { font-weight: 600; font-size: 15px; color: var(--text-color, #333); margin-bottom: 8px; }
.command-desc { font-size: 13px; color: var(--text-secondary, #6b7280); margin-bottom: 8px; }
.command-example {
  padding: 10px 14px; border-radius: 10px;
  background: var(--bg-card, #fff);
  border: 1px dashed var(--border-color, #d1d5db);
  font-size: 13px; color: var(--text-secondary, #4b5563);
  font-family: 'SF Mono', Monaco, monospace;
  line-height: 1.7; margin-bottom: 12px;
}
.command-input {
  width: 100%; min-height: 160px; max-height: 300px;
  padding: 12px; border-radius: 10px;
  border: 1px solid var(--border-color, #e5e7eb);
  background: var(--bg-card, #fff); color: var(--text-color, #374151);
  font-size: 14px; line-height: 1.6; resize: vertical; outline: none;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  margin-bottom: 10px;
}
.command-input:focus { border-color: var(--accent, #3b82f6); }
.command-actions { display: flex; gap: 8px; }

/* 冲突面板 */
.conflict-card {
  padding: 16px; border-radius: 14px;
  background: #fffbeb;
  border: 1px solid #f59e0b;
}
.conflict-title { font-weight: 600; font-size: 15px; color: #92400e; margin-bottom: 6px; }
.conflict-desc { font-size: 13px; color: #a16207; margin-bottom: 12px; }
.conflict-list {
  max-height: 300px; overflow: auto;
  display: flex; flex-direction: column; gap: 6px;
  margin-bottom: 12px;
}
.conflict-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px; border-radius: 8px;
  background: #fff; border: 1px solid #fcd34d;
  cursor: pointer;
}
.conflict-item input { cursor: pointer; }
.conflict-line {
  font-size: 12px; font-weight: 600; color: #92400e;
  white-space: nowrap;
  min-width: 60px;
}
.conflict-context {
  font-size: 12px; color: #4b5563;
  font-family: 'SF Mono', Monaco, monospace;
  white-space: pre-wrap; word-break: break-all;
  flex: 1;
}
.conflict-actions { display: flex; gap: 6px; flex-wrap: wrap; }

.preview-card {
  padding: 14px; border-radius: 14px;
  background: var(--bg-card, #fff);
  border: 1px solid var(--border-color, #e5e7eb);
}
.preview-header {
  display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
  justify-content: space-between; margin-bottom: 8px;
}
.preview-title { font-weight: 600; font-size: 14px; color: var(--text-color, #333); }
.preview-actions { display: flex; gap: 6px; }
.change-summary {
  font-size: 13px; color: var(--accent, #3b82f6); margin-bottom: 10px;
}
.preview-more {
  font-size: 12px; color: var(--text-secondary, #9ca3af);
  margin-top: 8px; text-align: center;
}

/* 改为普通块布局，避免flex压缩导致重叠 */
.editor-box {
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 12px; overflow: hidden; background: var(--bg-card, #fff);
  max-height: 45vh; overflow: auto;
}
.code-row {
  display: flex; align-items: flex-start;
  min-height: 1.7em;
}
.code-row.changed { background: #fef2f2; }
.code-row.changed .line-num {
  color: #dc2626; font-weight: 600; background: #fef2f2;
}
.line-num {
  padding: 4px 8px; background: var(--bg-secondary, #f9fafb);
  border-right: 1px solid var(--border-color, #e5e7eb);
  font-family: 'SF Mono', Monaco, monospace; font-size: 12px;
  color: var(--text-secondary, #9ca3af); text-align: right;
  line-height: 1.7; user-select: none;
  min-width: 44px; align-self: stretch;
}
.code-line {
  flex: 1; padding: 4px 12px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 12px; line-height: 1.7; color: var(--text-color, #374151);
  white-space: pre-wrap; word-break: break-all;
}

.original-details {
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 12px; padding: 12px;
  background: var(--bg-secondary, #f9fafb);
}
.original-details summary {
  font-size: 14px; font-weight: 500; color: var(--text-color, #333);
  cursor: pointer; user-select: none;
}
.original-details .editor-box { margin-top: 10px; }
</style>
