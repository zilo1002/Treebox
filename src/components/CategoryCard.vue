<template>
  <div class="cat-card" @click="$router.push(`/cat/${cat.id}`)" :style="{ borderTopColor: cat.color || 'var(--accent)' }">
    <div class="cat-icon">{{ cat.icon }}</div>
    <div class="cat-name">{{ cat.name }}</div>
    <div class="cat-count">{{ cat.tools.length }} 个工具</div>
  </div>
</template>

<script setup>
defineProps({ cat: Object })
</script>

<style scoped>
.cat-card {
  padding: 16px;
  border-radius: var(--radius);
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-top-width: 3px;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}
.cat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px var(--shadow);
}
.cat-icon { font-size: 28px; margin-bottom: 8px; }
.cat-name { font-size: 14px; font-weight: 500; color: var(--text-primary); }
.cat-count { font-size: 12px; color: var(--text-tertiary); margin-top: 2px; }
</style>
