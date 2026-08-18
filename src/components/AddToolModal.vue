<template>
  <div id="tool-modal" class="modal" @click="onBackdrop">
    <Transition name="slide-up">
      <div v-if="visible" class="modal-panel" @click.stop>
        <div class="modal-header">
          <h2>添加工具</h2>
          <button class="icon-btn" @click="close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18.3 5.7a1 1 0 00-1.4 0L12 10.6 7.1 5.7a1 1 0 00-1.4 1.4L10.6 12l-4.9 4.9a1 1 0 001.4 1.4L12 13.4l4.9 4.9a1 1 0 001.4-1.4L13.4 12l4.9-4.9a1 1 0 000-1.4z" fill="currentColor"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-field">
            <label>工具名称</label>
            <input v-model="name" type="text" placeholder="例如：Base64 编解码" @keyup.enter="submit">
          </div>
          <div class="form-field">
            <label>功能类型</label>
            <select v-model="type">
              <option v-for="(label, key) in types" :key="key" :value="key">{{ label }}</option>
            </select>
          </div>
          <button class="btn-primary" @click="submit">添加</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '../stores/app'
import { toolIcons, toolDescs } from '../data/tools'

const store = useAppStore()
const visible = ref(false)
const name = ref('')
const type = ref('base64')
const targetCat = ref(null)

const types = {
  base64: 'Base64 编解码',
  qrcode: '二维码生成',
  timer: '倒计时',
  random: '随机数',
  barrage: '手持弹幕',
  color: '取色器',
  text: '文本处理',
  calc: '计算器',
}

function open(e) {
  targetCat.value = e?.detail || null
  visible.value = true
}
function close() { visible.value = false; name.value = ''; type.value = 'base64' }
function onBackdrop(e) { if (e.target === e.currentTarget) close() }

function submit() {
  const n = name.value.trim()
  if (!n) { alert('请输入工具名称'); return }
  if (!targetCat.value) { alert('未指定分类'); return }
  store.addTool(targetCat.value, {
    id: 't_' + Date.now(),
    name: n,
    icon: toolIcons[type.value] || '🔧',
    type: type.value,
    desc: toolDescs[type.value] || '工具'
  })
  close()
}

onMounted(() => {
  document.getElementById('tool-modal').addEventListener('show', open)
})
onUnmounted(() => {
  document.getElementById('tool-modal')?.removeEventListener('show', open)
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
.form-field input, .form-field select {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-muted);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
}
.form-field input:focus, .form-field select:focus { border-color: var(--accent); }
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
