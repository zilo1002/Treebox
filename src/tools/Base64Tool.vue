<template>
  <div class="base64-tool">
    <div class="actions">
      <button class="btn-primary" @click="encode">编码</button>
      <button class="btn-secondary" @click="decode">解码</button>
      <button class="btn-secondary" @click="copy">复制</button>
      <button class="btn-secondary" @click="clear">清空</button>
    </div>
    <textarea v-model="input" placeholder="输入文本..." rows="4"></textarea>
    <textarea v-model="output" placeholder="结果..." rows="4" readonly ref="outRef"></textarea>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const input = ref('')
const output = ref('')
const outRef = ref(null)

function encode() {
  try {
    output.value = btoa(unescape(encodeURIComponent(input.value)))
  } catch { output.value = '编码失败' }
}
function decode() {
  try {
    output.value = decodeURIComponent(escape(atob(input.value)))
  } catch { output.value = '解码失败' }
}
function copy() {
  outRef.value?.select()
  document.execCommand('copy')
}
function clear() { input.value = ''; output.value = '' }
</script>

<style scoped>
.base64-tool { display: flex; flex-direction: column; gap: 10px; }
.actions { display: flex; gap: 8px; flex-wrap: wrap; }
textarea {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-muted);
  color: var(--text-primary);
  font-size: 14px;
  resize: vertical;
  outline: none;
  font-family: inherit;
}
textarea:focus { border-color: var(--accent); }
textarea[readonly] { background: var(--bg); }
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
