<template>
  <div class="envelope-screen">
    <!-- 极简背景 -->
    <div class="bg-gradient"></div>

    <!-- 背景粒子光斑 -->
    <div class="bokeh-particles">
      <span v-for="n in 12" :key="n" class="bokeh" :style="bokehStyle(n)"></span>
    </div>

    <!-- 主内容区 -->
    <div class="content-wrapper">
      <!-- 标题 -->
      <div class="title-section">
        <h1>{{ $t('envelope.welcome') }}</h1>
      </div>

      <!-- 信封 -->
      <div class="envelope" @click="open" :class="{ opened }">
        <!-- 信封主体 -->
        <div class="envelope-body">
          <!-- 淡淡的描边 -->
          <div class="body-border"></div>
        </div>

        <!-- 信封盖 -->
        <div class="envelope-flap"></div>

        <!-- 火漆印章 -->
        <div class="wax-seal" v-if="!opened">
          <div class="seal-top"></div>
          <div class="seal-bottom"></div>
        </div>
      </div>

      <!-- 文字按钮 -->
      <button class="text-btn" @click="open" :disabled="opened">
        {{ $t('envelope.hint') }}
      </button>
    </div>

    <!-- 开启粒子效果 -->
    <div v-if="opened" class="reveal-particles">
      <span v-for="n in 20" :key="'rp'+n" class="reveal-particle" :style="revealParticleStyle(n)"></span>
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
  setTimeout(() => emit('open'), 700)
}

function bokehStyle(n) {
  const colors = ['rgba(255, 220, 150, 0.3)', 'rgba(255, 200, 180, 0.25)', 'rgba(255, 230, 200, 0.2)']
  const color = colors[n % colors.length]
  const size = 8 + Math.random() * 20
  const left = Math.random() * 100
  const top = Math.random() * 100
  const delay = Math.random() * 5
  const duration = 8 + Math.random() * 6
  return {
    width: size + 'px',
    height: size + 'px',
    left: left + '%',
    top: top + '%',
    background: color,
    animationDelay: delay + 's',
    animationDuration: duration + 's',
  }
}

function revealParticleStyle(n) {
  const colors = ['#FFAA5C', '#FFD4A8', '#FF8C66', '#FFB88C']
  const color = colors[n % colors.length]
  const left = 30 + Math.random() * 40
  const delay = Math.random() * 0.5
  const duration = 1.2 + Math.random() * 1
  const size = 4 + Math.random() * 6
  return {
    background: color,
    left: left + '%',
    top: '50%',
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

/* 米白渐变背景 */
.bg-gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 50% 50%, #FDFCFA 0%, #F8F6F3 100%);
}

/* 边缘暗角 */
.bg-gradient::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.03) 100%);
  pointer-events: none;
}

/* ========== 光斑粒子 ========== */
.bokeh-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.bokeh {
  position: absolute;
  border-radius: 50%;
  filter: blur(2px);
  animation: bokehFloat ease-in-out infinite;
}
@keyframes bokehFloat {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.6; }
  50% { transform: translateY(-15px) scale(1.1); opacity: 0.8; }
}

/* ========== 内容容器 ========== */
.content-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 40px;
  position: relative;
  z-index: 2;
  padding: 20px;
}

/* ========== 标题 ========== */
.title-section {
  text-align: center;
}
.title-section h1 {
  font-family: 'Playfair Display', 'SimSun', 'STSong', Georgia, serif;
  font-size: 26px;
  font-weight: 500;
  color: #3D3D3D;
  letter-spacing: 3px;
  margin: 0;
}

/* ========== 信封 ========== */
.envelope {
  width: 260px;
  height: 160px;
  position: relative;
  cursor: pointer;
  animation: envelopeFloat 3.5s ease-in-out infinite;
}
@keyframes envelopeFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

/* 信封主体 */
.envelope-body {
  position: absolute;
  inset: 0;
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow:
    0 15px 40px rgba(0, 0, 0, 0.06),
    0 5px 15px rgba(0, 0, 0, 0.03);
  overflow: hidden;
}

/* 淡淡描边 */
.body-border {
  position: absolute;
  inset: 0;
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-radius: 16px;
  pointer-events: none;
}

/* 信封盖 */
.envelope-flap {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 80px;
  transform-origin: top center;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 2;
}

.envelope-flap::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #E8E4DE 0%, #F0EDE8 100%);
  clip-path: polygon(0 0, 50% 100%, 100% 0);
  border-radius: 16px 16px 0 0;
}

/* ========== 火漆印章 ========== */
.wax-seal {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 48px;
  height: 48px;
  z-index: 10;
  transition: all 0.4s ease;
}

.seal-top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(180deg, #FFB5B5 0%, #FFAA9C 100%);
  border-radius: 24px 24px 0 0;
}

.seal-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50%;
  background:
    radial-gradient(circle at 30% 30%, #FFD4A8 1px, transparent 2px),
    radial-gradient(circle at 70% 50%, #FFD4A8 1px, transparent 2px),
    radial-gradient(circle at 50% 70%, #FFD4A8 1px, transparent 2px),
    linear-gradient(180deg, #FF9C6B 0%, #FF7F4D 100%);
  border-radius: 0 0 24px 24px;
}

/* ========== 开启状态 ========== */
.envelope.opened {
  animation: envelopeOpen 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes envelopeOpen {
  0% { transform: translateY(0) scale(1); opacity: 1; }
  50% { transform: translateY(-15px) scale(1.02); }
  100% { transform: translateY(-50px) scale(0.9); opacity: 0; }
}

.envelope.opened .envelope-flap {
  transform: rotateX(-160deg);
}

.envelope.opened .wax-seal {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0);
}

/* ========== 文字按钮 ========== */
.text-btn {
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #888888;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px 16px;
  letter-spacing: 2px;
  transition: all 0.3s ease;
  animation: btnPulse 2s ease-in-out infinite;
}
@keyframes btnPulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.text-btn:hover {
  color: #666666;
}

.text-btn:disabled {
  opacity: 0;
  transform: translateY(10px);
  pointer-events: none;
  animation: none;
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
    transform: translateY(40vh) scale(0);
    opacity: 0;
  }
}

/* ========== 响应式 ========== */
@media (max-width: 320px) {
  .envelope {
    width: 220px;
    height: 135px;
  }
  .title-section h1 {
    font-size: 22px;
  }
}
</style>