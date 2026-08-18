<template>
  <div class="all-view">
    <ShelfGrid v-for="cat in store.categories" :key="cat.id"
      :title="`${cat.icon} ${cat.name}`"
      :tools="cat.tools" />
  </div>
</template>

<script setup>
import { useAppStore } from '../stores/app'
import ShelfGrid from '../components/ShelfGrid.vue'

const store = useAppStore()
</script>

<style scoped>
.all-view { padding-bottom: 8px; }
</style>
