<template>
  <div class="envelope-screen">
    <div class="envelope-wrap" :class="{ opened }">
      <div class="envelope" @click="open">
        <div class="envelope-body"></div>
        <div class="envelope-flap"></div>
        <div class="envelope-card">
          <div class="card-inner">
            <div class="card-icon">📦</div>
            <h2>我的工具箱</h2>
            <p>点击打开</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const emit = defineEmits(['open'])
const opened = ref(false)

function open() {
  if (opened.value) return
  opened.value = true
  setTimeout(() => emit('open'), 800)
}
</script>

<style scoped>
.envelope-screen {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-muted);
}
.envelope-wrap {
  perspective: 800px;
}
.envelope {
  width: 240px;
  height: 150px;
  position: relative;
  cursor: pointer;
  transform-style: preserve-3d;
}
.envelope-body {
  position: absolute;
  inset: 0;
  background: var(--bg-strong);
  border-radius: 10px;
  box-shadow: 0 8px 32px var(--shadow);
}
.envelope-flap {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 75px;
  background: var(--border);
  clip-path: polygon(0 0, 50% 100%, 100% 0);
  transform-origin: top center;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 10px 10px 0 0;
}
.envelope-card {
  position: absolute;
  top: 10px; left: 10px; right: 10px;
  height: 130px;
  background: var(--bg);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateY(0);
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s;
  box-shadow: 0 2px 8px var(--shadow);
}
.card-inner { text-align: center; }
.card-icon { font-size: 36px; margin-bottom: 8px; }
.card-inner h2 { font-size: 16px; font-weight: 500; margin-bottom: 4px; }
.card-inner p { font-size: 13px; color: var(--text-tertiary); }

.opened .envelope-flap { transform: rotateX(180deg); }
.opened .envelope-card { transform: translateY(-70px); }
</style>
