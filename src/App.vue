<template>
  <Transition name="fade-env">
    <EnvelopeScreen v-if="!store.opened" @open="onOpen" />
  </Transition>
  <div v-if="store.opened" class="app-shell">
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
  // 不再持久化 opened，这样刷新就会重新出现
}
</script>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}
.app-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;
  padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px));
}

/* 信封淡出过渡 */
.fade-env-enter-active,
.fade-env-leave-active {
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.fade-env-enter-from {
  opacity: 0;
  transform: scale(0.96);
}
.fade-env-leave-to {
  opacity: 0;
  transform: scale(1.04);
}
</style>