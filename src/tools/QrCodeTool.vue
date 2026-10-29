<template>
  <div class="qrcode-tool">
    <div class="actions">
      <button class="btn-primary" @click="generate">生成</button>
      <button class="btn-secondary" @click="download">下载</button>
    </div>
    <input v-model="text" type="text" placeholder="输入内容..." @keyup.enter="generate">
    <p v-if="error" class="qr-error">{{ error }}</p>
    <div class="qr-wrap">
      <canvas ref="canvas"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import qrcode from 'qrcode-generator'

// 该库默认按 Latin-1 编码字符串，中文/emoji 会被截断成乱码：
// 改为 UTF-8 编码后再生成，扫码端才能读回原文（本地已用独立解码器验过中英/emoji/长文本）。
qrcode.stringToBytes = (s) => Array.from(new TextEncoder().encode(s))

const text = ref('https://github.com')
const canvas = ref(null)
const error = ref('')

function drawQR(str) {
  const ctx = canvas.value.getContext('2d')
  const qr = qrcode(0, 'M')
  qr.addData(str)
  qr.make()
  const n = qr.getModuleCount()
  const quiet = 4
  const cell = 8
  const size = (n + quiet * 2) * cell
  canvas.value.width = size
  canvas.value.height = size
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = '#000'
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (qr.isDark(y, x)) ctx.fillRect((x + quiet) * cell, (y + quiet) * cell, cell, cell)
    }
  }
}

function clearCanvas() {
  const ctx = canvas.value.getContext('2d')
  canvas.value.width = 200
  canvas.value.height = 200
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, 200, 200)
}

function generate() {
  const str = text.value.trim()
  error.value = ''
  if (!str) {
    error.value = '请输入内容'
    clearCanvas()
    return
  }
  try {
    drawQR(str)
  } catch (e) {
    error.value = '内容太长，生成失败，请缩短后重试'
    clearCanvas()
  }
}
function download() {
  if (error.value) return
  const link = document.createElement('a')
  link.download = 'qrcode.png'
  link.href = canvas.value.toDataURL()
  link.click()
}

onMounted(() => generate())
</script>

<style scoped>
.qrcode-tool { display: flex; flex-direction: column; gap: 10px; }
.actions { display: flex; gap: 8px; }
input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-muted);
  color: var(--text-primary);
  font-size: 0.875rem;
  outline: none;
}
input:focus { border-color: var(--accent); }
.qr-error { margin: 0; font-size: 0.8rem; color: #ef4444; }
.qr-wrap { text-align: center; padding: 16px; }
canvas { border-radius: 8px; border: 1px solid var(--border); max-width: 100%; height: auto; }
.btn-primary, .btn-secondary {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: opacity 0.15s;
}
.btn-primary { background: var(--accent); color: #fff; }
.btn-secondary { background: var(--bg-raised); color: var(--text-primary); border: 1px solid var(--border); }
.btn-primary:hover, .btn-secondary:hover { opacity: 0.85; }
</style>
