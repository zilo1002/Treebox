<template>
  <div class="proof-tool">
    <!-- Upload -->
    <div v-if="!content" class="upload-wrap"
      @click="triggerFile"
      @drop.prevent="onDrop"
      @dragover.prevent="dragover = true"
      @dragleave.prevent="dragover = false"
      :class="{ dragover }">
      <input type="file" ref="fileInput" accept=".txt,.md,.docx" @change="onFile" hidden>
      <div class="upload-inner">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
        <p class="upload-title">点击或拖拽上传文档</p>
        <p class="upload-hint">支持 .txt / .md / .docx（不上传服务器）</p>
      </div>
    </div>

    <!-- Workspace -->
    <div v-else class="workspace">
      <!-- Top Bar -->
      <div class="topbar">
        <div class="file-info">
          <span class="file-name">{{ fileName }}</span>
          <span class="file-meta">{{ content.length }} 字 / {{ lineCount }} 行</span>
        </div>
        <div class="topbar-actions">
          <button class="btn-sm" :class="{ active: showRules }" @click="showRules = !showRules">规则</button>
          <button class="btn-sm btn-primary" @click="runCheck">检查</button>
          <button class="btn-sm btn-primary" @click="fixAll">一键修复</button>
          <button class="btn-sm" @click="exportTxt">导出 TXT</button>
          <button class="btn-sm" @click="reset">重新上传</button>
        </div>
      </div>

      <div class="workspace-body">
        <!-- Rules Panel -->
        <div v-if="showRules" class="rules-panel">
          <div class="panel-header">检查规则</div>
          <div class="rule-list">
            <label v-for="r in ruleDefs" :key="r.id" class="rule-item">
              <input type="checkbox" v-model="r.enabled">
              <span class="rule-name">{{ r.name }}</span>
              <span class="rule-badge" :class="r.severity">{{ r.severityText }}</span>
            </label>
          </div>
        </div>

        <!-- Editor -->
        <div class="editor-panel">
          <div class="editor-header">
            <span v-if="!issues.length" class="status-ok">未发现明显问题</span>
            <span v-else class="status-issues">发现 {{ issues.length }} 个问题</span>
          </div>
          <textarea
            ref="editorRef"
            v-model="content"
            class="editor-textarea"
            spellcheck="false"
            @scroll="syncScroll"
          ></textarea>
          <!-- Highlight overlay -->
          <div class="highlight-layer" ref="highlightRef" v-html="highlightHtml"></div>
        </div>

        <!-- Issues Panel -->
        <div class="issues-panel">
          <div class="panel-header">
            问题列表
            <span class="issue-count">{{ issues.length }}</span>
          </div>
          <div class="issue-list">
            <div v-for="(issue, idx) in issues" :key="idx" class="issue-item" :class="issue.severity" @click="gotoIssue(issue)">
              <div class="issue-top">
                <span class="issue-type">{{ issue.typeName }}</span>
                <span class="issue-pos">第{{ issue.line }}行</span>
              </div>
              <div class="issue-msg">{{ issue.message }}</div>
              <div class="issue-ctx">{{ issue.context }}</div>
              <div class="issue-actions">
                <button class="btn-fix" @click.stop="fixOne(issue)">修复</button>
                <button class="btn-ignore" @click.stop="ignoreOne(idx)">忽略</button>
              </div>
            </div>
            <div v-if="!issues.length" class="empty-issues">
              <p>暂无问题</p>
              <p class="sub">点击「检查」开始分析</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'

const fileInput = ref(null)
const dragover = ref(false)
const content = ref('')
const originalContent = ref('')
const fileName = ref('')
const showRules = ref(true)
const editorRef = ref(null)
const highlightRef = ref(null)
const issues = ref([])

// Rule definitions
const ruleDefs = ref([
  { id: 'mixedPunc', name: '中英文标点混用', enabled: true, severity: 'warn', severityText: '警告' },
  { id: 'consecPunc', name: '连续标点', enabled: true, severity: 'error', severityText: '错误' },
  { id: 'extraSpace', name: '多余空格', enabled: true, severity: 'warn', severityText: '警告' },
  { id: 'consecSpace', name: '连续空格', enabled: true, severity: 'warn', severityText: '警告' },
  { id: 'blankLines', name: '连续空行', enabled: true, severity: 'suggest', severityText: '建议' },
  { id: 'cjSpace', name: '中英文间缺空格', enabled: true, severity: 'warn', severityText: '警告' },
  { id: 'cnNumSpace', name: '中文数字间空格', enabled: true, severity: 'warn', severityText: '警告' },
  { id: 'bracket', name: '括号不匹配', enabled: true, severity: 'error', severityText: '错误' },
  { id: 'quote', name: '引号不匹配', enabled: true, severity: 'error', severityText: '错误' },
  { id: 'bookTitle', name: '书名号不匹配', enabled: true, severity: 'error', severityText: '错误' },
  { id: 'fullHalf', name: '全角半角混用', enabled: true, severity: 'warn', severityText: '警告' },
  { id: 'dupWord', name: '重复词', enabled: true, severity: 'suggest', severityText: '建议' },
])

const lineCount = computed(() => content.value.split('\n').length)

const highlightHtml = computed(() => {
  let html = content.value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  // Highlight issue positions
  const sorted = [...issues.value].sort((a, b) => b.pos - a.pos)
  sorted.forEach(issue => {
    if (issue.pos >= 0 && issue.len > 0) {
      const before = html.slice(0, issue.pos)
      const target = html.slice(issue.pos, issue.pos + issue.len)
      const after = html.slice(issue.pos + issue.len)
      html = before + `<mark class="hl-${issue.severity}">${target}</mark>` + after
    }
  })
  return html
})

function triggerFile() { fileInput.value?.click() }

function onFile(e) { handleFile(e.target.files[0]) }
function onDrop(e) { dragover.value = false; handleFile(e.dataTransfer.files[0]) }

async function handleFile(file) {
  if (!file) return
  fileName.value = file.name
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()

  if (ext === '.docx') {
    try {
      const mammoth = await import('mammoth')
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      content.value = result.value
    } catch {
      alert('解析 .docx 需要 mammoth 库，请运行：npm install mammoth')
      return
    }
  } else {
    content.value = await file.text()
  }
  originalContent.value = content.value
  issues.value = []
  nextTick(() => runCheck())
}

function runCheck() {
  issues.value = []
  const text = content.value
  const lines = text.split('\n')
  const enabled = new Set(ruleDefs.value.filter(r => r.enabled).map(r => r.id))

  // Helper to add issue
  const add = (id, typeName, message, pos, len, line, severity, fix) => {
    const lineStart = lines.slice(0, line - 1).join('\n').length + (line > 1 ? 1 : 0)
    const ctx = text.slice(Math.max(0, pos - 15), Math.min(text.length, pos + len + 15))
    issues.value.push({ id, typeName, message, pos, len, line, severity, context: ctx, fix })
  }

  // 1. Mixed punctuation
  if (enabled.has('mixedPunc')) {
    const re = /[\u4e00-\u9fa5][,.!?;:][\u4e00-\u9fa5]|[\u4e00-\u9fa5][\u0020]*[,.!?;:]/g
    let m
    while ((m = re.exec(text)) !== null) {
      add('mixedPunc', '中英文标点混用', `发现英文标点「${m[0]}」`, m.index, m[0].length, lineOf(m.index), 'warn')
    }
  }

  // 2. Consecutive punctuation
  if (enabled.has('consecPunc')) {
    const re = /[，。！？；：]{2,}/g
    let m
    while ((m = re.exec(text)) !== null) {
      add('consecPunc', '连续标点', `连续标点「${m[0]}」`, m.index, m[0].length, lineOf(m.index), 'error')
    }
  }

  // 3. Extra spaces (line start/end)
  if (enabled.has('extraSpace')) {
    lines.forEach((line, i) => {
      if (/^\s+/.test(line)) add('extraSpace', '多余空格', '行首有空格', posOf(i, 0), line.match(/^\s+/)[0].length, i + 1, 'warn', () => line.replace(/^\s+/, ''))
      if (/\s+$/.test(line)) add('extraSpace', '多余空格', '行尾有空格', posOf(i, line.length - line.match(/\s+$/)[0].length), line.match(/\s+$/)[0].length, i + 1, 'warn', () => line.replace(/\s+$/, ''))
    })
  }

  // 4. Consecutive spaces
  if (enabled.has('consecSpace')) {
    const re = / {2,}/g
    let m
    while ((m = re.exec(text)) !== null) {
      add('consecSpace', '连续空格', `连续 ${m[0].length} 个空格`, m.index, m[0].length, lineOf(m.index), 'warn')
    }
  }

  // 5. Consecutive blank lines
  if (enabled.has('blankLines')) {
    for (let i = 0; i < lines.length - 2; i++) {
      if (lines[i].trim() === '' && lines[i + 1].trim() === '' && lines[i + 2].trim() === '') {
        const pos = posOf(i + 1, 0)
        add('blankLines', '连续空行', '超过两个连续空行', pos, 1, i + 2, 'suggest')
      }
    }
  }

  // 6. Missing space between Chinese and English
  if (enabled.has('cjSpace')) {
    const re = /[\u4e00-\u9fa5][a-zA-Z0-9]|[a-zA-Z0-9][\u4e00-\u9fa5]/g
    let m
    while ((m = re.exec(text)) !== null) {
      add('cjSpace', '中英文间缺空格', `「${m[0]}」之间缺少空格`, m.index, m[0].length, lineOf(m.index), 'warn')
    }
  }

  // 7. Chinese and number space
  if (enabled.has('cnNumSpace')) {
    const re = /[\u4e00-\u9fa5]\d|\d[\u4e00-\u9fa5]/g
    let m
    while ((m = re.exec(text)) !== null) {
      add('cnNumSpace', '中文数字间空格', `「${m[0]}」之间建议加空格`, m.index, m[0].length, lineOf(m.index), 'warn')
    }
  }

  // 8. Bracket mismatch
  if (enabled.has('bracket')) {
    const pairs = [['（', '）'], ['(', ')'], ['【', '】'], ['[', ']'], ['《', '》'], ['〈', '〉']]
    pairs.forEach(([o, c]) => {
      const open = (text.match(new RegExp(escapeRegExp(o), 'g')) || []).length
      const close = (text.match(new RegExp(escapeRegExp(c), 'g')) || []).length
      if (open !== close) {
        add('bracket', '括号不匹配', `${o} 出现 ${open} 次，${c} 出现 ${close} 次`, 0, 1, 1, 'error')
      }
    })
  }

  // 9. Quote mismatch
  if (enabled.has('quote')) {
    const open = (text.match(/["""']/g) || []).length
    const close = (text.match(/["""']/g) || []).length
    if (open % 2 !== 0) add('quote', '引号不匹配', '引号数量为奇数', 0, 1, 1, 'error')
  }

  // 10. Book title mismatch
  if (enabled.has('bookTitle')) {
    const open = (text.match(/《/g) || []).length
    const close = (text.match(/》/g) || []).length
    if (open !== close) add('bookTitle', '书名号不匹配', `《${open} 个，》${close} 个`, 0, 1, 1, 'error')
  }

  // 11. Full/Half width mixed (common punctuation)
  if (enabled.has('fullHalf')) {
    const halfPunc = /[,.!?;:()\[\]{}]/g
    let m
    while ((m = halfPunc.exec(text)) !== null) {
      const ch = text.charAt(m.index - 1)
      if (/[\u4e00-\u9fa5]/.test(ch)) {
        add('fullHalf', '全角半角混用', `中文后使用了半角标点「${m[0]}」`, m.index, 1, lineOf(m.index), 'warn')
      }
    }
  }

  // 12. Duplicate words
  if (enabled.has('dupWord')) {
    const re = /([\u4e00-\u9fa5]{2,})\1/g
    let m
    while ((m = re.exec(text)) !== null) {
      add('dupWord', '重复词', `重复「${m[1]}」`, m.index, m[0].length, lineOf(m.index), 'suggest')
    }
  }

  function lineOf(pos) {
    return text.slice(0, pos).split('\n').length
  }
  function posOf(lineIdx, col) {
    return lines.slice(0, lineIdx).join('\n').length + (lineIdx > 0 ? 1 : 0) + col
  }
  function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }
}

function fixOne(issue) {
  const text = content.value
  let replacement = ''
  const target = text.slice(issue.pos, issue.pos + issue.len)

  switch (issue.id) {
    case 'mixedPunc':
      replacement = target.replace(/,/g, '，').replace(/\./g, '。').replace(/!/g, '！').replace(/\?/g, '？').replace(/;/g, '；').replace(/:/g, '：')
      break
    case 'consecPunc':
      replacement = target[0]
      break
    case 'extraSpace':
    case 'consecSpace':
      replacement = ' '
      break
    case 'cjSpace':
      replacement = target[0] + ' ' + target[1]
      break
    case 'cnNumSpace':
      replacement = target[0] + ' ' + target[1]
      break
    case 'dupWord':
      replacement = target.slice(0, target.length / 2)
      break
    default:
      return
  }

  content.value = text.slice(0, issue.pos) + replacement + text.slice(issue.pos + issue.len)
  runCheck()
}

function fixAll() {
  // Sort by position descending to avoid index shift
  const sorted = [...issues.value]
    .filter(i => ['mixedPunc', 'consecPunc', 'extraSpace', 'consecSpace', 'blankLines', 'cjSpace', 'cnNumSpace', 'dupWord'].includes(i.id))
    .sort((a, b) => b.pos - a.pos)

  sorted.forEach(issue => fixOne(issue))
}

function ignoreOne(idx) {
  issues.value.splice(idx, 1)
}

function gotoIssue(issue) {
  const el = editorRef.value
  if (!el) return
  // Simple scroll to line approximation
  const lines = content.value.slice(0, issue.pos).split('\n').length
  const lineHeight = 24
  el.scrollTop = (lines - 3) * lineHeight
}

function syncScroll() {
  if (highlightRef.value && editorRef.value) {
    highlightRef.value.scrollTop = editorRef.value.scrollTop
    highlightRef.value.scrollLeft = editorRef.value.scrollLeft
  }
}

function exportTxt() {
  const blob = new Blob([content.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName.value.replace(/\.[^.]+$/, '') + '_fixed.txt'
  a.click()
  URL.revokeObjectURL(url)
}

function reset() {
  content.value = ''
  originalContent.value = ''
  fileName.value = ''
  issues.value = []
  fileInput.value && (fileInput.value.value = '')
}
</script>

<style scoped>
.proof-tool { width: 100%; height: 100%; display: flex; flex-direction: column; }

/* Upload */
.upload-wrap {
  border: 2px dashed var(--border);
  border-radius: 16px;
  padding: 48px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--bg-muted);
}
.upload-wrap:hover, .upload-wrap.dragover {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 4%, var(--bg-muted));
}
.upload-inner svg { color: var(--text-tertiary); margin-bottom: 12px; }
.upload-title { font-size: 15px; font-weight: 500; color: var(--text-primary); margin-bottom: 4px; }
.upload-hint { font-size: 13px; color: var(--text-tertiary); }

/* Workspace */
.workspace { display: flex; flex-direction: column; height: 100%; min-height: 400px; }
.topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  gap: 8px;
  flex-wrap: wrap;
}
.file-info { display: flex; align-items: center; gap: 10px; }
.file-name { font-size: 14px; font-weight: 500; }
.file-meta { font-size: 12px; color: var(--text-tertiary); }
.topbar-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.btn-sm {
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--bg-raised);
  color: var(--text-primary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-sm:hover { background: var(--bg-muted); }
.btn-sm.active { background: var(--accent); color: #fff; border-color: var(--accent); }
.btn-sm.btn-primary { background: var(--accent); color: #fff; border-color: var(--accent); }

/* Body */
.workspace-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  gap: 1px;
  background: var(--border);
}

/* Rules Panel */
.rules-panel {
  width: 200px;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.panel-header {
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 500;
  border-bottom: 1px solid var(--border);
  background: var(--bg-raised);
}
.rule-list { overflow-y: auto; padding: 8px; }
.rule-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 4px;
  font-size: 12px;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.1s;
}
.rule-item:hover { background: var(--bg-muted); }
.rule-item input { accent-color: var(--accent); }
.rule-name { flex: 1; }
.rule-badge {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 4px;
  font-weight: 500;
}
.rule-badge.error { background: color-mix(in srgb, #ef4444 12%, transparent); color: #ef4444; }
.rule-badge.warn { background: color-mix(in srgb, #f59e0b 12%, transparent); color: #f59e0b; }
.rule-badge.suggest { background: color-mix(in srgb, #3b82f6 12%, transparent); color: #3b82f6; }

/* Editor */
.editor-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  position: relative;
}
.editor-header {
  padding: 8px 12px;
  font-size: 12px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-raised);
}
.status-ok { color: #10b981; }
.status-issues { color: #ef4444; }
.editor-textarea {
  flex: 1;
  width: 100%;
  padding: 12px;
  border: none;
  background: var(--bg);
  color: var(--text-primary);
  font-size: 14px;
  line-height: 24px;
  resize: none;
  outline: none;
  font-family: inherit;
  white-space: pre;
  overflow-wrap: normal;
  overflow-x: auto;
}
.highlight-layer {
  position: absolute;
  top: 37px; left: 0; right: 0; bottom: 0;
  padding: 12px;
  font-size: 14px;
  line-height: 24px;
  white-space: pre;
  overflow-wrap: normal;
  overflow: hidden;
  pointer-events: none;
  color: transparent;
  z-index: 1;
}
:deep(.hl-error) { background: color-mix(in srgb, #ef4444 25%, transparent); border-radius: 2px; }
:deep(.hl-warn) { background: color-mix(in srgb, #f59e0b 25%, transparent); border-radius: 2px; }
:deep(.hl-suggest) { background: color-mix(in srgb, #3b82f6 20%, transparent); border-radius: 2px; }

/* Issues Panel */
.issues-panel {
  width: 260px;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.issue-count {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-tertiary);
  background: var(--bg-muted);
  padding: 1px 6px;
  border-radius: 10px;
}
.issue-list { overflow-y: auto; padding: 8px; }
.issue-item {
  padding: 8px;
  border-radius: 8px;
  border: 1px solid var(--border);
  margin-bottom: 6px;
  cursor: pointer;
  transition: all 0.15s;
  background: var(--bg-raised);
}
.issue-item:hover { border-color: var(--accent); }
.issue-item.error { border-left: 3px solid #ef4444; }
.issue-item.warn { border-left: 3px solid #f59e0b; }
.issue-item.suggest { border-left: 3px solid #3b82f6; }
.issue-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}
.issue-type { font-size: 11px; font-weight: 500; color: var(--text-secondary); }
.issue-pos { font-size: 11px; color: var(--text-tertiary); }
.issue-msg { font-size: 12px; color: var(--text-primary); margin-bottom: 4px; }
.issue-ctx {
  font-size: 11px;
  color: var(--text-tertiary);
  background: var(--bg-muted);
  padding: 4px 6px;
  border-radius: 4px;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.issue-actions { display: flex; gap: 6px; }
.btn-fix, .btn-ignore {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  border: none;
}
.btn-fix { background: var(--accent); color: #fff; }
.btn-ignore { background: var(--bg-muted); color: var(--text-secondary); border: 1px solid var(--border); }
.empty-issues { text-align: center; padding: 24px 12px; color: var(--text-tertiary); }
.empty-issues .sub { font-size: 12px; margin-top: 4px; }

@media (max-width: 768px) {
  .rules-panel, .issues-panel { width: 160px; }
}
@media (max-width: 560px) {
  .workspace-body { flex-direction: column; }
  .rules-panel, .issues-panel { width: 100%; max-height: 180px; }
}
</style>
