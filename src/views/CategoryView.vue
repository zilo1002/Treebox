<template>
  <div class="category-view">
    <ShelfGrid v-if="category"
      :title="`${category.icon} ${category.name}`"
      :tools="category.tools"
      show-add
      @add="onAdd" />
    <div v-else class="empty-state">
      <p>分类不存在</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '../stores/app'
import ShelfGrid from '../components/ShelfGrid.vue'

const route = useRoute()
const store = useAppStore()

const category = computed(() => store.findCategory(route.params.id))

function onAdd() {
  document.getElementById('tool-modal')?.dispatchEvent(new CustomEvent('show', { detail: route.params.id }))
}
</script>

<style scoped>
.category-view { padding-bottom: 8px; }
.empty-state { text-align: center; padding: 40px; color: var(--text-tertiary); }
</style>
