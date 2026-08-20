<!-- App.vue -->
<template>
  <EnvelopeScreen v-if="!store.opened" @open="onOpen" />
  <div v-else class="app-shell" ref="appShell" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
    <!-- 下拉刷新指示器 -->
    <div class="pull-refresh" :class="{ 'pull-refresh--active': pullState === 'pulling' || pullState === 'loading', 'pull-refresh--release': pullState === 'release' }" :style="{ transform: `translateY(${pullOffset}px)` }">
      <div class="pull-refresh__spinner">
        <svg v-if="pullState !== 'loading'" class="pull-refresh__arrow" :style="{ transform: `rotate(${pullOffset > 60 ? 180 : 0}deg)` }" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <polyline points="19 12 12 19 5 12"/>
        </svg>
        <svg v-else class="pull-refresh__loading" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
      </div>
      <span class="pull-refresh__text">
        {{ pullState === 'release' ? '释放立即刷新' : pullState === 'loading' ? '刷新中...' : '下拉刷新' }}
      </span>
    </div>

    <!-- 背景动画层 -->
    <div v-if="store.bgAnimation" class="bg-animation-layer">
      <img :src="store.bgAnimation" class="bg-animation-img" alt="" />
      <div class="bg-animation-overlay"></div>
    </div>

    <!-- 设置浮动按钮 -->
    <button class="settings-float-btn" @click="openSettings" :title="$t('settings')">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    </button>

    <AppHeader />
    <SearchBar v-if="showSearch" />
    <main class="app-content" :style="{ transform: `translateY(${pullOffset}px)` }">
      <RouterView />
    </main>
    <BottomNav />
  </div>
  <SettingsModal />
  <CreateCategoryModal />
  <AddToolModal />
</template>

<script setup>
import { ref, provide } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from './stores/app'
import { useTheme } from './composables/useTheme'
import EnvelopeScreen from './components/EnvelopeScreen.vue'
import AppHeader from './components/AppHeader.vue'
import BottomNav from './components/BottomNav.vue'
import SearchBar from './components/SearchBar.vue'
import SettingsModal from './components/SettingsModal.vue'
import CreateCategoryModal from './components/CreateCategoryModal.vue'
import AddToolModal from './components/AddToolModal.vue'

const store = useAppStore()
const router = useRouter()
useTheme()

const showSearch = ref(false)
provide('showSearch', showSearch)

function onOpen() {
  sessionStorage.setItem('toolbox_session_opened', '1')
  store.opened = true
  router.replace('/')
}

function openSettings() {
  document.getElementById('settings-modal')?.dispatchEvent(new Event('show'))
}

// === 下拉刷新逻辑 ===
const pullState = ref('idle') // idle | pulling | release | loading
const pullOffset = ref(0)
const touchStartY = ref(0)
const appShell = ref(null)

function onTouchStart(e) {
  if (pullState.value === 'loading') return
  // 只有在页面顶部才触发下拉刷新
  const scrollTop = appShell.value?.querySelector('.app-content')?.scrollTop || 0
  if (scrollTop > 0) return
  touchStartY.value = e.touches[0].clientY
  pullState.value = 'pulling'
}

function onTouchMove(e) {
  if (pullState.value === 'idle' || pullState.value === 'loading') return
  const scrollTop = appShell.value?.querySelector('.app-content')?.scrollTop || 0
  if (scrollTop > 0) {
    pullState.value = 'idle'
    pullOffset.value = 0
    return
  }
  const delta = e.touches[0].clientY - touchStartY.value
  if (delta > 0) {
    // 阻尼效果，越拉越难拉
    pullOffset.value = Math.min(delta * 0.5, 100)
    pullState.value = pullOffset.value >= 60 ? 'release' : 'pulling'
  }
}

function onTouchEnd() {
  if (pullState.value === 'release') {
    pullState.value = 'loading'
    pullOffset.value = 60
    // 触发刷新，保持当前路由
    setTimeout(() => {
      location.reload()
    }, 600)
  } else {
    pullState.value = 'idle'
    pullOffset.value = 0
  }
}
</script>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}
.app-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;
  padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px));
  position: relative;
  z-index: 1;
  transition: transform 0.15s ease;
}

/* 下拉刷新指示器 */
.pull-refresh {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 60px;
  padding-bottom: 8px;
  transform: translateY(-60px);
  transition: transform 0.15s ease;
  pointer-events: none;
  color: var(--text-secondary);
}
.pull-refresh--active {
  transition: none;
}
.pull-refresh__spinner {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}
.pull-refresh__arrow {
  transition: transform 0.2s ease;
}
.pull-refresh__loading {
  animation: pullSpin 0.8s linear infinite;
}
@keyframes pullSpin {
  to { transform: rotate(360deg); }
}
.pull-refresh__text {
  font-size: 12px;
  color: var(--text-tertiary);
}

/* 背景动画层 */
.bg-animation-layer {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}
.bg-animation-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  animation: bgZoom 20s ease-in-out infinite alternate;
}
@keyframes bgZoom {
  0% { transform: scale(1); }
  100% { transform: scale(1.08); }
}
.bg-animation-overlay {
  position: absolute;
  inset: 0;
  background: var(--bg);
  opacity: 0.75;
  backdrop-filter: blur(2px);
}

/* 设置浮动按钮 */
.settings-float-btn {
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 50;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: var(--bg-raised);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 12px var(--shadow);
  transition: transform 0.2s, background 0.2s;
}
.settings-float-btn:hover {
  transform: scale(1.08);
  background: var(--bg-strong);
}
.settings-float-btn:active {
  transform: scale(0.95);
}
</style>
