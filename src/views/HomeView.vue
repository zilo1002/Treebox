<!-- HomeView.vue -->
<template>
  <div class="home-view">
    <div class="cat-grid">
      <CategoryCard v-for="cat in store.categories" :key="cat.id" :cat="cat" />
      <div class="cat-card create" @click="showCreate">
        <div class="cat-icon">+</div>
        <div class="cat-name">{{ $t('home.createCategory') }}</div>
        <div class="cat-count">{{ $t('home.createHint') }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAppStore } from '../stores/app'
import CategoryCard from '../components/CategoryCard.vue'

const store = useAppStore()

function showCreate() {
  document.getElementById('cat-modal')?.dispatchEvent(new Event('show'))
}
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

.cat-card.create {
  padding: 16px;
  border-radius: var(--radius);
  background: var(--bg-raised);
  border: 1px dashed var(--border);
  cursor: pointer;
  transition: all 0.15s;
  opacity: 0.7;
}
.cat-card.create:hover { opacity: 1; background: var(--bg-muted); }
.cat-card.create .cat-icon { font-size: 24px; margin-bottom: 8px; color: var(--text-tertiary); }
.cat-card.create .cat-name { font-size: 14px; font-weight: 500; color: var(--text-secondary); }
.cat-card.create .cat-count { font-size: 12px; color: var(--text-tertiary); margin-top: 2px; }
</style>