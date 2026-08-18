<template>
  <div class="image-tool">
    <!-- Upload Area -->
    <div v-if="!original.src" class="upload-area"
      @click="triggerFile"
      @drop.prevent="onDrop"
      @dragover.prevent="dragover = true"
      @dragleave.prevent="dragover = false"
      :class="{ dragover }">
      <input type="file" ref="fileInput" accept="image/*" @change="onFileSelect" hidden>
      <div class="upload-inner">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <p class="upload-title">点击或拖拽图片到此处</p>
        <p class="upload-hint">支持 JPG、PNG、WebP、GIF、BMP</p>
      </div>
    </div>

    <!-- Editor -->
    <div v-else class="editor">
      <!-- Preview Row -->
      <div class="preview-row">
        <div class="preview-box">
          <div class="preview-label">原图</div>
          <img :src="original.src" class="preview-img" alt="original">
          <div class="preview-meta">
            <span>{{ original.name }}</span>
            <span>{{ formatSize(original.size) }}</span>
            <span>{{ original.width }}×{{ original.height }}</span>
          </div>
        </div>
        <div class="preview-box">
          <div class="preview-label">压缩后</div>
          <img v-if="compressed.src" :src="compressed.src" class="preview-img" alt="compressed">
          <div v-else class="preview-img loading">处理中...</div>
          <div class="preview-meta">
            <span>{{ compressed.name || '-' }}</span>
            <span :class="{ saved: savedPercent > 0 }">{{ formatSize(compressed.size) }}</span>
            <span>{{ compressed.width }}×{{ compressed.height }}</span>
          </div>
        </div>
      </div>

      <!-- Stats Bar -->
      <div class="stats-bar">
        <div class="stat">
          <span class="stat-label">压缩率</span>
          <span class="stat-value" :class="{ saved: savedPercent > 0 }">{{ savedPercent }}%</span>
        </div>
        <div class="stat">
          <span class="stat-label">节省空间</span>
          <span class="stat-value saved">{{ formatSize(original.size - compressed.size) }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">输出格式</span>
          <span class="stat-value">{{ outputFormat.toUpperCase() }}</span>
        </div>
      </div>

      <!-- Controls -->
      <div class="controls">
        <div class="control-group">
          <label>压缩质量 <span>{{ Math.round(quality * 100) }}%</span></label>
          <input type="range" min="1" max="100" :value="quality * 100" @input="e => { quality = e.target.value / 100; debounceCompress() }">
        </div>
        <div class="control-group">
          <label>最大边长 <span>{{ maxDimension }}px</span></label>
          <input type="range" min="100" max="4096" step="10" v-model.number="maxDimension" @input="debounceCompress">
        </div>
        <div class="control-group">
          <label>输出格式</label>
          <div class="format-btns">
            <button v-for="f in formats" :key="f"
              :class="{ active: outputFormat === f }"
              @click="outputFormat = f; compress()">
              {{ f.toUpperCase() }}
            </button>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="actions">
        <button class="btn-secondary" @click="reset">重新选择</button>
        <button class="btn-primary" @click="download" :disabled="!compressed.blob">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          下载压缩图
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'

const fileInput = ref(null)
const dragover = ref(false)

const original = ref({ src: '', name: '', size: 0, width: 0, height: 0 })
const compressed = ref({ src: '', name: '', size: 0, width: 0, height: 0, blob: null })

const quality = ref(0.8)
const maxDimension = ref(1920)
const outputFormat = ref('jpeg')
const formats = ['jpeg', 'png', 'webp']

let compressTimer = null

const savedPercent = computed(() => {
  if (!original.value.size || !compressed.value.size) return 0
  return Math.round((1 - compressed.value.size / original.value.size) * 100)
})

function triggerFile() {
  fileInput.value?.click()
}

function onFileSelect(e) {
  handleFile(e.target.files[0])
}

function onDrop(e) {
  dragover.value = false
  handleFile(e.dataTransfer.files[0])
}

function handleFile(file) {
  if (!file || !file.type.startsWith('image/')) return
  const reader = new FileReader()
  reader.onload = async (e) => {
    const img = new Image()
    img.onload = () => {
      original.value = {
        src: e.target.result,
        name: file.name,
        size: file.size,
        width: img.naturalWidth,
        height: img.naturalHeight,
      }
      // Auto set max dimension to original max side
      maxDimension.value = Math.max(img.naturalWidth, img.naturalHeight)
      nextTick(() => compress())
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}

function debounceCompress() {
  if (compressTimer) clearTimeout(compressTimer)
  compressTimer = setTimeout(compress, 150)
}

function compress() {
  if (!original.value.src) return

  const img = new Image()
  img.onload = () => {
    let w = img.naturalWidth
    let h = img.naturalHeight
    const max = maxDimension.value

    if (w > h && w > max) {
      h = Math.round(h * max / w)
      w = max
    } else if (h > max) {
      w = Math.round(w * max / h)
      h = max
    }

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, w, h)

    const mimeType = outputFormat.value === 'png' ? 'image/png' : outputFormat.value === 'webp' ? 'image/webp' : 'image/jpeg'
    const q = outputFormat.value === 'png' ? undefined : quality.value

    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      // Revoke old URL to prevent memory leak
      if (compressed.value.src && compressed.value.src.startsWith('blob:')) {
        URL.revokeObjectURL(compressed.value.src)
      }
      const ext = outputFormat.value === 'jpeg' ? 'jpg' : outputFormat.value
      const newName = original.value.name.replace(/\.[^.]+$/, '') + '_compressed.' + ext
      compressed.value = {
        src: url,
        name: newName,
        size: blob.size,
        width: w,
        height: h,
        blob: blob,
      }
    }, mimeType, q)
  }
  img.src = original.value.src
}

function download() {
  if (!compressed.value.blob) return
  const link = document.createElement('a')
  link.href = compressed.value.src
  link.download = compressed.value.name
  link.click()
}

function reset() {
  if (compressed.value.src && compressed.value.src.startsWith('blob:')) {
    URL.revokeObjectURL(compressed.value.src)
  }
  original.value = { src: '', name: '', size: 0, width: 0, height: 0 }
  compressed.value = { src: '', name: '', size: 0, width: 0, height: 0, blob: null }
  fileInput.value.value = ''
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<style scoped>
.image-tool { width: 100%; }

/* Upload Area */
.upload-area {
  border: 2px dashed var(--border);
  border-radius: 16px;
  padding: 48px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
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

/* Preview Row */
.preview-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
@media (max-width: 480px) {
  .preview-row { grid-template-columns: 1fr; }
}

.preview-box {
  background: var(--bg-muted);
  border-radius: 12px;
  border: 1px solid var(--border);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.preview-label {
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--bg-raised);
  border-bottom: 1px solid var(--border);
}
.preview-img {
  width: 100%;
  max-height: 240px;
  object-fit: contain;
  background: repeating-conic-gradient(var(--bg-muted) 0% 25%, var(--bg-raised) 0% 50%) 50% / 16px 16px;
  flex: 1;
}
.preview-img.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  color: var(--text-tertiary);
  font-size: 14px;
}
.preview-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--text-tertiary);
  background: var(--bg-raised);
  border-top: 1px solid var(--border);
}
.preview-meta span:first-child {
  color: var(--text-primary);
  font-weight: 500;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Stats Bar */
.stats-bar {
  display: flex;
  gap: 24px;
  padding: 12px 16px;
  background: var(--bg-raised);
  border-radius: 10px;
  border: 1px solid var(--border);
}
.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.stat-label {
  font-size: 11px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}
.stat-value.saved {
  color: #10b981;
}

/* Controls */
.controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: var(--bg-raised);
  border-radius: 10px;
  border: 1px solid var(--border);
}
.control-group label {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 8px;
}
.control-group label span {
  color: var(--accent);
  font-weight: 600;
}
.control-group input[type="range"] {
  width: 100%;
  accent-color: var(--accent);
}
.format-btns {
  display: flex;
  gap: 8px;
}
.format-btns button {
  flex: 1;
  padding: 8px 0;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.format-btns button:hover { background: var(--bg-muted); }
.format-btns button.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

/* Actions */
.actions {
  display: flex;
  gap: 10px;
}
.actions button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
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
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-secondary {
  background: var(--bg-raised);
  color: var(--text-primary);
  border: 1px solid var(--border);
}
.btn-secondary:hover { background: var(--bg-muted); }
</style>
