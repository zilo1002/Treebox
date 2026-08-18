<template>
  <div class="tool-card" @click="$router.push(`/tool/${tool.id}`)">
    <div class="t-icon">{{ tool.icon }}</div>
    <div class="t-info">
      <div class="t-name">{{ tool.name }}</div>
      <div class="t-desc">{{ tool.desc }}</div>
    </div>
  </div>
</template>

<script setup>
defineProps({ tool: Object, list: Boolean })
</script>

<style scoped>
.tool-card {
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px 8px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 90px;
}
.tool-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px var(--shadow);
}
.t-icon { font-size: 24px; margin-bottom: 6px; }
.t-name { font-size: 12px; font-weight: 500; color: var(--text-primary); line-height: 1.3; }
.t-desc { font-size: 11px; color: var(--text-tertiary); margin-top: 2px; }

:global(.grid-list) .tool-card {
  flex-direction: row;
  text-align: left;
  padding: 10px 14px;
  min-height: auto;
  gap: 12px;
  justify-content: flex-start;
}
:global(.grid-list) .t-icon { margin-bottom: 0; font-size: 22px; }
:global(.grid-list) .t-info { flex: 1; }
</style>