<template>
  <div class="daily-toolbox">
    <!-- 标签栏 -->
    <div class="tabs">
      <div
        v-for="t in tabs"
        :key="t.key"
        class="tab"
        :class="{ active: activeTab === t.key }"
        @click="activeTab = t.key"
      >
        {{ t.icon }} {{ t.label }}
      </div>
    </div>

    <!-- 1. 计算器 -->
    <div v-if="activeTab === 'calc'" class="panel">
      <div class="calc-display">{{ calcDisplay }}</div>
      <div class="calc-keys">
        <button class="calc-btn fn" @click="calcClear">AC</button>
        <button class="calc-btn fn" @click="calcBack">←</button>
        <button class="calc-btn fn" @click="calcOp('%')">%</button>
        <button class="calc-btn op" @click="calcOp('÷')">÷</button>

        <button class="calc-btn" @click="calcNum('7')">7</button>
        <button class="calc-btn" @click="calcNum('8')">8</button>
        <button class="calc-btn" @click="calcNum('9')">9</button>
        <button class="calc-btn op" @click="calcOp('×')">×</button>

        <button class="calc-btn" @click="calcNum('4')">4</button>
        <button class="calc-btn" @click="calcNum('5')">5</button>
        <button class="calc-btn" @click="calcNum('6')">6</button>
        <button class="calc-btn op" @click="calcOp('-')">−</button>

        <button class="calc-btn" @click="calcNum('1')">1</button>
        <button class="calc-btn" @click="calcNum('2')">2</button>
        <button class="calc-btn" @click="calcNum('3')">3</button>
        <button class="calc-btn op" @click="calcOp('+')">+</button>

        <button class="calc-btn zero" @click="calcNum('0')">0</button>
        <button class="calc-btn" @click="calcDot">.</button>
        <button class="calc-btn op" @click="calcEqual">=</button>
      </div>
    </div>

    <!-- 2. 汇率 -->
    <div v-if="activeTab === 'rate'" class="panel">
      <div class="card">
        <h3>💱 汇率换算</h3>
        <div class="rate-row">
          <input type="number" v-model.number="rateAmount" placeholder="金额" />
          <select v-model="rateFrom">
            <option v-for="c in currencies" :key="c.code" :value="c.code">{{ c.code }} {{ c.symbol }}</option>
          </select>
        </div>
        <div class="rate-swap-wrap">
          <button class="rate-swap" @click="swapRate">⇅</button>
        </div>
        <div class="rate-row">
          <select v-model="rateTo">
            <option v-for="c in currencies" :key="c.code" :value="c.code">{{ c.code }} {{ c.symbol }}</option>
          </select>
        </div>
        <div class="rate-result">{{ rateAmount }} {{ rateFrom }} ≈ {{ rateResult }} {{ rateTo }}</div>
        <div class="rate-hint">汇率仅供参考 · 以实时数据为准</div>
      </div>
    </div>

    <!-- 3. 生日星座 -->
    <div v-if="activeTab === 'astro'" class="panel">
      <div class="card">
        <h3>🎂 选择出生日期</h3>
        <input type="date" class="astro-input" v-model="birthDate" />
        <div class="astro-result">
          <div class="astro-sign">{{ zodiacInfo.sign }}</div>
          <div class="astro-name">{{ zodiacInfo.name }}</div>
          <div class="astro-date">{{ zodiacInfo.range }}</div>
        </div>
      </div>
      <div class="card lunar-card">
        <div class="lunar-row">
          <div class="label">农历日期</div>
          <div class="value">{{ lunarInfo.date }}</div>
        </div>
        <div class="lunar-row">
          <div class="label">生肖 / 干支</div>
          <div class="value">{{ lunarInfo.zodiac }}</div>
        </div>
      </div>
    </div>

    <!-- 4. 进制转换 -->
    <div v-if="activeTab === 'base'" class="panel">
      <div class="card">
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
    </div>

    <!-- 5. 颜色编码 -->
    <div v-if="activeTab === 'color'" class="panel">
      <div class="color-preview" :style="{ background: previewColor }">
        <span :style="{ color: previewTextColor }">{{ previewColor.toUpperCase() }}</span>
      </div>
      <div class="card">
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
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

/* ===== Tabs ===== */
const tabs = [
  { key: 'calc', label: '计算器', icon: '🧮' },
  { key: 'rate', label: '汇率', icon: '💱' },
  { key: 'astro', label: '生日', icon: '🎂' },
  { key: 'base', label: '进制', icon: '🔢' },
  { key: 'color', label: '颜色', icon: '🎨' },
]
const activeTab = ref('calc')

/* ===== 1. 计算器 ===== */
const calcDisplay = ref('0')
let calcPrev = ''
let calcOp = ''
let calcReset = false

function calcNum(n) {
  if (calcReset) { calcDisplay.value = ''; calcReset = false }
  if (calcDisplay.value === '0') calcDisplay.value = ''
  calcDisplay.value += n
}
function calcDot() {
  if (calcReset) { calcDisplay.value = '0'; calcReset = false }
  if (!calcDisplay.value.includes('.')) calcDisplay.value += '.'
}
function calcClear() {
  calcDisplay.value = '0'
  calcPrev = ''
  calcOp = ''
}
function calcBack() {
  if (calcDisplay.value.length > 1) calcDisplay.value = calcDisplay.value.slice(0, -1)
  else calcDisplay.value = '0'
}
function calcOpFn(op) {
  calcPrev = calcDisplay.value
  calcOp = op
  calcReset = true
}
function calcEqual() {
  if (!calcOp || !calcPrev) return
  const a = parseFloat(calcPrev)
  const b = parseFloat(calcDisplay.value)
  let r = 0
  switch (calcOp) {
    case '+': r = a + b; break
    case '-': r = a - b; break
    case '×': r = a * b; break
    case '÷': r = b === 0 ? NaN : a / b; break
    case '%': r = a % b; break
  }
  calcDisplay.value = String(Number(r.toFixed(8)))
  calcOp = ''
  calcPrev = ''
  calcReset = true
}

function onKey(e) {
  const k = e.key
  if (/[0-9]/.test(k)) calcNum(k)
  else if (k === '.') calcDot()
  else if (k === '+' || k === '-') calcOpFn(k)
  else if (k === '*') calcOpFn('×')
  else if (k === '/') { e.preventDefault(); calcOpFn('÷') }
  else if (k === '%') calcOpFn('%')
  else if (k === 'Enter' || k === '=') calcEqual()
  else if (k === 'Backspace') calcBack()
  else if (k === 'Escape') calcClear()
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))

/* ===== 2. 汇率 ===== */
const currencies = [
  { code: 'CNY', symbol: '¥' },
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'JPY', symbol: '¥' },
  { code: 'GBP', symbol: '£' },
  { code: 'KRW', symbol: '₩' },
  { code: 'HKD', symbol: '$' },
  { code: 'TWD', symbol: 'NT$' },
]
const rateAmount = ref(100)
const rateFrom = ref('USD')
const rateTo = ref('CNY')
const rates = { CNY: 1, USD: 7.20, EUR: 7.85, JPY: 0.048, GBP: 9.15, KRW: 0.0052, HKD: 0.92, TWD: 0.22 }
const rateResult = computed(() => {
  const cny = rateAmount.value * rates[rateFrom.value]
  return (cny / rates[rateTo.value]).toFixed(2)
})
function swapRate() {
  const tmp = rateFrom.value; rateFrom.value = rateTo.value; rateTo.value = tmp
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
function updatePreview(hex) {
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
    updatePreview(colorHex.value)
  } else if (source === 'rgb') {
    const m = colorRgb.value.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/)
    if (!m) return
    r = +m[1]; g = +m[2]; b = +m[3]
    const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
    colorHex.value = hex
    const hsl = rgbToHsl(r, g, b)
    colorHsl.value = 'hsl(' + hsl.h + ', ' + hsl.s + '%, ' + hsl.l + '%)'
    updatePreview(hex)
  } else if (source === 'hsl') {
    const m = colorHsl.value.match(/(\d+(?:\.\d+)?)[,\s]+(\d+(?:\.\d+)?)%?[,\s]+(\d+(?:\.\d+)?)%?/)
    if (!m) return
    const rgb = hslToRgb(+m[1], +m[2], +m[3])
    r = rgb.r; g = rgb.g; b = rgb.b
    const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
    colorHex.value = hex
    colorRgb.value = 'rgb(' + r + ', ' + g + ', ' + b + ')'
    updatePreview(hex)
  }
}
</script>

<style scoped>
.daily-toolbox {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f7;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 520px;
  max-width: 420px;
  margin: 0 auto;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
}
.tabs {
  display: flex;
  background: #fff;
  border-bottom: 1px solid #e5e5e5;
  overflow-x: auto;
  scrollbar-width: none;
}
.tabs::-webkit-scrollbar { display: none; }
.tab {
  flex: 1;
  min-width: 64px;
  padding: 12px 6px;
  text-align: center;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all .2s;
  white-space: nowrap;
  font-weight: 500;
}
.tab.active {
  color: #007aff;
  border-bottom-color: #007aff;
  background: rgba(0,122,255,0.04);
}
.panel {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* Card */
.card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}
.card h3 { font-size: 14px; color: #333; margin-bottom: 12px; font-weight: 600; }

/* ===== 计算器 ===== */
.calc-display {
  background: #1c1c1e;
  color: #fff;
  font-size: 42px;
  font-weight: 300;
  text-align: right;
  padding: 20px 16px;
  min-height: 80px;
  word-break: break-all;
}
.calc-keys {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: #1c1c1e;
}
.calc-btn {
  border: none;
  background: #333;
  color: #fff;
  font-size: 24px;
  padding: 20px 0;
  cursor: pointer;
  transition: background .1s;
  outline: none;
}
.calc-btn:active { background: #555; }
.calc-btn.fn { background: #a5a5a5; color: #1c1c1e; }
.calc-btn.fn:active { background: #d4d4d4; }
.calc-btn.op { background: #ff9f0a; color: #fff; }
.calc-btn.op:active { background: #ffc876; }
.calc-btn.zero { grid-column: span 2; }

/* ===== 汇率 ===== */
.rate-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.rate-row input, .rate-row select {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
}
.rate-row input { flex: 1; }
.rate-row select { min-width: 90px; background: #f9f9f9; }
.rate-swap-wrap { text-align: center; margin: 4px 0; }
.rate-swap {
  width: 32px; height: 32px;
  border-radius: 50%;
  border: 1px solid #ddd;
  background: #fff;
  cursor: pointer;
  font-size: 16px; color: #007aff;
}
.rate-result {
  background: #007aff;
  color: #fff;
  padding: 14px;
  border-radius: 12px;
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  margin-top: 8px;
}
.rate-hint { font-size: 11px; color: #999; text-align: center; margin-top: 6px; }

/* ===== 生日星座 ===== */
.astro-input {
  width: 100%; padding: 12px;
  border: 1px solid #ddd; border-radius: 10px;
  font-size: 14px; margin-bottom: 12px;
}
.astro-result {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff; padding: 16px; border-radius: 12px; text-align: center;
}
.astro-sign { font-size: 32px; margin-bottom: 4px; }
.astro-name { font-size: 16px; font-weight: 600; }
.astro-date { font-size: 12px; opacity: 0.9; margin-top: 4px; }
.lunar-card { text-align: center; }
.lunar-row { margin-bottom: 10px; }
.lunar-row:last-child { margin-bottom: 0; }
.lunar-row .label { font-size: 12px; color: #999; margin-bottom: 4px; }
.lunar-row .value { font-size: 18px; font-weight: 600; color: #333; }

/* ===== 进制 ===== */
.base-row { display: flex; gap: 8px; margin-bottom: 10px; align-items: center; }
.base-row select { width: 90px; padding: 10px; border: 1px solid #ddd; border-radius: 10px; background: #f9f9f9; font-size: 14px; }
.base-row input { flex: 1; padding: 10px 12px; border: 1px solid #ddd; border-radius: 10px; font-size: 14px; font-family: monospace; }
.base-result {
  background: #34c759; color: #fff;
  padding: 12px; border-radius: 10px;
  font-family: monospace; font-size: 14px;
}
.base-result div { margin-bottom: 4px; }
.base-result div:last-child { margin-bottom: 0; }

/* ===== 颜色 ===== */
.color-preview {
  width: 100%; height: 120px;
  border-radius: 12px; margin-bottom: 12px;
  transition: background .3s;
  display: flex; align-items: center; justify-content: center;
  font-weight: 600; font-size: 16px;
  text-shadow: 0 1px 3px rgba(0,0,0,0.4);
}
.color-row { margin-bottom: 10px; }
.color-row label { display: block; font-size: 12px; color: #666; margin-bottom: 4px; }
.color-row input {
  width: 100%; padding: 10px 12px;
  border: 1px solid #ddd; border-radius: 10px;
  font-size: 14px; font-family: monospace;
}
</style>
