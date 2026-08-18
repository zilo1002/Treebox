<template>
  <div class="rename-tool">
    <!-- Upload -->
    <div v-if="!files.length" class="upload-area"
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
        <p class="upload-title">点击或拖拽文件到此处</p>
        <p class="upload-hint">支持多选，不会上传服务器</p>
      </div>
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
          <span class="col-old">原文件名</span>
          <span class="col-arrow">→</span>
          <span class="col-new">新文件名</span>
        </div>
        <div v-for="(item, i) in files" :key="i" class="file-row" :class="{ changed: item.oldName !== item.newName }">
          <span class="col-num">{{ i + 1 }}</span>
          <span class="col-old" :title="item.oldName">{{ item.oldName }}</span>
          <span class="col-arrow">→</span>
          <input v-model="item.newName" type="text" class="col-new-input">
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
const dragover = ref(false)
const files = ref([])
const downloading = ref(false)

// Rules
const prefix = ref('')
const suffix = ref('')
const startNum = ref(1)
const numDigits = ref(2)
const numPosition = ref('before')
const findText = ref('')
const replaceText = ref('')

function triggerFile() {
  fileInput.value?.click()
}

function onFileSelect(e) {
  handleFiles(e.target.files)
}

function onDrop(e) {
  dragover.value = false
  handleFiles(e.dataTransfer.files)
}

function handleFiles(fileList) {
  if (!fileList) return
  const newFiles = Array.from(fileList).map(f => ({
    file: f,
    oldName: f.name,
    newName: f.name,
    ext: f.name.includes('.') ? f.name.slice(f.name.lastIndexOf('.')) : '',
    base: f.name.includes('.') ? f.name.slice(0, f.name.lastIndexOf('.')) : f.name,
  }))
  files.value.push(...newFiles)
}

function applyRules() {
  files.value.forEach((item, i) => {
    let name = item.base

    // Find & replace
    if (findText.value) {
      name = name.split(findText.value).join(replaceText.value)
    }

    // Number
    const num = String(startNum.value + i).padStart(numDigits.value, '0')
    if (numPosition.value === 'before') {
      name = prefix.value + num + name + suffix.value
    } else {
      name = prefix.value + name + num + suffix.value
    }

    item.newName = name + item.ext
  })
}

function resetNames() {
  files.value.forEach(item => {
    item.newName = item.oldName
  })
}

function clearAll() {
  files.value = []
  fileInput.value && (fileInput.value.value = '')
}

async function downloadAll() {
  if (downloading.value) return
  downloading.value = true
  for (let i = 0; i < files.value.length; i++) {
    const item = files.value[i]
    const url = URL.createObjectURL(item.file)
    const a = document.createElement('a')
    a.href = url
    a.download = item.newName
    a.click()
    URL.revokeObjectURL(url)
    await sleep(200)
  }
  downloading.value = false
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

function copyScript() {
  const lines = files.value.map(f => {
    // Generate PowerShell rename command
    return `Rename-Item -Path "${f.oldName}" -NewName "${f.newName}"`
  })
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
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
}
.upload-hint {
  font-size: 13px;
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
  font-size: 12px;
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
  font-size: 13px;
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
  grid-template-columns: 36px 1fr 30px 1fr;
  align-items: center;
  padding: 8px 12px;
  gap: 8px;
  font-size: 13px;
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
  font-size: 12px;
}
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
  font-size: 13px;
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
  font-size: 14px;
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
