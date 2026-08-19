<template>
  <div class="envelope-screen">
    <!-- 高级感背景渐变 -->
    <div class="bg-gradient"></div>

    <!-- 背景粒子 -->
    <div class="particles">
      <span v-for="n in 20" :key="n" class="particle" :style="particleStyle(n)"></span>
    </div>

    <div class="content-wrapper">
      <div class="envelope-wrap" :class="{ opened, bouncing }">
        <div class="envelope" @click="open">
          <!-- 外层光晕 -->
          <div class="envelope-aura"></div>

          <!-- 信封主体 -->
          <div class="envelope-body">
            <!-- 内部阴影 -->
            <div class="body-shadow"></div>
            <!-- 顶部装饰线 -->
            <div class="body-corner left"></div>
            <div class="body-corner right"></div>
          </div>

          <!-- 信封内卡 -->
          <div class="envelope-inner-card">
            <div class="card-content">
              <div class="card-emblem">
                <svg viewBox="0 0 48 48" fill="none">
                  <path d="M24 4L6 14v20l18 10 18-10V14L24 4z" stroke="currentColor" stroke-width="1.5" fill="none"/>
                  <path d="M24 14l-10 5.5v11L24 36l10-5.5v-11L24 14z" stroke="currentColor" stroke-width="1"/>
                  <circle cx="24" cy="24" r="4" fill="currentColor" opacity="0.3"/>
                </svg>
              </div>
              <h2>我的工具箱</h2>
              <p>Premium Tools</p>
              <div class="card-line"></div>
            </div>
          </div>

          <!-- 信封盖 -->
          <div class="envelope-flap">
            <div class="flap-surface"></div>
            <div class="flap-fold-line"></div>
          </div>

          <!-- 高级火漆印章 -->
          <div class="wax-seal">
            <svg class="seal-svg" viewBox="0 0 64 64">
              <defs>
                <radialGradient id="sealGrad" cx="35%" cy="35%">
                  <stop offset="0%" stop-color="#D4838C"/>
                  <stop offset="50%" stop-color="#8B2942"/>
                  <stop offset="100%" stop-color="#5C1B2C"/>
                </radialGradient>
                <filter id="sealShadow">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.4"/>
                </filter>
              </defs>
              <!-- 印章底座 -->
              <circle cx="32" cy="32" r="30" fill="url(#sealGrad)" filter="url(#sealShadow)"/>
              <!-- 内圈装饰 -->
              <circle cx="32" cy="32" r="24" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
              <!-- 中心图案 -->
              <path d="M32 18L38 26L48 26L40 32L43 42L32 36L21 42L24 32L16 26L26 26Z"
                    fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.15)" stroke-width="0.5"/>
              <!-- 高光 -->
              <ellipse cx="24" cy="22" rx="6" ry="3" fill="rgba(255,255,255,0.2)" transform="rotate(-30 24 22)"/>
            </svg>
            <!-- 涟漪效果 -->
            <div class="seal-ripple"></div>
          </div>

          <!-- 金色光芒（开启时） -->
          <div class="golden-light"></div>
        </div>
      </div>

      <!-- 提示文字 -->
      <div class="hint-text" :class="{ hidden: opened }">
        <span class="hint-line"></span>
        <span class="hint-label">点击开启</span>
        <span class="hint-line"></span>
      </div>
    </div>

    <!-- 打开后的金色粒子 -->
    <div v-if="opened" class="golden-particles">
      <span v-for="n in 30" :key="'gp'+n" class="golden-particle" :style="goldenParticleStyle(n)"></span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const emit = defineEmits(['open'])
const opened = ref(false)
const bouncing = ref(false)

function open() {
  if (opened.value) return
  bouncing.value = true
  setTimeout(() => {
    opened.value = true
    setTimeout(() => emit('open'), 1000)
  }, 400)
}

function particleStyle(n) {
  const size = 2 + Math.random() * 4
  const left = Math.random() * 100
  const delay = Math.random() * 8
  const duration = 12 + Math.random() * 8
  return {
    width: size + 'px',
    height: size + 'px',
    left: left + '%',
    animationDelay: delay + 's',
    animationDuration: duration + 's',
  }
}

function goldenParticleStyle(n) {
  const colors = ['#C9A962', '#E5D4A1', '#D4AF37', '#F4E4BA', '#B8860B']
  const color = colors[n % colors.length]
  const left = Math.random() * 100
  const delay = Math.random() * 0.8
  const duration = 2 + Math.random() * 2
  const size = 3 + Math.random() * 5
  return {
    background: color,
    left: left + '%',
    animationDelay: delay + 's',
    animationDuration: duration + 's',
    width: size + 'px',
    height: size + 'px',
    boxShadow: `0 0 ${size}px ${color}`,
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

/* 高级感渐变背景 */
.bg-gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 30% 20%, rgba(201, 169, 98, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 80%, rgba(139, 41, 66, 0.06) 0%, transparent 50%),
    linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
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
  background: var(--gold, #C9A962);
  border-radius: 50%;
  opacity: 0.25;
  animation: floatUp linear infinite;
}
@keyframes floatUp {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  10% { opacity: 0.25; }
  90% { opacity: 0.25; }
  100% { transform: translateY(-110vh) scale(0.3); opacity: 0; }
}

/* ========== 内容容器 ========== */
.content-wrapper {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
}

/* ========== 信封容器 ========== */
.envelope-wrap {
  perspective: 1400px;
  animation: envelopeIdle 4s ease-in-out infinite;
}
@keyframes envelopeIdle {
  0%, 100% { transform: translateY(0) rotateX(0deg); }
  50% { transform: translateY(-10px) rotateX(1deg); }
}

.envelope-wrap.opened {
  animation: envelopeFlyOut 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes envelopeFlyOut {
  0% { transform: translateY(0) scale(1) rotateX(0); opacity: 1; }
  30% { transform: translateY(-30px) scale(1.03) rotateX(-3deg); }
  100% { transform: translateY(-80vh) scale(0.7) rotateX(-10deg); opacity: 0; }
}

.envelope-wrap.bouncing:not(.opened) {
  animation: envelopeBounce 0.4s ease;
}
@keyframes envelopeBounce {
  0% { transform: scale(1); }
  25% { transform: scale(0.94); }
  50% { transform: scale(1.06); }
  75% { transform: scale(0.98); }
  100% { transform: scale(1); }
}

/* ========== 信封本体 ========== */
.envelope {
  width: 300px;
  height: 200px;
  position: relative;
  cursor: pointer;
  transform-style: preserve-3d;
}

/* 外层光晕 */
.envelope-aura {
  position: absolute;
  inset: -40px;
  background: radial-gradient(ellipse at center, rgba(201, 169, 98, 0.12) 0%, transparent 70%);
  border-radius: 50%;
  animation: auraPulse 3s ease-in-out infinite;
  pointer-events: none;
}
@keyframes auraPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.6; }
}

/* 信封主体 */
.envelope-body {
  position: absolute;
  inset: 0;
  background: linear-gradient(145deg, #FDFCFB 0%, #F8F6F2 100%);
  border-radius: 16px;
  box-shadow:
    0 25px 60px rgba(0, 0, 0, 0.15),
    0 8px 25px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  overflow: hidden;
}

.body-shadow {
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 3px,
      rgba(201, 169, 98, 0.02) 3px,
      rgba(201, 169, 98, 0.02) 6px
    );
  pointer-events: none;
}

.body-corner {
  position: absolute;
  width: 40px;
  height: 40px;
  opacity: 0.15;
}
.body-corner.left {
  top: 0;
  left: 0;
  background: linear-gradient(135deg, var(--gold) 0%, transparent 60%);
}
.body-corner.right {
  top: 0;
  right: 0;
  background: linear-gradient(225deg, var(--gold) 0%, transparent 60%);
}

/* 内层卡片 */
.envelope-inner-card {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  height: 168px;
  background: linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateY(0);
  transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.15s, box-shadow 0.5s ease;
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.06),
    0 1px 3px rgba(0, 0, 0, 0.04);
  z-index: 2;
}

.card-content {
  text-align: center;
  position: relative;
}

.card-emblem {
  width: 52px;
  height: 52px;
  margin: 0 auto 14px;
  color: var(--gold);
  opacity: 0.7;
  animation: emblemFloat 3s ease-in-out infinite;
}
@keyframes emblemFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.card-content h2 {
  font-family: 'Playfair Display', 'Georgia', serif;
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-primary, #1C1C1E);
  letter-spacing: 1px;
}

.card-content p {
  font-size: 12px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--gold);
  opacity: 0.8;
  font-weight: 500;
}

.card-line {
  width: 40px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
  margin: 16px auto 0;
  opacity: 0.4;
}

/* ========== 信封盖 ========== */
.envelope-flap {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100px;
  transform-origin: top center;
  transform-style: preserve-3d;
  transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 5;
}

.flap-surface {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #E8E4DE 0%, #F5F2ED 100%);
  clip-path: polygon(0 0, 50% 100%, 100% 0);
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.flap-fold-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  background: linear-gradient(180deg, rgba(0,0,0,0.03) 0%, transparent 100%);
  clip-path: polygon(0 0, 50% 100%, 100% 0);
  pointer-events: none;
}

/* ========== 火漆印章 ========== */
.wax-seal {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 56px;
  height: 56px;
  z-index: 10;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.seal-svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 4px 8px rgba(92, 27, 44, 0.3));
}

.seal-ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 70px;
  height: 70px;
  border: 1.5px solid var(--gold);
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  pointer-events: none;
}

.envelope:hover .seal-ripple {
  animation: sealRipple 1.5s ease-out infinite;
}
@keyframes sealRipple {
  0% { transform: translate(-50%, -50%) scale(0.7); opacity: 0.6; }
  100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
}

/* ========== 金色光芒 ========== */
.golden-light {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: radial-gradient(ellipse at center, rgba(229, 212, 161, 0.6) 0%, transparent 70%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  z-index: 3;
  pointer-events: none;
  transition: all 0.8s ease;
}

/* ========== 开启状态 ========== */
.opened .envelope-flap {
  transform: rotateX(-170deg);
}

.opened .envelope-inner-card {
  transform: translateY(-100px) rotate(-3deg);
  box-shadow:
    0 25px 60px rgba(0, 0, 0, 0.15),
    0 10px 30px rgba(201, 169, 98, 0.1);
}

.opened .wax-seal {
  opacity: 0;
  transform: translateX(-50%) scale(0) rotate(180deg);
}

.opened .golden-light {
  width: 400px;
  height: 400px;
  opacity: 0.8;
  animation: goldenGlow 1.5s ease-out forwards;
}
@keyframes goldenGlow {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0); }
  30% { opacity: 1; }
  100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.5); }
}

.opened .envelope-aura {
  animation: auraExplode 0.6s ease forwards;
}
@keyframes auraExplode {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(3); opacity: 0; }
}

/* ========== 提示文字 ========== */
.hint-text {
  display: flex;
  align-items: center;
  gap: 16px;
  opacity: 1;
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.hint-text.hidden {
  opacity: 0;
  transform: translateY(20px);
}

.hint-line {
  width: 30px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
  opacity: 0.5;
}

.hint-label {
  font-family: 'Playfair Display', serif;
  font-size: 13px;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: var(--gold);
  opacity: 0.7;
}

/* ========== 金色粒子 ========== */
.golden-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}
.golden-particle {
  position: absolute;
  top: 40%;
  border-radius: 50%;
  animation: goldenFall ease-out forwards;
}
@keyframes goldenFall {
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(60vh) scale(0);
    opacity: 0;
  }
}

/* ========== 响应式 ========== */
@media (max-width: 360px) {
  .envelope {
    width: 260px;
    height: 170px;
  }
  .envelope-inner-card {
    height: 140px;
  }
}
</style>
