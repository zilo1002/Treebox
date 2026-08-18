<template>
  <div id="settings-modal" class="modal" @click="onBackdrop">
    <Transition name="slide-up">
      <div v-if="visible" class="modal-panel" @click.stop>
        <div class="modal-header">
          <h2>设置</h2>
          <button class="icon-btn" @click="close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18.3 5.7a1 1 0 00-1.4 0L12 10.6 7.1 5.7a1 1 0 00-1.4 1.4L10.6 12l-4.9 4.9a1 1 0 001.4 1.4L12 13.4l4.9 4.9a1 1 0 001.4-1.4L13.4 12l4.9-4.9a1 1 0 000-1.4z" fill="currentColor"/></svg>
          </button>
        </div>
        <div class="settings-body">
          <div class="setting-group">
            <label>外观模式</label>
            <div class="segmented">
              <button v-for="t in ['light','dark','auto']" :key="t"
                class="seg-btn" :class="{ active: store.theme === t }"
                @click="store.theme = t">{{ t === 'light' ? '浅色' : t === 'dark' ? '深色' : '自动' }}</button>
            </div>
          </div>

          <div class="setting-group">
            <label>主题色</label>
            <div class="color-palette">
              <button v-for="c in colors" :key="c"
                class="color-dot" :style="{ background: c }"
                :class="{ active: store.accent === c }"
                @click="store.accent = c"></button>
            </div>
          </div>

          <div class="setting-group">
            <label>书架布局</label>
            <div class="segmented">
              <button v-for="g in ['3x3','4x4','list']" :key="g"
                class="seg-btn" :class="{ active: store.grid === g }"
                @click="store.grid = g">{{ g === 'list' ? '列表' : g }}</button>
            </div>
          </div>

          <div class="setting-group">
            <label>卡片圆角 <span>{{ store.radius }}</span>px</label>
            <input type="range" min="0" max="20" v-model.number="store.radius">
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '../stores/app'

const store = useAppStore()
const visible = ref(false)
const colors = ['#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#6366f1']

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
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--border);
}
.modal-header h2 { font-size: 17px; font-weight: 500; }
.settings-body { padding: 16px; overflow-y: auto; }

.setting-group { margin-bottom: 20px; }
.setting-group label { display: block; font-size: 14px; font-weight: 500; margin-bottom: 8px; color: var(--text-secondary); }
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
}
.seg-btn.active { background: var(--bg); color: var(--text-primary); font-weight: 500; box-shadow: 0 1px 3px var(--shadow); }
.color-palette { display: flex; gap: 10px; flex-wrap: wrap; }
.color-dot {
  width: 28px; height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.15s;
}
.color-dot:hover { transform: scale(1.15); }
.color-dot.active { border-color: var(--text-primary); }
input[type="range"] { width: 100%; accent-color: var(--accent); }
</style>
