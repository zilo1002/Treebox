<template>
  <div class="code-format-tool">
    <!-- 上传区域 -->
    <div v-if="!content" class="upload-wrap" @drop="onDrop" @dragover.prevent @click="$refs.fileInput.click()">
      <input ref="fileInput" type="file" style="display:none" @change="onFileChange" accept="*">
      <div class="upload-box">
        <div class="upload-icon">📄</div>
        <div class="upload-title">{{ t.codefmt?.uploadHint || '点击上传或拖拽代码文件到此处' }}</div>
        <div class="upload-sub">{{ t.codefmt?.supportFormats || '支持 .js .ts .html .css .vue .py .java .json .xml .md 等格式' }}</div>
      </div>
    </div>

    <!-- 预览区域 -->
    <div v-else class="preview-wrap">
      <div class="info-bar">
        <div class="info-left">
          <span class="filename">{{ fileName }}</span>
          <span class="badge lang">{{ language.toUpperCase() }}</span>
          <span class="badge size">{{ formatSize(fileSize) }}</span>
          <span v-if="maxLineLen > dangerThreshold" class="badge danger">超长行</span>
        </div>
        <div class="info-right">
          <button class="btn-sm" @click="copyCode">{{ t.codefmt?.copy || '复制' }}</button>
          <button class="btn-sm primary" @click="downloadCode">{{ t.codefmt?.download || '下载' }}</button>
          <button class="btn-sm" @click="clear">{{ t.codefmt?.reupload || '重新上传' }}</button>
        </div>
      </div>

      <!-- 崩溃提示 -->
      <div v-if="maxLineLen > warningThreshold" class="warn-tip" :class="{ danger: maxLineLen > dangerThreshold }">
        <div class="warn-title">⚠️ {{ t.codefmt?.warnTitle || '检测到超长行' }}</div>
        <div class="warn-body">
          {{ (t.codefmt?.warnBody || '当前文件最长行约 {len} 字节，浏览器直接渲染容易崩溃。建议将每行拆分为 {suggest} 字节以下。')
             .replace('{len}', maxLineLen).replace('{suggest}', dangerThreshold) }}
        </div>
        <div class="warn-input-row">
          <label>{{ t.codefmt?.bytesPerLine || '每行字节数' }}:</label>
          <input
            v-model.number="bytesPerLine"
            type="number"
            class="bytes-input"
            min="100"
            max="5000"
            step="100"
          >
          <span class="bytes-hint">{{ t.codefmt?.bytesHint || '字节' }}</span>
          <button class="btn-sm primary" @click="doFormat">{{ t.codefmt?.formatBtn || '格式化拆分' }}</button>
        </div>
      </div>

      <div class="editor-box">
        <div class="line-nums">
          <div v-for="n in displayedLineCount" :key="n" class="line-num">{{ n }}</div>
        </div>
        <textarea
          ref="textarea"
          v-model="displayContent"
          readonly
          class="code-area"
          spellcheck="false"
        ></textarea>
      </div>

      <div v-if="isLarge" class="large-tip">
        {{ (t.codefmt?.largeFileTip || '文件较大，仅显示前 {lines} 行（共 {total} 行），点击下载可获取完整内容')
           .replace('{lines}', maxDisplayLines).replace('{total}', totalLines) }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const content = ref('')
const displayContent = ref('')
const fileName = ref('')
const fileSize = ref(0)
const language = ref('text')
const totalLines = ref(0)
const maxLineLen = ref(0)
const bytesPerLine = ref(500)
const maxDisplayLines = 2000
const maxDisplayBytes = 300 * 1024 // 300KB
const warningThreshold = 2000  // 超过2000字节提示
const dangerThreshold = 5000   // 超过5000字节危险

const t = computed(() => {
  try {
    const msgs = window.__VUE_I18N__?.global?.messages
    const locale = window.__VUE_I18N__?.global?.locale || 'zh'
    return msgs?.[locale] || {}
  } catch { return {} }
})

const isLarge = computed(() => totalLines.value > maxDisplayLines || fileSize.value > maxDisplayBytes)

const displayedLineCount = computed(() => {
  const lines = displayContent.value.split('\n').length
  return Math.min(lines, maxDisplayLines)
})

const extLangMap = {
  js: 'javascript', ts: 'typescript', jsx: 'jsx', tsx: 'tsx',
  html: 'html', htm: 'html', css: 'css', scss: 'scss', sass: 'sass', less: 'less',
  vue: 'vue', py: 'python', java: 'java', json: 'json',
  xml: 'xml', svg: 'xml', md: 'markdown', txt: 'text',
  c: 'c', cpp: 'cpp', h: 'c', hpp: 'cpp', cs: 'csharp',
  go: 'go', rs: 'rust', rb: 'ruby', php: 'php', sh: 'bash',
  sql: 'sql', yaml: 'yaml', yml: 'yaml',
}

function detectLang(name) {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  return extLangMap[ext] || 'text'
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

function getMaxLineLen(text) {
  let max = 0
  const lines = text.split('\n')
  for (const line of lines) {
    const len = new Blob([line]).size
    if (len > max) max = len
  }
  return max
}

function splitLongLines(text, chunkSize) {
  const lines = text.split('\n')
  const out = []
  for (const line of lines) {
    const bytes = new Blob([line]).size
    if (bytes > chunkSize && chunkSize > 0) {
      // 按字节拆分，注意UTF-8多字节字符
      const encoder = new TextEncoder()
      const decoder = new TextDecoder()
      const arr = encoder.encode(line)
      for (let i = 0; i < arr.length; i += chunkSize) {
        const slice = arr.slice(i, i + chunkSize)
        out.push(decoder.decode(slice))
      }
    } else {
      out.push(line)
    }
  }
  return out.join('\n')
}

function updateDisplay(text) {
  content.value = text
  totalLines.value = text.split('\n').length
  if (isLarge.value) {
    const lines = text.split('\n')
    displayContent.value = lines.slice(0, maxDisplayLines).join('\n')
  } else {
    displayContent.value = text
  }
}

function processFile(file) {
  fileName.value = file.name
  fileSize.value = file.size
  language.value = detectLang(file.name)

  const reader = new FileReader()
  reader.onload = (e) => {
    const raw = e.target.result
    maxLineLen.value = getMaxLineLen(raw)
    // 如果超长行超过警告阈值，先显示原始内容，等用户点击格式化
    updateDisplay(raw)
  }
  reader.readAsText(file)
}

function doFormat() {
  const raw = content.value
  const formatted = splitLongLines(raw, bytesPerLine.value)
  updateDisplay(formatted)
  maxLineLen.value = getMaxLineLen(formatted)
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

function copyCode() {
  navigator.clipboard.writeText(content.value).then(() => {
    alert('已复制到剪贴板')
  })
}

function downloadCode() {
  const blob = new Blob([content.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const name = fileName.value.replace(/\.[^.]+$/, '') + '_formatted' + (fileName.value.match(/\.[^.]+$/)?.[0] || '.txt')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

function clear() {
  content.value = ''
  displayContent.value = ''
  fileName.value = ''
  fileSize.value = 0
  language.value = 'text'
  totalLines.value = 0
  maxLineLen.value = 0
  bytesPerLine.value = 500
}
</script>

<style scoped>
.code-format-tool { padding: 16px; }
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

.preview-wrap { display: flex; flex-direction: column; gap: 12px; }
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
.badge.lang { background: #dbeafe; color: #1e40af; }
.badge.size { background: #f3f4f6; color: #4b5563; }
.badge.danger { background: #fee2e2; color: #991b1b; }
.info-right { display: flex; gap: 6px; }
.btn-sm {
  padding: 6px 14px; border-radius: 8px; border: 1px solid var(--border-color, #e5e7eb);
  background: var(--bg-card, #fff); color: var(--text-color, #333);
  font-size: 13px; cursor: pointer; transition: all 0.15s;
}
.btn-sm:hover { background: var(--bg-secondary, #f9fafb); }
.btn-sm.primary { background: var(--accent, #3b82f6); color: #fff; border-color: var(--accent, #3b82f6); }
.btn-sm.primary:hover { opacity: 0.9; }

.warn-tip {
  padding: 14px; border-radius: 12px;
  background: #fefce8; color: #854d0e;
  border: 1px solid #fde047;
}
.warn-tip.danger {
  background: #fef2f2; color: #991b1b;
  border-color: #fca5a5;
}
.warn-title { font-weight: 600; font-size: 14px; margin-bottom: 6px; }
.warn-body { font-size: 13px; line-height: 1.5; margin-bottom: 10px; }
.warn-input-row {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.warn-input-row label { font-size: 13px; font-weight: 500; }
.bytes-input {
  width: 80px; padding: 6px 10px; border-radius: 8px;
  border: 1px solid var(--border-color, #e5e7eb);
  background: var(--bg-card, #fff); color: var(--text-color, #333);
  font-size: 14px; text-align: center;
}
.bytes-hint { font-size: 13px; color: var(--text-secondary, #6b7280); }

.editor-box {
  display: flex; border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 12px; overflow: hidden; background: var(--bg-card, #fff);
  max-height: 55vh;
}
.line-nums {
  padding: 12px 8px; background: var(--bg-secondary, #f9fafb);
  border-right: 1px solid var(--border-color, #e5e7eb);
  font-family: 'SF Mono', Monaco, monospace; font-size: 13px;
  color: var(--text-secondary, #9ca3af); text-align: right;
  line-height: 1.6; overflow: hidden; user-select: none;
  min-width: 40px;
}
.line-num { height: 1.6em; }
.code-area {
  flex: 1; padding: 12px; border: none; outline: none; resize: none;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace; font-size: 13px;
  line-height: 1.6; color: var(--text-color, #374151); background: transparent;
  white-space: pre; overflow: auto; tab-size: 2;
}
.large-tip {
  padding: 10px 14px; border-radius: 10px;
  background: #fffbeb; color: #92400e; font-size: 13px;
  border: 1px solid #fcd34d;
}
</style>
