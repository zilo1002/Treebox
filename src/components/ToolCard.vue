<template>
  <div class="tool-card" :class="layoutClass" @click="$router.push(`/tool/${tool.id}`)">
    <div class="t-icon">{{ tool.icon }}</div>
    <div class="t-info">
      <div class="t-name">{{ tool.name }}</div>
      <div class="t-desc">{{ tool.desc }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({ tool: Object, list: Boolean, layout: { type: String, default: 'grid3' } })
const layoutClass = computed(() => 'tool-card--' + props.layout)
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
  border-color: var(--accent);
}
.t-icon { font-size: 1.5rem; margin-bottom: 6px; }
.t-name { font-size: 0.75rem; font-weight: 500; color: var(--text-primary); line-height: 1.3; }
.t-desc { font-size: 0.6875rem; color: var(--text-tertiary); margin-top: 2px; }

/* 列表：一整行，图标在左，名字和说明在右，没有左边色条 */
.tool-card--list {
  flex-direction: row;
  text-align: left;
  padding: 10px 14px;
  min-height: auto;
  gap: 12px;
  justify-content: flex-start;
  box-shadow: 0 1px 4px var(--shadow);
}
.tool-card--list .t-icon { margin-bottom: 0; font-size: 1.375rem; }
.tool-card--list .t-info { flex: 1; }

/* 3×3 小图标：一排三个，只留图标和名字 */
.tool-card--grid3 { min-height: 68px; padding: 8px 4px; }
.tool-card--grid3 .t-icon { font-size: 1.25rem; margin-bottom: 4px; }
.tool-card--grid3 .t-desc { display: none; }

/* 4×4 小图标：一排四个，比 3×3 再小一圈 */
.tool-card--grid4 { min-height: 58px; padding: 6px 2px; }
.tool-card--grid4 .t-icon { font-size: 1.125rem; margin-bottom: 3px; }
.tool-card--grid4 .t-name { font-size: 0.6875rem; }
.tool-card--grid4 .t-desc { display: none; }
</style>
