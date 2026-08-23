<template>
  <div class="js-url-tool">
    <div class="input-bar">
      <input
        v-model="url"
        type="text"
        class="url-input"
        :placeholder="t.jsurl?.urlPlaceholder || '输入 JS 文件网址，如 https://cdn.example.com/lib.js'"
        @keyup.enter="fetchContent"
      >
      <button class="fetch-btn" :disabled="loading" @click="fetchContent">
        {{ loading ? (t.jsurl?.fetching || '获取中...') : (t.jsurl?.fetch || '获取内容') }}
      </button>
    </div>

    <div v-if="error" class="error-box">
      <div class="error-icon">⚠️</div>
      <div class="error-text">{{ error }}</div>
    </div>

    <div v-if="content" class="preview-wrap">
      <div class="preview-bar">
        <span class="preview-size">{{ t.jsurl?.size || '大小' }}: {{ formatSize(content.length) }}</span>
        <div class="preview-actions">
          <button class="btn-sm" @click="copyContent">{{ t.jsurl?.copy || '复制' }}</button>
          <button class="btn-sm primary" @click="download('js')">{{ t.jsurl?.downloadJs || '下载 .js' }}</button>
          <button class="btn-sm primary" @click="download('txt')">{{ t.jsurl?.downloadTxt || '下载 .txt' }}</button>
        </div>
      </div>
      <textarea
        v-model="content"
        readonly
        class="preview-area"
        spellcheck="false"
      ></textarea>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const url = ref('')
const content = ref('')
const loading = ref(false)
const error = ref('')

const t = computed(() => {
  try {
    const msgs = window.__VUE_I18N__?.global?.messages
    const locale = window.__VUE_I18N__?.global?.locale || 'zh'
    return msgs?.[locale] || {}
  } catch { return {} }
})

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

async function fetchContent() {
  if (!url.value.trim()) return
  loading.value = true
  error.value = ''
  content.value = ''

  try {
    const res = await fetch(url.value.trim(), {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
    })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const text = await res.text()
    content.value = text
  } catch (e) {
    const msg = e.message || ''
    if (msg.includes('CORS') || msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      error.value = t.value.jsurl?.errorCors || '跨域限制，无法直接获取。建议下载后使用「代码格式化」查看'
    } else {
      error.value = (t.value.jsurl?.errorFetch || '获取失败，请检查网址是否正确') + ' (' + msg + ')'
    }
  } finally {
    loading.value = false
  }
}

function copyContent() {
  navigator.clipboard.writeText(content.value).then(() => {
    alert('已复制到剪贴板')
  })
}

function download(ext) {
  const mime = ext === 'js' ? 'application/javascript' : 'text/plain'
  const blob = new Blob([content.value], { type: mime + ';charset=utf-8' })
  const objUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const name = url.value.split('/').pop()?.split('?')[0] || 'script'
  const base = name.replace(/\.[^.]+$/, '') || 'download'
  a.href = objUrl
  a.download = base + '.' + ext
  a.click()
  URL.revokeObjectURL(objUrl)
}
</script>

<style scoped>
.js-url-tool { padding: 16px; display: flex; flex-direction: column; gap: 16px; }
.input-bar {
  display: flex; gap: 8px;
}
.url-input {
  flex: 1; padding: 12px 14px; border-radius: 12px;
  border: 1px solid var(--border-color, #e5e7eb);
  background: var(--bg-card, #fff); color: var(--text-color, #333);
  font-size: 14px; outline: none; transition: border-color 0.2s;
}
.url-input:focus { border-color: var(--accent, #3b82f6); }
.fetch-btn {
  padding: 12px 20px; border-radius: 12px; border: none;
  background: var(--accent, #3b82f6); color: #fff;
  font-size: 14px; font-weight: 500; cursor: pointer;
  white-space: nowrap; transition: opacity 0.15s;
}
.fetch-btn:hover:not(:disabled) { opacity: 0.9; }
.fetch-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.error-box {
  display: flex; align-items: center; gap: 10px;
  padding: 14px; border-radius: 12px;
  background: #fef2f2; color: #991b1b;
  border: 1px solid #fecaca;
}
.error-icon { font-size: 20px; }
.error-text { font-size: 14px; line-height: 1.5; }

.preview-wrap { display: flex; flex-direction: column; gap: 10px; }
.preview-bar {
  display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
  justify-content: space-between;
}
.preview-size { font-size: 13px; color: var(--text-secondary, #6b7280); }
.preview-actions { display: flex; gap: 6px; }
.btn-sm {
  padding: 6px 14px; border-radius: 8px; border: 1px solid var(--border-color, #e5e7eb);
  background: var(--bg-card, #fff); color: var(--text-color, #333);
  font-size: 13px; cursor: pointer; transition: all 0.15s;
}
.btn-sm:hover { background: var(--bg-secondary, #f9fafb); }
.btn-sm.primary { background: var(--accent, #3b82f6); color: #fff; border-color: var(--accent, #3b82f6); }
.btn-sm.primary:hover { opacity: 0.9; }

.preview-area {
  width: 100%; min-height: 300px; max-height: 55vh;
  padding: 14px; border-radius: 12px;
  border: 1px solid var(--border-color, #e5e7eb);
  background: var(--bg-card, #fff);
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 13px; line-height: 1.6; color: var(--text-color, #374151);
  resize: vertical; outline: none; white-space: pre; overflow: auto; tab-size: 2;
}
</style>
