<!-- HomeView.vue -->
<template>
  <div class="home-view">
    <div class="cat-grid" :class="`grid-${store.navGrid}`">
      <CategoryCard v-for="cat in store.categories" :key="cat.id" :cat="cat" :layout="navLayoutMode" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '../stores/app'
import CategoryCard from '../components/CategoryCard.vue'

const store = useAppStore()
const navLayoutMode = computed(() => {
  if (store.navGrid === 'list') return 'list'
  if (store.navGrid === '3x3') return 'nav3'
  return 'nav2'
})

</script>

<style scoped>
.home-view { padding-bottom: 8px; }
.cat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
/* 导航分类布局：默认 2×n / 列表 / 3×3（跟次分类分开管） */
.cat-grid.grid-2xn { grid-template-columns: repeat(2, 1fr); }
@media (min-width: 640px) { .cat-grid.grid-2xn { grid-template-columns: repeat(3, 1fr); } }
@media (min-width: 900px) { .cat-grid.grid-2xn { grid-template-columns: repeat(4, 1fr); } }
.cat-grid.grid-3x3 { grid-template-columns: repeat(3, 1fr); }
.cat-grid.grid-list { grid-template-columns: 1fr; }

</style>