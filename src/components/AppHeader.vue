<!-- AppHeader.vue -->
<template>
  <header class="app-header">
    <button v-if="showBack" class="icon-btn" @click="goBack">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
    </button>
    <div v-else class="icon-btn" style="visibility:hidden"></div>
    <h1>{{ title }}</h1>
    <div class="header-actions">
      <button class="icon-btn" @click="toggleSearch" :title="$t('search')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M11.5 3a8.5 8.5 0 105.32 15.18l4.42 4.42a1 1 0 001.42-1.42l-4.42-4.42A8.5 8.5 0 0011.5 3zm0 2a6.5 6.5 0 110 13 6.5 6.5 0 010-13z" fill="currentColor"/></svg>
      </button>
      <button class="icon-btn" @click="showSettings" :title="$t('settings')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z" fill="currentColor"/><path fill-rule="evenodd" clip-rule="evenodd" d="M1.5 12a1.5 1.5 0 011.5-1.5h.65a.75.75 0 00.67-.42l.27-.54a.75.75 0 00-.1-.88L4.1 7.55a1.5 1.5 0 112.12-2.12l.11.11a.75.75 0 00.88.1l.54-.27a.75.75 0 00.42-.67V4.5a1.5 1.5 0 113 0v.65a.75.75 0 00.42.67l.54.27a.75.75 0 00.88-.1l.11-.11a1.5 1.5 0 112.12 2.12l-.11.11a.75.75 0 00-.1.88l.27.54a.75.75 0 00.67.42h.65a1.5 1.5 0 010 3h-.65a.75.75 0 00-.67.42l-.27.54a.75.75 0 00.1.88l.11.11a1.5 1.5 0 11-2.12 2.12l-.11-.11a.75.75 0 00-.88-.1l-.54.27a.75.75 0 00-.42.67v.65a1.5 1.5 0 01-3 0v-.65a.75.75 0 00-.42-.67l-.54-.27a.75.75 0 00-.88.1l-.11.11a1.5 1.5 0 11-2.12-2.12l.11-.11a.75.75 0 00.1-.88l-.27-.54a.75.75 0 00-.67-.42H3A1.5 1.5 0 011.5 12z" fill="currentColor"/></svg>
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const router = useRouter()
const store = useAppStore()
const showSearch = inject('showSearch')
const { t } = useI18n()

const showBack = computed(() => route.name === 'category' || route.name === 'tool')

const title = computed(() => {
  if (route.name === 'home') return t('home.title')
  if (route.name === 'all') return t('all.title')
  if (route.name === 'fav') return t('fav.title')
  if (route.name === 'category') {
    const cat = store.findCategory(route.params.id)
    return cat?.name || t('category.title')
  }
  if (route.name === 'tool') {
    const tool = store.findTool(route.params.id)
    return tool?.name || t('tool.title')
  }
  return t('home.title')
})

function goBack() { router.back() }
function toggleSearch() { showSearch.value = !showSearch.value }
function showSettings() { document.getElementById('settings-modal')?.dispatchEvent(new Event('show')) }
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  background: var(--bg);
  position: sticky;
  top: 0;
  z-index: 10;
  flex-shrink: 0;
}
.app-header h1 {
  font-size: 17px;
  font-weight: 500;
  flex: 1;
  text-align: center;
}
.header-actions { display: flex; gap: 4px; }
.icon-btn {
  width: 36px; height: 36px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.icon-btn:hover { background: var(--bg-muted); }
</style>