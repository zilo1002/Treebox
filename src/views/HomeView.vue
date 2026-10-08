<!-- HomeView.vue -->
<template>
  <div class="home-view">
    <div class="cat-grid" :class="`grid-${store.navGrid}`">
      <CategoryCard v-for="cat in store.categories" :key="cat.id" :cat="cat" />
    </div>
  </div>
</template>

<script setup>
import { useAppStore } from '../stores/app'
import CategoryCard from '../components/CategoryCard.vue'

const store = useAppStore()

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