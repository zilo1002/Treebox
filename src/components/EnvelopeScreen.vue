<template>
  <div class="envelope-screen">
    <!-- 极简背景 -->
    <div class="bg-gradient"></div>

    <!-- 背景粒子 -->
    <div class="particles">
      <span v-for="n in 15" :key="n" class="particle" :style="particleStyle(n)"></span>
    </div>

    <!-- 主内容区 -->
    <div class="content-wrapper">
      <!-- 标题 -->
      <div class="title-section">
        <h1>我的工具箱</h1>
        <p>PREMIUM TOOLS</p>
      </div>

      <!-- 信封区域 -->
      <div class="envelope-container" :class="{ opened }">
        <div class="envelope" @click="open">
          <!-- 信封主体 -->
          <div class="envelope-body">
            <!-- 顶部折叠阴影 -->
            <div class="body-shadow-top"></div>
            <!-- 内容卡片 -->
            <div class="inner-card">
              <div class="card-emblem">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          <!-- 信封盖 -->
          <div class="envelope-flap">
            <div class="flap-shadow"></div>
          </div>
        </div>

        <!-- 小圆形按钮 - 暖橙色 -->
        <button class="open-btn" @click="open" :disabled="opened">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <!-- 提示文字 -->
        <p class="hint-text" v-if="!opened">点击开启</p>
      </div>
    </div>

    <!-- 开启后的金色粒子 -->
    <div v-if="opened" class="reveal-particles">
      <span v-for="n in 25" :key="'rp'+n" class="reveal-particle" :style="revealParticleStyle(n)"></span>
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

function particleStyle(n) {
  const size = 3 + Math.random() * 5
  const left = Math.random() * 100
  const delay = Math.random() * 10
  const duration = 15 + Math.random() * 10
  return {
    width: size + 'px',
    height: size + 'px',
    left: left + '%',
    animationDelay: delay + 's',
    animationDuration: duration + 's',
    opacity: 0.15 + Math.random() * 0.15,
  }
}

function revealParticleStyle(n) {
  const colors = ['#F5A623', '#FF8C42', '#FFD166', '#FFAA5C', '#E8924A']
  const color = colors[n % colors.length]
  const left = 30 + Math.random() * 40
  const delay = Math.random() * 0.6
  const duration = 1.5 + Math.random() * 1.5
  const size = 4 + Math.random() * 6
  return {
    background: color,
    left: left + '%',
    top: '40%',
    animationDelay: delay + 's',
    animationDuration: duration + 's',
    width: size + 'px',
    height: size + 'px',
    boxShadow: `0 0 ${size * 2}px ${color}`,
  }
}
</script>

<style scoped>
/* ========== 基础布局 ========== */
.envelope-screen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* 极简渐变背景 */
.bg-gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 20% 30%, rgba(245, 166, 35, 0.04) 0%, transparent 40%),
    radial-gradient(ellipse at 80% 70%, rgba(255, 140, 66, 0.03) 0%, transparent 40%),
    linear-gradient(180deg, var(--bg-primary, #FAFAFA) 0%, var(--bg-secondary, #F5F5F5) 100%);
}

/* ========== 粒子效果 ========== */
.particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.particle {
  position: absolute;
  bottom: -10px;
  background: var(--text-tertiary, #999);
  border-radius: 50%;
  animation: floatUp linear infinite;
}
@keyframes floatUp {
  0% { transform: translateY(0); opacity: 0; }
  10% { opacity: 0.2; }
  90% { opacity: 0.2; }
  100% { transform: translateY(-120vh); opacity: 0; }
}

/* ========== 内容容器 ========== */
.content-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  position: relative;
  z-index: 2;
}

/* ========== 标题区域 ========== */
.title-section {
  text-align: center;
  animation: fadeInDown 0.8s ease-out;
}
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.title-section h1 {
  font-family: 'Playfair Display', 'Georgia', 'Times New Roman', serif;
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary, #1C1C1E);
  margin-bottom: 8px;
  letter-spacing: 1px;
}

.title-section p {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: var(--text-tertiary, #999);
}

/* ========== 信封容器 ========== */
.envelope-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

/* ========== 信封本体 ========== */
.envelope {
  width: 280px;
  height: 180px;
  position: relative;
  cursor: pointer;
  animation: envelopeFloat 4s ease-in-out infinite;
}
@keyframes envelopeFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.envelope-container.opened .envelope {
  animation: envelopeOpen 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes envelopeOpen {
  0% { transform: translateY(0) scale(1); opacity: 1; }
  50% { transform: translateY(-20px) scale(1.02); }
  100% { transform: translateY(-60px) scale(0.9); opacity: 0; }
}

/* 信封主体 */
.envelope-body {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%);
  border-radius: 24px;
  box-shadow:
    0 20px 50px rgba(0, 0, 0, 0.08),
    0 8px 20px rgba(0, 0, 0, 0.04),
    inset 0 -2px 6px rgba(0, 0, 0, 0.02);
  overflow: hidden;
}

/* 顶部折叠阴影 */
.body-shadow-top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.02) 0%, transparent 100%);
  pointer-events: none;
}

/* 内容卡片 */
.inner-card {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-emblem {
  width: 36px;
  height: 36px;
  color: var(--text-tertiary, #ccc);
  opacity: 0.4;
}

/* 信封盖 */
.envelope-flap {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 90px;
  transform-origin: top center;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 2;
}

.envelope-flap::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #F0F0F0 0%, #E8E8E8 100%);
  clip-path: polygon(0 0, 50% 100%, 100% 0);
  border-radius: 24px 24px 0 0;
}

.flap-shadow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  background: linear-gradient(180deg, rgba(0,0,0,0.015) 0%, transparent 100%);
  clip-path: polygon(0 0, 50% 100%, 100% 0);
  pointer-events: none;
}

/* 开启状态 */
.envelope-container.opened .envelope-flap {
  transform: rotateX(-160deg);
}

/* ========== 开启按钮 - 小圆形暖橙色 ========== */
.open-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(145deg, #FF9F43 0%, #F5A623 50%, #E8924A 100%);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 4px 15px rgba(245, 166, 35, 0.4),
    0 2px 8px rgba(245, 166, 35, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.open-btn::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  right: 2px;
  height: 50%;
  background: linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%);
  border-radius: 50% 50% 0 0;
}

.open-btn:hover {
  transform: scale(1.08);
  box-shadow:
    0 6px 20px rgba(245, 166, 35, 0.5),
    0 3px 12px rgba(245, 166, 35, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.open-btn:active {
  transform: scale(0.95);
}

.open-btn:disabled {
  opacity: 0;
  transform: scale(0);
  pointer-events: none;
}

.open-btn svg {
  width: 20px;
  height: 20px;
  position: relative;
  z-index: 1;
}

/* ========== 提示文字 ========== */
.hint-text {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 12px;
  letter-spacing: 2px;
  color: var(--text-tertiary, #bbb);
  animation: hintPulse 2s ease-in-out infinite;
}

@keyframes hintPulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

/* ========== 揭示粒子 ========== */
.reveal-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.reveal-particle {
  position: absolute;
  border-radius: 50%;
  animation: revealFall ease-out forwards;
}

@keyframes revealFall {
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(50vh) scale(0);
    opacity: 0;
  }
}

/* ========== 响应式 ========== */
@media (max-width: 320px) {
  .envelope {
    width: 240px;
    height: 155px;
  }
  .title-section h1 {
    font-size: 24px;
  }
}
</style>
