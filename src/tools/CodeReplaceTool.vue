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
        </div>
        <textarea
          v-model="commandText"
          class="command-input"
          :placeholder="t.codereplace?.commandPlaceholder || '在此输入修改指令...\n第 X~Y 行替换为：\n（替换内容）\n\n第 A-B 行替换为：\n（替换内容）'"
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

      <!-- 修改预览 -->
      <div v-if="modifiedLines.length" class="preview-card">
        <div class="preview-header">
          <div class="preview-title">📋 {{ t.codereplace?.previewTitle || '修改预览' }}</div>
          <div class="preview-actions">
            <button class="btn-sm" @click="copyResult">{{ t.codereplace?.copy || '复制' }}</button>
            <button class="btn-sm primary" @click="downloadResult">{{ t.codereplace?.download || '下载' }}</button>
          </div>
        </div>
        <div class="download-options">
          <label class="suffix-toggle">
            <input type="checkbox" v-model="addSuffix" />
            <span class="checkmark"></span>
            <span class="label-text">{{ t.codereplace?.addSuffix || '文件名添加 _modified 后缀' }}</span>
          </label>
          <span class="filename-preview">{{ downloadFileName }}</span>
        </div>
        <div class="change-summary">
          {{ (t.codereplace?.changeSummary || '共修改 {count} 处，涉及 {lines} 行')
             .replace('{count}', changeCount).replace('{lines}', changeLineCount) }}
        </div>
        <div class="editor-box">
          <div class="line-nums">
            <div
              v-for="n in displayedPreviewLines"
              :key="n"
              class="line-num"
              :class="{ changed: isLineChanged(n) }"
            >{{ n }}</div>
          </div>
          <div class="code-scroll">
            <div
              v-for="n in displayedPreviewLines"
              :key="n"
              class="code-line"
              :class="{ changed: isLineChanged(n) }"
            >{{ modifiedLines[n - 1] || '' }}</div>
          </div>
        </div>
      </div>

      <!-- 原始文件预览（折叠） -->
      <details class="original-details">
        <summary>{{ t.codereplace?.originalFile || '原始文件' }}</summary>
        <div class="editor-box">
          <div class="line-nums">
            <div v-for="n in displayedOriginalLines" :key="n" class="line-num">{{ n }}</div>
          </div>
          <div class="code-scroll">
            <div v-for="n in displayedOriginalLines" :key="n" class="code-line">{{ lines[n - 1] || '' }}</div>
          </div>
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
const changeMap = ref(new Map()) // lineNum -> boolean
const changeCount = ref(0)
const changeLineCount = ref(0)
const maxPreviewLines = 500
const addSuffix = ref(true)

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

const downloadFileName = computed(() => {
  const ext = fileName.value.match(/\.[^.]+$/)?.[0] || '.txt'
  const base = fileName.value.replace(/\.[^.]+$/, '')
  return addSuffix.value ? base + '_modified' + ext : fileName.value
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
    const text = e.target.result
    lines.value = text.split('\n')
    modifiedLines.value = [...lines.value]
    changeMap.value.clear()
    changeCount.value = 0
    changeLineCount.value = 0
    addSuffix.value = true
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

// 解析指令
// 支持格式：
// 第 37~43 行替换为：
// xxx
// 第 20-25 行替换为：
// xxx
// 第 37 行替换为：xxx
// 37-43行替换为：
// xxx
function parseCommands(text) {
  const commands = []
  // 匹配 "第 X~Y 行替换为：" 或 "第 X-Y 行替换为：" 或 "第 X 行替换为："
  // 或 "X~Y行替换为：" 或 "X-Y行替换为："
  const regex = /(?:第\s*)?(\d+)\s*(?:~|\-|到|至)\s*(\d+)?\s*行\s*替换为[：:]\s*\n?/g

  let match
  const matches = []

  while ((match = regex.exec(text)) !== null) {
    matches.push({
      start: parseInt(match[1]),
      end: match[2] ? parseInt(match[2]) : parseInt(match[1]),
      index: match.index,
      length: match[0].length,
    })
  }

  for (let i = 0; i < matches.length; i++) {
    const cmd = matches[i]
    const contentStart = cmd.index + cmd.length
    const contentEnd = i < matches.length - 1 ? matches[i + 1].index : text.length
    const content = text.slice(contentStart, contentEnd).trimEnd()
    commands.push({
      start: cmd.start,
      end: cmd.end,
      content: content,
    })
  }

  return commands
}

function applyCommands() {
  if (!commandText.value.trim() || !lines.value.length) return

  const commands = parseCommands(commandText.value)
  if (!commands.length) {
    alert(t.value.codereplace?.noCommand || '未识别到有效指令，请检查格式')
    return
  }

  // 复制原始行
  let result = [...lines.value]
  const changed = new Map()

  // 按起始行从大到小排序，避免替换后行号偏移
  const sorted = [...commands].sort((a, b) => b.start - a.start)

  for (const cmd of sorted) {
    const start = Math.max(1, cmd.start)
    const end = Math.min(result.length, cmd.end)
    if (start > end) continue

    const newLines = cmd.content ? cmd.content.split('\n') : ['']

    // 标记变更行
    for (let i = start; i <= end; i++) {
      changed.set(i, true)
    }
    // 如果新内容行数不同，需要重新标记
    for (let i = 0; i < newLines.length; i++) {
      changed.set(start + i, true)
    }

    // 替换
    result.splice(start - 1, end - start + 1, ...newLines)
  }

  modifiedLines.value = result
  changeMap.value = changed
  changeCount.value = commands.length
  changeLineCount.value = changed.size
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
  a.href = url
  a.download = downloadFileName.value
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
  addSuffix.value = true
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

.download-options {
  display: flex; flex-wrap: wrap; align-items: center; gap: 10px;
  margin-bottom: 8px; padding: 8px 10px;
  background: var(--bg-secondary, #f9fafb);
  border-radius: 8px;
}
.suffix-toggle {
  display: flex; align-items: center; gap: 8px;
  cursor: pointer; font-size: 13px; color: var(--text-color, #374151);
  user-select: none;
}
.suffix-toggle input { display: none; }
.checkmark {
  width: 18px; height: 18px; border-radius: 4px;
  border: 2px solid var(--border-color, #d1d5db);
  background: var(--bg-card, #fff);
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s; flex-shrink: 0;
}
.suffix-toggle input:checked + .checkmark {
  background: var(--accent, #3b82f6);
  border-color: var(--accent, #3b82f6);
}
.suffix-toggle input:checked + .checkmark::after {
  content: '✓'; color: #fff; font-size: 12px; font-weight: 700;
}
.label-text { font-size: 13px; }
.filename-preview {
  font-size: 12px; color: var(--text-secondary, #6b7280);
  font-family: 'SF Mono', Monaco, monospace;
  background: var(--bg-card, #fff);
  padding: 2px 8px; border-radius: 4px;
  border: 1px solid var(--border-color, #e5e7eb);
}

.change-summary {
  font-size: 13px; color: var(--accent, #3b82f6); margin-bottom: 10px;
}

.editor-box {
  display: flex; border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 12px; overflow: hidden; background: var(--bg-card, #fff);
  max-height: 45vh;
}
.line-nums {
  padding: 10px 8px; background: var(--bg-secondary, #f9fafb);
  border-right: 1px solid var(--border-color, #e5e7eb);
  font-family: 'SF Mono', Monaco, monospace; font-size: 12px;
  color: var(--text-secondary, #9ca3af); text-align: right;
  line-height: 1.7; overflow: hidden; user-select: none;
  min-width: 36px;
}
.line-num { height: 1.7em; }
.line-num.changed { color: #dc2626; font-weight: 600; background: #fef2f2; }
.code-scroll {
  flex: 1; padding: 10px 12px; overflow: auto;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 12px; line-height: 1.7; color: var(--text-color, #374151);
  white-space: pre;
}
.code-line { height: 1.7em; }
.code-line.changed { background: #fef2f2; }

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
