<template>
  <div class="tool-view">
    <div v-if="tool" class="tool-page">
      <div class="tool-header">
        <div class="tool-meta">
          <span class="tool-cat">{{ tool.categoryName }}</span>
          <span class="tool-divider">·</span>
          <span class="tool-desc">{{ tool.desc }}</span>
        </div>
        <button class="fav-btn" :class="{ active: store.isFav(tool.id) }" @click="store.toggleFav(tool.id)">
          <svg width="22" height="22" viewBox="0 0 24 24" :fill="store.isFav(tool.id) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.5">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </button>
      </div>
      <Suspense>
        <template #default>
          <component :is="toolComponent" :tool="tool" />
        </template>
        <template #fallback>
          <div class="loading">加载中...</div>
        </template>
      </Suspense>
    </div>
    <div v-else class="empty-state">
      <p>工具不存在</p>
    </div>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '../stores/app'
import { toolTypeMap } from '../data/tools'

const route = useRoute()
const store = useAppStore()

const tool = computed(() => store.findTool(route.params.id))

const toolComponent = computed(() => {
  if (!tool.value) return null
  const loader = toolTypeMap[tool.value.type]
  return loader ? defineAsyncComponent(loader) : null
})
</script>

<style scoped>
.tool-view { padding-bottom: 8px; }
.tool-page { max-width: 640px; margin: 0 auto; }
.tool-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.tool-meta { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-tertiary); }
.tool-cat { color: var(--accent); font-weight: 500; }
.fav-btn {
  width: 40px; height: 40px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-raised);
  color: var(--text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.fav-btn:hover { background: var(--bg-muted); }
.fav-btn.active { color: var(--accent); border-color: var(--accent); }
.loading { text-align: center; padding: 40px; color: var(--text-tertiary); }
.empty-state { text-align: center; padding: 40px; color: var(--text-tertiary); }
</style>