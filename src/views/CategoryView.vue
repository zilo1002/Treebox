<template>
  <div class="category-view">
    <ShelfGrid v-if="category"
      :title="`${category.icon} ${category.name}`"
      :tools="category.tools"
      show-add
      show-delete
      :delete-mode="deleteMode"
      @add="onAdd"
      @toggle-delete="deleteMode = !deleteMode"
      @remove-tool="onRemoveTool" />
    <button v-if="category && deleteMode" class="delete-cat-btn" @click="onDeleteCategory">删除此分类</button>
    <div v-else class="empty-state">
      <p>分类不存在</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import ShelfGrid from '../components/ShelfGrid.vue'

const route = useRoute()
const router = useRouter()
const store = useAppStore()
const deleteMode = ref(false)

const category = computed(() => store.findCategory(route.params.id))

function onAdd() {
  document.getElementById('tool-modal')?.dispatchEvent(new CustomEvent('show', { detail: route.params.id }))
}

function onRemoveTool(tool) {
  if (!confirm(`从这个分类里移除「${tool.name}」？`)) return
  store.removeTool(route.params.id, tool.id)
  if (!category.value || !category.value.tools.length) deleteMode.value = false
}

function onDeleteCategory() {
  const cat = category.value
  if (!cat) return
  if (!confirm(`确定删除分类「${cat.name}」？里面 ${cat.tools.length} 个工具也会一起从列表移除。`)) return
  store.removeCategory(cat.id)
  router.replace('/')
}
</script>

<style scoped>
.category-view { padding-bottom: 8px; }
.empty-state { text-align: center; padding: 40px; color: var(--text-tertiary); }
.delete-cat-btn {
  width: 100%; padding: 10px; margin-top: 4px;
  border-radius: 10px; border: 1px solid rgba(193, 102, 74, 0.4);
  background: rgba(193, 102, 74, 0.08); color: #C1664A;
  font-size: 13px; cursor: pointer;
}
</style>
