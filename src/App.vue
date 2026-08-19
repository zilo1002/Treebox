<!-- App.vue -->
<template>
  <EnvelopeScreen v-if="!store.opened" @open="onOpen" />
  <div v-else class="app-shell">
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
    <main class="app-content">
      <RouterView />
    </main>
    <BottomNav />
  </div>
  <SettingsModal />
  <CreateCategoryModal />
  <AddToolModal />
</template>

<script setup>
import { ref, provide, onMounted } from 'vue'
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
useTheme()

// 每次刷新都重置信封，让它重新出现
onMounted(() => {
  store.opened = false
})

const showSearch = ref(false)
provide('showSearch', showSearch)

function onOpen() {
  store.opened = true
}

function openSettings() {
  document.getElementById('settings-modal')?.dispatchEvent(new Event('show'))
}
</script>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  position: relative;
}
.app-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;
  padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px));
  position: relative;
  z-index: 1;
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