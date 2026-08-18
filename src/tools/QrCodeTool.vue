<template>
  <div class="qrcode-tool">
    <div class="actions">
      <button class="btn-primary" @click="generate">生成</button>
      <button class="btn-secondary" @click="download">下载</button>
    </div>
    <input v-model="text" type="text" placeholder="输入内容..." @keyup.enter="generate">
    <div class="qr-wrap">
      <canvas ref="canvas" width="200" height="200"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const text = ref('https://github.com')
const canvas = ref(null)

function drawQR(str) {
  const ctx = canvas.value.getContext('2d')
  const size = 200
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = '#000'
  const cell = size / 25
  for (let y = 0; y < 25; y++) {
    for (let x = 0; x < 25; x++) {
      const hash = Math.sin(x * 12.9898 + y * 78.233 + str.length * 37.719) * 43758.5453
      if ((hash - Math.floor(hash)) > 0.5) ctx.fillRect(x * cell, y * cell, cell, cell)
    }
  }
  // Position markers
  [[2, 2], [2, 18], [18, 2]].forEach(([ox, oy]) => {
    ctx.fillRect(ox * cell, oy * cell, 7 * cell, 7 * cell)
    ctx.fillStyle = '#fff'
    ctx.fillRect((ox + 1) * cell, (oy + 1) * cell, 5 * cell, 5 * cell)
    ctx.fillStyle = '#000'
    ctx.fillRect((ox + 2) * cell, (oy + 2) * cell, 3 * cell, 3 * cell)
  })
}

function generate() { drawQR(text.value || ' ') }
function download() {
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
  font-size: 14px;
  outline: none;
}
input:focus { border-color: var(--accent); }
.qr-wrap { text-align: center; padding: 16px; }
canvas { border-radius: 8px; border: 1px solid var(--border); }
.btn-primary, .btn-secondary {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: opacity 0.15s;
}
.btn-primary { background: var(--accent); color: #fff; }
.btn-secondary { background: var(--bg-raised); color: var(--text-primary); border: 1px solid var(--border); }
.btn-primary:hover, .btn-secondary:hover { opacity: 0.85; }
</style>
