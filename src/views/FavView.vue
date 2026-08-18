<template>
  <div class="fav-view">
    <div v-if="store.favTools.length" class="tool-grid" :class="gridClass">
      <ToolCard v-for="tool in store.favTools" :key="tool.id" :tool="tool" />
    </div>
    <div v-else class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
      <p>暂无收藏</p>
      <p class="hint">在工具页面点击星标收藏</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '../stores/app'
import ToolCard from '../components/ToolCard.vue'

const store = useAppStore()
const gridClass = computed(() => {
  if (store.grid === 'list') return 'grid-list'
  return `grid-${store.grid.replace('x', '')}`
})
</script>

<style scoped>
.fav-view { padding-bottom: 8px; }
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-tertiary);
}
.empty-state svg { margin-bottom: 12px; opacity: 0.4; }
.empty-state p { font-size: 15px; }
.empty-state .hint { font-size: 12px; margin-top: 6px; }

.tool-grid {
  display: grid;
  gap: 10px;
}
.tool-grid.grid-3 { grid-template-columns: repeat(3, 1fr); }
.tool-grid.grid-4 { grid-template-columns: repeat(4, 1fr); }
.tool-grid.grid-list { grid-template-columns: 1fr; }
@media (min-width: 640px) {
  .tool-grid.grid-3 { grid-template-columns: repeat(4, 1fr); }
  .tool-grid.grid-4 { grid-template-columns: repeat(5, 1fr); }
}
@media (min-width: 900px) {
  .tool-grid.grid-3 { grid-template-columns: repeat(5, 1fr); }
  .tool-grid.grid-4 { grid-template-columns: repeat(6, 1fr); }
}
</style>
