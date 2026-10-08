<template>
  <div class="clicker-tool">
    <div class="seg">
      <button :class="{ active: mode === 'auto' }" @click="switchMode('auto')">自动连点</button>
      <button :class="{ active: mode === 'speed' }" @click="switchMode('speed')">手速测试</button>
    </div>

    <!-- 自动连点 -->
    <div v-if="mode === 'auto'">
      <div
        class="pad"
        :class="{ running: autoState === 'running', counting: autoState === 'countdown' }"
        @click="manualPadTap"
      >
        <div
          v-for="r in ripples"
          :key="r.id"
          class="ripple"
          :style="{ left: r.x + '%', top: r.y + '%' }"
        ></div>
        <div v-if="autoState === 'countdown'" class="pad-big">{{ countdownNum }}</div>
        <template v-else>
          <div class="pad-count">{{ autoCount }}</div>
          <div class="pad-hint">{{ autoState === 'running' ? '连点中,点任意处或按停止结束' : '点开始,连点会落在这里' }}</div>
        </template>
      </div>

      <div class="stat-row">
        <div class="stat"><span class="stat-num">{{ liveCps }}</span><span class="stat-label">次/秒</span></div>
        <div class="stat"><span class="stat-num">{{ elapsedText }}</span><span class="stat-label">已用时</span></div>
        <div class="stat"><span class="stat-num">{{ targetText }}</span><span class="stat-label">目标</span></div>
      </div>

      <div class="form-field">
        <label>连点间隔 {{ interval }} 毫秒(约 {{ intervalCps }} 次/秒)</label>
        <input v-model.number="interval" type="range" min="10" max="1000" step="10" :disabled="autoState !== 'idle'">
        <div class="chip-row">
          <button v-for="p in intervalPresets" :key="p" class="chip" :class="{ active: interval === p }" :disabled="autoState !== 'idle'" @click="interval = p">{{ p }}ms</button>
        </div>
      </div>

      <div class="form-row">
        <div class="form-field">
          <label>目标次数(0 = 不限)</label>
          <input v-model.number="target" type="number" min="0" max="100000" :disabled="autoState !== 'idle'">
        </div>
        <div class="form-field">
          <label>开始前倒计时</label>
          <select v-model.number="startDelay" :disabled="autoState !== 'idle'">
            <option :value="0">不等待</option>
            <option :value="3">3 秒</option>
            <option :value="5">5 秒</option>
          </select>
        </div>
      </div>

      <label class="check-row">
        <input v-model="jitter" type="checkbox" :disabled="autoState !== 'idle'">
        <span>随机间隔(每次 ±30%,更像真人)</span>
      </label>

      <button v-if="autoState === 'idle'" class="btn-primary big-btn" @click="startAuto">开始连点</button>
      <button v-else class="btn-danger big-btn" @click="stopAuto">停止</button>
      <p class="note">浏览器里的连点只能落在这个工具页面内,没法替你去点别的 App,这点它不骗人。</p>
    </div>

    <!-- 手速测试 -->
    <div v-else>
      <div class="pad speed" :class="{ running: speedState === 'running' }" @click="speedTap">
        <div
          v-for="r in ripples"
          :key="r.id"
          class="ripple"
          :style="{ left: r.x + '%', top: r.y + '%' }"
        ></div>
        <template v-if="speedState === 'running'">
          <div class="pad-count">{{ speedCount }}</div>
          <div class="pad-hint">剩 {{ speedLeft }} 秒,点!</div>
        </template>
        <template v-else-if="speedResult">
          <div class="pad-count">{{ speedResult.cps }}</div>
          <div class="pad-hint">{{ speedResult.total }} 次 / {{ speedResult.seconds }} 秒,平均每秒 {{ speedResult.cps }} 次</div>
        </template>
        <template v-else>
          <div class="pad-big">👆</div>
          <div class="pad-hint">选好时长,点开始后使劲点这里</div>
        </template>
      </div>

      <div class="chip-row center">
        <button v-for="s in [5, 10, 30]" :key="s" class="chip" :class="{ active: speedSeconds === s }" :disabled="speedState === 'running'" @click="speedSeconds = s">{{ s }} 秒</button>
      </div>

      <div class="stat-row">
        <div class="stat"><span class="stat-num">{{ bestCps || '-' }}</span><span class="stat-label">最佳 次/秒</span></div>
        <div class="stat"><span class="stat-num">{{ speedResult ? speedResult.total : '-' }}</span><span class="stat-label">上次总次数</span></div>
      </div>

      <button v-if="speedState !== 'running'" class="btn-primary big-btn" @click="startSpeed">开始测试</button>
      <button v-else class="btn-danger big-btn" @click="stopSpeed">提前结束</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'

const mode = ref('auto')

// ---------- 自动连点 ----------
const interval = ref(100)
const target = ref(0)
const startDelay = ref(3)
const jitter = ref(false)
const autoState = ref('idle') // idle | countdown | running
const autoCount = ref(0)
const countdownNum = ref(0)
const startedAt = ref(0)
const elapsedMs = ref(0)
const intervalPresets = [10, 50, 100, 250, 500, 1000]

const intervalCps = computed(() => Math.round(1000 / Math.max(10, interval.value)))
const targetText = computed(() => target.value > 0 ? target.value : '不限')
const elapsedText = computed(() => (elapsedMs.value / 1000).toFixed(1) + 's')
const liveCps = computed(() => {
  if (!autoCount.value || elapsedMs.value < 200) return 0
  return Math.round(autoCount.value / (elapsedMs.value / 1000))
})

let autoTimer = null
let countdownTimer = null
let tickTimer = null
let rippleId = 0
const ripples = ref([])

function addRipple() {
  const r = { id: ++rippleId, x: 15 + Math.random() * 70, y: 20 + Math.random() * 60 }
  ripples.value.push(r)
  if (ripples.value.length > 14) ripples.value.shift()
  setTimeout(() => { ripples.value = ripples.value.filter(x => x.id !== r.id) }, 420)
}

function nextDelay() {
  if (!jitter.value) return interval.value
  return Math.max(5, Math.round(interval.value * (0.7 + Math.random() * 0.6)))
}

function autoStep() {
  if (autoState.value !== 'running') return
  autoCount.value++
  addRipple()
  if (target.value > 0 && autoCount.value >= target.value) { stopAuto(); return }
  autoTimer = setTimeout(autoStep, nextDelay())
}

function startAuto() {
  autoCount.value = 0
  elapsedMs.value = 0
  ripples.value = []
  const begin = () => {
    autoState.value = 'running'
    startedAt.value = Date.now()
    tickTimer = setInterval(() => { elapsedMs.value = Date.now() - startedAt.value }, 100)
    autoStep()
  }
  if (startDelay.value > 0) {
    autoState.value = 'countdown'
    countdownNum.value = startDelay.value
    countdownTimer = setInterval(() => {
      countdownNum.value--
      if (countdownNum.value <= 0) { clearInterval(countdownTimer); countdownTimer = null; begin() }
    }, 1000)
  } else begin()
}

function stopAuto() {
  autoState.value = 'idle'
  if (autoTimer) { clearTimeout(autoTimer); autoTimer = null }
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }
  if (tickTimer) { clearInterval(tickTimer); tickTimer = null }
  if (startedAt.value) elapsedMs.value = Date.now() - startedAt.value
}

function manualPadTap() {
  if (autoState.value === 'running') stopAuto()
}

// ---------- 手速测试 ----------
const speedSeconds = ref(10)
const speedState = ref('idle') // idle | running | done
const speedCount = ref(0)
const speedLeft = ref(0)
const speedResult = ref(null)
const bestCps = ref(Number(localStorage.getItem('clicker_best_cps') || 0))
let speedTimer = null
let speedEndAt = 0

function startSpeed() {
  speedCount.value = 0
  speedResult.value = null
  speedLeft.value = speedSeconds.value
  speedState.value = 'running'
  speedEndAt = Date.now() + speedSeconds.value * 1000
  speedTimer = setInterval(() => {
    speedLeft.value = Math.max(0, Math.ceil((speedEndAt - Date.now()) / 1000))
    if (Date.now() >= speedEndAt) finishSpeed()
  }, 100)
}

function finishSpeed() {
  if (speedTimer) { clearInterval(speedTimer); speedTimer = null }
  speedState.value = 'done'
  const cps = Math.round((speedCount.value / speedSeconds.value) * 10) / 10
  speedResult.value = { total: speedCount.value, seconds: speedSeconds.value, cps }
  if (cps > bestCps.value) {
    bestCps.value = cps
    localStorage.setItem('clicker_best_cps', String(cps))
  }
}

function stopSpeed() {
  if (speedState.value === 'running') finishSpeed()
}

function speedTap() {
  if (speedState.value !== 'running') return
  speedCount.value++
  addRipple()
  if (navigator.vibrate) navigator.vibrate(3)
}

function switchMode(m) {
  stopAuto()
  if (speedTimer) { clearInterval(speedTimer); speedTimer = null }
  speedState.value = 'idle'
  ripples.value = []
  mode.value = m
}

onBeforeUnmount(() => {
  stopAuto()
  if (speedTimer) clearInterval(speedTimer)
})
</script>

<style scoped>
.clicker-tool { text-align: center; }
.seg { display: flex; background: var(--bg-muted); border-radius: 10px; padding: 3px; margin-bottom: 16px; }
.seg button { flex: 1; padding: 8px; border: none; background: transparent; border-radius: 8px; font-size: 0.875rem; color: var(--text-secondary); cursor: pointer; }
.seg button.active { background: var(--bg); color: var(--text-primary); font-weight: 500; box-shadow: 0 1px 4px var(--shadow); }

.pad {
  position: relative;
  overflow: hidden;
  min-height: 180px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--bg-raised);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 24px 12px;
  margin-bottom: 14px;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}
.pad.running { border-color: var(--accent); }
.pad-count { font-size: 3rem; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--accent); line-height: 1; }
.pad-big { font-size: 2.75rem; line-height: 1; }
.pad-hint { font-size: 0.8125rem; color: var(--text-tertiary); }
.ripple {
  position: absolute;
  width: 46px; height: 46px;
  border-radius: 50%;
  border: 2px solid var(--accent);
  transform: translate(-50%, -50%) scale(0.3);
  opacity: 0.7;
  animation: rip 0.42s ease-out forwards;
  pointer-events: none;
}
@keyframes rip { to { transform: translate(-50%, -50%) scale(1.5); opacity: 0; } }

.stat-row { display: flex; gap: 10px; margin-bottom: 16px; }
.stat { flex: 1; background: var(--bg-muted); border-radius: 10px; padding: 8px 4px; display: flex; flex-direction: column; gap: 2px; }
.stat-num { font-size: 1rem; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--text-primary); }
.stat-label { font-size: 0.6875rem; color: var(--text-tertiary); }

.form-field { text-align: left; margin-bottom: 14px; flex: 1; }
.form-field label { display: block; font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: 6px; }
.form-field input[type="number"], .form-field select {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-muted);
  color: var(--text-primary);
  font-size: 0.875rem;
  outline: none;
}
.form-field input[type="range"] { width: 100%; accent-color: var(--accent); }
.form-row { display: flex; gap: 12px; }

.chip-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.chip-row.center { justify-content: center; margin: 0 0 14px; }
.chip {
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--bg-muted);
  color: var(--text-secondary);
  font-size: 0.8125rem;
  cursor: pointer;
}
.chip.active { background: var(--accent); border-color: var(--accent); color: #fff; }
.chip:disabled, .form-field input:disabled, .form-field select:disabled { opacity: 0.5; }

.check-row { display: flex; align-items: center; gap: 8px; font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 16px; cursor: pointer; text-align: left; }
.check-row input { accent-color: var(--accent); width: 16px; height: 16px; }

.big-btn { width: 100%; padding: 12px 16px; font-size: 1rem; }
.btn-primary { border-radius: 8px; font-weight: 500; cursor: pointer; border: none; background: var(--accent); color: #fff; transition: opacity 0.15s; }
.btn-primary:hover { opacity: 0.85; }
.btn-danger { border-radius: 8px; font-weight: 500; cursor: pointer; border: none; background: #dc2626; color: #fff; transition: opacity 0.15s; }
.btn-danger:hover { opacity: 0.85; }
.note { font-size: 0.75rem; color: var(--text-tertiary); margin-top: 12px; line-height: 1.5; }
</style>
