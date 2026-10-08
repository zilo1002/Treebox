<template>
  <div class="cat-card" :class="layoutClass" @click="$router.push(`/cat/${cat.id}`)" :style="cardStyle">
    <div class="cat-icon">{{ cat.icon }}</div>
    <div class="cat-name">{{ cat.name }}</div>
    <div class="cat-count">{{ cat.tools.length }} 个工具</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({ cat: Object, layout: { type: String, default: 'nav2' } })
const layoutClass = computed(() => 'cat-card--' + props.layout)
const cardStyle = computed(() => props.layout === 'list' ? {} : { borderTopColor: props.cat.color || 'var(--accent)' })
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

/* 列表：一整行，没有顶条也没有左边黑边 */
.cat-card--list {
  display: flex;
  align-items: center;
  gap: 12px;
  border-top-width: 1px;
  box-shadow: 0 1px 4px var(--shadow);
}
.cat-card--list .cat-icon { margin-bottom: 0; }
.cat-card--list .cat-count { margin-left: auto; margin-top: 0; }

/* 导航 3×3：小图标砖 */
.cat-card--nav3 { padding: 10px 6px; text-align: center; }
.cat-card--nav3 .cat-icon { font-size: 1.375rem; margin-bottom: 4px; }
.cat-card--nav3 .cat-name { font-size: 0.75rem; }
.cat-card--nav3 .cat-count { display: none; }
</style>
