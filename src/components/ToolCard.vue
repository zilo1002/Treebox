<template>
  <div class="tool-card" :class="{ 'tool-card--delete': deleteMode }" @click="onClick">
    <span v-if="deleteMode" class="delete-badge">×</span>
    <div class="t-icon">{{ tool.icon }}</div>
    <div class="t-info">
      <div class="t-name">{{ tool.name }}</div>
      <div class="t-desc">{{ tool.desc }}</div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const props = defineProps({ tool: Object, list: Boolean, deleteMode: { type: Boolean, default: false } })
const emit = defineEmits(['remove'])
const router = useRouter()
function onClick() {
  if (props.deleteMode) { emit('remove', props.tool); return }
  router.push(`/tool/${props.tool.id}`)
}
</script>

<style scoped>
.tool-card { position: relative; }
.tool-card--delete { border-color: rgba(193, 102, 74, 0.45); }
.delete-badge {
  position: absolute; top: 6px; right: 6px;
  width: 20px; height: 20px; border-radius: 50%;
  background: #C1664A; color: #fff;
  font-size: 14px; line-height: 20px; text-align: center;
}
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