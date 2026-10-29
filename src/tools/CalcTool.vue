<template>
  <div class="calc-tool">
    <div class="calc-display">{{ display }}</div>
    <div class="calc-keys">
      <button v-for="k in keys" :key="k" :class="{ op: '+-*/='.includes(k), eq: k === '=' }" @click="press(k)">
        {{ k }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const display = ref('0')
const prev = ref('')
const op = ref('')
const resetNext = ref(false)

const keys = ['C','/','*','←','7','8','9','-','4','5','6','+','1','2','3','=','0','.']

function press(k) {
  if (k === 'C') { display.value = '0'; prev.value = ''; op.value = ''; return }
  if (k === '←') { display.value = display.value.slice(0, -1) || '0'; return }
  if ('+-*/'.includes(k)) { prev.value = display.value; op.value = k; resetNext.value = true; return }
  if (k === '=') {
    if (!op.value || !prev.value) return
    const a = parseFloat(prev.value), b = parseFloat(display.value)
    const res = op.value === '+' ? a + b : op.value === '-' ? a - b : op.value === '*' ? a * b : b !== 0 ? a / b : 'Error'
    display.value = String(res).slice(0, 12)
    prev.value = ''; op.value = ''; resetNext.value = true
    return
  }
  if (resetNext.value) { display.value = k === '.' ? '0.' : k; resetNext.value = false; return }
  if (k === '.' && display.value.includes('.')) return
  if (display.value === '0' && k !== '.') display.value = k
  else display.value += k
}
</script>

<style scoped>
.calc-tool { max-width: 320px; margin: 0 auto; }
.calc-display {
  background: var(--bg-muted);
  border-radius: 10px;
  padding: 16px;
  font-size: 32px;
  font-weight: 500;
  text-align: right;
  font-variant-numeric: tabular-nums;
  margin-bottom: 12px;
  color: var(--text-primary);
  border: 1px solid var(--border);
}
.calc-keys {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.calc-keys button {
  padding: 16px 0;
  font-size: 18px;
  font-weight: 500;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-raised);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.1s;
}
.calc-keys button:hover { background: var(--bg-muted); }
.calc-keys button.op { background: var(--bg-muted); color: var(--accent); }
.calc-keys button.eq { background: var(--accent); color: #fff; border-color: var(--accent); }
.calc-keys button.eq:hover { opacity: 0.9; }
</style>
