<!-- SettingsModal.vue -->
<template>
  <div id="settings-modal" class="modal" @click="onBackdrop">
    <Transition name="slide-up">
      <div v-if="visible" class="modal-panel" @click.stop>
        <div class="modal-header">
          <h2>{{ $t('settings.title') }}</h2>
          <button class="icon-btn" @click="close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18.3 5.7a1 1 0 00-1.4 0L12 10.6 7.1 5.7a1 1 0 00-1.4 1.4L10.6 12l-4.9 4.9a1 1 0 001.4 1.4L12 13.4l4.9 4.9a1 1 0 001.4-1.4L13.4 12l4.9-4.9a1 1 0 000-1.4z" fill="currentColor"/></svg>
          </button>
        </div>
        <div class="settings-body">

          <!-- 语言 -->
          <div class="setting-group">
            <label>{{ $t('settings.language') }}</label>
            <div class="segmented">
              <button
                v-for="l in localeOptions" :key="l.key"
                class="seg-btn" :class="{ active: store.locale === l.key }"
                @click="setLocale(l.key)"
              >{{ l.label }}</button>
            </div>
          </div>

          <!-- 外观模式 -->
          <div class="setting-group">
            <label>{{ $t('settings.appearance') }}</label>
            <div class="segmented">
              <button
                v-for="t in themeOptions" :key="t.key"
                class="seg-btn" :class="{ active: store.theme === t.key }"
                @click="store.theme = t.key"
              >{{ t.label }}</button>
            </div>
          </div>

          <!-- 主题色 -->
          <div class="setting-group">
            <label>{{ $t('settings.accentColor') }}</label>
            <div class="color-palette">
              <button v-for="c in colors" :key="c"
                class="color-dot" :style="{ background: c }"
                :class="{ active: store.accent === c }"
                @click="store.accent = c"></button>
              <input
                v-model="store.accent"
                type="color"
                class="color-picker-native"
                :title="$t('settings.accentColor')"
              />
            </div>
          </div>

          <!-- 自定义颜色 -->
          <div class="setting-group">
            <label>{{ $t('settings.customColors') }}</label>
            <div class="custom-color-row">
              <span>{{ $t('settings.bgColor') }}</span>
              <input v-model="store.bgColor" type="color" />
              <button class="reset-btn" @click="store.bgColor = ''">{{ $t('settings.reset') }}</button>
            </div>
            <div class="custom-color-row">
              <span>{{ $t('settings.textColor') }}</span>
              <input v-model="store.textColor" type="color" />
              <button class="reset-btn" @click="store.textColor = ''">{{ $t('settings.reset') }}</button>
            </div>
            <div class="custom-color-row">
              <span>{{ $t('settings.navColor') }}</span>
              <input v-model="store.navColor" type="color" />
              <button class="reset-btn" @click="store.navColor = ''">{{ $t('settings.reset') }}</button>
            </div>
          </div>

          <!-- 护眼色推荐 -->
          <div class="setting-group">
            <label>{{ $t('settings.eyeCare') }}</label>
            <div class="eye-care-grid">
              <button
                v-for="c in eyeColors"
                :key="c.hex"
                class="eye-care-btn"
                :style="{ background: c.hex }"
                :class="{ active: store.bgColor === c.hex }"
                @click="applyEyeCare(c.hex)"
                :title="c.name"
              >
                <span class="eye-care-name">{{ c.name }}</span>
              </button>
            </div>
          </div>

          <!-- 背景动画 -->
          <div class="setting-group">
            <label>{{ $t('settings.bgAnimation') }}</label>
            <div class="upload-row">
              <input
                ref="fileInput"
                type="file"
                accept="image/*,video/*,image/gif"
                @change="onFileChange"
                style="display:none"
              />
              <button class="upload-btn" @click="$refs.fileInput.click()">
                {{ store.bgAnimation ? $t('settings.changeAnimation') : $t('settings.uploadAnimation') }}
              </button>
              <button v-if="store.bgAnimation" class="reset-btn" @click="store.bgAnimation = ''">{{ $t('settings.clear') }}</button>
            </div>
            <div v-if="store.bgAnimation" class="preview-wrap">
              <img :src="store.bgAnimation" class="preview-img" alt="bg" />
            </div>
          </div>

          <!-- 字体大小 -->
          <div class="setting-group">
            <label>{{ $t('settings.fontSize') }} <span>{{ store.fontSize }}px</span></label>
            <input type="range" min="12" max="22" v-model.number="store.fontSize">
          </div>

          <!-- 圆角 -->
          <div class="setting-group">
            <label>{{ $t('settings.radius') }} <span>{{ store.radius }}px</span></label>
            <input type="range" min="0" max="24" v-model.number="store.radius">
          </div>

          <!-- 书架布局 -->
          <div class="setting-group">
            <label>{{ $t('settings.layout') }}</label>
            <div class="segmented">
              <button
                v-for="g in gridOptions" :key="g.key"
                class="seg-btn" :class="{ active: store.grid === g.key }"
                @click="store.grid = g.key"
              >{{ g.label }}</button>
            </div>
          </div>

          <!-- 开关组 -->
          <div class="setting-group switch-group">
            <label class="switch-label">
              <span>{{ $t('settings.glassEffect') }}</span>
              <input type="checkbox" v-model="store.enableGlass" class="toggle-switch" />
            </label>
          </div>
          <div class="setting-group switch-group">
            <label class="switch-label">
              <span>{{ $t('settings.reduceMotion') }}</span>
              <input type="checkbox" v-model="store.reduceMotion" class="toggle-switch" />
            </label>
          </div>

        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '../stores/app'

const store = useAppStore()
const { locale } = useI18n()
const visible = ref(false)
const fileInput = ref(null)

const colors = ['#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#6366f1']

const eyeColors = [
  { name: '豆沙绿', hex: '#C7EDCC' },
  { name: '杏仁黄', hex: '#FAF9DE' },
  { name: '秋叶褐', hex: '#FFF2E2' },
  { name: '胭脂红', hex: '#FDE6E0' },
  { name: '海天蓝', hex: '#E3EDCD' },
  { name: '葛巾紫', hex: '#E9EBFE' },
  { name: '极光灰', hex: '#EAEAEF' },
  { name: '深夜黑', hex: '#1a1a2e' },
]

const localeOptions = computed(() => [
  { key: 'zh', label: '中文' },
  { key: 'en', label: 'English' },
  { key: 'auto', label: locale.value === 'en' ? 'Auto' : '跟随系统' },
])

const themeOptions = computed(() => [
  { key: 'light', label: locale.value === 'en' ? 'Light' : '浅色' },
  { key: 'dark', label: locale.value === 'en' ? 'Dark' : '深色' },
  { key: 'auto', label: locale.value === 'en' ? 'Auto' : '自动' },
])

const gridOptions = computed(() => [
  { key: '3x3', label: '3×3' },
  { key: '4x4', label: '4×4' },
  { key: 'list', label: locale.value === 'en' ? 'List' : '列表' },
])

function setLocale(key) {
  store.locale = key
  if (key === 'auto') {
    const sys = navigator.language.startsWith('zh') ? 'zh' : 'en'
    locale.value = sys
    localStorage.setItem('toolbox_locale', sys)
  } else {
    locale.value = key
    localStorage.setItem('toolbox_locale', key)
  }
}

function applyEyeCare(hex) {
  store.bgColor = hex
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  store.textColor = brightness > 160 ? '#333333' : '#f0f0f5'
}

function onFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => { store.bgAnimation = ev.target.result }
  reader.readAsDataURL(file)
}

function open() { visible.value = true }
function close() { visible.value = false }
function onBackdrop(e) { if (e.target === e.currentTarget) close() }

onMounted(() => {
  document.getElementById('settings-modal').addEventListener('show', open)
})
onUnmounted(() => {
  document.getElementById('settings-modal')?.removeEventListener('show', open)
})
</script>

<style scoped>
.modal {
  display: none;
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 100;
  align-items: flex-end;
  justify-content: center;
}
.modal:has(.modal-panel) { display: flex; }
.modal-panel {
  width: 100%; max-width: 480px;
  max-height: 85vh;
  background: var(--bg);
  border-radius: 16px 16px 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.modal-header h2 { font-size: 17px; font-weight: 500; }
.icon-btn {
  width: 32px; height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.icon-btn:hover { background: var(--bg-muted); }

.settings-body {
  padding: 16px;
  overflow-y: auto;
  flex: 1;
}

.setting-group { margin-bottom: 20px; }
.setting-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--text-secondary);
}
.setting-group label span { color: var(--accent); font-weight: 600; margin-left: 4px; }

.segmented {
  display: flex;
  background: var(--bg-muted);
  border-radius: 8px;
  padding: 3px;
  gap: 3px;
}
.seg-btn {
  flex: 1;
  padding: 6px 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}
.seg-btn.active {
  background: var(--bg);
  color: var(--text-primary);
  font-weight: 500;
  box-shadow: 0 1px 3px var(--shadow);
}

.color-palette { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.color-dot {
  width: 28px; height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.15s;
  padding: 0;
}
.color-dot:hover { transform: scale(1.15); }
.color-dot.active { border-color: var(--text-primary); }
.color-picker-native {
  width: 28px; height: 28px;
  border: none;
  border-radius: 50%;
  padding: 0;
  cursor: pointer;
  background: none;
}
.color-picker-native::-webkit-color-swatch-wrapper { padding: 0; }
.color-picker-native::-webkit-color-swatch { border-radius: 50%; border: 2px solid var(--border); }

.custom-color-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.custom-color-row span {
  width: 70px;
  font-size: 13px;
  color: var(--text-secondary);
  flex-shrink: 0;
}
.custom-color-row input[type="color"] {
  width: 36px; height: 36px;
  border: none;
  border-radius: 8px;
  padding: 0;
  cursor: pointer;
  background: none;
  flex-shrink: 0;
}
.custom-color-row input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
.custom-color-row input[type="color"]::-webkit-color-swatch { border-radius: 8px; border: 2px solid var(--border); }
.reset-btn {
  padding: 4px 10px;
  font-size: 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-raised);
  color: var(--text-secondary);
  cursor: pointer;
  font-family: inherit;
}
.reset-btn:hover { background: var(--bg-muted); }

.eye-care-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.eye-care-btn {
  aspect-ratio: 1;
  border-radius: 12px;
  border: 2px solid transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s, border-color 0.15s;
  position: relative;
  padding: 0;
}
.eye-care-btn:hover { transform: scale(1.05); }
.eye-care-btn.active { border-color: var(--accent); }
.eye-care-name {
  font-size: 11px;
  font-weight: 500;
  color: rgba(0,0,0,0.5);
  text-shadow: 0 1px 2px rgba(255,255,255,0.6);
  pointer-events: none;
}

.upload-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.upload-btn {
  flex: 1;
  padding: 10px;
  border: 1px dashed var(--border);
  border-radius: 10px;
  background: var(--bg-raised);
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  font-family: inherit;
}
.upload-btn:hover { background: var(--bg-muted); }
.preview-wrap {
  margin-top: 10px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--border);
}
.preview-img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  display: block;
}

input[type="range"] { width: 100%; accent-color: var(--accent); }

.switch-group { margin-bottom: 12px; }
.switch-label {
  display: flex !important;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0 !important;
  cursor: pointer;
}
.toggle-switch {
  appearance: none;
  width: 44px;
  height: 24px;
  background: var(--border);
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}
.toggle-switch::after {
  content: '';
  position: absolute;
  top: 2px; left: 2px;
  width: 20px; height: 20px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.toggle-switch:checked {
  background: var(--accent);
}
.toggle-switch:checked::after {
  transform: translateX(20px);
}
</style>