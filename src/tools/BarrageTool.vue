<template>
  <div class="barrage-tool">
    <div class="form-field">
      <label>弹幕内容</label>
      <input v-model="text" type="text" placeholder="输入文字...">
    </div>
    <div class="form-field">
      <label>文字大小 <span>{{ size }}px</span></label>
      <input v-model.number="size" type="range" min="20" max="120">
    </div>
    <div class="form-field">
      <label>滚动速度 <span>{{ speed }}s</span></label>
      <input v-model.number="speed" type="range" min="1" max="10">
    </div>
    <div class="form-field">
      <label>文字颜色</label>
      <div class="color-row">
        <button v-for="c in colors" :key="c" class="c-dot" :style="{ background: c }" :class="{ active: color === c }" @click="color = c"></button>
      </div>
    </div>
    <button class="btn-primary" @click="show">全屏显示</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const text = ref('Hello World')
const size = ref(48)
const speed = ref(5)
const color = ref('#ffffff')
const colors = ['#ffffff','#ff4444','#44ff44','#4444ff','#ffff44','#ff44ff','#44ffff','#ffaa00']

function show() {
  const div = document.createElement('div')
  div.style.cssText = `position:fixed;inset:0;background:#000;z-index:9999;display:flex;align-items:center;justify-content:center;overflow:hidden;cursor:pointer;`
  div.innerHTML = `<div style="color:${color.value};font-size:${size.value}px;font-weight:500;white-space:nowrap;animation:marquee ${speed.value}s linear infinite;">${text.value}</div><style>@keyframes marquee{from{transform:translateX(100vw)}to{transform:translateX(-100%)}}</style>`
  div.onclick = () => div.remove()
  document.body.appendChild(div)
}
</script>

<style scoped>
.barrage-tool { display: flex; flex-direction: column; gap: 14px; }
.form-field label { display: block; font-size: 13px; color: var(--text-secondary); margin-bottom: 6px; }
.form-field label span { color: var(--accent); font-weight: 600; margin-left: 4px; }
.form-field input[type="text"] {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-muted);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
}
.form-field input[type="range"] { width: 100%; accent-color: var(--accent); }
.color-row { display: flex; gap: 8px; flex-wrap: wrap; }
.c-dot {
  width: 28px; height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.15s;
}
.c-dot:hover { transform: scale(1.15); }
.c-dot.active { border-color: var(--text-primary); }
.btn-primary {
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  background: var(--accent);
  color: #fff;
  transition: opacity 0.15s;
}
.btn-primary:hover { opacity: 0.85; }
</style>
