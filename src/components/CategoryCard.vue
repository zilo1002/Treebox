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
  border-color: var(--accent);
}
.cat-icon { font-size: 1.75rem; margin-bottom: 8px; }
.cat-name { font-size: 0.875rem; font-weight: 500; color: var(--text-primary); }
.cat-count { font-size: 0.75rem; color: var(--text-tertiary); margin-top: 2px; }
:global(.grid-list) .cat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  border-top-width: 1px;
}
:global(.grid-list) .cat-icon { margin-bottom: 0; }
:global(.grid-list) .cat-count { margin-left: auto; margin-top: 0; }
:global(.grid-3x3) .cat-card { padding: 10px 6px; text-align: center; }
:global(.grid-3x3) .cat-icon { font-size: 1.375rem; margin-bottom: 4px; }
:global(.grid-3x3) .cat-name { font-size: 0.75rem; }
:global(.grid-3x3) .cat-count { display: none; }
</style>
