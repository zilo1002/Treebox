<!-- DailyToolbox.vue -->
<template>
  <div class="daily-toolbox">
    <!-- 头部标签栏 -->
    <header class="dt-header">
      <nav class="dt-tabs">
        <button
          v-for="t in tabs"
          :key="t.key"
          class="dt-tab"
          :class="{ active: activeTab === t.key }"
          @click="activeTab = t.key"
        >
          {{ t.label }}
        </button>
        <button class="dt-tab-add" @click="showMore = !showMore">+</button>
        <button class="dt-tab-settings" @click="toggleSettings">⚙</button>
      </nav>
    </header>

    <!-- 面板区域 -->
    <main class="dt-body">
      <!-- ========== 计算器 ========== -->
      <section v-show="activeTab === 'calc'" class="dt-panel calc-panel">
        <!-- 显示区 -->
        <div class="calc-display-area">
          <div class="calc-history-row">
            <button class="calc-mode-toggle" @click="calcScientific = !calcScientific">
              <span v-if="calcScientific">🔄</span>
              <span v-else>📐</span>
            </button>
            <div class="calc-expression">{{ calcExpression }}</div>
          </div>
          <div class="calc-preview">{{ calcPreview }}</div>
        </div>

        <!-- 键盘 -->
        <div class="calc-keyboard" :class="{ scientific: calcScientific }">
          <!-- 科学键区 -->
          <div v-if="calcScientific" class="calc-sci-keys">
            <button class="calc-key sci" @click="calcSci('2nd')">2<sup>nd</sup></button>
            <button class="calc-key sci" @click="calcSci('(')">(</button>
            <button class="calc-key sci" @click="calcSci(')')">)</button>
            <button class="calc-key sci" @click="calcSci('10^x')">10<sup>x</sup></button>
            <button class="calc-key sci" @click="calcSci('1/x')">¹⁄ₓ</button>
            <button class="calc-key sci" @click="calcSci('x²')">x²</button>
            <button class="calc-key sci" @click="calcSci('x³')">x³</button>
            <button class="calc-key sci" @click="calcSci('x^y')">x<sup>y</sup></button>
            <button class="calc-key sci" @click="calcSci('x!')">x!</button>
            <button class="calc-key sci" @click="calcSci('√')">√</button>
            <button class="calc-key sci" @click="calcSci('∛x')">∛x</button>
            <button class="calc-key sci" @click="calcSci('lg')">lg</button>
            <button class="calc-key sci" @click="calcSci('sin')">sin</button>
            <button class="calc-key sci" @click="calcSci('cos')">cos</button>
            <button class="calc-key sci" @click="calcSci('tan')">tan</button>
            <button class="calc-key sci" @click="calcSci('ln')">ln</button>
            <button class="calc-key sci" @click="calcSci('sinh')">sinh</button>
            <button class="calc-key sci" @click="calcSci('cosh')">cosh</button>
            <button class="calc-key sci" @click="calcSci('tanh')">tanh</button>
            <button class="calc-key sci" @click="calcSci('e^x')">e<sup>x</sup></button>
            <button class="calc-key sci" @click="calcSci('Rad')">Rad</button>
            <button class="calc-key sci" @click="calcSci('π')">π</button>
            <button class="calc-key sci" @click="calcSci('EE')">EE</button>
            <button class="calc-key sci" @click="calcSci('Rand')">Rand</button>
          </div>

          <!-- 标准键区 -->
          <div class="calc-std-keys">
            <button class="calc-key mem" @click="calcMem('mc')">mc</button>
            <button class="calc-key mem" @click="calcMem('m+')">m+</button>
            <button class="calc-key mem" @click="calcMem('m-')">m−</button>
            <button class="calc-key mem" @click="calcMem('mr')">mr</button>

            <button class="calc-key red" @click="calcClear">AC</button>
            <button class="calc-key red" @click="calcBack">
              <svg width="20" height="16" viewBox="0 0 24 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 4H8l-6 6 6 6h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="14" y1="8" x2="10" y2="12"/><line x1="10" y1="8" x2="14" y2="12"/></svg>
            </button>
            <button class="calc-key red" @click="calcOp('±')">+⁄−</button>
            <button class="calc-key op" @click="calcOp('÷')">÷</button>

            <button class="calc-key" @click="calcNum('7')">7</button>
            <button class="calc-key" @click="calcNum('8')">8</button>
            <button class="calc-key" @click="calcNum('9')">9</button>
            <button class="calc-key op" @click="calcOp('×')">×</button>

            <button class="calc-key" @click="calcNum('4')">4</button>
            <button class="calc-key" @click="calcNum('5')">5</button>
            <button class="calc-key" @click="calcNum('6')">6</button>
            <button class="calc-key op" @click="calcOp('−')">−</button>

            <button class="calc-key" @click="calcNum('1')">1</button>
            <button class="calc-key" @click="calcNum('2')">2</button>
            <button class="calc-key" @click="calcNum('3')">3</button>
            <button class="calc-key op" @click="calcOp('+')">+</button>

            <button class="calc-key" @click="calcNum('%')">%</button>
            <button class="calc-key" @click="calcNum('0')">0</button>
            <button class="calc-key" @click="calcDot">.</button>
            <button class="calc-key eq" @click="calcEqual">=</button>
          </div>
        </div>
      </section>

      <!-- ========== 汇率 ========== -->
      <section v-show="activeTab === 'rate'" class="dt-panel rate-panel">
        <div class="rate-card">
          <!-- 源货币 -->
          <div class="rate-currency" @click="openCurrencyPicker('from')">
            <div class="rate-currency-info">
              <div class="rate-currency-name">{{ currencyName(rateFrom) }}</div>
              <div class="rate-currency-code">{{ rateFrom }}</div>
            </div>
            <div class="rate-currency-arrow">›</div>
          </div>
          <div class="rate-input-wrap">
            <input
              ref="rateInput"
              v-model="rateInputVal"
              class="rate-input"
              type="text"
              inputmode="decimal"
              readonly
            />
          </div>

          <div class="rate-divider"></div>

          <!-- 目标货币 -->
          <div class="rate-currency" @click="openCurrencyPicker('to')">
            <div class="rate-currency-info">
              <div class="rate-currency-name">{{ currencyName(rateTo) }}</div>
              <div class="rate-currency-code">{{ rateTo }}</div>
            </div>
            <div class="rate-currency-arrow">›</div>
          </div>
          <div class="rate-result-wrap">
            <div class="rate-result">{{ rateResult }}</div>
          </div>

          <div class="rate-footer">
            Data source: xCurrency. Last updated: {{ rateUpdated }}
          </div>
        </div>

        <!-- 汇率数字键盘 -->
        <div class="rate-keyboard">
          <button class="rate-key red" @click="rateClear">AC</button>
          <button class="rate-key red" @click="rateBack">
            <svg width="20" height="16" viewBox="0 0 24 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 4H8l-6 6 6 6h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="14" y1="8" x2="10" y2="12"/><line x1="10" y1="8" x2="14" y2="12"/></svg>
          </button>
          <button class="rate-key op" @click="rateOp('×')">×</button>
          <button class="rate-key op" @click="rateOp('÷')">÷</button>

          <button class="rate-key" @click="rateNum('7')">7</button>
          <button class="rate-key" @click="rateNum('8')">8</button>
          <button class="rate-key" @click="rateNum('9')">9</button>
          <button class="rate-key op" @click="rateOp('−')">−</button>

          <button class="rate-key" @click="rateNum('4')">4</button>
          <button class="rate-key" @click="rateNum('5')">5</button>
          <button class="rate-key" @click="rateNum('6')">6</button>
          <button class="rate-key op" @click="rateOp('+')">+</button>

          <button class="rate-key" @click="rateNum('1')">1</button>
          <button class="rate-key" @click="rateNum('2')">2</button>
          <button class="rate-key" @click="rateNum('3')">3</button>
          <button class="rate-key eq" @click="rateEqual">=</button>

          <button class="rate-key" @click="rateNum('00')">00</button>
          <button class="rate-key" @click="rateNum('0')">0</button>
          <button class="rate-key" @click="rateDot">.</button>
        </div>
      </section>

      <!-- ========== 生日星座 ========== -->
      <section v-show="activeTab === 'astro'" class="dt-panel astro-panel">
        <div class="dt-card">
          <h3>🎂 选择出生日期</h3>
          <input type="date" class="astro-input" v-model="birthDate" />
          <div class="astro-result">
            <div class="astro-sign">{{ zodiacInfo.sign }}</div>
            <div class="astro-name">{{ zodiacInfo.name }}</div>
            <div class="astro-date">{{ zodiacInfo.range }}</div>
          </div>
        </div>
        <div class="dt-card lunar-card">
          <div class="lunar-row">
            <div class="label">农历日期</div>
            <div class="value">{{ lunarInfo.date }}</div>
          </div>
          <div class="lunar-row">
            <div class="label">生肖 / 干支</div>
            <div class="value">{{ lunarInfo.zodiac }}</div>
          </div>
        </div>
      </section>

      <!-- ========== 进制转换 ========== -->
      <section v-show="activeTab === 'base'" class="dt-panel base-panel">
        <div class="dt-card">
          <h3>🔢 进制转换</h3>
          <div class="base-row">
            <select v-model="baseFrom">
              <option value="10">十进制</option>
              <option value="2">二进制</option>
              <option value="8">八进制</option>
              <option value="16">十六进制</option>
            </select>
            <input type="text" v-model="baseInput" placeholder="输入数值" />
          </div>
          <div class="base-result">
            <div>二进制：{{ baseResults.bin }}</div>
            <div>八进制：{{ baseResults.oct }}</div>
            <div>十进制：{{ baseResults.dec }}</div>
            <div>十六进制：{{ baseResults.hex }}</div>
          </div>
        </div>
      </section>

      <!-- ========== 颜色编码 ========== -->
      <section v-show="activeTab === 'color'" class="dt-panel color-panel">
        <div class="color-preview" :style="{ background: previewColor }">
          <span :style="{ color: previewTextColor }">{{ previewColor.toUpperCase() }}</span>
        </div>
        <div class="dt-card">
          <h3>🎨 颜色编码转换</h3>
          <div class="color-row">
            <label>HEX</label>
            <input v-model="colorHex" @input="syncColor('hex')" placeholder="#RRGGBB" />
          </div>
          <div class="color-row">
            <label>RGB</label>
            <input v-model="colorRgb" @input="syncColor('rgb')" placeholder="rgb(r, g, b)" />
          </div>
          <div class="color-row">
            <label>HSL</label>
            <input v-model="colorHsl" @input="syncColor('hsl')" placeholder="hsl(h, s%, l%)" />
          </div>
        </div>
      </section>
    </main>

    <!-- 货币选择弹窗 -->
    <div v-if="currencyPickerOpen" class="currency-picker-overlay" @click.self="currencyPickerOpen = false">
      <div class="currency-picker">
        <div class="currency-picker-header">
          <span>选择货币</span>
          <button @click="currencyPickerOpen = false">✕</button>
        </div>
        <div class="currency-picker-list">
          <div
            v-for="c in currencies"
            :key="c.code"
            class="currency-picker-item"
            :class="{ active: (pickerTarget === 'from' ? rateFrom : rateTo) === c.code }"
            @click="pickCurrency(c.code)"
          >
            <span class="currency-picker-name">{{ c.name }}</span>
            <span class="currency-picker-code">{{ c.code }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

/* ===== Tabs ===== */
const tabs = [
  { key: 'calc', label: 'Calculate' },
  { key: 'rate', label: 'Exchange' },
  { key: 'astro', label: 'Birth' },
  { key: 'base', label: 'Base' },
  { key: 'color', label: 'Color' },
]
const activeTab = ref('calc')
const showMore = ref(false)
const calcScientific = ref(false)

function toggleSettings() {
  alert('设置功能开发中')
}

/* ===== 1. 计算器 ===== */
const calcExpression = ref('')
const calcPreview = ref('0')
let calcPrev = ''
let calcOperator = ''
let calcReset = false
let calcMemory = 0

function calcNum(n) {
  if (calcReset) { calcExpression.value = ''; calcReset = false }
  if (calcExpression.value === '0' && n !== '.') calcExpression.value = ''
  calcExpression.value += n
  calcUpdatePreview()
}
function calcDot() {
  if (calcReset) { calcExpression.value = '0'; calcReset = false }
  const parts = calcExpression.value.split(/[\+\−\×\÷]/)
  const last = parts[parts.length - 1]
  if (!last.includes('.')) calcExpression.value += '.'
  calcUpdatePreview()
}
function calcClear() {
  calcExpression.value = ''
  calcPreview.value = '0'
  calcPrev = ''
  calcOperator = ''
}
function calcBack() {
  if (calcExpression.value.length > 0) {
    calcExpression.value = calcExpression.value.slice(0, -1)
  }
  calcUpdatePreview()
}
function calcOp(op) {
  if (calcExpression.value === '') return
  // 替换末尾运算符
  const lastChar = calcExpression.value.slice(-1)
  if ('+−×÷'.includes(lastChar)) {
    calcExpression.value = calcExpression.value.slice(0, -1) + op
  } else {
    calcExpression.value += op
  }
  calcReset = false
  calcUpdatePreview()
}
function calcEqual() {
  if (!calcExpression.value) return
  try {
    const expr = calcExpression.value
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
    // eslint-disable-next-line no-eval
    const result = eval(expr)
    calcPreview.value = String(Number(result.toFixed(8)))
    calcExpression.value = calcPreview.value
    calcReset = true
  } catch {
    calcPreview.value = 'Error'
  }
}
function calcMem(cmd) {
  const current = parseFloat(calcPreview.value) || 0
  switch (cmd) {
    case 'mc': calcMemory = 0; break
    case 'm+': calcMemory += current; break
    case 'm-': calcMemory -= current; break
    case 'mr':
      calcExpression.value = String(calcMemory)
      calcReset = true
      calcUpdatePreview()
      break
  }
}
function calcSci(fn) {
  const val = parseFloat(calcPreview.value) || 0
  let r = 0
  const rad = val * Math.PI / 180
  switch (fn) {
    case 'sin': r = Math.sin(rad); break
    case 'cos': r = Math.cos(rad); break
    case 'tan': r = Math.tan(rad); break
    case 'sinh': r = Math.sinh(val); break
    case 'cosh': r = Math.cosh(val); break
    case 'tanh': r = Math.tanh(val); break
    case 'ln': r = Math.log(val); break
    case 'lg': r = Math.log10(val); break
    case '√': r = Math.sqrt(val); break
    case '∛x': r = Math.cbrt(val); break
    case 'x²': r = val * val; break
    case 'x³': r = val * val * val; break
    case '1/x': r = 1 / val; break
    case 'x!': r = factorial(val); break
    case 'π': r = Math.PI; break
    case 'e^x': r = Math.exp(val); break
    case '10^x': r = Math.pow(10, val); break
    case 'Rand': r = Math.random(); break
    case 'EE': r = val * Math.pow(10, Math.floor(Math.random() * 10)); break
    case 'Rad': r = val; break // toggle handled separately
    case '2nd': return
    case '(': calcExpression.value += '('; calcUpdatePreview(); return
    case ')': calcExpression.value += ')'; calcUpdatePreview(); return
    default: return
  }
  calcPreview.value = String(Number(r.toFixed(8)))
  calcExpression.value = calcPreview.value
  calcReset = true
}
function factorial(n) {
  if (n < 0) return NaN
  if (n === 0 || n === 1) return 1
  let res = 1
  for (let i = 2; i <= n; i++) res *= i
  return res
}
function calcUpdatePreview() {
  if (!calcExpression.value) {
    calcPreview.value = '0'
    return
  }
  try {
    const expr = calcExpression.value
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
    // eslint-disable-next-line no-eval
    const result = eval(expr)
    calcPreview.value = String(Number(result.toFixed(8)))
  } catch {
    // keep previous preview
  }
}

function onKey(e) {
  if (activeTab.value !== 'calc') return
  const k = e.key
  if (/[0-9]/.test(k)) calcNum(k)
  else if (k === '.') calcDot()
  else if (k === '+' || k === '-') calcOp(k === '-' ? '−' : '+')
  else if (k === '*') calcOp('×')
  else if (k === '/') { e.preventDefault(); calcOp('÷') }
  else if (k === '%') calcNum('%')
  else if (k === 'Enter' || k === '=') calcEqual()
  else if (k === 'Backspace') calcBack()
  else if (k === 'Escape') calcClear()
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))

/* ===== 2. 汇率 ===== */
const currencies = [
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'HKD', symbol: '$', name: 'Hong Kong Dollar' },
  { code: 'TWD', symbol: 'NT$', name: 'New Taiwan Dollar' },
]
const rateFrom = ref('HKD')
const rateTo = ref('CNY')
const rateInputVal = ref('935')
const rateExpression = ref('935')
const rateUpdated = ref('Aug 20, 2026 00:15:58')
const rates = { CNY: 1, USD: 7.20, EUR: 7.85, JPY: 0.048, GBP: 9.15, KRW: 0.0052, HKD: 0.92, TWD: 0.22 }

const rateResult = computed(() => {
  const val = parseFloat(rateInputVal.value)
  if (isNaN(val)) return '-'
  const cny = val * rates[rateFrom.value]
  const result = cny / rates[rateTo.value]
  return Number(result.toFixed(4))
})

function currencyName(code) {
  const c = currencies.find(x => x.code === code)
  return c ? c.name : code
}

const currencyPickerOpen = ref(false)
const pickerTarget = ref('from')
function openCurrencyPicker(target) {
  pickerTarget.value = target
  currencyPickerOpen.value = true
}
function pickCurrency(code) {
  if (pickerTarget.value === 'from') rateFrom.value = code
  else rateTo.value = code
  currencyPickerOpen.value = false
}

function rateNum(n) {
  if (rateInputVal.value === '0' && n !== '.') rateInputVal.value = ''
  rateInputVal.value += n
}
function rateDot() {
  if (!rateInputVal.value.includes('.')) rateInputVal.value += '.'
}
function rateClear() {
  rateInputVal.value = '0'
}
function rateBack() {
  if (rateInputVal.value.length > 1) rateInputVal.value = rateInputVal.value.slice(0, -1)
  else rateInputVal.value = '0'
}
function rateOp(op) {
  // 汇率键盘的运算符仅做表达式拼接，最终按=计算
  rateExpression.value = rateInputVal.value + ' ' + op + ' '
}
function rateEqual() {
  try {
    const expr = rateExpression.value + rateInputVal.value
    // eslint-disable-next-line no-eval
    const result = eval(expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-'))
    rateInputVal.value = String(Number(result.toFixed(8)))
    rateExpression.value = ''
  } catch {
    // ignore
  }
}

/* ===== 3. 生日星座 + 农历 ===== */
const birthDate = ref('2000-01-01')

const zodiacList = [
  { name: '摩羯座', sign: '♑', range: '12.22 - 01.19' },
  { name: '水瓶座', sign: '♒', range: '01.20 - 02.18' },
  { name: '双鱼座', sign: '♓', range: '02.19 - 03.20' },
  { name: '白羊座', sign: '♈', range: '03.21 - 04.19' },
  { name: '金牛座', sign: '♉', range: '04.20 - 05.20' },
  { name: '双子座', sign: '♊', range: '05.21 - 06.21' },
  { name: '巨蟹座', sign: '♋', range: '06.22 - 07.22' },
  { name: '狮子座', sign: '♌', range: '07.23 - 08.22' },
  { name: '处女座', sign: '♍', range: '08.23 - 09.22' },
  { name: '天秤座', sign: '♎', range: '09.23 - 10.23' },
  { name: '天蝎座', sign: '♏', range: '10.24 - 11.22' },
  { name: '射手座', sign: '♐', range: '11.23 - 12.21' },
]
const animals = ['猴','鸡','狗','猪','鼠','牛','虎','兔','龙','蛇','马','羊']
const gan = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']
const zhi = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']
const lunarMonths = ['正','二','三','四','五','六','七','八','九','十','冬','腊']
const lunarDays = ['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十',
  '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
  '廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十']
const lunarInfoData = [
  0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
  0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
  0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
  0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
  0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
  0x06ca0,0x0b550,0x15355,0x04da0,0x0a5d0,0x14573,0x052d0,0x0a9a8,0x0e950,0x06aa0,
  0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,
  0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b5a0,0x195a6,
  0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,
  0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x055c0,0x0ab60,0x096d5,0x092e0,
  0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,
  0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,
  0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,
  0x05aa0,0x076a3,0x096d0,0x04bd7,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,
  0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0
]

function lYearDays(y) {
  let sum = 348
  for (let i = 0x8000; i > 0x8; i >>= 1) sum += (lunarInfoData[y - 1900] & i) ? 1 : 0
  return sum + leapDays(y)
}
function leapDays(y) {
  if (leapMonth(y)) return (lunarInfoData[y - 1900] & 0x10000) ? 30 : 29
  return 0
}
function leapMonth(y) { return lunarInfoData[y - 1900] & 0xf }
function monthDays(y, m) {
  return (lunarInfoData[y - 1900] & (0x10000 >> m)) ? 30 : 29
}
function toLunar(date) {
  let y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate()
  if (y < 1900 || y > 2100) return null
  let offset = (Date.UTC(y, m - 1, d) - Date.UTC(1900, 0, 31)) / 86400000
  let ly = 1900, lm, ld, leap = false
  for (; ly < 2101 && offset > 0; ly++) {
    const days = lYearDays(ly)
    offset -= days
  }
  if (offset < 0) offset += lYearDays(--ly)
  const leapM = leapMonth(ly)
  for (lm = 1; lm < 13 && offset > 0; lm++) {
    if (leapM > 0 && lm === leapM + 1 && !leap) { --lm; leap = true }
    const days = leap ? leapDays(ly) : monthDays(ly, lm)
    offset -= days
    if (leap && lm === leapM + 1) leap = false
  }
  if (offset === 0 && leapM > 0 && lm === leapM + 1) {
    if (leap) leap = false; else { leap = true; --lm }
  }
  if (offset < 0) offset += leap ? leapDays(ly) : monthDays(ly, --lm)
  ld = offset + 1
  return {
    year: ly, month: lm, day: Math.floor(ld), leap,
    animal: animals[ly % 12],
    ganZhi: gan[(ly - 4) % 10] + zhi[(ly - 4) % 12]
  }
}
function getZodiac(date) {
  const m = date.getMonth() + 1, d = date.getDate()
  const day = m * 100 + d
  if (day >= 1222 || day <= 119) return zodiacList[0]
  if (day <= 218) return zodiacList[1]
  if (day <= 320) return zodiacList[2]
  if (day <= 419) return zodiacList[3]
  if (day <= 520) return zodiacList[4]
  if (day <= 621) return zodiacList[5]
  if (day <= 722) return zodiacList[6]
  if (day <= 822) return zodiacList[7]
  if (day <= 922) return zodiacList[8]
  if (day <= 1023) return zodiacList[9]
  if (day <= 1122) return zodiacList[10]
  return zodiacList[11]
}

const zodiacInfo = computed(() => {
  if (!birthDate.value) return zodiacList[0]
  return getZodiac(new Date(birthDate.value + 'T00:00:00'))
})
const lunarInfo = computed(() => {
  if (!birthDate.value) return { date: '-', zodiac: '-' }
  const lunar = toLunar(new Date(birthDate.value + 'T00:00:00'))
  if (!lunar) return { date: '超出支持范围', zodiac: '-' }
  return {
    date: lunar.year + '年 ' + lunarMonths[lunar.month - 1] + '月' + lunarDays[lunar.day - 1] + (lunar.leap ? ' (闰月)' : ''),
    zodiac: '🐕' + lunar.animal + '年 · ' + lunar.ganZhi + '年'
  }
})

/* ===== 4. 进制 ===== */
const baseFrom = ref('10')
const baseInput = ref('255')
const baseResults = computed(() => {
  let dec
  try { dec = parseInt(baseInput.value.trim(), parseInt(baseFrom.value)) } catch (e) { dec = NaN }
  if (isNaN(dec)) return { bin: '-', oct: '-', dec: '-', hex: '-' }
  return {
    bin: dec.toString(2).toUpperCase(),
    oct: dec.toString(8).toUpperCase(),
    dec: dec.toString(10),
    hex: dec.toString(16).toUpperCase(),
  }
})

/* ===== 5. 颜色 ===== */
const colorHex = ref('#007AFF')
const colorRgb = ref('rgb(0, 122, 255)')
const colorHsl = ref('hsl(211, 100%, 50%)')
const previewColor = ref('#007AFF')
const previewTextColor = ref('#fff')

function hexToRgb(hex) {
  const m = hex.replace('#', '').match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
  if (!m) return null
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
}
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2
  if (max === min) { h = s = 0 }
  else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}
function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100
  let r, g, b
  if (s === 0) { r = g = b = l }
  else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1; if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }
}
function colorUpdatePreview(hex) {
  previewColor.value = hex
  const rgb = hexToRgb(hex)
  if (rgb) {
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000
    previewTextColor.value = brightness > 128 ? '#000' : '#fff'
  }
}
function syncColor(source) {
  let r, g, b
  if (source === 'hex') {
    const rgb = hexToRgb(colorHex.value)
    if (!rgb) return
    r = rgb.r; g = rgb.g; b = rgb.b
    colorRgb.value = 'rgb(' + r + ', ' + g + ', ' + b + ')'
    const hsl = rgbToHsl(r, g, b)
    colorHsl.value = 'hsl(' + hsl.h + ', ' + hsl.s + '%, ' + hsl.l + '%)'
    colorUpdatePreview(colorHex.value)
  } else if (source === 'rgb') {
    const m = colorRgb.value.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/)
    if (!m) return
    r = +m[1]; g = +m[2]; b = +m[3]
    const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
    colorHex.value = hex
    const hsl = rgbToHsl(r, g, b)
    colorHsl.value = 'hsl(' + hsl.h + ', ' + hsl.s + '%, ' + hsl.l + '%)'
    colorUpdatePreview(hex)
  } else if (source === 'hsl') {
    const m = colorHsl.value.match(/(\d+(?:\.\d+)?)[,\s]+(\d+(?:\.\d+)?)%?[,\s]+(\d+(?:\.\d+)?)%?/)
    if (!m) return
    const rgb = hslToRgb(+m[1], +m[2], +m[3])
    r = rgb.r; g = rgb.g; b = rgb.b
    const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
    colorHex.value = hex
    colorRgb.value = 'rgb(' + r + ', ' + g + ', ' + b + ')'
    colorUpdatePreview(hex)
  }
}
</script>

<style scoped>
/* ========== 外层容器 ========== */
.daily-toolbox {
  width: 100%;
  max-width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* ========== 头部 ========== */
.dt-header {
  flex-shrink: 0;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  padding: 8px 16px 0;
}
.dt-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
}
.dt-tabs::-webkit-scrollbar { display: none; }
.dt-tab {
  flex-shrink: 0;
  padding: 8px 14px;
  font-size: 18px;
  font-weight: 500;
  color: #bbb;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  transition: all .2s;
  font-family: inherit;
}
.dt-tab.active {
  color: #000;
  border-bottom-color: #e74c3c;
}
.dt-tab-add,
.dt-tab-settings {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #f5f5f5;
  color: #333;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
}
.dt-tab-settings {
  margin-left: 4px;
  font-size: 16px;
}

/* ========== 面板区域 ========== */
.dt-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
}
.dt-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* ========== 通用卡片 ========== */
.dt-card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  margin: 12px 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.dt-card h3 {
  font-size: 14px;
  color: #333;
  margin-bottom: 12px;
  font-weight: 600;
}

/* ========== 计算器 ========== */
.calc-panel {
  background: #fff;
}
.calc-display-area {
  flex-shrink: 0;
  padding: 20px 20px 12px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-end;
  min-height: 120px;
}
.calc-history-row {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 12px;
}
.calc-mode-toggle {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid #e5e5e5;
  background: #fff;
  font-size: 18px;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.calc-expression {
  flex: 1;
  font-size: 36px;
  font-weight: 400;
  color: #333;
  text-align: right;
  word-break: break-all;
  line-height: 1.2;
  letter-spacing: 1px;
}
.calc-expression:empty::before {
  content: '0';
  color: #333;
}
.calc-preview {
  font-size: 24px;
  color: #bbb;
  margin-top: 8px;
  text-align: right;
  min-height: 32px;
}

/* 键盘 */
.calc-keyboard {
  flex: 1;
  display: flex;
  padding: 8px 12px 16px;
  gap: 8px;
  min-height: 0;
}
.calc-keyboard.scientific {
  flex-direction: row;
}

.calc-sci-keys {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  flex: 1;
  padding-right: 8px;
}
.calc-std-keys {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  flex: 1;
  max-width: 400px;
  margin: 0 auto;
  width: 100%;
}

.calc-key {
  border: none;
  background: #f0f0f0;
  color: #333;
  font-size: 22px;
  font-weight: 400;
  border-radius: 50%;
  aspect-ratio: 1 / 1;
  cursor: pointer;
  transition: background .1s, transform .05s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  padding: 0;
}
.calc-key:active {
  background: #ddd;
  transform: scale(0.96);
}
.calc-key.mem {
  font-size: 16px;
  color: #999;
  background: transparent;
}
.calc-key.mem:active { background: #f0f0f0; }
.calc-key.red {
  color: #e74c3c;
  background: transparent;
  font-size: 20px;
}
.calc-key.red:active { background: #ffeaea; }
.calc-key.op {
  color: #e74c3c;
  background: #fff0f0;
  font-size: 26px;
}
.calc-key.op:active { background: #ffdada; }
.calc-key.eq {
  background: #e74c3c;
  color: #fff;
  border-radius: 16px;
  font-size: 28px;
  font-weight: 500;
}
.calc-key.eq:active { background: #c0392b; }
.calc-key.sci {
  font-size: 14px;
  color: #666;
  background: #f7f7f7;
  border-radius: 12px;
}
.calc-key.sci:active { background: #e0e0e0; }

/* ========== 汇率 ========== */
.rate-panel {
  background: #f8f8f8;
}
.rate-card {
  background: #fff;
  border-radius: 16px;
  margin: 12px 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}
.rate-currency {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 4px 0;
}
.rate-currency-info {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.rate-currency-name {
  font-size: 22px;
  font-weight: 500;
  color: #333;
  letter-spacing: 0.5px;
}
.rate-currency-code {
  font-size: 18px;
  color: #bbb;
  font-weight: 300;
}
.rate-currency-arrow {
  font-size: 22px;
  color: #ccc;
}
.rate-input-wrap,
.rate-result-wrap {
  text-align: right;
  margin-top: 4px;
}
.rate-input {
  width: 100%;
  border: none;
  outline: none;
  font-size: 42px;
  font-weight: 400;
  color: #333;
  text-align: right;
  background: transparent;
  font-family: inherit;
  caret-color: #e74c3c;
}
.rate-result {
  font-size: 36px;
  font-weight: 400;
  color: #333;
  text-align: right;
  line-height: 1.3;
}
.rate-divider {
  height: 1px;
  background: #eee;
  margin: 16px 0;
}
.rate-footer {
  font-size: 11px;
  color: #ccc;
  text-align: center;
  margin-top: 20px;
}

/* 汇率键盘 */
.rate-keyboard {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 8px 12px 16px;
  margin-top: auto;
}
.rate-key {
  border: none;
  background: #f0f0f0;
  color: #333;
  font-size: 22px;
  font-weight: 400;
  border-radius: 50%;
  aspect-ratio: 1 / 1;
  cursor: pointer;
  transition: background .1s, transform .05s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  padding: 0;
}
.rate-key:active {
  background: #ddd;
  transform: scale(0.96);
}
.rate-key.red {
  color: #e74c3c;
  background: transparent;
  font-size: 20px;
}
.rate-key.red:active { background: #ffeaea; }
.rate-key.op {
  color: #e74c3c;
  background: #fff0f0;
  font-size: 26px;
}
.rate-key.op:active { background: #ffdada; }
.rate-key.eq {
  background: #e74c3c;
  color: #fff;
  border-radius: 16px;
  font-size: 28px;
  font-weight: 500;
}
.rate-key.eq:active { background: #c0392b; }

/* 货币选择弹窗 */
.currency-picker-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.3);
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.currency-picker {
  width: 100%;
  max-width: 420px;
  max-height: 70vh;
  background: #fff;
  border-radius: 20px 20px 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.currency-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid #f0f0f0;
}
.currency-picker-header button {
  background: none;
  border: none;
  font-size: 18px;
  color: #999;
  cursor: pointer;
}
.currency-picker-list {
  overflow-y: auto;
  flex: 1;
}
.currency-picker-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  cursor: pointer;
  transition: background .15s;
}
.currency-picker-item:active {
  background: #f5f5f5;
}
.currency-picker-item.active {
  background: #fff0f0;
}
.currency-picker-item.active .currency-picker-code {
  color: #e74c3c;
}
.currency-picker-name {
  font-size: 16px;
  color: #333;
}
.currency-picker-code {
  font-size: 14px;
  color: #bbb;
  font-weight: 500;
}

/* ========== 生日星座 ========== */
.astro-panel {
  padding-bottom: 20px;
}
.astro-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 12px;
  font-size: 14px;
  margin-bottom: 12px;
  outline: none;
  font-family: inherit;
}
.astro-result {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 20px;
  border-radius: 16px;
  text-align: center;
}
.astro-sign { font-size: 36px; margin-bottom: 6px; }
.astro-name { font-size: 18px; font-weight: 600; }
.astro-date { font-size: 13px; opacity: 0.9; margin-top: 6px; }
.lunar-card { text-align: center; }
.lunar-row { margin-bottom: 12px; }
.lunar-row:last-child { margin-bottom: 0; }
.lunar-row .label { font-size: 12px; color: #999; margin-bottom: 4px; }
.lunar-row .value { font-size: 18px; font-weight: 600; color: #333; }

/* ========== 进制 ========== */
.base-panel {
  padding-bottom: 20px;
}
.base-row {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
  align-items: center;
}
.base-row select {
  width: 100px;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 12px;
  background: #f9f9f9;
  font-size: 14px;
  font-family: inherit;
  outline: none;
}
.base-row input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #eee;
  border-radius: 12px;
  font-size: 14px;
  font-family: monospace;
  outline: none;
}
.base-result {
  background: #34c759;
  color: #fff;
  padding: 14px;
  border-radius: 12px;
  font-family: monospace;
  font-size: 14px;
}
.base-result div { margin-bottom: 6px; }
.base-result div:last-child { margin-bottom: 0; }

/* ========== 颜色 ========== */
.color-panel {
  padding-bottom: 20px;
}
.color-preview {
  width: calc(100% - 32px);
  height: 120px;
  border-radius: 16px;
  margin: 12px 16px 0;
  transition: background .3s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  text-shadow: 0 1px 3px rgba(0,0,0,0.4);
}
.color-row { margin-bottom: 12px; }
.color-row label { display: block; font-size: 12px; color: #666; margin-bottom: 4px; }
.color-row input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #eee;
  border-radius: 12px;
  font-size: 14px;
  font-family: monospace;
  outline: none;
}
</style>

/* ========== 响应式：手机端隐藏科学计算器 ========== */
@media (max-width: 767px) {
  .calc-mode-toggle,
  .calc-sci-keys {
    display: none !important;
  }
  .calc-keyboard.scientific {
    flex-direction: column;
  }
  .calc-std-keys {
    max-width: 100%;
  }
}
