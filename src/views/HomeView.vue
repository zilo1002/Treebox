<!-- HomeView.vue -->
<template>
  <div class="home-view">
    <div class="cat-grid" :class="`grid-${store.grid.replace('x', '')}`">
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
/* 书架布局同样管首页分类架：3x3 / 4x4 / 列表 */
.cat-grid.grid-3 { grid-template-columns: repeat(3, 1fr); }
.cat-grid.grid-4 { grid-template-columns: repeat(4, 1fr); }
.cat-grid.grid-list { grid-template-columns: 1fr; }

</style>