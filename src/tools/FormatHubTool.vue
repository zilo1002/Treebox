<template>
  <div ref="root" class="formathub-root"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import '../formathub/formathub.css'

const props = defineProps({ tool: Object })
const root = ref(null)
let destroy = null
let mountSeq = 0

function resolveView() {
  if (props.tool?.view) return props.tool.view
  // 旧缓存里的 fh-* 工具可能没有 view 字段，按 id 兜底，保证每个分支独立
  const id = props.tool?.id || ''
  if (id.startsWith('fh-')) return id.slice(3)
  return 'home'
}

async function mount() {
  // 序号守卫：连续快速切换时，只有最后一次 mount 才能接管；
  // 早到的那次 import 回来后发现序号已变，直接丢弃，不会把旧实例的 destroy 盖掉。
  const seq = ++mountSeq
  if (destroy) {
    destroy()
    destroy = null
  }
  if (!root.value) return
  const { initFormatHub } = await import('../formathub/main.js')
  if (seq !== mountSeq || !root.value) return
  destroy = initFormatHub(root.value, resolveView())
}

onMounted(mount)
watch(() => [props.tool?.view, props.tool?.id], () => { if (root.value) mount() })
onBeforeUnmount(() => {
  mountSeq++
  if (destroy) {
    destroy()
    destroy = null
  }
})
</script>
