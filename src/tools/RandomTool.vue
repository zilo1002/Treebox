<template>
  <div class="random-tool">
    <div class="form-row">
      <div class="form-field">
        <label>最小值</label>
        <input v-model.number="min" type="number">
      </div>
      <div class="form-field">
        <label>最大值</label>
        <input v-model.number="max" type="number">
      </div>
    </div>
    <button class="btn-primary generate" @click="generate">生成</button>
    <div class="result">{{ result }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const min = ref(1)
const max = ref(100)
const result = ref('-')

function generate() {
  const a = Math.min(min.value, max.value)
  const b = Math.max(min.value, max.value)
  result.value = Math.floor(Math.random() * (b - a + 1)) + a
}
</script>

<style scoped>
.random-tool { text-align: center; }
.form-row { display: flex; gap: 12px; margin-bottom: 16px; }
.form-field { flex: 1; text-align: left; }
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
.generate { width: 100%; margin-bottom: 20px; }
.result {
  font-size: 42px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--accent);
}
.btn-primary {
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  background: var(--accent);
  color: #fff;
  transition: opacity 0.15s;
}
.btn-primary:hover { opacity: 0.85; }
</style>
