<template>
  <div ref="root" class="formathub-root"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import '../formathub/formathub.css'

const props = defineProps({ tool: Object })
const root = ref(null)
let destroy = null

function resolveView() {
  if (props.tool?.view) return props.tool.view
  // 旧缓存里的 fh-* 工具可能没有 view 字段，按 id 兜底，保证每个分支独立
  const id = props.tool?.id || ''
  if (id.startsWith('fh-')) return id.slice(3)
  return 'home'
}

async function mount() {
  if (destroy) {
    destroy()
    destroy = null
  }
  if (!root.value) return
  const { initFormatHub } = await import('../formathub/main.js')
  if (root.value) destroy = initFormatHub(root.value, resolveView())
}

onMounted(mount)
watch(() => [props.tool?.view, props.tool?.id], () => { if (root.value) mount() })
onBeforeUnmount(() => {
  if (destroy) {
    destroy()
    destroy = null
  }
})
</script>
