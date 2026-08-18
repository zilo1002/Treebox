<template>
  <EnvelopeScreen v-if="!store.opened" @open="onOpen" />
  <div v-else class="app-shell">
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
import { ref, provide } from 'vue'
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

const showSearch = ref(false)
provide('showSearch', showSearch)

function onOpen() {
  store.opened = true
  store.persist()
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
</style>