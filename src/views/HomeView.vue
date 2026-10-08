<!-- HomeView.vue -->
<template>
  <div class="home-view">
    <div class="cat-grid">
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
@media (min-width: 640px) { .cat-grid { grid-template-columns: repeat(3, 1fr); } }
@media (min-width: 900px) { .cat-grid { grid-template-columns: repeat(4, 1fr); } }

</style>