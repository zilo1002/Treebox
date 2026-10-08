<template>
  <div class="shelf-section">
    <div class="shelf-header">
      <span class="shelf-title">{{ title }}</span>
      <span class="shelf-actions">
        <button v-if="showDelete" class="add-btn delete-toggle" :class="{ active: deleteMode }" @click="emit('toggle-delete')">{{ deleteMode ? '完成' : '删除' }}</button>
        <button v-if="showAdd" class="add-btn" @click="emit('add')">+ 添加</button>
      </span>
    </div>
    <p v-if="deleteMode" class="delete-hint">点一个工具，就把它从这个分类里移除</p>
    <div class="tool-grid" :class="gridClass">
      <ToolCard v-for="tool in tools" :key="tool.id" :tool="tool" :delete-mode="deleteMode" @remove="emit('remove-tool', $event)" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '../stores/app'
import ToolCard from './ToolCard.vue'

const props = defineProps({
  title: String,
  tools: Array,
  showAdd: { type: Boolean, default: false },
  showDelete: { type: Boolean, default: false },
  deleteMode: { type: Boolean, default: false }
})
const emit = defineEmits(['add', 'toggle-delete', 'remove-tool'])

const store = useAppStore()
const gridClass = computed(() => {
  if (store.grid === 'list') return 'grid-list'
  return `grid-${store.grid.replace('x', '')}`
})
</script>

<style scoped>
.shelf-section { margin-bottom: 24px; }
.shelf-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.shelf-title { font-size: 15px; font-weight: 500; color: var(--text-primary); }
.add-btn {
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}
 .add-btn:hover { background: var(--bg-muted); }
.shelf-actions { display: flex; gap: 6px; }
.delete-toggle.active { background: #C1664A; border-color: #C1664A; color: #fff; }
.delete-hint { font-size: 11px; color: #C1664A; margin: -4px 0 8px; }

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
