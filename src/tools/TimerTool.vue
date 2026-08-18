<template>
  <div class="timer-tool">
    <div class="timer-display">{{ display }}</div>
    <div class="actions">
      <button class="btn-primary" @click="start">开始</button>
      <button class="btn-secondary" @click="stop">停止</button>
      <button class="btn-secondary" @click="reset">重置</button>
    </div>
    <div class="form-field">
      <label>设置分钟</label>
      <input v-model.number="minutes" type="number" min="1" max="120">
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

const minutes = ref(5)
const seconds = ref(0)
const running = ref(false)
let interval = null

const display = computed(() => {
  const m = String(Math.floor(seconds.value / 60)).padStart(2, '0')
  const s = String(seconds.value % 60).padStart(2, '0')
  return `00:${m}:${s}`
})

function start() {
  stop()
  seconds.value = minutes.value * 60
  running.value = true
  interval = setInterval(() => {
    if (seconds.value > 0) seconds.value--
    else stop()
  }, 1000)
}
function stop() {
  running.value = false
  if (interval) { clearInterval(interval); interval = null }
}
function reset() {
  stop()
  seconds.value = 0
}

onUnmounted(stop)
</script>

<style scoped>
.timer-tool { text-align: center; }
.timer-display {
  font-size: 48px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  margin: 24px 0;
  color: var(--text-primary);
}
.actions { display: flex; gap: 8px; justify-content: center; margin-bottom: 20px; }
.form-field { text-align: left; max-width: 200px; margin: 0 auto; }
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