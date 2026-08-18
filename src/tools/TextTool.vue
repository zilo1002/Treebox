<template>
  <div class="text-tool">
    <div class="actions">
      <button class="btn-secondary" @click="toUpper">转大写</button>
      <button class="btn-secondary" @click="toLower">转小写</button>
      <button class="btn-secondary" @click="reverse">反转</button>
      <button class="btn-secondary" @click="count">统计</button>
      <button class="btn-secondary" @click="clear">清空</button>
    </div>
    <textarea v-model="input" placeholder="输入文本..." rows="6"></textarea>
    <div v-if="stats" class="stats">{{ stats }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const input = ref('')
const stats = ref('')

function toUpper() { input.value = input.value.toUpperCase() }
function toLower() { input.value = input.value.toLowerCase() }
function reverse() { input.value = input.value.split('').reverse().join('') }
function count() {
  const len = input.value.length
  const lines = input.value.split('\n').length
  const words = input.value.trim() ? input.value.trim().split(/\s+/).length : 0
  stats.value = `字符: ${len} | 行数: ${lines} | 单词: ${words}`
}
function clear() { input.value = ''; stats.value = '' }
</script>

<style scoped>
.text-tool { display: flex; flex-direction: column; gap: 10px; }
.actions { display: flex; gap: 6px; flex-wrap: wrap; }
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
.stats {
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--bg-raised);
  border: 1px solid var(--border);
  font-size: 13px;
  color: var(--text-secondary);
}
.btn-secondary {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--border);
  background: var(--bg-raised);
  color: var(--text-primary);
  transition: opacity 0.15s;
}
.btn-secondary:hover { opacity: 0.85; }
</style>
