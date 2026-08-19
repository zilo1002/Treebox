<!-- EnvelopeScreen.vue -->
<template>
  <div class="envelope-screen">
    <div class="particles">
      <span v-for="n in 12" :key="n" class="particle" :style="particleStyle(n)"></span>
    </div>

    <div class="envelope-wrap" :class="{ opened, bouncing }">
      <div class="envelope" @click="open">
        <div class="envelope-glow"></div>
        <div class="envelope-body">
          <div class="body-shine"></div>
        </div>
        <div class="envelope-flap">
          <div class="flap-inner"></div>
        </div>
        <div class="envelope-card">
          <div class="card-inner">
            <div class="card-icon">📦</div>
            <h2>{{ $t('envelope.title') }}</h2>
            <p>{{ $t('envelope.hint') }}</p>
            <div class="card-sparkle">✨</div>
          </div>
        </div>
        <div class="wax-seal">
          <div class="wax-inner">🔧</div>
        </div>
      </div>
    </div>

    <div v-if="opened" class="confetti">
      <span v-for="n in 20" :key="'c'+n" class="confetti-piece" :style="confettiStyle(n)"></span>
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
    setTimeout(() => emit('open'), 900)
  }, 300)
}

function particleStyle(n) {
  const size = 4 + Math.random() * 6
  const left = Math.random() * 100
  const delay = Math.random() * 5
  const duration = 8 + Math.random() * 6
  return {
    width: size + 'px',
    height: size + 'px',
    left: left + '%',
    animationDelay: delay + 's',
    animationDuration: duration + 's',
  }
}

function confettiStyle(n) {
  const colors = ['#e74c3c', '#f39c12', '#2ecc71', '#3498db', '#9b59b6', '#e91e63']
  const color = colors[n % colors.length]
  const left = Math.random() * 100
  const delay = Math.random() * 0.5
  const duration = 1.5 + Math.random()
  const rotate = Math.random() * 360
  return {
    background: color,
    left: left + '%',
    animationDelay: delay + 's',
    animationDuration: duration + 's',
    transform: `rotate(${rotate}deg)`,
  }
}
</script>

<style scoped>
.envelope-screen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-muted, #f5f5f7);
  overflow: hidden;
}
.particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.particle {
  position: absolute;
  bottom: -10px;
  background: var(--border, #ddd);
  border-radius: 50%;
  opacity: 0.4;
  animation: floatUp linear infinite;
}
@keyframes floatUp {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  10% { opacity: 0.4; }
  90% { opacity: 0.4; }
  100% { transform: translateY(-110vh) scale(0.5); opacity: 0; }
}
.envelope-wrap {
  perspective: 1000px;
  animation: envelopeIdle 3s ease-in-out infinite;
}
@keyframes envelopeIdle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
.envelope-wrap.opened {
  animation: envelopeFlyOut 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes envelopeFlyOut {
  0% { transform: translateY(0) scale(1); opacity: 1; }
  40% { transform: translateY(-20px) scale(1.02); }
  100% { transform: translateY(-60vh) scale(0.8); opacity: 0; }
}
.envelope-wrap.bouncing:not(.opened) {
  animation: envelopeBounce 0.3s ease;
}
@keyframes envelopeBounce {
  0% { transform: scale(1); }
  30% { transform: scale(0.92); }
  50% { transform: scale(1.06); }
  70% { transform: scale(0.97); }
  100% { transform: scale(1); }
}
.envelope {
  width: 260px;
  height: 165px;
  position: relative;
  cursor: pointer;
  transform-style: preserve-3d;
}
.envelope-glow {
  position: absolute;
  inset: -30px;
  background: radial-gradient(circle, rgba(231,76,60,0.08) 0%, transparent 70%);
  border-radius: 50%;
  animation: glowPulse 2.5s ease-in-out infinite;
  pointer-events: none;
}
@keyframes glowPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.15); opacity: 0.6; }
}
.envelope-body {
  position: absolute;
  inset: 0;
  background: var(--bg-strong, #fff);
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06);
  overflow: hidden;
}
.body-shine {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 40%,
    rgba(255,255,255,0.4) 50%,
    transparent 60%
  );
  animation: shineSweep 4s ease-in-out infinite;
  pointer-events: none;
}
@keyframes shineSweep {
  0% { transform: translateX(-100%) rotate(0deg); }
  100% { transform: translateX(100%) rotate(0deg); }
}
.envelope-flap {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 82px;
  transform-origin: top center;
  transition: transform 0.55s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 3;
}
.flap-inner {
  position: absolute;
  inset: 0;
  background: var(--border, #e0e0e0);
  clip-path: polygon(0 0, 50% 100%, 100% 0);
  border-radius: 12px 12px 0 0;
  animation: flapBreathe 2.5s ease-in-out infinite;
}
@keyframes flapBreathe {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(1.03); }
}
.envelope-card {
  position: absolute;
  top: 12px; left: 12px; right: 12px;
  height: 140px;
  background: var(--bg, #fff);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateY(0);
  transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s, box-shadow 0.5s ease;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  z-index: 2;
}
.card-inner {
  text-align: center;
  position: relative;
}
.card-icon {
  font-size: 40px;
  margin-bottom: 10px;
  animation: iconWiggle 2s ease-in-out infinite;
  display: inline-block;
}
@keyframes iconWiggle {
  0%, 100% { transform: rotate(-3deg); }
  50% { transform: rotate(3deg); }
}
.card-inner h2 {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--text, #333);
}
.card-inner p {
  font-size: 13px;
  color: var(--text-tertiary, #999);
  animation: textPulse 2s ease-in-out infinite;
}
@keyframes textPulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}
.card-sparkle {
  position: absolute;
  top: -10px;
  right: -20px;
  font-size: 18px;
  animation: sparkleTwinkle 1.5s ease-in-out infinite;
}
@keyframes sparkleTwinkle {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}
.wax-seal {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 32px;
  height: 32px;
  background: #e74c3c;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(231,76,60,0.3);
  z-index: 4;
  animation: waxPulse 2s ease-in-out infinite;
}
@keyframes waxPulse {
  0%, 100% { box-shadow: 0 2px 8px rgba(231,76,60,0.3); }
  50% { box-shadow: 0 4px 16px rgba(231,76,60,0.5); }
}
.wax-inner { font-size: 14px; }
.opened .envelope-flap { transform: rotateX(180deg); }
.opened .envelope-card {
  transform: translateY(-90px) rotate(-2deg);
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
}
.opened .wax-seal {
  opacity: 0;
  transform: translateX(-50%) scale(0);
  transition: all 0.3s ease;
}
.opened .envelope-glow {
  animation: glowExplode 0.6s ease forwards;
}
@keyframes glowExplode {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(2); opacity: 0; }
}
.confetti {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.confetti-piece {
  position: absolute;
  top: -10px;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  animation: confettiFall ease-out forwards;
}
@keyframes confettiFall {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
</style>