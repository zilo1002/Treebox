<template>
  <div class="calc-tool">
    <div class="calc-top">
      <button class="history-btn" @click="showHistory = !showHistory">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      </button>
    </div>
    <div class="calc-display">
      <div class="calc-expr">{{ expr }}</div>
      <div class="calc-result">{{ display }}</div>
    </div>
    <div v-if="showHistory" class="history-panel">
      <div v-if="!groupedHistory.length" class="history-empty">无历史记录</div>
      <div v-else class="history-list">
        <div v-for="g in groupedHistory" :key="g.date">
          <div class="history-date">{{ g.date }}</div>
          <div v-for="h in g.items" :key="h.id" class="history-item" @click="restore(h)">
            <span class="history-expr">{{ h.expr }} =</span>
            <span class="history-result">{{ h.result }}</span>
          </div>
        </div>
      </div>
      <button v-if="history.length" class="clear-btn" @click="confirmClear = true">清除记录</button>
    </div>
    <div v-else class="calc-keys">
      <button v-for="k in keys" :key="k" :class="{ op: '+-*/='.includes(k), eq: k === '=' }" @click="press(k)">
        {{ k }}
      </button>
    </div>
    <div v-if="confirmClear" class="confirm-overlay" @click.self="confirmClear = false">
      <div class="confirm-box">
        <p>确定清除全部历史记录吗？</p>
        <div class="confirm-actions">
          <button class="btn-secondary" @click="confirmClear = false">取消</button>
          <button class="btn-danger" @click="clearHistory">清除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const display = ref('0')
const expr = ref('')
const prev = ref('')
const op = ref('')
const resetNext = ref(false)
const showHistory = ref(false)
const confirmClear = ref(false)
const history = ref([])

const HISTORY_KEY = 'treebox-calc-history'
const HISTORY_LIMIT = 100

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) history.value = parsed
    }
  } catch { history.value = [] }
}

function saveHistory() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.value))
  } catch { /* 存储被禁时只保留内存里的记录 */ }
}

loadHistory()

function formatDate(ts) {
  const d = new Date(ts)
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`
}

const groupedHistory = computed(() => {
  const groups = []
  const map = new Map()
  for (const h of history.value) {
    const d = formatDate(h.time)
    if (!map.has(d)) {
      const g = { date: d, items: [] }
      map.set(d, g)
      groups.push(g)
    }
    map.get(d).items.push(h)
  }
  return groups
})

function recordHistory(exprStr, result) {
  history.value.unshift({
    id: Date.now() + Math.random().toString(36).slice(2, 7),
    expr: exprStr,
    result: String(result),
    time: Date.now(),
  })
  if (history.value.length > HISTORY_LIMIT) history.value.length = HISTORY_LIMIT
  saveHistory()
}

function restore(h) {
  display.value = h.result
  expr.value = h.expr
  prev.value = ''
  op.value = ''
  resetNext.value = true
  showHistory.value = false
}

function clearHistory() {
  history.value = []
  saveHistory()
  confirmClear.value = false
}

const keys = ['C','/','*','←','7','8','9','-','4','5','6','+','1','2','3','=','0','.']

function press(k) {
  if (k === 'C') { display.value = '0'; expr.value = ''; prev.value = ''; op.value = ''; resetNext.value = false; return }
  if (k === '←') {
    if (resetNext.value && op.value) return
    display.value = display.value.slice(0, -1) || '0'
    expr.value = op.value ? `${prev.value} ${op.value} ${display.value}` : ''
    return
  }
  if ('+-*/'.includes(k)) { prev.value = display.value; op.value = k; resetNext.value = true; expr.value = `${display.value} ${k}`; return }
  if (k === '=') {
    if (!op.value || !prev.value) return
    const a = parseFloat(prev.value), b = parseFloat(display.value)
    const res = op.value === '+' ? a + b : op.value === '-' ? a - b : op.value === '*' ? a * b : b !== 0 ? a / b : 'Error'
    const exprStr = `${prev.value} ${op.value} ${display.value}`
    display.value = String(res).slice(0, 12)
    expr.value = exprStr
    if (res !== 'Error') recordHistory(exprStr, display.value)
    prev.value = ''; op.value = ''; resetNext.value = true
    return
  }
  let next
  if (resetNext.value) { next = k === '.' ? '0.' : k; resetNext.value = false }
  else {
    if (k === '.' && display.value.includes('.')) return
    next = (display.value === '0' && k !== '.') ? k : display.value + k
  }
  display.value = next
  expr.value = op.value ? `${prev.value} ${op.value} ${next}` : ''
}
</script>

<style scoped>
.calc-tool { max-width: 320px; margin: 0 auto; }
.calc-top { display: flex; justify-content: flex-end; margin-bottom: 8px; }
.history-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--bg-raised);
  color: var(--text-secondary);
  cursor: pointer;
}
.history-btn:hover { background: var(--bg-muted); color: var(--text-primary); }
.calc-display {
  background: var(--bg-muted);
  border-radius: 10px;
  padding: 12px 16px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  margin-bottom: 12px;
  color: var(--text-primary);
  border: 1px solid var(--border);
  min-height: 76px;
  box-sizing: border-box;
}
.calc-expr {
  font-size: 15px;
  color: var(--text-secondary);
  min-height: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.calc-result {
  font-size: 32px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
.history-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.history-list {
  max-height: 300px;
  overflow-y: auto;
  background: var(--bg-raised);
  border-radius: 12px;
  border: 1px solid var(--border);
  padding: 8px 12px;
}
.history-empty {
  text-align: center;
  color: var(--text-tertiary);
  font-size: 0.875rem;
  padding: 32px 0;
  background: var(--bg-raised);
  border-radius: 12px;
  border: 1px solid var(--border);
}
.history-date {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--accent);
  padding: 8px 0 4px;
}
.history-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  font-size: 0.9375rem;
  cursor: pointer;
  border-bottom: 1px solid var(--border);
}
.history-item:last-child { border-bottom: none; }
.history-item:hover { color: var(--accent); }
.history-expr {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-secondary);
}
.history-result { font-weight: 500; white-space: nowrap; }
.clear-btn {
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  background: var(--bg-raised);
  color: var(--text-primary);
  border: 1px solid var(--border);
}
.clear-btn:hover { background: var(--bg-muted); }
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 24px;
  box-sizing: border-box;
}
.confirm-box {
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 20px;
  width: 100%;
  max-width: 300px;
  box-sizing: border-box;
  text-align: center;
  color: var(--text-primary);
}
.confirm-box p { margin: 0 0 16px; font-size: 0.9375rem; }
.confirm-actions { display: flex; gap: 10px; }
.confirm-actions button { flex: 1; }
.btn-secondary {
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  background: var(--bg-raised);
  color: var(--text-primary);
  border: 1px solid var(--border);
}
.btn-secondary:hover { background: var(--bg-muted); }
.btn-danger {
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  background: #c0453e;
  color: #fff;
}
.btn-danger:hover { opacity: 0.9; }
</style>
