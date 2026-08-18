<template>
  <div id="cat-modal" class="modal" @click="onBackdrop">
    <Transition name="slide-up">
      <div v-if="visible" class="modal-panel" @click.stop>
        <div class="modal-header">
          <h2>新建分类</h2>
          <button class="icon-btn" @click="close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18.3 5.7a1 1 0 00-1.4 0L12 10.6 7.1 5.7a1 1 0 00-1.4 1.4L10.6 12l-4.9 4.9a1 1 0 001.4 1.4L12 13.4l4.9 4.9a1 1 0 001.4-1.4L13.4 12l4.9-4.9a1 1 0 000-1.4z" fill="currentColor"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-field">
            <label>分类名称</label>
            <input v-model="name" type="text" placeholder="例如：开发工具" @keyup.enter="submit">
          </div>
          <div class="form-field">
            <label>选择图标</label>
            <div class="icon-picker">
              <button v-for="icon in icons" :key="icon"
                class="ip-btn" :class="{ selected: picked === icon }"
                @click="picked = icon">{{ icon }}</button>
            </div>
          </div>
          <button class="btn-primary" @click="submit">创建</button>
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
const name = ref('')
const picked = ref('📁')
const icons = ['📁','📝','🎨','🔧','🔐','📊','🎵','🌐','⚡','📱']

function open() { visible.value = true }
function close() { visible.value = false; name.value = ''; picked.value = '📁' }
function onBackdrop(e) { if (e.target === e.currentTarget) close() }

function submit() {
  const n = name.value.trim()
  if (!n) { alert('请输入分类名称'); return }
  store.addCategory({
    id: 'cat_' + Date.now(),
    name: n,
    icon: picked.value,
    color: store.accent,
    tools: []
  })
  close()
}

onMounted(() => {
  document.getElementById('cat-modal').addEventListener('show', open)
})
onUnmounted(() => {
  document.getElementById('cat-modal')?.removeEventListener('show', open)
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
.modal-body { padding: 16px; }

.form-field { margin-bottom: 16px; }
.form-field label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px; color: var(--text-secondary); }
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
.form-field input:focus { border-color: var(--accent); }
.icon-picker { display: flex; gap: 8px; flex-wrap: wrap; }
.ip-btn {
  width: 44px; height: 44px;
  font-size: 22px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg);
  cursor: pointer;
  transition: all 0.15s;
}
.ip-btn:hover { background: var(--bg-muted); }
.ip-btn.selected { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 10%, transparent); }
.btn-primary {
  width: 100%;
  padding: 10px;
  border-radius: 10px;
  border: none;
  background: var(--accent);
  color: #fff;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn-primary:hover { opacity: 0.9; }
</style>
