<!-- BottomNav.vue -->
<template>
  <nav class="bottom-nav safe-bottom">
    <RouterLink v-for="item in tabs" :key="item.name" :to="item.to" class="nav-item" :class="{ active: isActive(item.to) }">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" v-html="item.icon"></svg>
      <span>{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const { t } = useI18n()

const tabs = computed(() => [
  { to: '/', label: t('nav.home'), icon: '<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor"/>' },
  { to: '/all', label: t('nav.all'), icon: '<path d="M4 6h16M4 12h10M4 18h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' },
  { to: '/fav', label: t('nav.fav'), icon: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>' },
])

function isActive(path) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<style scoped>
.bottom-nav {
  display: flex;
  justify-content: space-around;
  padding: 6px 0 8px;
  border-top: 1px solid var(--border);
  background: var(--bg);
  position: sticky;
  bottom: 0;
  flex-shrink: 0;
  z-index: 10;
}
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px 16px;
  text-decoration: none;
  color: var(--text-tertiary);
  font-size: 11px;
  transition: color 0.15s;
}
.nav-item.active { color: var(--accent); }
.nav-item svg { transition: transform 0.15s; }
.nav-item:hover svg { transform: scale(1.1); }
</style>