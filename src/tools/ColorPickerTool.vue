<template>
  <div class="color-tool">
    <div class="color-preview" :style="{ background: color }">
      <span>{{ color }}</span>
    </div>
    <div class="form-field">
      <label>选择颜色</label>
      <input type="color" v-model="color">
    </div>
    <div class="form-field">
      <label>HEX</label>
      <input type="text" v-model="color" @input="validateHex">
    </div>
    <div class="form-field">
      <label>RGB</label>
      <input type="text" :value="rgb" readonly>
    </div>
    <button class="btn-secondary" @click="copy">复制 HEX</button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const color = ref('#3b82f6')

const rgb = computed(() => {
  const hex = color.value.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return `rgb(${r}, ${g}, ${b})`
})

function validateHex() {
  if (!color.value.startsWith('#')) color.value = '#' + color.value
  if (!/^#[0-9A-Fa-f]{6}$/.test(color.value)) color.value = '#3b82f6'
}

function copy() {
  navigator.clipboard?.writeText(color.value)
}
</script>

<style scoped>
.color-tool { display: flex; flex-direction: column; gap: 12px; }
.color-preview {
  height: 100px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 500;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0,0,0,0.3);
  border: 1px solid var(--border);
}
.form-field label { display: block; font-size: 13px; color: var(--text-secondary); margin-bottom: 6px; }
.form-field input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-muted);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
}
.form-field input[type="color"] {
  height: 44px;
  padding: 4px;
  cursor: pointer;
}
.btn-secondary {
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--border);
  background: var(--bg-raised);
  color: var(--text-primary);
  transition: opacity 0.15s;
}
.btn-secondary:hover { opacity: 0.85; }
</style>
